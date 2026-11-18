// src/tests/tenantDropdownPopover.test.tsx
// Pruebas unitarias para TenantDropdownPopover (SPEC-065)

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TenantDropdownPopover } from '../components/layout/TenantDropdownPopover';
import { useAuthStore } from '../store/useAuthStore';
import { ferreteriaJosaseService } from '../services/ferreteriaJosaseService';

// Mock de servicios
vi.mock('../services/ferreteriaJosaseService', () => ({
  ferreteriaJosaseService: {
    applyToStores: vi.fn().mockResolvedValue(true),
    restorePezcaderiaStores: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('TASK-065-01: TenantDropdownPopover Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      activeTenant: {
        id: 'tenant-01',
        razonSocial: 'La Pezcadería S.A.S.',
        nit: '901.246.730',
        ciudad: 'Bucaramanga',
        telefono: '3101234567',
        activo: true,
        createdAt: '2026-11-18T00:00:00Z',
      },
    });
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <TenantDropdownPopover isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza la lista de empresas activas cuando isOpen es true', () => {
    render(<TenantDropdownPopover isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('tenant-dropdown-popover')).toBeInTheDocument();
    expect(screen.getByText('Conmutar Empresa')).toBeInTheDocument();
    expect(screen.getByText('La Pezcaderia SAS')).toBeInTheDocument();
    expect(screen.getByText('Ferretería Josase')).toBeInTheDocument();
  });

  it('marca la empresa activa actual con el badge "Activa"', () => {
    render(<TenantDropdownPopover isOpen={true} onClose={vi.fn()} />);

    const activeBtn = screen.getByTestId('popover-tenant-btn-tenant-01');
    expect(activeBtn).toHaveTextContent('Activa');
  });

  it('conmuta a Ferretería Josase y llama a applyToStores al hacer clic', async () => {
    const handleClose = vi.fn();
    const handleSelected = vi.fn();

    render(
      <TenantDropdownPopover
        isOpen={true}
        onClose={handleClose}
        onTenantSelected={handleSelected}
      />
    );

    const josaseBtn = screen.getByTestId('popover-tenant-btn-tenant-03');
    fireEvent.click(josaseBtn);

    await waitFor(() => {
      expect(ferreteriaJosaseService.applyToStores).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleSelected).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'tenant-03' })
      );
      expect(useAuthStore.getState().activeTenant?.id).toBe('tenant-03');
    });
  });

  it('cierra el popover al presionar la tecla Escape', () => {
    const handleClose = vi.fn();
    render(<TenantDropdownPopover isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

