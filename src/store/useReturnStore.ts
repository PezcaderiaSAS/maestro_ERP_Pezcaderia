import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setReturnDataService = (ds: IDataService) => { dataService = ds; };

export interface DevolucionPedido {
  id: string;
  pedidoId: string;
  pedidoNo: string;
  clienteId: string;
  clienteNombre: string;
  conductorId: string;
  conductorNombre: string;
  estado: 'PROGRAMADA' | 'RECIBIDA_BODEGA' | 'VALIDADA_FINANZAS' | 'ANULADA';
  fechaProgramacion: string;
  fechaRecibido?: string;
  recibidoPor?: string;
  fechaValidacion?: string;
  items: Array<{
    sku: string;
    nombre: string;
    cantidadSolicitada: number;
    cantidadRecibida?: number;
    precioUnitarioVenta: number;
    estadoCalidad?: 'APROBADO_REINGRESO' | 'DESCARTE_MERMA';
    estadoFisico?: 'APTO_INVENTARIO' | 'AVERIA_DESCARTE' | 'RECHAZADO';
    loteInventario?: string;
  }>;
}

interface ReturnState {
  devoluciones: DevolucionPedido[];
  loadDevoluciones: () => void;
  setDevoluciones: (devolucionesOrUpdater: any) => void;
  addDevolucion: (devolucion: DevolucionPedido) => void;
  updateDevolucion: (id: string, data: Partial<DevolucionPedido>) => void;
}

export const useReturnStore = create<ReturnState>()(
  zustandConsoleMiddleware((set) => ({
  devoluciones: [],

  loadDevoluciones: async () => {
    try {
      const loaded = await dataService.getAll<DevolucionPedido>('devoluciones');
      set({ devoluciones: loaded });
    } catch {
      set({ devoluciones: [] });
    }
  },

  setDevoluciones: (devolucionesOrUpdater: any) => set((state) => {
    const newDevoluciones = typeof devolucionesOrUpdater === 'function' ? devolucionesOrUpdater(state.devoluciones) : devolucionesOrUpdater;
    return { devoluciones: newDevoluciones };
  }),

  addDevolucion: (devolucion) => {
    dataService.create('devoluciones', devolucion);
    set((state) => ({ devoluciones: [...state.devoluciones, devolucion] }));
  },

  updateDevolucion: (id, data) => {
    dataService.update('devoluciones', id, data);
    set((state) => ({
      devoluciones: state.devoluciones.map(d => d.id === id ? { ...d, ...data } : d),
    }));
  },
  })));
