import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import { CartPanel } from '../views/pos/components/CartPanel';
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

describe('TASK-042-01: Ergonomía de Contenedor, Aislamiento Flexbox y Dark Glassmorphism V8 en CartPanel', () => {
  const dummyLineas: LineaVenta[] = [
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

  const defaultCartProps = {
    lineas: dummyLineas,
    cliente: { id: 'c1', identificacion: '901475457', nombre: 'CONSTRUCTORA BOLIVAR S.A.', tipoPrecio: 'DETAL' } as any,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totales: { subtotal: 36000, descuento: 0, totalFinal: 36000 },
    drafts: [],
    activeDraftId: null,
    stock: { 'bodega-1': { 'MOJ-01': 50 } },
    bodegaActivaId: 'bodega-1',
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

  it('1. El contenedor raíz pos-cart-panel debe tener overflow-hidden y NO overflow-y-auto para evitar solapamientos', () => {
    render(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);

    const panel = screen.getByTestId('cart-glass-panel');
    expect(panel).toBeInTheDocument();
    expect(panel.className).toContain('overflow-hidden');
    expect(panel.className).not.toContain('overflow-y-auto');
  });

  it('2. El pie pos-cart-footer NO debe tener clase sticky ni bottom-0, asegurando anclaje con shrink-0 mt-auto', () => {
    const { container } = render(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);

    const footer = container.querySelector('.pos-cart-footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).not.toContain('sticky');
    expect(footer?.className).not.toContain('bottom-0');
    expect(footer?.className).toContain('shrink-0');
    expect(footer?.className).toContain('mt-auto');
  });

  it('3. La cabecera pos-cart-header debe implementar tokens Dark Glassmorphism V8 sin fondo claro bg-slate-50', () => {
    const { container } = render(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);

    const header = container.querySelector('.pos-cart-header');
    expect(header).toBeInTheDocument();
    expect(header?.className).not.toContain('bg-slate-50');
    expect(header?.className).toContain('bg-slate-900');
  });

  it('4. En modo Mostrador, al pulsar EMITIR PREVENTA (F6) debe desplegarse el modal de confirmación de comanda', () => {
    render(<CartPanel {...defaultCartProps} isAsesorMostrador={true} />);

    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeInTheDocument();

    fireEvent.click(btnEmitir);

    // Debe mostrarse el modal de confirmación de comanda
    const modal = screen.getByTestId('modal-confirmar-comanda');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Confirmar Emisión de Preventa/i)).toBeInTheDocument();
    expect(screen.getByText(/CONSTRUCTORA BOLIVAR S.A./i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$36\.000/i).length).toBeGreaterThan(0);
  });
});
