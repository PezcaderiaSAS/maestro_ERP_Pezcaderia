import { describe, it, expect, beforeEach } from 'vitest';
import { ferreteriaJosaseService } from '../services/ferreteriaJosaseService';
import { TenantIndexedDbService } from '../services/tenantIndexedDbService';
import { fastItemSearchEngine } from '../services/fastItemSearchEngine';

describe('TASK-043-01: Ferretería Josase - Carga IndexedDB Zero-LocalStorage (Quota-Safe)', () => {
  const tenantId = 'tenant-03';
  let dbService: TenantIndexedDbService;

  beforeEach(async () => {
    localStorage.clear();
    dbService = new TenantIndexedDbService();
    await dbService.init(tenantId);
  });

  it('1. Debe realizar la indexación asíncrona masiva en TenantIndexedDbService sin desbordar localStorage', async () => {
    const result = await ferreteriaJosaseService.applyToIndexedDb(tenantId, dbService);

    expect(result.clientesCount).toBe(9550);
    expect(result.itemsCount).toBe(5351);
    expect(result.indexedDbReady).toBe(true);

    // Verificar que localStorage NO contenga los 9.550 clientes serializados en crudo (> 4MB)
    const rawClientesInLocalStorage = localStorage.getItem('erp_clientes') || localStorage.getItem('clientes');
    const localDbSize = rawClientesInLocalStorage ? new Blob([rawClientesInLocalStorage]).size : 0;
    
    // Debe ser menor a 500KB (cero QuotaExceededError en navegadores reales con límite de 5MB)
    expect(localDbSize).toBeLessThan(500 * 1024);
  }, 25000);

  it('2. Los productos y clientes deben ser consultables directamente desde TenantIndexedDbService', async () => {
    await ferreteriaJosaseService.applyToIndexedDb(tenantId, dbService);

    // Consultar primer producto
    const topProducts = await dbService.getAllProducts(10);
    expect(topProducts.length).toBeGreaterThan(0);
    expect(topProducts[0].tenantId).toBe(tenantId);

    // Consultar cliente
    const clients = await dbService.getAllClients(10);
    expect(clients.length).toBeGreaterThan(0);
    expect(clients[0].tenantId).toBe(tenantId);
  }, 25000);

  it('3. Debe inicializar el motor fastItemSearchEngine para búsquedas instantáneas', async () => {
    await ferreteriaJosaseService.applyToIndexedDb(tenantId, dbService);

    // El motor debe estar listo y encontrar ítems de ferretería en memoria/worker
    const searchResults = await fastItemSearchEngine.search('VARILLA', { limit: 5 });
    expect(searchResults).toBeDefined();
    expect(Array.isArray(searchResults)).toBe(true);
    expect(searchResults.length).toBeGreaterThan(0);
  }, 25000);
});
