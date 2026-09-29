import { getSupabaseClient } from '../lib/supabase';
import {
  PesajeAlistamiento,
  PesajeAlistamientoSchema,
  WmsDispatchRemision,
  WmsDispatchRemisionSchema,
  validateWeightTolerance,
  validateCalibrePieceWeight,
  calculateCatchWeightTotal
} from '../../packages/validation-schemas/src/b2bDispatch.schema';

export const DEFAULT_EMPRESA_ID = '00000000-0000-0000-0000-000000000001';

export interface ConciliacionPesajeResult {
  success: boolean;
  pesaje_id: string;
  peso_real_kg: number;
  peso_promedio_pieza_g: number | null;
  dentro_calibre: boolean;
  variacion_porcentaje: number;
  dentro_tolerancia: boolean;
  subtotal_ajustado: number;
  lote_fefo: string;
  temperatura_c: number;
}

export interface RemisionCreationResult {
  success: boolean;
  remision_id: string;
  numero_remision: string;
  token_qr: string;
  peso_total_neto_kg: number;
  temperatura_salida_c: number;
}

export const b2bDispatchService = {
  /**
   * Registra y concilia el pesaje de una línea de pedido B2B
   * Aplica RPC transaccional o cálculo determinista local si la red no está disponible.
   */
  async conciliarPesajeB2B(input: PesajeAlistamiento): Promise<ConciliacionPesajeResult> {
    const validated = PesajeAlistamientoSchema.parse(input);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('fn_conciliar_pesaje_b2b', {
          p_pedido_id: validated.lineaPedidoId,
          p_linea_id: validated.lineaPedidoId,
          p_producto_id: validated.productoId,
          p_modalidad: validated.modalidad,
          p_peso_nominal_kg: validated.pesoNominalKg,
          p_peso_real_kg: validated.pesoRealKg,
          p_piezas_solicitadas: validated.piezasAlistadas || null,
          p_piezas_alistadas: validated.piezasAlistadas || null,
          p_calibre_min_g: validated.calibreMinGramos || null,
          p_calibre_max_g: validated.calibreMaxGramos || null,
          p_precio_unitario_kg: validated.precioUnitarioPactado,
          p_tolerancia_pct: validated.toleranciaPorcentaje,
          p_temperatura_c: validated.temperaturaProductoC,
          p_lote_fefo: validated.loteFefo,
          p_operario_id: validated.operarioId,
          p_observaciones: validated.observaciones || null,
        });

        if (!error && data) {
          return data as ConciliacionPesajeResult;
        }
        console.warn('RPC fn_conciliar_pesaje_b2b falló, calculando en cliente:', error?.message);
      } catch (err) {
        console.warn('Error al invocar RPC en Supabase:', err);
      }
    }

    // Cálculo cliente offline determinista
    const tolerance = validateWeightTolerance(
      validated.pesoNominalKg,
      validated.pesoRealKg,
      validated.toleranciaPorcentaje
    );

    let dentroCalibre = true;
    let pesoPromedioG: number | null = null;
    if (validated.modalidad === 'CATCH_WEIGHT_PIEZAS' && validated.piezasAlistadas) {
      const calibreRes = validateCalibrePieceWeight(
        validated.pesoRealKg,
        validated.piezasAlistadas,
        validated.calibreMinGramos,
        validated.calibreMaxGramos
      );
      dentroCalibre = calibreRes.isWithinCalibre;
      pesoPromedioG = calibreRes.pesoPromedioGramos;
    }

    const subtotal = calculateCatchWeightTotal(validated.pesoRealKg, validated.precioUnitarioPactado);

    return {
      success: true,
      pesaje_id: crypto.randomUUID(),
      peso_real_kg: validated.pesoRealKg,
      peso_promedio_pieza_g: pesoPromedioG,
      dentro_calibre: dentroCalibre,
      variacion_porcentaje: tolerance.variancePercent,
      dentro_tolerancia: tolerance.isWithinTolerance,
      subtotal_ajustado: subtotal,
      lote_fefo: validated.loteFefo,
      temperatura_c: validated.temperaturaProductoC,
    };
  },

  /**
   * Crea una Remisión WMS con Token QR para el transportador
   */
  async crearRemisionDespachoWMS(input: WmsDispatchRemision): Promise<RemisionCreationResult> {
    const validated = WmsDispatchRemisionSchema.parse(input);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('fn_crear_remision_despacho_wms', {
          p_pedido_id: validated.pedidoId,
          p_cliente_id: validated.clienteId,
          p_cliente_nombre: validated.clienteNombre,
          p_direccion_entrega: validated.direccionEntrega,
          p_transportista_nombre: validated.transportistaNombre,
          p_placa_vehiculo: validated.placaVehiculo,
          p_temperatura_salida_c: validated.temperaturaSalidaC,
          p_peso_total_neto_kg: validated.pesoTotalNetoKg,
          p_piezas_totales: validated.piezasTotales || 0,
          p_items: validated.items,
          p_notas: validated.notas || null,
        });

        if (!error && data) {
          return data as RemisionCreationResult;
        }
        console.warn('RPC fn_crear_remision_despacho_wms falló, usando local:', error?.message);
      } catch (err) {
        console.warn('Error al invocar RPC de remisión en Supabase:', err);
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const numeroRemision = `REM-${year}-${randomSuffix}`;
    const tokenQr = crypto.randomUUID().replace(/-/g, '');

    return {
      success: true,
      remision_id: crypto.randomUUID(),
      numero_remision: numeroRemision,
      token_qr: tokenQr,
      peso_total_neto_kg: validated.pesoTotalNetoKg,
      temperatura_salida_c: validated.temperaturaSalidaC,
    };
  },

  /**
   * Consulta remisiones existentes para un pedido
   */
  async obtenerRemisionesPorPedido(pedidoId: string): Promise<WmsDispatchRemision[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('despachos_remisiones')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('fecha_despacho', { ascending: false });

    if (error || !data) return [];
    return data.map((r: any) => ({
      remisionId: r.id,
      numeroRemision: r.numero_remision,
      pedidoId: r.pedido_id,
      clienteId: r.cliente_id,
      clienteNombre: r.cliente_nombre,
      direccionEntrega: r.direccion_entrega,
      transportistaNombre: r.transportista_nombre,
      placaVehiculo: r.placa_vehiculo,
      temperaturaSalidaC: Number(r.temperatura_salida_c),
      tokenQr: r.token_qr,
      pesoTotalNetoKg: Number(r.peso_total_neto_kg),
      piezasTotales: r.piezas_totales,
      items: r.items,
      estado: r.estado,
      fechaDespacho: r.fecha_despacho,
      notas: r.novedades,
    }));
  }
};
