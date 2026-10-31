// src/tests/cashierKanbanRealtimeIntegration.test.tsx
// Pruebas TDD de integración para sincronización reactiva de Taquilla Central Kanban con Supabase Realtime (SPEC-045: TASK-045-03)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCashierKanbanStore } from '../stores/useCashierKanbanStore';
import { supabaseRealtimePreventasService } from '../services/supabaseRealtimePreventasService';
import type { RealtimePreventaEvent } from '../schemas/realtimePreventa.schema';

describe('TASK-045-03: Integración Reactiva useCashierKanbanStore & Taquilla Central', () => {
  const tenantId = 'tenant-03';

  beforeEach(() => {
    // Reset store state
    useCashierKanbanStore.setState({
      preventas: [],
      filtroAsesorId: 'TODOS',
      preventaSeleccionada: null,
      isModalCobroOpen: false,
      isLoading: false,
      error: null,
      realtimeStatus: 'CONNECTING',
    });
  });

  afterEach(() => {
    useCashierKanbanStore.getState().detenerSuscripcionRealtime();
  });

  it('1. Debe iniciar la suscripción en tiempo real y reflejar el estado SUBSCRIBED en el store', async () => {
    await useCashierKanbanStore.getState().iniciarSuscripcionRealtime(tenantId);
    const state = useCashierKanbanStore.getState();

    expect(state.realtimeStatus).toBe('SUBSCRIBED');
  });

  it('2. Al recibir un evento realtime INSERT_PREVENTA, debe incorporar la tarjeta a preventas en vivo sin recarga', async () => {
    await useCashierKanbanStore.getState().iniciarSuscripcionRealtime(tenantId);

    const newEvent: RealtimePreventaEvent = {
      eventType: 'INSERT_PREVENTA',
      tenantId,
      prefacturaId: 'pref-rt-001',
      codigoPreventa: 'PRE-2026-08888',
      vendedorId: 'user-josase-02',
      vendedorNombre: 'Luis Banquez',
      terminalId: 'MOSTRADOR-02',
      clienteDocumento: '88888888',
      clienteNombre: 'CONSTRUCTORA DEL ORIENTE S.A.S.',
      estado: 'PENDIENTE_COBRO',
      total: 250000,
      itemsCount: 5,
      timestamp: new Date().toISOString(),
    };

    // Despachar evento simulado
    supabaseRealtimePreventasService.simulateIncomingEvent(tenantId, newEvent);

    const state = useCashierKanbanStore.getState();
    const found = state.preventas.find((p) => p.id === 'pref-rt-001');

    expect(found).toBeDefined();
    expect(found?.codigoPreventa).toBe('PRE-2026-08888');
    expect(found?.estado).toBe('PENDIENTE_COBRO');
    expect(found?.total).toBe(250000);
  });

  it('3. Al recibir un evento realtime UPDATE_ESTADO_PREVENTA a EN_COBRO, debe mutar el estado reactivamente', async () => {
    await useCashierKanbanStore.getState().iniciarSuscripcionRealtime(tenantId);

    // Inserción inicial
    const insertEvent: RealtimePreventaEvent = {
      eventType: 'INSERT_PREVENTA',
      tenantId,
      prefacturaId: 'pref-rt-002',
      codigoPreventa: 'PRE-2026-08889',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      estado: 'PENDIENTE_COBRO',
      total: 80000,
      itemsCount: 1,
      timestamp: new Date().toISOString(),
    };
    supabaseRealtimePreventasService.simulateIncomingEvent(tenantId, insertEvent);

    // Actualización a EN_COBRO por una cajera
    const updateEvent: RealtimePreventaEvent = {
      eventType: 'UPDATE_ESTADO_PREVENTA',
      tenantId,
      prefacturaId: 'pref-rt-002',
      codigoPreventa: 'PRE-2026-08889',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      cajeroId: 'usr-cajero-luisa',
      cajeroNombre: 'Luisa Cajera',
      estado: 'EN_COBRO',
      total: 80000,
      itemsCount: 1,
      timestamp: new Date().toISOString(),
    };
    supabaseRealtimePreventasService.simulateIncomingEvent(tenantId, updateEvent);

    const state = useCashierKanbanStore.getState();
    const found = state.preventas.find((p) => p.id === 'pref-rt-002');

    expect(found?.estado).toBe('EN_COBRO');
    expect(found?.cajeroId).toBe('usr-cajero-luisa');
    expect(found?.cajeroNombre).toBe('Luisa Cajera');
  });

  it('4. Al recibir un evento realtime DELETE_PREVENTA, debe retirar la preventa del tablero', async () => {
    await useCashierKanbanStore.getState().iniciarSuscripcionRealtime(tenantId);

    const insertEvent: RealtimePreventaEvent = {
      eventType: 'INSERT_PREVENTA',
      tenantId,
      prefacturaId: 'pref-rt-003',
      codigoPreventa: 'PRE-2026-08890',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      estado: 'PENDIENTE_COBRO',
      total: 50000,
      itemsCount: 1,
      timestamp: new Date().toISOString(),
    };
    supabaseRealtimePreventasService.simulateIncomingEvent(tenantId, insertEvent);
    expect(useCashierKanbanStore.getState().preventas.some((p) => p.id === 'pref-rt-003')).toBe(true);

    // Cancelación o descarte
    const deleteEvent: RealtimePreventaEvent = {
      eventType: 'DELETE_PREVENTA',
      tenantId,
      prefacturaId: 'pref-rt-003',
      codigoPreventa: 'PRE-2026-08890',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      estado: 'ANULADA',
      total: 50000,
      itemsCount: 0,
      timestamp: new Date().toISOString(),
    };
    supabaseRealtimePreventasService.simulateIncomingEvent(tenantId, deleteEvent);

    expect(useCashierKanbanStore.getState().preventas.some((p) => p.id === 'pref-rt-003')).toBe(false);
  });
});
