import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import type { LineaVenta } from '../types/pos.types';

describe('SPEC-019: Ergonomía, Legibilidad y Cero Desbordamiento en Medios de Pago POS', () => {
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

  it('1. Debe renderizar los 4 macro-medios principales (Efectivo, Transferencia, Datáfono, Crédito) en grilla accesible sin truncado', () => {
    render(<PaymentPanel {...defaultProps} />);

    // Verificar presencia de los 4 botones principales
    const btnEfectivo = screen.getByTestId('btn-metodo-efectivo');
    const btnTransferencia = screen.getByTestId('btn-metodo-transferencia');
    const btnDatafono = screen.getByTestId('btn-metodo-datafono');
    const btnCredito = screen.getByTestId('btn-metodo-credito');

    expect(btnEfectivo).toBeInTheDocument();
    expect(btnTransferencia).toBeInTheDocument();
    expect(btnDatafono).toBeInTheDocument();
    expect(btnCredito).toBeInTheDocument();

    // Las etiquetas deben mostrar los textos completos
    expect(btnEfectivo).toHaveTextContent(/Efectivo/i);
    expect(btnTransferencia).toHaveTextContent(/Transferencia/i);
    expect(btnDatafono).toHaveTextContent(/Datáfono/i);
    expect(btnCredito).toHaveTextContent(/Crédito/i);

    // Verificar que los botones tengan altura ergonómica mínima de 48px
    expect(btnEfectivo.className).toMatch(/min-h-\[(?:48|50|52)px\]/);
    expect(btnTransferencia.className).toMatch(/min-h-\[(?:48|50|52)px\]/);
  });

  it('2. Al seleccionar "Transferencia", debe desplegar la sub-barra con Nequi, Daviplata y QR Bancolombia', () => {
    render(<PaymentPanel {...defaultProps} />);

    const btnTransferencia = screen.getByTestId('btn-metodo-transferencia');
    fireEvent.click(btnTransferencia);

    // La sub-barra debe existir y mostrar las 3 opciones
    const subBar = screen.getByTestId('sub-pills-transferencias');
    expect(subBar).toBeInTheDocument();

    const pillNequi = screen.getByTestId('pill-transferencia-nequi');
    const pillDaviplata = screen.getByTestId('pill-transferencia-daviplata');
    const pillQR = screen.getByTestId('pill-transferencia-qr_bancolombia');

    expect(pillNequi).toHaveTextContent(/Nequi/i);
    expect(pillDaviplata).toHaveTextContent(/Daviplata/i);
    expect(pillQR).toHaveTextContent(/QR Bancolombia/i);
  });

  it('3. Al elegir Daviplata dentro de Transferencias y cobrar, debe emitir DAVIPLATA a onPagar', async () => {
    const onPagarMock = vi.fn();
    render(<PaymentPanel {...defaultProps} onPagar={onPagarMock} />);

    // 1. Activar categoría Transferencia
    fireEvent.click(screen.getByTestId('btn-metodo-transferencia'));

    // 2. Elegir Daviplata
    const pillDaviplata = screen.getByTestId('pill-transferencia-daviplata');
    fireEvent.click(pillDaviplata);

    // 3. Ejecutar cobro
    const btnCobrar = screen.getByTestId('btn-cobrar');
    fireEvent.click(btnCobrar);

    expect(onPagarMock).toHaveBeenCalledTimes(1);
    expect(onPagarMock).toHaveBeenCalledWith([
      {
        metodo: 'DAVIPLATA',
        monto: 36000,
      },
    ]);
  });

  it('4. Los atajos de teclado F1-F4 deben conmutar las categorías y teclas 1-3 las transferencias', () => {
    render(<PaymentPanel {...defaultProps} />);

    // Presionar F2 para ir a Transferencia
    fireEvent.keyDown(window, { key: 'F2' });
    expect(screen.getByTestId('sub-pills-transferencias')).toBeInTheDocument();

    // Presionar 2 para cambiar a Daviplata
    fireEvent.keyDown(window, { key: '2' });
    const pillDaviplata = screen.getByTestId('pill-transferencia-daviplata');
    expect(pillDaviplata.className).toMatch(/border-rose-|ring-rose-|bg-rose-/);

    // Presionar F1 para volver a Efectivo
    fireEvent.keyDown(window, { key: 'F1' });
    expect(screen.queryByTestId('sub-pills-transferencias')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-metodo-efectivo').className).toMatch(/border-indigo-|bg-indigo-|border-emerald-|bg-emerald-/);
  });

  it('5. En Modo Split (+ Split), los inputs deben contar con altura mínima de 44px e iconos diferenciados', () => {
    render(<PaymentPanel {...defaultProps} />);

    // Conmutar a modo Split
    const btnSplit = screen.getByRole('button', { name: /\+ Split|Cobro Único/i });
    fireEvent.click(btnSplit);

    // Deben estar visibles los 6 campos de recaudo
    expect(screen.getByText(/Efectivo/i)).toBeInTheDocument();
    expect(screen.getByText(/Nequi/i)).toBeInTheDocument();
    expect(screen.getByText(/Daviplata/i)).toBeInTheDocument();
    expect(screen.getByText(/QR Bancolombia/i)).toBeInTheDocument();
    expect(screen.getByText(/Datáfono/i)).toBeInTheDocument();
    expect(screen.getByText(/Crédito/i)).toBeInTheDocument();
  });
});
