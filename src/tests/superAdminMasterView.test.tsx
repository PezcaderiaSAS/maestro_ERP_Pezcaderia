import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuperAdminMasterView } from '../views/admin/SuperAdminMasterView';
import { useSuperAdminStore } from '../store/useSuperAdminStore';

describe('TASK-034-04: SuperAdminMasterView & Multi-Tenant Management', () => {
  beforeEach(() => {
    // Inicializar estado con datos de prueba
    useSuperAdminStore.setState({
      tenants: [
        {
          id: 'tenant-01',
          nombre: 'La Pezcaderia SAS',
          nit: '900.123.456-1',
          razonSocial: 'La Pezcadería del Mar S.A.S.',
          rubro: 'PESCADERIA',
          activo: true,
          maxTerminales: 8,
          createdAt: '2026-10-01T08:00:00Z',
          sucursalesCount: 2,
        },
        {
          id: 'tenant-02',
          nombre: 'Ferretería El Tornillo de Oro',
          nit: '901.789.012-3',
          razonSocial: 'Ferretería & Suministros S.A.S.',
          rubro: 'FERRETERIA',
          activo: true,
          maxTerminales: 8,
          createdAt: '2026-10-15T09:30:00Z',
          sucursalesCount: 1,
        },
      ],
      selectedTenantId: 'tenant-01',
      users: [
        {
          id: 'user-01',
          tenantId: 'tenant-01',
          nombre: 'Yurani Administradora',
          email: 'yurani@pezcaderia.com',
          rol: 'ADMIN',
          activo: true,
        },
        {
          id: 'user-02',
          tenantId: 'tenant-02',
          nombre: 'Pedro Ferretero',
          email: 'pedro@ferreteria.com',
          rol: 'VENDEDOR',
          activo: true,
        },
      ],
      isLoading: false,
    });
  });

  it('debe renderizar la cabecera del panel maestro de desarrollador con estilo V8', () => {
    render(<SuperAdminMasterView />);

    expect(screen.getByText(/Panel Maestro Super Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/GOD_MODE/i)).toBeInTheDocument();
    expect(screen.getAllByText('La Pezcaderia SAS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ferretería El Tornillo de Oro')).toBeInTheDocument();
  });

  it('debe mostrar las 4 tarjetas de métricas globales (Total Empresas, Activas, Terminales, Usuarios)', () => {
    render(<SuperAdminMasterView />);

    expect(screen.getByText('Total Empresas')).toBeInTheDocument();
    expect(screen.getByText('Empresas Activas')).toBeInTheDocument();
    expect(screen.getByText('Terminales Máximas')).toBeInTheDocument();
    expect(screen.getByText('Usuarios Registrados')).toBeInTheDocument();
  });

  it('debe permitir seleccionar una empresa y filtrar los usuarios asociados', () => {
    render(<SuperAdminMasterView />);

    // Clic en la tarjeta o botón de la Ferretería
    const btnSeleccionarFerreteria = screen.getByTestId('btn-select-tenant-tenant-02');
    fireEvent.click(btnSeleccionarFerreteria);

    expect(useSuperAdminStore.getState().selectedTenantId).toBe('tenant-02');
    expect(screen.getByText('Pedro Ferretero')).toBeInTheDocument();
  });

  it('debe permitir suspender o reactivar una empresa con el botón de conmutación', () => {
    render(<SuperAdminMasterView />);

    const btnToggleEstado = screen.getByTestId('btn-toggle-tenant-tenant-01');
    fireEvent.click(btnToggleEstado);

    const tenantActualizado = useSuperAdminStore
      .getState()
      .tenants.find((t) => t.id === 'tenant-01');
    expect(tenantActualizado?.activo).toBe(false);
  });
});
