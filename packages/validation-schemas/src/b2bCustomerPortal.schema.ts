/**
 * ============================================================================
 * LA PEZCADERIA ERP — ESQUEMAS DE VALIDACIÓN: PORTAL B2B HORECA
 * ============================================================================
 * Esquemas Zod para la validación estricta de pedidos de restaurantes/hoteles,
 * modalidades de corte marítimo, empaque térmico con hielo y plantillas recurrentes.
 */

import { z } from 'zod';

export const B2BProductCutSchema = z.enum([
  'ENTERO_FRESCO',
  'ENTERO_EVISCERADO',
  'FILETE_CON_PIEL',
  'FILETE_SIN_PIEL',
  'RODAJAS',
  'PORCIONES_CALIBRADAS',
  'OTRO_ESPECIAL',
]);

export const B2BPackagingSchema = z.enum([
  'CAJA_TERMICA_HIELO',
  'BOLSA_VACIO',
  'CANASTILLA_RETORNABLE',
  'GRANEL_REFRIGERADO',
]);

export const B2BSaleModalitySchema = z.enum([
  'KILOGRAMOS_ESTIMADOS',
  'PIEZAS_FIJAS',
]);

export const B2BPaymentMethodSchema = z.enum([
  'CREDITO_B2B',
  'CONTADO_ANTICIPADO',
  'TRANSFERENCIA',
]);

export const B2BDeliveryScheduleSchema = z.enum([
  'MANANA',
  'TARDE',
  'URGENTE_MEDIODIA',
]);

export const B2BWeekDaySchema = z.enum([
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
]);

/**
 * Esquema para cada línea de producto en el pedido B2B HORECA
 */
export const B2BOrderLineInputSchema = z.object({
  productoId: z.string().min(1, 'El ID de producto es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  corte: B2BProductCutSchema,
  empaque: B2BPackagingSchema,
  modalidadVenta: B2BSaleModalitySchema,
  cantidadSolicitada: z.number().positive('La cantidad debe ser mayor a 0'),
  piezasEstimadas: z.number().int().nonnegative().optional(),
  precioPactadoCop: z.number().positive('El precio pactado debe ser mayor a 0'),
  observacionesCorte: z.string().max(300, 'Las observaciones no pueden exceder 300 caracteres').optional(),
});

/**
 * Esquema para la creación y envío de un pedido HORECA
 */
export const CreateB2BOrderInputSchema = z.object({
  clienteId: z.string().min(1, 'El ID de cliente es obligatorio'),
  clienteNombre: z.string().min(1, 'El nombre del cliente es obligatorio'),
  nit: z.string().min(1, 'El NIT o identificación es obligatorio'),
  sucursalEntrega: z.string().min(1, 'La sucursal de entrega es obligatoria'),
  direccionEntrega: z.string().min(1, 'La dirección de entrega es obligatoria'),
  telefonoContacto: z.string().optional(),
  fechaRequeridaEntrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  jornadaRequerida: B2BDeliveryScheduleSchema,
  formaPago: B2BPaymentMethodSchema,
  lineas: z.array(B2BOrderLineInputSchema).min(1, 'El pedido debe tener al menos un producto'),
  instruccionesCocina: z.string().max(500, 'Las instrucciones no pueden exceder 500 caracteres').optional(),
});

/**
 * Esquema para la configuración de una plantilla de pedido recurrente
 */
export const B2BRecurringTemplateSchema = z.object({
  id: z.string().optional(),
  clienteId: z.string().min(1, 'El ID de cliente es obligatorio'),
  nombrePlantilla: z.string().min(3, 'El nombre de la plantilla debe tener al menos 3 caracteres').max(100),
  diasSemana: z.array(B2BWeekDaySchema).min(1, 'Debe seleccionar al menos un día de la semana'),
  jornadaEntrega: z.enum(['MANANA', 'TARDE']),
  activa: z.boolean().default(true),
  lineas: z.array(B2BOrderLineInputSchema).min(1, 'La plantilla debe contener al menos un producto'),
});

// Inferencia de tipos TypeScript
export type B2BProductCut = z.infer<typeof B2BProductCutSchema>;
export type B2BPackaging = z.infer<typeof B2BPackagingSchema>;
export type B2BSaleModality = z.infer<typeof B2BSaleModalitySchema>;
export type B2BPaymentMethod = z.infer<typeof B2BPaymentMethodSchema>;
export type B2BDeliverySchedule = z.infer<typeof B2BDeliveryScheduleSchema>;
export type B2BWeekDay = z.infer<typeof B2BWeekDaySchema>;
export type B2BOrderLineInput = z.infer<typeof B2BOrderLineInputSchema>;
export type CreateB2BOrderInput = z.infer<typeof CreateB2BOrderInputSchema>;
export type B2BRecurringTemplate = z.infer<typeof B2BRecurringTemplateSchema>;
