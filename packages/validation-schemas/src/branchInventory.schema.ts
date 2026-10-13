import { z } from 'zod';

/**
 * Tipos de Bodega en la jerarquía del ERP
 */
export const TipoBodegaEnum = z.enum([
  'PRINCIPAL',
  'PUNTO_VENTA',
  'SECUNDARIA',
  'TRANSITO',
  'AVERIAS'
]);
export type TipoBodega = z.infer<typeof TipoBodegaEnum>;

/**
 * Esquema de Bodega / Sucursal en la arquitectura de inventario multi-sucursal
 */
export const BranchWarehouseDefinitionSchema = z.object({
  id: z.string().min(1, 'El ID de bodega es obligatorio'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres').toUpperCase(),
  descripcion: z.string().optional(),
  ubicacion: z.string().optional(),
  tipo: TipoBodegaEnum.default('PUNTO_VENTA'),
  bodegaPadreId: z.string().nullable().optional(),
  esPuntoVenta: z.boolean().default(false),
  activa: z.boolean().default(true),
  esencial: z.boolean().default(false),
});
export type BranchWarehouseDefinition = z.infer<typeof BranchWarehouseDefinitionSchema>;

/**
 * Esquema de Validación de Abastecimiento / Traslado Inmediato a Punto de Venta
 * Regla constitucional: No se puede abastecer si la bodega de origen no cuenta con saldo suficiente.
 */
export const BranchTransferValidationSchema = z.object({
  bodegaOrigenId: z.string().min(1, 'La bodega de origen es obligatoria'),
  bodegaDestinoId: z.string().min(1, 'La bodega de destino (sucursal) es obligatoria'),
  productoId: z.string().min(1, 'El producto es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  nombreProducto: z.string().min(1, 'El nombre del producto es obligatorio'),
  cantidad: z.number().positive('La cantidad a transferir debe ser mayor a 0'),
  unidadMedida: z.enum(['KG', 'UNIDAD', 'GRAMO']).default('KG'),
  stockDisponibleOrigen: z.number().min(0, 'El stock disponible no puede ser negativo'),
  lote: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  motivo: z.string().default('ABASTECIMIENTO_SUCURSAL'),
  usuarioResponsable: z.string().min(1, 'El usuario responsable es obligatorio'),
}).refine(
  (data) => data.bodegaOrigenId !== data.bodegaDestinoId,
  {
    message: 'La bodega de origen y la sucursal de destino no pueden ser la misma.',
    path: ['bodegaDestinoId'],
  }
).refine(
  (data) => data.cantidad <= data.stockDisponibleOrigen,
  {
    message: 'La cantidad solicitada supera el stock disponible en la Bodega Principal origen.',
    path: ['cantidad'],
  }
);
export type BranchTransferValidation = z.infer<typeof BranchTransferValidationSchema>;

/**
 * Esquema de Ítem en Solicitud de Reabastecimiento
 */
export const BranchReplenishmentItemSchema = z.object({
  productoId: z.string().min(1, 'ID de producto requerido'),
  sku: z.string().min(1, 'SKU requerido'),
  nombreProducto: z.string().min(1, 'Nombre requerido'),
  unidadMedida: z.enum(['KG', 'UNIDAD', 'GRAMO']).default('KG'),
  cantidadSolicitada: z.number().positive('La cantidad debe ser mayor a 0'),
  stockActualSucursal: z.number().min(0).default(0),
  bufferSeguridad: z.number().min(0).default(0),
});
export type BranchReplenishmentItem = z.infer<typeof BranchReplenishmentItemSchema>;

/**
 * Esquema de Solicitud de Reabastecimiento desde Punto de Venta a Bodega Principal
 */
export const BranchReplenishmentRequestSchema = z.object({
  id: z.string().optional(),
  sucursalId: z.string().min(1, 'La sucursal solicitante es requerida'),
  bodegaPrincipalId: z.string().min(1, 'La bodega principal de despacho es requerida'),
  items: z.array(BranchReplenishmentItemSchema).min(1, 'Debe incluir al menos un producto a solicitar'),
  prioridad: z.enum(['NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
  justificacion: z.string().optional(),
  solicitadoPor: z.string().min(1, 'El nombre del solicitante es requerido'),
  fechaSolicitud: z.string().default(() => new Date().toISOString()),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'DESPACHADO', 'RECHAZADO']).default('PENDIENTE'),
});
export type BranchReplenishmentRequest = z.infer<typeof BranchReplenishmentRequestSchema>;

/**
 * Filtro de Consulta para Reportes de Venta por Sucursal
 */
export const BranchSalesReportFilterSchema = z.object({
  sucursalId: z.string().optional().default('TODAS'),
  fechaInicio: z.string().min(10, 'La fecha inicial es requerida (YYYY-MM-DD)'),
  fechaFin: z.string().min(10, 'La fecha final es requerida (YYYY-MM-DD)'),
  metodoPago: z.enum(['EFECTIVO', 'NEQUI', 'TARJETA', 'TRANSFERENCIA', 'CREDITO', 'MIXTO', 'TODOS']).default('TODOS'),
  agrupacion: z.enum(['DIA', 'MES', 'PRODUCTO', 'METODO_PAGO']).default('DIA'),
});
export type BranchSalesReportFilter = z.infer<typeof BranchSalesReportFilterSchema>;

/**
 * Resumen Financiero y Operativo por Sucursal
 * Cumple con la regla de redondeo entero COP (Math.round).
 */
export const BranchSalesSummarySchema = z.object({
  sucursalId: z.string(),
  sucursalNombre: z.string(),
  totalVentasCOP: z.number().int('El total en COP debe ser un entero exacto'),
  totalKilos: z.number().min(0),
  totalUnidades: z.number().int().min(0),
  ticketsCount: z.number().int().min(0),
  ticketPromedioCOP: z.number().int('El ticket promedio en COP debe ser un entero exacto'),
  desgloseMediosPago: z.record(z.string(), z.number().int()),
});
export type BranchSalesSummary = z.infer<typeof BranchSalesSummarySchema>;
