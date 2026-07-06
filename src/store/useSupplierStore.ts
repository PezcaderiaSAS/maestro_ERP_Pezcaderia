import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setSupplierDataService = (ds: IDataService) => { dataService = ds; };

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  tipoIdentificacion: 'NIT' | 'CC';
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  contactoCompras?: string;
  plazoPagoDias: number;
  activo: boolean;
}

interface SupplierState {
  proveedores: Proveedor[];
  loadProveedores: (initialProveedores?: Proveedor[]) => void;
  setProveedores: (proveedoresOrUpdater: any) => void;
  addProveedor: (proveedor: Proveedor) => void;
  updateProveedor: (id: string, data: Partial<Proveedor>) => void;
}

export const useSupplierStore = create<SupplierState>()(
  zustandConsoleMiddleware((set) => ({
  proveedores: [],

  loadProveedores: async (initialProveedores = []) => {
    try {
      const loaded = await dataService.getAll<Proveedor>('proveedores');
      set({ proveedores: loaded.length ? loaded : initialProveedores });
    } catch {
      set({ proveedores: initialProveedores });
    }
  },

  setProveedores: (proveedoresOrUpdater: any) => {
    set((state) => ({
      proveedores: typeof proveedoresOrUpdater === 'function'
        ? proveedoresOrUpdater(state.proveedores)
        : proveedoresOrUpdater,
    }));
  },

  addProveedor: (proveedor) => {
    dataService.create('proveedores', proveedor);
    set((state) => ({ proveedores: [...state.proveedores, proveedor] }));
  },

  updateProveedor: (id, data) => {
    dataService.update('proveedores', id, data);
    set((state) => ({
      proveedores: state.proveedores.map(p => p.id === id ? { ...p, ...data } : p),
    }));
  },
  })));
