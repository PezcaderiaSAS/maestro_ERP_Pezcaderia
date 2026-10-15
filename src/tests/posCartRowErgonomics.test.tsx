import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LineaVentaRow } from '../views/pos/components/LineaVentaRow';
import type { LineaVenta } from '../types/pos.types';

describe('TASK-014-03: Ergonomía Táctil en Líneas de Carrito (Regla del Niño de 12 Años)', () => {
  const mockLinea: LineaVenta = {
    productoId: 'prod-1',
    sku: 'SAL-01',
    nombre: 'Salmón Noruego Fresco',
    unidad: 'KG',
    cantidad: 1.5,
    precioLista: 45000,
    descuentoPct: 0,
    precioFinal: 45000,
    totalLinea: 67500,
    precioCompra: 30000,
    esPesoManual: true,
  };

  const mockOnUpdateCantidad = vi.fn();
  const mockOnUpdateDescuentoLinea = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnWeightRead = vi.fn();
  const mockOnAplicarPrecioHistorico = vi.fn();
  const mockOnResetPrecio = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe renderizar botones de incremento, decremento y eliminar con dimensiones mínimas de 48px', () => {
    render(
      <LineaVentaRow
        linea={mockLinea}
        stockDisponible={20}
        precioFinalDisplay={45000}
        onUpdateCantidad={mockOnUpdateCantidad}
        onUpdateDescuentoLinea={mockOnUpdateDescuentoLinea}
        onRemove={mockOnRemove}
        onWeightRead={mockOnWeightRead}
        onAplicarPrecioHistorico={mockOnAplicarPrecioHistorico}
        onResetPrecio={mockOnResetPrecio}
      />
    );

    const btnDisminuir = screen.getByRole('button', { name: /disminuir cantidad/i });
    expect(btnDisminuir.className).toContain('min-w-[48px]');
    expect(btnDisminuir.className).toContain('min-h-[48px]');

    const btnAumentar = screen.getByRole('button', { name: /aumentar cantidad/i });
    expect(btnAumentar.className).toContain('min-w-[48px]');
    expect(btnAumentar.className).toContain('min-h-[48px]');

    const btnEliminar = screen.getByRole('button', { name: /eliminar producto/i });
    expect(btnEliminar.className).toContain('min-w-[48px]');
    expect(btnEliminar.className).toContain('min-h-[48px]');
  });

  it('2. El input de cantidad debe tener altura mínima de 48px y permitir auto-selección al enfocar', () => {
    render(
      <LineaVentaRow
        linea={mockLinea}
        stockDisponible={20}
        precioFinalDisplay={45000}
        onUpdateCantidad={mockOnUpdateCantidad}
        onUpdateDescuentoLinea={mockOnUpdateDescuentoLinea}
        onRemove={mockOnRemove}
        onWeightRead={mockOnWeightRead}
        onAplicarPrecioHistorico={mockOnAplicarPrecioHistorico}
        onResetPrecio={mockOnResetPrecio}
      />
    );

    const inputQty = screen.getByLabelText(/cantidad del producto en kilos/i) as HTMLInputElement;
    expect(inputQty).toBeInTheDocument();
    expect(inputQty.value).toBe('1.5');
    expect(inputQty.className).toContain('min-h-[48px]');

    // Simular foco para disparar select()
    fireEvent.focus(inputQty);
  });

  it('3. Debe incrementar y decrementar la cantidad correctamente al pulsar + y -', () => {
    render(
      <LineaVentaRow
        linea={mockLinea}
        stockDisponible={20}
        precioFinalDisplay={45000}
        onUpdateCantidad={mockOnUpdateCantidad}
        onUpdateDescuentoLinea={mockOnUpdateDescuentoLinea}
        onRemove={mockOnRemove}
        onWeightRead={mockOnWeightRead}
        onAplicarPrecioHistorico={mockOnAplicarPrecioHistorico}
        onResetPrecio={mockOnResetPrecio}
      />
    );

    const btnAumentar = screen.getByRole('button', { name: /aumentar cantidad/i });
    fireEvent.click(btnAumentar);
    expect(mockOnUpdateCantidad).toHaveBeenCalledWith('prod-1', 2.5);

    const btnDisminuir = screen.getByRole('button', { name: /disminuir cantidad/i });
    fireEvent.click(btnDisminuir);
    expect(mockOnUpdateCantidad).toHaveBeenCalledWith('prod-1', 0.5);
  });

  it('4. Debe disparar onRemove al hacer clic en el botón de eliminación de 48px', () => {
    render(
      <LineaVentaRow
        linea={mockLinea}
        stockDisponible={20}
        precioFinalDisplay={45000}
        onUpdateCantidad={mockOnUpdateCantidad}
        onUpdateDescuentoLinea={mockOnUpdateDescuentoLinea}
        onRemove={mockOnRemove}
        onWeightRead={mockOnWeightRead}
        onAplicarPrecioHistorico={mockOnAplicarPrecioHistorico}
        onResetPrecio={mockOnResetPrecio}
      />
    );

    const btnEliminar = screen.getByRole('button', { name: /eliminar producto/i });
    fireEvent.click(btnEliminar);
    expect(mockOnRemove).toHaveBeenCalledWith('prod-1');
  });
});
