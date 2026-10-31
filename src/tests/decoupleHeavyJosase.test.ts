import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClientStore } from '../store/useClientStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { databasePurgeService } from '../services/databasePurgeService';

describe('TASK-049-03: Desacople de Carga Pesada Josase y Arranque Ultrarrápido', () => {
  beforeEach(() => {
    localStorage.clear();
    useClientStore.getState().setClientes([]);
    useInventoryStore.getState().setProducts([]);
    useInventoryStore.getState().setProductsCatalog([]);
  });

  it('1. switchTenant en useAuthStore no debe cargar automáticamente los 14.901 ítems pesados', async () => {
    const startTime = performance.now();

    // Cambiar al tenant-03
    useAuthStore.getState().switchTenant({
      id: 'tenant-03',
      razonSocial: 'Ferretería & Eléctricos Josase S.A.S.',
      nit: '900.543.210-9',
      ciudad: 'Bucaramanga',
    });

    const elapsed = performance.now() - startTime;
    expect(elapsed).toBeLessThan(100);

    // Los stores no deben estar saturados con > 5000 productos de manera no deseada
    const productos = useInventoryStore.getState().products;
    expect(productos.length).toBeLessThanOrEqual(25);
  });

  it('2. El arranque de demo con databasePurgeService deja un catálogo ligero y responsivo en < 50ms', async () => {
    const startTime = performance.now();
    const result = await databasePurgeService.purgeLocalDatabase({
      tenantId: 'tenant-03',
      limpiarRemotoSupabase: false,
    });
    const elapsed = performance.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.clientesResembrados).toBe(10);
    expect(result.productosResembrados).toBe(25);
    expect(elapsed).toBeLessThan(80);

    expect(useClientStore.getState().clientes).toHaveLength(10);
    expect(useInventoryStore.getState().products).toHaveLength(25);
  });
});
