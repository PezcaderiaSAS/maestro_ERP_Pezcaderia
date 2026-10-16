import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeightPackingModal } from '../views/inventory/components/WeightPackingModal';

describe('TASK-016-05: WeightPackingModal (Alistamiento en Cuarto Frío, Validación Calibre y Precinto WMS)', () => {
  const mockItem = {
    lineaPedidoId: 'linea-01',
    productoId: 'prod-01',
    productoNombre: 'Trucha Arcoíris Entera',
    sku: 'TRU-ENT-001',
    modalidad: 'CATCH_WEIGHT_PIEZAS' as const,
    pesoNominalKg: 2.375,
    piezasSolicitadas: 5,
    calibreMinGramos: 450,
    calibreMaxGramos: 500,
    precioUnitarioPactado: 24000,
    corte: 'eviscerado' as const,
    empaque: 'canastilla' as const,
    loteSugerido: 'LOTE-FEFO-2026-001',
    toleranciaPorcentaje: 5,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    item: mockItem,
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe mostrar claramente las especificaciones pactadas: piezas, calibre en gramos y corte', () => {
    render(<WeightPackingModal {...defaultProps} />);

    expect(screen.getByText('Trucha Arcoíris Entera (TRU-ENT-001)')).toBeInTheDocument();
    expect(screen.getByText(/450g - 500g/i)).toBeInTheDocument();
  });

  it('2. Al ingresar el peso real, calcula el gramaje promedio y valida el calibre conforme en tiempo real', () => {
    render(<WeightPackingModal {...defaultProps} />);

    // Digitar 2.45 kg en el teclado táctil: '2', '.', '4', '5'
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));

    // 2.45 kg / 5 piezas = 490 g/und (dentro de 450-500g)
    expect(screen.getByText(/490 g\/und/i)).toBeInTheDocument();
    expect(screen.getByText(/Calibre Verificado Correcto|Calibre Conforme/i)).toBeInTheDocument();
  });

  it('3. Si el peso real arroja un calibre inferior al pactado, emite una advertencia de calibre bajo', () => {
    render(<WeightPackingModal {...defaultProps} />);

    // Digitar 1.80 kg: 1800g / 5 = 360 g/und (< 450g)
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));

    expect(screen.getByText(/360 g\/und/i)).toBeInTheDocument();
    expect(screen.getByText(/Calibre Inferior|inferior al rango/i)).toBeInTheDocument();
  });

  it('4. Debe incluir campo para precinto numerado de canastilla y checklist de inocuidad de empaque', () => {
    render(<WeightPackingModal {...defaultProps} />);

    const precintoInput = screen.getByTestId('b2b-input-precinto');
    expect(precintoInput).toBeInTheDocument();

    fireEvent.change(precintoInput, { target: { value: 'PREC-998877' } });
    expect((precintoInput as HTMLInputElement).value).toBe('PREC-998877');
  });

  it('5. Al confirmar pesaje dentro de parámetros, ejecuta onConfirm con peso real, piezas y precinto', () => {
    render(<WeightPackingModal {...defaultProps} />);

    // Digitar peso 2.40 kg
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    // Digitar precinto
    const precintoInput = screen.getByTestId('b2b-input-precinto');
    fireEvent.change(precintoInput, { target: { value: 'PREC-CAN-01' } });

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Pesaje & Empaque/i });
    expect(btnConfirmar).not.toBeDisabled();

    fireEvent.click(btnConfirmar);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        lineaPedidoId: 'linea-01',
        pesoRealKg: 2.4,
        piezasAlistadas: 5,
        precintoCanastilla: 'PREC-CAN-01',
      })
    );
  });
});
