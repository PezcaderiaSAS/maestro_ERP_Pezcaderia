// src/services/ferreteriaJosaseService.ts
// Servicio de Carga y Sincronización de Catálogo Real e Inventario (Ferretería Josase)
// Manejo eficiente con dynamic imports para no sobrecargar el bundle principal de Vite.

import { useClientStore } from '../store/useClientStore';
import { useInventoryStore, type Producto } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
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
  private inFlightApply: Promise<{
    clientesCount: number;
    itemsCount: number;
    stockAsignado: number;
  }> | null = null;
  private inFlightRestore: Promise<{
    clientesCount: number;
    itemsCount: number;
  }> | null = null;

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
  public applyToStores(bodegaKey = 'bodega-josase-01'): Promise<{
    clientesCount: number;
    itemsCount: number;
    stockAsignado: number;
  }> {
    if (this.inFlightApply) {
      return this.inFlightApply;
    }

    this.inFlightApply = (async () => {
      try {
        const data = await this.loadData();

        // Seguridad multi-tenant: si el usuario cambió de tenant mientras cargaba, no pisar stores
        const currentTenant = useAuthStore.getState().activeTenant;
        if (currentTenant && currentTenant.id !== 'tenant-03') {
          return {
            clientesCount: data.clientes.length,
            itemsCount: data.items.length,
            stockAsignado: 0,
          };
        }

        // 1. Enriquecer categorías de ferretería para navegación fluida
        const enrichedItems: ProductoFerreteria[] = data.items.map((item) => {
          let cat = item.categoria;
          if (!cat || cat === 'PRODUCTOS' || cat === 'FERRETERIA') {
            const n = item.nombre.toUpperCase();
            if (/TORNILLO|CHAZO|REMACHE|PUNTILLA|TUERCA|ARANDELA/.test(n)) cat = 'Tornillería & Fijaciones';
            else if (/TUBO|VALVULA|CODO|UNION|TEE|BUJE|MANGUERA|REJILLA|GRIF/.test(n)) cat = 'Tubería & Grifería';
            else if (/CABLE|TOMA|PANEL|CAJA|INTERRUPTOR|PARARRAYO|BREAKER|DPS|ELECTR/.test(n)) cat = 'Eléctricos & Iluminación';
            else if (/VINILO|ESMALTE|PINTURA|BROCHA|CINTA|RODILLO|AEROSOL/.test(n)) cat = 'Pinturas & Químicos';
            else if (/LLAVE|BROCA|COPA|DISCO|CANDADO|CERRADURA|ALICATE|DESTORN/.test(n)) cat = 'Herramientas & Cerrajería';
            else if (/CEMENTO|TEJA|MALLA|VARILLA|PERSIANA|YESO|LADRILLO/.test(n)) cat = 'Construcción & Materiales';
            else if (/SERVICI|ALQUILER|TRANSPORTE|FLETE/.test(n)) cat = 'Servicios & Alquiler';
            else cat = 'Ferretería General';
          }
          return { ...item, categoria: cat };
        });

        // 2. Aplicar en memoria en useClientStore inmediatamente
        const clientStore = useClientStore.getState();
        clientStore.setClientes(data.clientes);

        // 3. Generar precios de catálogo para el motor de inventario unificado
        const pricings = enrichedItems.map((item) => ({
          id: `prc-${item.id}`,
          productoId: item.id,
          precio_pos: item.precio_venta_pos || 0,
          precio_restaurante: item.precio_venta_restaurante || 0,
          precio_mayorista: item.precio_venta_mayorista || 0,
          vigenciaDesde: new Date().toISOString(),
        }));

        // 4. Aplicar Ítems, Catálogo y Stock atómicamente en useInventoryStore
        const inventoryStore = useInventoryStore.getState();
        const stockJosase = data.stock[bodegaKey] || data.stock['bodega-josase-01'] || {};
        const currentStock = {
          ...inventoryStore.stock,
          ...data.stock,
          'Bodega Principal': { ...(inventoryStore.stock['Bodega Principal'] || {}), ...stockJosase },
          'Bodega Secundaria': { ...(inventoryStore.stock['Bodega Secundaria'] || {}), ...stockJosase },
          'b-1': { ...(inventoryStore.stock['b-1'] || {}), ...stockJosase },
          'bodega-josase-01': stockJosase,
        };

        useInventoryStore.setState({
          productsCatalog: enrichedItems,
          productPricings: pricings,
          products: enrichedItems as any,
          stock: currentStock,
        });

        // 5. Almacenamiento seguro en LocalDb (muestra ligera sin provocar QuotaExceededError)
        try {
          localDb.save('clientes', data.clientes.slice(0, 50));
          localDb.save('productsCatalog', enrichedItems.slice(0, 50));
          localDb.save('productPricings', pricings.slice(0, 50));
        } catch (quotaErr) {
          console.warn('LocalStorage saturado, continuando con IndexedDB como fuente primaria:', quotaErr);
        }

        // 6. Sincronización masiva en IndexedDB en background (sin bloquear el hilo de la UI)
        this.applyToIndexedDb('tenant-03').catch((idbErr) => {
          console.warn('Advertencia en sincronización diferida de IndexedDB:', idbErr);
        });

        return {
          clientesCount: data.clientes.length,
          itemsCount: enrichedItems.length,
          stockAsignado: Object.keys(stockJosase).length,
        };
      } finally {
        this.inFlightApply = null;
      }
    })();

    return this.inFlightApply;
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

  /**
   * Restaura el catálogo pesquero original de La Pezcadería (tenant-01)
   * en useInventoryStore, useClientStore y stock operativo.
   */
  public restorePezcaderiaStores(userRole = 'admin'): Promise<{
    clientesCount: number;
    itemsCount: number;
  }> {
    if (this.inFlightRestore) {
      return this.inFlightRestore;
    }

    this.inFlightRestore = (async () => {
      try {
        const { INITIAL_PRODUCTS, INITIAL_CLIENTS, migrateProductsToCatalogAndPricing } = await import(
          '../data/appSeedData'
        );
        const { catalog, pricings } = migrateProductsToCatalogAndPricing(INITIAL_PRODUCTS, userRole);

        // Seguridad multi-tenant: si el usuario cambió a tenant-03 mientras cargaba, no pisar stores
        const currentTenant = useAuthStore.getState().activeTenant;
        if (currentTenant && currentTenant.id === 'tenant-03') {
          return {
            clientesCount: 0,
            itemsCount: 0,
          };
        }

        // 1. Restaurar clientes en useClientStore
        const clientStore = useClientStore.getState();
        clientStore.setClientes(INITIAL_CLIENTS);

        // 2. Mapear productos pesqueros unificados
        const unifiedProducts: Producto[] = catalog.map((cat: any) => {
          const pr = pricings.find((p) => p.productoId === cat.id);
          return {
            precio_compra: cat.precio_compra ?? 0,
            buffer_seguridad: cat.buffer_seguridad ?? 5,
            precio_venta_pos: cat.precio_venta_pos ?? 0,
            precio_venta_restaurante: cat.precio_venta_restaurante ?? cat.precio_venta_pos ?? 0,
            precio_venta_mayorista: cat.precio_venta_mayorista ?? cat.precio_venta_pos ?? 0,
            ...cat,
            ...(pr || {}),
            categoriaABC: cat.categoriaABC || 'C',
          } as Producto;
        });

        // 3. Restaurar existencias pesqueras predeterminadas
        const stockPezcaderia: Record<string, Record<string, number>> = {
          'Bodega Principal': {
            'PES-ENT-001': 500,
            'FIL-LIM-002': 120,
            'CAM-TIG-003': 85,
            'LAN-COL-004': 40,
            'TRU-ARC-005': 95,
            'SAL-POR-006': 150,
            'ROB-ENT-007': 60,
            'PUL-COC-008': 35,
            'ANI-CAL-009': 75,
            'ATU-ALE-010': 110,
            'CAM-CRU-41-50': 50,
            'CAM-CRU-41-50-500G': 30,
          },
          'Bodega Secundaria': {
            'PES-ENT-001': 200,
            'FIL-LIM-002': 45,
            'SAL-POR-006': 50,
          },
          'Bodega de Tránsito': {
            'PES-ENT-001': 200,
            'FIL-LIM-002': 45,
          },
          'Bodega Averías': {
            'FIL-LIM-002': 12,
          },
        };

        // 4. Restaurar estado de useInventoryStore de forma atómica
        useInventoryStore.setState({
          productsCatalog: catalog,
          productPricings: pricings,
          products: unifiedProducts,
          stock: stockPezcaderia,
        });

        // 5. Restaurar índice del motor de búsqueda sub-2ms para La Pezcadería
        try {
          const mappedProducts: LocalIndexedDbProduct[] = catalog.map((item: any, index: number) => ({
            sku: item.sku || item.id,
            tenantId: 'tenant-01',
            nombre: item.nombre,
            codigoBarras: item.codigo_barras || '',
            categoria: item.categoria || 'Pescados',
            precioDetal: item.precio_venta_pos || 0,
            precioMayorista: item.precio_venta_mayorista || 0,
            cantidadMinimaMayorista: 1,
            stockDisponible: 100,
            esParetoTop100: index < 5,
            activo: true,
            updatedAt: new Date().toISOString(),
          }));
          await fastItemSearchEngine.init('tenant-01', mappedProducts);
        } catch (err) {
          console.warn('Advertencia re-indexando fastItemSearchEngine para La Pezcadería:', err);
        }

        // 6. Persistir catálogo pesquero limpio en localDb
        try {
          localDb.save('clientes', INITIAL_CLIENTS);
          localDb.save('productsCatalog', catalog);
          localDb.save('productPricings', pricings);
          localDb.save('stock', stockPezcaderia);
        } catch (err) {
          console.warn('Advertencia guardando catálogo pesquero en localDb:', err);
        }

        return {
          clientesCount: INITIAL_CLIENTS.length,
          itemsCount: catalog.length,
        };
      } finally {
        this.inFlightRestore = null;
      }
    })();

    return this.inFlightRestore;
  }
}

export const ferreteriaJosaseService = new FerreteriaJosaseService();
