import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCatalog } from '../views/pos/components/POSMultivendorCatalog';
import type { Product } from '../types/erp.types';

describe('POSMultivendorCatalog Category Scroll Navigation (TDD)', () => {
  const mockCategoriesProducts: Product[] = [
    { id: '1', sku: 'P1', nombre: 'Pescado 1', categoria: 'Pescados', unidadMedida: 'kg', precio_venta_pos: 10000, precio_compra: 8000, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 10000, precio_venta_mayorista: 9000 },
    { id: '2', sku: 'P2', nombre: 'Marisco 1', categoria: 'Mariscos', unidadMedida: 'kg', precio_venta_pos: 20000, precio_compra: 15000, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 20000, precio_venta_mayorista: 18000 },
    { id: '3', sku: 'P3', nombre: 'Conserva 1', categoria: 'Conservas', unidadMedida: 'und', precio_venta_pos: 5000, precio_compra: 3000, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 5000, precio_venta_mayorista: 4500 },
    { id: '4', sku: 'P4', nombre: 'Abarrote 1', categoria: 'Abarrotes', unidadMedida: 'und', precio_venta_pos: 7000, precio_compra: 5000, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 7000, precio_venta_mayorista: 6000 },
    { id: '5', sku: 'P5', nombre: 'Bebida 1', categoria: 'Bebidas', unidadMedida: 'und', precio_venta_pos: 3000, precio_compra: 2000, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 3000, precio_venta_mayorista: 2500 },
    { id: '6', sku: 'P6', nombre: 'Empaque 1', categoria: 'Empaques', unidadMedida: 'und', precio_venta_pos: 1000, precio_compra: 500, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 1000, precio_venta_mayorista: 800 },
    { id: '7', sku: 'P7', nombre: 'Condimento 1', categoria: 'Condimentos', unidadMedida: 'und', precio_venta_pos: 2000, precio_compra: 1000, buffer_seguridad: 1, activo: true, precio_venta_restaurante: 2000, precio_venta_mayorista: 1500 },
  ];

  it('debe renderizar la barra de categorías con botones de navegación lateral cuando hay scroll', () => {
    render(
      <POSMultivendorCatalog
        products={mockCategoriesProducts}
        stockMap={{}}
        onAddToCart={vi.fn()}
        searchFilter=""
      />
    );

    // Las categorías deben estar presentes
    expect(screen.getByTestId('btn-cat-TODOS')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cat-Pescados')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cat-Mariscos')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cat-Empaques')).toBeInTheDocument();

    // El contenedor de categorías con ref
    const catContainer = screen.getByTestId('pos-category-tabs-container');
    expect(catContainer).toBeInTheDocument();

    // Botones de scroll lateral discretos
    const btnRight = screen.getByTestId('btn-category-scroll-right');
    expect(btnRight).toBeInTheDocument();

    // Mock de scrollBy en el elemento
    const scrollBySpy = vi.fn();
    catContainer.scrollBy = scrollBySpy;

    fireEvent.click(btnRight);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: expect.any(Number), behavior: 'smooth' });
  });
});

