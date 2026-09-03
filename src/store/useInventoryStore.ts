import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setInventoryDataService = (ds: IDataService) => { dataService = ds; };

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida?: 'kg' | 'und' | 'lb' | 'gr';
  imagen?: string;
  codigo_barras?: string;
  iva?: number;
  ivaIncluido?: boolean;
  control_inventario?: boolean;
  produccion?: boolean;
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
  activo: boolean;
  metadata?: Record<string, string>;
  categoriaABC?: 'A' | 'B' | 'C';
  porcentaje_merma_esperada?: number;
  promocion_activa?: any;
}

interface InventoryState {
  productsCatalog: any[];
  productPricings: any[];
  products: Producto[];
  stock: Record<string, Record<string, number>>;
  stockReserved: Record<string, Record<string, number>>;
  loadInventory: () => void;
  loadStock: () => void;
  setProducts: (productsOrUpdater: any) => void;
  setProductsCatalog: (catalogOrUpdater: any) => void;
  setProductPricings: (pricingsOrUpdater: any) => void;
  setStock: (stockOrUpdater: any) => void;
  setStockAsync: (stockOrUpdater: any) => Promise<void>;
  getProductoById: (id: string) => Producto | undefined;
  reservarStock: (sku: string, bodega: string, qty: number) => Promise<void>;
  confirmarDespacho: (sku: string, bodega: string, qtyTeorica: number, qtyReal: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
  zustandConsoleMiddleware((set, get) => ({
  productsCatalog: [],
  productPricings: [],
  products: [],
  stock: {},
  stockReserved: {},

  loadInventory: async () => {
    try {
      const [catalog, pricings] = await Promise.all([
        dataService.getAll<any>('productos_catalogo'),
        dataService.getAll<any>('productos_precios'),
      ]);

      const unifiedProducts: Producto[] = catalog.map((cat: any) => {
        const productPricingsList = pricings.filter((pr: any) => pr.productoId === cat.id);
        let currentPricing = productPricingsList[0];
        if (productPricingsList.length > 1) {
          currentPricing = productPricingsList.reduce((latest: any, current: any) =>
            new Date(current.vigenciaDesde) > new Date(latest.vigenciaDesde) ? current : latest
          );
        }
        return {
          precio_compra: cat.precio_compra ?? 0,
          buffer_seguridad: cat.buffer_seguridad ?? 5,
          precio_venta_pos: cat.precio_venta_pos ?? 0,
          precio_venta_restaurante: cat.precio_venta_restaurante ?? cat.precio_venta_pos ?? 0,
          precio_venta_mayorista: cat.precio_venta_mayorista ?? cat.precio_venta_pos ?? 0,
          ...cat,
          ...(currentPricing || {}),
          categoriaABC: cat.categoriaABC || 'C'
        } as Producto;
      });

      set({ productsCatalog: catalog, productPricings: pricings, products: unifiedProducts });
    } catch {
      set({ productsCatalog: [], productPricings: [], products: [] });
    }
  },

  loadStock: () => {
    dataService.getAll<any>('stock').then(raw => {
      const saved = (Array.isArray(raw) && raw.length ? raw[0] : raw) || {};
      let needsSave = false;
      const migrated: any = { id: 'singleton' };

      for (const bodega in saved) {
        if (bodega === 'id') continue;
        if (Array.isArray(saved[bodega])) {
          needsSave = true;
          migrated[bodega] = {};
          saved[bodega].forEach((item: any) => {
            if (item && item.sku && typeof item.stock === 'number') {
              migrated[bodega][item.sku] = item.stock;
            }
          });
        } else {
          migrated[bodega] = saved[bodega] || {};
        }
      }

      if (needsSave || (!Array.isArray(raw) && Object.keys(saved).length > 0)) {
        console.log('Migración de stock ejecutada: array -> dict O(1) vía dataService');
        if (!Array.isArray(raw) || raw.length === 0) {
          dataService.create('stock', migrated).catch(console.error);
        } else {
          dataService.update('stock', raw[0].id || 'singleton', migrated).catch(console.error);
        }
      }

      // Eliminar el id para el estado interno
      const stockState = { ...migrated };
      delete stockState.id;
      set({ stock: stockState });
    }).catch(err => {
      console.error('Error loading stock:', err);
      set({ stock: {} });
    });
  },

  setProducts: (productsOrUpdater: any) => set((state) => ({
    products: typeof productsOrUpdater === 'function' ? productsOrUpdater(state.products) : productsOrUpdater,
  })),

  setProductsCatalog: (catalogOrUpdater: any) => {
    const current = get().productsCatalog;
    const newCatalog = typeof catalogOrUpdater === 'function' ? catalogOrUpdater(current) : catalogOrUpdater;
    localDb.save('productsCatalog', newCatalog);
    set({ productsCatalog: newCatalog });
    get().loadInventory();
  },

  setProductPricings: (pricingsOrUpdater: any) => {
    const current = get().productPricings;
    const newPricings = typeof pricingsOrUpdater === 'function' ? pricingsOrUpdater(current) : pricingsOrUpdater;
    localDb.save('productPricings', newPricings);
    set({ productPricings: newPricings });
    get().loadInventory();
  },

  setStock: (stockOrUpdater: any) => set((state) => {
    const newStock = typeof stockOrUpdater === 'function' ? stockOrUpdater(state.stock) : stockOrUpdater;
    
    // Persistir de forma asíncrona mediante la abstracción dataService
    dataService.getAll<any>('stock').then(raw => {
      const id = (Array.isArray(raw) && raw.length > 0 && raw[0].id) ? raw[0].id : 'singleton';
      const payload = { id, ...newStock };
      
      if (!Array.isArray(raw) || raw.length === 0) {
        dataService.create('stock', payload).catch(console.error);
      } else {
        dataService.update('stock', id, payload).catch(console.error);
      }
    }).catch(console.error);

    return { stock: newStock };
  }),

  setStockAsync: async (stockOrUpdater: any) => {
    const state = get();
    const newStock = typeof stockOrUpdater === 'function' ? stockOrUpdater(state.stock) : stockOrUpdater;
    
    const raw = await dataService.getAll<any>('stock');
    const id = (Array.isArray(raw) && raw.length > 0 && raw[0].id) ? raw[0].id : 'singleton';
    const payload = { id, ...newStock };
    
    if (!Array.isArray(raw) || raw.length === 0) {
      await dataService.create('stock', payload);
    } else {
      await dataService.update('stock', id, payload);
    }
    
    set({ stock: newStock });
  },

  getProductoById: (id) => get().products.find(p => p.id === id),

  reservarStock: async (sku, bodega, qty) => {
    const state = get();
    const newStockReserved = { ...state.stockReserved };
    if (!newStockReserved[bodega]) newStockReserved[bodega] = {};
    const currentReserved = newStockReserved[bodega][sku] || 0;
    newStockReserved[bodega][sku] = currentReserved + qty;

    set({ stockReserved: newStockReserved });
    // Aquí persistiríamos async (e.g. dataService.update)
  },

  confirmarDespacho: async (sku, bodega, qtyTeorica, qtyReal) => {
    const state = get();
    // 1. Liberar la reserva teórica
    const newStockReserved = { ...state.stockReserved };
    if (!newStockReserved[bodega]) newStockReserved[bodega] = {};
    const currentReserved = newStockReserved[bodega][sku] || 0;
    newStockReserved[bodega][sku] = Math.max(0, currentReserved - qtyTeorica);

    // 2. Descontar el stock real de la bodega usando qtyReal (procesando mermas si hubo)
    const newStock = { ...state.stock };
    if (!newStock[bodega]) newStock[bodega] = {};
    const currentReal = newStock[bodega][sku] || 0;
    newStock[bodega][sku] = Math.max(0, currentReal - qtyReal);

    // Actualizar estados
    set({ stockReserved: newStockReserved, stock: newStock });
    
    // Persistir stock real asíncronamente
    await state.setStockAsync(newStock);
  },
  })));
