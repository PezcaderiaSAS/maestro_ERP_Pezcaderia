import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CashierKanbanView } from '../views/pos/components/CashierKanbanView';
import { EnterpriseTopbar } from '../components/layout/EnterpriseTopbar';
import { useCashierKanbanStore } from '../stores/useCashierKanbanStore';
import { prefacturaService } from '../services/prefacturaService';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

describe('TASK-043-06: E2E Segregación de Roles & Conmutación Kanban/POS', () => {
  const tenantId = 'tenant-josase-e2e';

  beforeEach(() => {
    document.body.innerHTML = '';
    prefacturaService.limpiarEstadoPruebas();

    useAuthStore.setState({
      activeTenant: {
        id: tenantId,
        razonSocial: 'Ferretería & Eléctricos Josase S.A.S.',
        nit: '900.543.210-9',
        ciudad: 'Bucaramanga',
        telefono: '3123456789',
        regimenTributario: 'COMUN',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      currentUser: {
        id: 'emp-vend-01',
        email: 'carlos@josase.com',
        nombre: 'Carlos Mostrador',
        authProvider: 'google',
        rol: 'vendedor',
      },
      isTenantSelectorOpen: false,
    });

    useAppStore.setState({
      userRole: 'vendedor',
      currentUser: {
        empleadoId: 'emp-vend-01',
        nombre: 'Carlos Mostrador',
        identificacion: '1098765433',
        cargo: 'Vendedor Senior Mostrador',
        rol: 'vendedor',
        avatarColor: 'from-emerald-500 to-teal-700',
        turnoIniciadoAt: new Date().toISOString(),
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

  it('1. Vendedor en Kanban visualiza Modo Monitor (Solo Lectura) sin botones de cobro', async () => {
    // 1. Asesor emite preventa
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'emp-vend-01',
      vendedorNombre: 'Carlos Mostrador',
      terminalId: 'TERM-MOSTRADOR-01',
      clienteDocumento: '900123456',
      clienteNombre: 'Constructora Bolívar S.A.',
      items: [{ productoId: 'p1', nombre: 'Tubo PVC 1/2', cantidad: 10, precioLista: 18000 }],
      observaciones: 'Entregar cortado a 3 metros',
    });
    const prefId = emision.prefactura!.id;

    render(<CashierKanbanView tenantId={tenantId} cajeroId="emp-vend-01" />);

    // 2. Comprobar que aparece el banner de Modo Monitor
    await waitFor(() => {
      expect(screen.getByTestId('badge-modo-monitor-vendedor')).toBeInTheDocument();
      expect(screen.getByText(/Modo Monitor: Visualizando el avance de ventas/i)).toBeInTheDocument();
    });

    // 3. Comprobar que ve la tarjeta con cliente y valor
    expect(screen.getByText('Constructora Bolívar S.A.')).toBeInTheDocument();
    expect(screen.getByText('$180.000')).toBeInTheDocument();

    // 4. Comprobar que NO existe el botón 'Pasar a Cobro (F9)'
    expect(screen.queryByTestId(`btn-iniciar-cobro-${prefId}`)).toBeNull();

    // 5. Comprobar que en su lugar se exhibe la pastilla 'En Espera de Cobro en Caja'
    expect(screen.getByTestId(`badge-en-espera-${prefId}`)).toBeInTheDocument();
    expect(screen.getByText(/En Espera de Cobro en Caja/i)).toBeInTheDocument();
  });

  it('2. Vendedor no puede mover tarjetas ni confirmar pagos en Columna 2 (En Ventanilla)', async () => {
    // Crear preventa en estado EN_COBRO
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'emp-vend-01',
      vendedorNombre: 'Carlos Mostrador',
      terminalId: 'TERM-01',
      clienteDocumento: '10203040',
      clienteNombre: 'Ferretería El Tornillo',
      items: [{ productoId: 'p2', nombre: 'Pintura Blanca', cantidad: 1, precioLista: 95000 }],
    });
    const prefId = emision.prefactura!.id;
    prefacturaService.marcarEnCobro(tenantId, prefId, 'usr-cajero-01');

    render(<CashierKanbanView tenantId={tenantId} cajeroId="emp-vend-01" />);

    await waitFor(() => {
      expect(screen.getByText('Ferretería El Tornillo')).toBeInTheDocument();
    });

    // En Columna 2, el vendedor no debe ver 'Confirmar Pago de Venta'
    expect(screen.queryByTestId(`btn-confirmar-cobro-${prefId}`)).toBeNull();

    // Debe ver el badge de estado 'Atendiendo en Ventanilla'
    expect(screen.getByTestId(`badge-en-cobro-${prefId}`)).toBeInTheDocument();
    expect(screen.getByText(/Atendiendo en Ventanilla/i)).toBeInTheDocument();
  });

  it('3. Al conmutar sesión a Cajero / Admin, se habilitan los botones de recaudo y modal F9', async () => {
    // Preventa lista
    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'emp-vend-01',
      vendedorNombre: 'Carlos Mostrador',
      terminalId: 'TERM-01',
      clienteDocumento: '900999888',
      clienteNombre: 'Cliente Central S.A.',
      items: [{ productoId: 'p3', nombre: 'Cemento Gris', cantidad: 2, precioLista: 30000 }],
    });
    const prefId = emision.prefactura!.id;

    // Cambiar a Cajera
    useAuthStore.setState({
      currentUser: {
        id: 'usr-cajero-01',
        email: 'caja@josase.com',
        nombre: 'Yurgen Administrador',
        authProvider: 'google',
        rol: 'cajero',
      },
    });

    useAppStore.setState({
      userRole: 'admin',
      currentUser: {
        empleadoId: 'emp-admin-01',
        nombre: 'Yurgen Administrador',
        identificacion: '1098765432',
        cargo: 'Gerente General',
        rol: 'admin',
        avatarColor: 'from-blue-600 to-indigo-700',
        turnoIniciadoAt: new Date().toISOString(),
      },
    });

    render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-cajero-01" />);

    // Ahora SÍ debe ver el botón de cobro F9
    await waitFor(() => {
      expect(screen.getByTestId(`btn-iniciar-cobro-${prefId}`)).toBeInTheDocument();
      expect(screen.getByText(/Pasar a Cobro \(F9\)/i)).toBeInTheDocument();
    });

    // Clic en cobro abre el modal mixto
    fireEvent.click(screen.getByTestId(`btn-iniciar-cobro-${prefId}`));

    await waitFor(() => {
      expect(screen.getByText(/Cobro en Ventanilla/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirmar Cobro \(F9\)/i })).toBeInTheDocument();
    });
  });

  it('4. EnterpriseTopbar soporta navegación por atajos F4 (POS) y F7 (Kanban)', () => {
    let posClicked = false;
    let kanbanClicked = false;

    render(
      <EnterpriseTopbar
        currentView="pos"
        onNavigateHome={() => {}}
        onNavigatePOS={() => { posClicked = true; }}
        onNavigateKanban={() => { kanbanClicked = true; }}
        onToggleSidebar={() => {}}
        theme="pezcaderia-glass"
        onToggleTheme={() => {}}
      />
    );

    // Verificar insignias F7 y F4
    const btnKanban = screen.getByTestId('topbar-btn-comandas-kanban');
    const btnPos = screen.getByTestId('topbar-btn-facturar-pos');
    expect(btnKanban).toHaveTextContent('F7');
    expect(btnPos).toHaveTextContent('F4');

    // Disparar atajo F7
    fireEvent.keyDown(window, { key: 'F7', code: 'F7' });
    expect(kanbanClicked).toBe(true);

    // Disparar atajo F4
    fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
    expect(posClicked).toBe(true);
  });
});
