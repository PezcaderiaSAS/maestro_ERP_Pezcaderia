// src/tests/posElectronicInvoicingFlow.test.tsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useResolucionStore } from '../store/useResolucionStore';
import { resolucionService } from '../services/resolucionService';
import { PosElectronicInvoiceToggle } from '../views/pos/components/PosElectronicInvoiceToggle';
import { QuickConvertToElectronicInvoiceModal } from '../views/pos/components/QuickConvertToElectronicInvoiceModal';

describe('SPEC-020: Flujo Integral de Facturación Electrónica DIAN y Consecutivo Dual', () => {
  beforeEach(() => {
    useResolucionStore.getState().resetStore();
    vi.clearAllMocks();
  });

  it('1. El toggle de Facturación Electrónica debe tener tamaño ergonómico >= 48px y mostrar el próximo consecutivo', () => {
    const handleChangeMock = vi.fn();

    render(
      <PosElectronicInvoiceToggle
        checked={false}
        onChange={handleChangeMock}
        cliente={{ id: 'c1', nombre: 'Cliente Mostrador' }}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /alternar facturación electrónica/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn.className).toContain('min-h-[48px]');

    // Debe mostrar la tirilla de control interno y el consecutivo VTA-101
    expect(screen.getByText(/Tirilla Control Interno/i)).toBeInTheDocument();
    expect(screen.getByText('VTA-101')).toBeInTheDocument();

    // Simular clic para encender
    fireEvent.click(toggleBtn);
    expect(handleChangeMock).toHaveBeenCalledWith(true);
  });

  it('2. Al estar encendido el toggle, debe mostrar la resolución fiscal FEVP-1541', () => {
    render(
      <PosElectronicInvoiceToggle
        checked={true}
        onChange={() => {}}
        cliente={{ id: 'c1', nombre: 'Restaurante El Faro', identificacion: '900999888', email: 'faro@test.com' }}
      />
    );

    expect(screen.getByText(/Factura Electrónica DIAN/i)).toBeInTheDocument();
    expect(screen.getByText('FEVP-1541')).toBeInTheDocument();
  });

  it('3. Post-Facturación: Debe convertir un ticket interno previo en Factura Electrónica sin duplicidad', () => {
    const mockVentaInterna = {
      id: 'venta-101',
      consecutivoInterno: 'VTA-101',
      fecha: '2026-10-15T10:00:00.000Z',
      subtotal: 250000,
      totalFinal: 250000,
      cliente: {
        identificacion: '222222222222',
        nombre: 'Consumidor Final',
      },
    };

    const handleSuccessMock = vi.fn();
    const handleCloseMock = vi.fn();

    render(
      <QuickConvertToElectronicInvoiceModal
        isOpen={true}
        onClose={handleCloseMock}
        venta={mockVentaInterna}
        onSuccess={handleSuccessMock}
      />
    );

    // Debe mostrar la cabecera
    expect(screen.getByText(/Post-Facturación Electrónica DIAN/i)).toBeInTheDocument();

    // Completar datos del cliente requeridos por la DIAN
    const inputNit = screen.getByPlaceholderText(/900123456/i);
    const inputNombre = screen.getByPlaceholderText(/Restaurante El Marino/i);
    const inputEmail = screen.getByPlaceholderText(/contabilidad@cliente.com/i);

    fireEvent.change(inputNit, { target: { value: '901234567-8' } });
    fireEvent.change(inputNombre, { target: { value: 'Restaurante Mar y Sol' } });
    fireEvent.change(inputEmail, { target: { value: 'marysol@pescados.com' } });

    // Botón de emisión debe medir >= 56px (Regla del Niño de 12 Años)
    const btnEmitir = screen.getByRole('button', { name: /emitir factura electrónica/i });
    expect(btnEmitir.className).toContain('min-h-[56px]');

    fireEvent.click(btnEmitir);

    // Debe invocar callbacks y guardar en store
    expect(handleSuccessMock).toHaveBeenCalled();
    expect(handleCloseMock).toHaveBeenCalled();

    // Comprobar que en el store se creó la factura FEVP-1541
    const facturas = useResolucionStore.getState().facturasElectronicas;
    expect(facturas.length).toBe(1);
    expect(facturas[0].consecutivoCompleto).toBe('FEVP-1541');
    expect(facturas[0].clienteNit).toBe('901234567-8');

    // Comprobar que se encoló para Siigo
    const cola = useResolucionStore.getState().colaSiigo;
    expect(cola.length).toBe(1);
    expect(cola[0].consecutivoCompleto).toBe('FEVP-1541');
    expect(cola[0].estado).toBe('PENDIENTE');
  });
});
