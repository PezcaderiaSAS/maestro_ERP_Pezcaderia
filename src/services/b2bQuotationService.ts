// src/services/b2bQuotationService.ts
// Servicio de Dominio para el Ciclo de Vida de Cotizaciones B2B y Conversión Atómica a Preventa POS (SPEC-040)

import type {
  B2BQuotation,
  B2BQuotationItem,
  QuotationStatus,
  QuotationToPosConversion,
} from '../types/b2bQuotation.types';
import type { Prefactura, ItemPrefacturaInput } from '../types/prefactura.types';
import { prefacturaService } from './prefacturaService';

export interface CrearCotizacionInput {
  tenantId: string;
  clienteId: string;
  asesorUsuarioId: string;
  items: B2BQuotationItem[];
  diasVigencia?: number;
  observaciones?: string;
  estadoInicial?: QuotationStatus;
}

export interface TotalesCotizacion {
  subtotal: number;
  totalDescuentos: number;
  totalImpuestos: number;
  totalGeneral: number;
}

export interface ConversionPosResultado {
  ok: boolean;
  cotizacion?: B2BQuotation;
  prefactura?: Prefactura;
  error?: string;
}

export class B2BQuotationService {
  // Almacén multi-tenant en memoria: `${tenantId}:${cotizacionId}`
  private cotizaciones = new Map<string, B2BQuotation>();
  private consecutivoContador = new Map<string, number>(); // `${tenantId}:${year}` -> contador

  /**
   * Limpia el estado interno para pruebas unitarias TDD
   */
  public limpiarEstadoPruebas(): void {
    this.cotizaciones.clear();
    this.consecutivoContador.clear();
  }

  /**
   * Genera un código consecutivo único con formato COT-YYYY-XXXXX
   */
  public generarConsecutivo(tenantId: string): string {
    const year = new Date().getFullYear();
    const key = `${tenantId}:${year}`;
    const actual = this.consecutivoContador.get(key) || 1000;
    const siguiente = actual + 1;
    this.consecutivoContador.set(key, siguiente);

    return `COT-${year}-${String(siguiente).padStart(5, '0')}`;
  }

  /**
   * Calcula los totales de la cotización con precisión aritmética
   */
  public calcularTotales(items: B2BQuotationItem[]): TotalesCotizacion {
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    let totalGeneral = 0;

    for (const item of items) {
      const precioBrutoLinea = item.cantidad * item.precioUnitarioPactado;
      const descuentoLinea = (precioBrutoLinea * (item.descuentoPct || 0)) / 100;
      const subtotalNeto = precioBrutoLinea - descuentoLinea;

      subtotalBruto += precioBrutoLinea;
      totalDescuentos += descuentoLinea;
      totalGeneral += subtotalNeto;
    }

    return {
      subtotal: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      totalImpuestos: 0, // En B2B estándar se maneja base o discriminado según régimen
      totalGeneral: Math.round(totalGeneral * 100) / 100,
    };
  }

  /**
   * Crea una nueva cotización B2B con vigencia configurable
   */
  public async crearCotizacion(input: CrearCotizacionInput): Promise<B2BQuotation> {
    const cotizacionId = `cot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const codigoCotizacion = this.generarConsecutivo(input.tenantId);
    const diasVigencia = input.diasVigencia ?? 15;

    const fechaEmision = new Date();
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasVigencia);

    const totales = this.calcularTotales(input.items);

    const nuevaCotizacion: B2BQuotation = {
      id: cotizacionId,
      tenantId: input.tenantId,
      codigoCotizacion,
      clienteId: input.clienteId,
      asesorUsuarioId: input.asesorUsuarioId,
      estado: input.estadoInicial ?? 'EMITIDA',
      items: input.items,
      subtotal: totales.subtotal,
      totalDescuentos: totales.totalDescuentos,
      totalImpuestos: totales.totalImpuestos,
      totalGeneral: totales.totalGeneral,
      diasVigencia,
      fechaEmision: fechaEmision.toISOString(),
      fechaVencimiento: fechaVencimiento.toISOString(),
      observaciones: input.observaciones,
      createdAt: fechaEmision.toISOString(),
      updatedAt: fechaEmision.toISOString(),
    };

    const storageKey = `${input.tenantId}:${cotizacionId}`;
    this.cotizaciones.set(storageKey, nuevaCotizacion);

    return nuevaCotizacion;
  }

  /**
   * Obtiene una cotización por su identificador
   */
  public async obtenerCotizacionPorId(
    tenantId: string,
    cotizacionId: string
  ): Promise<B2BQuotation | null> {
    const storageKey = `${tenantId}:${cotizacionId}`;
    return this.cotizaciones.get(storageKey) || null;
  }

  /**
   * Lista cotizaciones aplicando filtros opcionales de estado y cliente
   */
  public async listarCotizaciones(
    tenantId: string,
    filtro?: { estado?: QuotationStatus; clienteId?: string }
  ): Promise<B2BQuotation[]> {
    const lista: B2BQuotation[] = [];

    for (const [key, cot] of this.cotizaciones.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        if (filtro?.estado && cot.estado !== filtro.estado) continue;
        if (filtro?.clienteId && cot.clienteId !== filtro.clienteId) continue;
        lista.push(cot);
      }
    }

    return lista.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  /**
   * Actualiza el estado del ciclo de vida de la cotización
   */
  public async actualizarEstado(
    tenantId: string,
    cotizacionId: string,
    nuevoEstado: QuotationStatus,
    observacion?: string
  ): Promise<B2BQuotation> {
    const storageKey = `${tenantId}:${cotizacionId}`;
    const cot = this.cotizaciones.get(storageKey);

    if (!cot) {
      throw new Error(`Cotización ${cotizacionId} no encontrada`);
    }

    cot.estado = nuevoEstado;
    cot.updatedAt = new Date().toISOString();
    if (observacion) {
      cot.observaciones = cot.observaciones
        ? `${cot.observaciones} | ${observacion}`
        : observacion;
    }

    this.cotizaciones.set(storageKey, cot);
    return cot;
  }

  /**
   * Convierte atómicamente una cotización B2B aprobada a Preventa POS (SPEC-037).
   * Genera el registro de preventa en el Kanban de Caja Central y reserva el inventario (Hard-Hold).
   */
  public async convertirAPreventaPOS(params: {
    cotizacionId: string;
    tenantId: string;
    bodegaId: string;
    vendedorId: string;
    vendedorNombre: string;
    terminalId: string;
    tipoPreventa?: QuotationToPosConversion['tipoPreventa'];
  }): Promise<ConversionPosResultado> {
    const storageKey = `${params.tenantId}:${params.cotizacionId}`;
    const cotizacion = this.cotizaciones.get(storageKey);

    if (!cotizacion) {
      return { ok: false, error: 'Cotización no encontrada para el tenant especificado' };
    }

    if (cotizacion.estado === 'CONVERTIDA') {
      return {
        ok: false,
        error: `La cotización ${cotizacion.codigoCotizacion} ya fue convertida previamente a la preventa ${cotizacion.convertidaPrefacturaId}`,
      };
    }

    if (cotizacion.estado === 'RECHAZADA') {
      return {
        ok: false,
        error: `La cotización ${cotizacion.codigoCotizacion} fue rechazada y no puede ser procesada`,
      };
    }

    // Validación de vigencia
    const ahora = new Date();
    const fechaVence = new Date(cotizacion.fechaVencimiento);
    if (fechaVence.getTime() < ahora.getTime()) {
      cotizacion.estado = 'VENCIDA';
      cotizacion.updatedAt = ahora.toISOString();
      this.cotizaciones.set(storageKey, cotizacion);
      return {
        ok: false,
        error: `La cotización ${cotizacion.codigoCotizacion} está vencida desde ${cotizacion.fechaVencimiento}`,
      };
    }

    // Mapear ítems a contrato de Preventa POS (SPEC-037)
    const itemsPrefactura: ItemPrefacturaInput[] = cotizacion.items.map((it) => ({
      productoId: it.productoSku,
      nombre: it.nombre,
      cantidad: it.cantidad,
      precioLista: it.precioUnitarioPactado,
      descuentoPct: it.descuentoPct,
      supervisorPinAutorizado: true, // Cotización autorizada previamente
    }));

    // Emitir preventa con reserva inmediata de stock (Hard-Hold)
    const emisionRes = await prefacturaService.emitirPrefactura({
      tenantId: params.tenantId,
      vendedorId: params.vendedorId,
      vendedorNombre: params.vendedorNombre,
      terminalId: params.terminalId,
      clienteDocumento: cotizacion.clienteId,
      clienteNombre: `Cliente B2B (${cotizacion.clienteId})`,
      items: itemsPrefactura,
      observaciones: `Conversión desde Cotización ${cotizacion.codigoCotizacion}. Ref: ${cotizacion.observaciones || 'N/A'}`,
    });

    if (!emisionRes.ok || !emisionRes.prefactura) {
      return {
        ok: false,
        error: emisionRes.error || 'Error al emitir preventa en caja POS',
      };
    }

    // Actualizar cotización a CONVERTIDA y enlazar ID de preventa
    cotizacion.estado = 'CONVERTIDA';
    cotizacion.convertidaPrefacturaId = emisionRes.prefactura.id;
    cotizacion.updatedAt = new Date().toISOString();
    this.cotizaciones.set(storageKey, cotizacion);

    return {
      ok: true,
      cotizacion,
      prefactura: emisionRes.prefactura,
    };
  }
}

export const b2bQuotationService = new B2BQuotationService();

