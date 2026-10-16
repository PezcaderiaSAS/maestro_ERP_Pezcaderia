import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import type { LineaVenta } from '../types/pos.types';

describe('TASK-014-05: Cobro Fricción Cero & Retorno Inmediato de Foco (Regla del Niño de 12 Años)', () => {
  const mockLineas: LineaVenta[] = [
    {
      productoId: 'prod-1',
      sku: 'CAM-01',
      nombre: 'Camarón Tití Crudo',
      cantidad: 1.0,
      unidad: 'KG',
      precioLista: 28000,
      descuentoPct: 0,
      precioFinal: 28000,
      totalLinea: 28000,
      precioCompra: 18000,
      esPesoManual: true,
    },
  ];

  const mockStock = {
    'b-1': {
      'CAM-01': 50,
    },
  };

  const defaultProps = {
    totalFinal: 28000,
    lineas: mockLineas,
    cliente: null,
    stock: mockStock,
    bodegaActivaId: 'b-1',
    bodegaActivaNombre: 'Bodega Central',
    onGuardarBorrador: vi.fn(),
    onPagar: vi.fn().mockResolvedValue({ id: 'vta-123', total: 28000 }),
    onLimpiarCarrito: vi.fn(),
    isDisabled: false,
    isTurnoAbierto: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('1. Los botones de billetes rápidos ($10k, $20k, $50k, $100k) deben tener altura mínima de 48px', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btn10k = screen.getByRole('button', { name: /\$10k/i });
    const btn20k = screen.getByRole('button', { name: /\$20k/i });
    const btn50k = screen.getByRole('button', { name: /\$50k/i });
    const btn100k = screen.getByRole('button', { name: /\$100k/i });

    [btn10k, btn20k, btn50k, btn100k].forEach((btn) => {
      const classList = btn.className;
      const has48px = classList.includes('min-h-[48px]') || classList.includes('h-12');
      expect(has48px).toBe(true);
    });
  });

  it('2. El botón de pago "Exacto" debe tener altura mínima de 48px', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btnExacto = screen.getByRole('button', { name: /exacto/i });
    expect(btnExacto).toBeInTheDocument();
    const has48px = btnExacto.className.includes('min-h-[48px]') || btnExacto.className.includes('h-12');
    expect(has48px).toBe(true);
  });

  it('3. Los botones de medios de pago principales deben tener altura mínima de 48px para ergonomía táctil', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btnEfectivo = screen.getByRole('button', { name: /efectivo/i });
    const btnTransferencia = screen.getByRole('button', { name: /transferencia/i });
    const btnDatafono = screen.getByRole('button', { name: /datáfono/i });
    const btnCredito = screen.getByRole('button', { name: /crédito/i });

    [btnEfectivo, btnTransferencia, btnDatafono, btnCredito].forEach((btn) => {
      const hasMinHeight = btn.className.includes('min-h-[50px]') || btn.className.includes('min-h-[48px]') || btn.className.includes('h-12');
      expect(hasMinHeight).toBe(true);
    });
  });

  it('4. Tras liquidar el cobro con éxito, debe retornar el foco inmediatamente al buscador #pos-product-search-input', async () => {
    // Montar el input del buscador simulado en el DOM
    const searchInput = document.createElement('input');
    searchInput.id = 'pos-product-search-input';
    document.body.appendChild(searchInput);

    render(<PaymentPanel {...defaultProps} />);

    // Simular clic en Cobrar
    const btnCobrar = screen.getByTestId('btn-cobrar');
    fireEvent.click(btnCobrar);

    await waitFor(() => {
      expect(defaultProps.onPagar).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(searchInput);
    });
  });
});
