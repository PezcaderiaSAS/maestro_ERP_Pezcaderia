import { getSupabaseClient } from '../lib/supabase';
import type {
  CuartoFrio,
  ClienteCustodia,
  ProductoCustodia,
  ContratoAlquilerCf,
  RecepcionCustodiaInput,
  DespachoCustodiaInput,
  CausacionIngresoInput,
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

export const coldStorageRentalService = {
  /**
   * Obtiene la lista de cuartos fríos disponibles en la empresa
   */
  async getCuartosFrios(): Promise<CuartoFrio[]> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('cuartos_frios')
      .select('*')
      .order('codigo', { ascending: true });

    if (error) {
      console.error('[coldStorageRentalService] Error fetching cuartos_frios:', error);
      throw error;
    }
    return (data ?? []) as CuartoFrio[];
  },

  /**
   * Registra un nuevo cuarto frío
   */
  async crearCuartoFrio(cuartoFrio: Partial<CuartoFrio>): Promise<CuartoFrio> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('cuartos_frios')
      .insert({
        empresa_id: DEFAULT_EMPRESA_ID,
        ...cuartoFrio,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as CuartoFrio;
  },

  /**
   * Obtiene los clientes de custodia (3PL)
   */
  async getClientesCustodia(): Promise<ClienteCustodia[]> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('clientes_custodia')
      .select('*')
      .order('razon_social', { ascending: true });

    if (error) {
      console.error('[coldStorageRentalService] Error fetching clientes_custodia:', error);
      throw error;
    }
    return (data ?? []) as ClienteCustodia[];
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
    const sb = getSupabaseClient();
    let query = sb.from('productos_custodia').select('*').order('nombre', { ascending: true });

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[coldStorageRentalService] Error fetching productos_custodia:', error);
      throw error;
    }
    return (data ?? []) as ProductoCustodia[];
  },

  /**
   * Registra un producto en el catálogo de custodia
   */
  async crearProductoCustodia(producto: Partial<ProductoCustodia>): Promise<ProductoCustodia> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('productos_custodia')
      .insert({
        empresa_id: DEFAULT_EMPRESA_ID,
        ...producto,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as ProductoCustodia;
  },

  /**
   * Obtiene los contratos de alquiler vigentes o por estado
   */
  async getContratos(cuartoFrioId?: string, estado?: string): Promise<ContratoAlquilerCf[]> {
    const sb = getSupabaseClient();
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
    if (error) {
      console.error('[coldStorageRentalService] Error fetching contratos:', error);
      throw error;
    }
    return (data ?? []) as ContratoAlquilerCf[];
  },

  /**
   * Registra un nuevo contrato de almacenamiento de 800 kg por posición
   */
  async crearContrato(contrato: Partial<ContratoAlquilerCf>): Promise<ContratoAlquilerCf> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('contratos_alquiler_cf')
      .insert({
        empresa_id: DEFAULT_EMPRESA_ID,
        ...contrato,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as ContratoAlquilerCf;
  },

  /**
   * Consulta el inventario en custodia activo (aislado de cuenta 1435)
   */
  async getInventarioCustodia(contratoId?: string, clienteId?: string): Promise<InventarioCustodiaItem[]> {
    const sb = getSupabaseClient();
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
    if (error) {
      console.error('[coldStorageRentalService] Error fetching inventario_custodia:', error);
      throw error;
    }
    return (data ?? []) as InventarioCustodiaItem[];
  },

  /**
   * Consulta los movimientos (Actas de Entrada / Salida)
   */
  async getMovimientos(inventarioId?: string): Promise<MovimientoCustodiaItem[]> {
    const sb = getSupabaseClient();
    let query = sb
      .from('movimientos_custodia')
      .select('*')
      .order('fecha_movimiento', { ascending: false });

    if (inventarioId) query = query.eq('inventario_custodia_id', inventarioId);

    const { data, error } = await query;
    if (error) {
      console.error('[coldStorageRentalService] Error fetching movimientos_custodia:', error);
      throw error;
    }
    return (data ?? []) as MovimientoCustodiaItem[];
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
};

