import { create } from 'zustand';
import * as localDb from '../services/localDb';
import { Pedido } from '../types/orders.types';

// TODO: Importar Cotizacion desde sus tipos, si no existe la definimos temporalmente
interface Cotizacion {
  id: string;
  fecha: string;
  cliente: string;
  total: number;
  // ... otros campos
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

export const useOrderStore = create<OrderState>()((set) => ({
  ventas: [],
  quotations: [],

  loadOrders: () => {
    const savedVentas = localDb.load<Pedido[]>('ventas', []);
    const savedQuotations = localDb.load<Cotizacion[]>('quotations', []);
    set({ ventas: savedVentas, quotations: savedQuotations });
  },

  addVenta: (venta) => set((state) => {
    const newVentas = [...state.ventas, venta];
    localDb.save('ventas', newVentas);
    return { ventas: newVentas };
  }),

  updateVenta: (id, data) => set((state) => {
    const newVentas = state.ventas.map(v => 
      v.id === id ? { ...v, ...data } : v
    );
    localDb.save('ventas', newVentas);
    return { ventas: newVentas };
  }),

  // Drop-in replacement para el antiguo setVentas de App.tsx
  setVentas: (ventasOrUpdater: any) => set((state) => {
    const newVentas = typeof ventasOrUpdater === 'function' ? ventasOrUpdater(state.ventas) : ventasOrUpdater;
    localDb.save('ventas', newVentas);
    return { ventas: newVentas };
  }),

  addQuotation: (quotation) => set((state) => {
    const newQuotations = [...state.quotations, quotation];
    localDb.save('quotations', newQuotations);
    return { quotations: newQuotations };
  }),

  updateQuotation: (id, data) => set((state) => {
    const newQuotations = state.quotations.map(q => 
      q.id === id ? { ...q, ...data } : q
    );
    localDb.save('quotations', newQuotations);
    return { quotations: newQuotations };
  }),

  // Drop-in replacement para el antiguo setQuotations de App.tsx
  setQuotations: (quotationsOrUpdater: any) => set((state) => {
    const newQuotations = typeof quotationsOrUpdater === 'function' ? quotationsOrUpdater(state.quotations) : quotationsOrUpdater;
    localDb.save('quotations', newQuotations);
    return { quotations: newQuotations };
  })
}));
