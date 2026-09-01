import { describe, it, expect, vi } from 'vitest';
import { processBulkProductsQueue, RawProductInput } from '../utils/bulkProductQueue';

describe('bulkProductQueue - Procesamiento de lotes de a 5 y Brecha Dinámica', () => {
  it('procesa una lista de 12 productos dividiéndola en 3 lotes (5, 5, 2) en modo reposo (idle)', async () => {
    const rawItems: RawProductInput[] = Array.from({ length: 12 }).map((_, i) => ({
      nombre: `Producto de Prueba ${i + 1}`,
      categoria: i % 2 === 0 ? 'Pescados' : 'Mariscos',
      precio_compra: (i + 1) * 10000,
    }));

    const progressCalls: any[] = [];
    const batchCalls: any[][] = [];

    const result = await processBulkProductsQueue(rawItems, {
      idleUserDelayMs: 5,
      isUserActiveFn: () => false, // Modo inactivo / reposo
      onProgress: (p) => progressCalls.push({ ...p }),
      saveBatchFn: async (batch) => {
        batchCalls.push(batch);
      },
    });

    expect(result.successCount).toBe(12);
    expect(result.failedCount).toBe(0);
    expect(batchCalls.length).toBe(3);
    expect(batchCalls[0].length).toBe(5);
    expect(batchCalls[1].length).toBe(5);
    expect(batchCalls[2].length).toBe(2);

    expect(progressCalls.length).toBe(3);
    expect(progressCalls[2].percentage).toBe(100);
  });

  it('aplica la pausa de 5 minutos cuando se detecta un usuario activo', async () => {
    const rawItems: RawProductInput[] = Array.from({ length: 6 }).map((_, i) => ({
      nombre: `Item Activo ${i + 1}`,
      categoria: 'Pescados',
    }));

    const delayApplied = false;
    const isUserActiveFn = () => true; // Usuario activo

    // Para el test simulamos el delay de 5 minutos con un valor pequeño de test
    const customActiveDelay = 15; // 15ms en lugar de 300,000ms para test rápido

    const startTime = Date.now();
    const result = await processBulkProductsQueue(rawItems, {
      activeUserDelayMs: customActiveDelay,
      isUserActiveFn,
    });
    const duration = Date.now() - startTime;

    expect(result.successCount).toBe(6);
    expect(duration).toBeGreaterThanOrEqual(customActiveDelay);
  });

  it('tolera errores individuales sin cancelar los demás elementos del lote', async () => {
    const rawItems: RawProductInput[] = [
      { nombre: 'Salmón Fresco', categoria: 'Pescados' },
      { nombre: '', categoria: 'Inválido' }, // Error: nombre vacío
      { nombre: 'Camarón Jumbo', categoria: 'Mariscos' },
    ];

    const result = await processBulkProductsQueue(rawItems, {
      isUserActiveFn: () => false,
      idleUserDelayMs: 1,
    });

    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0].error).toContain('obligatorio');
  });
});
