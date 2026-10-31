import { describe, it, expect, beforeEach, vi } from 'vitest';
import { databasePurgeService } from '../services/databasePurgeService';
import { useClientStore } from '../store/useClientStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { DB_KEYS } from '../services/localDb';

describe('TASK-049-02: databasePurgeService - Purga y Resiembra Atómica de Base de Datos', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simular estado previo pesado
    const mockClientesPesados = Array.from({ length: 500 }, (_, i) => ({
      id: `cli-heavy-${i}`,
      nombre: `Cliente Pesado ${i}`,
      identificacion: `ID-${i}`,
      tipoIdentificacion: 'CC' as const,
      tipoPersona: 'NATURAL' as const,
      direccion: 'Calle Falsa 123',
      telefono: '3001234567',
      email: `heavy${i}@test.com`,
      ciudad: 'Bogotá',
      tipoPrecio: 'DETAL' as const,
      cupoCredito: 0,
      activo: true,
    }));

    const mockProductosPesados = Array.from({ length: 500 }, (_, i) => ({
      id: `prod-heavy-${i}`,
      sku: `SKU-HEAVY-${i}`,
      nombre: `Producto Pesado ${i}`,
      categoria: 'General',
      unidadMedida: 'und' as const,
      precio_compra: 1000,
      buffer_seguridad: 5,
      precio_venta_pos: 2000,
      precio_venta_restaurante: 1800,
      precio_venta_mayorista: 1500,
      categoriaABC: 'C' as const,
      activo: true,
    }));

    useClientStore.getState().setClientes(mockClientesPesados);
    useInventoryStore.getState().setProducts(mockProductosPesados);
    useInventoryStore.getState().setProductsCatalog(mockProductosPesados);
  });

  it('1. Debe purgar los datos masivos locales y resembrar exactamente 25 productos y 10 clientes canónicos', async () => {
    expect(useClientStore.getState().clientes.length).toBe(500);
    expect(useInventoryStore.getState().products.length).toBe(500);

    const startTime = performance.now();
    const result = await databasePurgeService.purgeLocalDatabase({
      tenantId: 'tenant-03',
      limpiarRemotoSupabase: false,
    });
    const duration = performance.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.clientesResembrados).toBe(10);
    expect(result.productosResembrados).toBe(25);
    expect(duration).toBeLessThan(150); // Ejecución sub-150ms

    // Verificar estado de Zustand Stores
    const clientesActuales = useClientStore.getState().clientes;
    const productosActuales = useInventoryStore.getState().products;

    expect(clientesActuales).toHaveLength(10);
    expect(productosActuales).toHaveLength(25);

    // Verificar cliente Consumidor Final
    const consumidor = clientesActuales.find((c) => c.identificacion === '22222222');
    expect(consumidor).toBeDefined();
    expect(consumidor?.nombre).toContain('Consumidor Final');

    // Verificar existencia de stock inicial para productos
    const stockActual = useInventoryStore.getState().stock;
    const stockBodega = stockActual['Bodega Principal'] || stockActual['b1'] || {};
    expect(stockBodega['PES-SAL-001']).toBeGreaterThanOrEqual(10);
  });

  it('2. Respeta la opción conservarSesionTurno preservando usuario y turno en localStorage', async () => {
    localStorage.setItem(DB_KEYS.currentUser, JSON.stringify({ id: 'usr-1', nombre: 'Admin Dev' }));
    localStorage.setItem(DB_KEYS.sesionActiva, JSON.stringify({ token: 'dev-token-xyz' }));
    localStorage.setItem('pezca_pos_drafts_v1', JSON.stringify([{ id: 'draft-1', items: [] }]));

    await databasePurgeService.purgeLocalDatabase({
      tenantId: 'tenant-03',
      conservarSesionTurno: true,
      limpiarRemotoSupabase: false,
    });

    // Sesión de turno y usuario deben preservarse
    expect(localStorage.getItem(DB_KEYS.currentUser)).toBeTruthy();
    expect(localStorage.getItem(DB_KEYS.sesionActiva)).toBeTruthy();

    // Borradores y transacciones pesadas deben ser purgados
    expect(localStorage.getItem('pezca_pos_drafts_v1')).toBeNull();
  });

  it('3. Limpia completamente localStorage cuando conservarSesionTurno es false', async () => {
    localStorage.setItem(DB_KEYS.currentUser, JSON.stringify({ id: 'usr-1' }));
    localStorage.setItem(DB_KEYS.sesionActiva, JSON.stringify({ token: 'abc' }));

    await databasePurgeService.purgeLocalDatabase({
      tenantId: 'tenant-03',
      conservarSesionTurno: false,
      limpiarRemotoSupabase: false,
    });

    expect(localStorage.getItem(DB_KEYS.currentUser)).toBeNull();
    expect(localStorage.getItem(DB_KEYS.sesionActiva)).toBeNull();
  });

  it('4. Permite invocar la purga remota de Supabase sin romper el flujo local si falla la red', async () => {
    // Espiar o verificar que el método no lance excepción no controlada
    const result = await databasePurgeService.purgeAll({
      tenantId: 'tenant-03',
      limpiarRemotoSupabase: true,
      conservarSesionTurno: false,
    });

    expect(result.local.success).toBe(true);
    expect(result.local.clientesResembrados).toBe(10);
    expect(result.local.productosResembrados).toBe(25);
    // Remote puede ser true (mock/éxito) o reportar aviso de fallback sin tirar la app
    expect(typeof result.remotoSuccess).toBe('boolean');
  });
});
