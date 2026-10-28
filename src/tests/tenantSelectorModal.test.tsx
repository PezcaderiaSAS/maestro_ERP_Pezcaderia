// src/tests/tenantSelectorModal.test.tsx
// Pruebas unitarias e integración para TenantSelectorModal y UltraAdmin GOD_MODE (SPEC-036)

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TenantSelectorModal } from '../views/auth/components/TenantSelectorModal';
import { useAuthStore } from '../store/useAuthStore';
import { useSuperAdminStore } from '../store/useSuperAdminStore';
import { superAdminService } from '../services/superAdminService';
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from '../types/auth.types';
import Swal from 'sweetalert2';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('TASK-036-06: TenantSelectorModal & UltraAdmin Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      status: 'authenticated',
      currentUser: {
        id: 'usr-admin-1',
        email: 'admin.dueno@pezcaderia.com',
        nombre: 'Admin Don Fernando',
        authProvider: 'email',
        rol: 'admin',
        isOwner: true,
      },
      activeTenant: {
        id: 'tenant-01',
        razonSocial: 'La Pezcadería del Mar S.A.S.',
        nit: '900.123.456-1',
        ciudad: 'Bucaramanga',
        telefono: '3101234567',
        activo: true,
        createdAt: '2026-10-01T08:00:00Z',
      },
      isTenantSelectorOpen: false,
    });
  });

  it('1. Valida correctamente la función utilitaria isSuperAdmin y su correo canónico', () => {
    expect(SUPER_ADMIN_EMAIL).toBe('pezcaderia.2022@gmail.com');
    expect(isSuperAdmin('pezcaderia.2022@gmail.com')).toBe(true);
    expect(isSuperAdmin('PEZCADERIA.2022@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('  pezcaderia.2022@gmail.com  ')).toBe(true);
    expect(isSuperAdmin('otro.usuario@gmail.com')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it('2. No se renderiza en el DOM cuando isOpen = false', () => {
    render(<TenantSelectorModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('tenant-selector-modal')).not.toBeInTheDocument();
  });

  it('3. Se renderiza correctamente cuando isOpen = true y lista las empresas disponibles', () => {
    render(<TenantSelectorModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByTestId('tenant-selector-modal')).toBeInTheDocument();
    expect(screen.getByText(/Conmutador Multi-Empresa/i)).toBeInTheDocument();

    // Validar nombres de tenants
    expect(screen.getByText('La Pezcaderia SAS')).toBeInTheDocument();
    expect(screen.getByText('Ferretería El Tornillo de Oro')).toBeInTheDocument();
    expect(screen.getByText('Ferretería Josase')).toBeInTheDocument();

    // Validar NITs
    expect(screen.getByText(/901\.246\.730/)).toBeInTheDocument();
    expect(screen.getByText(/901\.789\.012-3/)).toBeInTheDocument();
    expect(screen.getByText(/901\.954\.321-8/)).toBeInTheDocument();
  });

  it('4. Renderiza los badges de rubro correspondientes (PESCADERIA y FERRETERIA)', () => {
    render(<TenantSelectorModal isOpen={true} onClose={vi.fn()} />);
    
    const badgesPescaderia = screen.getAllByText('PESCADERIA');
    expect(badgesPescaderia.length).toBeGreaterThanOrEqual(1);

    const badgesFerreteria = screen.getAllByText('FERRETERIA');
    expect(badgesFerreteria.length).toBeGreaterThanOrEqual(2);
  });

  it('5. Destaca visualmente el tenant actualmente activo', () => {
    render(<TenantSelectorModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Empresa Activa/i)).toBeInTheDocument();
    const activeCard = screen.getByTestId('tenant-card-tenant-01');
    expect(activeCard).toBeInTheDocument();
    expect(activeCard.className).toContain('ring-2');
  });

  it('6. Muestra el banner especial de UltraAdministrador Global cuando el usuario es pezcaderia.2022@gmail.com', () => {
    useAuthStore.setState({
      currentUser: {
        id: 'usr-ultra-admin',
        email: 'pezcaderia.2022@gmail.com',
        nombre: 'Ultra Administrador (GOD_MODE)',
        authProvider: 'google',
        rol: 'admin',
        isOwner: true,
        isSuperAdmin: true,
      },
    });

    render(<TenantSelectorModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Modo UltraAdministrador Global/i)).toBeInTheDocument();
    expect(screen.getAllByText(/GOD_MODE/i).length).toBeGreaterThanOrEqual(1);
  });

  it('7. Conmuta a Ferretería Josase (tenant-03) al hacer click y dispara notificación SweetAlert2', async () => {
    const handleClose = vi.fn();
    const handleSelected = vi.fn();

    render(
      <TenantSelectorModal
        isOpen={true}
        onClose={handleClose}
        onTenantSelected={handleSelected}
      />
    );

    const selectBtn = screen.getByTestId('btn-select-tenant-tenant-03');
    fireEvent.click(selectBtn);

    // Debe actualizar el activeTenant en useAuthStore
    const currentActive = useAuthStore.getState().activeTenant;
    expect(currentActive?.id).toBe('tenant-03');
    expect(currentActive?.razonSocial).toBe('Ferretería Josase S.A.S.');

    // Debe llamar a onClose y onTenantSelected
    expect(handleClose).toHaveBeenCalled();
    expect(handleSelected).toHaveBeenCalledWith(expect.objectContaining({ id: 'tenant-03' }));

    // Debe disparar SweetAlert2 toast
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        toast: true,
        icon: 'success',
      })
    );
  });
});
