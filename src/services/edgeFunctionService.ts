import { getSupabaseClient } from '../lib/supabase';
import { safeDatabaseExecute, ApiResponse } from '../lib/safeApi';

export interface PosCheckoutItemPayload {
  producto_id: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  iva: number;
}

export interface PosCheckoutRequest {
  empresa_id: string;
  caja_id: string;
  turno_id: string;
  cliente_id?: string;
  items: PosCheckoutItemPayload[];
  metodo_pago: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'MIXTO';
  monto_recibido: number;
  cambio: number;
  total_venta: number;
  requiere_factura_electronica?: boolean;
}

export interface PosCheckoutResponse {
  venta_id: string;
  consecutivo: string;
  fecha_transaccion: string;
  total: number;
  factura_electronica_estado: 'NO_APLICA' | 'ENCOLADA' | 'EMITIDA';
  dian_cufe?: string;
}

/**
 * Cliente de invocación para la capa de API intermedia en Supabase Edge Functions.
 * Desacopla la orquestación comercial compleja de la base de datos PostgreSQL.
 */
export const edgeFunctionService = {
  /**
   * Ejecuta el proceso de checkout en el punto de venta a través de la Edge Function
   */
  async procesarVentaPOS(
    payload: PosCheckoutRequest
  ): Promise<ApiResponse<PosCheckoutResponse>> {
    return safeDatabaseExecute<PosCheckoutResponse>('edge_pos_checkout', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.functions.invoke<PosCheckoutResponse>(
        'pos-checkout-orchestrator',
        {
          body: payload,
          headers: {
            'x-client-timestamp': new Date().toISOString(),
          },
        }
      );

      if (error) {
        return { data: null, error };
      }

      return { data: data ?? null, error: null };
    });
  },

  /**
   * Encola la emisión de factura electrónica en SIIGO sin bloquear la terminal POS
   */
  async emitirFacturaElectronicaSiigo(
    ventaId: string,
    empresaId: string
  ): Promise<ApiResponse<{ encolado: boolean; mensaje: string }>> {
    return safeDatabaseExecute('edge_siigo_invoice', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.functions.invoke(
        'siigo-electronic-invoicing',
        {
          body: { venta_id: ventaId, empresa_id: empresaId },
        }
      );

      if (error) {
        return { data: null, error };
      }

      return { data: data ?? null, error: null };
    });
  },
};
