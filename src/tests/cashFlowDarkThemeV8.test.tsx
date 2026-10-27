import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CashFlowView from '../views/cash/CashFlowView';
import { cashService } from '../services/cashService';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

// Mock de tiendas
vi.mock('../store/useWarehouseStore', () => ({
  useWarehouseStore: () => ({
    bodegas: [
      { id: 'bodega-1', nombre: 'Bodega Principal', activa: true },
      { id: 'bodega-2', nombre: 'Bodega Norte', activa: true },
    ],
    getPrimaryBodega: () => ({ id: 'bodega-1', nombre: 'Bodega Principal' }),
  }),
}));

vi.mock('../store/useCashStore', () => ({
  useCashStore: () => ({
    isLoading: false,
  }),
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    userRole: 'ADMIN',
  }),
}));

describe('CashFlowView Dark Glassmorphism V8 (TASK-038-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(cashService, 'getCajas').mockReturnValue([
      { id: 'CAJA-1', bodegaId: 'Bodega Principal', nombre: 'Caja POS Principal', tipo: 'MENOR', activa: true },
    ]);
  });

  it('debe tener contenedor principal con fondo oscuro Dark Glassmorphism V8 y no bg-slate-50', () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
    const { container } = render(<CashFlowView />);

    const rootContainer = container.firstElementChild as HTMLElement;
    expect(rootContainer).toBeInTheDocument();
    // Debe tener fondo oscuro V8
    expect(rootContainer.className).toMatch(/bg-\[#070A10\]|bg-slate-950/);
    expect(rootContainer.className).not.toContain('bg-slate-50');
  });

  it('los selectores de bodega y caja deben usar tema oscuro y bordes semitransparentes', () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
    render(<CashFlowView />);

    const selectBodega = screen.getByDisplayValue('Bodega Principal');
    expect(selectBodega.className).toMatch(/bg-slate-900|bg-slate-950/);
    expect(selectBodega.className).toMatch(/border-white\/10|border-white\/12|border-slate-800/);
    expect(selectBodega.className).toMatch(/text-slate-100|text-slate-200/);
  });

  it('cuando no hay turno activo, la tarjeta de caja cerrada debe usar Glassmorphism oscuro', () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
    render(<CashFlowView />);

    const titleCerrada = screen.getByText('La caja está cerrada');
    const cardContainer = titleCerrada.closest('div.rounded-2xl, div.rounded-3xl');
    expect(cardContainer).toBeInTheDocument();
    expect(cardContainer?.className).toMatch(/bg-slate-900|bg-slate-950/);
    expect(cardContainer?.className).not.toContain('bg-white');
    expect(cardContainer?.className).toMatch(/border-white\/10|border-white\/12|border-slate-800/);
  });

  it('cuando hay turno activo, los paneles de balance y tabla deben usar Dark Glassmorphism V8', () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue({
      id: 'turno-123',
      cajaId: 'CAJA-1',
      branch_id: 'bodega-1',
      cajeroId: 'ADMIN',
      fechaApertura: new Date().toISOString(),
      fechaCierre: null,
      baseInicial: 100000,
      totalEfectivo: 250000,
      totalDatafono: 80000,
      totalTransferencias: 50000,
      saldoTeoricoGlobal: 480000,
      saldoFisicoEfectivo: null,
      diferenciaEfectivo: null,
      estado: 'ABIERTO',
      justificacion: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'ADMIN',
    });
    vi.spyOn(cashService, 'getMovimientos').mockReturnValue([]);

    render(<CashFlowView />);

    expect(screen.getByText('Saldo Teórico Global')).toBeInTheDocument();
    expect(screen.getByText('Movimientos de Hoy')).toBeInTheDocument();

    const movimientosTitle = screen.getByText('Movimientos de Hoy');
    const rightPanel = movimientosTitle.closest('.rounded-2xl, .rounded-3xl');
    expect(rightPanel?.className).toMatch(/bg-slate-900|bg-slate-950/);
    expect(rightPanel?.className).not.toContain('bg-white');
    expect(rightPanel?.className).toMatch(/border-white\/10|border-white\/12|border-slate-800/);
  });
});
