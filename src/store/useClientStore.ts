import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import * as localDb from '../services/localDb';

let dataService: IDataService = new LocalDataService();
export const setClientDataService = (ds: IDataService) => { dataService = ds; };

export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  tipoIdentificacion: 'NIT' | 'CC' | 'CE';
  tipoPersona: 'NATURAL' | 'JURIDICA';
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  encargadoCompras?: string;
  cupoCredito: number;
  activo: boolean;
}

interface ClientState {
  clientes: Cliente[];
  lastClientPrices: Record<string, Record<string, number>>;
  loadClientes: (initialClientes?: Cliente[]) => void;
  setClientes: (clientesOrUpdater: any) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (id: string, data: Partial<Cliente>) => void;
  getClienteById: (id: string) => Cliente | undefined;
  loadLastClientPrices: () => void;
  setLastClientPrices: (pricesOrUpdater: any) => void;
  updateLastClientPrice: (identificacion: string, sku: string, price: number) => void;
}

export const useClientStore = create<ClientState>()((set, get) => ({
  clientes: [],
  lastClientPrices: {},

  loadClientes: async (initialClientes = []) => {
    try {
      const loaded = await dataService.getAll<Cliente>('clientes');
      set({ clientes: loaded.length ? loaded : initialClientes });
    } catch {
      set({ clientes: initialClientes });
    }
  },

  setClientes: (clientesOrUpdater: any) => set((state) => {
    const newClientes = typeof clientesOrUpdater === 'function' ? clientesOrUpdater(state.clientes) : clientesOrUpdater;
    return { clientes: newClientes };
  }),

  addCliente: (cliente) => {
    dataService.create('clientes', cliente);
    set((state) => ({ clientes: [...state.clientes, cliente] }));
  },

  updateCliente: (id, data) => {
    dataService.update('clientes', id, data);
    set((state) => ({
      clientes: state.clientes.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },

  getClienteById: (id) => get().clientes.find(c => c.id === id),

  loadLastClientPrices: () => {
    const loaded = localDb.load<Record<string, Record<string, number>> | null>('lastClientPrices', null);
    set({ lastClientPrices: loaded ?? {} });
  },

  setLastClientPrices: (pricesOrUpdater: any) => set((state) => {
    const newPrices = typeof pricesOrUpdater === 'function' ? pricesOrUpdater(state.lastClientPrices) : pricesOrUpdater;
    localDb.save('lastClientPrices', newPrices);
    return { lastClientPrices: newPrices };
  }),

  updateLastClientPrice: (identificacion, sku, price) => {
    set((state) => {
      const key = identificacion.trim().toLowerCase();
      const updated = {
        ...state.lastClientPrices,
        [key]: {
          ...(state.lastClientPrices[key] || {}),
          [sku]: price
        }
      };
      localDb.save('lastClientPrices', updated);
      return { lastClientPrices: updated };
    });
  },
}));
