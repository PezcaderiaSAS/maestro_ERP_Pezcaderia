// src/services/ferreteriaJosaseService.ts
// Servicio de Carga y Sincronización de Catálogo Real e Inventario (Ferretería Josase)
// Manejo eficiente con dynamic imports para no sobrecargar el bundle principal de Vite.

import { useClientStore } from '../store/useClientStore';
import { useInventoryStore, type Producto } from '../store/useInventoryStore';
import { TenantIndexedDbService } from './tenantIndexedDbService';
import { fastItemSearchEngine } from './fastItemSearchEngine';
import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';
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
  private tenantIndexedDbService: TenantIndexedDbService | null = null;

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
   * Indexa masivamente en TenantIndexedDbService (Zero-QuotaExceeded en localStorage)
   * Garantiza almacenamiento persistente de 9.550 clientes y 5.351 productos sin saturar cuota.
   */
  public async applyToIndexedDb(
    tenantId = 'tenant-03',
    externalDbService?: TenantIndexedDbService
  ): Promise<{
    clientesCount: number;
    itemsCount: number;
    indexedDbReady: boolean;
  }> {
    const data = await this.loadData();
    const dbService = externalDbService || this.tenantIndexedDbService || new TenantIndexedDbService();
    if (!this.tenantIndexedDbService) {
      this.tenantIndexedDbService = dbService;
    }

    await dbService.init(tenantId);

    // Mapear productos al contrato estricto de IndexedDB
    const mappedProducts: LocalIndexedDbProduct[] = data.items.map((item, index) => ({
      sku: item.sku || item.id,
      tenantId,
      nombre: item.nombre,
      codigoBarras: item.codigo_barras || '',
      categoria: item.categoria || 'Ferretería General',
      precioDetal: item.precio_venta_pos || 0,
      precioMayorista: item.precio_venta_mayorista || 0,
      cantidadMinimaMayorista: 1,
      stockDisponible: item.stockInicial ?? 100,
      esParetoTop100: index < 100,
      activo: item.activo ?? true,
      updatedAt: new Date().toISOString(),
    }));

    // Mapear clientes al contrato estricto de IndexedDB
    const mappedClients: LocalIndexedDbClient[] = data.clientes.map((cli, index) => ({
      id: cli.id || cli.nit || cli.identificacion || `cli-${index}`,
      tenantId,
      razonSocialONombre: cli.nombre || cli.razon_social || 'Cliente General',
      nitOCedula: cli.identificacion || cli.nit || '',
      perfilPrecio: 'DETAL',
      limiteCredito: cli.cupoCredito || cli.cupo_credito || 5000000,
      contactoTelefono: cli.telefono || '',
      contactoEmail: cli.email || '',
      esParetoTop100: index < 100,
      updatedAt: new Date().toISOString(),
    }));

    // Inserción en bloques en IndexedDB (sin límites de 5MB)
    await Promise.all([
      dbService.bulkUpsertProducts(mappedProducts),
      dbService.bulkUpsertClients(mappedClients),
    ]);

    // Inicializar motor de búsqueda sub-2ms en memoria / Worker
    try {
      await fastItemSearchEngine.init(tenantId, mappedProducts);
    } catch (err) {
      console.warn('Advertencia inicializando fastItemSearchEngine:', err);
    }

    return {
      clientesCount: mappedClients.length,
      itemsCount: mappedProducts.length,
      indexedDbReady: true,
    };
  }

  /**
   * Aplica los 9.550 clientes y 5.351 ítems en los Stores globales
   * y guarda en IndexedDB, asegurando que localStorage nunca se desborde.
   */
  public async applyToStores(bodegaKey = 'bodega-josase-01'): Promise<{
    clientesCount: number;
    itemsCount: number;
    stockAsignado: number;
  }> {
    const data = await this.loadData();

    // 1. Sincronizar en IndexedDB masivo
    await this.applyToIndexedDb('tenant-03');

    // 2. Aplicar en memoria en useClientStore
    const clientStore = useClientStore.getState();
    clientStore.setClientes(data.clientes);

    // 3. Generar precios de catálogo para el motor de inventario unificado
    const pricings = data.items.map((item) => ({
      id: `prc-${item.id}`,
      productoId: item.id,
      precio_pos: item.precio_venta_pos || 0,
      precio_restaurante: item.precio_venta_restaurante || 0,
      precio_mayorista: item.precio_venta_mayorista || 0,
      vigenciaDesde: new Date().toISOString(),
    }));

    // 4. Aplicar Ítems y Catálogo en useInventoryStore
    const inventoryStore = useInventoryStore.getState();
    inventoryStore.setProducts(data.items);
    inventoryStore.setProductsCatalog(data.items);
    inventoryStore.setProductPricings(pricings);
    
    // 5. Asignar stock de 100 unidades por ítem a las bodegas operativas
    const stockJosase = data.stock[bodegaKey] || data.stock['bodega-josase-01'] || {};
    const currentStock = {
      ...inventoryStore.stock,
      ...data.stock,
      'Bodega Principal': { ...(inventoryStore.stock['Bodega Principal'] || {}), ...stockJosase },
      'Bodega Secundaria': { ...(inventoryStore.stock['Bodega Secundaria'] || {}), ...stockJosase },
      'b-1': { ...(inventoryStore.stock['b-1'] || {}), ...stockJosase },
    };
    inventoryStore.setStock(currentStock);

    // 6. Almacenamiento seguro en LocalDb (guardar solo un subconjunto ligero para evitar QuotaExceededError)
    try {
      localDb.save('clientes', data.clientes.slice(0, 50)); // Muestra segura en localStorage (< 15KB)
      localDb.save('productsCatalog', data.items.slice(0, 50)); // Muestra segura (< 15KB)
      localDb.save('productPricings', pricings.slice(0, 50));
    } catch (quotaErr) {
      console.warn('LocalStorage saturado, continuando con IndexedDB como fuente primaria:', quotaErr);
    }

    return {
      clientesCount: data.clientes.length,
      itemsCount: data.items.length,
      stockAsignado: Object.keys(stockJosase).length,
    };
  }

  /**
   * Genera el dataset a escala 3X (16.000 ítems y 30.000 clientes)
   * a partir de los datos base reales de Ferretería Josase (5.351 ítems y 9.550 clientes)
   * para validar pruebas de estrés, capacidad de IndexedDB y motores de búsqueda off-thread.
   */
  public async generateScale3xDataset(): Promise<{
    clientes: any[];
    items: ProductoFerreteria[];
    stock: Record<string, Record<string, number>>;
  }> {
    const base = await this.loadData();
    const items3x: ProductoFerreteria[] = [];
    const clientes3x: any[] = [];
    const stock3x: Record<string, number> = {};

    // 1. Escalar ítems a exactamente 16.000+
    const multipliers = ['', '-V2', '-V3'];
    for (let m = 0; m < 3; m++) {
      const suffix = multipliers[m];
      for (const item of base.items) {
        if (items3x.length >= 16000) break;
        const skuId = suffix ? `${item.id}${suffix}` : item.id;
        const skuCode = suffix ? `${item.sku || item.id}${suffix}` : item.sku || item.id;
        const nombre = suffix ? `${item.nombre} (Lote Extendido ${m + 1})` : item.nombre;

        items3x.push({
          ...item,
          id: skuId,
          sku: skuCode,
          nombre,
        });
        stock3x[skuId] = 100;
      }
    }

    // 2. Escalar clientes a exactamente 30.000
    for (let m = 0; m < 4; m++) {
      for (const cli of base.clientes) {
        if (clientes3x.length >= 30000) break;
        const cliId = m === 0 ? cli.id || cli.nit : `${cli.id || cli.nit}-X${m}`;
        const nombre =
          m === 0
            ? cli.nombre || cli.razon_social
            : `${cli.nombre || cli.razon_social} (Sucursal ${m})`;
        clientes3x.push({
          ...cli,
          id: cliId,
          nombre,
          nit: m === 0 ? cli.nit : `${cli.nit}-${m}`,
        });
      }
    }

    return {
      clientes: clientes3x,
      items: items3x,
      stock: {
        'bodega-josase-01': stock3x,
        'Bodega Principal': stock3x,
      },
    };
  }
}

export const ferreteriaJosaseService = new FerreteriaJosaseService();
