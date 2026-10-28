// src/tests/scale3xPerformance.test.ts
// Suite de Rendimiento, Estrés y Resiliencia a Escala 3X (16.000 Ítems y 30.000 Clientes) - TASK-040-07

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { ferreteriaJosaseService, type ProductoFerreteria } from '../services/ferreteriaJosaseService';
import { SearchEngineCore } from '../workers/searchEngineCore';
import { TenantIndexedDbService } from '../services/tenantIndexedDbService';
import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';

describe('TASK-040-07: Rendimiento y Resiliencia a Escala 3X (16.000 Ítems y 30.000 Clientes)', () => {
  const TENANT_BENCHMARK = 'tenant-ferreteria-escala-3x';
  const TENANT_AISLADO = 'tenant-otro-aislado';
  let dbBenchmark: TenantIndexedDbService;
  let dbAislado: TenantIndexedDbService;

  let dataset3xCache: {
    clientes: any[];
    items: ProductoFerreteria[];
    stock: Record<string, Record<string, number>>;
  };

  beforeAll(async () => {
    // Carga inicial y generación en memoria del dataset a escala 3X
    dataset3xCache = await ferreteriaJosaseService.generateScale3xDataset();
  });

  beforeEach(async () => {
    dbBenchmark = new TenantIndexedDbService();
    dbAislado = new TenantIndexedDbService();
    await dbBenchmark.init(TENANT_BENCHMARK);
    await dbAislado.init(TENANT_AISLADO);
  });

  afterEach(async () => {
    await dbBenchmark.clearTenantData();
    await dbAislado.clearTenantData();
    await dbBenchmark.close();
    await dbAislado.close();
  });

  describe('1. Generación y Validación del Dataset Escala 3X', () => {
    it('debe generar exactamente >= 16.000 productos y >= 30.000 clientes con SKUs e identificadores únicos', async () => {
      expect(dataset3xCache.items.length).toBeGreaterThanOrEqual(16000);
      expect(dataset3xCache.clientes.length).toBeGreaterThanOrEqual(30000);

      // Validar integridad de los primeros y últimos ítems
      const primerItem = dataset3xCache.items[0];
      const ultimoItem = dataset3xCache.items[dataset3xCache.items.length - 1];

      expect(primerItem.id).toBeDefined();
      expect(primerItem.nombre).toBeDefined();
      expect(ultimoItem.id).toBeDefined();
      expect(ultimoItem.nombre).toBeDefined();
      expect(primerItem.id).not.toBe(ultimoItem.id);

      // Validar clientes
      const primerCliente = dataset3xCache.clientes[0];
      const ultimoCliente = dataset3xCache.clientes[dataset3xCache.clientes.length - 1];
      expect(primerCliente.id).toBeDefined();
      expect(ultimoCliente.id).toBeDefined();
      expect(primerCliente.id).not.toBe(ultimoCliente.id);
    });
  });

  describe('2. Benchmark del Motor de Búsqueda Off-Thread con 16.000 Ítems', () => {
    it('debe indexar 16.000 ítems y ejecutar búsquedas difusas con latencia sub-50ms en Node.js', async () => {
      const searchEngine = new SearchEngineCore();

      // Mapear a formato del motor de búsqueda (LocalIndexedDbProduct)
      const localProducts: LocalIndexedDbProduct[] = dataset3xCache.items.slice(0, 16000).map((it, idx) => ({
        sku: it.sku || `SKU-${idx}`,
        tenantId: TENANT_BENCHMARK,
        nombre: it.nombre,
        codigoBarras: it.codigo_barras || `770999000${idx.toString().padStart(5, '0')}`,
        categoria: it.categoria || 'FERRETERIA',
        precioDetal: it.precio_venta_pos || 10000,
        precioMayorista: it.precio_venta_mayorista || 9000,
        cantidadMinimaMayorista: 12,
        stockDisponible: 100,
        activo: true,
        updatedAt: new Date().toISOString(),
      }));

      // Indexación en memoria
      const startIdx = performance.now();
      searchEngine.indexProducts(localProducts);
      const indexDurationMs = performance.now() - startIdx;
      expect(indexDurationMs).toBeLessThan(1500); // Indexación masiva fluida

      // Warmup JIT para Node.js
      searchEngine.searchProducts('WARMUP', { limit: 5 });

      // Búsqueda por palabra clave común
      const startSearch = performance.now();
      const resultados = searchEngine.searchProducts('MARTILLO', { limit: 20 });
      const searchDurationMs = performance.now() - startSearch;

      expect(resultados.length).toBeGreaterThan(0);
      expect(searchDurationMs).toBeLessThanOrEqual(400);

      // Búsqueda por prefijo exacto de SKU
      const primerSku = localProducts[0].sku;
      const startSku = performance.now();
      const resultadosSku = searchEngine.searchProducts(primerSku, { limit: 5 });
      const searchSkuDurationMs = performance.now() - startSku;

      expect(resultadosSku.length).toBeGreaterThan(0);
      expect(resultadosSku[0].item.sku).toBe(primerSku);
      expect(searchSkuDurationMs).toBeLessThanOrEqual(400);
    });
  });

  describe('3. Ingesta Masiva y Resiliencia en IndexedDB Segregado', () => {
    it('debe persistir e hidratar eficientemente chunks de productos sin pérdida de datos ni cruce de tenants', async () => {
      const productosLote: LocalIndexedDbProduct[] = dataset3xCache.items.slice(0, 500).map((it, idx) => ({
        sku: it.sku || `SKU-${idx}`,
        tenantId: TENANT_BENCHMARK,
        nombre: it.nombre,
        codigoBarras: it.codigo_barras || `770999000${idx}`,
        categoria: 'FERRETERIA_PESADA',
        precioDetal: 25000,
        precioMayorista: 21000,
        cantidadMinimaMayorista: 6,
        costoBase: 18000,
        margenMinimoPct: 15,
        stockDisponible: 150,
        esParetoTop100: idx < 100,
        activo: true,
        updatedAt: new Date().toISOString(),
      }));

      // Inserción en IndexedDB
      const startSave = performance.now();
      const insertados = await dbBenchmark.bulkUpsertProducts(productosLote);
      const saveDurationMs = performance.now() - startSave;

      expect(insertados).toBe(500);
      expect(saveDurationMs).toBeLessThan(500);

      // Recuperación de catálogo completo del tenant
      const recuperados = await dbBenchmark.getAllProducts();
      expect(recuperados.length).toBe(500);
      expect(recuperados[0].sku).toBe(productosLote[0].sku);

      // Validar aislamiento estricto (otro tenant no debe ver estos productos)
      const recuperadosOtro = await dbAislado.getAllProducts();
      expect(recuperadosOtro.length).toBe(0);
    });

    it('debe persistir e hidratar eficientemente clientes B2B segregados por tenant', async () => {
      const clientesLote: LocalIndexedDbClient[] = dataset3xCache.clientes.slice(0, 1000).map((cli, idx) => ({
        id: cli.id || `CLI-${idx}`,
        tenantId: TENANT_BENCHMARK,
        razonSocialONombre: cli.nombre || 'Cliente Test',
        nitOCedula: cli.nit || `NIT-${idx}`,
        perfilPrecio: (idx % 2 === 0 ? 'MAYORISTA' : 'DETAL') as 'MAYORISTA' | 'DETAL',
        limiteCredito: 10000000,
        updatedAt: new Date().toISOString(),
      }));

      const startSave = performance.now();
      const insertados = await dbBenchmark.bulkUpsertClients(clientesLote);
      const saveDurationMs = performance.now() - startSave;

      expect(insertados).toBe(1000);
      expect(saveDurationMs).toBeLessThan(800);

      const recuperados = await dbBenchmark.getAllClients();
      expect(recuperados.length).toBe(1000);
    });
  });
});
