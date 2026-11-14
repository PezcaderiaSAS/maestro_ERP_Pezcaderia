import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { POSMultivendorCatalog } from '../views/pos/components/POSMultivendorCatalog';
import type { Product } from '../types/erp.types';
import type { BodegaStockItem } from '../views/pos/posWarehouseStock.utils';

describe('POSMultivendorCatalog Multi-Bodega Stock Integration (TDD)', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-salmon',
      sku: 'SALMON-01',
      nombre: 'Filete de Salmón',
      categoria: 'Pescados',
      unidadMedida: 'kg',
      precio_venta_pos: 54000,
      precio_compra: 35000,
      buffer_seguridad: 2,
      activo: true,
      control_inventario: true,
      precio_venta_restaurante: 52000,
      precio_venta_mayorista: 48000,
    },
    {
      id: 'prod-tilapia',
      sku: 'TILAPIA-01',
      nombre: 'Tilapia Roja',
      categoria: 'Pescados',
      unidadMedida: 'kg',
      precio_venta_pos: 15500,
      precio_compra: 10000,
      buffer_seguridad: 2,
      activo: true,
      control_inventario: true,
      precio_venta_restaurante: 15000,
      precio_venta_mayorista: 14000,
    },
  ];

  const mockStockMap: Record<string, number> = {
    'prod-salmon': 40,
    'SALMON-01': 40,
    'prod-tilapia': 0,
    'TILAPIA-01': 0,
  };

  const mockWarehouseStockMap: Record<string, BodegaStockItem[]> = {
    'prod-salmon': [
      { bodegaId: 'b1', bodegaNombre: 'Bodega Principal', bodegaAbrev: 'Princ', cantidad: 10, disponible: true },
      { bodegaId: 'b2', bodegaNombre: 'Cuarto Frío 1', bodegaAbrev: 'Frío', cantidad: 25, disponible: true },
      { bodegaId: 'b3', bodegaNombre: 'Mostrador', bodegaAbrev: 'Most', cantidad: 5, disponible: true },
    ],
    'prod-tilapia': [
      { bodegaId: 'b1', bodegaNombre: 'Bodega Principal', bodegaAbrev: 'Princ', cantidad: 0, disponible: false },
      { bodegaId: 'b2', bodegaNombre: 'Cuarto Frío 1', bodegaAbrev: 'Frío', cantidad: 0, disponible: false },
      { bodegaId: 'b3', bodegaNombre: 'Mostrador', bodegaAbrev: 'Most', cantidad: 0, disponible: false },
    ],
  };

  it('debe renderizar mini-pills de bodega en la tarjeta de producto cuando se provee warehouseStockMap', () => {
    render(
      <POSMultivendorCatalog
        products={mockProducts}
        stockMap={mockStockMap}
        warehouseStockMap={mockWarehouseStockMap}
        onAddToCart={vi.fn()}
        searchFilter=""
      />
    );

    // Salmón tiene stock positivo
    const cardSalmon = screen.getByTestId('product-card-SALMON-01');
    expect(within(cardSalmon).queryByTestId('badge-agotado-SALMON-01')).not.toBeInTheDocument();
    expect(within(cardSalmon).getByText('Stock: 40 kg')).toBeInTheDocument();

    // Debe mostrar los mini-pills de cada bodega para el Salmón
    expect(within(cardSalmon).getByTestId('bodega-pill-Princ')).toBeInTheDocument();
    expect(within(cardSalmon).getByTestId('bodega-pill-Frío')).toBeInTheDocument();
    expect(within(cardSalmon).getByTestId('bodega-pill-Most')).toBeInTheDocument();

    // Tilapia tiene stock 0 -> debe mostrar badge AGOTADO
    const cardTilapia = screen.getByTestId('product-card-TILAPIA-01');
    expect(within(cardTilapia).getByTestId('badge-agotado-TILAPIA-01')).toBeInTheDocument();
    expect(within(cardTilapia).getByText('Agotado')).toBeInTheDocument();
  });
});
