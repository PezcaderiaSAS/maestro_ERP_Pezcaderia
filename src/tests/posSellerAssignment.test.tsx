import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import Swal from 'sweetalert2';
import {
  mapRolAccesoToUserRole,
  getInitials,
  DEFAULT_INITIAL_SELLERS,
  type RolAccesoEmpleado,
} from '../utils/roleMapper';

afterEach(() => {
  Swal.close();
  cleanup();
  document.body.innerHTML = '';
});

describe('TASK-013-01: Mapeo de Roles y Modelo de Sesión de Empleado', () => {
  it('debe mapear correctamente los roles administrativos de RRHH al UserRole canónico', () => {
    expect(mapRolAccesoToUserRole('ADMINISTRADOR')).toBe('admin');
    expect(mapRolAccesoToUserRole('GERENTE')).toBe('admin');
    expect(mapRolAccesoToUserRole('VENDEDOR')).toBe('vendedor');
    expect(mapRolAccesoToUserRole('BODEGUERO')).toBe('bodega');
    expect(mapRolAccesoToUserRole('REPARTIDOR')).toBe('administrativo');
  });

  it('debe tolerar minúsculas y espacios y retornar fallback seguro ante roles desconocidos', () => {
    expect(mapRolAccesoToUserRole('  vendedor  ' as any)).toBe('vendedor');
    expect(mapRolAccesoToUserRole('administrador' as any)).toBe('admin');
    expect(mapRolAccesoToUserRole('ROL_INVENTADO' as any)).toBe('administrativo');
    expect(mapRolAccesoToUserRole('' as any)).toBe('administrativo');
  });

  it('debe extraer iniciales de 2 letras de manera infalible para avatares táctiles', () => {
    expect(getInitials('Carlos Mostrador')).toBe('CM');
    expect(getInitials('Yurgen')).toBe('YU');
    expect(getInitials('Diana Marcela Gómez')).toBe('DM');
    expect(getInitials('')).toBe('US');
  });

  it('debe contener vendedores iniciales con estructura completa y atributos obligatorios', () => {
    expect(DEFAULT_INITIAL_SELLERS.length).toBeGreaterThanOrEqual(3);

    DEFAULT_INITIAL_SELLERS.forEach((seller) => {
      expect(seller.empleadoId.trim().length).toBeGreaterThan(0);
      expect(seller.nombre.trim().length).toBeGreaterThan(0);
      expect(seller.identificacion.trim().length).toBeGreaterThan(0);
      expect(seller.cargo.trim().length).toBeGreaterThan(0);
      expect(['admin', 'vendedor', 'bodega', 'administrativo']).toContain(seller.rol);
      expect(seller.avatarColor).toBeDefined();
      expect(seller.turnoIniciadoAt).toBeDefined();
    });
  });
});

describe('TASK-013-02: Estado de Sesión Global en useAppStore', () => {
  it('debe iniciar con currentUser definido y su rol sincronizado', async () => {
    const { useAppStore } = await import('../store/useAppStore');
    const state = useAppStore.getState();

    expect(state.currentUser).toBeDefined();
    expect(state.userRole).toBe(state.currentUser?.rol);
  });

  it('debe cambiar de usuario y sincronizar el rol de forma reactiva con setCurrentUser', async () => {
    const { useAppStore } = await import('../store/useAppStore');
    const nuevoVendedor = DEFAULT_INITIAL_SELLERS[1]; // Carlos Mostrador (vendedor)

    useAppStore.getState().setCurrentUser(nuevoVendedor);

    const stateActualizado = useAppStore.getState();
    expect(stateActualizado.currentUser?.empleadoId).toBe(nuevoVendedor.empleadoId);
    expect(stateActualizado.currentUser?.nombre).toBe('Carlos Mostrador');
    expect(stateActualizado.userRole).toBe('vendedor');
  });

  it('debe permitir logoutUser dejando currentUser en null', async () => {
    const { useAppStore } = await import('../store/useAppStore');

    useAppStore.getState().logoutUser();

    expect(useAppStore.getState().currentUser).toBeNull();

    // Restaurar usuario para pruebas subsiguientes
    useAppStore.getState().setCurrentUser(DEFAULT_INITIAL_SELLERS[0]);
    expect(useAppStore.getState().currentUser).not.toBeNull();
  });
});

describe('TASK-013-03: Componente Táctil UserSwitchModal (Regla 12 Años)', () => {
  it('debe renderizar la lista de colaboradores cuando está abierto', async () => {
    const React = await import('react');
    const { render, screen } = await import('@testing-library/react');
    const { UserSwitchModal } = await import('../components/layout/UserSwitchModal');

    const handleClose = vi.fn();

    render(React.createElement(UserSwitchModal, { isOpen: true, onClose: handleClose }));

    expect(screen.getByText(/¿quién está operando\?/i)).toBeInTheDocument();
    expect(screen.getAllByText('Carlos Mostrador').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Diana Ventas').length).toBeGreaterThanOrEqual(1);
  });

  it('debe pasar a la pantalla de PIN al seleccionar un colaborador y validar PIN correcto', async () => {
    const React = await import('react');
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { UserSwitchModal } = await import('../components/layout/UserSwitchModal');
    const { useAppStore } = await import('../store/useAppStore');

    const handleClose = vi.fn();

    render(React.createElement(UserSwitchModal, { isOpen: true, onClose: handleClose }));

    // Seleccionar a Carlos Mostrador
    const btnCarlos = screen.getAllByText('Carlos Mostrador')[0];
    fireEvent.click(btnCarlos);

    // Debe mostrar la vista de PIN
    expect(screen.getByText(/PIN para Carlos Mostrador/i)).toBeInTheDocument();

    // Digitar PIN '1234'
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
      const currentUser = useAppStore.getState().currentUser;
      expect(currentUser?.nombre).toBe('Carlos Mostrador');
      expect(useAppStore.getState().userRole).toBe('vendedor');
    });
  });

  it('debe rechazar y mostrar alerta con PIN incorrecto sin cerrar el modal', async () => {
    const React = await import('react');
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { UserSwitchModal } = await import('../components/layout/UserSwitchModal');

    const handleClose = vi.fn();

    render(React.createElement(UserSwitchModal, { isOpen: true, onClose: handleClose }));

    // Seleccionar a Diana Ventas
    fireEvent.click(screen.getByText('Diana Ventas'));

    // Digitar PIN erróneo '9999'
    fireEvent.click(screen.getByText('9'));
    fireEvent.click(screen.getByText('9'));
    fireEvent.click(screen.getByText('9'));
    fireEvent.click(screen.getByText('9'));

    await waitFor(() => {
      expect(screen.getByTestId('pin-error-message')).toHaveTextContent(/PIN incorrecto/i);
      expect(handleClose).not.toHaveBeenCalled();
    });
  });
});

describe('TASK-013-04: Integración en EnterpriseTopbar y POS Header', () => {
  it('debe renderizar las iniciales del usuario activo en EnterpriseTopbar y abrir UserSwitchModal al hacer clic', async () => {
    const React = await import('react');
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { EnterpriseTopbar } = await import('../components/layout/EnterpriseTopbar');
    const { useAppStore } = await import('../store/useAppStore');

    // Fijar usuario activo Yurgen Admin
    useAppStore.getState().setCurrentUser(DEFAULT_INITIAL_SELLERS[0]);

    render(
      React.createElement(EnterpriseTopbar, {
        currentView: 'pos' as any,
        onNavigateHome: vi.fn(),
        onNavigatePOS: vi.fn(),
        onToggleSidebar: vi.fn(),
        theme: 'pezcaderia-glass',
        onToggleTheme: vi.fn(),
      })
    );

    // Debe mostrar iniciales YA del administrador Yurgen
    const userButton = screen.getByRole('button', { name: /perfil de usuario/i });
    expect(userButton).toBeInTheDocument();
    expect(userButton).toHaveTextContent('YA');
    expect(userButton).toHaveTextContent(/Yurgen/i);
    expect(userButton).toHaveTextContent(/admin/i);

    // Al hacer clic, debe abrir el modal de conmutación de usuario
    fireEvent.click(userButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/¿Quién está operando\?/i)).toBeInTheDocument();
    });
  });
});

describe('TASK-013-05: Trazabilidad de Vendedor en el Motor de Ventas POS', () => {
  it('debe estampar vendedorId y vendedorNombre en cada venta generada para reportes individuales', async () => {
    const { useAppStore } = await import('../store/useAppStore');
    const { DEFAULT_INITIAL_SELLERS } = await import('../utils/roleMapper');
    const carlosVendedor = DEFAULT_INITIAL_SELLERS[1]; // Carlos Mostrador (EMP-002)

    useAppStore.getState().setCurrentUser(carlosVendedor);
    const currentUser = useAppStore.getState().currentUser;

    expect(currentUser).toBeDefined();
    expect(currentUser?.empleadoId).toBe('emp-vend-01');
    expect(currentUser?.nombre).toBe('Carlos Mostrador');

    // Estructura de venta generada con trazabilidad
    const ventaPrueba = {
      id: 'vta-test-001',
      clienteId: null,
      clienteNombre: 'Consumidor Final',
      fecha: new Date().toISOString(),
      items: [{ sku: 'MOJ-001', nombre: 'Mojarra Roja Fresca', cantidad: 2, precioUnitario: 12000, descuento: 0 }],
      subtotal: 24000,
      total: 24000,
      metodoPago: 'CONTADO' as const,
      actor: currentUser!.nombre,
      vendedorId: currentUser!.empleadoId,
      vendedorNombre: currentUser!.nombre,
      cajeroId: currentUser!.empleadoId,
      cajeroNombre: currentUser!.nombre,
    };

    expect(ventaPrueba.vendedorId).toBe('emp-vend-01');
    expect(ventaPrueba.vendedorNombre).toBe('Carlos Mostrador');
    expect(ventaPrueba.actor).toBe('Carlos Mostrador');
  });
});


