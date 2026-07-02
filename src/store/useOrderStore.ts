import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { Pedido } from '../types/orders.types';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setOrderDataService = (ds: IDataService) => { dataService = ds; };

interface Cotizacion {
  id: string;
  fecha: string;
  cliente: string;
  clienteId?: string;
  total: number;
  items?: any[];
  estado?: string;
  fechaActualizacion?: string;
}

interface OrderState {
  ventas: Pedido[];
  quotations: Cotizacion[];
  loadOrders: () => void;
  addVenta: (venta: Pedido) => void;
  updateVenta: (id: string, data: Partial<Pedido>) => void;
  addQuotation: (quotation: Cotizacion) => void;
  updateQuotation: (id: string, data: Partial<Cotizacion>) => void;
  setVentas: (ventasOrUpdater: any) => void;
  setQuotations: (quotationsOrUpdater: any) => void;
}

export const useOrderStore = create<OrderState>()(
  zustandConsoleMiddleware((set) => ({
  ventas: [],
  quotations: [],

  loadOrders: async () => {
    try {
      const [savedVentas, savedQuotations] = await Promise.all([
        dataService.getAll<Pedido>('ventas'),
        dataService.getAll<Cotizacion>('cotizaciones'),
      ]);
      set({ ventas: savedVentas, quotations: savedQuotations });
    } catch {
      set({ ventas: [], quotations: [] });
    }
  },

  addVenta: (venta) => {
    dataService.create('ventas', venta);
    set((state) => ({ ventas: [...state.ventas, venta] }));
  },

  updateVenta: (id, data) => {
    dataService.update('ventas', id, data);
    set((state) => ({
      ventas: state.ventas.map(v => v.id === id ? { ...v, ...data } : v),
    }));
  },

  setVentas: (ventasOrUpdater: any) => set((state) => {
    const newVentas = typeof ventasOrUpdater === 'function' ? ventasOrUpdater(state.ventas) : ventasOrUpdater;
    return { ventas: newVentas };
  }),

  addQuotation: (quotation) => {
    dataService.create('cotizaciones', quotation);
    set((state) => ({ quotations: [...state.quotations, quotation] }));
  },

  updateQuotation: (id, data) => {
    dataService.update('cotizaciones', id, data);
    set((state) => ({
      quotations: state.quotations.map(q => q.id === id ? { ...q, ...data } : q),
    }));
  },

  setQuotations: (quotationsOrUpdater: any) => set((state) => {
    const newQuotations = typeof quotationsOrUpdater === 'function' ? quotationsOrUpdater(state.quotations) : quotationsOrUpdater;
    return { quotations: newQuotations };
  }),
  })));
