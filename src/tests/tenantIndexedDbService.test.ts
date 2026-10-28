// src/tests/tenantIndexedDbService.test.ts
// Pruebas TDD para el Servicio de Almacenamiento Aislado por Tenant: SPEC-040
// Fase RED: Pruebas unitarias de IndexedDB Multi-Tenant, Ingesta Progresiva y Fallback

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TenantIndexedDbService } from '../services/tenantIndexedDbService';
import { ProgressiveHydrationService } from '../services/progressiveHydrationService';
import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';

describe('TASK-040-02: TenantIndexedDbService & ProgressiveHydrationService', () => {
  let dbTenant01: TenantIndexedDbService;
  let dbTenant03: TenantIndexedDbService;

  beforeEach(async () => {
    dbTenant01 = new TenantIndexedDbService();
    dbTenant03 = new TenantIndexedDbService();
    await dbTenant01.init('tenant-01');
    await dbTenant03.init('tenant-03');
  });

  afterEach(async () => {
    await dbTenant01.clearTenantData();
    await dbTenant03.clearTenantData();
    await dbTenant01.close();
    await dbTenant03.close();
  });

  describe('1. Inicialización y Aislamiento Físico por Tenant', () => {
    it('debe asignar el nombre determinista PezcaderiaERP_{tenantId} a cada instancia', () => {
      expect(dbTenant01.getDbName()).toBe('PezcaderiaERP_tenant-01');
      expect(dbTenant03.getDbName()).toBe('PezcaderiaERP_tenant-03');
      expect(dbTenant01.getTenantId()).toBe('tenant-01');
      expect(dbTenant03.getTenantId()).toBe('tenant-03');
    });

    it('debe garantizar Cero Fuga de Datos Cruzada (Zero Cross-Tenant Leakage) entre empresas', async () => {
      const productoJosase: LocalIndexedDbProduct = {
        sku: 'FERR-999',
        tenantId: 'tenant-03',
        nombre: 'CANDADO YALE 70MM',
        categoria: 'CANDADOS',
        precioDetal: 55000,
        precioMayorista: 48000,
        cantidadMinimaMayorista: 6,
        stockDisponible: 100,
        activo: true,
        updatedAt: new Date().toISOString(),
      };

      // Guardar en tenant-03 (Ferretería Josase)
      await dbTenant03.bulkUpsertProducts([productoJosase]);

      // Verificar que existe en tenant-03
      const foundIn03 = await dbTenant03.getProductBySku('FERR-999');
      expect(foundIn03).not.toBeNull();
      expect(foundIn03?.nombre).toBe('CANDADO YALE 70MM');

      // Verificar que NO existe en tenant-01 (La Pezcadería)
      const foundIn01 = await dbTenant01.getProductBySku('FERR-999');
      expect(foundIn01).toBeNull();
    });
  });

  describe('2. Inserción Masiva (bulkUpsert) y Consultas de Catálogo', () => {
    it('debe insertar y recuperar lotes de productos y clientes eficientemente', async () => {
      const productos: LocalIndexedDbProduct[] = Array.from({ length: 50 }, (_, i) => ({
        sku: `SKU-${i}`,
        tenantId: 'tenant-03',
        nombre: `Producto Ferretero ${i}`,
        codigoBarras: `770123456${i.toString().padStart(3, '0')}`,
        categoria: i % 2 === 0 ? 'HERRAMIENTAS' : 'ELECTRICOS',
        precioDetal: 10000 + i * 500,
        precioMayorista: 8500 + i * 500,
        cantidadMinimaMayorista: 10,
        stockDisponible: 100,
        esParetoTop100: i < 10,
        activo: true,
        updatedAt: new Date().toISOString(),
      }));

      const clientes: LocalIndexedDbClient[] = Array.from({ length: 25 }, (_, i) => ({
        id: `cli-${i}`,
        tenantId: 'tenant-03',
        razonSocialONombre: `Constructora e Ingeniería ${i} S.A.S.`,
        nitOCedula: `90012345${i}`,
        perfilPrecio: i % 3 === 0 ? 'MAYORISTA' : 'DETAL',
        limiteCredito: 10000000,
        esParetoTop100: i < 5,
        updatedAt: new Date().toISOString(),
      }));

      const countProds = await dbTenant03.bulkUpsertProducts(productos);
      const countClients = await dbTenant03.bulkUpsertClients(clientes);

      expect(countProds).toBe(50);
      expect(countClients).toBe(25);

      // Búsqueda por código de barras
      const barcodeItem = await dbTenant03.searchByBarcode('770123456005');
      expect(barcodeItem).not.toBeNull();
      expect(barcodeItem?.sku).toBe('SKU-5');

      // Búsqueda de Top Pareto
      const paretoProds = await dbTenant03.getTopParetoProducts(20);
      expect(paretoProds.length).toBe(10);
      expect(paretoProds.every((p) => p.esParetoTop100)).toBe(true);
    });

    it('debe gestionar stock por bodega y actualizarlo atómicamente', async () => {
      await dbTenant03.updateStock('SKU-01', 'bodega-josase-01', 100);
      let stock = await dbTenant03.getStock('SKU-01', 'bodega-josase-01');
      expect(stock).toBe(100);

      // Descontar venta
      await dbTenant03.updateStock('SKU-01', 'bodega-josase-01', -5); // resta relativa
      stock = await dbTenant03.getStock('SKU-01', 'bodega-josase-01');
      expect(stock).toBe(95);
    });
  });

  describe('3. Cola Outbox para Resiliencia Offline', () => {
    it('debe registrar operaciones en la cola outbox y marcarlas como sincronizadas', async () => {
      const txId = await dbTenant03.addOutboxTransaction({
        tenantId: 'tenant-03',
        tipo: 'VENTA_POS',
        payload: { ticketId: 'TICK-001', total: 95000 },
      });

      expect(txId).toBeDefined();

      const pending = await dbTenant03.getPendingOutboxTransactions();
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(txId);
      expect(pending[0].estado).toBe('PENDIENTE');

      await dbTenant03.markOutboxSynced(txId);

      const afterSync = await dbTenant03.getPendingOutboxTransactions();
      expect(afterSync.length).toBe(0);
    });
  });

  describe('4. ProgressiveHydrationService (Ingesta en Chunks Pareto 80/20)', () => {
    it('debe hidratar datos masivos en chunks sin bloquear y marcar el Top 100 Pareto', async () => {
      const mockRawItems = Array.from({ length: 250 }, (_, i) => ({
        id: `item-${i}`,
        sku: `RAW-SKU-${i}`,
        nombre: `Item ${i}`,
        categoria: 'GENERAL',
        precio_venta_pos: 15000,
        precio_venta_mayorista: 12000,
        stock: 100,
      }));

      const mockRawClients = Array.from({ length: 150 }, (_, i) => ({
        id: `raw-cli-${i}`,
        nombre: `Cliente ${i}`,
        documento: `1000${i}`,
      }));

      const hydrationService = new ProgressiveHydrationService(dbTenant03);
      let progressReported = 0;

      const result = await hydrationService.hydrateFromRawData(
        'tenant-03',
        mockRawItems,
        mockRawClients,
        (pct) => {
          progressReported = pct;
        }
      );

      expect(result.productsCount).toBe(250);
      expect(result.clientsCount).toBe(150);
      expect(result.paretoCount).toBe(100);
      expect(progressReported).toBe(100);

      // Validar que el Top Pareto esté disponible
      const paretoItems = await dbTenant03.getTopParetoProducts(100);
      expect(paretoItems.length).toBe(100);
      expect(paretoItems[0].esParetoTop100).toBe(true);
    });
  });
});

