// src/tests/supabaseRealtimePreventasService.test.ts
// Pruebas TDD para el servicio resiliente de Supabase Realtime Channels (SPEC-045: TASK-045-02)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SupabaseRealtimePreventasService,
  supabaseRealtimePreventasService,
  type RealtimeSubscriptionCallbacks,
} from '../services/supabaseRealtimePreventasService';
import type { RealtimePreventaEvent, RealtimeBroadcastPulse } from '../schemas/realtimePreventa.schema';

describe('TASK-045-02: Servicio Central de Suscripción Resiliente de Canales Supabase', () => {
  let service: SupabaseRealtimePreventasService;

  beforeEach(() => {
    // Instanciar en modo mock determinista para pruebas aisladas
    service = new SupabaseRealtimePreventasService({ isMockMode: true });
  });

  afterEach(() => {
    service.cleanupAll();
  });

  it('1. Debe inicializar el canal en estado SUBSCRIBED en modo mock', async () => {
    let currentStatus = '';
    const unsub = await service.subscribe('tenant-03', {
      onStatusChange: (status) => {
        currentStatus = status;
      },
    });

    expect(currentStatus).toBe('SUBSCRIBED');
    expect(service.isWebSocketActive('tenant-03')).toBe(true);
    expect(service.shouldFallbackToPolling('tenant-03')).toBe(false);

    unsub();
  });

  it('2. Debe recibir eventos INSERT y notificar al suscriptor registrado', async () => {
    const onInsert = vi.fn();
    const unsub = await service.subscribe('tenant-03', { onInsert });

    const testEvent: RealtimePreventaEvent = {
      eventType: 'INSERT_PREVENTA',
      tenantId: 'tenant-03',
      prefacturaId: 'pref-mock-01',
      codigoPreventa: 'PRE-2026-09001',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'POS-01',
      clienteDocumento: '901475457',
      clienteNombre: 'MFL INGENIEROS',
      estado: 'PENDIENTE_COBRO',
      total: 120000,
      itemsCount: 3,
      timestamp: new Date().toISOString(),
    };

    service.simulateIncomingEvent('tenant-03', testEvent);

    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert).toHaveBeenCalledWith(testEvent);

    unsub();
  });

  it('3. Debe recibir eventos UPDATE y notificar la transición de estado', async () => {
    const onUpdate = vi.fn();
    const unsub = await service.subscribe('tenant-03', { onUpdate });

    const updateEvent: RealtimePreventaEvent = {
      eventType: 'UPDATE_ESTADO_PREVENTA',
      tenantId: 'tenant-03',
      prefacturaId: 'pref-mock-01',
      codigoPreventa: 'PRE-2026-09001',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'POS-01',
      cajeroId: 'usr-cajero-01',
      cajeroNombre: 'Luisa Cajera',
      estado: 'EN_COBRO',
      total: 120000,
      itemsCount: 3,
      timestamp: new Date().toISOString(),
    };

    service.simulateIncomingEvent('tenant-03', updateEvent);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(updateEvent);

    unsub();
  });

  it('4. Debe descartar eventos cuyo tenantId no coincida con el canal suscrito (aislamiento multi-tenant)', async () => {
    const onInsert = vi.fn();
    const unsub = await service.subscribe('tenant-03', { onInsert });

    const foreignTenantEvent: RealtimePreventaEvent = {
      eventType: 'INSERT_PREVENTA',
      tenantId: 'tenant-99-otro',
      prefacturaId: 'pref-hacker',
      codigoPreventa: 'PRE-2026-99999',
      vendedorId: 'user-otro',
      vendedorNombre: 'Otro Vendedor',
      terminalId: 'POS-99',
      estado: 'PENDIENTE_COBRO',
      total: 500000,
      itemsCount: 1,
      timestamp: new Date().toISOString(),
    };

    service.simulateIncomingEvent('tenant-03', foreignTenantEvent);

    expect(onInsert).not.toHaveBeenCalled();

    unsub();
  });

  it('5. Debe permitir emitir y recibir pulsos broadcast ultra-rápidos', async () => {
    const onPulse = vi.fn();
    const unsub = await service.subscribe('tenant-03', { onPulse });

    const pulse: RealtimeBroadcastPulse = {
      tenantId: 'tenant-03',
      action: 'PREVENTA_EMITIDA',
      prefacturaId: 'pref-01',
      codigoPreventa: 'PRE-2026-0001',
      vendedorId: 'v-01',
      total: 80000,
      timestamp: Date.now(),
    };

    await service.broadcastPulse(pulse);

    expect(onPulse).toHaveBeenCalledTimes(1);
    expect(onPulse).toHaveBeenCalledWith(pulse);

    unsub();
  });

  it('6. Debe activar indicador de fallback cuando el canal se desconecta o entra en error', async () => {
    let lastStatus = '';
    const unsub = await service.subscribe('tenant-03', {
      onStatusChange: (st) => {
        lastStatus = st;
      },
    });

    expect(service.shouldFallbackToPolling('tenant-03')).toBe(false);

    // Simular corte de conexión
    service.simulateStatusChange('tenant-03', 'CHANNEL_ERROR');
    expect(lastStatus).toBe('CHANNEL_ERROR');
    expect(service.isWebSocketActive('tenant-03')).toBe(false);
    expect(service.shouldFallbackToPolling('tenant-03')).toBe(true);

    // Simular reconexión
    service.simulateStatusChange('tenant-03', 'SUBSCRIBED');
    expect(lastStatus).toBe('SUBSCRIBED');
    expect(service.isWebSocketActive('tenant-03')).toBe(true);
    expect(service.shouldFallbackToPolling('tenant-03')).toBe(false);

    unsub();
  });

  it('7. Limpieza de referencias (ref-count): desuscribe el canal solo cuando no quedan escuchas activas', async () => {
    const unsub1 = await service.subscribe('tenant-03', {});
    const unsub2 = await service.subscribe('tenant-03', {});

    expect(service.getActiveSubscriberCount('tenant-03')).toBe(2);

    unsub1();
    expect(service.getActiveSubscriberCount('tenant-03')).toBe(1);
    expect(service.hasActiveChannel('tenant-03')).toBe(true);

    unsub2();
    expect(service.getActiveSubscriberCount('tenant-03')).toBe(0);
    expect(service.hasActiveChannel('tenant-03')).toBe(false);
  });
});
