// src/tests/posGlobalDiscount.test.tsx
// Suite de Pruebas TDD: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms (SPEC-057 Tarea 2 / Hito M2)

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';

describe('Hito M2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand (SPEC-057 Tarea 2)', () => {
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

  // Carrito de prueba: 2.5 kg * $18.000 = $45.000 + 3 und * $8.500 = $25.500 => Subtotal = $70.500 COP
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
    descuento: 0,
    total: 70500,
    onEmitirComanda: vi.fn(),
    activeVendorName: 'Diego Díaz',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMultiVendorPosStore.setState({
      cartItems: [],
      terminalId: 'TERM-01',
      descuentoGlobal: null,
    });
  });

  // =========================================================================
  // Bloque 1: Renderizado y Ergonomía del Botón Anclado + Descuento (F4)
  // =========================================================================
  describe('Bloque 1: Renderizado y Ergonomía del Botón Anclado + Descuento (F4)', () => {
    it('Caso 1: Renderizado del botón anclado + Descuento (F4) con data-testid="btn-descuento-global-f4"', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).toBeInTheDocument();
      expect(btnDescuento).toHaveTextContent('+ Descuento (F4)');

      // Verificar que se encuentra anclado en la sección inferior de totales
      const totalDisplay = screen.getByTestId('pos-cart-total-amount');
      const footer = totalDisplay.closest('div.shrink-0');
      expect(footer).toContainElement(btnDescuento);
    });

    it('Caso 2: Deshabilitación estricta cuando el carrito tiene 0 ítems', () => {
      render(<POSMultivendorCart {...defaultProps} items={[]} subtotal={0} total={0} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).toBeDisabled();

      // Intentar clic en botón deshabilitado no debe abrir el selector
      fireEvent.click(btnDescuento);
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('Caso 3: Habilitación operativa cuando el carrito contiene al menos 1 ítem', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).not.toBeDisabled();
    });
  });

  // =========================================================================
  // Bloque 2: Interacción de Apertura y Cierre del Selector de Descuento
  // =========================================================================
  describe('Bloque 2: Interacción de Apertura y Cierre del Selector de Descuento', () => {
    it('Caso 4: Apertura del popover interactivo al presionar el botón + Descuento (F4)', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      fireEvent.click(btnDescuento);

      const popover = screen.getByTestId('pos-discount-popover');
      expect(popover).toBeInTheDocument();
      expect(screen.getByTestId('btn-modo-porcentaje')).toBeInTheDocument();
      expect(screen.getByTestId('btn-modo-monto')).toBeInTheDocument();
      expect(screen.getByTestId('input-descuento-global-valor')).toBeInTheDocument();
      expect(screen.getByTestId('btn-aplicar-descuento-global')).toBeInTheDocument();
    });

    it('Caso 5: Cierre del popover al pulsar el botón cerrar o presionar Escape', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      // Abrir popover
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

      // Cerrar mediante botón X
      const btnCerrar = screen.getByTestId('btn-cerrar-popover-descuento');
      fireEvent.click(btnCerrar);
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();

      // Reabrir y cerrar mediante Escape
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Bloque 3: Selector de Modo [% vs $ COP] y Presets Rápidos
  // =========================================================================
  describe('Bloque 3: Selector de Modo [% vs $ COP] y Presets Rápidos', () => {
    it('Caso 6: Alternancia de modo entre Porcentaje (%) y Monto Fijo ($ COP)', () => {
      render(<POSMultivendorCart {...defaultProps} />);
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));

      const popover = screen.getByTestId('pos-discount-popover');
      const btnPorcentaje = screen.getByTestId('btn-modo-porcentaje');
      const btnMonto = screen.getByTestId('btn-modo-monto');

      // Porcentaje activo por defecto
      expect(btnPorcentaje.className).toContain('bg-amber-600');

      // Alternar a Monto Fijo
      fireEvent.click(btnMonto);
      expect(btnMonto.className).toContain('bg-amber-600');
      expect(within(popover).getByText('$')).toBeInTheDocument();

      // Regresar a Porcentaje
      fireEvent.click(btnPorcentaje);
      expect(btnPorcentaje.className).toContain('bg-amber-600');
      expect(within(popover).getByText('%')).toBeInTheDocument();
    });

    it('Caso 7: Presets rápidos de porcentaje (5%, 10%, 15%) auto-rellenan el input', () => {
      render(<POSMultivendorCart {...defaultProps} />);
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));

      const inputValor = screen.getByTestId('input-descuento-global-valor') as HTMLInputElement;

      fireEvent.click(screen.getByTestId('btn-preset-desc-5'));
      expect(inputValor.value).toBe('5');

      fireEvent.click(screen.getByTestId('btn-preset-desc-10'));
      expect(inputValor.value).toBe('10');

      fireEvent.click(screen.getByTestId('btn-preset-desc-15'));
      expect(inputValor.value).toBe('15');
    });

    it('Caso 8: Presets rápidos de monto fijo ($2.000, $5.000, $10.000) en modo moneda', () => {
      render(<POSMultivendorCart {...defaultProps} />);
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));

      // Activar modo monto
      fireEvent.click(screen.getByTestId('btn-modo-monto'));
      const inputValor = screen.getByTestId('input-descuento-global-valor') as HTMLInputElement;

      fireEvent.click(screen.getByTestId('btn-preset-desc-2000'));
      expect(inputValor.value).toBe('2000');

      fireEvent.click(screen.getByTestId('btn-preset-desc-5000'));
      expect(inputValor.value).toBe('5000');

      fireEvent.click(screen.getByTestId('btn-preset-desc-10000'));
      expect(inputValor.value).toBe('10000');
    });
  });

  // =========================================================================
  // Bloque 4: Aplicación de Descuento Porcentual y Recálculo de Totales
  // =========================================================================
  describe('Bloque 4: Aplicación de Descuento Porcentual y Recálculo de Totales', () => {
    it('Caso 9: Aplicar 10% de descuento emite callback onApplyGlobalDiscount', () => {
      const onApplyGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onApplyGlobalDiscount={onApplyGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      fireEvent.click(screen.getByTestId('btn-preset-desc-10'));
      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      expect(onApplyGlobalDiscount).toHaveBeenCalledWith('porcentaje', 10);
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('Caso 10: Desglose visual de comanda y total a pagar actualizado con descuento porcentual', () => {
      // Subtotal = $70.500, Descuento 10% = $7.050, Total = $63.450
      render(
        <POSMultivendorCart
          {...defaultProps}
          descuento={7050}
          total={63450}
          descuentoGlobalTipo="porcentaje"
          descuentoGlobalValor={10}
        />
      );

      // Verificar fila de desglose
      const desgloseRow = screen.getByTestId('cart-discount-breakdown-row');
      expect(desgloseRow).toBeInTheDocument();
      expect(screen.getByTestId('badge-descuento-global')).toHaveTextContent('-10%');
      expect(desgloseRow).toHaveTextContent('-$7.050');

      // Verificar Total a Pagar
      expect(screen.getByTestId('pos-cart-total-amount')).toHaveTextContent('$63.450');

      // Verificar que el botón anclado refleja el descuento activo
      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).toHaveTextContent('-10%');
    });
  });

  // =========================================================================
  // Bloque 5: Aplicación de Descuento en Monto Fijo ($ COP) y Prevención de Total Negativo
  // =========================================================================
  describe('Bloque 5: Aplicación de Descuento en Monto Fijo ($ COP) y Prevención de Total Negativo', () => {
    it('Caso 11: Aplicar descuento fijo de $5.000 COP emite callback y actualiza total', () => {
      const onApplyGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onApplyGlobalDiscount={onApplyGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      fireEvent.click(screen.getByTestId('btn-modo-monto'));
      fireEvent.click(screen.getByTestId('btn-preset-desc-5000'));
      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      expect(onApplyGlobalDiscount).toHaveBeenCalledWith('monto', 5000);
    });

    it('Caso 12: Prevención estricta de total negativo ante descuento mayor al subtotal', () => {
      // Si subtotal es $70.500 y se aplica $80.000, el componente o store acota a $70.500 (total = 0)
      const onApplyGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onApplyGlobalDiscount={onApplyGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      fireEvent.click(screen.getByTestId('btn-modo-monto'));

      const inputValor = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(inputValor, { target: { value: '999999' } });
      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      // Debe acotar el valor al subtotal máximo disponible
      expect(onApplyGlobalDiscount).toHaveBeenCalledWith('monto', 70500);
    });
  });

  // =========================================================================
  // Bloque 6: Limpieza y Reseteo del Descuento Global
  // =========================================================================
  describe('Bloque 6: Limpieza y Reseteo del Descuento Global', () => {
    it('Caso 13: Botón remover en el popover restablece el descuento y dispara onRemoveGlobalDiscount', () => {
      const onRemoveGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          descuento={7050}
          total={63450}
          descuentoGlobalTipo="porcentaje"
          descuentoGlobalValor={10}
          onRemoveGlobalDiscount={onRemoveGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      const btnRemover = screen.getByTestId('btn-remover-descuento-global');
      expect(btnRemover).toBeInTheDocument();

      fireEvent.click(btnRemover);
      expect(onRemoveGlobalDiscount).toHaveBeenCalledTimes(1);
    });

    it('Caso 14: Botón de descarte rápido (X) en la fila de desglose remueve el descuento inmediatamente', () => {
      const onRemoveGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          descuento={5000}
          total={65500}
          descuentoGlobalTipo="monto"
          descuentoGlobalValor={5000}
          onRemoveGlobalDiscount={onRemoveGlobalDiscount}
        />
      );

      const btnQuickRemove = screen.getByTestId('btn-quick-remove-discount');
      fireEvent.click(btnQuickRemove);
      expect(onRemoveGlobalDiscount).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Bloque 7: Lógica Financiera en Store Zustand (useMultiVendorPosStore)
  // =========================================================================
  describe('Bloque 7: Lógica Financiera en Store Zustand (useMultiVendorPosStore)', () => {
    it('Caso 15: aplicarDescuentoGlobal en modo porcentaje recalcula obtenerTotalCart', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-01',
        nombre: 'Mojarra Roja',
        cantidad: 2,
        precioLista: 20000,
        descuentoPct: 0,
      });

      expect(useMultiVendorPosStore.getState().obtenerSubtotalCart()).toBe(40000);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(40000);

      // Aplicar 10%
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 10);
      expect(useMultiVendorPosStore.getState().obtenerDescuentoGlobalMonto()).toBe(4000);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(36000);
    });

    it('Caso 16: aplicarDescuentoGlobal en modo monto resta el valor exacto en COP', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-02',
        nombre: 'Atún en Lata',
        cantidad: 4,
        precioLista: 10000,
        descuentoPct: 0,
      });

      // Subtotal = $40.000. Aplicar $7.500 COP
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('monto', 7500);
      expect(useMultiVendorPosStore.getState().obtenerDescuentoGlobalMonto()).toBe(7500);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(32500);
    });

    it('Caso 17: limpiarDescuentoGlobal restaura el total al subtotal íntegro', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-01',
        nombre: 'Mojarra Roja',
        cantidad: 2,
        precioLista: 20000,
        descuentoPct: 0,
      });

      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 15);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(34000);

      useMultiVendorPosStore.getState().limpiarDescuentoGlobal();
      expect(useMultiVendorPosStore.getState().obtenerDescuentoGlobalMonto()).toBe(0);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(40000);
    });
  });

  // =========================================================================
  // Bloque 8: Benchmark de Rendimiento en Memoria Sub-10ms (<10ms)
  // =========================================================================
  describe('Bloque 8: Benchmark de Rendimiento en Memoria Sub-10ms (<10ms)', () => {
    it('Caso 18: Recálculo con 50 líneas de catálogo en memoria ejecuta en menos de 10ms', () => {
      // Cargar 50 líneas de producto en el store de Zustand
      for (let i = 0; i < 50; i++) {
        useMultiVendorPosStore.getState().agregarItem({
          productoId: `prod-bench-${i}`,
          nombre: `Producto Especial Pescadería ${i}`,
          cantidad: 1.5 + (i % 3),
          precioLista: 12000 + i * 500,
          descuentoPct: i % 5 === 0 ? 5 : 0,
        });
      }

      expect(useMultiVendorPosStore.getState().cartItems).toHaveLength(50);

      // Medir tiempo de ejecución estricto con performance.now()
      const t0 = performance.now();
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 12);
      const total = useMultiVendorPosStore.getState().obtenerTotalCart();
      const t1 = performance.now();

      const elapsedMs = t1 - t0;
      expect(total).toBeGreaterThan(0);
      expect(elapsedMs).toBeLessThan(10); // Límite estricto constitucional: sub-10ms
    });

    it('Caso 19: Ráfaga de 100 recálculos sucesivos mantiene latencia promedio sub-1ms (60 FPS)', () => {
      const store = useMultiVendorPosStore.getState();
      const t0 = performance.now();

      for (let i = 1; i <= 100; i++) {
        if (i % 2 === 0) {
          store.aplicarDescuentoGlobal('porcentaje', (i % 20) + 1);
        } else {
          store.aplicarDescuentoGlobal('monto', i * 500);
        }
        store.obtenerTotalCart();
      }

      const totalElapsed = performance.now() - t0;
      const averageMs = totalElapsed / 100;

      expect(averageMs).toBeLessThan(1); // Rendimiento ultra-reactivo en memoria
    });
  });
});
