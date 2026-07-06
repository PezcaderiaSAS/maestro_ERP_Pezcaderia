import { describe, it, expect, beforeEach } from 'vitest';
import { validarStock, registrarEntrada, registrarSalida } from '../services/inventoryService';
import { save, load } from '../services/localDb';
import { crearProducto } from './utils/testFactories';
import type { MovimientoInventario } from '../services/inventoryService';

interface StockItem {
  bodegaId: string;
  productoId: string;
  cantidad: number;
}

describe('Inventario: Control de Stock (RN-01)', () => {
  const BODEGA_ID = 'bod-001';

  beforeEach(() => {
    localStorage.clear();
    // Registrar catálogo de productos y stock inicial
    save('productsCatalog', [
      crearProducto({ id: 'prod-001', sku: 'SAL-001', unidadMedida: 'KG' })
    ]);
    save('stock', {
      [BODEGA_ID]: {
        'SAL-001': 10
      }
    });
  });

  it('debería retornar válido si hay stock suficiente', () => {
    const resultado = validarStock('prod-001', BODEGA_ID, 5);
    expect(resultado.error).toBeNull();
    expect(resultado.data?.disponible).toBe(10);
  });

  it('debería bloquear si la cantidad supera el stock disponible (RN-01)', () => {
    const resultado = validarStock('prod-001', BODEGA_ID, 15);
    expect(resultado.error).toBe('Stock insuficiente. Disponible: 10 KG');
    expect(resultado.data).toBeNull();
  });

  it('debería registrar entrada y actualizar stock', () => {
    const entResult = registrarEntrada({
      bodegaId: BODEGA_ID,
      productoId: 'prod-001',
      cantidad: 5
    });

    expect(entResult.error).toBeNull();
    expect(entResult.data?.cantidadNueva).toBe(15);

    const valResult = validarStock('prod-001', BODEGA_ID, 14);
    expect(valResult.error).toBeNull(); // Ahora hay 15, puede sacar 14
    expect(valResult.data?.disponible).toBe(15);
  });

  it('debería registrar salida y actualizar stock', () => {
    const salResult = registrarSalida({
      bodegaId: BODEGA_ID,
      productoId: 'prod-001',
      cantidad: 3
    });

    expect(salResult.error).toBeNull();
    expect(salResult.data?.cantidadNueva).toBe(7); // 10 - 3

    const valResult = validarStock('prod-001', BODEGA_ID, 8);
    expect(valResult.error).toBeDefined(); // Solo quedan 7, no puede sacar 8
  });

  it('debería registrar un movimiento en la bitácora tras una entrada', () => {
    registrarEntrada({
      bodegaId: BODEGA_ID,
      productoId: 'prod-001',
      cantidad: 10,
      referenciaId: 'ref-compra-123'
    });

    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    expect(movimientos.length).toBe(1);
    expect(movimientos[0]).toEqual(
      expect.objectContaining({
        tipo: 'ENTRADA',
        bodegaDestinoId: BODEGA_ID,
        productoId: 'prod-001',
        cantidad: 10,
        referenciaId: 'ref-compra-123'
      })
    );
  });
});
