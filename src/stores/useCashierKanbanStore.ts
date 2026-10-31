// src/stores/useCashierKanbanStore.ts
// Store Zustand para el Tablero Kanban de Caja Única, filtros por asesor y sincronización en tiempo real (SPEC-037, SPEC-045)

import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import type { Prefactura, EstadoPrefactura, CobrarPrefacturaInput } from '../types/prefactura.types';
import { prefacturaService } from '../services/prefacturaService';
import {
  supabaseRealtimePreventasService,
  type RealtimeChannelStatus,
} from '../services/supabaseRealtimePreventasService';
import type { RealtimePreventaEvent } from '../schemas/realtimePreventa.schema';

interface CashierKanbanState {
  preventas: Prefactura[];
  filtroAsesorId: string | 'TODOS';
  preventaSeleccionada: Prefactura | null;
  isModalCobroOpen: boolean;
  isLoading: boolean;
  error: string | null;
  realtimeStatus: RealtimeChannelStatus;

  cargarPreventas: (tenantId: string) => Promise<void>;
  iniciarSuscripcionRealtime: (tenantId: string) => Promise<() => void>;
  detenerSuscripcionRealtime: () => void;
  onRealtimeInsert: (event: RealtimePreventaEvent) => void;
  onRealtimeUpdate: (event: RealtimePreventaEvent) => void;
  onRealtimeDelete: (event: RealtimePreventaEvent) => void;

  setFiltroAsesor: (asesorId: string | 'TODOS') => void;
  abrirModalCobro: (pref: Prefactura) => void;
  cerrarModalCobro: () => void;
  moverPreventaAColumna: (
    tenantId: string,
    prefacturaId: string,
    nuevoEstado: EstadoPrefactura,
    cajeroId?: string
  ) => Promise<boolean>;
  procesarCobro: (input: CobrarPrefacturaInput) => Promise<boolean>;
}

// Variable de módulo para guardar la desuscripción y fallback activos
let activeUnsubscribe: (() => void) | null = null;
let fallbackHeartbeatInterval: ReturnType<typeof setInterval> | null = null;

export const useCashierKanbanStore = create<CashierKanbanState>()(
  zustandConsoleMiddleware((set, get) => ({
    preventas: [],
    filtroAsesorId: 'TODOS',
    preventaSeleccionada: null,
    isModalCobroOpen: false,
    isLoading: false,
    error: null,
    realtimeStatus: 'CONNECTING',

    cargarPreventas: async (tenantId: string) => {
      set({ isLoading: true, error: null });
      try {
        prefacturaService.asegurarPreventasSemillaDemo(tenantId);
        const list = prefacturaService.obtenerPrefacturasPorTenant(tenantId);
        set({ preventas: list, isLoading: false });
      } catch (err: any) {
        set({ error: err.message || 'Error al cargar preventas', isLoading: false });
      }
    },

    iniciarSuscripcionRealtime: async (tenantId: string) => {
      // 1. Cargar estado inicial
      await get().cargarPreventas(tenantId);

      // Si ya hay una suscripción activa previa, desuscribirla limpiamente
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }
      if (fallbackHeartbeatInterval) {
        clearInterval(fallbackHeartbeatInterval);
        fallbackHeartbeatInterval = null;
      }

      // 2. Suscribirse a los eventos en tiempo real del tenant
      const unsub = await supabaseRealtimePreventasService.subscribe(tenantId, {
        onInsert: (event) => {
          get().onRealtimeInsert(event);
        },
        onUpdate: (event) => {
          get().onRealtimeUpdate(event);
        },
        onDelete: (event) => {
          get().onRealtimeDelete(event);
        },
        onStatusChange: (status) => {
          set({ realtimeStatus: status });

          // Gestión de Fallback Heartbeat interna en segundo plano (sin re-renders reactivos)
          if (status === 'SUBSCRIBED') {
            if (fallbackHeartbeatInterval) {
              clearInterval(fallbackHeartbeatInterval);
              fallbackHeartbeatInterval = null;
            }
          } else {
            if (!fallbackHeartbeatInterval) {
              fallbackHeartbeatInterval = setInterval(() => {
                get().cargarPreventas(tenantId);
              }, 10000);
            }
          }
        },
      });

      activeUnsubscribe = unsub;
      return unsub;
    },

    detenerSuscripcionRealtime: () => {
      if (fallbackHeartbeatInterval) {
        clearInterval(fallbackHeartbeatInterval);
        fallbackHeartbeatInterval = null;
      }
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }
      set({ realtimeStatus: 'CLOSED' });
    },

    onRealtimeInsert: (event: RealtimePreventaEvent) => {
      set((state) => {
        const existe = state.preventas.some(
          (p) => p.id === event.prefacturaId || p.codigoPreventa === event.codigoPreventa
        );
        if (existe) {
          return state;
        }

        // Obtener del servicio si está en caché o sintetizar
        const existente = prefacturaService.buscarPorCodigo(event.tenantId, event.prefacturaId);
        const nuevaPrefactura: Prefactura = existente || {
          id: event.prefacturaId,
          tenantId: event.tenantId,
          codigoPreventa: event.codigoPreventa,
          vendedorId: event.vendedorId,
          vendedorNombre: event.vendedorNombre,
          terminalId: event.terminalId,
          clienteDocumento: event.clienteDocumento,
          clienteNombre: event.clienteNombre,
          subtotal: event.total,
          descuentoTotal: 0,
          total: event.total,
          estado: event.estado,
          cajeroId: event.cajeroId,
          cajeroNombre: event.cajeroNombre,
          hardHoldActivo: true,
          items: [],
          createdAt: event.timestamp || new Date().toISOString(),
          updatedAt: event.timestamp || new Date().toISOString(),
        };

        return {
          preventas: [nuevaPrefactura, ...state.preventas],
        };
      });
    },

    onRealtimeUpdate: (event: RealtimePreventaEvent) => {
      set((state) => ({
        preventas: state.preventas.map((p) => {
          if (p.id === event.prefacturaId || p.codigoPreventa === event.codigoPreventa) {
            return {
              ...p,
              estado: event.estado,
              cajeroId: event.cajeroId ?? p.cajeroId,
              cajeroNombre: event.cajeroNombre ?? p.cajeroNombre,
              total: event.total ?? p.total,
              updatedAt: event.timestamp || new Date().toISOString(),
            };
          }
          return p;
        }),
      }));
    },

    onRealtimeDelete: (event: RealtimePreventaEvent) => {
      set((state) => ({
        preventas: state.preventas.filter(
          (p) => p.id !== event.prefacturaId && p.codigoPreventa !== event.codigoPreventa
        ),
      }));
    },

    setFiltroAsesor: (asesorId: string | 'TODOS') => {
      set({ filtroAsesorId: asesorId });
    },

    abrirModalCobro: (pref: Prefactura) => {
      set({ preventaSeleccionada: pref, isModalCobroOpen: true });
    },

    cerrarModalCobro: () => {
      set({ isModalCobroOpen: false, preventaSeleccionada: null });
    },

    moverPreventaAColumna: async (
      tenantId: string,
      prefacturaId: string,
      nuevoEstado: EstadoPrefactura,
      cajeroId?: string
    ) => {
      if (nuevoEstado === 'EN_COBRO') {
        const res = prefacturaService.marcarEnCobro(
          tenantId,
          prefacturaId,
          cajeroId || 'usr-cajero'
        );
        if (res.ok) {
          // Difundir evento de actualización en tiempo real a todos los puestos
          const updated = res.prefactura;
          if (updated) {
            await supabaseRealtimePreventasService.broadcastEvent({
              eventType: 'UPDATE_ESTADO_PREVENTA',
              tenantId,
              prefacturaId: updated.id,
              codigoPreventa: updated.codigoPreventa,
              vendedorId: updated.vendedorId,
              vendedorNombre: updated.vendedorNombre,
              terminalId: updated.terminalId,
              cajeroId: updated.cajeroId,
              cajeroNombre: updated.cajeroNombre,
              estado: updated.estado,
              total: updated.total,
              itemsCount: updated.items.length,
              timestamp: updated.updatedAt,
            });
          }
          get().cargarPreventas(tenantId);
          return true;
        }
      }
      return false;
    },

    procesarCobro: async (input: CobrarPrefacturaInput) => {
      set({ isLoading: true });
      const res = await prefacturaService.registrarCobroEnCaja(input);

      if (res.ok) {
        set({ isModalCobroOpen: false, preventaSeleccionada: null, isLoading: false });
        const updated = res.prefactura;
        if (updated) {
          // Difundir liquidación en tiempo real a todas las pantallas
          await supabaseRealtimePreventasService.broadcastEvent({
            eventType: 'UPDATE_ESTADO_PREVENTA',
            tenantId: input.tenantId,
            prefacturaId: updated.id,
            codigoPreventa: updated.codigoPreventa,
            vendedorId: updated.vendedorId,
            vendedorNombre: updated.vendedorNombre,
            terminalId: updated.terminalId,
            cajeroId: updated.cajeroId,
            cajeroNombre: updated.cajeroNombre,
            estado: 'PAGADA',
            total: updated.total,
            itemsCount: updated.items.length,
            timestamp: updated.updatedAt,
          });
        }
        get().cargarPreventas(input.tenantId);
        return true;
      } else {
        set({ error: res.error, isLoading: false });
        return false;
      }
    },
  }))
);
