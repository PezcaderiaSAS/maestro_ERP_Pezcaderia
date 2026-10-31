// src/schemas/realtimePreventa.schema.ts
// Esquemas Zod y Contratos de Tipos para Sincronización en Tiempo Real de Preventas (SPEC-045: TASK-045-01)

import { z } from 'zod';
import type { EstadoPrefactura } from '../types/prefactura.types';

export const realtimeEventTypeSchema = z.enum([
  'INSERT_PREVENTA',
  'UPDATE_ESTADO_PREVENTA',
  'DELETE_PREVENTA',
]);

export type RealtimeEventType = z.infer<typeof realtimeEventTypeSchema>;

export const realtimeEstadoPrefacturaSchema = z.enum([
  'PENDIENTE_COBRO',
  'EN_COBRO',
  'PAGADA',
  'DESPACHADA',
  'ANULADA',
]);

/**
 * Esquema canónico para eventos de preventa transmitidos por Supabase Realtime (postgres_changes o payload broadcast)
 */
export const realtimePreventaEventSchema = z.object({
  eventType: realtimeEventTypeSchema,
  tenantId: z.string().min(1, 'tenantId es obligatorio para aislamiento multi-tenant'),
  prefacturaId: z.string().min(1, 'prefacturaId es obligatorio'),
  codigoPreventa: z.string().min(3, 'codigoPreventa es obligatorio'),
  vendedorId: z.string().min(1, 'vendedorId es obligatorio'),
  vendedorNombre: z.string().min(1, 'vendedorNombre es obligatorio'),
  terminalId: z.string().min(1, 'terminalId es obligatorio'),
  clienteDocumento: z.string().optional(),
  clienteNombre: z.string().optional(),
  cajeroId: z.string().optional(),
  cajeroNombre: z.string().optional(),
  estado: realtimeEstadoPrefacturaSchema,
  total: z.number().nonnegative('total debe ser mayor o igual a 0'),
  itemsCount: z.number().int().nonnegative('itemsCount debe ser entero mayor o igual a 0'),
  timestamp: z.string().datetime().or(z.string().min(10)),
  metadata: z.record(z.unknown()).optional(),
});

export type RealtimePreventaEvent = z.infer<typeof realtimePreventaEventSchema>;

/**
 * Esquema para pulsos efímeros ultra-rápidos (Broadcast WebSocket sub-50ms)
 */
export const realtimeBroadcastPulseSchema = z.object({
  tenantId: z.string().min(1),
  action: z.enum([
    'PREVENTA_EMITIDA',
    'PREVENTA_EN_COBRO',
    'PREVENTA_COBRADA',
    'PREVENTA_CANCELADA',
    'HEARTBEAT_PING',
  ]),
  prefacturaId: z.string().min(1),
  codigoPreventa: z.string().min(1),
  vendedorId: z.string().min(1),
  cajeroId: z.string().optional(),
  total: z.number().nonnegative(),
  timestamp: z.number(),
});

export type RealtimeBroadcastPulse = z.infer<typeof realtimeBroadcastPulseSchema>;

/**
 * Helper para validar payloads de eventos en tiempo real con captura segura de errores
 */
export function validateRealtimePreventaEvent(payload: unknown): {
  ok: boolean;
  data?: RealtimePreventaEvent;
  error?: string;
} {
  const result = realtimePreventaEventSchema.safeParse(payload);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { ok: false, error: errorMsg };
}

/**
 * Helper factory para crear payloads canónicos de eventos de preventa
 */
export function createRealtimePreventaPayload(
  eventType: RealtimeEventType,
  data: {
    tenantId: string;
    prefacturaId: string;
    codigoPreventa: string;
    vendedorId: string;
    vendedorNombre: string;
    terminalId: string;
    clienteDocumento?: string;
    clienteNombre?: string;
    cajeroId?: string;
    cajeroNombre?: string;
    estado: EstadoPrefactura;
    total: number;
    itemsCount: number;
    metadata?: Record<string, unknown>;
  }
): RealtimePreventaEvent {
  return {
    eventType,
    tenantId: data.tenantId,
    prefacturaId: data.prefacturaId,
    codigoPreventa: data.codigoPreventa,
    vendedorId: data.vendedorId,
    vendedorNombre: data.vendedorNombre,
    terminalId: data.terminalId,
    clienteDocumento: data.clienteDocumento,
    clienteNombre: data.clienteNombre,
    cajeroId: data.cajeroId,
    cajeroNombre: data.cajeroNombre,
    estado: data.estado,
    total: data.total,
    itemsCount: data.itemsCount,
    timestamp: new Date().toISOString(),
    metadata: data.metadata,
  };
}
