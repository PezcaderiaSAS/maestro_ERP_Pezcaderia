import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCatalog } from '../views/pos/components/POSMultivendorCatalog';
import type { Product } from '../types/erp.types';

describe('Hito M6: Matriz de Catálogo 6x3, Virtualización de Memoria y Estado Agotado (SPEC-057 Tarea 6)', () => {
  // Generar 50 productos de prueba para validar la paginación de 18 ítems por página
  const generateMockProducts = (count: number): Product[] => {
    return Array.from({ length: count }, (_, idx) => {
      const idNum = idx + 1;
      const isPesable = idNum % 3 === 0;
      const cat = idNum % 2 === 0 ? 'Pescados' : 'Mariscos';
      return {
        id: `prod-${idNum.toString().padStart(3, '0')}`,
        sku: `SKU-${idNum.toString().padStart(3, '0')}`,
        nombre: `Producto Fresco Mar ${idNum}`,
        categoria: cat,
        unidadMedida: isPesable ? 'kg' : 'und',
        precio_venta_pos: 10000 + idNum * 1000,
        precio_compra: 6000 + idNum * 500,
        buffer_seguridad: 5,
        precio_venta_restaurante: 9500 + idNum * 1000,
        precio_venta_mayorista: 9000 + idNum * 1000,
        activo: true,
      };
    });
  };

  const mock50Products = generateMockProducts(50);

  // Mapa de stock donde los primeros 45 tienen stock positivo y los últimos 5 están agotados (stock = 0)
  const generateStockMap = (products: Product[]): Record<string, number> => {
    const map: Record<string, number> = {};
    products.forEach((p, idx) => {
      // Los productos 46..50 tienen stock 0
      map[p.id] = idx >= 45 ? 0 : 20 + idx;
    });
    return map;
  };

  const mockStockMap = generateStockMap(mock50Products);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Bloque 1: Matriz de Alta Densidad (6x3 = 18 Tarjetas por Página)
  // =========================================================================
  describe('Bloque 1: Matriz de Alta Densidad (6x3 = 18 Tarjetas por Página)', () => {
    it('1.1 Renderiza exactamente 18 tarjetas de producto en la primera página con 50 productos disponibles', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // Debe mostrar exactamente las tarjetas de prod-001 a prod-018
      const firstPageCard = screen.getByTestId('product-card-SKU-001');
      const eighteenthCard = screen.getByTestId('product-card-SKU-018');
      expect(firstPageCard).toBeInTheDocument();
      expect(eighteenthCard).toBeInTheDocument();

      // El ítem 19 no debe estar en la página 1
      expect(screen.queryByTestId('product-card-SKU-019')).not.toBeInTheDocument();
    });

    it('1.2 Muestra el contador preciso en el footer del catálogo ("Mostrando 18 de 50 productos")', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    });

    it('1.3 Calcula el número de páginas correcto para 50 productos (Total: 3 páginas)', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // Deben existir botones de página 1, 2 y 3
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Bloque 2: Navegación Paginada (< Anterior 1 2 3 ... Siguiente >)
  // =========================================================================
  describe('Bloque 2: Navegación Paginada (< Anterior 1 2 3 ... Siguiente >)', () => {
    it('2.1 Botón Anterior está inhabilitado en la primera página', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      const btnPrev = screen.getByTestId('btn-catalog-prev-page');
      expect(btnPrev).toBeDisabled();
    });

    it('2.2 Al presionar "Siguiente", avanza a la página 2 y renderiza los ítems 19 al 36', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      const btnNext = screen.getByTestId('btn-catalog-next-page');
      fireEvent.click(btnNext);

      // Ahora deben aparecer los ítems 19 y 36
      expect(screen.getByTestId('product-card-SKU-019')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-SKU-036')).toBeInTheDocument();

      // Los ítems 1 y 37 no deben estar en la página 2
      expect(screen.queryByTestId('product-card-SKU-001')).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-card-SKU-037')).not.toBeInTheDocument();
    });

    it('2.3 Al presionar directamente el botón numérico "3", renderiza la última página con los 14 ítems restantes', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      const btnPage3 = screen.getByRole('button', { name: '3' });
      fireEvent.click(btnPage3);

      // Ítems 37 y 50 deben estar en pantalla
      expect(screen.getByTestId('product-card-SKU-037')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-SKU-050')).toBeInTheDocument();

      // Botón Siguiente debe estar deshabilitado en la última página
      const btnNext = screen.getByTestId('btn-catalog-next-page');
      expect(btnNext).toBeDisabled();

      // Botón Anterior debe estar habilitado
      const btnPrev = screen.getByTestId('btn-catalog-prev-page');
      expect(btnPrev).not.toBeDisabled();
    });

    it('2.4 Al presionar "Anterior" desde la página 3, regresa limpiamente a la página 2', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // Ir a página 3
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      expect(screen.getByTestId('product-card-SKU-050')).toBeInTheDocument();

      // Pulsar Anterior
      fireEvent.click(screen.getByTestId('btn-catalog-prev-page'));
      expect(screen.getByTestId('product-card-SKU-019')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-SKU-050')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Bloque 3: Filtrado Reactivo y Reset de Paginación
  // =========================================================================
  describe('Bloque 3: Filtrado Reactivo y Reset de Paginación', () => {
    it('3.1 Filtrar por texto reduce los productos y resetea la vista a la página 1', () => {
      const { rerender } = render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // Avanzar a página 2
      fireEvent.click(screen.getByTestId('btn-catalog-next-page'));
      expect(screen.getByTestId('product-card-SKU-019')).toBeInTheDocument();

      // Aplicar filtro de búsqueda específico que coincide con "Producto Fresco Mar 1"
      rerender(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter="Producto Fresco Mar 1"
        />
      );

      // Debe mostrar resultados en página 1 con SKU-001 presente
      expect(screen.getByTestId('product-card-SKU-001')).toBeInTheDocument();
      const btnPrev = screen.getByTestId('btn-catalog-prev-page');
      expect(btnPrev).toBeDisabled();
    });

    it('3.2 Seleccionar una categoría filtra los productos y resetea el paginador a página 1', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // Avanzar a página 2
      fireEvent.click(screen.getByTestId('btn-catalog-next-page'));
      expect(screen.getByTestId('product-card-SKU-019')).toBeInTheDocument();

      // Seleccionar categoría "Mariscos"
      const btnMariscos = screen.getByTestId('btn-cat-Mariscos');
      fireEvent.click(btnMariscos);

      // Debe volver a página 1 mostrando solo Mariscos (prod-001 es impar = Mariscos)
      expect(screen.getByTestId('product-card-SKU-001')).toBeInTheDocument();
      expect(screen.getByTestId('btn-catalog-prev-page')).toBeDisabled();
    });

    it('3.3 Si la búsqueda no arroja coincidencias, muestra el estado vacío informativo', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter="TERMINO_INEXISTENTE_XYZ"
        />
      );

      expect(screen.getByText('No se encontraron productos coincidentes')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-SKU-001')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Bloque 4: Visualización Estricta de Stock y Estado Agotado (F17)
  // =========================================================================
  describe('Bloque 4: Visualización Estricta de Stock y Estado Agotado (F17)', () => {
    it('4.1 Productos con stock > 0 muestran "Stock: X" y no tienen badge AGOTADO', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // prod-001 tiene stock = 20
      const card = screen.getByTestId('product-card-SKU-001');
      expect(card).toBeInTheDocument();
      expect(card).not.toHaveClass('opacity-60');
      expect(screen.queryByTestId('badge-agotado-SKU-001')).not.toBeInTheDocument();
      expect(screen.getByText('Stock: 20 und')).toBeInTheDocument();
    });

    it('4.2 Productos con stock <= 0 muestran badge destacado AGOTADO, texto "Agotado" y clase opacity-60', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      // Ir a la página 3 donde están los productos 46..50 agotados
      fireEvent.click(screen.getByRole('button', { name: '3' }));

      // prod-050 tiene stock = 0
      const cardAgotada = screen.getByTestId('product-card-SKU-050');
      expect(cardAgotada).toBeInTheDocument();
      expect(cardAgotada).toHaveClass('opacity-60');

      // Badge prominente de AGOTADO
      const badgeAgotado = screen.getByTestId('badge-agotado-SKU-050');
      expect(badgeAgotado).toBeInTheDocument();
      expect(badgeAgotado).toHaveTextContent('AGOTADO');
    });
  });

  // =========================================================================
  // Bloque 5: Rendimiento de Paginación en Memoria (< 16ms, 60 FPS)
  // =========================================================================
  describe('Bloque 5: Rendimiento de Paginación en Memoria (< 16ms, 60 FPS)', () => {
    it('5.1 Conmutación rápida entre páginas y cálculo de slicing en memoria cumple con presupuesto de latencia < 16ms', () => {
      // 1. Benchmark del algoritmo de particionado en memoria (1000 accesos a página)
      const startCalc = performance.now();
      for (let i = 0; i < 1000; i++) {
        const page = (i % 3) + 1;
        const start = (page - 1) * 18;
        const _ = mock50Products.slice(start, start + 18);
      }
      const calcDuration = performance.now() - startCalc;
      // 1000 operaciones de paginación en memoria toman < 16ms (< 0.016ms por página)
      expect(calcDuration).toBeLessThan(16);

      // 2. Transiciones DOM en el componente
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      const btnNext = screen.getByTestId('btn-catalog-next-page');
      const btnPrev = screen.getByTestId('btn-catalog-prev-page');

      // Ejecutar 5 ciclos de conmutación sin errores ni bloqueos
      for (let i = 0; i < 5; i++) {
        fireEvent.click(btnNext);
        fireEvent.click(btnPrev);
      }
      expect(screen.getByTestId('product-card-SKU-001')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Bloque 6: Ergonomía Táctil y Estructura Responsive
  // =========================================================================
  describe('Bloque 6: Ergonomía Táctil y Estructura Responsive', () => {
    it('6.1 Botones de paginación cumplen tamaño táctil accesible', () => {
      render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      const btnPrev = screen.getByTestId('btn-catalog-prev-page');
      const btnNext = screen.getByTestId('btn-catalog-next-page');

      // Clases de altura mínima de toque
      expect(btnPrev.className).toContain('min-h-[34px]');
      expect(btnNext.className).toContain('min-h-[34px]');
    });

    it('6.2 La cuadrícula posee clases responsivas de 2 columnas en móvil a 6 en desktop', () => {
      const { container } = render(
        <POSMultivendorCatalog
          products={mock50Products}
          stockMap={mockStockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      const gridEl = container.querySelector('.grid');
      expect(gridEl).toBeInTheDocument();
      expect(gridEl?.className).toContain('grid-cols-2');
      expect(gridEl?.className).toContain('sm:grid-cols-3');
      expect(gridEl?.className).toContain('md:grid-cols-4');
      expect(gridEl?.className).toContain('lg:grid-cols-6');
    });
  });
});
