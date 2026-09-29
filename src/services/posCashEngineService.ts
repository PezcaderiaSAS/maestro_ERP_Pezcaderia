import { getSupabaseClient } from '../lib/supabase';
import {
  AperturaTurnoInput,
  RetiroParcialInput,
  CierreTurnoInput,
} from '../../packages/validation-schemas/src/posCashEngine.schema';

export const DEFAULT_EMPRESA_ID = '00000000-0000-0000-0000-000000000001';

export interface CajaPosItem {
  id: string;
  empresa_id: string;
  bodega_id: string;
  codigo: string;
  nombre: string;
  tipo: 'POS' | 'MENOR' | 'MAYOR' | 'MOVIL';
  tope_efectivo_maximo: number;
  modo_arqueo_ciego: boolean;
  umbral_tolerancia_ajuste: number;
  activa: boolean;
}

export interface TurnoPosItem {
  id: string;
  empresa_id: string;
  caja_id: string;
  cajero_id?: string;
  cajero_nombre: string;
  consecutivo_turno: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  base_inicial: number;
  total_efectivo: number;
  total_nequi: number;
  total_daviplata: number;
  total_qr_bancolombia: number;
  total_tarjeta: number;
  total_credito: number;
  total_ingresos_adicionales: number;
  total_retiros_parciales: number;
  saldo_esperado_efectivo: number;
  saldo_real_declarado?: number | null;
  diferencia?: number | null;
  tipo_descuadre?: 'EXACTO' | 'TOLERANCIA_REDONDEO' | 'FALTANTE' | 'SOBRANTE' | null;
  justificacion_descuadre?: string | null;
  estado: 'ABIERTO' | 'CERRADO' | 'AUDITADO';
  supervisor_cierre_id?: string | null;
  supervisor_nombre?: string | null;
  observaciones?: string | null;
  caja?: CajaPosItem;
}

export interface MovimientoPosItem {
  id: string;
  empresa_id: string;
  turno_id: string;
  tipo_movimiento: 'VENTA' | 'INGRESO_BASE' | 'INGRESO_EXTRA' | 'GASTO_MENOR' | 'RETIRO_PARCIAL' | 'AJUSTE_ARQUEO';
  metodo_pago: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA' | 'DATAFONO' | 'CREDITO' | 'MIXTO';
  monto: number;
  consecutivo_comprobante: string;
  referencia_venta_id?: string;
  concepto: string;
  autorizado_por?: string;
  creado_en: string;
}

export const posCashEngineService = {
  /**
   * Obtiene la lista de cajas configuradas para el tenant
   */
  async getCajas(bodegaId?: string): Promise<CajaPosItem[]> {
    const sb = getSupabaseClient();
    let query = sb.from('cajas_pos').select('*').eq('activa', true).order('codigo', { ascending: true });
    if (bodegaId) {
      query = query.eq('bodega_id', bodegaId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[posCashEngineService] Error fetching cajas:', error);
      throw error;
    }
    return (data ?? []) as CajaPosItem[];
  },

  /**
   * Obtiene el turno activo para una caja o cajero
   */
  async getTurnoActivo(cajaId?: string, cajeroId?: string): Promise<TurnoPosItem | null> {
    const sb = getSupabaseClient();
    let query = sb.from('turnos_pos').select('*, caja:cajas_pos(*)').eq('estado', 'ABIERTO');
    if (cajaId) query = query.eq('caja_id', cajaId);
    if (cajeroId) query = query.eq('cajero_id', cajeroId);

    const { data, error } = await query.order('fecha_apertura', { ascending: false }).limit(1).maybeSingle();
    if (error) {
      console.error('[posCashEngineService] Error fetching turno activo:', error);
      throw error;
    }
    return data as TurnoPosItem | null;
  },

  /**
   * RPC: Abrir un nuevo turno de caja con validación de concurrencia
   */
  async abrirTurno(input: AperturaTurnoInput): Promise<{
    success: boolean;
    turno_id: string;
    consecutivo_turno: string;
    base_inicial: number;
    modo_arqueo_ciego: boolean;
    tope_efectivo_maximo: number;
  }> {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('fn_abrir_turno_pos', {
      p_empresa_id: input.empresa_id || DEFAULT_EMPRESA_ID,
      p_caja_id: input.caja_id,
      p_cajero_id: input.cajero_id,
      p_cajero_nombre: input.cajero_nombre,
      p_base_inicial: input.base_inicial,
    });

    if (error) {
      console.error('[posCashEngineService] Error en fn_abrir_turno_pos:', error);
      throw error;
    }
    return data;
  },

  /**
   * RPC: Registrar retiro parcial de efectivo (Drop / Alivio de Caja)
   */
  async registrarRetiroParcial(input: RetiroParcialInput): Promise<{
    success: boolean;
    comprobante_retiro: string;
    monto_retirado: number;
    nuevo_saldo_gaveta: number;
  }> {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('fn_registrar_retiro_parcial_pos', {
      p_empresa_id: input.empresa_id || DEFAULT_EMPRESA_ID,
      p_turno_id: input.turno_id,
      p_monto_retiro: input.monto_retiro,
      p_motivo: input.motivo,
      p_cajero_nombre: input.cajero_nombre,
      p_supervisor_nombre: input.supervisor_nombre,
    });

    if (error) {
      console.error('[posCashEngineService] Error en fn_registrar_retiro_parcial_pos:', error);
      throw error;
    }
    return data;
  },

  /**
   * RPC: Cerrar turno con desglose físico de monedas y billetes
   */
  async cerrarTurno(input: CierreTurnoInput): Promise<{
    success: boolean;
    turno_id: string;
    consecutivo_turno: string;
    saldo_esperado_efectivo: number;
    saldo_real_declarado: number;
    diferencia: number;
    tipo_descuadre: 'EXACTO' | 'TOLERANCIA_REDONDEO' | 'FALTANTE' | 'SOBRANTE';
    requiere_autorizacion: boolean;
  }> {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('fn_cerrar_turno_pos', {
      p_empresa_id: input.empresa_id || DEFAULT_EMPRESA_ID,
      p_turno_id: input.turno_id,
      p_denominaciones: input.denominaciones,
      p_justificacion: input.justificacion ?? null,
      p_supervisor_id: input.supervisor_id ?? null,
      p_supervisor_nombre: input.supervisor_nombre ?? null,
    });

    if (error) {
      console.error('[posCashEngineService] Error en fn_cerrar_turno_pos:', error);
      throw error;
    }
    return data;
  },

  /**
   * Registra el pago de una venta impactando los acumuladores del turno activo
   */
  async acumularVentaTurno(
    turnoId: string,
    pagos: { metodo: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA' | 'DATAFONO' | 'CREDITO'; monto: number }[],
    ventaConsecutivo: string
  ): Promise<void> {
    const sb = getSupabaseClient();

    let incEfectivo = 0;
    let incNequi = 0;
    let incDaviplata = 0;
    let incQr = 0;
    let incTarjeta = 0;
    let incCredito = 0;

    for (const p of pagos) {
      if (p.metodo === 'EFECTIVO') incEfectivo += p.monto;
      else if (p.metodo === 'NEQUI') incNequi += p.monto;
      else if (p.metodo === 'DAVIPLATA') incDaviplata += p.monto;
      else if (p.metodo === 'QR_BANCOLOMBIA') incQr += p.monto;
      else if (p.metodo === 'DATAFONO') incTarjeta += p.monto;
      else if (p.metodo === 'CREDITO') incCredito += p.monto;

      // Registrar movimiento individual
      await sb.from('movimientos_pos_caja').insert({
        empresa_id: DEFAULT_EMPRESA_ID,
        turno_id: turnoId,
        tipo_movimiento: 'VENTA',
        metodo_pago: p.metodo,
        monto: p.monto,
        consecutivo_comprobante: `MOV-${ventaConsecutivo}-${p.metodo}`,
        referencia_venta_id: ventaConsecutivo,
        concepto: `Venta POS #${ventaConsecutivo} (${p.metodo})`,
      });
    }

    // Actualizar acumuladores del turno
    const { data: turno } = await sb.from('turnos_pos').select('*').eq('id', turnoId).single();
    if (turno) {
      await sb.from('turnos_pos').update({
        total_efectivo: (turno.total_efectivo || 0) + incEfectivo,
        total_nequi: (turno.total_nequi || 0) + incNequi,
        total_daviplata: (turno.total_daviplata || 0) + incDaviplata,
        total_qr_bancolombia: (turno.total_qr_bancolombia || 0) + incQr,
        total_tarjeta: (turno.total_tarjeta || 0) + incTarjeta,
        total_credito: (turno.total_credito || 0) + incCredito,
        actualizado_en: new Date().toISOString(),
      }).eq('id', turnoId);
    }
  },
};
