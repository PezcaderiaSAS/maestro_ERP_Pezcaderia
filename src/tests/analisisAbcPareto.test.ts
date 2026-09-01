import { describe, it, expect } from 'vitest';
import { calcularParetoAbcLocal } from '../utils/paretoAbcCalculator';
import { ClasificacionAbc } from '../types/inventarioAbc';
import type { Producto } from '../store/useInventoryStore';
import type { MovimientoInventario } from '../store/useMovementStore';

describe('paretoAbcCalculator - Cálculo Real 80/20', () => {
  const mockProducts: Producto[] = [
    {
      id: 'p1',
      sku: 'SKU-SALMON',
      nombre: 'Filete de Salmón Premium',
      categoria: 'Pescados',
      precio_compra: 35000,
      buffer_seguridad: 5,
      precio_venta_pos: 48000,
      precio_venta_restaurante: 45000,
      precio_venta_mayorista: 42000,
      activo: true,
    },
    {
      id: 'p2',
      sku: 'SKU-ROBALO',
      nombre: 'Robalo Fresco Entero',
      categoria: 'Pescados',
      precio_compra: 28000,
      buffer_seguridad: 5,
      precio_venta_pos: 38000,
      precio_venta_restaurante: 35000,
      precio_venta_mayorista: 33000,
      activo: true,
    },
    {
      id: 'p3',
      sku: 'SKU-CAMARON',
      nombre: 'Camarón Tigre 16/20',
      categoria: 'Mariscos',
      precio_compra: 45000,
      buffer_seguridad: 5,
      precio_venta_pos: 60000,
      precio_venta_restaurante: 55000,
      precio_venta_mayorista: 52000,
      activo: true,
    },
    {
      id: 'p4',
      sku: 'SKU-BOLSA',
      nombre: 'Bolsa Empaque al Vacío',
      categoria: 'Insumos',
      precio_compra: 200,
      buffer_seguridad: 10,
      precio_venta_pos: 500,
      precio_venta_restaurante: 400,
      precio_venta_mayorista: 350,
      activo: true,
    },
  ];

  it('clasifica productos con base en movimientos reales de ventas', () => {
    const mockMovimientos: MovimientoInventario[] = [
      {
        id: 'm1',
        sku: 'SKU-SALMON',
        tipo: 'VENTA',
        cantidad: 100, // 100 * $48,000 = $4,800,000 (~70%)
        timestamp: new Date().toISOString(),
        bodegaOrigen: 'Bodega Principal',
        lote: 'LOTE-001',
        nombreProducto: 'Filete de Salmón Premium',
        actor: 'cajero',
      },
      {
        id: 'm2',
        sku: 'SKU-ROBALO',
        tipo: 'VENTA',
        cantidad: 30, // 30 * $38,000 = $1,140,000 (~17%)
        timestamp: new Date().toISOString(),
        bodegaOrigen: 'Bodega Principal',
        lote: 'LOTE-002',
        nombreProducto: 'Robalo Fresco Entero',
        actor: 'cajero',
      },
      {
        id: 'm3',
        sku: 'SKU-CAMARON',
        tipo: 'VENTA',
        cantidad: 10, // 10 * $60,000 = $600,000 (~9%)
        timestamp: new Date().toISOString(),
        bodegaOrigen: 'Bodega Principal',
        lote: 'LOTE-003',
        nombreProducto: 'Camarón Tigre 16/20',
        actor: 'cajero',
      },
      {
        id: 'm4',
        sku: 'SKU-BOLSA',
        tipo: 'VENTA',
        cantidad: 100, // 100 * $500 = $50,000 (~1%)
        timestamp: new Date().toISOString(),
        bodegaOrigen: 'Bodega Principal',
        lote: 'LOTE-004',
        nombreProducto: 'Bolsa Empaque al Vacío',
        actor: 'cajero',
      },
    ];

    const result = calcularParetoAbcLocal({
      products: mockProducts,
      movimientos: mockMovimientos,
      diasHistorial: 30,
    });

    expect(result.length).toBe(4);
    // El Salmón es el ítem top (Clase A)
    expect(result[0].codigoSku).toBe('SKU-SALMON');
    expect(result[0].clasificacion).toBe(ClasificacionAbc.A);

    // La Bolsa es el ítem menor (Clase C)
    const bolsaItem = result.find((r) => r.codigoSku === 'SKU-BOLSA');
    expect(bolsaItem?.clasificacion).toBe(ClasificacionAbc.C);
  });

  it('retorna array vacío cuando no hay productos', () => {
    const result = calcularParetoAbcLocal({ products: [] });
    expect(result.length).toBe(0);
  });
});
