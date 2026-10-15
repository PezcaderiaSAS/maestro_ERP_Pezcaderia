import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';
import type { Product } from '../types/erp.types';

describe('TASK-014-02: Búsqueda Táctil, Auto-Foco y Detección de Pesaje Manual', () => {
  const mockProducts: Product[] = [
    {
      id: 'p-1',
      sku: 'ROB-01',
      nombre: 'Róbalo Fresco',
      categoria: 'PESCADOS',
      unidadMedida: 'kg',
      precio_venta_pos: 35000,
      activo: true,
    } as Product,
    {
      id: 'p-2',
      sku: 'BAT-01',
      nombre: 'Batido Verde Saludable',
      categoria: 'BEBIDAS',
      unidadMedida: 'und',
      precio_venta_pos: 8000,
      activo: true,
    } as Product,
  ];

  const mockOnAddProduct = vi.fn();
  const mockGetProductPrice = vi.fn((p) => p.precio_venta_pos || 10000);
  const mockGetProductStock = vi.fn(() => 50);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe renderizar el input de búsqueda con data-testid pos-product-search-input y altura táctil >= 48px', () => {
    render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={mockOnAddProduct}
      />
    );

    const inputBusqueda = screen.getByTestId('pos-product-search-input');
    expect(inputBusqueda).toBeInTheDocument();
    expect(inputBusqueda.className).toContain('min-h-[48px]');
  });

  it('2. Los chips de categoría deben tener una altura táctil mínima de 48px', () => {
    render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={mockOnAddProduct}
      />
    );

    // Botones de categoría: TODOS, PESCADOS, BEBIDAS
    const btnTodos = screen.getByRole('button', { name: /TODOS/i });
    expect(btnTodos.className).toContain('min-h-[48px]');

    const btnPescados = screen.getByRole('button', { name: /PESCADOS/i });
    expect(btnPescados.className).toContain('min-h-[48px]');
  });

  it('3. Debe distinguir productos por peso (kg) vs por unidad (und) con badges táctiles claros', () => {
    render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={mockOnAddProduct}
      />
    );

    expect(screen.getByText(/KILOS/i)).toBeInTheDocument();
    expect(screen.getByText(/UNIDAD/i)).toBeInTheDocument();
  });

  it('4. Al hacer clic en un producto, debe disparar onAddProduct pasando el producto correspondiente', () => {
    render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={mockOnAddProduct}
      />
    );

    const cardRobalo = screen.getByText('Róbalo Fresco');
    fireEvent.click(cardRobalo);

    expect(mockOnAddProduct).toHaveBeenCalledTimes(1);
    expect(mockOnAddProduct).toHaveBeenCalledWith(mockProducts[0]);
  });
});
