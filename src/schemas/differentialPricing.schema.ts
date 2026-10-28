// src/schemas/differentialPricing.schema.ts
// Esquemas Zod para Precios Diferenciales, Cotizaciones B2B e IndexedDB Multi-Tenant

import { z } from 'zod';

/**
 * 1. Esquema de Precios Duales y Umbrales Mayoristas
 */
export const DifferentialPricingSchema = z
  .object({
    sku: z.string().min(1, 'El SKU es obligatorio'),
    precioDetal: z.number().min(0, 'El precio detal no puede ser negativo'),
    precioMayorista: z.number().min(0, 'El precio mayorista no puede ser negativo'),
    cantidadMinimaMayorista: z
      .number()
      .int('La cantidad mínima debe ser entera')
      .min(1, 'La cantidad mínima mayorista debe ser al menos 1'),
    costoBase: z.number().min(0, 'El costo base no puede ser negativo').optional(),
    margenMinimoPct: z
      .number()
      .min(0, 'El margen mínimo no puede ser menor a 0%')
      .max(100, 'El margen mínimo no puede superar 100%')
      .optional(),
    activo: z.boolean().optional().default(true),
  })
  .refine((data) => data.precioMayorista <= data.precioDetal, {
    message: 'El precio mayorista no puede ser superior al precio detal',
    path: ['precioMayorista'],
  });

export type DifferentialPricingInput = z.infer<typeof DifferentialPricingSchema>;

/**
 * 2. Esquema de Perfil Tarifario del Cliente
 */
export const CustomerPricingProfileSchema = z.object({
  clienteId: z.string().min(1, 'El ID de cliente es obligatorio'),
  perfil: z.enum(['DETAL', 'MAYORISTA', 'CONTRATISTA', 'INSTITUCIONAL'], {
    errorMap: () => ({ message: 'Perfil tarifario no válido' }),
  }),
  limiteCredito: z.number().min(0, 'El límite de crédito no puede ser negativo').optional(),
  diasPlazoCredito: z.number().int().min(0, 'Los días de plazo no pueden ser negativos').optional(),
  descuentoAdicionalPct: z.number().min(0).max(100).optional(),
  observaciones: z.string().optional(),
});

export type CustomerPricingProfileInput = z.infer<typeof CustomerPricingProfileSchema>;

/**
 * 3. Esquema de Ítem de Cotización B2B
 */
export const B2BQuotationItemSchema = z.object({
  id: z.string().min(1, 'ID de ítem obligatorio'),
  productoSku: z.string().min(1, 'SKU de producto obligatorio'),
  nombre: z.string().min(1, 'Nombre de producto obligatorio'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  precioUnitarioPactado: z.number().positive('El precio unitario debe ser positivo'),
  tarifaAplicada: z.enum(['DETAL', 'MAYORISTA']),
  descuentoPct: z
    .number()
    .min(0, 'El descuento no puede ser menor al 0%')
    .max(100, 'El descuento no puede ser superior al 100%'),
  subtotalItem: z.number().min(0, 'El subtotal del ítem no puede ser negativo'),
  observaciones: z.string().optional(),
});

export type B2BQuotationItemInput = z.infer<typeof B2BQuotationItemSchema>;

/**
 * 4. Esquema de Cotización B2B Completa
 */
export const B2BQuotationSchema = z.object({
  id: z.string().min(1, 'ID de cotización obligatorio'),
  tenantId: z.string().min(1, 'ID de tenant obligatorio'),
  codigoCotizacion: z
    .string()
    .regex(/^COT-\d{4}-\d{5}$/, 'El código debe seguir el formato COT-YYYY-XXXXX'),
  clienteId: z.string().min(1, 'ID de cliente obligatorio'),
  asesorUsuarioId: z.string().min(1, 'ID de asesor obligatorio'),
  estado: z.enum([
    'BORRADOR',
    'EMITIDA',
    'APROBADA',
    'RECHAZADA',
    'CONVERTIDA',
    'VENCIDA',
  ]),
  items: z.array(B2BQuotationItemSchema).min(1, 'La cotización debe contener al menos un ítem'),
  subtotal: z.number().min(0),
  totalDescuentos: z.number().min(0),
  totalImpuestos: z.number().min(0),
  totalGeneral: z.number().min(0),
  diasVigencia: z.number().int().min(1, 'La vigencia debe ser de al menos 1 día'),
  fechaEmision: z.string().min(1),
  fechaVencimiento: z.string().min(1),
  convertidaPrefacturaId: z.string().optional(),
  observaciones: z.string().optional(),
});

export type B2BQuotationInput = z.infer<typeof B2BQuotationSchema>;

/**
 * 5. Esquema de Conversión Atómica a Preventa POS
 */
export const QuotationToPosConversionSchema = z.object({
  cotizacionId: z.string().min(1, 'ID de cotización obligatorio'),
  tenantId: z.string().min(1, 'ID de tenant obligatorio'),
  bodegaId: z.string().min(1, 'ID de bodega obligatorio'),
  vendedorId: z.string().min(1, 'ID de vendedor obligatorio'),
  tipoPreventa: z.enum(['MOSTRADOR_B2B', 'CONTRATISTA', 'DESPACHO_PROGRAMADO']),
});

export type QuotationToPosConversionInput = z.infer<typeof QuotationToPosConversionSchema>;

/**
 * 6. Esquema de Configuración IndexedDB Multi-Tenant
 */
export const TenantLocalDbConfigSchema = z
  .object({
    tenantId: z.string().min(1, 'ID de tenant obligatorio'),
    dbName: z.string().min(1, 'Nombre de base de datos obligatorio'),
    version: z.number().int().min(1, 'La versión debe ser un entero positivo'),
  })
  .refine((data) => data.dbName === `PezcaderiaERP_${data.tenantId}`, {
    message: 'El nombre de la base de datos debe ser exactamente PezcaderiaERP_{tenantId}',
    path: ['dbName'],
  });

export type TenantLocalDbConfigInput = z.infer<typeof TenantLocalDbConfigSchema>;

