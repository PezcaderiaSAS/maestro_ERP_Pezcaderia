import { load, save } from './localDb';
import {
  RecepcionBucaramangaSchema,
  calcularLiquidacionBucaramanga,
  type RecepcionBucaramanga,
  type PesajeCanastillaBucaramanga,
  type LiquidacionBucaramangaResult,
} from '../../packages/validation-schemas/src/purchasesBucaramanga.schema';
import type { ResultadoOperacion } from '../types/common.types';
import { getSupabaseClient } from '../lib/supabase';
import { cashService } from './cashService';
import type { MetodoPago, MovimientoCaja } from '../types/cash.types';

export interface PedidoCompraBucaramanga {
  id: string;
  consecutivo: string;
  proveedorId: string;
  proveedorNombre: string;
  ciudadOrigen: string; // Ej. Cartagena, Buenaventura, Barrancabermeja
  fechaAcordada: string;
  especiesEstimadas: Array<{
    sku: string;
    nombre: string;
    kilosEstimados: number;
    precioPactadoKg: number;
  }>;
  fleteEstimadoTotal: number;
  anticipoMonto: number;
  anticipoMetodo: 'TRANSFERENCIA_BANCARIA' | 'EFECTIVO';
  anticipoComprobante?: string;
  estado: 'CREADO' | 'EN_TRANSITO' | 'RECIBIDO_TOTAL' | 'CANCELADO';
  notas?: string;
  createdAt: string;
}

export interface RecepcionBucaramangaCompleta extends RecepcionBucaramanga {
  id: string;
  fechaRecepcion: string;
  liquidacion: LiquidacionBucaramangaResult;
  lotesGenerados: Array<{
    batchNumber: string;
    sku: string;
    productName: string;
    kilosNetos: number;
    landedCostKg: number;
    bodegaId: string;
  }>;
}

const STORAGE_KEY_ORDERS = 'purchases_bcm_orders';
const STORAGE_KEY_RECEPTIONS = 'purchases_bcm_receptions';

/**
 * Obtiene todos los pedidos previos registrados para Bucaramanga
 */
export function obtenerPedidosCompraBucaramanga(): PedidoCompraBucaramanga[] {
  return load<PedidoCompraBucaramanga[]>(STORAGE_KEY_ORDERS, [
    {
      id: 'ord-bcm-001',
      consecutivo: 'ORD-BCM-2026-001',
      proveedorId: 'prov-caribe-01',
      proveedorNombre: 'Comercializadora Pesquera del Caribe (Cartagena)',
      ciudadOrigen: 'Cartagena',
      fechaAcordada: new Date().toISOString(),
      especiesEstimadas: [
        { sku: 'SIERRA-01', nombre: 'Sierra Entera Fresca', kilosEstimados: 250, precioPactadoKg: 20000 },
        { sku: 'PARGO-01', nombre: 'Pargo Rojo Entero', kilosEstimados: 180, precioPactadoKg: 32000 },
      ],
      fleteEstimadoTotal: 350000,
      anticipoMonto: 2000000,
      anticipoMetodo: 'TRANSFERENCIA_BANCARIA',
      anticipoComprobante: 'TRANSF-BANCOLOMBIA-9921',
      estado: 'EN_TRANSITO',
      notas: 'Furgón Thermo King con placa WDF-452. Llega con hielo en escamas.',
      createdAt: new Date().toISOString(),
    },
  ]);
}

/**
 * Registra un nuevo pedido previo con proveedor foráneo
 */
export function crearPedidoCompraBucaramanga(
  datos: Omit<PedidoCompraBucaramanga, 'id' | 'consecutivo' | 'createdAt'>
): PedidoCompraBucaramanga {
  const existentes = obtenerPedidosCompraBucaramanga();
  const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const consecutivo = `ORD-BCM-${hoyStr}-${(existentes.length + 1).toString().padStart(3, '0')}`;

  const nuevoPedido: PedidoCompraBucaramanga = {
    ...datos,
    id: `ord-bcm-${Date.now()}`,
    consecutivo,
    createdAt: new Date().toISOString(),
  };

  const actualizados = [nuevoPedido, ...existentes];
  save(STORAGE_KEY_ORDERS, actualizados);
  return nuevoPedido;
}

/**
 * Obtiene el historial de recepciones en bodega Bucaramanga
 */
export function obtenerRecepcionesBucaramanga(): RecepcionBucaramangaCompleta[] {
  return load<RecepcionBucaramangaCompleta[]>(STORAGE_KEY_RECEPTIONS, []);
}

/**
 * Registra la recepción física con pesaje en báscula, prorrateo de flete y liquidación
 */
export async function registrarRecepcionBucaramanga(
  datos: RecepcionBucaramanga
): Promise<ResultadoOperacion<{ recepcion: RecepcionBucaramangaCompleta }>> {
  try {
    // 1. Validar esquema Zod (lanza bloqueo sanitario si temp > 4°C en fresco o > -15°C en congelado)
    const validacion = RecepcionBucaramangaSchema.safeParse(datos);
    if (!validacion.success) {
      const msg = validacion.error.issues.map((i) => i.message).join(' | ');
      return { data: null, error: `Error de Validación: ${msg}` };
    }

    // 2. Liquidación matemática determinista y Landed Cost
    const liquidacion = calcularLiquidacionBucaramanga(
      datos.crates,
      datos.totalFreightCost,
      datos.advancePaymentDeducted
    );

    const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const recepcionId = `rec-bcm-${Date.now()}`;

    // 3. Generar lotes FEFO para cada canastilla
    const lotesGenerados = liquidacion.cratesCalculadas.map((c) => ({
      batchNumber: `LOT-BCM-${hoyStr}-${c.sku}-${c.crateNumber}`,
      sku: c.sku,
      productName: c.productName,
      kilosNetos: c.netWeightKg,
      landedCostKg: c.landedCostKg,
      bodegaId: datos.crates.find((cr) => cr.crateNumber === c.crateNumber)?.warehouseId || 'cava-principal',
    }));

    const recepcionCompleta: RecepcionBucaramangaCompleta = {
      ...datos,
      id: recepcionId,
      fechaRecepcion: new Date().toISOString(),
      liquidacion,
      lotesGenerados,
    };

    // 4. Intentar persistencia transaccional en Supabase RPC si está conectado
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.rpc('rpc_liquidar_recepcion_bucaramanga', {
          p_tenant_id: '00000000-0000-0000-0000-000000000000',
          p_branch_id: '00000000-0000-0000-0000-000000000000',
          p_reception_data: {
            purchase_order_id: datos.purchaseOrderId || null,
            reception_number: datos.receptionNumber,
            supplier_id: datos.supplierId,
            supplier_name: datos.supplierName,
            truck_plate: datos.truckPlate,
            transport_company: datos.transportCompany || '',
            shipping_guide_number: datos.shippingGuideNumber || '',
            driver_name: datos.driverName || '',
            refrigeration_temp_c: datos.refrigerationTempC,
            sensory_status: datos.sensoryStatus,
            inspector_name: datos.inspectorName,
            total_crates: liquidacion.totalCrates,
            gross_weight_kg: liquidacion.totalGrossWeightKg,
            crate_tare_kg: liquidacion.totalTareKg,
            ice_deduction_kg: liquidacion.totalIceKg,
            net_weight_kg: liquidacion.totalNetWeightKg,
            total_purchase_cost: liquidacion.totalPurchaseCost,
            total_freight_cost: liquidacion.totalFreightCost,
            landed_cost_total: liquidacion.landedCostTotal,
            advance_deducted: liquidacion.advancePaymentDeducted,
            balance_to_pay: liquidacion.balanceToPaySupplier,
            payment_status: datos.paymentStatus,
            notes: datos.notes || '',
          },
          p_crates: datos.crates.map((c) => {
            const calc = liquidacion.cratesCalculadas.find((cc) => cc.crateNumber === c.crateNumber);
            return {
              crate_number: c.crateNumber,
              sku: c.sku,
              product_name: c.productName,
              crate_tare_kg: c.crateTareKg,
              gross_weight_kg: c.grossWeightKg,
              ice_deduction_pct: c.iceDeductionPct,
              ice_deduction_kg: calc?.iceWeightKg || 0,
              net_weight_kg: calc?.netWeightKg || c.grossWeightKg - c.crateTareKg,
              unit_cost_origin_kg: c.unitCostOriginKg,
              prorated_freight_kg: calc?.proratedFreightKg || 0,
              landed_cost_kg: calc?.landedCostKg || c.unitCostOriginKg,
              warehouse_id: c.warehouseId,
              shelf_life_days: c.shelfLifeDays,
            };
          }),
          p_actor_id: '00000000-0000-0000-0000-000000000000',
        });
      }
    } catch {
      // Fallback offline a persistencia local
    }

    // 5. Guardar en local storage resiliente
    const existentes = obtenerRecepcionesBucaramanga();
    save(STORAGE_KEY_RECEPTIONS, [recepcionCompleta, ...existentes]);

    // 6. Si venía de un pedido previo, actualizar su estado a RECIBIDO_TOTAL
    if (datos.purchaseOrderId) {
      const pedidos = obtenerPedidosCompraBucaramanga();
      const pedidosActualizados = pedidos.map((p) =>
        p.id === datos.purchaseOrderId ? { ...p, estado: 'RECIBIDO_TOTAL' as const } : p
      );
      save(STORAGE_KEY_ORDERS, pedidosActualizados);
    }

    return { data: { recepcion: recepcionCompleta }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error inesperado procesando la recepción' };
  }
}

/**
 * Conecta una recepción de camión en Bucaramanga con la caja activa
 * para debitar automáticamente flete y/o saldo al proveedor de contado
 */
export function liquidarEgresoCajaRecepcion(params: {
  cajaId: string;
  turnoId: string;
  recepcion: RecepcionBucaramangaCompleta;
  pagarFlete: boolean;
  metodoPagoFlete?: MetodoPago;
  pagarProveedor: boolean;
  metodoPagoProveedor?: MetodoPago;
  usuarioId: string;
}): { egresosRegistrados: MovimientoCaja[]; error: string | null } {
  const egresos: MovimientoCaja[] = [];

  try {
    // 1. Pagar Flete si aplica
    if (params.pagarFlete && params.recepcion.liquidacion.totalFreightCost > 0) {
      const resFlete = cashService.registrarEgresoOperativo({
        turnoId: params.turnoId,
        cajaId: params.cajaId,
        categoriaEgreso: 'FLETE_TRANSPORTE',
        metodoPago: params.metodoPagoFlete || 'EFECTIVO',
        monto: params.recepcion.liquidacion.totalFreightCost,
        concepto: `Flete Furgón ${params.recepcion.truckPlate} - ${params.recepcion.transportCompany || 'Transportador'}`,
        referenciaId: params.recepcion.receptionNumber,
        usuarioId: params.usuarioId,
        metadata: {
          placaCamion: params.recepcion.truckPlate,
          numeroGuia: params.recepcion.shippingGuideNumber,
          consecutivoRecepcion: params.recepcion.receptionNumber,
          proveedorNombre: params.recepcion.supplierName,
        },
      });

      if (resFlete.error) {
        return { egresosRegistrados: egresos, error: `Flete: ${resFlete.error}` };
      }
      if (resFlete.data) egresos.push(resFlete.data);
    }

    // 2. Pagar Saldo al Proveedor si aplica
    if (params.pagarProveedor && params.recepcion.liquidacion.balanceToPaySupplier > 0) {
      const resProv = cashService.registrarEgresoOperativo({
        turnoId: params.turnoId,
        cajaId: params.cajaId,
        categoriaEgreso: 'PAGO_PROVEEDOR_PESCADO',
        metodoPago: params.metodoPagoProveedor || 'EFECTIVO',
        monto: params.recepcion.liquidacion.balanceToPaySupplier,
        concepto: `Liquidación Pescado ${params.recepcion.supplierName} (${params.recepcion.liquidacion.totalNetWeightKg.toLocaleString()} kg)`,
        referenciaId: params.recepcion.receptionNumber,
        usuarioId: params.usuarioId,
        metadata: {
          proveedorId: params.recepcion.supplierId,
          proveedorNombre: params.recepcion.supplierName,
          consecutivoRecepcion: params.recepcion.receptionNumber,
          kilosNetos: params.recepcion.liquidacion.totalNetWeightKg,
        },
      });

      if (resProv.error) {
        return { egresosRegistrados: egresos, error: `Proveedor: ${resProv.error}` };
      }
      if (resProv.data) egresos.push(resProv.data);
    }

    return { egresosRegistrados: egresos, error: null };
  } catch (e: any) {
    return { egresosRegistrados: egresos, error: e.message || 'Error procesando los egresos de caja' };
  }
}

