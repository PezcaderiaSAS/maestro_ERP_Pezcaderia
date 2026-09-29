import { z } from 'zod';

export const ModalidadVentaEnum = z.enum([
  'PESO_DIRECTO',
  'CATCH_WEIGHT_PIEZAS',
  'UNIDADES_FIJAS'
]);
export type ModalidadVenta = z.infer<typeof ModalidadVentaEnum>;

export const TipoCorteEnum = z.enum([
  'entero',
  'eviscerado',
  'filete_con_piel',
  'filete_sin_piel',
  'posta',
  'porciones',
  'mariposa'
]);
export type TipoCorte = z.infer<typeof TipoCorteEnum>;

export const TipoEmpaqueEnum = z.enum([
  'vacio',
  'hielo',
  'canastilla',
  'granel',
  'atmosfera_modificada'
]);
export type TipoEmpaque = z.infer<typeof TipoEmpaqueEnum>;

/**
 * Especificaciones de alistamiento registradas por el vendedor
 */
export const B2BOrderLineSpecsSchema = z.object({
  corte: TipoCorteEnum.default('entero'),
  empaque: TipoEmpaqueEnum.default('hielo'),
  temperaturaObjetivoC: z.number().min(-30).max(15).default(2),
  notasAlistamiento: z.string().max(500).optional(),
});
export type B2BOrderLineSpecs = z.infer<typeof B2BOrderLineSpecsSchema>;

/**
 * Configuración de modalidad Catch Weight Dual
 */
export const CatchWeightConfigSchema = z.object({
  modalidad: ModalidadVentaEnum.default('PESO_DIRECTO'),
  piezasSolicitadas: z.number().int().positive().optional(),
  calibreMinGramos: z.number().positive().optional(),
  calibreMaxGramos: z.number().positive().optional(),
  pesoEstimadoNominalKg: z.number().positive().optional(),
}).refine(data => {
  if (data.modalidad === 'CATCH_WEIGHT_PIEZAS') {
    return !!data.piezasSolicitadas && data.piezasSolicitadas > 0;
  }
  return true;
}, {
  message: 'Para modalidad Catch Weight se debe especificar la cantidad de piezas solicitadas.',
  path: ['piezasSolicitadas']
}).refine(data => {
  if (data.calibreMinGramos && data.calibreMaxGramos) {
    return data.calibreMinGramos <= data.calibreMaxGramos;
  }
  return true;
}, {
  message: 'El calibre mínimo no puede ser superior al calibre máximo.',
  path: ['calibreMinGramos']
});
export type CatchWeightConfig = z.infer<typeof CatchWeightConfigSchema>;

/**
 * Pesaje real registrado en báscula durante el alistamiento (Packing)
 */
export const PesajeAlistamientoSchema = z.object({
  lineaPedidoId: z.string().min(1, 'El ID de la línea es requerido'),
  productoId: z.string().min(1, 'El ID del producto es requerido'),
  modalidad: ModalidadVentaEnum.default('PESO_DIRECTO'),
  pesoNominalKg: z.number().positive('El peso nominal debe ser positivo'),
  pesoRealKg: z.number().positive('El peso real en báscula debe ser mayor a 0'),
  piezasAlistadas: z.number().int().positive().optional(),
  calibreMinGramos: z.number().positive().optional(),
  calibreMaxGramos: z.number().positive().optional(),
  precioUnitarioPactado: z.number().min(0, 'El precio no puede ser negativo'),
  toleranciaPorcentaje: z.number().min(0).max(100).default(10),
  temperaturaProductoC: z.number().min(-30).max(15, 'Temperatura inválida para productos perecederos'),
  loteFefo: z.string().min(1, 'El lote FEFO es obligatorio para trazabilidad'),
  operarioId: z.string().min(1, 'El operario de pesaje es requerido'),
  observaciones: z.string().max(500).optional(),
});
export type PesajeAlistamiento = z.infer<typeof PesajeAlistamientoSchema>;

/**
 * Detalle de cada ítem en la remisión WMS
 */
export const WmsDispatchItemSchema = z.object({
  lineaPedidoId: z.string().min(1),
  productoId: z.string().min(1),
  nombreProducto: z.string().min(1),
  pesoDespachadoKg: z.number().positive(),
  piezasDespachadas: z.number().int().positive().optional(),
  precioUnitario: z.number().min(0),
  subtotal: z.number().min(0),
  loteFefo: z.string().min(1),
  temperaturaSalidaC: z.number().min(-30).max(15),
  corte: TipoCorteEnum.optional(),
  empaque: TipoEmpaqueEnum.optional(),
});
export type WmsDispatchItem = z.infer<typeof WmsDispatchItemSchema>;

/**
 * Remisión de despacho WMS con Token QR para transportador
 */
export const WmsDispatchRemisionSchema = z.object({
  remisionId: z.string().uuid().optional(),
  numeroRemision: z.string().min(1, 'El número de remisión es obligatorio'),
  pedidoId: z.string().min(1, 'El ID del pedido es obligatorio'),
  clienteId: z.string().min(1, 'El cliente es obligatorio'),
  clienteNombre: z.string().min(1, 'El nombre del cliente es obligatorio'),
  direccionEntrega: z.string().min(1, 'La dirección de entrega es obligatoria'),
  transportistaNombre: z.string().min(1, 'El nombre del conductor/transportista es obligatorio'),
  placaVehiculo: z.string().min(3).max(15, 'Placa de vehículo inválida'),
  temperaturaSalidaC: z.number().min(-30).max(15, 'Temperatura de salida fuera de rango'),
  tokenQr: z.string().min(8, 'Token QR de remisión inválido'),
  pesoTotalNetoKg: z.number().positive('El peso total debe ser positivo'),
  piezasTotales: z.number().int().nonnegative().optional(),
  items: z.array(WmsDispatchItemSchema).min(1, 'Debe incluir al menos un producto alistado'),
  estado: z.enum(['EN_PREPARACION', 'LISTO', 'EN_RUTA', 'ENTREGADO', 'NOVEDAD']).default('EN_RUTA'),
  fechaDespacho: z.string().optional(),
  notas: z.string().max(1000).optional(),
});
export type WmsDispatchRemision = z.infer<typeof WmsDispatchRemisionSchema>;

// ==========================================
// ALGORITMOS CIENTÍFICOS DETERMINISTAS
// ==========================================

/**
 * Valida la tolerancia porcentual entre el peso nominal y el peso real en báscula.
 */
export function validateWeightTolerance(
  nominalKg: number,
  realKg: number,
  tolerancePercent = 10
): {
  isWithinTolerance: boolean;
  variancePercent: number;
  diffKg: number;
} {
  if (nominalKg <= 0) {
    return { isWithinTolerance: false, variancePercent: 0, diffKg: 0 };
  }
  const diffKg = Number((realKg - nominalKg).toFixed(3));
  const variancePercent = Number(((diffKg / nominalKg) * 100).toFixed(2));
  const isWithinTolerance = Math.abs(variancePercent) <= tolerancePercent;

  return {
    isWithinTolerance,
    variancePercent,
    diffKg,
  };
}

/**
 * Valida si las piezas alistadas en báscula cumplen el rango de calibre solicitado.
 * Ej: 5 truchas con peso total 2.400 kg -> 480 g/pieza (dentro de 450 - 500 g).
 */
export function validateCalibrePieceWeight(
  pesoRealKg: number,
  piezas: number,
  minGramos?: number,
  maxGramos?: number
): {
  pesoPromedioGramos: number;
  isWithinCalibre: boolean;
  motivo?: string;
} {
  if (piezas <= 0 || pesoRealKg <= 0) {
    return { pesoPromedioGramos: 0, isWithinCalibre: false, motivo: 'Piezas o peso inválidos' };
  }

  const pesoPromedioGramos = Math.round((pesoRealKg * 1000) / piezas);

  if (minGramos !== undefined && pesoPromedioGramos < minGramos) {
    return {
      pesoPromedioGramos,
      isWithinCalibre: false,
      motivo: `El peso promedio (${pesoPromedioGramos}g) está por debajo del calibre mínimo (${minGramos}g)`,
    };
  }

  if (maxGramos !== undefined && pesoPromedioGramos > maxGramos) {
    return {
      pesoPromedioGramos,
      isWithinCalibre: false,
      motivo: `El peso promedio (${pesoPromedioGramos}g) excede el calibre máximo (${maxGramos}g)`,
    };
  }

  return {
    pesoPromedioGramos,
    isWithinCalibre: true,
  };
}

/**
 * Calcula el total facturado a partir del peso real y el precio unitario pactado por Kg.
 */
export function calculateCatchWeightTotal(
  pesoRealKg: number,
  precioUnitarioKg: number
): number {
  return Math.round(Number((pesoRealKg * precioUnitarioKg).toFixed(2)));
}
