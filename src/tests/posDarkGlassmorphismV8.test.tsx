import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { CartPanel } from '../views/pos/components/CartPanel';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import type { LineaVenta } from '../types/pos.types';

describe('SPEC-032 / TASK-032-01: Suite TDD Dark Glassmorphism V8 en Módulo POS', () => {
  const mockLineas: LineaVenta[] = [
    {
      productoId: 'prod-001',
      sku: 'SALM-01',
      nombre: 'Salmón Noruego Premium',
      cantidad: 1.5,
      unidad: 'KG',
      precioLista: 45000,
      descuentoPct: 0,
      precioFinal: 45000,
      totalLinea: 67500,
      precioCompra: 30000,
      esPesoManual: true,
    },
    {
      productoId: 'prod-002',
      sku: 'CAM-02',
      nombre: 'Camarón Tigre 16/20',
      cantidad: 2.0,
      unidad: 'KG',
      precioLista: 38000,
      descuentoPct: 0,
      precioFinal: 38000,
      totalLinea: 76000,
      precioCompra: 25000,
      esPesoManual: false,
    },
  ];

  const mockStock = {
    'bodega-central': {
      'SALM-01': 120,
      'CAM-02': 85,
    },
  };

  const defaultCartProps = {
    lineas: mockLineas,
    cliente: null,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totales: {
      subtotal: 143500,
      descuento: 0,
      totalFinal: 143500,
    },
    drafts: [],
    activeDraftId: null,
    stock: mockStock,
    bodegaActivaId: 'bodega-central',
    bodegaActivaNombre: 'Bodega Principal Frío',
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

  const defaultPaymentProps = {
    totalFinal: 143500,
    lineas: mockLineas,
    cliente: null,
    stock: mockStock,
    bodegaActivaId: 'bodega-central',
    bodegaActivaNombre: 'Bodega Principal Frío',
    onGuardarBorrador: vi.fn(),
    onPagar: vi.fn(),
    onLimpiarCarrito: vi.fn(),
    isDisabled: false,
    isTurnoAbierto: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. CartPanel debe renderizarse dentro de un contenedor GlassCard V8 con controles macOS', () => {
    render(<CartPanel {...defaultCartProps} />);

    // Verificar contenedor GlassCard con data-testid
    const cartContainer = screen.getByTestId('cart-glass-panel');
    expect(cartContainer).toBeDefined();

    // Debe contener las clases físicas de Glassmorphism V8
    const classList = cartContainer.className;
    expect(classList).toContain('bg-slate-900/85');
    expect(classList).toContain('backdrop-blur-2xl');
    expect(classList).toContain('border-white/12');

    // Debe mostrar los controles macOS de ventana
    expect(screen.getByTestId('mac-window-controls')).toBeDefined();
    expect(screen.getByTestId('mac-control-minimize')).toBeDefined();
  });

  it('2. El botón amarillo macOS (#FFBD2E) debe alternar el modo ultracompacto del carrito', () => {
    render(<CartPanel {...defaultCartProps} />);

    const btnYellow = screen.getByTestId('mac-control-minimize');
    const linesContainer = screen.getByTestId('cart-items-container');

    // Inicialmente visible en modo normal
    expect(linesContainer).toBeVisible();

    // Clic en control amarillo macOS -> alternar a modo compacto
    fireEvent.click(btnYellow);
    expect(linesContainer.className).toContain('hidden');

    // Segundo clic -> restaurar visibilidad
    fireEvent.click(btnYellow);
    expect(linesContainer.className).not.toContain('hidden');
  });

  it('3. PaymentPanel debe renderizarse en GlassCard V8 con cuadrantes táctiles y botón gigante >= 56px', () => {
    render(<PaymentPanel {...defaultPaymentProps} />);

    const paymentContainer = screen.getByTestId('payment-glass-panel');
    expect(paymentContainer).toBeDefined();

    // Botón cobrar con altura mínima de 56px
    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar).toBeDefined();
    const hasMin56 = btnCobrar.className.includes('min-h-[56px]') || btnCobrar.className.includes('h-14');
    expect(hasMin56).toBe(true);
  });

  it('4. Los chips de denominaciones de billetes COP deben tener altura táctil >= 48px y teclas keypad >= 56px', () => {
    render(<PaymentPanel {...defaultPaymentProps} />);

    // Billetes rápidos COP sugeridos
    const quickBills = screen.queryAllByTestId(/^btn-quick-bill-/);
    if (quickBills.length > 0) {
      quickBills.forEach((bill) => {
        const hasMin48 = bill.className.includes('min-h-[48px]') || bill.className.includes('h-12');
        expect(hasMin48).toBe(true);
      });
    }

    // Teclas del Keypad táctil numérico si se muestran
    const keypadKeys = screen.queryAllByTestId(/^keypad-key-/);
    if (keypadKeys.length > 0) {
      keypadKeys.forEach((key) => {
        const hasMin56 = key.className.includes('min-h-[56px]') || key.className.includes('h-14');
        expect(hasMin56).toBe(true);
      });
    }
  });

  it('5. El total general a pagar debe desplegarse en tipografía monoespaciada en Verde Esmeralda', () => {
    render(<PaymentPanel {...defaultPaymentProps} />);

    const totalDisplay = screen.getByTestId('pos-total-display');
    expect(totalDisplay).toBeDefined();
    expect(totalDisplay.className).toContain('text-emerald-400');
    expect(totalDisplay.className).toContain('font-mono');
  });

  it('6. POSView.tsx debe envolver su shell principal en data-testid="pos-glass-container" con aceleración GPU', () => {
    const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
    const content = fs.readFileSync(posViewPath, 'utf-8');

    expect(content).toContain('data-testid="pos-glass-container"');
    expect(content).toContain("style={{ transform: 'translateZ(0)' }}");
  });

  it('7. Las 4 tarjetas de KPI de turno deben implementar la estética Dark Glassmorphism V8', () => {
    const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
    const content = fs.readFileSync(posViewPath, 'utf-8');

    expect(content).toContain('data-testid="pos-kpi-bar"');
    expect(content).toMatch(/bg-slate-900\/85 backdrop-blur-2xl border border-white\/12 rounded-(xl|2xl)/);
    expect(content).toContain("boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)'");
  });

  it('8. El panel de catálogo de mostrador en POSView.tsx debe estar encapsulado en un GlassCard con data-testid="pos-catalog-glass-card"', () => {
    const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
    const content = fs.readFileSync(posViewPath, 'utf-8');

    expect(content).toContain('data-testid="pos-catalog-glass-card"');
    expect(content).toContain('<GlassCard');
  });
});
