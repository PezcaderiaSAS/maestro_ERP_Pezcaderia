import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import type { LineaVenta } from '../types/pos.types';

describe('TASK-014-04: Ergonomía Táctil del Botón COBRAR & Acciones (Regla del Niño de 12 Años)', () => {
  const mockLineas: LineaVenta[] = [
    {
      productoId: 'p-1',
      sku: 'MOJ-01',
      nombre: 'Mojarra Roja Entera',
      cantidad: 2.0,
      unidad: 'KG',
      precioLista: 18000,
      descuentoPct: 0,
      precioFinal: 18000,
      totalLinea: 36000,
      precioCompra: 12000,
      esPesoManual: true,
    },
  ];

  const mockStock = {
    'bodega-1': {
      'MOJ-01': 50,
    },
  };

  const defaultProps = {
    totalFinal: 36000,
    lineas: mockLineas,
    cliente: null,
    stock: mockStock,
    bodegaActivaId: 'bodega-1',
    bodegaActivaNombre: 'Bodega Principal',
    onGuardarBorrador: vi.fn(),
    onPagar: vi.fn(),
    onLimpiarCarrito: vi.fn(),
    isDisabled: false,
    isTurnoAbierto: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. El botón COBRAR debe tener altura mínima de 56px (h-14 / min-h-[56px]) para máxima ergonomía táctil', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar).toBeInTheDocument();
    
    // Verificar que cumpla con la regla del niño de 12 años (>= 56px de altura táctil)
    const classList = btnCobrar.className;
    const hasMin56px = classList.includes('min-h-[56px]') || classList.includes('h-14');
    expect(hasMin56px).toBe(true);
  });

  it('2. El botón de Borrador / En Espera debe tener altura mínima de 48px para evitar toques falsos', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btnBorrador = screen.getByRole('button', { name: /poner pedido actual en espera/i });
    expect(btnBorrador).toBeInTheDocument();
    
    const classList = btnBorrador.className;
    const hasMin48px = classList.includes('min-h-[48px]') || classList.includes('h-12') || classList.includes('h-14');
    expect(hasMin48px).toBe(true);
  });

  it('3. El botón COBRAR debe exhibir claramente el total en COP con alto contraste y legibilidad', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar.textContent).toContain('$36.000');
    expect(btnCobrar.className).toContain('bg-emerald-600');
  });

  it('4. Si el turno está cerrado, el botón de Abrir Turno debe medir al menos 56px de altura', () => {
    render(<PaymentPanel {...defaultProps} isTurnoAbierto={false} />);

    const btnTurno = screen.getByRole('button', { name: /abrir turno de caja/i });
    expect(btnTurno).toBeInTheDocument();
    const classList = btnTurno.className;
    const hasMin56px = classList.includes('min-h-[56px]') || classList.includes('h-14');
    expect(hasMin56px).toBe(true);
  });
});
