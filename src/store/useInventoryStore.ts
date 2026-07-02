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
}

interface InventoryState {
  productsCatalog: any[];
  productPricings: any[];
  products: Producto[];
  stock: Record<string, Record<string, number>>;
  loadInventory: () => void;
  loadStock: () => void;
  setProducts: (productsOrUpdater: any) => void;
  setProductsCatalog: (catalogOrUpdater: any) => void;
  setProductPricings: (pricingsOrUpdater: any) => void;
  setStock: (stockOrUpdater: any) => void;
  getProductoById: (id: string) => Producto | undefined;
}

export const useInventoryStore = create<InventoryState>()(
  zustandConsoleMiddleware((set, get) => ({
  productsCatalog: [],
  productPricings: [],
  products: [],
  stock: {},

  loadInventory: async () => {
    try {
      const [catalog, pricings] = await Promise.all([
        dataService.getAll<any>('productos_catalogo'),
        dataService.getAll<any>('productos_precios'),
      ]);

      const unifiedProducts: Producto[] = catalog.map((cat: any) => {
        const productPricings = pricings.filter((pr: any) => pr.productoId === cat.id);
        let currentPricing = productPricings[0];
        if (productPricings.length > 1) {
          currentPricing = productPricings.reduce((latest: any, current: any) =>
            new Date(current.vigenciaDesde) > new Date(latest.vigenciaDesde) ? current : latest
          );
        }
        const fb = { precio_compra: 0, buffer_seguridad: 0, precio_venta_pos: 0, precio_venta_restaurante: 0, precio_venta_mayorista: 0 };
        return { ...cat, ...(currentPricing || fb), categoriaABC: cat.categoriaABC || 'C' } as Producto;
      });

      set({ productsCatalog: catalog, productPricings: pricings, products: unifiedProducts });
    } catch {
      set({ productsCatalog: [], productPricings: [], products: [] });
    }
  },

  loadStock: () => {
    const saved = localDb.load<any>('stock', {});
    let needsSave = false;
    const migrated: Record<string, Record<string, number>> = {};

    for (const bodega in saved) {
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

    if (needsSave) {
      console.log('Migración de stock ejecutada: array -> dict O(1)');
      localDb.save('stock', migrated);
    }

    set({ stock: migrated });
  },

  setProducts: (productsOrUpdater: any) => set((state) => ({
    products: typeof productsOrUpdater === 'function' ? productsOrUpdater(state.products) : productsOrUpdater,
  })),

  setProductsCatalog: (catalogOrUpdater: any) => {
    set((state) => ({
      productsCatalog: typeof catalogOrUpdater === 'function' ? catalogOrUpdater(state.productsCatalog) : catalogOrUpdater,
    }));
    get().loadInventory();
  },

  setProductPricings: (pricingsOrUpdater: any) => {
    set((state) => ({
      productPricings: typeof pricingsOrUpdater === 'function' ? pricingsOrUpdater(state.productPricings) : pricingsOrUpdater,
    }));
    get().loadInventory();
  },

  setStock: (stockOrUpdater: any) => set((state) => {
    const newStock = typeof stockOrUpdater === 'function' ? stockOrUpdater(state.stock) : stockOrUpdater;
    localDb.save('stock', newStock);
    return { stock: newStock };
  }),

  getProductoById: (id) => get().products.find(p => p.id === id),
  })));
