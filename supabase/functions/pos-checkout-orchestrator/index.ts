// Supabase Edge Function: pos-checkout-orchestrator
// Desacopla la lógica pesada de venta y validación fuera de triggers de PostgreSQL

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-timestamp',
};

interface CheckoutItem {
  producto_id: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  iva: number;
}

interface CheckoutPayload {
  empresa_id: string;
  caja_id: string;
  turno_id: string;
  cliente_id?: string;
  items: CheckoutItem[];
  metodo_pago: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'MIXTO';
  monto_recibido: number;
  cambio: number;
  total_venta: number;
  requiere_factura_electronica?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Validar autenticación activa del operador POS
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: '42501', message: 'No autenticado o sesión expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: CheckoutPayload = await req.json();

    // 2. Validación de reglas de negocio en la capa de cómputo (Edge)
    if (!payload.items || payload.items.length === 0) {
      return new Response(
        JSON.stringify({ code: 'P0001', message: 'El carrito de venta no contiene productos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cálculo matemático determinista de subtotales para evitar desbordes en SQL
    let totalCalculado = 0;
    for (const item of payload.items) {
      if (item.cantidad <= 0 || item.precio_unitario <= 0) {
        return new Response(
          JSON.stringify({ code: '23514', message: `Cantidad o precio inválido para ${item.nombre}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const subtotalItem = (item.cantidad * item.precio_unitario) - (item.descuento || 0);
      totalCalculado += subtotalItem + (item.iva || 0);
    }

    // Tolerancia máxima de redondeo: $50 COP
    if (Math.abs(totalCalculado - payload.total_venta) > 50) {
      return new Response(
        JSON.stringify({ code: 'P0001', message: 'Inconsistencia en el total de la venta calculado' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Ejecución atómica ordenada en base de datos
    // Ordenamiento por producto_id para erradicar condiciones de carrera y deadlocks
    const itemsOrdenados = [...payload.items].sort((a, b) => a.producto_id.localeCompare(b.producto_id));

    const { data: rpcResult, error: dbError } = await supabaseClient.rpc(
      'fn_procesar_venta_pos_v2',
      {
        p_empresa_id: payload.empresa_id,
        p_caja_id: payload.caja_id,
        p_turno_id: payload.turno_id,
        p_cliente_id: payload.cliente_id || null,
        p_total: totalCalculado,
        p_metodo_pago: payload.metodo_pago,
        p_detalles: itemsOrdenados.map(it => ({
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          descuento: it.descuento || 0,
          iva: it.iva || 0
        }))
      }
    );

    if (dbError) {
      return new Response(
        JSON.stringify({ code: dbError.code || 'DB_ERROR', message: dbError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const consecutivo = rpcResult?.consecutivo || `POS-${Date.now().toString(36).toUpperCase()}`;
    const ventaId = rpcResult?.venta_id || crypto.randomUUID();

    // 4. Si requiere Facturación Electrónica DIAN/SIIGO, encolar asíncronamente
    let facturaEstado: 'NO_APLICA' | 'ENCOLADA' | 'EMITIDA' = 'NO_APLICA';
    if (payload.requiere_factura_electronica) {
      facturaEstado = 'ENCOLADA';
      // Edge runtime Background Task para no bloquear la respuesta HTTP al POS
      EdgeRuntime.waitUntil(
        (async () => {
          try {
            await supabaseClient.from('siigo_invoicing_queue').insert({
              empresa_id: payload.empresa_id,
              venta_id: ventaId,
              status: 'PENDIENTE',
              payload: { consecutivo, total: totalCalculado, items: payload.items }
            });
          } catch (err) {
            console.error('Error encolando factura electrónica:', err);
          }
        })()
      );
    }

    return new Response(
      JSON.stringify({
        venta_id: ventaId,
        consecutivo,
        fecha_transaccion: new Date().toISOString(),
        total: totalCalculado,
        factura_electronica_estado: facturaEstado
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ code: '500', message: error.message || 'Error interno en Edge Function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
