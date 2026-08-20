import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { cashService } from '../services/cashService';

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
  loadGastos: () => Promise<void>;
  setGastos: (gastosOrUpdater: any) => void;
  addGasto: (gasto: Gasto) => void;
  addGastoAsync: (gasto: Gasto) => Promise<void>;
  updateGasto: (id: string, data: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;
}

const syncGastoConCaja = (gasto: Gasto) => {
  try {
    cashService.seedCajasParaBodegas();
    const todosTurnos = cashService.getTurnos();
    const turnoActivo = todosTurnos.find(t => t.estado === 'ABIERTO');

    if (turnoActivo) {
      let metodo: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' = 'TRANSFERENCIA';
      const mpUpper = (gasto.metodoPago || '').toUpperCase();
      if (mpUpper.includes('EFECTIVO') || mpUpper.includes('MENOR')) {
        metodo = 'EFECTIVO';
      } else if (mpUpper.includes('DATAFONO') || mpUpper.includes('TARJETA')) {
        metodo = 'DATAFONO';
      }

      cashService.registrarMovimiento(
        turnoActivo.id,
        turnoActivo.cajaId,
        'EGRESO_GASTO',
        metodo,
        gasto.monto,
        `Gasto [${gasto.categoria}]: ${gasto.concepto}`,
        gasto.id,
        'SISTEMA'
      );
    }
  } catch (err) {
    console.error('Error al sincronizar gasto con flujo de caja:', err);
  }
};

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
    syncGastoConCaja(gasto);
    set((state) => ({ gastos: [gasto, ...state.gastos] }));
  },

  addGastoAsync: async (gasto) => {
    await dataService.create('gastos', gasto);
    syncGastoConCaja(gasto);
    set((state) => ({ gastos: [gasto, ...state.gastos] }));
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

