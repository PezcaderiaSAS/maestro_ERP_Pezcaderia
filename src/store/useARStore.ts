import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';

let dataService: IDataService = new LocalDataService();
export const setARDataService = (ds: IDataService) => { dataService = ds; };

export interface PaymentAR {
  id: string;
  fecha: string;
  monto: number;
  metodo: 'Transferencia' | 'Datáfono' | 'Efectivo';
}

export interface InvoiceAR {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteIdentificacion: string;
  fecha: string;
  fechaVencimiento?: string;
  observaciones?: string;
  total: number;
  saldo: number;
  pagado: number;
  pagos: PaymentAR[];
}

function buildSeedCartera(): InvoiceAR[] {
  return [
    {
      id: 'PED-045091',
      clienteId: 'c-1',
      clienteNombre: 'Restaurante Central',
      clienteIdentificacion: '123',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      total: 350000,
      saldo: 200000,
      pagado: 150000,
      pagos: [
        { id: 'pgo-1', fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), monto: 150000, metodo: 'Transferencia' }
      ]
    },
    {
      id: 'PED-098231',
      clienteId: 'c-2',
      clienteNombre: 'Restaurante del Mar',
      clienteIdentificacion: '900123456-1',
      fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      total: 500000,
      saldo: 500000,
      pagado: 0,
      pagos: []
    }
  ];
}

interface ARState {
  cartera: InvoiceAR[];
  loadCartera: () => void;
  setCartera: (carteraOrUpdater: any) => void;
  addInvoice: (invoice: InvoiceAR) => void;
  updateInvoice: (id: string, data: Partial<InvoiceAR>) => void;
}

export const useARStore = create<ARState>()((set) => ({
  cartera: [],

  loadCartera: async () => {
    try {
      const loaded = await dataService.getAll<InvoiceAR>('cartera_facturas');
      set({ cartera: loaded.length ? loaded : buildSeedCartera() });
    } catch {
      set({ cartera: buildSeedCartera() });
    }
  },

  setCartera: (carteraOrUpdater: any) => set((state) => {
    const newCartera = typeof carteraOrUpdater === 'function' ? carteraOrUpdater(state.cartera) : carteraOrUpdater;
    return { cartera: newCartera };
  }),

  addInvoice: (invoice) => {
    dataService.create('cartera_facturas', invoice);
    set((state) => ({ cartera: [...state.cartera, invoice] }));
  },

  updateInvoice: (id, data) => {
    dataService.update('cartera_facturas', id, data);
    set((state) => ({
      cartera: state.cartera.map(inv => inv.id === id ? { ...inv, ...data } : inv),
    }));
  },
}));
