// src/stores/useCashierKanbanStore.ts
// Store Zustand para el Tablero Kanban de Caja Única, filtros por asesor y recaudo (SPEC-037)

import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import type { Prefactura, EstadoPrefactura, CobrarPrefacturaInput } from '../types/prefactura.types';
import { prefacturaService } from '../services/prefacturaService';

interface CashierKanbanState {
  preventas: Prefactura[];
  filtroAsesorId: string | 'TODOS';
  preventaSeleccionada: Prefactura | null;
  isModalCobroOpen: boolean;
  isLoading: boolean;
  error: string | null;

  cargarPreventas: (tenantId: string) => Promise<void>;
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

export const useCashierKanbanStore = create<CashierKanbanState>()(
  zustandConsoleMiddleware((set, get) => ({
    preventas: [],
    filtroAsesorId: 'TODOS',
    preventaSeleccionada: null,
    isModalCobroOpen: false,
    isLoading: false,
    error: null,

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
        get().cargarPreventas(input.tenantId);
        return true;
      } else {
        set({ error: res.error, isLoading: false });
        return false;
      }
    },
  }))
);
