import { z } from 'zod';

/**
 * ============================================================================
 * LA PEZCADERIA ERP — ESQUEMAS ZOD: MOTOR DE PRECIOS DINÁMICOS Y MERMAS
 * ============================================================================
 * Módulo de parametrización administrable (Admin Only), buffers de mermas
 * biológicas por especie y simulación multicanal determinista (POS, HORECA, Mayorista).
 */

// 1. Configuración de Merma por Categoría / Especie Marina
export const CategoryWasteConfigSchema = z.object({
  id: z.string().min(1, 'El ID de la categoría de merma es requerido'),
  categoriaId: z.string().min(1, 'El ID de categoría es requerido'),
  nombreCategoria: z.string().min(1, 'El nombre de categoría es requerido'),
  bufferDefaultPct: z.number().min(0, 'El buffer no puede ser negativo').max(50, 'El buffer no puede exceder el 50%'),
  mermaDespiecePct: z.number().min(0).max(40).default(0),
  mermaDescongelacionGlaseoPct: z.number().min(0).max(30).default(0),
  mermaCocinaViscerasPct: z.number().min(0).max(40).default(0),
  descripcion: z.string().optional(),
});

// 2. Márgenes Maestros por Canal de Venta
export const ChannelMarginConfigSchema = z.object({
  margenPosPct: z.number().min(1, 'El margen POS debe ser al menos 1%').max(200, 'Margen POS excesivo').default(40),
  margenRestaurantePct: z.number().min(1, 'El margen HORECA debe ser al menos 1%').max(200, 'Margen HORECA excesivo').default(30),
  margenMayoristaPct: z.number().min(1, 'El margen Mayorista debe ser al menos 1%').max(200, 'Margen Mayorista excesivo').default(15),
  margenMinimoSeguridadPct: z.number().min(0, 'El margen mínimo no puede ser negativo').max(50, 'Margen mínimo excesivo').default(10),
});

// 3. Configuración Global Administrable (Persistida en pricingGlobalConfig)
export const PricingGlobalConfigSchema = z.object({
  id: z.string().default('cfg-pricing-global'),
  version: z.string().default('1.0.0'),
  ultimaActualizacion: z.string(),
  actualizadoPorUsuarioId: z.string().min(1, 'Usuario responsable requerido'),
  redondeoEnteroCop: z.boolean().default(true),
  bloquearVentaBajoCosto: z.boolean().default(true),
  canales: ChannelMarginConfigSchema.default({}),
  categoriasWaste: z.array(CategoryWasteConfigSchema).default([]),
});

// 4. Régimen Tributario IVA
export const RegimenIvaEnum = z.enum(['EXENTO_O_EXCLUIDO', 'GRAVADO_IVA_19']);

// 5. Input para Simulación de Precios de un Producto
export const ProductPricingSimulationInputSchema = z.object({
  productoId: z.string().min(1, 'El ID de producto es requerido'),
  costoCompraCop: z.number().min(0.01, 'El costo de compra debe ser estrictamente positivo'),
  categoriaId: z.string().min(1, 'La categoría es requerida'),
  bufferPersonalizadoPct: z.number().min(0).max(50).nullable().optional(),
  regimenIva: RegimenIvaEnum.default('EXENTO_O_EXCLUIDO'),
  margenPosSobrescritoPct: z.number().min(0).max(200).nullable().optional(),
  margenRestauranteSobrescritoPct: z.number().min(0).max(200).nullable().optional(),
  margenMayoristaSobrescritoPct: z.number().min(0).max(200).nullable().optional(),
});

// 6. Resultado Proyectado por Canal
export const ChannelSimulationResultSchema = z.object({
  canal: z.enum(['POS', 'RESTAURANTE_HORECA', 'MAYORISTA']),
  nombreCanal: z.string(),
  margenPct: z.number(),
  subtotalNetoCop: z.number(),
  valorIvaCop: z.number(),
  precioFinalCop: z.number(),
  margenBrutoCop: z.number(),
  margenBrutoPct: z.number(),
  esVentaBajoCosto: z.boolean(),
  alertaMargenBajo: z.boolean(),
});

// 7. Resultado Completo de la Simulación de un Producto
export const ProductPricingSimulationResultSchema = z.object({
  productoId: z.string(),
  costoCompraCop: z.number(),
  bufferEfectivoPct: z.number(),
  costoAjustadoCop: z.number(),
  regimenIva: RegimenIvaEnum,
  canales: z.record(z.string(), ChannelSimulationResultSchema),
  puedeGuardar: z.boolean(),
  bloqueos: z.array(z.string()),
  advertencias: z.array(z.string()),
});

// 8. Snapshot Inmutable para Auditoría NIIF y Catálogo
export const PricingRecordSnapshotSchema = z.object({
  id: z.string().uuid(),
  productoId: z.string().min(1),
  sku: z.string().min(1),
  nombreProducto: z.string().min(1),
  vigenciaDesde: z.string(),
  costoCompraCop: z.number().min(0),
  bufferEfectivoPct: z.number().min(0),
  costoAjustadoCop: z.number().min(0),
  regimenIva: RegimenIvaEnum,
  precioPosCop: z.number().min(0),
  precioRestauranteCop: z.number().min(0),
  precioMayoristaCop: z.number().min(0),
  margenPosCop: z.number(),
  margenRestauranteCop: z.number(),
  margenMayoristaCop: z.number(),
  margenPosPct: z.number(),
  margenRestaurantePct: z.number(),
  margenMayoristaPct: z.number(),
  motivoCambio: z.string().min(3, 'El motivo de cambio debe tener al menos 3 caracteres'),
  usuarioId: z.string().min(1, 'El ID de usuario es requerido'),
  usuarioNombre: z.string().min(1, 'El nombre de usuario es requerido'),
  excepcionAutorizada: z.boolean().default(false),
});
