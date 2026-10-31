import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnterpriseTopbar } from '../components/layout/EnterpriseTopbar';
import { databasePurgeService } from '../services/databasePurgeService';
import Swal from 'sweetalert2';

vi.mock('sweetalert2', () => {
  const SwalMock = {
    fire: vi.fn(),
    showLoading: vi.fn(),
    close: vi.fn(),
  };
  return { default: SwalMock };
});

describe('TASK-049-05: Botón de Purga/Reset en EnterpriseTopbar', () => {
  const defaultProps = {
    currentView: 'pos' as const,
    onNavigateHome: vi.fn(),
    onNavigatePOS: vi.fn(),
    onToggleSidebar: vi.fn(),
    theme: 'pezcaderia-glass',
    onToggleTheme: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renderiza el botón de purga y reset en la barra superior con su ID canónico', () => {
    render(<EnterpriseTopbar {...defaultProps} />);
    const purgeBtn = screen.getByTestId('topbar-btn-purge-db');
    expect(purgeBtn).toBeDefined();
    expect(purgeBtn.getAttribute('title')).toContain('Purgar');
  });

  it('2. Al hacer clic en el botón de purga, abre la confirmación modal de SweetAlert2', async () => {
    (Swal.fire as any).mockResolvedValueOnce({ isConfirmed: false });

    render(<EnterpriseTopbar {...defaultProps} />);
    const purgeBtn = screen.getByTestId('topbar-btn-purge-db');
    fireEvent.click(purgeBtn);

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Purgar'),
        icon: 'warning',
        showCancelButton: true,
      })
    );
  });

  it('3. Si el usuario confirma, invoca databasePurgeService.purgeAll y notifica éxito', async () => {
    (Swal.fire as any)
      .mockResolvedValueOnce({ isConfirmed: true }) // Confirmación modal
      .mockResolvedValueOnce({}); // Modal de carga
    
    const purgeAllSpy = vi.spyOn(databasePurgeService, 'purgeAll').mockResolvedValueOnce({
      local: {
        success: true,
        durationMs: 22,
        clientesResembrados: 10,
        productosResembrados: 25,
        tenantId: 'tenant-03',
        timestamp: new Date().toISOString(),
      },
      remotoSuccess: true,
    });

    render(<EnterpriseTopbar {...defaultProps} />);
    const purgeBtn = screen.getByTestId('topbar-btn-purge-db');
    fireEvent.click(purgeBtn);

    await waitFor(() => {
      expect(purgeAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          conservarSesionTurno: true,
          limpiarRemotoSupabase: true,
        })
      );
    });
  });
});
