// src/tests/realtimePreventaSchema.test.ts
// Pruebas TDD para la validación estricta de esquemas de eventos en tiempo real (SPEC-045: TASK-045-01)

import { describe, it, expect } from 'vitest';
import {
  realtimePreventaEventSchema,
  realtimeBroadcastPulseSchema,
  validateRealtimePreventaEvent,
  createRealtimePreventaPayload,
  type RealtimePreventaEvent,
  type RealtimeBroadcastPulse,
} from '../schemas/realtimePreventa.schema';

describe('TASK-045-01: Esquemas Zod y Contratos de Eventos Realtime de Preventas', () => {
  const validInsertPayload: RealtimePreventaEvent = {
    eventType: 'INSERT_PREVENTA',
    tenantId: 'tenant-03',
    prefacturaId: 'pref-2026-001',
    codigoPreventa: 'PRE-2026-01001',
    vendedorId: 'user-josase-01',
    vendedorNombre: 'Diego Díaz',
    terminalId: 'MOSTRADOR-01',
    clienteDocumento: '901475457',
    clienteNombre: 'MFL INGENIEROS CONSULTORES S.A.S.',
    estado: 'PENDIENTE_COBRO',
    total: 90000,
    itemsCount: 2,
    timestamp: new Date().toISOString(),
  };

  it('1. Debe validar exitosamente un evento INSERT_PREVENTA con todos los campos requeridos', () => {
    const result = realtimePreventaEventSchema.safeParse(validInsertPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventType).toBe('INSERT_PREVENTA');
      expect(result.data.tenantId).toBe('tenant-03');
      expect(result.data.total).toBe(90000);
    }
  });

  it('2. Debe rechazar un evento sin tenantId o con tenantId vacío', () => {
    const invalidPayload = { ...validInsertPayload, tenantId: '' };
    const result = realtimePreventaEventSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('3. Debe validar un evento UPDATE_ESTADO_PREVENTA con transición a EN_COBRO y cajero asignado', () => {
    const updatePayload: RealtimePreventaEvent = {
      eventType: 'UPDATE_ESTADO_PREVENTA',
      tenantId: 'tenant-03',
      prefacturaId: 'pref-2026-001',
      codigoPreventa: 'PRE-2026-01001',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      cajeroId: 'usr-cajero-01',
      cajeroNombre: 'Luisa Cajera',
      estado: 'EN_COBRO',
      total: 90000,
      itemsCount: 2,
      timestamp: new Date().toISOString(),
    };

    const result = realtimePreventaEventSchema.safeParse(updatePayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estado).toBe('EN_COBRO');
      expect(result.data.cajeroId).toBe('usr-cajero-01');
    }
  });

  it('4. Debe validar un evento DELETE_PREVENTA para cancelaciones y descartes', () => {
    const deletePayload: RealtimePreventaEvent = {
      eventType: 'DELETE_PREVENTA',
      tenantId: 'tenant-03',
      prefacturaId: 'pref-2026-001',
      codigoPreventa: 'PRE-2026-01001',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      estado: 'ANULADA',
      total: 90000,
      itemsCount: 2,
      timestamp: new Date().toISOString(),
    };

    const result = realtimePreventaEventSchema.safeParse(deletePayload);
    expect(result.success).toBe(true);
  });

  it('5. Debe validar un pulso broadcast efímero BROADCAST_TICKET_PULSE', () => {
    const pulsePayload: RealtimeBroadcastPulse = {
      tenantId: 'tenant-03',
      action: 'PREVENTA_EMITIDA',
      prefacturaId: 'pref-2026-001',
      codigoPreventa: 'PRE-2026-01001',
      vendedorId: 'user-josase-01',
      total: 90000,
      timestamp: Date.now(),
    };

    const result = realtimeBroadcastPulseSchema.safeParse(pulsePayload);
    expect(result.success).toBe(true);
  });

  it('6. Helper validateRealtimePreventaEvent debe procesar payloads sin lanzar excepciones no controladas', () => {
    const valid = validateRealtimePreventaEvent(validInsertPayload);
    expect(valid.ok).toBe(true);
    expect(valid.data?.codigoPreventa).toBe('PRE-2026-01001');

    const invalid = validateRealtimePreventaEvent({ algo: 'invalido' });
    expect(invalid.ok).toBe(false);
    expect(invalid.error).toBeDefined();
  });

  it('7. Helper createRealtimePreventaPayload debe generar payloads canónicos consistentes con timestamp actual', () => {
    const payload = createRealtimePreventaPayload('INSERT_PREVENTA', {
      tenantId: 'tenant-03',
      prefacturaId: 'pref-999',
      codigoPreventa: 'PRE-2026-09999',
      vendedorId: 'v-01',
      vendedorNombre: 'Carlos Vendedor',
      terminalId: 'POS-02',
      clienteDocumento: '12345678',
      clienteNombre: 'Cliente Prueba',
      estado: 'PENDIENTE_COBRO',
      total: 45000,
      itemsCount: 1,
    });

    expect(payload.eventType).toBe('INSERT_PREVENTA');
    expect(payload.tenantId).toBe('tenant-03');
    expect(payload.timestamp).toBeDefined();
    expect(new Date(payload.timestamp).getTime()).not.toBeNaN();
  });
});
