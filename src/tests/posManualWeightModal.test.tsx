import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManualWeightModal } from '../views/pos/components/ManualWeightModal';
import type { Product } from '../types/erp.types';

describe('TASK-014-01: Componente Táctil ManualWeightModal (Regla del Niño de 12 Años)', () => {
  const mockProduct: Product = {
    id: 'prod-pes-01',
    sku: 'ROB-ENT-01',
    nombre: 'Róbalo Entero Fresco',
    categoria: 'PESCADOS',
    unidadMedida: 'kg',
    precio_venta_pos: 35000,
    activo: true,
  } as Product;

  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe renderizar el modal con los datos del producto, chips de peso y valor inicial', () => {
    render(
      <ManualWeightModal
        isOpen={true}
        producto={mockProduct}
        precioUnitario={35000}
        pesoInicial={1.0}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Título y datos del producto
    expect(screen.getByText('Róbalo Entero Fresco')).toBeInTheDocument();
    expect(screen.getByText(/Precio x kg:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$35\.000/i).length).toBeGreaterThanOrEqual(1);

    // Input de peso con valor inicial 1
    const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
    expect(inputPeso).toBeInTheDocument();
    expect(inputPeso.value).toBe('1');

    // Subtotal calculado inicial: 1 * 35000 = $35.000
    expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/35\.000/);

    // Chips de peso frecuente visibles
    expect(screen.getByText('0.25 kg')).toBeInTheDocument();
    expect(screen.getByText('0.5 kg')).toBeInTheDocument();
    expect(screen.getByText('1 kg')).toBeInTheDocument();
    expect(screen.getByText('2 kg')).toBeInTheDocument();
  });

  it('2. Debe actualizar el peso y recalcular el subtotal al presionar un chip de peso rápido', () => {
    render(
      <ManualWeightModal
        isOpen={true}
        producto={mockProduct}
        precioUnitario={35000}
        pesoInicial={1.0}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Clic en chip de 0.5 kg (libra)
    const chip05 = screen.getByText('0.5 kg');
    fireEvent.click(chip05);

    const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
    expect(inputPeso.value).toBe('0.5');

    // Subtotal: 0.5 * 35000 = 17.500 COP
    expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/17\.500/);
  });

  it('3. Debe permitir digitar peso usando el Keypad numérico táctil en pantalla', () => {
    render(
      <ManualWeightModal
        isOpen={true}
        producto={mockProduct}
        precioUnitario={35000}
        pesoInicial={0}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Digitar '1', '.', '5' en el keypad táctil
    fireEvent.click(screen.getByTestId('keypad-btn-1'));
    fireEvent.click(screen.getByTestId('keypad-btn-dot'));
    fireEvent.click(screen.getByTestId('keypad-btn-5'));

    const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
    expect(inputPeso.value).toBe('1.5');

    // Subtotal: 1.5 * 35000 = 52.500 COP
    expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/52\.500/);

    // Probar tecla borrar (backspace)
    fireEvent.click(screen.getByTestId('keypad-btn-backspace'));
    expect(inputPeso.value).toBe('1.');
  });

  it('4. Debe confirmar y llamar onConfirm con el peso correcto al presionar el botón gigante de agregar', () => {
    render(
      <ManualWeightModal
        isOpen={true}
        producto={mockProduct}
        precioUnitario={35000}
        pesoInicial={2.0}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const btnAgregar = screen.getByTestId('manual-weight-confirm-btn');
    // Verificar que el botón tiene altura táctil mínima de 56px (h-14)
    expect(btnAgregar.className).toContain('min-h-[56px]');

    fireEvent.click(btnAgregar);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(mockProduct, 2.0);
  });

  it('5. Debe permitir confirmar con la tecla Enter', () => {
    render(
      <ManualWeightModal
        isOpen={true}
        producto={mockProduct}
        precioUnitario={35000}
        pesoInicial={1.25}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const inputPeso = screen.getByTestId('manual-weight-input');
    fireEvent.keyDown(inputPeso, { key: 'Enter', code: 'Enter' });

    expect(mockOnConfirm).toHaveBeenCalledWith(mockProduct, 1.25);
  });

  it('6. Debe rechazar pesos menores o iguales a cero con feedback visual y no llamar onConfirm', () => {
    render(
      <ManualWeightModal
        isOpen={true}
        producto={mockProduct}
        precioUnitario={35000}
        pesoInicial={0}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const btnAgregar = screen.getByTestId('manual-weight-confirm-btn');
    fireEvent.click(btnAgregar);

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/ingresa un peso mayor a 0/i)).toBeInTheDocument();
  });
});
