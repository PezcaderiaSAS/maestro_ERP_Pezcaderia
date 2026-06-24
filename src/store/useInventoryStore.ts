import { create } from 'zustand';
import * as localDb from '../services/localDb';

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
  categoriaABC?: 'A' | 'B' | 'C'; // Para Análisis de Pareto 80/20
}

interface InventoryState {
  productsCatalog: any[];
  productPricings: any[];
  products: Producto[];
  loadInventory: () => void;
  setProductsCatalog: (catalog: any[]) => void;
  setProductPricings: (pricings: any[]) => void;
  getProductoById: (id: string) => Producto | undefined;
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  productsCatalog: [],
  productPricings: [],
  products: [],

  loadInventory: () => {
    const catalog = localDb.load<any[]>('productsCatalog', []);
    const pricings = localDb.load<any[]>('productPricings', []);

    const unifiedProducts: Producto[] = catalog.map(cat => {
      const productPricings = pricings.filter(pr => pr.productoId === cat.id);
      let currentPricing = productPricings[0];
      if (productPricings.length > 1) {
        currentPricing = productPricings.reduce((latest, current) => 
          new Date(current.vigenciaDesde) > new Date(latest.vigenciaDesde) ? current : latest
        );
      }
      const fallbackPricing = { precio_compra: 0, buffer_seguridad: 0, precio_venta_pos: 0, precio_venta_restaurante: 0, precio_venta_mayorista: 0 };
      
      return { 
        ...cat, 
        ...(currentPricing || fallbackPricing),
        categoriaABC: cat.categoriaABC || 'C'
      } as Producto;
    });

    set({ productsCatalog: catalog, productPricings: pricings, products: unifiedProducts });
  },

  setProductsCatalog: (catalog: any[]) => {
    localDb.save('productsCatalog', catalog);
    set({ productsCatalog: catalog });
    get().loadInventory(); // Recalculate unified products
  },

  setProductPricings: (pricings: any[]) => {
    localDb.save('productPricings', pricings);
    set({ productPricings: pricings });
    get().loadInventory(); // Recalculate unified products
  },

  getProductoById: (id) => {
    return get().products.find(p => p.id === id);
  }
}));
