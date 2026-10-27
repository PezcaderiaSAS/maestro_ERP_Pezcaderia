import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { B2BExternalSalesView } from '../views/b2b/B2BExternalSalesView';
import { ColdStorageRentalView } from '../views/coldStorageRental/ColdStorageRentalView';

// Mock servicios
vi.mock('../services/coldStorageRentalService', () => ({
  DEFAULT_EMPRESA_ID: 'emp-1',
  coldStorageRentalService: {
    getCuartosFrios: vi.fn().mockResolvedValue([]),
    getClientesCustodia: vi.fn().mockResolvedValue([]),
    getProductosCustodia: vi.fn().mockResolvedValue([]),
    getContratos: vi.fn().mockResolvedValue([]),
    getInventario: vi.fn().mockResolvedValue([]),
    getInventarioCustodia: vi.fn().mockResolvedValue([]),
    getMovimientos: vi.fn().mockResolvedValue([]),
    getCausaciones: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/coldStoragePdfService', () => ({
  coldStoragePdfService: {
    imprimirActaRecepcion: vi.fn(),
    imprimirActaDespacho: vi.fn(),
  },
}));

vi.mock('../services/cashService', () => ({
  cashService: {
    getTurnos: vi.fn().mockReturnValue([]),
    getTurnoActivoPorCajero: vi.fn().mockReturnValue(null),
    registrarMovimiento: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Orphan Modules Dark Glassmorphism V8 Migration (TASK-038-07)', () => {
  describe('B2BExternalSalesView', () => {
    it('debe tener contenedor principal con fondo oscuro Dark Glassmorphism V8 (#070A10) y no bg-slate-100', () => {
      const { container } = render(<B2BExternalSalesView />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toBeInTheDocument();
      expect(root.className).toMatch(/bg-\[#070A10\]|bg-slate-950/);
      expect(root.className).not.toContain('bg-slate-100');
    });

    it('la barra superior de la terminal debe usar Dark Glassmorphism (bg-slate-900/60, border-white/10, text-white)', () => {
      render(<B2BExternalSalesView vendedorNombre="Carlos Test" />);
      const title = screen.getByText('Terminal Venta Externa B2B');
      const headerCard = title.closest('div.rounded-2xl, div.rounded-3xl');
      expect(headerCard).toBeInTheDocument();
      expect(headerCard?.className).toMatch(/bg-slate-900|bg-slate-950/);
      expect(headerCard?.className).not.toContain('bg-white');
      expect(headerCard?.className).toMatch(/border-white\/10|border-white\/12/);
    });

    it('los botones del stepper deben usar superficies oscuras y no fondo blanco plano', () => {
      render(<B2BExternalSalesView />);
      const step1Btn = screen.getByTestId('b2b-stepper-step-1');
      expect(step1Btn).toBeInTheDocument();
      expect(step1Btn.className).not.toContain('bg-white');
      expect(step1Btn.className).toMatch(/bg-slate-900|bg-slate-950|bg-cyan/);
    });
  });

  describe('ColdStorageRentalView', () => {
    it('debe tener contenedor principal con fondo oscuro Dark Glassmorphism V8 (#070A10) y no bg-slate-50', () => {
      const { container } = render(<ColdStorageRentalView />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toBeInTheDocument();
      expect(root.className).toMatch(/bg-\[#070A10\]|bg-slate-950/);
      expect(root.className).not.toContain('bg-slate-50');
    });

    it('el encabezado principal debe usar Dark Glassmorphism y no bg-white', () => {
      render(<ColdStorageRentalView />);
      const title = screen.getByText(/Alquiler de Cuarto Frío & Custodia 3PL/i);
      const headerCard = title.closest('div.rounded-2xl, div.rounded-3xl');
      expect(headerCard).toBeInTheDocument();
      expect(headerCard?.className).toMatch(/bg-slate-900|bg-slate-950/);
      expect(headerCard?.className).not.toContain('bg-white');
      expect(headerCard?.className).toMatch(/border-white\/10|border-white\/12/);
    });

    it('las tarjetas de métricas y cuartos fríos en la pestaña de operaciones deben usar Dark Glassmorphism', () => {
      render(<ColdStorageRentalView />);
      const metricLabel = screen.getByText(/Capacidad Total/i);
      const metricCard = metricLabel.closest('div.rounded-2xl');
      expect(metricCard).toBeInTheDocument();
      expect(metricCard?.className).toMatch(/bg-slate-900|bg-slate-950/);
      expect(metricCard?.className).not.toContain('bg-white');
      expect(metricCard?.className).toMatch(/border-white\/10/);

      const coldRoomsTitle = screen.getByText(/Estado y Ocupación de Cuartos Fríos/i);
      const coldRoomsContainer = coldRoomsTitle.closest('div.rounded-2xl');
      expect(coldRoomsContainer).toBeInTheDocument();
      expect(coldRoomsContainer?.className).toMatch(/bg-slate-900|bg-slate-950/);
      expect(coldRoomsContainer?.className).not.toContain('bg-white');
    });
  });
});
