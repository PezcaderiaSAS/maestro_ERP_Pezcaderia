import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockMatrizTable } from '../views/inventory/components/StockMatrizTable';
import type { Producto } from '../store/useInventoryStore';
import type { Bodega } from '../store/useWarehouseStore';

describe('StockMatrizTable Status & 12-Years-Old Test Suite', () => {
  const mockBodegas: Bodega[] = [
    { id: 'b1', nombre: 'Bodega Principal', activa: true },
    { id: 'b2', nombre: 'Bodega Averías', activa: true },
  ];

  const mockProducts: Producto[] = [
    {
      id: 'p1',
      sku: 'PES-COR-001',
      nombre: 'Corvina Entera Fresca',
      categoria: 'Pescados',
      precio_compra: 25000,
      buffer_seguridad: 10,
      precio_venta_pos: 35000,
      precio_venta_restaurante: 32000,
      precio_venta_mayorista: 30000,
      activo: true,
      control_inventario: true,
      unidadMedida: 'kg',
      categoriaABC: 'A',
    },
    {
      id: 'p2',
      sku: 'MAR-LAN-002',
      nombre: 'Langostino U12 Congelado',
      categoria: 'Mariscos',
      precio_compra: 60000,
      buffer_seguridad: 5,
      precio_venta_pos: 85000,
      precio_venta_restaurante: 80000,
      precio_venta_mayorista: 75000,
      activo: true,
      control_inventario: true,
      unidadMedida: 'kg',
      categoriaABC: 'B',
    },
    {
      id: 'p3',
      sku: 'PES-BAG-003',
      nombre: 'Bagre de Río Agotado',
      categoria: 'Pescados',
      precio_compra: 15000,
      buffer_seguridad: 5,
      precio_venta_pos: 22000,
      precio_venta_restaurante: 20000,
      precio_venta_mayorista: 18000,
      activo: true,
      control_inventario: true,
      unidadMedida: 'kg',
      categoriaABC: 'C',
    },
  ];

  // Stock scenario:
  // - Corvina has 500 kg in Bodega Principal, 0 in Bodega Averías (Total: 500 kg > buffer 10 -> MUST BE 'Stock OK')
  // - Langostino has 3 kg in Bodega Principal, 0 in Bodega Averías (Total: 3 kg <= buffer 5 -> MUST BE 'Stock Bajo')
  // - Bagre has 0 in Bodega Principal, 0 in Bodega Averías (Total: 0 kg -> MUST BE 'Sin stock')
  const mockStock = {
    'Bodega Principal': {
      'PES-COR-001': 500,
      'MAR-LAN-002': 3,
      'PES-BAG-003': 0,
    },
    'Bodega Averías': {
      'PES-COR-001': 0,
      'MAR-LAN-002': 0,
      'PES-BAG-003': 0,
    },
  };

  it('NO debe marcar un producto con 500 kg en Bodega Principal como "Sin stock" solo porque Bodega Averías tiene 0', () => {
    render(<StockMatrizTable products={mockProducts} stock={mockStock} bodegas={mockBodegas} />);

    // 1. Corvina with 500kg total stock must have "Stock OK" in the global Estado column
    expect(screen.getByText('Corvina Entera Fresca')).toBeInTheDocument();
    expect(screen.getByText('PES-COR-001')).toBeInTheDocument();
    
    // Check that Corvina's Estado cell shows 'Stock OK'
    const corvinaStatus = screen.getByTestId('status-PES-COR-001');
    expect(corvinaStatus).toHaveTextContent('Stock OK');

    // 2. Langostino with 3kg total stock (buffer 5) must show 'Stock Bajo'
    const langostinoStatus = screen.getByTestId('status-MAR-LAN-002');
    expect(langostinoStatus).toHaveTextContent('Stock Bajo');

    // 3. Bagre with 0kg total stock must show 'Sin stock'
    const bagreStatus = screen.getByTestId('status-PES-BAG-003');
    expect(bagreStatus).toHaveTextContent('Sin stock');
  });

  it('debe reflejar conteos correctos en la barra KPI superior sin falsos positivos de "Sin Stock"', () => {
    render(<StockMatrizTable products={mockProducts} stock={mockStock} bodegas={mockBodegas} />);

    // okCount: 1 (Corvina), warningCount: 1 (Langostino), criticalCount: 0, zeroCount: 1 (Bagre)
    const kpiOk = screen.getByTestId('kpi-stock-ok');
    expect(kpiOk).toHaveTextContent('1');
    expect(kpiOk).toHaveTextContent('Stock OK');

    const kpiBajo = screen.getByTestId('kpi-stock-bajo');
    expect(kpiBajo).toHaveTextContent('1');
    expect(kpiBajo).toHaveTextContent('Stock Bajo');

    const kpiSinStock = screen.getByTestId('kpi-sin-stock');
    expect(kpiSinStock).toHaveTextContent('1');
    expect(kpiSinStock).toHaveTextContent('Sin Stock');
  });
});
