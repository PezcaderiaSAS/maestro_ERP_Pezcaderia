import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickPaymentMixedModal } from '../views/pos/components/QuickPaymentMixedModal';
import { MixedPaymentSchema } from '../schemas/mixedPayment.schema';
import type { Prefactura } from '../types/prefactura.types';

describe('TASK-043-05: Modal Profesional de Recaudo Mixto en Taquilla de Caja Única', () => {
  const dummyPrefactura: Prefactura = {
    id: 'pref-2026-01000',
    tenantId: 'tenant-03',
    codigoPreventa: 'PRE-2026-01000',
    terminalId: 'term-mostrador-01',
    vendedorId: 'user-01',
    vendedorNombre: 'Carlos Mostrador',
    clienteDocumento: '901475457',
    clienteNombre: 'CONSTRUCTORA BOLIVAR S.A.',
    hardHoldActivo: true,
    items: [
      {
        productoId: 'prod-101',
        sku: 'VAR-58',
        nombre: 'PARARRAYO / VARILLA COBRE 5/8',
        cantidad: 2,
        precioLista: 45000,
        precioFinal: 45000,
        descuentoPct: 0,
        subtotal: 90000,
      },
      {
        productoId: 'prod-102',
        sku: 'TUB-PVC',
        nombre: 'TUBO PVC AGUAS NEGRAS 3 PULGADAS',
        cantidad: 2,
        precioLista: 45000,
        precioFinal: 45000,
        descuentoPct: 0,
        subtotal: 90000,
      },
    ],
    subtotal: 180000,
    descuentoTotal: 0,
    total: 180000,
    estado: 'PENDIENTE_COBRO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    isOpen: true,
    preventa: dummyPrefactura,
    onClose: vi.fn(),
    onConfirmarPago: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Validación Zod de Recaudo Mixto (MixedPaymentSchema)', () => {
    it('Debe validar exitosamente un pago simple en efectivo', () => {
      const payload = {
        preventaId: 'pref-2026-01000',
        codigoPreventa: 'PRE-2026-01000',
        totalVenta: 180000,
        clienteNombre: 'CONSTRUCTORA BOLIVAR S.A.',
        pagos: [
          {
            metodo: 'EFECTIVO' as const,
            monto: 180000,
            efectivoRecibido: 200000,
            vueltas: 20000,
          },
        ],
      };

      const result = MixedPaymentSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('Debe validar exitosamente un pago dividido / mixto (Efectivo + Transferencia)', () => {
      const payload = {
        preventaId: 'pref-2026-01000',
        codigoPreventa: 'PRE-2026-01000',
        totalVenta: 180000,
        clienteNombre: 'CONSTRUCTORA BOLIVAR S.A.',
        pagos: [
          {
            metodo: 'TRANSFERENCIA' as const,
            monto: 100000,
            referencia: 'NEQUI-8829',
          },
          {
            metodo: 'EFECTIVO' as const,
            monto: 80000,
            efectivoRecibido: 100000,
            vueltas: 20000,
          },
        ],
      };

      const result = MixedPaymentSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('Debe rechazar si la suma de pagos no coincide con el total de venta', () => {
      const payload = {
        preventaId: 'pref-2026-01000',
        codigoPreventa: 'PRE-2026-01000',
        totalVenta: 180000,
        clienteNombre: 'CONSTRUCTORA BOLIVAR S.A.',
        pagos: [
          {
            metodo: 'EFECTIVO' as const,
            monto: 150000,
          },
        ],
      };

      const result = MixedPaymentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('coincidir exactamente');
      }
    });
  });

  describe('2. Interfaz y Componente QuickPaymentMixedModal', () => {
    it('Debe renderizar la cabecera, código PRE-2026-01000, Total a Recaudar $180.000 y Cliente', () => {
      render(<QuickPaymentMixedModal {...defaultProps} />);

      expect(screen.getByText(/Cobro en Ventanilla/i)).toBeInTheDocument();
      expect(screen.getByText(/PRE-2026-01000/i)).toBeInTheDocument();
      expect(screen.getAllByText(/\$180\.000/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/CONSTRUCTORA BOLIVAR S.A./i)).toBeInTheDocument();

      // Botones principales visibles
      expect(screen.getByRole('button', { name: /^EFECTIVO$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^DATAFONO$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^TRANSFERENCIA$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirmar Cobro \(F9\)/i })).toBeInTheDocument();
    });

    it('En modo EFECTIVO debe permitir ingresar valor recibido y mostrar vueltas reactivas', () => {
      render(<QuickPaymentMixedModal {...defaultProps} />);

      const inputRecibido = screen.getByTestId('input-efectivo-recibido');
      expect(inputRecibido).toBeInTheDocument();

      // Simular entrega de $200.000 en efectivo
      fireEvent.change(inputRecibido, { target: { value: '200000' } });

      // Debe calcular y mostrar vueltas de $20.000
      expect(screen.getByTestId('badge-cambio-ventanilla')).toHaveTextContent('$20.000');
    });

    it('Debe permitir conmutar a pago MIXTO, agregando partes con saldo por cubrir automático', () => {
      render(<QuickPaymentMixedModal {...defaultProps} />);

      const btnMixto = screen.getByRole('button', { name: /MIXTO/i });
      fireEvent.click(btnMixto);

      expect(screen.getByText(/Pago Dividido \/ Mixto/i)).toBeInTheDocument();
      expect(screen.getByText(/Saldo por Cubrir/i)).toBeInTheDocument();
    });

    it('Al hacer clic en Confirmar Cobro (F9), invoca onConfirmarPago con el payload estructurado', () => {
      render(<QuickPaymentMixedModal {...defaultProps} />);

      const inputRecibido = screen.getByTestId('input-efectivo-recibido');
      fireEvent.change(inputRecibido, { target: { value: '180000' } });

      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Cobro \(F9\)/i });
      fireEvent.click(btnConfirmar);

      expect(defaultProps.onConfirmarPago).toHaveBeenCalledTimes(1);
      const payload = defaultProps.onConfirmarPago.mock.calls[0][0];
      expect(payload.preventaId).toBe('pref-2026-01000');
      expect(payload.totalVenta).toBe(180000);
      expect(payload.pagos[0].metodo).toBe('EFECTIVO');
      expect(payload.pagos[0].monto).toBe(180000);
    });

    it('Permite inspección y ajuste libre de precio o cantidad de ítems en taquilla recalculando el total', () => {
      render(<QuickPaymentMixedModal {...defaultProps} />);

      // Botón para expandir ítems de preventa
      const btnVerItems = screen.getByTestId('btn-toggle-items-preventa');
      fireEvent.click(btnVerItems);

      // Input de precio del primer ítem
      const inputPrecio = screen.getByTestId('input-item-precio-prod-101');
      expect(inputPrecio).toBeInTheDocument();

      // Cambiar precio de $45.000 a $40.000
      fireEvent.change(inputPrecio, { target: { value: '40000' } });

      // Nuevo total: (2 * 40000) + (2 * 45000) = 80000 + 90000 = $170.000
      expect(screen.getAllByText(/\$170\.000/i).length).toBeGreaterThan(0);
    });
  });
});
