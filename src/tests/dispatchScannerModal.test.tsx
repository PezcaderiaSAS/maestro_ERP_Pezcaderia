import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DispatchScannerModal } from '../views/pos/components/DispatchScannerModal';
import { prefacturaService } from '../services/prefacturaService';
import { useAuthStore } from '../store/useAuthStore';

describe('TASK-037-06: DispatchScannerModal - Módulo de Despacho Físico Verificado', () => {
  const tenantId = 'ten-dispatch-test';
  const asesorId = 'usr-asesor-01';
  const asesorNombre = 'Carlos Asesor';

  beforeEach(() => {
    prefacturaService.limpiarEstadoPruebas();

    useAuthStore.setState({
      activeTenant: {
        id: tenantId,
        razonSocial: 'Ferretería Central S.A.S.',
        nit: '900.888.777-1',
        ciudad: 'Bogotá',
        telefono: '3101234567',
        regimenTributario: 'COMUN',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      currentUser: {
        id: asesorId,
        email: 'asesor@empresa.com',
        nombre: asesorNombre,
        authProvider: 'google',
        rol: 'vendedor',
      },
    });
  });

  it('1. Muestra en la bandeja reactiva las compras con estado PAGADA listas para entrega física', async () => {
    // 1. Emitir preventa
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: asesorId,
      vendedorNombre: asesorNombre,
      terminalId: 'TERM-01',
      clienteNombre: 'Aceros del Llano',
      items: [{ productoId: 'p1', nombre: 'Varilla 1/2 pulg x 6m', cantidad: 10, precioLista: 32000 }],
    });
    const prefId = emision.prefactura!.id;

    // 2. Simular pago en caja
    await prefacturaService.registrarCobroEnCaja({
      prefacturaId: prefId,
      tenantId,
      cajeroId: 'usr-cajero-01',
      turnoId: 'turno-01',
      montoTotal: emision.prefactura!.total,
      pagos: [{ metodoPago: 'EFECTIVO', monto: emision.prefactura!.total }],
    });

    render(
      <DispatchScannerModal
        isOpen={true}
        onClose={vi.fn()}
        tenantId={tenantId}
        asesorId={asesorId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Aceros del Llano')).toBeInTheDocument();
      expect(screen.getAllByText(/Listo para Entrega/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('2. Permite verificar y despachar una compra mediante escaneo de código QR / código de ticket', async () => {
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: asesorId,
      vendedorNombre: asesorNombre,
      terminalId: 'TERM-01',
      clienteNombre: 'Construcciones El Roble',
      items: [{ productoId: 'p2', nombre: 'Pintura Blanca Cuñete', cantidad: 1, precioLista: 180000 }],
    });
    const prefId = emision.prefactura!.id;
    const codigoTicket = emision.prefactura!.codigoPreventa;

    // Cobrar en caja
    await prefacturaService.registrarCobroEnCaja({
      prefacturaId: prefId,
      tenantId,
      cajeroId: 'usr-cajero-01',
      turnoId: 'turno-01',
      montoTotal: emision.prefactura!.total,
      pagos: [{ metodoPago: 'DATAFONO', monto: emision.prefactura!.total }],
    });

    const onCloseMock = vi.fn();

    render(
      <DispatchScannerModal
        isOpen={true}
        onClose={onCloseMock}
        tenantId={tenantId}
        asesorId={asesorId}
      />
    );

    // Ingresar código en el campo de escaneo
    const inputScanner = screen.getByTestId('input-qr-scanner');
    fireEvent.change(inputScanner, { target: { value: codigoTicket } });
    fireEvent.keyDown(inputScanner, { key: 'Enter', code: 'Enter' });

    // Debe seleccionar la orden y habilitar el botón de entrega
    await waitFor(() => {
      expect(screen.getAllByText('Construcciones El Roble').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('btn-confirmar-despacho')).toBeInTheDocument();
    });

    // Confirmar entrega física
    const btnDespachar = screen.getByTestId('btn-confirmar-despacho');
    fireEvent.click(btnDespachar);

    // Validar que el estado pasó a DESPACHADA
    await waitFor(() => {
      const prefActualizada = prefacturaService.buscarPorCodigo(tenantId, prefId);
      expect(prefActualizada?.estado).toBe('DESPACHADA');
      expect(prefActualizada?.despachadoPorId).toBe(asesorId);
      expect(prefActualizada?.hardHoldActivo).toBe(false);
    });
  });

  it('3. Permite despacho directo desde la bandeja táctil al seleccionar la tarjeta y presionar 1-clic', async () => {
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: asesorId,
      vendedorNombre: asesorNombre,
      terminalId: 'TERM-01',
      clienteNombre: 'Taller Mecánico El Chasis',
      items: [{ productoId: 'p3', nombre: 'Aceite Motor 20W50', cantidad: 4, precioLista: 28000 }],
    });
    const prefId = emision.prefactura!.id;

    // Cobrar en caja
    await prefacturaService.registrarCobroEnCaja({
      prefacturaId: prefId,
      tenantId,
      cajeroId: 'usr-cajero-01',
      turnoId: 'turno-01',
      montoTotal: emision.prefactura!.total,
      pagos: [{ metodoPago: 'TRANSFERENCIA', monto: emision.prefactura!.total }],
    });

    render(
      <DispatchScannerModal
        isOpen={true}
        onClose={vi.fn()}
        tenantId={tenantId}
        asesorId={asesorId}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Taller Mecánico El Chasis').length).toBeGreaterThanOrEqual(1);
    });

    // Clic en la tarjeta para seleccionarla
    const cardOrden = screen.getByTestId(`card-despacho-${prefId}`);
    fireEvent.click(cardOrden);

    // Clic en confirmar entrega
    const btnDespacho = screen.getByTestId('btn-confirmar-despacho');
    fireEvent.click(btnDespacho);

    await waitFor(() => {
      const prefActualizada = prefacturaService.buscarPorCodigo(tenantId, prefId);
      expect(prefActualizada?.estado).toBe('DESPACHADA');
    });
  });

  it('4. Rechaza despacho si la orden aún NO ha sido pagada en caja central', async () => {
    // Preventa emitida pero NO cobrada
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: asesorId,
      vendedorNombre: asesorNombre,
      terminalId: 'TERM-01',
      clienteNombre: 'Cliente Moroso',
      items: [{ productoId: 'p4', nombre: 'Tornillo 3/8', cantidad: 50, precioLista: 500 }],
    });
    const prefId = emision.prefactura!.id;

    render(
      <DispatchScannerModal
        isOpen={true}
        onClose={vi.fn()}
        tenantId={tenantId}
        asesorId={asesorId}
      />
    );

    // Intentar escanear el ticket no pagado
    const inputScanner = screen.getByTestId('input-qr-scanner');
    fireEvent.change(inputScanner, { target: { value: emision.prefactura!.codigoPreventa } });
    fireEvent.keyDown(inputScanner, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Pendiente de Pago en Caja/i)).toBeInTheDocument();
    });

    // El estado sigue siendo PENDIENTE_COBRO
    const prefActualizada = prefacturaService.buscarPorCodigo(tenantId, prefId);
    expect(prefActualizada?.estado).toBe('PENDIENTE_COBRO');
  });
});
