import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';

describe('Hito M1: Fila de Carrito con Navegación [Tab] y Edición en Línea (SPEC-057 Tarea 1)', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-01',
      sku: 'MOJ-001',
      nombre: 'Mojarra Roja Entera',
      categoria: 'Pescados',
      unidadMedida: 'kg',
      precio_venta_pos: 18000,
      precio_compra: 10000,
      buffer_seguridad: 5,
      precio_venta_restaurante: 17000,
      precio_venta_mayorista: 16000,
      activo: true,
    },
    {
      id: 'prod-02',
      sku: 'ATUN-001',
      nombre: 'Atún en Lata Aceite 170g',
      categoria: 'Conservas',
      unidadMedida: 'und',
      precio_venta_pos: 8500,
      precio_compra: 5000,
      buffer_seguridad: 10,
      precio_venta_restaurante: 8000,
      precio_venta_mayorista: 7500,
      activo: true,
    },
  ];

  const mockItems: MultivendorCartItem[] = [
    {
      product: mockProducts[0],
      cantidad: 2.5,
      precioOverride: 18000,
    },
    {
      product: mockProducts[1],
      cantidad: 3,
    },
  ];

  const defaultProps = {
    items: mockItems,
    onUpdateQuantity: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    subtotal: 70500,
    total: 70500,
    onEmitirComanda: vi.fn(),
    activeVendorName: 'Diego Díaz',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Bloque 1: Renderizado de Inputs Editables y Estructura DOM
  // =========================================================================
  describe('Bloque 1: Renderizado de Inputs Editables y Estructura DOM', () => {
    it('Caso 1: Renderizado de inputs continuos para cantidad y precio unitario en cada fila', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      // Fila 0
      const qtyInput0 = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      expect(qtyInput0).toBeInTheDocument();
      expect(qtyInput0.type).toBe('number');
      expect(qtyInput0.value).toBe('2.5');

      const priceInput0 = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      expect(priceInput0).toBeInTheDocument();
      expect(priceInput0.type).toBe('number');
      expect(priceInput0.value).toBe('18000');

      // Fila 1
      const qtyInput1 = screen.getByTestId('cart-qty-input-1') as HTMLInputElement;
      expect(qtyInput1).toBeInTheDocument();
      expect(qtyInput1.type).toBe('number');
      expect(qtyInput1.value).toBe('3');

      const priceInput1 = screen.getByTestId('cart-unit-price-input-1') as HTMLInputElement;
      expect(priceInput1).toBeInTheDocument();
      expect(priceInput1.type).toBe('number');
      expect(priceInput1.value).toBe('8500');
    });

    it('Caso 2: Auto-selección de texto al recibir foco en inputs de cantidad y precio', () => {
      const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select');
      render(<POSMultivendorCart {...defaultProps} />);

      const qtyInput0 = screen.getByTestId('cart-qty-input-0');
      fireEvent.focus(qtyInput0);
      expect(selectSpy).toHaveBeenCalledTimes(1);

      const priceInput0 = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.focus(priceInput0);
      expect(selectSpy).toHaveBeenCalledTimes(2);

      selectSpy.mockRestore();
    });
  });

  // =========================================================================
  // Bloque 2: Navegación de Teclado con [Tab] y Exclusión de Controles Auxiliares
  // =========================================================================
  describe('Bloque 2: Navegación de Teclado con [Tab] y Exclusión de Controles Auxiliares', () => {
    it('Caso 3: Orden de tabulación continuo (tabIndex secuencial: Cantidad 0 -> Precio 0 -> Cantidad 1 -> Precio 1)', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const qtyInput0 = screen.getByTestId('cart-qty-input-0');
      const priceInput0 = screen.getByTestId('cart-unit-price-input-0');
      const qtyInput1 = screen.getByTestId('cart-qty-input-1');
      const priceInput1 = screen.getByTestId('cart-unit-price-input-1');

      expect(qtyInput0).toHaveAttribute('tabindex', '1');
      expect(priceInput0).toHaveAttribute('tabindex', '2');
      expect(qtyInput1).toHaveAttribute('tabindex', '3');
      expect(priceInput1).toHaveAttribute('tabindex', '4');

      const tabIndices = [
        Number(qtyInput0.getAttribute('tabindex')),
        Number(priceInput0.getAttribute('tabindex')),
        Number(qtyInput1.getAttribute('tabindex')),
        Number(priceInput1.getAttribute('tabindex')),
      ];
      expect(tabIndices).toEqual([1, 2, 3, 4]);
    });

    it('Caso 4: Exclusión estricta de botones auxiliares del ciclo [Tab] (tabIndex={-1})', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      // Steppers fila 0 y fila 1
      expect(screen.getByTestId('btn-cart-dec-0')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('btn-cart-inc-0')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('btn-cart-dec-1')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('btn-cart-inc-1')).toHaveAttribute('tabindex', '-1');

      // Botones eliminar fila 0 y fila 1
      expect(screen.getByTestId('btn-cart-remove-0')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('btn-cart-remove-1')).toHaveAttribute('tabindex', '-1');

      // Micro-botones descuento fila 0 y fila 1
      expect(screen.getByTestId('btn-cart-desc-0')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('btn-cart-desc-1')).toHaveAttribute('tabindex', '-1');
    });
  });

  // =========================================================================
  // Bloque 3: Micro-Botón de Descuento por Ítem [+ Desc]
  // =========================================================================
  describe('Bloque 3: Micro-Botón de Descuento por Ítem [+ Desc]', () => {
    it('Caso 5: Presencia y activación del micro-botón [+ Desc] por fila', () => {
      const onUpdateDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onUpdateDiscount={onUpdateDiscount}
        />
      );

      const btnDesc0 = screen.getByTestId('btn-cart-desc-0');
      const btnDesc1 = screen.getByTestId('btn-cart-desc-1');

      expect(btnDesc0).toBeInTheDocument();
      expect(btnDesc1).toBeInTheDocument();
      expect(btnDesc0).toHaveTextContent('+ Desc');

      fireEvent.click(btnDesc0);
      expect(onUpdateDiscount).toHaveBeenCalledWith(0, 0);
    });
  });

  // =========================================================================
  // Bloque 4: Emisión de Callbacks al Editar Cantidad y Precio
  // =========================================================================
  describe('Bloque 4: Emisión de Callbacks al Editar Cantidad y Precio', () => {
    it('Caso 6: Edición directa de cantidad dispara callback onSetQuantity', () => {
      const onSetQuantity = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onSetQuantity={onSetQuantity}
        />
      );

      const qtyInput0 = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput0, { target: { value: '4.5' } });
      expect(onSetQuantity).toHaveBeenCalledWith(0, 4.5);
    });

    it('Caso 7: Edición directa de precio unitario dispara callback onUpdatePrice', () => {
      const onUpdatePrice = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onUpdatePrice={onUpdatePrice}
        />
      );

      const priceInput0 = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.change(priceInput0, { target: { value: '19000' } });
      expect(onUpdatePrice).toHaveBeenCalledWith(0, 19000);
    });

    it('Caso 8: Steppers de incremento/decremento y botón eliminar preservan su operatividad táctil', () => {
      const onUpdateQuantity = vi.fn();
      const onRemoveItem = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
        />
      );

      fireEvent.click(screen.getByTestId('btn-cart-inc-0'));
      expect(onUpdateQuantity).toHaveBeenCalledWith(0, 1);

      fireEvent.click(screen.getByTestId('btn-cart-dec-0'));
      expect(onUpdateQuantity).toHaveBeenCalledWith(0, -1);

      fireEvent.click(screen.getByTestId('btn-cart-remove-0'));
      expect(onRemoveItem).toHaveBeenCalledWith(0);
    });
  });

  // =========================================================================
  // Bloque 5: Layout Flexbox Vertical y Distribución de Espacio
  // =========================================================================
  describe('Bloque 5: Layout Flexbox Vertical y Distribución de Espacio', () => {
    it('Caso 9: Contenedor y lista de ítems garantizan 85% de espacio vertical y scroll independiente', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const aside = screen.getByTestId('pos-multivendor-cart');
      expect(aside.className).toContain('flex');
      expect(aside.className).toContain('flex-col');
      expect(aside.className).toContain('h-full');

      const itemsList = screen.getByTestId('pos-cart-items-list');
      expect(itemsList.className).toContain('flex-1');
      expect(itemsList.className).toContain('min-h-0');
      expect(itemsList.className).toContain('overflow-y-auto');

      const totalDisplay = screen.getByTestId('pos-cart-total-amount');
      const footer = totalDisplay.closest('div.shrink-0');
      expect(footer).not.toBeNull();
    });
  });

  // =========================================================================
  // Bloque 6: Compatibilidad Retroactiva con Suites Preexistentes
  // =========================================================================
  describe('Bloque 6: Compatibilidad Retroactiva con Suites Preexistentes', () => {
    it('Caso 10: Preservación estricta de data-testid="cart-qty-${index}" con valor textual legible', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const qtySpan0 = screen.getByTestId('cart-qty-0');
      expect(qtySpan0).toBeInTheDocument();
      expect(qtySpan0).toHaveTextContent('2.5');

      const qtySpan1 = screen.getByTestId('cart-qty-1');
      expect(qtySpan1).toBeInTheDocument();
      expect(qtySpan1).toHaveTextContent('3');
    });
  });
});
