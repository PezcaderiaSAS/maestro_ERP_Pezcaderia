import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setMovementDataService = (ds: IDataService) => { dataService = ds; };

export interface MovimientoInventario {
  id: string;
  timestamp: string;
  tipo: 'ENTRADA_COMPRA' | 'TRASLADO_SALIDA' | 'TRASLADO_ENTRADA' | 'PRODUCCION_CONSUMO' | 'PRODUCCION_SALIDA' | 'VENTA' | 'AJUSTE';
  sku: string;
  nombreProducto: string;
  bodegaOrigen?: string;
  bodegaDestino?: string;
  cantidad: number;
  lote: string;
  referenciaId?: string;
  referenciaTipo?: string;
  actor: string;
  notas?: string;
}

interface MovementState {
  movimientos: MovimientoInventario[];
  loadMovimientos: () => void;
  addMovimiento: (mov: MovimientoInventario) => void;
  addMovimientoAsync: (mov: MovimientoInventario) => Promise<void>;
}

export const useMovementStore = create<MovementState>()(
  zustandConsoleMiddleware((set) => ({
  movimientos: [],

  loadMovimientos: async () => {
    try {
      const loaded = await dataService.getAll<MovimientoInventario>('inventario_movimientos');
      set({ movimientos: loaded });
    } catch {
      set({ movimientos: [] });
    }
  },



  addMovimiento: (mov) => {
    dataService.create('inventario_movimientos', mov);
    set((state) => ({ movimientos: [mov, ...state.movimientos] }));
  },

  addMovimientoAsync: async (mov) => {
    await dataService.create('inventario_movimientos', mov);
    set((state) => ({ movimientos: [mov, ...state.movimientos] }));
  },
  })));
