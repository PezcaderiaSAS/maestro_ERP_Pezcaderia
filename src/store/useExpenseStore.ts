import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setExpenseDataService = (ds: IDataService) => { dataService = ds; };

export interface Gasto {
  id: string;
  fecha: string;
  categoria: 'NÓMINA' | 'INVENTARIO' | 'SERVICIOS_PUBLICOS' | 'IMPUESTOS' | 'MANTENIMIENTO' | 'OTROS';
  concepto: string;
  monto: number;
  referenciaId?: string;
  metodoPago: string;
}

interface ExpenseState {
  gastos: Gasto[];
  loadGastos: () => void;
  setGastos: (gastosOrUpdater: any) => void;
  addGasto: (gasto: Gasto) => void;
  updateGasto: (id: string, data: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;
}

export const useExpenseStore = create<ExpenseState>()(
  zustandConsoleMiddleware((set) => ({
  gastos: [],

  loadGastos: async () => {
    try {
      const loaded = await dataService.getAll<Gasto>('gastos');
      set({ gastos: loaded });
    } catch {
      set({ gastos: [] });
    }
  },

  setGastos: (gastosOrUpdater: any) => set((state) => {
    const newGastos = typeof gastosOrUpdater === 'function' ? gastosOrUpdater(state.gastos) : gastosOrUpdater;
    return { gastos: newGastos };
  }),

  addGasto: (gasto) => {
    dataService.create('gastos', gasto);
    set((state) => ({ gastos: [...state.gastos, gasto] }));
  },

  updateGasto: (id, data) => {
    dataService.update('gastos', id, data);
    set((state) => ({
      gastos: state.gastos.map(g => g.id === id ? { ...g, ...data } : g),
    }));
  },

  deleteGasto: (id) => {
    dataService.hardDelete('gastos', id);
    set((state) => ({ gastos: state.gastos.filter(g => g.id !== id) }));
  },
  })));
