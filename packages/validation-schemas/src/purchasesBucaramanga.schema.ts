import { z } from 'zod';

/**
 * Esquema de Cadena de Frío e Inspección Sanitaria al arribo a Bucaramanga
 * Resolución 776 de 2008 / Directrices INVIMA para transporte refrigerado
 */
export const CadenaFrioBucaramangaSchema = z.object({
  tipoProducto: z.enum(['FRESCO', 'CONGELADO'], {
    errorMap: () => ({ message: 'Debe especificar si el lote es FRESCO o CONGELADO' }),
  }),
  temperaturaFurgonC: z.number().min(-30).max(20),
  estadoSensorial: z.enum(['EXCELENTE', 'ACEPTABLE', 'RECHAZADO'], {
    errorMap: () => ({ message: 'Estado sensorial inválido' }),
  }),
  inspectorNombre: z.string().min(2, 'Debe registrar el nombre del inspector de recepción'),
  observaciones: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.tipoProducto === 'FRESCO') {
    if (data.temperaturaFurgonC > 4.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['temperaturaFurgonC'],
        message: 'BLOQUEO DE FRÍO: El pescado fresco supera los 4.0°C. Riesgo de descomposición.',
      });
    }
  } else if (data.tipoProducto === 'CONGELADO') {
    if (data.temperaturaFurgonC > -15.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['temperaturaFurgonC'],
        message: 'BLOQUEO DE FRÍO: El producto congelado debe llegar a menos de -15.0°C (óptimo -18.0°C).',
      });
    }
  }
});

export type CadenaFrioBucaramanga = z.infer<typeof CadenaFrioBucaramangaSchema>;

/**
 * Esquema de Pesaje Granular de Canastilla en Báscula
 * Con descuento de tara plástica (canastilla) y deducción por hielo en escamas/agua
 */
export const PesajeCanastillaBucaramangaSchema = z.object({
  crateNumber: z.number().int().positive('Número de canastilla inválido'),
  sku: z.string().min(1, 'El SKU o código de especie es requerido'),
  productName: z.string().min(1, 'El nombre de la especie es requerido'),
  crateTareKg: z.number().min(0, 'La tara de canastilla no puede ser negativa').default(2.0),
  grossWeightKg: z.number().positive('El peso bruto debe ser mayor a 0'),
  iceDeductionPct: z.number().min(0).max(30, 'La deducción por hielo no debe superar el 30%').default(0),
  unitCostOriginKg: z.number().positive('El costo unitario de compra en origen debe ser mayor a 0'),
  warehouseId: z.string().min(1, 'Debe seleccionar el cuarto frío o cava de destino'),
  shelfLifeDays: z.number().int().positive().default(5),
}).superRefine((data, ctx) => {
  if (data.grossWeightKg <= data.crateTareKg) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['grossWeightKg'],
      message: 'El peso bruto debe ser superior a la tara de la canastilla plástica.',
    });
  }
});

export type PesajeCanastillaBucaramanga = z.infer<typeof PesajeCanastillaBucaramangaSchema>;

/**
 * Esquema de Recepción Integral en Bodega Bucaramanga
 */
export const RecepcionBucaramangaSchema = z.object({
  receptionNumber: z.string().min(1, 'El consecutivo de recepción es requerido'),
  purchaseOrderId: z.string().optional(),
  supplierId: z.string().min(1, 'Debe seleccionar un proveedor registrado'),
  supplierName: z.string().min(1, 'Nombre del proveedor requerido'),
  truckPlate: z.string().min(5, 'Placa del vehículo inválida').max(10),
  transportCompany: z.string().optional(),
  shippingGuideNumber: z.string().optional(),
  driverName: z.string().optional(),
  refrigerationTempC: z.number(),
  tipoProducto: z.enum(['FRESCO', 'CONGELADO']),
  sensoryStatus: z.enum(['ACEPTADO', 'OBSERVACION', 'RECHAZADO']).default('ACEPTADO'),
  inspectorName: z.string().min(2, 'Inspector requerido'),
  crates: z.array(PesajeCanastillaBucaramangaSchema).min(1, 'Debe registrar al menos una canastilla pesada'),
  totalFreightCost: z.number().min(0, 'El costo del flete no puede ser negativo').default(0),
  advancePaymentDeducted: z.number().min(0, 'El anticipo deducido no puede ser negativo').default(0),
  paymentStatus: z.enum(['PENDIENTE', 'PAGADO_CONTADO', 'CREDITO']).default('PENDIENTE'),
  notes: z.string().max(500).optional(),
});

export type RecepcionBucaramanga = z.infer<typeof RecepcionBucaramangaSchema>;

/**
 * Funciones Matemáticas Puras Deterministas de Liquidación y Landed Cost
 */

export interface CalculoCanastillaResult {
  crateNumber: number;
  sku: string;
  productName: string;
  grossWeightKg: number;
  crateTareKg: number;
  iceWeightKg: number;
  netWeightKg: number;
  unitCostOriginKg: number;
  proratedFreightKg: number;
  landedCostKg: number;
  subtotalPurchase: number;
  subtotalLanded: number;
}

export interface LiquidacionBucaramangaResult {
  totalCrates: number;
  totalGrossWeightKg: number;
  totalTareKg: number;
  totalIceKg: number;
  totalNetWeightKg: number;
  totalFreightCost: number;
  proratedFreightPerKg: number;
  totalPurchaseCost: number;
  landedCostTotal: number;
  advancePaymentDeducted: number;
  balanceToPaySupplier: number;
  cratesCalculadas: CalculoCanastillaResult[];
}

/**
 * Calcula el peso neto de una canastilla individual
 */
export function calcularPesajeCanastilla(
  grossWeightKg: number,
  crateTareKg: number = 2.0,
  iceDeductionPct: number = 0
): { netWeightKg: number; iceWeightKg: number } {
  const pesoSinCanastilla = Math.max(0, grossWeightKg - crateTareKg);
  const iceWeightKg = Number(((pesoSinCanastilla * iceDeductionPct) / 100).toFixed(3));
  const netWeightKg = Number((pesoSinCanastilla - iceWeightKg).toFixed(3));
  return { netWeightKg, iceWeightKg };
}

/**
 * Liquida la recepción completa con prorrateo de flete por kilo puesto en Bucaramanga
 */
export function calcularLiquidacionBucaramanga(
  crates: PesajeCanastillaBucaramanga[],
  totalFreightCost: number = 0,
  advancePaymentDeducted: number = 0
): LiquidacionBucaramangaResult {
  let totalGrossWeightKg = 0;
  let totalTareKg = 0;
  let totalIceKg = 0;
  let totalNetWeightKg = 0;
  let totalPurchaseCost = 0;

  // Primer paso: calcular pesos netos acumulados
  const cratesConPesos = crates.map((crate) => {
    const { netWeightKg, iceWeightKg } = calcularPesajeCanastilla(
      crate.grossWeightKg,
      crate.crateTareKg,
      crate.iceDeductionPct
    );
    totalGrossWeightKg += crate.grossWeightKg;
    totalTareKg += crate.crateTareKg;
    totalIceKg += iceWeightKg;
    totalNetWeightKg += netWeightKg;
    const subtotal = Number((netWeightKg * crate.unitCostOriginKg).toFixed(2));
    totalPurchaseCost += subtotal;

    return {
      crate,
      netWeightKg,
      iceWeightKg,
      subtotal,
    };
  });

  // Segundo paso: calcular prorrateo de flete por kilo neto
  const proratedFreightPerKg =
    totalNetWeightKg > 0 ? Number((totalFreightCost / totalNetWeightKg).toFixed(2)) : 0;

  // Tercer paso: calcular landed cost por canastilla
  const cratesCalculadas: CalculoCanastillaResult[] = cratesConPesos.map(
    ({ crate, netWeightKg, iceWeightKg, subtotal }) => {
      const proratedFreightKg = proratedFreightPerKg;
      const landedCostKg = Number((crate.unitCostOriginKg + proratedFreightKg).toFixed(2));
      const subtotalLanded = Number((netWeightKg * landedCostKg).toFixed(2));

      return {
        crateNumber: crate.crateNumber,
        sku: crate.sku,
        productName: crate.productName,
        grossWeightKg: crate.grossWeightKg,
        crateTareKg: crate.crateTareKg,
        iceWeightKg,
        netWeightKg,
        unitCostOriginKg: crate.unitCostOriginKg,
        proratedFreightKg,
        landedCostKg,
        subtotalPurchase: subtotal,
        subtotalLanded,
      };
    }
  );

  const landedCostTotal = Number((totalPurchaseCost + totalFreightCost).toFixed(2));
  const balanceToPaySupplier = Number(
    Math.max(0, totalPurchaseCost - advancePaymentDeducted).toFixed(2)
  );

  return {
    totalCrates: crates.length,
    totalGrossWeightKg: Number(totalGrossWeightKg.toFixed(3)),
    totalTareKg: Number(totalTareKg.toFixed(3)),
    totalIceKg: Number(totalIceKg.toFixed(3)),
    totalNetWeightKg: Number(totalNetWeightKg.toFixed(3)),
    totalFreightCost,
    proratedFreightPerKg,
    totalPurchaseCost: Number(totalPurchaseCost.toFixed(2)),
    landedCostTotal,
    advancePaymentDeducted,
    balanceToPaySupplier,
    cratesCalculadas,
  };
}
