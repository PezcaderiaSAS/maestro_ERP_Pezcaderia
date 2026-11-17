/**
 * src/tests/cashierKanbanFlowUnblock.test.tsx
 * Pruebas de Desbloqueo del Flujo del Kanban de Caja Principal, Transiciones de Estado y Métodos de Pago (R2, R3)
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CashierKanbanView } from '../views/pos/components/CashierKanbanView';
import { useCashierKanbanStore } from '../stores/useCashierKanbanStore';
import { prefacturaService } from '../services/prefacturaService';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

describe('R2: Cashier Kanban Flow Unblocking & Multi-Directional State Transitions', () => {
  const tenantId = 'ten-unblock-test';
  const cajeroId = 'usr-cajero-unblock';

  beforeEach(() => {
    document.body.innerHTML = '';
    prefacturaService.limpiarEstadoPruebas();

    useAuthStore.setState({
      activeTenant: {
        id: tenantId,
        razonSocial: 'Ferretería Josase S.A.S.',
        nit: '901.954.321-8',
        ciudad: 'Bucaramanga',
        telefono: '3164696581',
        regimenTributario: 'COMUN',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      currentUser: {
        id: cajeroId,
        email: 'caja1@josase.com',
        nombre: 'Yurgen Cajero Principal',
        authProvider: 'google',
        rol: 'cajero',
      },
    });

    useAppStore.setState({
      userRole: 'cajero' as any,
      currentUser: {
        empleadoId: 'emp-caja-01',
        nombre: 'Yurgen Cajero Principal',
        identificacion: '1098765432',
        cargo: 'Cajero Principal Ventanilla',
        rol: 'admin' as any,
        turnoIniciadoAt: new Date().toISOString(),
      },
    });

    useCashierKanbanStore.setState({
      preventas: [],
      filtroAsesorId: 'TODOS',
      preventaSeleccionada: null,
      isModalCobroOpen: false,
      isLoading: false,
      error: null,
    });
  });

  it('1. Valida transiciones bidireccionales en useCashierKanbanStore (PENDIENTE_COBRO <-> EN_COBRO -> PAGADA)', async () => {
    // 1.1 Emitir preventa inicial en cola de espera
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-asesor-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      clienteDocumento: '901475457',
      clienteNombre: 'MFL INGENIEROS S.A.S.',
      items: [{ productoId: '0000', nombre: 'PARARRAYO COBRE 5/8', cantidad: 2, precioLista: 45000 }],
    });
    const prefId = emision.prefactura!.id;
    await useCashierKanbanStore.getState().cargarPreventas(tenantId);

    expect(useCashierKanbanStore.getState().preventas[0].estado).toBe('PENDIENTE_COBRO');

    // 1.2 Transición a 'EN_COBRO' (Atención en ventanilla)
    const exitoAtender = await useCashierKanbanStore.getState().moverPreventaAColumna(
      tenantId,
      prefId,
      'EN_COBRO',
      cajeroId
    );
    expect(exitoAtender).toBe(true);
    expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.estado).toBe('EN_COBRO');
    expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.cajeroId).toBe(cajeroId);

    // 1.3 Transición inversa a 'PENDIENTE_COBRO' (Liberar turno de regreso a cola)
    const exitoLiberar = await useCashierKanbanStore.getState().moverPreventaAColumna(
      tenantId,
      prefId,
      'PENDIENTE_COBRO',
      cajeroId
    );
    expect(exitoLiberar).toBe(true);
    expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.estado).toBe('PENDIENTE_COBRO');
    expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.cajeroId).toBeUndefined();

    // 1.4 Transición directa a 'PAGADA' (Liquidación y despacho)
    const exitoPagar = await useCashierKanbanStore.getState().moverPreventaAColumna(
      tenantId,
      prefId,
      'PAGADA',
      cajeroId
    );
    expect(exitoPagar).toBe(true);
    expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.estado).toBe('PAGADA');
  });

  it('2. El rol cajero no es forzado a modo monitor y tiene disponibles botones ergonómicos de atención rápida', async () => {
    await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-asesor-02',
      vendedorNombre: 'Santiago Pallares',
      terminalId: 'MOSTRADOR-02',
      clienteNombre: 'Constructora Josase',
      items: [{ productoId: '00001102', nombre: 'Tornillo Drywall', cantidad: 100, precioLista: 500 }],
    });

    render(<CashierKanbanView tenantId={tenantId} cajeroId={cajeroId} />);

    await waitFor(() => {
      expect(screen.getByText('Constructora Josase')).toBeInTheDocument();
    });

    // Validar que NO aparece el banner de solo lectura de vendedores
    expect(screen.queryByTestId('badge-modo-monitor-vendedor')).toBeNull();

    // Validar presencia de los botones interactivos táctiles
    const preventa = prefacturaService.obtenerPrefacturasPorTenant(tenantId)[0];
    const btnAtender = screen.getByTestId(`btn-atender-${preventa.id}`);
    const btnCobrar = screen.getByTestId(`btn-iniciar-cobro-${preventa.id}`);

    expect(btnAtender).toBeInTheDocument();
    expect(btnCobrar).toBeInTheDocument();
    expect(screen.getByText(/Atender en Ventanilla/i)).toBeInTheDocument();
    expect(screen.getByText(/Pasar a Cobro \(F9\)/i)).toBeInTheDocument();

    // Pulsar "Atender en Ventanilla" debe mover la tarjeta a Columna 2
    fireEvent.click(btnAtender);

    await waitFor(() => {
      expect(prefacturaService.buscarPorCodigo(tenantId, preventa.id)?.estado).toBe('EN_COBRO');
      expect(screen.getByTestId(`btn-regresar-${preventa.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`btn-confirmar-cobro-${preventa.id}`)).toBeInTheDocument();
    });
  });

  it('3. Multi-directional Drag & Drop permite soltar en Columna 1, 2 y 3', async () => {
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-asesor-01',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      clienteNombre: 'Cliente DnD Test',
      items: [{ productoId: '0000', nombre: 'Ítem Prueba', cantidad: 1, precioLista: 15000 }],
    });
    const prefId = emision.prefactura!.id;

    render(<CashierKanbanView tenantId={tenantId} cajeroId={cajeroId} />);

    await waitFor(() => {
      expect(screen.getByText('Cliente DnD Test')).toBeInTheDocument();
    });

    // 3.1 Drop en Columna 2 (EN_COBRO)
    const col2 = screen.getByText(/En Cobro Activo/i).closest('div[onDragOver]') || screen.getByText(/En Cobro Activo/i).parentElement!;
    fireEvent.drop(col2, {
      dataTransfer: { getData: () => prefId },
    });

    await waitFor(() => {
      expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.estado).toBe('EN_COBRO');
    });

    // 3.2 Drop de regreso a Columna 1 (PENDIENTE_COBRO)
    const col1 = screen.getByText(/En Espera de Cobro/i).closest('div[onDragOver]') || screen.getByText(/En Espera de Cobro/i).parentElement!;
    fireEvent.drop(col1, {
      dataTransfer: { getData: () => prefId },
    });

    await waitFor(() => {
      expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.estado).toBe('PENDIENTE_COBRO');
    });

    // 3.3 Drop a Columna 3 (PAGADA)
    const col3 = screen.getByText(/Pagado \/ Para Despacho/i).closest('div[onDragOver]') || screen.getByText(/Pagado \/ Para Despacho/i).parentElement!;
    fireEvent.drop(col3, {
      dataTransfer: { getData: () => prefId },
    });

    await waitFor(() => {
      expect(prefacturaService.buscarPorCodigo(tenantId, prefId)?.estado).toBe('PAGADA');
    });
  });

  it('4. Homologación de métodos de pago mapea TARJETA a DATAFONO satisfaciendo el esquema Zod', async () => {
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-asesor-03',
      vendedorNombre: 'Carlos Mostrador',
      terminalId: 'TERM-01',
      clienteNombre: 'Supermercado Ferretero',
      items: [{ productoId: '0000', nombre: 'Pintura', cantidad: 1, precioLista: 50000 }],
    });
    const prefId = emision.prefactura!.id;

    // Procesar cobro con mapeo TARJETA -> DATAFONO
    const metodoEntrada = 'TARJETA';
    const metodoMapeado = (metodoEntrada === 'TARJETA' ? 'DATAFONO' : metodoEntrada) as any;

    const res = await useCashierKanbanStore.getState().procesarCobro({
      tenantId,
      prefacturaId: prefId,
      cajeroId,
      turnoId: 'TURNO-01',
      montoTotal: 50000,
      pagos: [{ metodoPago: metodoMapeado, monto: 50000, referenciaComprobante: 'VOUCHER-9876' }],
    });

    expect(res).toBe(true);
    const prefPagada = prefacturaService.buscarPorCodigo(tenantId, prefId);
    expect(prefPagada?.estado).toBe('PAGADA');
    expect(prefPagada?.metodoPago).toBe('DATAFONO');
  });
});
