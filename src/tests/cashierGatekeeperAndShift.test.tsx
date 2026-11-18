// src/tests/cashierGatekeeperAndShift.test.tsx
// Pruebas unitarias e integración para Gatekeeper de Turno de Caja y Roles (SPEC-065)

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AperturaCajaModal } from '../views/pos/components/AperturaCajaModal';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import { useCashStore } from '../store/useCashStore';
import { useAuthStore } from '../store/useAuthStore';
import { cashService } from '../services/cashService';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('TASK-065-04 & 05: Cashier Shift Gatekeeper & Role Separation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCashStore.setState({
      turnoActivo: null,
      cajas: [
        { id: 'caja-1', bodegaId: 'b1', nombre: 'Caja Mostrador 1', tipo: 'MENOR', activa: true },
      ],
    });
    useAuthStore.setState({
      activeTenant: {
        id: 'tenant-01',
        razonSocial: 'La Pezcadería S.A.S.',
        nit: '901.246.730',
        ciudad: 'Bucaramanga',
        telefono: '3101234567',
        activo: true,
        createdAt: '2026-11-18T00:00:00Z',
      },
      currentUser: {
        id: 'usr-cajero-01',
        nombre: 'Cajero Principal',
        rol: 'cajero',
        tenantId: 'tenant-01',
      } as any,
    });
  });

  describe('AperturaCajaModal Component', () => {
    it('renderiza correctamente el modal de apertura con selección de caja y base inicial', () => {
      render(
        <AperturaCajaModal
          userRole="cajero"
          bodegaActiva="Bodega Principal"
          onSuccess={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Apertura de Turno')).toBeInTheDocument();
      expect(screen.getByText('Monto Base Inicial')).toBeInTheDocument();
      expect(screen.getByTestId('input-base-directa')).toBeInTheDocument();
    });

    it('abre el turno y actualiza useCashStore reactivamente al confirmar', async () => {
      const handleSuccess = vi.fn();
      const spyAbrirTurno = vi.spyOn(cashService, 'abrirTurno');

      render(
        <AperturaCajaModal
          userRole="cajero"
          bodegaActiva="Bodega Principal"
          onSuccess={handleSuccess}
          onCancel={vi.fn()}
        />
      );

      // Digitar base inicial $100.000
      const input = screen.getByTestId('input-base-directa');
      fireEvent.change(input, { target: { value: '100000' } });

      const btnConfirmar = screen.getByTestId('btn-abrir-caja');
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(spyAbrirTurno).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          100000,
          undefined,
          expect.any(String)
        );
        expect(handleSuccess).toHaveBeenCalledTimes(1);
        expect(useCashStore.getState().turnoActivo?.estado).toBe('ABIERTO');
      });
    });
  });

  describe('POSMultivendorCart Role Separation & Actions', () => {
    const mockItems: any[] = [
      {
        id: 'line-1',
        product: {
          id: 'p1',
          sku: 'SKU-01',
          nombre: 'Filete de Salmón',
          precio_venta_pos: 50000,
          precio_compra: 30000,
          unidadMedida: 'kg',
          categoria: 'Pescados',
          activo: true,
          buffer_seguridad: 0,
          precio_venta_restaurante: 45000,
          precio_venta_mayorista: 40000,
        },
        cantidad: 2,
        precioOverride: 50000,
        descuentoPct: 0,
      },
    ];

    it('para vendedor (sin onCobrarCaja): solo muestra botón EMITIR COMANDA (F6) y oculta Cobrar en Terminal', () => {
      render(
        <POSMultivendorCart
          items={mockItems}
          onUpdateQuantity={vi.fn()}
          onSetQuantity={vi.fn()}
          onUpdatePrice={vi.fn()}
          onUpdateDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={100000}
          descuento={0}
          total={100000}
          descuentoGlobalTipo="porcentaje"
          descuentoGlobalValor={0}
          onApplyGlobalDiscount={vi.fn()}
          onRemoveGlobalDiscount={vi.fn()}
          onEmitirComanda={vi.fn()}
          onCobrarCaja={undefined} // Vendedor puro
        />
      );

      expect(screen.getByTestId('btn-emitir-preventa-f6')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-cobrar')).toBeNull();
    });

    it('para cajero (con onCobrarCaja): muestra tanto EMITIR COMANDA como Cobrar en Esta Terminal', () => {
      const handleCobrar = vi.fn();

      render(
        <POSMultivendorCart
          items={mockItems}
          onUpdateQuantity={vi.fn()}
          onSetQuantity={vi.fn()}
          onUpdatePrice={vi.fn()}
          onUpdateDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={100000}
          descuento={0}
          total={100000}
          descuentoGlobalTipo="porcentaje"
          descuentoGlobalValor={0}
          onApplyGlobalDiscount={vi.fn()}
          onRemoveGlobalDiscount={vi.fn()}
          onEmitirComanda={vi.fn()}
          onCobrarCaja={handleCobrar} // Cajero activo
        />
      );

      expect(screen.getByTestId('btn-emitir-preventa-f6')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cobrar')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('btn-cobrar'));
      expect(handleCobrar).toHaveBeenCalledTimes(1);
    });
  });
});
