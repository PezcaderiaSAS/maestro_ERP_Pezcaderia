import { create } from 'zustand';
import * as localDb from '../services/localDb';

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
  setProveedores: (proveedores: Proveedor[]) => void;
  addProveedor: (proveedor: Proveedor) => void;
  updateProveedor: (id: string, data: Partial<Proveedor>) => void;
}

export const useSupplierStore = create<SupplierState>()((set) => ({
  proveedores: [],

  loadProveedores: (initialProveedores = []) => {
    const loaded = localDb.load<Proveedor[]>('proveedores', initialProveedores);
    // Solo usamos initialProveedores si loaded viene vacío y no había datos
    // En localDb.load, si no existe el key, retorna el default.
    set({ proveedores: loaded });
  },

  setProveedores: (proveedores: Proveedor[]) => {
    localDb.save('proveedores', proveedores);
    set({ proveedores });
  },

  addProveedor: (proveedor) => set((state) => {
    const newProveedores = [...state.proveedores, proveedor];
    localDb.save('proveedores', newProveedores);
    return { proveedores: newProveedores };
  }),

  updateProveedor: (id, data) => set((state) => {
    const newProveedores = state.proveedores.map(p => 
      p.id === id ? { ...p, ...data } : p
    );
    localDb.save('proveedores', newProveedores);
    return { proveedores: newProveedores };
  })
}));
