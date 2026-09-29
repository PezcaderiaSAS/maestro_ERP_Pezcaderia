import { z } from 'zod';

export const EstadoManifiestoEnum = z.enum([
  'PLANIFICADA',
  'EN_RUTA',
  'LIQUIDADA',
  'CANCELADA',
]);
export type EstadoManifiesto = z.infer<typeof EstadoManifiestoEnum>;

export const EstadoEntregaPedidoEnum = z.enum([
  'PENDIENTE',
  'ENTREGADO_TOTAL',
  'ENTREGADO_PARCIAL',
  'NO_ENTREGADO_RECHAZADO',
]);
export type EstadoEntregaPedido = z.infer<typeof EstadoEntregaPedidoEnum>;

export const FormaPagoRutaEnum = z.enum([
  'CREDITO_B2B',
  'EFECTIVO',
  'TRANSFERENCIA_DIGITAL',
  'MIXTO',
]);
export type FormaPagoRuta = z.infer<typeof FormaPagoRutaEnum>;

export const TipoGastoRutaEnum = z.enum([
  'COMBUSTIBLE',
  'PEAJE',
  'PARQUEADERO',
  'HIELO_REFRIGERACION',
  'VIATICO',
  'OTRO',
]);
export type TipoGastoRuta = z.infer<typeof TipoGastoRutaEnum>;

export const MotivoRechazoRutaEnum = z.enum([
  'EMPAQUE_AVERIADO',
  'CADENA_FRIO',
  'CALIBRE_INCORRECTO',
  'CLIENTE_CERRADO',
  'SIN_DINERO',
  'PRODUCTO_EQUIVOCADO',
  'OTRO',
]);
export type MotivoRechazoRuta = z.infer<typeof MotivoRechazoRutaEnum>;

export const DestinoDevolucionEnum = z.enum([
  'CUARENTENA_CALIDAD',
  'MERMA_DESCARTE',
  'REINGRESO_STOCK',
]);
export type DestinoDevolucion = z.infer<typeof DestinoDevolucionEnum>;

/**
 * Esquema para gastos de ruta (gasolina, peajes, hielo, etc.)
 */
export const RouteExpenseSchema = z.object({
  id: z.string().optional(),
  tipoGasto: TipoGastoRutaEnum,
  monto: z.number().positive('El monto del gasto debe ser mayor a 0'),
  numeroComprobante: z.string().optional(),
  descripcion: z.string().max(300).optional(),
});
export type RouteExpense = z.infer<typeof RouteExpenseSchema>;

/**
 * Esquema para productos devueltos / rechazados en entrega
 */
export const RouteReturnItemSchema = z.object({
  id: z.string().optional(),
  productoId: z.string().min(1, 'El ID de producto es requerido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  cantidadDevueltaKg: z.number().positive('La cantidad devuelta debe ser mayor a 0'),
  precioUnitario: z.number().min(0).default(0),
  montoDescontado: z.number().min(0).default(0),
  loteFefo: z.string().optional(),
  motivoRechazo: MotivoRechazoRutaEnum,
  destinoBodega: DestinoDevolucionEnum.default('CUARENTENA_CALIDAD'),
  observaciones: z.string().max(500).optional(),
});
export type RouteReturnItem = z.infer<typeof RouteReturnItemSchema>;

/**
 * Esquema para crear un nuevo manifiesto / planilla de ruta
 */
export const CreateRouteManifestSchema = z.object({
  conductorId: z.string().min(1, 'El conductor es requerido'),
  conductorNombre: z.string().min(1, 'El nombre del conductor es requerido'),
  conductorTelefono: z.string().optional(),
  vehiculoPlaca: z.string().min(5, 'La placa del vehículo es requerida').max(10),
  vehiculoTipo: z.string().optional(),
  zonaRuta: z.string().min(1, 'La zona de la ruta es requerida'),
  observaciones: z.string().max(500).optional(),
  pedidosIds: z.array(z.string().min(1)).min(1, 'Debe asignar al menos un pedido a la ruta'),
});
export type CreateRouteManifest = z.infer<typeof CreateRouteManifestSchema>;

/**
 * Esquema para registrar la entrega en sitio de un pedido
 */
export const RegisterDeliveryExecutionSchema = z.object({
  manifiestoId: z.string().min(1, 'El ID de manifiesto es requerido'),
  pedidoId: z.string().min(1, 'El ID de pedido es requerido'),
  estadoEntrega: EstadoEntregaPedidoEnum,
  formaPago: FormaPagoRutaEnum,
  montoOriginal: z.number().min(0),
  montoCobradoFinal: z.number().min(0),
  montoEfectivo: z.number().min(0).default(0),
  montoDigital: z.number().min(0).default(0),
  referenciaDigital: z.string().optional(),
  firmaClienteUrl: z.string().optional(),
  novedadObservaciones: z.string().max(500).optional(),
  devoluciones: z.array(RouteReturnItemSchema).optional().default([]),
}).refine((data) => {
  // Si la forma de pago es digital, se debe exigir referencia o comprobante
  if (data.formaPago === 'TRANSFERENCIA_DIGITAL' && data.montoCobradoFinal > 0) {
    return !!data.referenciaDigital && data.referenciaDigital.trim().length >= 3;
  }
  return true;
}, {
  message: 'Para pagos por transferencia digital debe ingresar el número de comprobante o referencia',
  path: ['referenciaDigital'],
}).refine((data) => {
  // Si la forma de pago es MIXTO, la suma de efectivo + digital debe coincidir con el total cobrado
  if (data.formaPago === 'MIXTO') {
    const suma = Math.round((data.montoEfectivo + data.montoDigital) * 100) / 100;
    const cobrado = Math.round(data.montoCobradoFinal * 100) / 100;
    return Math.abs(suma - cobrado) < 0.01;
  }
  return true;
}, {
  message: 'En pago mixto, la suma de efectivo y digital debe igualar el monto cobrado final',
  path: ['montoDigital'],
});
export type RegisterDeliveryExecution = z.infer<typeof RegisterDeliveryExecutionSchema>;

/**
 * Esquema para el cierre y liquidación final de la ruta del transportador
 */
export const SettleRouteManifestSchema = z.object({
  manifiestoId: z.string().min(1, 'El ID de manifiesto es requerido'),
  liquidadoPor: z.string().min(1, 'El responsable de tesorería/caja es requerido'),
  efectivoFisicoEntregado: z.number().min(0, 'El efectivo entregado no puede ser negativo'),
  gastos: z.array(RouteExpenseSchema).optional().default([]),
  observacionesLiquidacion: z.string().max(500).optional(),
});
export type SettleRouteManifest = z.infer<typeof SettleRouteManifestSchema>;

/**
 * Catálogo estandarizado de eventualidades e incidencias de ruta
 */
export const TipoIncidenciaRutaEnum = z.enum([
  'TRAFICO_BLOQUEO',
  'CLIENTE_APLAZA_HORA',
  'DIRECCION_ERRONEA',
  'FALLA_MECANICA',
  'DEMORA_MUELLE_RECEPCION',
  'OTRO',
]);
export type TipoIncidenciaRuta = z.infer<typeof TipoIncidenciaRutaEnum>;

/**
 * Esquema para registrar incidencias en tiempo real durante la ruta
 */
export const RouteIncidentSchema = z.object({
  id: z.string().optional(),
  manifiestoId: z.string().min(1, 'El manifiesto es requerido'),
  pedidoId: z.string().optional(),
  tipoIncidencia: TipoIncidenciaRutaEnum,
  descripcion: z.string().min(3, 'Debe describir la eventualidad').max(500),
  horaReporte: z.string().default(() => new Date().toISOString()),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
});
export type RouteIncident = z.infer<typeof RouteIncidentSchema>;

/**
 * Esquema para la confirmación y checklist de carga de furgón en bodega
 * con registro sanitario de temperatura de salida
 */
export const CheckinRouteLoadSchema = z.object({
  manifiestoId: z.string().min(1, 'El manifiesto es requerido'),
  temperaturaSalidaCelsius: z.number()
    .min(-30, 'Temperatura fuera de rango válido')
    .max(15, 'Temperatura excede el límite máximo permitido para perecederos'),
  pedidosConfirmados: z.array(z.string().min(1))
    .min(1, 'Debe confirmar la carga de al menos un pedido a bordo del vehículo'),
  observacionesCarga: z.string().max(500).optional(),
});
export type CheckinRouteLoad = z.infer<typeof CheckinRouteLoadSchema>;

/**
 * Esquema para registrar llegada en puerta / en sitio del cliente
 */
export const ArrivalCheckinSchema = z.object({
  manifiestoId: z.string().min(1, 'El manifiesto es requerido'),
  pedidoId: z.string().min(1, 'El pedido es requerido'),
  horaLlegada: z.string().default(() => new Date().toISOString()),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
});
export type ArrivalCheckin = z.infer<typeof ArrivalCheckinSchema>;
