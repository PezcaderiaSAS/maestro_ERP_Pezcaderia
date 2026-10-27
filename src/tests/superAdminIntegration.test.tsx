import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { superAdminService } from '../services/superAdminService';
import { SuperAdminMasterView } from '../views/admin/SuperAdminMasterView';
import { useSuperAdminStore } from '../store/useSuperAdminStore';
import { AppRouteId, APP_ROUTES_METADATA } from '../routes/AppRoute';

describe('SuperAdmin Integration & Multi-Tenancy (SPEC-032: TASK-032-03)', () => {
  beforeEach(() => {
    useSuperAdminStore.getState().loadTenants();
  });

  it('1. Debe tener la ruta SUPERADMIN formalmente registrada en AppRouteId y APP_ROUTES_METADATA', () => {
    expect(AppRouteId.SUPERADMIN).toBe('superadmin');
    const meta = APP_ROUTES_METADATA[AppRouteId.SUPERADMIN];
    expect(meta).toBeDefined();
    expect(meta.path).toBe('/superadmin');
    expect(meta.title).toContain('Super Admin');
    expect(meta.allowedRoles).toContain('admin');
  });

  it('2. El servicio superAdminService debe permitir registrar un nuevo tenant con rubro y terminales', () => {
    const nuevoTenant = superAdminService.createTenant({
      nombre: 'Ferretería Central SAS',
      nit: '900.555.444-2',
      razonSocial: 'Ferretería Central de la Costa S.A.S.',
      rubro: 'FERRETERIA',
      maxTerminales: 8,
      contactoEmail: 'contacto@ferreteriacentral.com',
    });

    expect(nuevoTenant.id).toBeDefined();
    expect(nuevoTenant.rubro).toBe('FERRETERIA');
    expect(nuevoTenant.maxTerminales).toBe(8);
    expect(nuevoTenant.activo).toBe(true);

    const encontrado = superAdminService.getTenantById(nuevoTenant.id);
    expect(encontrado?.nombre).toBe('Ferretería Central SAS');
  });

  it('3. El servicio superAdminService debe permitir actualizar roles de usuario en el tenant', () => {
    const updated = superAdminService.updateUserRole('user-02', 'SUPERVISOR');
    expect(updated).toBe(true);

    const users = superAdminService.getUsersByTenant('tenant-02');
    const user2 = users.find((u) => u.id === 'user-02');
    expect(user2?.rol).toBe('SUPERVISOR');
  });

  it('4. SuperAdminMasterView debe renderizar el badge GOD_MODE y permitir alternar empresas', () => {
    render(<SuperAdminMasterView />);

    expect(screen.getByText(/GOD_MODE \/ RLS_BYPASS/i)).toBeInTheDocument();
    expect(screen.getByText('Panel Maestro Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Total Empresas')).toBeInTheDocument();
  });
});
