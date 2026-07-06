import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setPurchaseDataService = (ds: IDataService) => { dataService = ds; };

export interface ItemOrdenCompra {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  lote: string;
}

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  estado: 'RECIBIDA';
  items: ItemOrdenCompra[];
  totalCompra: number;
  subtotal?: number;
  iva?: number;
  valorIva?: number;
  fletes?: number;
  formaPago?: 'CONTADO' | 'CREDITO';
  saldo?: number;
  bodegaDestino: string;
  actor: string;
  notas?: string;
}

interface PurchaseState {
  ordenesCompra: OrdenCompra[];
  loadOrdenesCompra: () => void;
  setOrdenesCompra: (ordenesOrUpdater: any) => void;
  addOrdenCompra: (oc: OrdenCompra) => void;
  updateOrdenCompra: (id: string, data: Partial<OrdenCompra>) => void;
}

export const usePurchaseStore = create<PurchaseState>()(
  zustandConsoleMiddleware((set) => ({
  ordenesCompra: [],

  loadOrdenesCompra: async () => {
    try {
      const loaded = await dataService.getAll<OrdenCompra>('ordenes_compra');
      set({ ordenesCompra: loaded });
    } catch {
      set({ ordenesCompra: [] });
    }
  },

  setOrdenesCompra: (ordenesOrUpdater: any) => set((state) => {
    const newOrdenes = typeof ordenesOrUpdater === 'function' ? ordenesOrUpdater(state.ordenesCompra) : ordenesOrUpdater;
    return { ordenesCompra: newOrdenes };
  }),

  addOrdenCompra: (oc) => {
    dataService.create('ordenes_compra', oc);
    set((state) => ({ ordenesCompra: [...state.ordenesCompra, oc] }));
  },

  updateOrdenCompra: (id, data) => {
    dataService.update('ordenes_compra', id, data);
    set((state) => ({
      ordenesCompra: state.ordenesCompra.map(o => o.id === id ? { ...o, ...data } : o),
    }));
  },
  })));
