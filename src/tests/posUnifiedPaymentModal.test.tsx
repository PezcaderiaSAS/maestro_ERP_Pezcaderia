import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedPaymentModal } from '../views/pos/components/payment/UnifiedPaymentModal';
import type { ClientePOS } from '../hooks/usePOSCart';
import type { UnifiedPaymentPayload } from '../views/pos/components/payment/payment.types';

// Mock SweetAlert2 to avoid modal collisions in headless testing
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('SPEC-060: UnifiedPaymentModal Component & Hook TDD Suite', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirmPayment = vi.fn();

  const sampleCliente: ClientePOS = {
    id: 'cli-001',
    nombre: 'Restaurante El Puerto',
    identificacion: '900123456-7',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 500000,
    activo: true,
    email: 'puerto@restaurantes.com',
    telefono: '3001234567',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. No debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <UnifiedPaymentModal
        isOpen={false}
        totalPagar={45000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. Debe renderizar el modal con el total a pagar y datos del cliente cuando isOpen es true', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={45000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    expect(screen.getByTestId('unified-payment-modal')).toBeInTheDocument();
    expect(screen.getByText(/Restaurante El Puerto/i)).toBeInTheDocument();
    // Debe mostrar $45.000 como total a pagar
    expect(screen.getAllByText(/\$?\s*45\.000/i).length).toBeGreaterThan(0);
  });

  it('3. Debe seleccionar por defecto el método Efectivo y mostrar billetes sugeridos', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={35000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    // Billetes sugeridos para $35.000: Exacto ($35.000), $50.000, $100.000
    expect(screen.getByRole('button', { name: /exacto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\$?\s*50\.000/i })).toBeInTheDocument();
  });

  it('4. Debe calcular el cambio reactivamente al pulsar un billete rápido en Efectivo', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={35000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const btn50k = screen.getByRole('button', { name: /\$?\s*50\.000/i });
    fireEvent.click(btn50k);

    // Cambio esperado: $50.000 - $35.000 = $15.000
    expect(screen.getByTestId('display-vuelto')).toHaveTextContent(/15\.000/);
  });

  it('5. Debe alternar de método al hacer clic en las pestañas (Datáfono, Transferencia, Crédito, Mixto)', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={50000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const tabDatafono = screen.getByRole('tab', { name: /dat[aá]fono/i });
    fireEvent.click(tabDatafono);

    expect(screen.getByTestId('section-datafono')).toBeInTheDocument();
  });

  it('6. Debe validar el cupo de crédito del cliente en la pestaña Crédito', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={600000} // Excede el cupo de $500.000
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const tabCredito = screen.getByRole('tab', { name: /cr[eé]dito/i });
    fireEvent.click(tabCredito);

    expect(screen.getByText(/cupo insuficiente|excede cupo/i)).toBeInTheDocument();
    // El botón de confirmar debe estar deshabilitado
    const btnConfirmar = screen.getByTestId('btn-confirmar-pago');
    expect(btnConfirmar).toBeDisabled();
  });

  it('7. Debe permitir cobro mixto distribuyendo métodos y validando saldo $0', async () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={50000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const tabMixto = screen.getByRole('tab', { name: /mixto/i });
    fireEvent.click(tabMixto);

    expect(screen.getByTestId('section-split-payment')).toBeInTheDocument();

    // Agregar línea de pago fraccionado
    const inputLinea1 = screen.getByTestId('split-amount-0');
    fireEvent.change(inputLinea1, { target: { value: '30000' } });

    // Saldo restante debe ser $20.000
    expect(screen.getByTestId('split-remaining-balance')).toHaveTextContent(/20\.000/);

    const btnAddLine = screen.getByRole('button', { name: /\+ agregar m[eé]todo/i });
    fireEvent.click(btnAddLine);

    // La segunda línea toma automáticamente el saldo de $20.000
    expect(screen.getByTestId('split-remaining-balance')).toHaveTextContent(/0/);

    // Confirmar pago mixto
    const btnConfirmar = screen.getByTestId('btn-confirmar-pago');
    expect(btnConfirmar).not.toBeDisabled();
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(mockOnConfirmPayment).toHaveBeenCalledTimes(1);
    });

    const payload: UnifiedPaymentPayload = mockOnConfirmPayment.mock.calls[0][0];
    expect(payload.montoTotal).toBe(50000);
    expect(payload.pagos.length).toBe(2);
  });

  it('8. Debe alternar la bandera de Factura Electrónica al pulsar el toggle', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={25000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const toggleDian = screen.getByTestId('toggle-factura-electronica');
    fireEvent.click(toggleDian);

    const btnExacto = screen.getByRole('button', { name: /exacto/i });
    fireEvent.click(btnExacto);

    const btnConfirmar = screen.getByTestId('btn-confirmar-pago');
    fireEvent.click(btnConfirmar);

    expect(mockOnConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        requiereFacturaElectronica: true,
      })
    );
  });

  it('9. Debe cerrar el modal al pulsar la tecla Escape o el botón de cerrar', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={25000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const btnClose = screen.getByLabelText(/cerrar modal/i);
    fireEvent.click(btnClose);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('10. Debe confirmar pago con la tecla Enter cuando el saldo esté completamente cubierto', () => {
    render(
      <UnifiedPaymentModal
        isOpen={true}
        totalPagar={20000}
        cliente={sampleCliente}
        onClose={mockOnClose}
        onConfirmPayment={mockOnConfirmPayment}
      />
    );

    const btnExacto = screen.getByRole('button', { name: /exacto/i });
    fireEvent.click(btnExacto);

    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
    expect(mockOnConfirmPayment).toHaveBeenCalledTimes(1);
  });
});

