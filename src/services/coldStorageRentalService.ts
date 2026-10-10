import { getSupabaseClient } from '../lib/supabase';
import type {
  CuartoFrio,
  ClienteCustodia,
  ProductoCustodia,
  ContratoAlquilerCf,
  RecepcionCustodiaInput,
  DespachoCustodiaInput,
  CausacionIngresoInput,
  RecepcionMultipleInput,
  ClienteRapidoInput,
  DespachoMultipleInput,
  PartidaRecepcion,
} from '../../packages/validation-schemas/src/coldStorageRental.schema';
import {
  RecepcionMultipleInputSchema,
  ClienteRapidoInputSchema,
  DespachoMultipleInputSchema,
  calcularTotalesPartidasRecepcion,
} from '../../packages/validation-schemas/src/coldStorageRental.schema';

export const DEFAULT_EMPRESA_ID = '00000000-0000-0000-0000-000000000001';

export interface InventarioCustodiaItem {
  id: string;
  empresa_id: string;
  contrato_id: string;
  cliente_id: string;
  producto_custodia_id: string;
  lote_cliente: string;
  fecha_ingreso: string;
  fecha_vencimiento?: string | null;
  bultos_iniciales: number;
  bultos_actuales: number;
  peso_neto_inicial_kg: number;
  peso_neto_actual_kg: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  // Joins
  cliente?: { razon_social: string; numero_identificacion: string };
  producto?: { nombre: string; tipo_empaque: string; modalidad_medicion: string };
  contrato?: { consecutivo: string; cuarto_frio_id: string };
}

export interface MovimientoCustodiaItem {
  id: string;
  empresa_id: string;
  inventario_custodia_id: string;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  consecutivo_acta: string;
  fecha_movimiento: string;
  bultos: number;
  peso_bruto_kg: number;
  peso_tara_kg: number;
  peso_neto_kg: number;
  temperatura_medida?: number | null;
  merma_kg: number;
  transportador_nombre: string;
  transportador_cedula: string;
  placa_vehiculo: string;
  documento_soporte_pdf_url?: string | null;
  firmado_por_cliente?: string | null;
  observaciones?: string | null;
  operador_almacen_id?: string | null;
}

export interface CausacionAlquilerItem {
  id: string;
  empresa_id: string;
  contrato_id: string;
  cliente_id: string;
  consecutivo_causacion: string;
  periodo_inicio: string;
  periodo_fin: string;
  subtotal: number;
  recargo_sobrecupo: number;
  base_gravable: number;
  iva_19: number;
  retefuente: number;
  total: number;
  estado_pago: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  factura_venta_id?: string | null;
  asiento_contable_ref?: string | null;
  creado_en: string;
}

function obtenerSupabaseSeguro(): any {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

export const coldStorageRentalService = {
  /**
   * Obtiene la lista de cuartos fríos disponibles en la empresa
   */
  async getCuartosFrios(): Promise<CuartoFrio[]> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('cuartos_frios')
          .select('*')
          .order('codigo', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as CuartoFrio[];
        }
      } catch (err) {
        console.warn('[coldStorageRentalService] Fallback local cuartos_frios:', err);
      }
    }

    try {
      if (typeof localStorage !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('pezcaderia_cuartos_frios') || '[]');
        if (local && local.length > 0) return local;
      }
    } catch {
      // Ignorar
    }

    return [
      {
        id: 'cf-principal-01',
        empresa_id: DEFAULT_EMPRESA_ID,
        codigo: 'CF-01',
        nombre: 'Cuarto Frío Principal (Congelación -18°C)',
        temperatura_setpoint: -18.0,
        capacidad_total_posiciones: 50,
        activo: true,
      },
      {
        id: 'cf-refrig-02',
        empresa_id: DEFAULT_EMPRESA_ID,
        codigo: 'CF-02',
        nombre: 'Cuarto Frío Refrigeración Fresca (0°C a +4°C)',
        temperatura_setpoint: 2.0,
        capacidad_total_posiciones: 20,
        activo: true,
      },
    ];
  },

  /**
   * Registra un nuevo cuarto frío
   */
  async crearCuartoFrio(cuartoFrio: Partial<CuartoFrio>): Promise<CuartoFrio> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('cuartos_frios')
          .insert({
            empresa_id: DEFAULT_EMPRESA_ID,
            ...cuartoFrio,
          } as any)
          .select()
          .single();
        if (!error && data) return data as CuartoFrio;
      } catch (err) {
        console.warn('[coldStorageRentalService] Supabase no disponible crearCuartoFrio:', err);
      }
    }
    const nuevo: CuartoFrio = {
      id: crypto.randomUUID(),
      empresa_id: DEFAULT_EMPRESA_ID,
      codigo: cuartoFrio.codigo || 'CF-NEW',
      nombre: cuartoFrio.nombre || 'Nuevo Cuarto Frío',
      temperatura_setpoint: cuartoFrio.temperatura_setpoint ?? -18.0,
      capacidad_total_posiciones: cuartoFrio.capacidad_total_posiciones || 20,
      activo: true,
    };
    return nuevo;
  },

  /**
   * Obtiene los clientes de custodia (3PL)
   */
  async getClientesCustodia(): Promise<ClienteCustodia[]> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('clientes_custodia')
          .select('*')
          .order('razon_social', { ascending: true });
        if (!error && data) return data as ClienteCustodia[];
      } catch (err) {
        console.warn('[coldStorageRentalService] Fallback local clientes_custodia:', err);
      }
    }

    try {
      if (typeof localStorage !== 'undefined') {
        return JSON.parse(localStorage.getItem('pezcaderia_clientes_custodia') || '[]');
      }
    } catch {
      // Ignorar
    }
    return [];
  },

  /**
   * Registra un cliente de custodia 3PL
   */
  async crearClienteCustodia(cliente: Partial<ClienteCustodia>): Promise<ClienteCustodia> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('clientes_custodia')
      .insert({
        empresa_id: DEFAULT_EMPRESA_ID,
        ...cliente,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as ClienteCustodia;
  },

  /**
   * Obtiene el catálogo de SKUs de clientes para custodia
   */
  async getProductosCustodia(clienteId?: string): Promise<ProductoCustodia[]> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        let query = sb.from('productos_custodia').select('*').order('nombre', { ascending: true });
        if (clienteId) query = query.eq('cliente_id', clienteId);
        const { data, error } = await query;
        if (!error && data) return data as ProductoCustodia[];
      } catch (err) {
        console.warn('[coldStorageRentalService] Fallback local productos_custodia:', err);
      }
    }

    try {
      if (typeof localStorage !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('pezcaderia_productos_custodia') || '[]');
        if (clienteId) return local.filter((p: any) => p.cliente_id === clienteId);
        return local;
      }
    } catch {
      // Ignorar
    }
    return [];
  },

  /**
   * Registra un producto en el catálogo de custodia
   */
  async crearProductoCustodia(producto: Partial<ProductoCustodia>): Promise<ProductoCustodia> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('productos_custodia')
          .insert({
            empresa_id: DEFAULT_EMPRESA_ID,
            ...producto,
          } as any)
          .select()
          .single();
        if (!error && data) return data as ProductoCustodia;
      } catch (err) {
        console.warn('[coldStorageRentalService] Supabase no disponible crearProductoCustodia:', err);
      }
    }
    const nuevo: ProductoCustodia = {
      id: crypto.randomUUID(),
      empresa_id: DEFAULT_EMPRESA_ID,
      nombre: producto.nombre || 'Nuevo Producto',
      tipo_empaque: (producto.tipo_empaque as any) || 'CANASTILLAS',
      modalidad_medicion: (producto.modalidad_medicion as any) || 'MIXTO_BULTOS_PESO',
      activo: true,
      creado_en: new Date().toISOString(),
    };
    return nuevo;
  },

  /**
   * Obtiene los contratos de alquiler vigentes o por estado
   */
  async getContratos(cuartoFrioId?: string, estado?: string): Promise<ContratoAlquilerCf[]> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        let query = sb
          .from('contratos_alquiler_cf')
          .select(`
            *,
            cliente:clientes_custodia(razon_social, numero_identificacion, estado),
            cuarto_frio:cuartos_frios(codigo, nombre, temperatura_setpoint)
          `)
          .order('creado_en', { ascending: false });

        if (cuartoFrioId) query = query.eq('cuarto_frio_id', cuartoFrioId);
        if (estado) query = query.eq('estado', estado);

        const { data, error } = await query;
        if (!error && data) return data as ContratoAlquilerCf[];
      } catch (err) {
        console.warn('[coldStorageRentalService] Fallback local contratos:', err);
      }
    }

    try {
      if (typeof localStorage !== 'undefined') {
        let local: ContratoAlquilerCf[] = JSON.parse(localStorage.getItem('pezcaderia_contratos_cf') || '[]');
        if (cuartoFrioId) local = local.filter((c) => c.cuarto_frio_id === cuartoFrioId);
        if (estado) local = local.filter((c) => c.estado === estado);
        return local;
      }
    } catch {
      // Ignorar
    }
    return [];
  },

  /**
   * Registra un nuevo contrato de almacenamiento de 800 kg por posición
   */
  async crearContrato(contrato: Partial<ContratoAlquilerCf>): Promise<ContratoAlquilerCf> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('contratos_alquiler_cf')
          .insert({
            empresa_id: DEFAULT_EMPRESA_ID,
            ...contrato,
          } as any)
          .select()
          .single();
        if (!error && data) return data as ContratoAlquilerCf;
      } catch (err) {
        console.warn('[coldStorageRentalService] Supabase no disponible crearContrato:', err);
      }
    }
    const nuevo: ContratoAlquilerCf = {
      id: crypto.randomUUID(),
      empresa_id: DEFAULT_EMPRESA_ID,
      consecutivo: `CF-CTO-${Date.now().toString().slice(-6)}`,
      cliente_id: contrato.cliente_id || '00000000-0000-0000-0000-000000000000',
      cuarto_frio_id: contrato.cuarto_frio_id || 'cf-principal-01',
      modalidad_tiempo: (contrato.modalidad_tiempo as any) || 'MESES',
      posiciones_contratadas: contrato.posiciones_contratadas || 1,
      tarifa_unitaria: contrato.tarifa_unitaria || 650000,
      tarifa_recargo_sobrepeso_kg: contrato.tarifa_recargo_sobrepeso_kg || 250,
      modalidad_facturacion: (contrato.modalidad_facturacion as any) || 'ANTICIPADA',
      requiere_cuentas_orden: false,
      fecha_inicio: contrato.fecha_inicio || new Date().toISOString().slice(0, 10),
      fecha_fin: contrato.fecha_fin || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      estado: 'VIGENTE',
    };
    return nuevo;
  },

  /**
   * Consulta el inventario en custodia activo (aislado de cuenta 1435)
   */
  async getInventarioCustodia(contratoId?: string, clienteId?: string): Promise<InventarioCustodiaItem[]> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        let query = sb
          .from('inventario_custodia')
          .select(`
            *,
            cliente:clientes_custodia(razon_social, numero_identificacion),
            producto:productos_custodia(nombre, tipo_empaque, modalidad_medicion),
            contrato:contratos_alquiler_cf(consecutivo, cuarto_frio_id, modalidad_tiempo)
          `)
          .eq('activo', true)
          .order('fecha_ingreso', { ascending: false });

        if (contratoId) query = query.eq('contrato_id', contratoId);
        if (clienteId) query = query.eq('cliente_id', clienteId);

        const { data, error } = await query;
        if (!error && data) return data as InventarioCustodiaItem[];
      } catch (err) {
        console.warn('[coldStorageRentalService] Fallback local inventario_custodia:', err);
      }
    }

    try {
      if (typeof localStorage !== 'undefined') {
        let local: InventarioCustodiaItem[] = JSON.parse(localStorage.getItem('pezcaderia_inventario_custodia') || '[]');
        local = local.filter((i) => i.activo);
        if (contratoId) local = local.filter((i) => i.contrato_id === contratoId);
        if (clienteId) local = local.filter((i) => i.cliente_id === clienteId);
        return local;
      }
    } catch {
      // Ignorar
    }
    return [];
  },

  /**
   * Consulta los movimientos (Actas de Entrada / Salida)
   */
  async getMovimientos(inventarioId?: string): Promise<MovimientoCustodiaItem[]> {
    const sb = obtenerSupabaseSeguro();
    if (sb) {
      try {
        let query = sb
          .from('movimientos_custodia')
          .select('*')
          .order('fecha_movimiento', { ascending: false });

        if (inventarioId) query = query.eq('inventario_custodia_id', inventarioId);

        const { data, error } = await query;
        if (!error && data) return data as MovimientoCustodiaItem[];
      } catch (err) {
        console.warn('[coldStorageRentalService] Fallback local movimientos_custodia:', err);
      }
    }

    try {
      if (typeof localStorage !== 'undefined') {
        let local: MovimientoCustodiaItem[] = JSON.parse(localStorage.getItem('pezcaderia_movimientos_cf') || '[]');
        if (inventarioId) local = local.filter((m) => m.inventario_custodia_id === inventarioId);
        return local;
      }
    } catch {
      // Ignorar
    }
    return [];
  },

  /**
   * RPC: Registrar recepción con pesaje en báscula y bloqueo pesimista
   */
  async registrarRecepcion(input: RecepcionCustodiaInput): Promise<{
    success: boolean;
    acta_consecutivo: string;
    movimiento_id: string;
    inventario_id: string;
    peso_neto_ingresado: number;
    sobrecupo_detectado_kg: number;
  }> {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('fn_registrar_recepcion_custodia', {
      p_empresa_id: (input.empresa_id && input.empresa_id.length === 36) ? input.empresa_id : DEFAULT_EMPRESA_ID,
      p_contrato_id: input.contrato_id,
      p_producto_custodia_id: input.producto_custodia_id,
      p_lote_cliente: input.lote_cliente,
      p_bultos: input.bultos,
      p_peso_bruto_kg: input.peso_bruto_kg,
      p_peso_tara_kg: input.peso_tara_kg,
      p_temperatura: input.temperatura,
      p_transportador_nombre: input.transportador_nombre,
      p_transportador_cedula: input.transportador_cedula,
      p_placa_vehiculo: input.placa_vehiculo,
      p_operador_id: input.operador_id,
      p_fecha_vencimiento: input.fecha_vencimiento ?? null,
      p_observaciones: input.observaciones ?? null,
    });

    if (error) {
      console.error('[coldStorageRentalService] Error en RPC fn_registrar_recepcion_custodia:', error);
      throw error;
    }
    return data;
  },

  /**
   * RPC: Registrar despacho con báscula, merma de frío y saldo remanente
   */
  async registrarDespacho(input: DespachoCustodiaInput): Promise<{
    success: boolean;
    acta_consecutivo: string;
    movimiento_id: string;
    bultos_despachados: number;
    peso_despachado_kg: number;
    merma_kg: number;
    remanente_bultos: number;
    remanente_peso_kg: number;
  }> {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('fn_registrar_despacho_custodia', {
      p_empresa_id: (input.empresa_id && input.empresa_id.length === 36) ? input.empresa_id : DEFAULT_EMPRESA_ID,
      p_inventario_id: input.inventario_id,
      p_bultos_despacho: input.bultos_despacho,
      p_peso_bruto_salida: input.peso_bruto_salida,
      p_peso_tara_salida: input.peso_tara_salida,
      p_transportador_nombre: input.transportador_nombre,
      p_transportador_cedula: input.transportador_cedula,
      p_placa_vehiculo: input.placa_vehiculo,
      p_operador_id: input.operador_id,
      p_autorizado_gerencia_id: input.autorizado_gerencia_id ?? null,
      p_observaciones: input.observaciones ?? null,
    });

    if (error) {
      console.error('[coldStorageRentalService] Error en RPC fn_registrar_despacho_custodia:', error);
      throw error;
    }
    return data;
  },

  /**
   * RPC: Causar contablemente el alquiler del periodo (4155, 2408, 1305)
   */
  async causarIngresoAlquiler(input: CausacionIngresoInput): Promise<{
    success: boolean;
    consecutivo_causacion: string;
    causacion_id: string;
    subtotal: number;
    recargo_sobrecupo: number;
    base_gravable: number;
    iva_19: number;
    retefuente: number;
    total: number;
  }> {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('fn_causar_ingreso_alquiler_cf', {
      p_empresa_id: (input.empresa_id && input.empresa_id.length === 36) ? input.empresa_id : DEFAULT_EMPRESA_ID,
      p_contrato_id: input.contrato_id,
      p_periodo_inicio: input.periodo_inicio,
      p_periodo_fin: input.periodo_fin,
      p_recargo_sobrecupo: input.recargo_sobrecupo,
      p_porcentaje_retefuente: input.porcentaje_retefuente,
    });

    if (error) {
      console.error('[coldStorageRentalService] Error en RPC fn_causar_ingreso_alquiler_cf:', error);
      throw error;
    }
    return data;
  },

  /**
   * Lista las causaciones de alquiler generadas
   */
  async getCausaciones(contratoId?: string): Promise<CausacionAlquilerItem[]> {
    const sb = getSupabaseClient();
    let query = sb
      .from('causaciones_alquiler_cf')
      .select('*')
      .order('creado_en', { ascending: false });

    if (contratoId) query = query.eq('contrato_id', contratoId);

    const { data, error } = await query;
    if (error) {
      console.warn('[coldStorageRentalService] Supabase causaciones no disponibles, usando caché local:', error.message);
      const local = JSON.parse(localStorage.getItem('pezcaderia_causaciones_cf') || '[]');
      if (contratoId) return local.filter((c: any) => c.contrato_id === contratoId);
      return local;
    }
    return (data ?? []) as CausacionAlquilerItem[];
  },

  /**
   * Guarda en almacenamiento local persistente el preset de tara para un cliente
   */
  guardarPresetTaraCliente(
    clienteId: string,
    presets: { taraCanastillaKg: number; taraCajaKg: number }
  ): void {
    try {
      const actual = JSON.parse(localStorage.getItem('pezcaderia_cf_presets_tara') || '{}');
      actual[clienteId] = {
        ...presets,
        ultimaActualizacion: new Date().toISOString(),
      };
      localStorage.setItem('pezcaderia_cf_presets_tara', JSON.stringify(actual));
    } catch (e) {
      console.warn('Error guardando preset de tara:', e);
    }
  },

  /**
   * Obtiene el preset de tara configurado para un cliente, o los valores por defecto del sistema
   */
  obtenerPresetTaraCliente(clienteId?: string): { taraCanastillaKg: number; taraCajaKg: number } {
    try {
      if (!clienteId) return { taraCanastillaKg: 2.0, taraCajaKg: 0.8 };
      const actual = JSON.parse(localStorage.getItem('pezcaderia_cf_presets_tara') || '{}');
      if (actual[clienteId]) {
        return {
          taraCanastillaKg: Number(actual[clienteId].taraCanastillaKg ?? 2.0),
          taraCajaKg: Number(actual[clienteId].taraCajaKg ?? 0.8),
        };
      }
    } catch (e) {
      console.warn('Error leyendo preset de tara:', e);
    }
    return { taraCanastillaKg: 2.0, taraCajaKg: 0.8 };
  },

  /**
   * Registra el pago del servicio de alquiler directamente en el turno de caja abierto
   * integrándolo con cashService (actualiza saldos físicos, arqueo y genera recibo).
   */
  async registrarCobroEnCaja(params: {
    turnoId: string;
    cajaId: string;
    clienteId: string;
    contratoId?: string;
    causacionId?: string;
    monto: number;
    metodoPago: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'CREDITO' | 'MIXTO';
    concepto: string;
    referenciaId: string;
    usuarioId?: string;
  }): Promise<{ success: boolean; movimientoCajaId?: string; error?: string }> {
    try {
      const { cashService } = await import('./cashService');
      const resultado = cashService.registrarMovimiento(
        params.turnoId,
        params.cajaId,
        'INGRESO_VENTA',
        params.metodoPago as any,
        params.monto,
        params.concepto,
        params.referenciaId,
        params.usuarioId || '00000000-0000-0000-0000-000000000000'
      );

      if (resultado.error) {
        return { success: false, error: resultado.error };
      }

      // Si hay una causación asociada, marcarla como pagada
      if (params.causacionId) {
        await this.marcarCausacionPagada(params.causacionId, params.metodoPago, params.turnoId);
      }

      return {
        success: true,
        movimientoCajaId: resultado.data?.id,
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error registrando cobro en caja' };
    }
  },

  /**
   * Marca una causación como pagada en Supabase o en el almacenamiento local
   */
  async marcarCausacionPagada(causacionId: string, metodoPago: string, turnoId?: string): Promise<void> {
    const sb = getSupabaseClient();
    try {
      await sb
        .from('causaciones_alquiler_cf')
        .update({
          estado_pago: 'PAGADA',
          asiento_contable_ref: `PAGO-CAJA-${metodoPago}-${turnoId || 'TURNO'}`,
        })
        .eq('id', causacionId);
    } catch (e) {
      console.warn('Error actualizando causación en Supabase, actualizando local:', e);
    }

    try {
      const local = JSON.parse(localStorage.getItem('pezcaderia_causaciones_cf') || '[]');
      const idx = local.findIndex((c: any) => c.id === causacionId);
      if (idx !== -1) {
        local[idx].estado_pago = 'PAGADA';
        localStorage.setItem('pezcaderia_causaciones_cf', JSON.stringify(local));
      }
    } catch (e) {
      // Ignorar errores locales
    }
  },

  /**
   * Creación express de cliente y contrato in-situ en báscula (15 segundos)
   */
  async crearClienteYContratoRapido(input: ClienteRapidoInput): Promise<{
    cliente: ClienteCustodia;
    contrato: ContratoAlquilerCf;
  }> {
    const validated = ClienteRapidoInputSchema.parse(input);
    let sb: any = null;
    try {
      sb = getSupabaseClient();
    } catch {
      // Offline / Test environment
    }
    const clienteId = crypto.randomUUID();
    const contratoId = crypto.randomUUID();
    const consecutivo = `CF-CTO-${Date.now().toString().slice(-6)}`;
    const hoyStr = new Date().toISOString().split('T')[0];
    const finStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Obtener cuarto frío por defecto o el primero disponible
    let cuartoFrioId = '00000000-0000-0000-0000-000000000010';
    if (sb) {
      try {
        const { data: cuartos } = await sb.from('cuartos_frios').select('id').limit(1);
        if (cuartos && cuartos.length > 0) {
          cuartoFrioId = cuartos[0].id;
        }
      } catch (e) {
        // Ignorar en fallback local
      }
    }

    const nuevoCliente: ClienteCustodia = {
      id: clienteId,
      empresa_id: DEFAULT_EMPRESA_ID,
      razon_social: validated.razon_social.trim(),
      numero_identificacion: validated.numero_identificacion.trim(),
      tipo_identificacion: validated.tipo_identificacion || 'NIT',
      telefono: validated.telefono.trim(),
      email: validated.email ? validated.email.trim() : null,
      responsable_contacto: validated.razon_social.trim(),
      autorizados_retiro: [],
      estado: 'ACTIVO',
    };

    const nuevoContrato: ContratoAlquilerCf = {
      id: contratoId,
      empresa_id: DEFAULT_EMPRESA_ID,
      consecutivo,
      cliente_id: clienteId,
      cuarto_frio_id: cuartoFrioId,
      modalidad_tiempo: validated.modalidad_tiempo,
      posiciones_contratadas: validated.capacidad_posiciones || 1,
      tarifa_unitaria: validated.tarifa_pactada,
      tarifa_recargo_sobrepeso_kg: 350,
      modalidad_facturacion: 'ANTICIPADA',
      requiere_cuentas_orden: false,
      fecha_inicio: hoyStr,
      fecha_fin: finStr,
      estado: 'VIGENTE',
    };

    // Intentar persistir en Supabase si está disponible
    if (sb) {
      try {
        await sb.from('clientes_custodia').insert(nuevoCliente as any);
        await sb.from('contratos_alquiler_cf').insert(nuevoContrato as any);
      } catch (err) {
        console.warn('[coldStorageRentalService] Supabase no disponible para cliente rápido, usando caché local:', err);
      }
    }

    // Persistir siempre en almacenamiento local para resiliencia offline/mock
    try {
      if (typeof localStorage !== 'undefined') {
        const clientesLocales = JSON.parse(localStorage.getItem('pezcaderia_clientes_custodia') || '[]');
        clientesLocales.unshift(nuevoCliente);
        localStorage.setItem('pezcaderia_clientes_custodia', JSON.stringify(clientesLocales));

        const contratosLocales = JSON.parse(localStorage.getItem('pezcaderia_contratos_cf') || '[]');
        contratosLocales.unshift({
          ...nuevoContrato,
          cliente: {
            razon_social: nuevoCliente.razon_social,
            numero_identificacion: nuevoCliente.numero_identificacion,
            estado: nuevoCliente.estado,
          },
        });
        localStorage.setItem('pezcaderia_contratos_cf', JSON.stringify(contratosLocales));
      }
    } catch (e) {
      // Ignorar si no hay localStorage
    }

    return { cliente: nuevoCliente, contrato: nuevoContrato };
  },

  /**
   * Registra recepción consolidada de múltiples partidas en báscula con taras heterogéneas.
   * Guarda cada pesada como existencia individual vinculada al mismo consecutivo de acta.
   */
  async registrarRecepcionMultiple(input: RecepcionMultipleInput): Promise<{
    success: boolean;
    acta_consecutivo: string;
    totales: ReturnType<typeof calcularTotalesPartidasRecepcion>;
    partidasGuardadas: number;
    inventarios: InventarioCustodiaItem[];
    movimientos: MovimientoCustodiaItem[];
  }> {
    const validated = RecepcionMultipleInputSchema.parse(input);
    const totales = calcularTotalesPartidasRecepcion(validated.items);
    const consecutivoActa = `REC-CF-${Date.now().toString().slice(-6)}`;
    let sb: any = null;
    try {
      sb = getSupabaseClient();
    } catch {
      // Offline / Test environment
    }
    const empresaId = (validated.empresa_id && validated.empresa_id.length === 36) ? validated.empresa_id : DEFAULT_EMPRESA_ID;
    const ahoraIso = new Date().toISOString();

    const inventariosCreados: InventarioCustodiaItem[] = [];
    const movimientosCreados: MovimientoCustodiaItem[] = [];

    for (let i = 0; i < validated.items.length; i++) {
      const p = validated.items[i];
      const invId = p.id || crypto.randomUUID();
      const movId = crypto.randomUUID();
      let prodId = p.producto_custodia_id;

      if (!prodId || prodId.length < 10) {
        prodId = crypto.randomUUID();
      }

      const invItem: InventarioCustodiaItem = {
        id: invId,
        empresa_id: empresaId,
        contrato_id: validated.contrato_id,
        cliente_id: validated.cliente_id || '00000000-0000-0000-0000-000000000000',
        producto_custodia_id: prodId,
        lote_cliente: p.lote_cliente || `LOTE-${ahoraIso.slice(2, 10).replace(/-/g, '')}-${i + 1}`,
        fecha_ingreso: ahoraIso,
        fecha_vencimiento: p.fecha_vencimiento ?? null,
        bultos_iniciales: p.cantidad_bultos,
        bultos_actuales: p.cantidad_bultos,
        peso_neto_inicial_kg: p.peso_neto_kg,
        peso_neto_actual_kg: p.peso_neto_kg,
        activo: true,
        creado_en: ahoraIso,
        actualizado_en: ahoraIso,
        producto: {
          nombre: p.producto_nombre,
          tipo_empaque: p.tipo_empaque,
          modalidad_medicion: 'MIXTO_BULTOS_PESO',
        },
      };

      const movItem: MovimientoCustodiaItem = {
        id: movId,
        empresa_id: empresaId,
        inventario_custodia_id: invId,
        tipo_movimiento: 'ENTRADA',
        consecutivo_acta: consecutivoActa,
        fecha_movimiento: ahoraIso,
        bultos: p.cantidad_bultos,
        peso_bruto_kg: p.peso_bruto_kg,
        peso_tara_kg: p.peso_tara_total_kg,
        peso_neto_kg: p.peso_neto_kg,
        temperatura_medida: validated.temperatura_camion_c,
        merma_kg: 0,
        transportador_nombre: validated.transportador_nombre,
        transportador_cedula: validated.transportador_cedula,
        placa_vehiculo: validated.placa_vehiculo,
        observaciones: validated.observaciones ?? null,
      };

      inventariosCreados.push(invItem);
      movimientosCreados.push(movItem);

      // Intentar insertar en Supabase si está disponible
      if (sb) {
        try {
          await sb.from('inventario_custodia').insert({
            id: invItem.id,
            empresa_id: invItem.empresa_id,
            contrato_id: invItem.contrato_id,
            cliente_id: invItem.cliente_id,
            producto_custodia_id: invItem.producto_custodia_id,
            lote_cliente: invItem.lote_cliente,
            fecha_ingreso: invItem.fecha_ingreso,
            fecha_vencimiento: invItem.fecha_vencimiento,
            bultos_iniciales: invItem.bultos_iniciales,
            bultos_actuales: invItem.bultos_actuales,
            peso_neto_inicial_kg: invItem.peso_neto_inicial_kg,
            peso_neto_actual_kg: invItem.peso_neto_actual_kg,
            activo: true,
          } as any);

          await sb.from('movimientos_custodia').insert({
            id: movItem.id,
            empresa_id: movItem.empresa_id,
            inventario_custodia_id: movItem.inventario_custodia_id,
            tipo_movimiento: movItem.tipo_movimiento,
            consecutivo_acta: movItem.consecutivo_acta,
            fecha_movimiento: movItem.fecha_movimiento,
            bultos: movItem.bultos,
            peso_bruto_kg: movItem.peso_bruto_kg,
            peso_tara_kg: movItem.peso_tara_kg,
            peso_neto_kg: movItem.peso_neto_kg,
            temperatura_medida: movItem.temperatura_medida,
            merma_kg: 0,
            transportador_nombre: movItem.transportador_nombre,
            transportador_cedula: movItem.transportador_cedula,
            placa_vehiculo: movItem.placa_vehiculo,
            observaciones: movItem.observaciones,
          } as any);
        } catch (err) {
          console.warn('[coldStorageRentalService] Supabase no disponible para recepción múltiple:', err);
        }
      }
    }

    // Persistir en localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const invLocal = JSON.parse(localStorage.getItem('pezcaderia_inventario_custodia') || '[]');
        invLocal.unshift(...inventariosCreados);
        localStorage.setItem('pezcaderia_inventario_custodia', JSON.stringify(invLocal));

        const movLocal = JSON.parse(localStorage.getItem('pezcaderia_movimientos_custodia') || '[]');
        movLocal.unshift(...movimientosCreados);
        localStorage.setItem('pezcaderia_movimientos_custodia', JSON.stringify(movLocal));
      }
    } catch (e) {
      // Ignorar si no hay localStorage
    }

    return {
      success: true,
      acta_consecutivo: consecutivoActa,
      totales,
      partidasGuardadas: inventariosCreados.length,
      inventarios: inventariosCreados,
      movimientos: movimientosCreados,
    };
  },

  /**
   * Registra despacho consolidado de múltiples lotes/ítems seleccionados en el checklist
   */
  async registrarDespachoMultiple(input: DespachoMultipleInput): Promise<{
    success: boolean;
    acta_consecutivo: string;
    totalBultosDespachados: number;
    totalPesoDespachadoKg: number;
    itemsProcesados: number;
    movimientos: MovimientoCustodiaItem[];
  }> {
    const validated = DespachoMultipleInputSchema.parse(input);
    const consecutivoActa = `DSP-CF-${Date.now().toString().slice(-6)}`;
    let sb: any = null;
    try {
      sb = getSupabaseClient();
    } catch {
      // Offline / Test environment
    }
    const ahoraIso = new Date().toISOString();
    const movimientosCreados: MovimientoCustodiaItem[] = [];

    let totalBultos = 0;
    let totalPeso = 0;

    for (const item of validated.items) {
      totalBultos += item.bultos_a_retirar;
      totalPeso = Math.round((totalPeso + item.peso_neto_a_retirar + Number.EPSILON) * 100) / 100;

      const movItem: MovimientoCustodiaItem = {
        id: crypto.randomUUID(),
        empresa_id: DEFAULT_EMPRESA_ID,
        inventario_custodia_id: item.inventario_id,
        tipo_movimiento: 'SALIDA',
        consecutivo_acta: consecutivoActa,
        fecha_movimiento: ahoraIso,
        bultos: item.bultos_a_retirar,
        peso_bruto_kg: item.peso_neto_a_retirar,
        peso_tara_kg: 0,
        peso_neto_kg: item.peso_neto_a_retirar,
        temperatura_medida: null,
        merma_kg: 0,
        transportador_nombre: validated.transportador_nombre,
        transportador_cedula: validated.transportador_cedula,
        placa_vehiculo: validated.placa_vehiculo,
        observaciones: validated.observaciones ?? null,
      };

      movimientosCreados.push(movItem);

      // Intentar actualizar en Supabase si está disponible
      if (sb) {
        try {
          if (item.es_retiro_total) {
            await sb
              .from('inventario_custodia')
              .update({
                bultos_actuales: 0,
                peso_neto_actual_kg: 0,
                activo: false,
                actualizado_en: ahoraIso,
              })
              .eq('id', item.inventario_id);
          } else {
            // Descuento parcial
            const { data: invRow } = await sb
              .from('inventario_custodia')
              .select('bultos_actuales, peso_neto_actual_kg')
              .eq('id', item.inventario_id)
              .single();

            if (invRow) {
              const nuevosBultos = Math.max(0, invRow.bultos_actuales - item.bultos_a_retirar);
              const nuevoPeso = Math.max(
                0,
                Math.round((invRow.peso_neto_actual_kg - item.peso_neto_a_retirar + Number.EPSILON) * 100) / 100
              );
              await sb
                .from('inventario_custodia')
                .update({
                  bultos_actuales: nuevosBultos,
                  peso_neto_actual_kg: nuevoPeso,
                  activo: nuevoPeso > 0 && nuevosBultos > 0,
                  actualizado_en: ahoraIso,
                })
                .eq('id', item.inventario_id);
            }
          }

          await sb.from('movimientos_custodia').insert({
            id: movItem.id,
            empresa_id: movItem.empresa_id,
            inventario_custodia_id: movItem.inventario_custodia_id,
            tipo_movimiento: movItem.tipo_movimiento,
            consecutivo_acta: movItem.consecutivo_acta,
            fecha_movimiento: movItem.fecha_movimiento,
            bultos: movItem.bultos,
            peso_bruto_kg: movItem.peso_bruto_kg,
            peso_tara_kg: 0,
            peso_neto_kg: movItem.peso_neto_kg,
            merma_kg: 0,
            transportador_nombre: movItem.transportador_nombre,
            transportador_cedula: movItem.transportador_cedula,
            placa_vehiculo: movItem.placa_vehiculo,
            observaciones: movItem.observaciones,
          } as any);
        } catch (err) {
          console.warn('[coldStorageRentalService] Supabase no disponible para despacho múltiple:', err);
        }
      }
    }

    // Actualizar en localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const invLocal = JSON.parse(localStorage.getItem('pezcaderia_inventario_custodia') || '[]');
        for (const item of validated.items) {
          const idx = invLocal.findIndex((i: any) => i.id === item.inventario_id);
          if (idx !== -1) {
            if (item.es_retiro_total) {
              invLocal[idx].bultos_actuales = 0;
              invLocal[idx].peso_neto_actual_kg = 0;
              invLocal[idx].activo = false;
            } else {
              invLocal[idx].bultos_actuales = Math.max(0, invLocal[idx].bultos_actuales - item.bultos_a_retirar);
              invLocal[idx].peso_neto_actual_kg = Math.max(
                0,
                Math.round((invLocal[idx].peso_neto_actual_kg - item.peso_neto_a_retirar + Number.EPSILON) * 100) / 100
              );
              if (invLocal[idx].bultos_actuales <= 0 || invLocal[idx].peso_neto_actual_kg <= 0) {
                invLocal[idx].activo = false;
              }
            }
            invLocal[idx].actualizado_en = ahoraIso;
          }
        }
        localStorage.setItem('pezcaderia_inventario_custodia', JSON.stringify(invLocal));

        const movLocal = JSON.parse(localStorage.getItem('pezcaderia_movimientos_custodia') || '[]');
        movLocal.unshift(...movimientosCreados);
        localStorage.setItem('pezcaderia_movimientos_custodia', JSON.stringify(movLocal));
      }
    } catch (e) {
      // Ignorar si no hay localStorage
    }

    return {
      success: true,
      acta_consecutivo: consecutivoActa,
      totalBultosDespachados: totalBultos,
      totalPesoDespachadoKg: totalPeso,
      itemsProcesados: validated.items.length,
      movimientos: movimientosCreados,
    };
  },
};

