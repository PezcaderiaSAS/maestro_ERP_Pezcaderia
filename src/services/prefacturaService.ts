// src/services/prefacturaService.ts
// Servicio de Dominio para el Ciclo de Vida de Preventa Multivendedor, Caja Única y Despacho Verificado (SPEC-037)

import type {
  Prefactura,
  EstadoPrefactura,
  EmitirPrefacturaInput,
  CobrarPrefacturaInput,
  DespachoVerificacionInput,
} from '../types/prefactura.types';
import {
  validarEmitirPrefactura,
  validarCobroCaja,
  validarDespacho,
  LIMITE_DESCUENTO_DEFAULT_PCT,
} from '../schemas/prefactura.schema';

export interface ResultadoEmisionPrefactura {
  ok: boolean;
  prefactura?: Prefactura;
  ticketQrPayload?: string;
  error?: string;
}

export interface ResultadoTransicionPrefactura {
  ok: boolean;
  prefactura?: Prefactura;
  error?: string;
}

export class PrefacturaService {
  private isMockMode: boolean;

  // Almacén en memoria indexado por: `${tenantId}:${prefacturaId}` y por código de preventa
  private prefacturas = new Map<string, Prefactura>();
  private codigoToKey = new Map<string, string>(); // `${tenantId}:${codigoPreventa}` -> key
  private consecutivoCount = 1000;

  constructor(config?: { isMockMode?: boolean }) {
    this.isMockMode = config?.isMockMode ?? (import.meta.env.MODE === 'test');
  }

  /**
   * Limpia el estado interno en memoria para pruebas unitarias TDD
   */
  public limpiarEstadoPruebas(): void {
    this.prefacturas.clear();
    this.codigoToKey.clear();
    this.consecutivoCount = 1000;
  }

  /**
   * Emite una preventa de mostrador con reserva inmediata de inventario (Hard-Hold)
   * y genera la carga útil (payload) del código QR para el ticket térmico.
   */
  public async emitirPrefactura(
    input: EmitirPrefacturaInput,
    limiteDescuentoPct: number = LIMITE_DESCUENTO_DEFAULT_PCT
  ): Promise<ResultadoEmisionPrefactura> {
    // 1. Validar contrato Zod y cálculos de subtotales
    const validacion = validarEmitirPrefactura(input, limiteDescuentoPct);
    if (!validacion.success || !validacion.data) {
      return { ok: false, error: validacion.error || 'Datos de preventa inválidos' };
    }

    const data = validacion.data;
    const prefacturaId = `pref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.consecutivoCount += 1;
    const year = new Date().getFullYear();
    const codigoPreventa = `PRE-${year}-${String(this.consecutivoCount).padStart(5, '0')}`;

    const nuevaPrefactura: Prefactura = {
      id: prefacturaId,
      tenantId: data.tenantId,
      codigoPreventa,
      vendedorId: data.vendedorId,
      vendedorNombre: data.vendedorNombre,
      terminalId: data.terminalId,
      clienteDocumento: data.clienteDocumento,
      clienteNombre: data.clienteNombre,
      subtotal: data.subtotal,
      descuentoTotal: data.descuentoTotal,
      total: data.total,
      estado: 'PENDIENTE_COBRO',
      hardHoldActivo: true, // Reserva de stock inmediata
      items: data.itemsValidados,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const storageKey = `${data.tenantId}:${prefacturaId}`;
    const lookupKey = `${data.tenantId}:${codigoPreventa}`;

    this.prefacturas.set(storageKey, nuevaPrefactura);
    this.codigoToKey.set(lookupKey, storageKey);

    // Payload de ticket para impresión térmica y lector QR
    const ticketQrPayload = JSON.stringify({
      t: data.tenantId,
      c: codigoPreventa,
      tot: data.total,
      v: data.vendedorId,
      f: nuevaPrefactura.createdAt,
    });

    return {
      ok: true,
      prefactura: nuevaPrefactura,
      ticketQrPayload,
    };
  }

  /**
   * Obtiene las preventas de un tenant con filtro opcional de estado (Kanban de Caja)
   */
  public obtenerPrefacturasPorTenant(
    tenantId: string,
    estado?: EstadoPrefactura
  ): Prefactura[] {
    const list: Prefactura[] = [];
    for (const [key, pref] of this.prefacturas.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        if (!estado || pref.estado === estado) {
          list.push(pref);
        }
      }
    }
    // Ordenar de más reciente a más antigua
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Busca una preventa por su código QR o ID dentro del tenant (Zero Cross-Tenant Leakage)
   */
  public buscarPorCodigo(tenantId: string, codigo: string): Prefactura | null {
    // 1. Probar lookup directo por código preventa
    const lookupKey = `${tenantId}:${codigo}`;
    const storageKey = this.codigoToKey.get(lookupKey);
    if (storageKey) {
      return this.prefacturas.get(storageKey) || null;
    }

    // 2. Probar por ID directo
    const directKey = `${tenantId}:${codigo}`;
    const directPref = this.prefacturas.get(directKey);
    if (directPref) {
      return directPref;
    }

    return null;
  }

  /**
   * Transiciona la preventa a estado 'EN_COBRO' cuando el cajero la toma en ventanilla
   */
  public marcarEnCobro(
    tenantId: string,
    prefacturaId: string,
    cajeroId: string,
    cajeroNombre?: string
  ): ResultadoTransicionPrefactura {
    const key = `${tenantId}:${prefacturaId}`;
    const pref = this.prefacturas.get(key);

    if (!pref) {
      return { ok: false, error: 'Preventa no encontrada en este tenant' };
    }

    if (pref.estado !== 'PENDIENTE_COBRO' && pref.estado !== 'EN_COBRO') {
      return {
        ok: false,
        error: `No se puede pasar a cobro una preventa en estado ${pref.estado}`,
      };
    }

    pref.estado = 'EN_COBRO';
    pref.cajeroId = cajeroId;
    if (cajeroNombre) pref.cajeroNombre = cajeroNombre;
    pref.updatedAt = new Date().toISOString();

    return { ok: true, prefactura: pref };
  }

  /**
   * Registra el cobro completo en caja central, pasando la orden a 'PAGADA'
   */
  public async registrarCobroEnCaja(
    input: CobrarPrefacturaInput
  ): Promise<ResultadoTransicionPrefactura> {
    const validacion = validarCobroCaja(input);
    if (!validacion.success || !validacion.data) {
      return { ok: false, error: validacion.error || 'Datos de cobro inválidos' };
    }

    const key = `${input.tenantId}:${input.prefacturaId}`;
    const pref = this.prefacturas.get(key);

    if (!pref) {
      return { ok: false, error: 'Preventa no encontrada en este tenant' };
    }

    if (pref.estado === 'PAGADA' || pref.estado === 'DESPACHADA') {
      return { ok: false, error: 'Esta preventa ya fue pagada con anterioridad' };
    }

    if (pref.estado === 'ANULADA') {
      return { ok: false, error: 'No se puede cobrar una preventa anulada' };
    }

    const facturaId = `FAC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    pref.estado = 'PAGADA';
    pref.facturaId = facturaId;
    pref.cajeroId = input.cajeroId;
    pref.pagadoAt = new Date().toISOString();
    pref.updatedAt = new Date().toISOString();
    pref.hardHoldActivo = true; // Se mantiene reservado hasta la entrega física

    return { ok: true, prefactura: pref };
  }

  /**
   * Asesor comercial verifica el pago y confirma la entrega física de la mercancía
   */
  public async registrarDespacho(
    input: DespachoVerificacionInput
  ): Promise<ResultadoTransicionPrefactura> {
    const validacion = validarDespacho(input);
    if (!validacion.success || !validacion.data) {
      return { ok: false, error: validacion.error || 'Datos de despacho inválidos' };
    }

    const key = `${input.tenantId}:${input.prefacturaId}`;
    const pref = this.prefacturas.get(key);

    if (!pref) {
      return { ok: false, error: 'Preventa no encontrada en este tenant' };
    }

    if (pref.estado !== 'PAGADA') {
      return {
        ok: false,
        error: `La preventa debe estar PAGADA antes de despachar. Estado actual: ${pref.estado}`,
      };
    }

    pref.estado = 'DESPACHADA';
    pref.despachadoAt = new Date().toISOString();
    pref.despachadoPorId = input.asesorId;
    pref.hardHoldActivo = false; // Se libera la reserva al concretar la entrega física
    pref.updatedAt = new Date().toISOString();

    return { ok: true, prefactura: pref };
  }

  /**
   * Supervisor cancela una preventa pendiente liberando el Hard-Hold de inventario
   */
  public async cancelarPrefactura(params: {
    tenantId: string;
    prefacturaId: string;
    supervisorId: string;
    motivo: string;
  }): Promise<ResultadoTransicionPrefactura> {
    const key = `${params.tenantId}:${params.prefacturaId}`;
    const pref = this.prefacturas.get(key);

    if (!pref) {
      return { ok: false, error: 'Preventa no encontrada' };
    }

    if (pref.estado === 'DESPACHADA') {
      return { ok: false, error: 'No se puede cancelar una preventa ya despachada' };
    }

    pref.estado = 'ANULADA';
    pref.hardHoldActivo = false; // Liberación de stock
    pref.updatedAt = new Date().toISOString();

    return { ok: true, prefactura: pref };
  }
}

export const prefacturaService = new PrefacturaService();
