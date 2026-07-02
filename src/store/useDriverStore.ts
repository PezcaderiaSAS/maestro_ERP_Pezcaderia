import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setDriverDataService = (ds: IDataService) => { dataService = ds; };

export interface Conductor {
  id: string;
  nombre: string;
  identificacion: string;
  licencia: string;
  celular: string;
  activo: boolean;
}

const INITIAL_CONDUCTORES: Conductor[] = [
  { id: 'cond-1', nombre: 'José Daniel Ortiz', identificacion: '10203040', licencia: 'C2-10203040', celular: '3129998877', activo: true },
  { id: 'cond-2', nombre: 'Carlos Mario Giraldo', identificacion: '80907060', licencia: 'C2-80907060', celular: '3157776655', activo: true },
];

interface DriverState {
  conductores: Conductor[];
  loadConductores: () => void;
  setConductores: (conductoresOrUpdater: any) => void;
  addConductor: (conductor: Conductor) => void;
  updateConductor: (id: string, data: Partial<Conductor>) => void;
}

export const useDriverStore = create<DriverState>()(
  zustandConsoleMiddleware((set) => ({
  conductores: [],

  loadConductores: async () => {
    try {
      const loaded = await dataService.getAll<Conductor>('conductores');
      set({ conductores: loaded.length ? loaded : INITIAL_CONDUCTORES });
    } catch {
      set({ conductores: INITIAL_CONDUCTORES });
    }
  },

  setConductores: (conductoresOrUpdater: any) => set((state) => {
    const newConductores = typeof conductoresOrUpdater === 'function' ? conductoresOrUpdater(state.conductores) : conductoresOrUpdater;
    return { conductores: newConductores };
  }),

  addConductor: (conductor) => {
    dataService.create('conductores', conductor);
    set((state) => ({ conductores: [...state.conductores, conductor] }));
  },

  updateConductor: (id, data) => {
    dataService.update('conductores', id, data);
    set((state) => ({
      conductores: state.conductores.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },
  })));
