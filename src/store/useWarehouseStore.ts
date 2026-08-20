import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setWarehouseDataService = (ds: IDataService) => { dataService = ds; };

export interface Bodega {
  id: string;
  nombre: string;
  ubicacion?: string;
  activa: boolean;
  metadata?: Record<string, string>;
}

interface WarehouseState {
  bodegas: Bodega[];
  activaId?: string;
  setActivaId: (id: string) => void;
  loadBodegas: () => void;
  addBodega: (bodega: Bodega) => void;
  updateBodega: (id: string, data: Partial<Bodega>) => void;
  deleteBodega: (id: string) => void;
  setBodegas: (bodegasOrUpdater: any) => void;
  getPrimaryBodega: () => Bodega | undefined;
}

const DEFAULT_BODEGAS: Bodega[] = [
  { id: '1', nombre: 'Bodega Principal', activa: true },
  { id: '2', nombre: 'Bodega Averías', activa: true },
];

export const useWarehouseStore = create<WarehouseState>()(
  zustandConsoleMiddleware((set, get) => ({
  bodegas: [],
  activaId: undefined,

  setActivaId: (id: string) => {
    set({ activaId: id });
    import('../services/cashService').then(({ cashService }) => {
      cashService.seedCajasParaBodegas();
    });
  },

  loadBodegas: async () => {
    try {
      const loaded = await dataService.getAll<Bodega>('bodegas');
      set({ bodegas: loaded.length ? loaded : DEFAULT_BODEGAS });
    } catch {
      set({ bodegas: DEFAULT_BODEGAS });
    }
  },

  addBodega: (bodega) => {
    dataService.create('bodegas', bodega);
    set((state) => {
      const newBodegas = [...state.bodegas, bodega];
      import('../services/cashService').then(({ cashService }) => { cashService.seedCajasParaBodegas(); });
      return { bodegas: newBodegas };
    });
  },

  updateBodega: (id, data) => {
    dataService.update('bodegas', id, data);
    set((state) => ({
      bodegas: state.bodegas.map(b => b.id === id ? { ...b, ...data } : b),
    }));
  },

  deleteBodega: (id) => {
    dataService.hardDelete('bodegas', id);
    set((state) => ({ bodegas: state.bodegas.filter(b => b.id !== id) }));
  },

  setBodegas: (bodegasOrUpdater: any) => set((state) => {
    const newBodegas = typeof bodegasOrUpdater === 'function' ? bodegasOrUpdater(state.bodegas) : bodegasOrUpdater;
    return { bodegas: newBodegas };
  }),

  getPrimaryBodega: () => {
    const { bodegas } = get();
    return bodegas.find(b => b.nombre === 'Bodega Principal') || bodegas.find(b => b.activa);
  },
  })));
