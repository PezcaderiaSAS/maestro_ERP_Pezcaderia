import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { TurnoCaja } from '../types/cash.types';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setCashDataService = (ds: IDataService) => { dataService = ds; };

interface CashState {
  turnoActivo: TurnoCaja | null;
  loadTurnoActivo: (cajaId: string) => void;
  loadTurnoActivoPorCajero: (cajeroId: string) => void;
  setTurnoActivo: (turno: TurnoCaja | null) => void;
  clearTurnoActivo: () => void;
}

export const useCashStore = create<CashState>()(
  zustandConsoleMiddleware((set) => ({
  turnoActivo: null,

  loadTurnoActivo: async (cajaId: string) => {
    try {
      const turnos = await dataService.getAll<TurnoCaja>('turnos_caja');
      const turno = turnos.find(t => t.cajaId === cajaId && t.estado === 'ABIERTO') || null;
      set({ turnoActivo: turno });
    } catch {
      set({ turnoActivo: null });
    }
  },

  loadTurnoActivoPorCajero: async (cajeroId: string) => {
    try {
      const turnos = await dataService.getAll<TurnoCaja>('turnos_caja');
      const turno = turnos.find(t => t.cajeroId === cajeroId && t.estado === 'ABIERTO') || null;
      set({ turnoActivo: turno });
    } catch {
      set({ turnoActivo: null });
    }
  },

  setTurnoActivo: (turno) => set({ turnoActivo: turno }),

  clearTurnoActivo: () => set({ turnoActivo: null }),
  })));
