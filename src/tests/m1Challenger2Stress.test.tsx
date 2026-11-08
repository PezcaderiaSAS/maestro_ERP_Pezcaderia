import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { calcularTotalLinea, calcularTotalesPedido, calcularCostoProductoDerivado } from '../services/posService';
import { usePOSCart } from '../hooks/usePOSCart';
import { LineaVentaRow } from '../views/pos/components/LineaVentaRow';
import { CartPanel } from '../views/pos/components/CartPanel';
import type { LineaVenta } from '../types/pos.types';
import type { Producto } from '../types/inventory.types';

describe('M1 Challenger 2: Empirical Stress Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COP INTEGER ROUNDING & MATHEMATICAL PRECISION ACROSS WEIGHTED LINES
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. COP Integer Rounding & Invariants across Multiple Weighted Lines', () => {
    it('guarantees 100% integer values and no fractional cents across 100 random weighted lines', () => {
      const mockLines: LineaVenta[] = [];
      const weights = [0.005, 0.123, 0.333, 0.457, 0.892, 1.001, 1.345, 2.718, 3.1415, 7.899];
      const prices = [13789, 21500, 28500, 33333, 45000, 52333, 99999];
      const discounts = [0, 5, 7, 10, 15, 33, 50];
      const ivaRates = [0, 5, 19];

      for (let i = 0; i < 100; i++) {
        const weight = weights[i % weights.length];
        const price = prices[i % prices.length];
        const discount = discounts[i % discounts.length];
        const iva = ivaRates[i % ivaRates.length];

        const lineCalc = calcularTotalLinea(price, discount, weight, iva, true);

        // Assert all line outputs are strictly integers
        expect(Number.isInteger(lineCalc.precioFinal), `Line ${i} precioFinal must be integer`).toBe(true);
        expect(Number.isInteger(lineCalc.totalLinea), `Line ${i} totalLinea must be integer`).toBe(true);
        expect(Number.isInteger(lineCalc.baseGravableLinea), `Line ${i} baseGravable must be integer`).toBe(true);
        expect(Number.isInteger(lineCalc.cuotaIvaLinea), `Line ${i} cuotaIva must be integer`).toBe(true);

        // Assert Line Invariant: baseGravable + cuotaIva === totalLinea (for ivaIncluido)
        expect(lineCalc.baseGravableLinea + lineCalc.cuotaIvaLinea).toBe(lineCalc.totalLinea);

        mockLines.push({
          productoId: `p-${i}`,
          sku: `SKU-${i}`,
          nombre: `Producto Pesable ${i}`,
          cantidad: weight,
          unidad: 'KG',
          precioLista: price,
          descuentoPct: discount,
          precioFinal: lineCalc.precioFinal,
          totalLinea: lineCalc.totalLinea,
          baseGravableLinea: lineCalc.baseGravableLinea,
          cuotaIvaLinea: lineCalc.cuotaIvaLinea,
          precioCompra: Math.round(price * 0.6),
          esPesoManual: true,
          iva,
          ivaIncluido: true,
        });
      }

      // Consolidate totals for the whole 100-item order
      const resultadoTotales = calcularTotalesPedido(mockLines, 0, 0);
      expect(resultadoTotales.error).toBeNull();
      const totales = resultadoTotales.data!;

      // Assert Order Totals are strictly integers
      expect(Number.isInteger(totales.subtotal)).toBe(true);
      expect(Number.isInteger(totales.subtotalBaseGravable)).toBe(true);
      expect(Number.isInteger(totales.totalIva)).toBe(true);
      expect(Number.isInteger(totales.totalFinal)).toBe(true);

      // Order Invariant: subtotalBaseGravable + totalIva === totalFinal
      expect(totales.subtotalBaseGravable + totales.totalIva).toBe(totales.totalFinal);
    });

    it('calculates derived product costs for irregular gram amounts with strict integer rounding', () => {
      const oddGrams = [1, 7, 33, 125, 333, 499, 501, 750, 999];
      for (const g of oddGrams) {
        const cost = calcularCostoProductoDerivado(28500, g);
        expect(Number.isInteger(cost)).toBe(true);
        expect(cost).toBe(Math.round(28500 * (g / 1000)));
      }
    });

    it('handles extreme discounts and zero prices safely', () => {
      // 100% discount
      const freeItem = calcularTotalLinea(30000, 100, 2.5, 19, true);
      expect(freeItem.totalLinea).toBe(0);
      expect(freeItem.baseGravableLinea).toBe(0);
      expect(freeItem.cuotaIvaLinea).toBe(0);

      // 0 price
      const zeroItem = calcularTotalLinea(0, 0, 5, 19, true);
      expect(zeroItem.totalLinea).toBe(0);
      expect(zeroItem.baseGravableLinea).toBe(0);
      expect(zeroItem.cuotaIvaLinea).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. EDGE CONDITIONS: QUANTITY DECREMENT BELOW 1 & DIRECT EDITS
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Edge Conditions: Quantity Decrement Below 1 & Direct Edits', () => {
    it('LineaVentaRow: Decrement button from qty 1 triggers onRemove immediately', () => {
      const onRemove = vi.fn();
      const onUpdateCantidad = vi.fn();

      const singleItem: LineaVenta = {
        productoId: 'prod-single-1',
        sku: 'SKU-01',
        nombre: 'Filete de Merluza',
        cantidad: 1,
        unidad: 'UNIDAD',
        precioLista: 15000,
        descuentoPct: 0,
        precioFinal: 15000,
        totalLinea: 15000,
        precioCompra: 9000,
        esPesoManual: false,
      };

      render(
        <LineaVentaRow
          linea={singleItem}
          stockDisponible={10}
          precioFinalDisplay={15000}
          onUpdateCantidad={onUpdateCantidad}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={onRemove}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const btnDisminuir = screen.getByTestId('btn-disminuir-cantidad');
      fireEvent.click(btnDisminuir);

      // 1 - 1 = 0 <= 0 -> onRemove called, onUpdateCantidad NOT called
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith('prod-single-1');
      expect(onUpdateCantidad).not.toHaveBeenCalled();
    });

    it('LineaVentaRow: Decrement button from fractional qty <= 1 triggers onRemove', () => {
      const onRemove = vi.fn();
      const onUpdateCantidad = vi.fn();

      const fractionalItem: LineaVenta = {
        productoId: 'prod-frac-1',
        sku: 'SKU-02',
        nombre: 'Camaron Granel',
        cantidad: 0.65,
        unidad: 'KG',
        precioLista: 40000,
        descuentoPct: 0,
        precioFinal: 40000,
        totalLinea: 26000,
        precioCompra: 25000,
        esPesoManual: true,
      };

      render(
        <LineaVentaRow
          linea={fractionalItem}
          stockDisponible={10}
          precioFinalDisplay={40000}
          onUpdateCantidad={onUpdateCantidad}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={onRemove}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const btnDisminuir = screen.getByTestId('btn-disminuir-cantidad');
      fireEvent.click(btnDisminuir);

      // 0.65 - 1 = -0.35 <= 0 -> onRemove called
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith('prod-frac-1');
      expect(onUpdateCantidad).not.toHaveBeenCalled();
    });

    it('LineaVentaRow: Direct input blur with 0, negative or invalid input triggers onRemove', () => {
      const onRemove = vi.fn();
      const onUpdateCantidad = vi.fn();

      const item: LineaVenta = {
        productoId: 'prod-edit-1',
        sku: 'SKU-03',
        nombre: 'Mojarra Roja',
        cantidad: 3,
        unidad: 'UNIDAD',
        precioLista: 12000,
        descuentoPct: 0,
        precioFinal: 12000,
        totalLinea: 36000,
        precioCompra: 8000,
        esPesoManual: false,
      };

      const { rerender } = render(
        <LineaVentaRow
          linea={item}
          stockDisponible={10}
          precioFinalDisplay={12000}
          onUpdateCantidad={onUpdateCantidad}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={onRemove}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const inputCantidad = screen.getByTestId('input-cantidad');

      // 1. User clears input and blurs (value is empty string / NaN)
      fireEvent.blur(inputCantidad, { target: { value: '' } });
      expect(onRemove).toHaveBeenCalledWith('prod-edit-1');

      // 2. User types 0 and blurs
      fireEvent.blur(inputCantidad, { target: { value: '0' } });
      expect(onRemove).toHaveBeenCalledWith('prod-edit-1');

      // 3. User types negative number -4 and blurs
      fireEvent.blur(inputCantidad, { target: { value: '-4' } });
      expect(onRemove).toHaveBeenCalledWith('prod-edit-1');

      // 4. User types valid number 5 and changes -> onUpdateCantidad called
      fireEvent.change(inputCantidad, { target: { value: '5' } });
      expect(onUpdateCantidad).toHaveBeenCalledWith('prod-edit-1', 5);
    });

    it('usePOSCart hook: actualizarCantidad(id, 0) or negative cleans item from cart', () => {
      const { result } = renderHook(() => usePOSCart());

      const dummyProduct: Producto = {
        id: 'prod-hook-1',
        sku: 'HK-01',
        nombre: 'Robalo Fresco',
        precioVentaPOS: 42000,
        precioVentaRestaurante: 38000,
        precioVentaMayorista: 35000,
        precioCompra: 28000,
        unidadMedida: 'KG',
        activo: true,
        categoriaId: 'cat-1',
        codigoBarras: '111222',
        imagenUrl: null,
        bufferSeguridad: 5,
      };

      act(() => {
        result.current.agregarProducto(dummyProduct, 3);
      });

      expect(result.current.lineas.length).toBe(1);
      expect(result.current.lineas[0].cantidad).toBe(3);

      // Decrement to 0
      act(() => {
        result.current.actualizarCantidad('prod-hook-1', 0);
      });
      expect(result.current.lineas.length).toBe(0);

      // Add again and test negative quantity
      act(() => {
        result.current.agregarProducto(dummyProduct, 2);
      });
      expect(result.current.lineas.length).toBe(1);

      act(() => {
        result.current.actualizarCantidad('prod-hook-1', -1.5);
      });
      expect(result.current.lineas.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. COMANDA / MOSTRADOR MODE SWITCHING BEHAVIOR
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Comanda / Mostrador Mode Switching Toggling & Shortcuts', () => {
    const defaultCartProps = {
      lineas: [
        {
          productoId: 'p-mode-1',
          sku: 'MOD-01',
          nombre: 'Pescado Sierra',
          cantidad: 2,
          unidad: 'KG' as const,
          precioLista: 25000,
          precioFinal: 25000,
          totalLinea: 50000,
          precioCompra: 18000,
          descuentoPct: 0,
          esPesoManual: false,
        },
      ],
      cliente: null,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totales: { subtotal: 50000, descuento: 0, totalFinal: 50000 },
      drafts: [],
      activeDraftId: null,
      stock: {},
      bodegaActivaId: 'bod-01',
      bodegaActivaNombre: 'Bodega Principal',
      lastClientPrices: {},
      onUpdateCantidad: vi.fn(),
      onUpdateDescuentoLinea: vi.fn(),
      onRemoveLinea: vi.fn(),
      onWeightRead: vi.fn(),
      onLimpiarCarrito: vi.fn(),
      onSetLineas: vi.fn(),
      onSelectCliente: vi.fn(),
      onClearCliente: vi.fn(),
      onDescuentoClick: vi.fn(),
      onPagar: vi.fn(),
      onGuardarBorrador: vi.fn(),
      onSetActiveDraftId: vi.fn(),
      onSetDrafts: vi.fn(),
      onSetDescuentoGlobal: vi.fn(),
      isTurnoAbierto: true,
    };

    it('renders "EMITIR PREVENTA / COMANDA (F6)" in Mostrador Mode and suppresses Cashier "Vender / Cobrar"', () => {
      render(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);

      // Must render Mostrador emission button
      const emitirBtn = screen.getByTestId('btn-emitir-preventa-mostrador');
      expect(emitirBtn).toBeInTheDocument();
      expect(emitirBtn).toHaveTextContent(/EMITIR PREVENTA \/ COMANDA/i);
      expect(emitirBtn).toHaveTextContent(/\(F6\)/);

      // Must NOT render Cashier Vender/Cobrar button
      expect(screen.queryByTestId('btn-cobrar')).not.toBeInTheDocument();
      expect(screen.queryByText(/⚡ Vender \/ Cobrar/i)).not.toBeInTheDocument();

      // Clicking emitir calls onGuardarBorrador
      fireEvent.click(emitirBtn);
      expect(defaultCartProps.onGuardarBorrador).toHaveBeenCalledTimes(1);
    });

    it('renders "⚡ Vender / Cobrar" and "Guardar (En Espera F6)" in Cashier Mode', () => {
      render(<CartPanel {...defaultCartProps} isAsesorMostrador={false} />);

      // Must render Vender/Cobrar button with total
      const cobrarBtn = screen.getByTestId('btn-cobrar');
      expect(cobrarBtn).toBeInTheDocument();
      expect(cobrarBtn).toHaveTextContent(/⚡ Vender \/ Cobrar/i);
      expect(cobrarBtn).toHaveTextContent(/\$50\.000/);

      // Must render secondary Guardar (En Espera F6) button
      const guardarBtn = screen.getByRole('button', { name: /poner pedido actual en espera/i });
      expect(guardarBtn).toBeInTheDocument();
      expect(guardarBtn).toHaveTextContent(/Guardar \(En Espera F6\)/i);

      // Must NOT render Mostrador emission button
      expect(screen.queryByTestId('btn-emitir-preventa-mostrador')).not.toBeInTheDocument();
    });

    it('dynamically toggles mode in the same component instance without leaking state', () => {
      const { rerender } = render(<CartPanel {...defaultCartProps} isAsesorMostrador={false} />);

      // Initially Cashier Mode
      expect(screen.getByTestId('btn-cobrar')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-emitir-preventa-mostrador')).not.toBeInTheDocument();

      // Switch to Mostrador Mode
      rerender(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);
      expect(screen.queryByTestId('btn-cobrar')).not.toBeInTheDocument();
      expect(screen.getByTestId('btn-emitir-preventa-mostrador')).toBeInTheDocument();

      // Switch back to Cashier Mode
      rerender(<CartPanel {...defaultCartProps} isAsesorMostrador={false} />);
      expect(screen.getByTestId('btn-cobrar')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-emitir-preventa-mostrador')).not.toBeInTheDocument();
    });

    it('F2 keyboard shortcut opens payment drawer in Cashier Mode, but does nothing in Mostrador Mode', () => {
      const { unmount } = render(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);

      // In Mostrador mode: press F2 -> should NOT open payment drawer
      fireEvent.keyDown(window, { key: 'F2' });
      expect(screen.queryByTestId('payment-drawer-backdrop')).not.toBeInTheDocument();
      unmount();

      // In Cashier mode: press F2 -> SHOULD open payment drawer
      render(<CartPanel {...defaultCartProps} isAsesorMostrador={false} />);
      fireEvent.keyDown(window, { key: 'F2' });
      expect(screen.getByTestId('payment-drawer-backdrop')).toBeInTheDocument();
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();
    });
  });
});
