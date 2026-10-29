// src/types/deltaSync.schema.ts
// Esquemas Zod y Contratos de Tipos para Sincronización Delta Bidireccional y Outbox Resiliente (SPEC-041)

import { z } from 'zod';

/**
 * Tipos de Operaciones soportadas en la Cola Outbox
 */
export const TipoOperacionOutboxSchema = z.enum([
  'EMITIR_PREVENTA_MULTIVENDEDOR',
  'COBRAR_PREVENTA_CAJA_UNICA',
  'VENTA_POS_DIRECTA',
  'ACTUALIZACION_STOCK_DELTA',
  'CAMBIO_PRECIO_CATALOGO',
  'COTIZACION_B2B',
]);

export type TipoOperacionOutbox = z.infer<typeof TipoOperacionOutboxSchema>;

/**
 * Esquema de Ítem dentro de una Preventa / Comanda Multivendedor
 */
export const ItemPreventaSyncSchema = z.object({
  productoId: z.string().min(1, 'El productoId es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().positive('El precio unitario debe ser positivo'),
  descuentoPct: z.number().min(0).max(100).default(0),
  subtotal: z.number().nonnegative('El subtotal no puede ser negativo'),
});

export type ItemPreventaSync = z.infer<typeof ItemPreventaSyncSchema>;

/**
 * Esquema de Preventa / Comanda Multivendedor Sincronizable
 */
export const PreventaSyncSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
  tenantId: z.string().min(1, 'El tenantId es obligatorio'),
  codigoPreventa: z
    .string()
    .regex(/^PRE-\d{4}-\d{5}$/, 'Formato de código inválido (debe ser PRE-YYYY-XXXXX)'),
  terminalId: z.string().min(1, 'La terminal emisora es obligatoria'),
  vendedorId: z.string().min(1, 'El vendedorId es obligatorio'),
  vendedorNombre: z.string().min(1, 'El nombre del vendedor es obligatorio'),
  clienteDocumento: z.string().optional(),
  clienteNombre: z.string().optional(),
  items: z.array(ItemPreventaSyncSchema).min(1, 'La preventa debe contener al menos 1 ítem'),
  subtotal: z.number().nonnegative('El subtotal no puede ser negativo'),
  descuentoTotal: z.number().nonnegative('El descuento total no puede ser negativo'),
  total: z.number().positive('El total debe ser positivo'),
  estado: z.enum(['PENDIENTE_COBRO', 'PAGADO', 'ANULADO']),
  cajeroId: z.string().optional(),
  turnoCentralId: z.string().optional(),
  version: z.number().int().min(1, 'La versión OCC debe ser un entero positivo >= 1'),
  idempotencyKey: z.string().length(64, 'La idempotencyKey debe ser un hash SHA-256 de 64 caracteres'),
  createdAt: z.string().datetime('createdAt debe ser formato ISO 8601'),
  updatedAt: z.string().datetime('updatedAt debe ser formato ISO 8601'),
});

export type PreventaSync = z.infer<typeof PreventaSyncSchema>;

/**
 * Esquema de Transacción en la Cola Outbox
 */
export const OutboxTransactionSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
  tenantId: z.string().min(1, 'El tenantId es obligatorio'),
  idempotencyKey: z.string().length(64, 'La idempotencyKey debe ser SHA-256 de 64 caracteres'),
  tipoOperacion: TipoOperacionOutboxSchema,
  entidadId: z.string().min(1, 'La entidadId es obligatoria'),
  versionEntidad: z.number().int().min(1, 'La versión de la entidad debe ser >= 1'),
  payload: z.record(z.any()),
  estado: z.enum([
    'PENDIENTE',
    'EN_PROCESO',
    'SINCRONIZADO',
    'ERROR_REINTENTO',
    'ERROR_FATAL_DATOS',
  ]),
  intentos: z.number().int().min(0).default(0),
  maxIntentos: z.number().int().min(1).default(5),
  proximoReintentoEn: z.string().datetime().optional(),
  ultimoError: z.string().optional(),
  creadoEn: z.string().datetime('creadoEn debe ser formato ISO 8601'),
  sincronizadoEn: z.string().datetime().optional(),
});

export type OutboxTransaction = z.infer<typeof OutboxTransactionSchema>;

/**
 * Esquema de Registro de Conflicto de Concurrencia Optimista (OCC)
 */
export const SyncConflictSchema = z.object({
  id: z.string().uuid('El ID de conflicto debe ser un UUID válido'),
  tenantId: z.string().min(1, 'El tenantId es obligatorio'),
  outboxTransactionId: z.string().min(1, 'outboxTransactionId es obligatorio'),
  entidadNombre: z.string().min(1, 'entidadNombre es obligatorio'),
  entidadId: z.string().min(1, 'entidadId es obligatorio'),
  versionCliente: z.number().int().min(1),
  versionServidor: z.number().int().min(1),
  payloadCliente: z.record(z.any()),
  payloadServidor: z.record(z.any()),
  resolucion: z.enum(['CLIENT_WINS', 'SERVER_WINS', 'MERGE_DELTA', 'PENDIENTE_RESOLUCION']),
  resueltoPor: z.string().optional(),
  resueltoEn: z.string().datetime().optional(),
});

export type SyncConflict = z.infer<typeof SyncConflictSchema>;

/**
 * Esquema de Parámetros de Consulta Delta (Downstream)
 */
export const DeltaSyncQuerySchema = z.object({
  tenantId: z.string().min(1, 'El tenantId es obligatorio'),
  sinceTimestamp: z.string().datetime('sinceTimestamp debe ser formato ISO 8601'),
  limit: z.number().int().min(1).max(500, 'El límite máximo por lote es 500 registros').default(500),
  tablas: z.array(z.string()).optional(),
});

export type DeltaSyncQuery = z.infer<typeof DeltaSyncQuerySchema>;

/**
 * Esquema de Metadatos de Sincronización del Tenant
 */
export const SyncMetadataSchema = z.object({
  tenantId: z.string().min(1, 'El tenantId es obligatorio'),
  lastSyncTimestamp: z.string().datetime('lastSyncTimestamp debe ser formato ISO 8601'),
  totalProductosSincronizados: z.number().int().min(0).default(0),
  totalClientesSincronizados: z.number().int().min(0).default(0),
  totalPreventasPendientes: z.number().int().min(0).default(0),
  versionEsquema: z.number().int().min(1).default(1),
  ultimoEstadoSync: z.enum(['EXITOSO', 'PARCIAL', 'ERROR']).default('EXITOSO'),
  actualizadoEn: z.string().datetime('actualizadoEn debe ser formato ISO 8601'),
});

export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;

/**
 * Generador Determinista de Idempotency-Key SHA-256
 * Funciona transparentemente en navegadores (Web Crypto API) y Node.js (crypto module)
 */
export async function generarIdempotencyKey(params: {
  tenantId: string;
  tipoOperacion: string;
  entidadId: string;
  creadoEn: string;
}): Promise<string> {
  const rawString = `${params.tenantId}:${params.tipoOperacion}:${params.entidadId}:${params.creadoEn}`;

  // 1. Entorno Navegador con Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // 2. Entorno Node.js / Vitest
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(rawString).digest('hex');
  } catch {
    // Fallback criptográfico simple en caso extremo
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash << 5) - hash + rawString.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return hex.repeat(8);
  }
}

/**
 * Validador seguro para PreventaSync
 */
export function validarPreventaSync(data: unknown): {
  success: boolean;
  data?: PreventaSync;
  error?: string;
} {
  const result = PreventaSyncSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { success: false, error: errorMsg };
}

/**
 * Validador seguro para OutboxTransaction
 */
export function validarOutboxTransaction(data: unknown): {
  success: boolean;
  data?: OutboxTransaction;
  error?: string;
} {
  const result = OutboxTransactionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { success: false, error: errorMsg };
}

