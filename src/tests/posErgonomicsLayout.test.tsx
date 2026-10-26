import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';
import fs from 'fs';
import path from 'path';

describe('TASK-029-01: Layout Shell Canónico Universal & Ergonomía POS (SPEC-029)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Ergonomía Táctil en PaymentPanel (Métodos >= 56px, Sub-pills >= 48px, 1-Tap >= 56px)', () => {
    const defaultProps = {
      totalFinal: 45000,
      lineas: [
        {
          productoId: 'p-1',
          sku: 'TIL-01',
          nombre: 'Filete de Tilapia',
          cantidad: 1.5,
          unidad: 'KG' as const,
          precioLista: 30000,
          precioUnitario: 30000,
          precioFinal: 30000,
          precioCompra: 18000,
          descuentoPct: 0,
          subtotal: 45000,
          iva: 0,
          total: 45000,
          totalLinea: 45000,
          esPesoManual: true,
        },
      ],
      cliente: null,
      stock: {},
      bodegaActivaId: 'b-1',
      bodegaActivaNombre: 'Cava Principal',
      onGuardarBorrador: vi.fn(),
      onPagar: vi.fn(),
      onLimpiarCarrito: vi.fn(),
      isDisabled: false,
      isTurnoAbierto: true,
      saldoEfectivoGaveta: 120000,
      topeMaximoGaveta: 1500000,
    };

    it('debe tener botones de categorías de pago con altura mínima de 56px (Regla táctil mostrador)', () => {
      render(<PaymentPanel {...defaultProps} />);

      const btnEfectivo = screen.getByTestId('btn-metodo-efectivo');
      expect(btnEfectivo.className).toContain('min-h-[56px]');

      const btnTransferencia = screen.getByTestId('btn-metodo-transferencia');
      expect(btnTransferencia.className).toContain('min-h-[56px]');

      const btnDatafono = screen.getByTestId('btn-metodo-datafono');
      expect(btnDatafono.className).toContain('min-h-[56px]');

      const btnCredito = screen.getByTestId('btn-metodo-credito');
      expect(btnCredito.className).toContain('min-h-[56px]');
    });

    it('debe tener sub-pills de transferencias (Nequi, Daviplata, Bancolombia) con altura mínima de 48px', () => {
      render(<PaymentPanel {...defaultProps} />);

      // Seleccionar transferencia para desplegar sub-pills
      const btnTransferencia = screen.getByTestId('btn-metodo-transferencia');
      fireEvent.click(btnTransferencia);

      const pillNequi = screen.getByTestId('pill-transferencia-nequi');
      expect(pillNequi.className).toContain('min-h-[48px]');

      const pillDaviplata = screen.getByTestId('pill-transferencia-daviplata');
      expect(pillDaviplata.className).toContain('min-h-[48px]');

      const pillQr = screen.getByTestId('pill-transferencia-qr_bancolombia');
      expect(pillQr.className).toContain('min-h-[48px]');
    });

    it('debe tener el botón de Cobro Rápido 1-Tap con altura mínima de 56px', () => {
      render(<PaymentPanel {...defaultProps} />);

      const btn1Tap = screen.getByTestId('btn-efectivo-exacto-directo');
      expect(btn1Tap.className).toContain('min-h-[56px]');
    });

    it('debe tener el botón de Cobrar final con altura mínima de 56px', () => {
      render(<PaymentPanel {...defaultProps} />);

      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar.className).toContain('min-h-[56px]');
    });
  });

  describe('2. Cero Imágenes en Catálogo POS (Zero-Cost Vector Graphics)', () => {
    it('debe renderizar el catálogo sin etiquetas <img>, usando ProductAvatar vectorOnly', () => {
      const mockProducts = [
        {
          id: 'prod-camaron',
          sku: 'CAM-01',
          nombre: 'Camarón Tití Limpio',
          categoria: 'Mariscos',
          precio: 45000,
          precioVentaPOS: 45000,
          unidadMedida: 'KG',
          imagen: 'https://images.unsplash.com/photo-test',
        },
      ];

      render(
        <ProductSearchPanel
          activeProducts={mockProducts}
          dynamicFields={[]}
          cliente={null}
          getProductPrice={() => 45000}
          getProductStock={() => 10}
          onAddProduct={() => {}}
        />
      );

      // Cero etiquetas <img> en el panel de productos
      const imgElements = document.querySelectorAll('img');
      expect(imgElements.length).toBe(0);

      // Debe existir el avatar vectorial renderizado por Lucide React
      expect(screen.getByTestId('product-avatar-vector')).toBeInTheDocument();
    });
  });

  describe('3. Type-Safety de Navegación y Ausencia de Magic Strings en POSView', () => {
    it('no debe contener magic strings de navegación ("precios", "dashboard") en POSView.tsx', () => {
      const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
      const content = fs.readFileSync(posViewPath, 'utf-8');

      // Prohibidos magic strings en setCurrentView
      expect(content).not.toMatch(/setCurrentView\(['"]precios['"]\)/);
      expect(content).not.toMatch(/setCurrentView\(['"]dashboard['"]\)/);

      // Debe usar AppRouteId
      expect(content).toContain('AppRouteId');
    });

    it('debe contar con el contenedor del Layout Shell Canónico con barra de control y dropdown', () => {
      const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
      const content = fs.readFileSync(posViewPath, 'utf-8');

      // Debe existir la barra de control con dropdown "Más Acciones"
      expect(content).toContain('pos-more-actions-dropdown');
      expect(content).toContain('pos-kpi-bar');
    });
  });
});
