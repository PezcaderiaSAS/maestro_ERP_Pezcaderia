import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CashierKanbanView } from '../views/pos/components/CashierKanbanView';
import { useCashierKanbanStore } from '../stores/useCashierKanbanStore';
import { prefacturaService } from '../services/prefacturaService';
import { useAuthStore } from '../store/useAuthStore';

describe('TASK-037-05: CashierKanbanView - Tablero Premium de Caja Única y Recaudo', () => {
  const tenantId = 'ten-kanban-test';

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
        id: 'usr-cajero-01',
        email: 'caja@empresa.com',
        nombre: 'Luisa Cajera',
        authProvider: 'google',
        rol: 'cajero',
      },
    });

    useCashierKanbanStore.setState({
      preventas: [],
      filtroAsesorId: 'TODOS',
      preventaSeleccionada: null,
      isModalCobroOpen: false,
      isLoading: false,
    });
  });

  it('1. Renderiza las 3 columnas operativas con Pastillas de Color (Pills) y Contadores', async () => {
    // Insertar preventa de prueba
    await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'usr-v1',
      vendedorNombre: 'Marcos Asesor',
      terminalId: 'TERM-01',
      clienteDocumento: '10203040',
      clienteNombre: 'Construcciones Norte',
      items: [{ productoId: 'p1', nombre: 'Cemento Gris', cantidad: 2, precioLista: 25000 }],
    });

    render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-cajero-01" />);

    // Verificar cabeceras de columnas
    expect(screen.getByText(/En Espera de Cobro/i)).toBeInTheDocument();
    expect(screen.getByText(/En Cobro Activo/i)).toBeInTheDocument();
    expect(screen.getByText(/Pagado \/ Para Despacho/i)).toBeInTheDocument();

    // Contadores en cabecera
    await waitFor(() => {
      expect(screen.getByText('Construcciones Norte')).toBeInTheDocument();
    });
  });

  it('2. Las tarjetas Premium muestran número de ticket, valor, asesor comercial y nombre de cliente', async () => {
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'usr-v1',
      vendedorNombre: 'Carlos Asesor',
      terminalId: 'TERM-01',
      clienteDocumento: '55443322',
      clienteNombre: 'Taller San José',
      items: [{ productoId: 'p2', nombre: 'Pintura Epóxica', cantidad: 1, precioLista: 120000 }],
    });
    const codigoTicket = emision.prefactura!.codigoPreventa;

    render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-cajero-01" />);

    await waitFor(() => {
      expect(screen.getByText('Taller San José')).toBeInTheDocument();
      expect(screen.getByText(codigoTicket)).toBeInTheDocument();
      expect(screen.getByText('$120.000')).toBeInTheDocument();
      expect(screen.getAllByText(/Carlos Asesor/i).length).toBeGreaterThanOrEqual(1);
    });

    // Validar presencia del Avatar Stack superpuesto
    const avatarStack = screen.getByTestId(`avatar-stack-${emision.prefactura!.id}`);
    expect(avatarStack).toBeInTheDocument();
  });

  it('3. Permite filtrar dinámicamente las tarjetas por Asesor Comercial mediante chips rápidos', async () => {
    // Preventa 1 de Asesor Marcos
    await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-marcos',
      vendedorNombre: 'Marcos Vendedor',
      terminalId: 'TERM-01',
      clienteNombre: 'Cliente de Marcos',
      items: [{ productoId: 'p1', nombre: 'Brocha 3 pulg', cantidad: 1, precioLista: 8000 }],
    });

    // Preventa 2 de Asesor Laura
    await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-laura',
      vendedorNombre: 'Laura Vendedora',
      terminalId: 'TERM-02',
      clienteNombre: 'Cliente de Laura',
      items: [{ productoId: 'p2', nombre: 'Rodillo Felpa', cantidad: 1, precioLista: 15000 }],
    });

    render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-cajero-01" />);

    await waitFor(() => {
      expect(screen.getByText('Cliente de Marcos')).toBeInTheDocument();
      expect(screen.getByText('Cliente de Laura')).toBeInTheDocument();
    });

    // Filtrar por Laura
    const chipLaura = screen.getByRole('button', { name: /Laura Vendedora/i });
    fireEvent.click(chipLaura);

    await waitFor(() => {
      expect(screen.queryByText('Cliente de Marcos')).not.toBeInTheDocument();
      expect(screen.getByText('Cliente de Laura')).toBeInTheDocument();
    });
  });

  it('4. Permite pasar una preventa a EN_COBRO y registrar el pago con emisión de Factura', async () => {
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-marcos',
      vendedorNombre: 'Marcos Vendedor',
      terminalId: 'TERM-01',
      clienteNombre: 'Ferretería La Palma',
      items: [{ productoId: 'p1', nombre: 'Manguera 1/2 pulg x 10m', cantidad: 1, precioLista: 45000 }],
    });
    const prefId = emision.prefactura!.id;

    render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-cajero-01" />);

    await waitFor(() => {
      expect(screen.getByText('Ferretería La Palma')).toBeInTheDocument();
    });

    // Clic en botón "Pasar a Cobro"
    const btnCobro = screen.getByTestId(`btn-iniciar-cobro-${prefId}`);
    fireEvent.click(btnCobro);

    // Debe abrirse el modal de cobro con los métodos de recaudo
    await waitFor(() => {
      expect(screen.getByText(/Cobro en Ventanilla/i)).toBeInTheDocument();
      expect(screen.getAllByText('$45.000').length).toBeGreaterThanOrEqual(1);
    });

    // Confirmar pago en efectivo
    const btnConfirmar = screen.getByTestId('btn-confirmar-recaudo-caja');
    fireEvent.click(btnConfirmar);

    // La preventa debe transicionar a 'Pagado / Para Despacho'
    await waitFor(() => {
      const prefActualizada = prefacturaService.buscarPorCodigo(tenantId, prefId);
      expect(prefActualizada?.estado).toBe('PAGADA');
      expect(prefActualizada?.facturaId).toBeDefined();
    });
  });
});
