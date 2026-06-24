import { create } from 'zustand';
import * as localDb from '../services/localDb';

export interface Bodega {
  id: string;
  nombre: string;
  ubicacion?: string;
  activa: boolean;
  metadata?: Record<string, string>;
}

interface WarehouseState {
  bodegas: Bodega[];
  loadBodegas: () => void;
  addBodega: (bodega: Bodega) => void;
  updateBodega: (id: string, data: Partial<Bodega>) => void;
  deleteBodega: (id: string) => void;
  setBodegas: (bodegasOrUpdater: any) => void;
  getPrimaryBodega: () => Bodega | undefined;
}

export const useWarehouseStore = create<WarehouseState>()((set, get) => ({
  bodegas: [],

  loadBodegas: () => {
    // Si no hay bodegas en db, se carga la por defecto.
    const savedBodegas = localDb.load<Bodega[]>('bodegas', [
      { id: '1', nombre: 'Bodega Principal', activa: true },
      { id: '2', nombre: 'Bodega Averías', activa: true }
    ]);
    set({ bodegas: savedBodegas });
  },

  addBodega: (bodega) => set((state) => {
    const newBodegas = [...state.bodegas, bodega];
    localDb.save('bodegas', newBodegas);
    return { bodegas: newBodegas };
  }),

  updateBodega: (id, data) => set((state) => {
    const newBodegas = state.bodegas.map(b => 
      b.id === id ? { ...b, ...data } : b
    );
    localDb.save('bodegas', newBodegas);
    return { bodegas: newBodegas };
  }),

  deleteBodega: (id) => set((state) => {
    const newBodegas = state.bodegas.filter(b => b.id !== id);
    localDb.save('bodegas', newBodegas);
    return { bodegas: newBodegas };
  }),

  // Drop-in replacement para App.tsx
  setBodegas: (bodegasOrUpdater: any) => set((state) => {
    const newBodegas = typeof bodegasOrUpdater === 'function' ? bodegasOrUpdater(state.bodegas) : bodegasOrUpdater;
    localDb.save('bodegas', newBodegas);
    return { bodegas: newBodegas };
  }),

  getPrimaryBodega: () => {
    const { bodegas } = get();
    // Intenta buscar la que se llame 'Bodega Principal' u obtiene la primera activa
    return bodegas.find(b => b.nombre === 'Bodega Principal') || bodegas.find(b => b.activa);
  }
}));
