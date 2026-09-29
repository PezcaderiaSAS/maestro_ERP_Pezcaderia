import { z } from 'zod';

export const EstadoTrasladoInternoEnum = z.enum([
  'SOLICITADO',
  'EN_ALISTAMIENTO',
  'EN_TRANSITO',
  'RECIBIDO',
  'RECIBIDO_CON_NOVEDAD',
  'CANCELADO'
]);
export type EstadoTrasladoInterno = z.infer<typeof EstadoTrasladoInternoEnum>;

export const PrioridadTrasladoEnum = z.enum([
  'NORMAL',
  'URGENTE',
  'CRITICA'
]);
export type PrioridadTraslado = z.infer<typeof PrioridadTrasladoEnum>;

export const EstadoItemTrasladoEnum = z.enum([
  'PENDIENTE',
  'ALISTADO',
  'FALTANTE_ORIGEN',
  'INCOMPLETO',
  'RECIBIDO_OK',
  'RECIBIDO_DISCREPANCIA'
]);
export type EstadoItemTraslado = z.infer<typeof EstadoItemTrasladoEnum>;

export const MotivoNovedadTrasladoEnum = z.enum([
  'DIFERENCIA_PESO',
  'ROTURA_EMPAQUE',
  'AGOTADO_BODEGA',
  'NO_ENTREGADO',
  'CALIDAD_DEFICIENTE',
  'OTRO'
]);
export type MotivoNovedadTraslado = z.infer<typeof MotivoNovedadTrasladoEnum>;

/**
 * Esquema de ítem dentro de un traslado interno
 */
export const InternalTransferItemSchema = z.object({
  id: z.string().optional(),
  productoId: z.string().min(1, 'El ID de producto es requerido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  unidadMedida: z.string().default('KG'),
  cantidadSolicitada: z.number().positive('La cantidad solicitada debe ser mayor a 0'),
  cantidadDespachada: z.number().min(0, 'La cantidad despachada no puede ser negativa').default(0),
  cantidadRecibida: z.number().min(0, 'La cantidad recibida no puede ser negativa').default(0),
  costoUnitario: z.number().min(0).default(0),
  loteFefo: z.string().optional(),
  fechaVencimientoLote: z.string().optional(),
  temperaturaC: z.number().min(-30).max(25).optional(),
  estadoItem: EstadoItemTrasladoEnum.default('PENDIENTE'),
  novedadMotivo: MotivoNovedadTrasladoEnum.optional(),
  novedadDetalle: z.string().max(500).optional(),
});
export type InternalTransferItem = z.infer<typeof InternalTransferItemSchema>;

/**
 * Esquema para crear una solicitud de reabastecimiento desde POS
 */
export const CreateInternalTransferRequestSchema = z.object({
  empresaId: z.string().optional(),
  bodegaOrigenId: z.string().min(1, 'La bodega origen es requerida'),
  bodegaOrigenNombre: z.string().optional(),
  bodegaDestinoId: z.string().min(1, 'La bodega destino (POS) es requerida'),
  bodegaDestinoNombre: z.string().optional(),
  prioridad: PrioridadTrasladoEnum.default('NORMAL'),
  solicitadoPor: z.string().min(1, 'El usuario solicitante es requerido'),
  observaciones: z.string().max(500).optional(),
  items: z.array(InternalTransferItemSchema).min(1, 'Debe incluir al menos un ítem para reabastecimiento'),
}).refine((data) => data.bodegaOrigenId !== data.bodegaDestinoId, {
  message: 'La bodega de origen y de destino no pueden ser la misma',
  path: ['bodegaDestinoId'],
});
export type CreateInternalTransferRequest = z.infer<typeof CreateInternalTransferRequestSchema>;

/**
 * Esquema para registrar el alistamiento y despacho en Bodega Principal
 */
export const ItemDespachoSchema = z.object({
  productoId: z.string().min(1),
  cantidadDespachada: z.number().min(0),
  loteFefo: z.string().min(1, 'El lote FEFO es obligatorio para trazabilidad en despacho'),
  fechaVencimientoLote: z.string().optional(),
  temperaturaC: z.number().min(-30).max(15).default(2),
  novedadMotivo: MotivoNovedadTrasladoEnum.optional(),
  novedadDetalle: z.string().max(500).optional(),
});

export const DispatchInternalTransferSchema = z.object({
  trasladoId: z.string().min(1, 'El ID del traslado es requerido'),
  despachadoPor: z.string().min(1, 'El nombre del bodeguero es requerido'),
  temperaturaSalidaC: z.number().min(-30).max(15).default(2),
  itemsDespachados: z.array(ItemDespachoSchema).min(1, 'Debe despachar al menos un ítem'),
  observacionesDespacho: z.string().max(500).optional(),
});
export type DispatchInternalTransfer = z.infer<typeof DispatchInternalTransferSchema>;

/**
 * Esquema para la verificación y checklist interactivo en POS
 */
export const ItemRecepcionChecklistSchema = z.object({
  productoId: z.string().min(1),
  cantidadRecibida: z.number().min(0, 'La cantidad recibida no puede ser negativa'),
  cantidadDespachadaOriginal: z.number().min(0),
  conforme: z.boolean(),
  novedadMotivo: MotivoNovedadTrasladoEnum.optional(),
  novedadDetalle: z.string().max(500).optional(),
}).refine((data) => {
  // Si no está conforme o las cantidades difieren, debe indicar motivo y detalle de la novedad
  if (!data.conforme || Math.abs(data.cantidadRecibida - data.cantidadDespachadaOriginal) > 0.001) {
    return !!data.novedadMotivo && !!data.novedadDetalle && data.novedadDetalle.trim().length >= 3;
  }
  return true;
}, {
  message: 'Cuando hay discrepancia o el ítem no está conforme, debe registrar el motivo y detalle de la novedad',
  path: ['novedadDetalle'],
});

export const ReceiveInternalTransferChecklistSchema = z.object({
  trasladoId: z.string().min(1, 'El ID de la guía de traslado es requerido'),
  recibidoPor: z.string().min(1, 'El responsable de recepción en POS es requerido'),
  itemsVerificados: z.array(ItemRecepcionChecklistSchema).min(1, 'Debe verificar todos los ítems recibidos'),
  observacionesRecepcion: z.string().max(500).optional(),
});
export type ReceiveInternalTransferChecklist = z.infer<typeof ReceiveInternalTransferChecklistSchema>;
