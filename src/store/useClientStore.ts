import { create } from 'zustand';
import * as localDb from '../services/localDb';

// Reusing the Cliente interface from App.tsx
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
  cupoCredito: number; // Para validación en ventas a crédito
  activo: boolean;
}

interface ClientState {
  clientes: Cliente[];
  loadClientes: (initialClientes?: Cliente[]) => void;
  setClientes: (clientesOrUpdater: any) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (id: string, data: Partial<Cliente>) => void;
  getClienteById: (id: string) => Cliente | undefined;
}

export const useClientStore = create<ClientState>()((set, get) => ({
  clientes: [],

  loadClientes: (initialClientes = []) => {
    const loaded = localDb.load<Cliente[]>('clientes', initialClientes);
    set({ clientes: loaded });
  },

  setClientes: (clientesOrUpdater: any) => set((state) => {
    const newClientes = typeof clientesOrUpdater === 'function' ? clientesOrUpdater(state.clientes) : clientesOrUpdater;
    localDb.save('clientes', newClientes);
    return { clientes: newClientes };
  }),

  addCliente: (cliente) => set((state) => {
    const newClientes = [...state.clientes, cliente];
    localDb.save('clientes', newClientes);
    return { clientes: newClientes };
  }),

  updateCliente: (id, data) => set((state) => {
    const newClientes = state.clientes.map(c => 
      c.id === id ? { ...c, ...data } : c
    );
    localDb.save('clientes', newClientes);
    return { clientes: newClientes };
  }),

  getClienteById: (id) => {
    return get().clientes.find(c => c.id === id);
  }
}));
