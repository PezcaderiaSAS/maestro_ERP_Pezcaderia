import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { Pedido } from '../types/orders.types';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { getSupabaseClient } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

let dataService: IDataService = new LocalDataService();
export const setOrderDataService = (ds: IDataService) => { dataService = ds; };

export interface Cotizacion {
  id: string;
  fecha: string;
  cliente: string;
  clienteId?: string;
  total: number;
  items?: any[];
  lineas?: any[];
  montoTotal?: number;
  subtotal?: number;
  estado?: string;
  fechaActualizacion?: string;
  [key: string]: any;
}

interface OrderState {
  ventas: Pedido[];
  quotations: Cotizacion[];
  subscription: RealtimeChannel | null;
  loadOrders: () => void;
  addVenta: (venta: Pedido) => void;
  updateVenta: (id: string, data: Partial<Pedido>) => void;
  addQuotation: (quotation: Cotizacion) => void;
  updateQuotation: (id: string, data: Partial<Cotizacion>) => void;
  setVentas: (ventasOrUpdater: any) => void;
  setQuotations: (quotationsOrUpdater: any) => void;
  subscribeToOrders: (branchId: string) => void;
  unsubscribeFromOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
  zustandConsoleMiddleware((set, get) => ({
  ventas: [],
  quotations: [],
  subscription: null,

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

  subscribeToOrders: (branchId: string) => {
    const { subscription } = get();
    if (subscription) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT') {
            set((state) => ({ ventas: [...state.ventas, newRecord as any] }));
          } else if (eventType === 'UPDATE') {
            set((state) => ({
              ventas: state.ventas.map(v => v.id === newRecord.id ? { ...v, ...newRecord } : v)
            }));
          } else if (eventType === 'DELETE') {
            set((state) => ({
              ventas: state.ventas.filter(v => v.id !== oldRecord.id)
            }));
          }
        }
      )
      .subscribe();

    set({ subscription: channel });
  },

  unsubscribeFromOrders: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  }
  })));
