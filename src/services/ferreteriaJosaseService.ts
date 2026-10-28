// src/services/ferreteriaJosaseService.ts
// Servicio de Carga y Sincronización de Catálogo Real e Inventario (Ferretería Josase)
// Manejo eficiente con dynamic imports para no sobrecargar el bundle principal de Vite.

import { useClientStore } from '../store/useClientStore';
import { useInventoryStore, type Producto } from '../store/useInventoryStore';
import * as localDb from './localDb';

export interface ProductoFerreteria extends Producto {
  tenantId?: string;
  stockInicial?: number;
}

export interface FerreteriaJosaseData {
  clientes: any[];
  items: ProductoFerreteria[];
  stock: Record<string, Record<string, number>>;
}

export class FerreteriaJosaseService {
  /**
   * Carga dinámica de los datasets procesados de Ferretería Josase
   */
  public async loadData(): Promise<FerreteriaJosaseData> {
    const [clientesMod, itemsMod, stockMod] = await Promise.all([
      import('../data/clientes_ferreteria_josase.json'),
      import('../data/items_ferreteria_josase.json'),
      import('../data/stock_ferreteria_josase.json'),
    ]);

    return {
      clientes: clientesMod.default as any[],
      items: itemsMod.default as unknown as ProductoFerreteria[],
      stock: stockMod.default as Record<string, Record<string, number>>,
    };
  }

  /**
   * Aplica los 9.550 clientes y 5.351 ítems con stock inicial = 100 en los Stores globales y LocalDb
   */
  public async applyToStores(bodegaKey = 'bodega-josase-01'): Promise<{
    clientesCount: number;
    itemsCount: number;
    stockAsignado: number;
  }> {
    const data = await this.loadData();

    // 1. Aplicar Clientes en useClientStore y LocalDb
    const clientStore = useClientStore.getState();
    clientStore.setClientes(data.clientes);
    localDb.save('clientes', data.clientes);

    // 2. Generar y persistir precios de catálogo para el motor de inventario unificado
    const pricings = data.items.map((item) => ({
      id: `prc-${item.id}`,
      productoId: item.id,
      precio_pos: item.precio_venta_pos || 0,
      precio_restaurante: item.precio_venta_restaurante || 0,
      precio_mayorista: item.precio_venta_mayorista || 0,
      vigenciaDesde: new Date().toISOString(),
    }));

    localDb.save('productsCatalog', data.items);
    localDb.save('productPricings', pricings);

    // 3. Aplicar Ítems y Catálogo en useInventoryStore
    const inventoryStore = useInventoryStore.getState();
    inventoryStore.setProducts(data.items);
    inventoryStore.setProductsCatalog(data.items);
    inventoryStore.setProductPricings(pricings);
    
    // 4. Asignar stock de 100 unidades por ítem a las bodegas operativas
    const stockJosase = data.stock[bodegaKey] || data.stock['bodega-josase-01'] || {};
    const currentStock = {
      ...inventoryStore.stock,
      ...data.stock,
      'Bodega Principal': { ...(inventoryStore.stock['Bodega Principal'] || {}), ...stockJosase },
      'Bodega Secundaria': { ...(inventoryStore.stock['Bodega Secundaria'] || {}), ...stockJosase },
      'b-1': { ...(inventoryStore.stock['b-1'] || {}), ...stockJosase },
    };
    inventoryStore.setStock(currentStock);
    localDb.save('stock', currentStock);

    return {
      clientesCount: data.clientes.length,
      itemsCount: data.items.length,
      stockAsignado: Object.keys(stockJosase).length,
    };
  }
}

export const ferreteriaJosaseService = new FerreteriaJosaseService();
