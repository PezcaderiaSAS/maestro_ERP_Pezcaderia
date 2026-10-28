// src/tests/virtualGrid.test.tsx
// Pruebas TDD para el Hook de Virtualización Headless y Grilla Responsiva: SPEC-040
// Fase GREEN: Pruebas de cálculo de viewport, reciclaje de nodos DOM y límite O(1)

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { calculateVirtualGrid, useVirtualGrid } from '../hooks/useVirtualGrid';
import { VirtualCatalogGrid } from '../views/pos/components/VirtualCatalogGrid';
import type { Producto } from '../store/useInventoryStore';

describe('TASK-040-04: Virtualización Headless & VirtualCatalogGrid', () => {
  describe('1. Función Pura calculateVirtualGrid & Hook useVirtualGrid', () => {
    it('debe calcular la altura total y retornar solo los índices visibles para 16.000 ítems', () => {
      const totalItems = 16000;
      const columnsCount = 4;
      const rowHeight = 120;
      const containerHeight = 600;
      const scrollTop = 0;

      const result = calculateVirtualGrid({
        totalItems,
        columnsCount,
        rowHeight,
        containerHeight,
        scrollTop,
        overscan: 2,
      });

      expect(result.totalRows).toBe(4000); // 16000 / 4
      expect(result.totalHeight).toBe(4000 * 120); // 480,000 px
      expect(result.virtualItems.length).toBeLessThan(50); // Nunca renderizar 16.000
      expect(result.virtualItems.length).toBeGreaterThan(0);
      expect(result.startIndex).toBe(0);
    });

    it('debe desplazar dinámicamente el rango visible al scrollear (scrollTop > 0)', () => {
      const totalItems = 5000;
      const columnsCount = 3;
      const rowHeight = 100;
      const containerHeight = 500;
      const scrollTop = 1000; // Scrolleado 10 filas abajo (fila 10)

      const { result } = renderHook(() =>
        useVirtualGrid({
          totalItems,
          columnsCount,
          rowHeight,
          containerHeight,
          scrollTop,
          overscan: 1,
        })
      );

      // Fila 10 empieza en item 30
      expect(result.current.startRow).toBeGreaterThanOrEqual(9);
      expect(result.current.startIndex).toBeGreaterThanOrEqual(27);
      expect(result.current.virtualItems.length).toBeLessThan(40);
    });
  });

  describe('2. Componente VirtualCatalogGrid (Renderizado Ligero en DOM)', () => {
    const mockProducts: Producto[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `p-${i}`,
      sku: `SKU-${i}`,
      nombre: `Producto Virtual ${i}`,
      categoria: 'GENERAL',
      unidad: 'UND',
      precio_compra: 18000,
      precio_venta_pos: 25000,
      precio_venta_restaurante: 22000,
      precio_venta_mayorista: 20000,
      buffer_seguridad: 10,
      stock: 100,
      activo: true,
    }));

    it('debe renderizar el contenedor virtual con altura proporcional y menos de 50 tarjetas en el DOM', () => {
      render(
        <div style={{ height: '600px' }}>
          <VirtualCatalogGrid
            products={mockProducts}
            onSelectProduct={() => {}}
            onAddToCart={() => {}}
            containerHeight={600}
            columnsCount={4}
            rowHeight={140}
          />
        </div>
      );

      // Verificar que el contenedor principal esté presente
      const gridContainer = screen.getByTestId('virtual-catalog-grid');
      expect(gridContainer).toBeInTheDocument();

      // Verificar que en el DOM SOLO existan las tarjetas visibles y NO las 1.000
      const renderedCards = screen.getAllByTestId('virtual-product-card');
      expect(renderedCards.length).toBeLessThan(50);
      expect(renderedCards.length).toBeGreaterThan(0);
    });
  });
});
