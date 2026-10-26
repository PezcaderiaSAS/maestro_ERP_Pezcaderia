// src/stores/useMultiVendorPosStore.ts
// Store Zustand para gestión de terminal POS (1 a 8) y vendedor activo en caja única concurrente

import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

export interface VendedorSesion {
  id: string;
  nombre: string;
  rol: string;
  pin?: string;
  avatarUrl?: string;
}

interface MultiVendorPosState {
  terminalId: string;
  vendedorActivo: VendedorSesion | null;
  turnoCentralEstado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO';
  turnoCentralId: string | null;

  setTerminalId: (id: string) => void;
  setVendedorActivo: (vendedor: VendedorSesion | null) => void;
  setTurnoCentralEstado: (estado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO', turnoId: string | null) => void;
  clearVendedor: () => void;
}

const STORAGE_KEY_TERMINAL = 'erp_pos_terminal_id';

const getInitialTerminal = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(STORAGE_KEY_TERMINAL) || 'TERM-01';
  }
  return 'TERM-01';
};

export const useMultiVendorPosStore = create<MultiVendorPosState>()(
  zustandConsoleMiddleware((set) => ({
    terminalId: getInitialTerminal(),
    vendedorActivo: {
      id: 'emp-cajero-default',
      nombre: 'Vendedor de Turno',
      rol: 'VENDEDOR',
    },
    turnoCentralEstado: 'ABIERTO',
    turnoCentralId: null,

    setTerminalId: (id: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_TERMINAL, id);
      }
      set({ terminalId: id });
    },

    setVendedorActivo: (vendedor: VendedorSesion | null) => {
      set({ vendedorActivo: vendedor });
    },

    setTurnoCentralEstado: (estado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO', turnoId: string | null) => {
      set({ turnoCentralEstado: estado, turnoCentralId: turnoId });
    },

    clearVendedor: () => {
      set({ vendedorActivo: null });
    },
  }))
);
