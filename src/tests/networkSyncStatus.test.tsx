import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NetworkSyncStatusBadge } from '../components/layout/NetworkSyncStatusBadge';
import { useEventStore } from '../store/useEventStore';
import Swal from 'sweetalert2';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: false }),
  },
}));

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
    }),
  })),
}));

// Mock PosDraftService
vi.mock('../services/posDraftService', () => ({
  PosDraftService: {
    fetchRemoteDrafts: vi.fn().mockResolvedValue([]),
  },
}));

describe('NetworkSyncStatusBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventStore.setState({ syncQueue: [] });
  });

  it('renderiza correctamente el badge en estado ONLINE', () => {
    render(<NetworkSyncStatusBadge />);
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByLabelText(/Estado de sincronización: ONLINE/i)).toBeInTheDocument();
  });

  it('muestra la cantidad de transacciones pendientes en modo OFFLINE', () => {
    // Simular que el evento offline se dispara y que hay un job pendiente en syncQueue
    useEventStore.setState({
      syncQueue: [
        {
          id: 'job-1',
          eventTipo: 'SALE_COMPLETED',
          payload: {},
          estado: 'PENDIENTE',
          intentos: 0,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    render(<NetworkSyncStatusBadge />);

    // Disparar evento offline
    fireEvent(window, new Event('offline'));

    expect(screen.getByText(/OFFLINE \(1\)/i)).toBeInTheDocument();
  });

  it('abre el diálogo con detalles de conexión al hacer clic en el badge', async () => {
    render(<NetworkSyncStatusBadge />);

    const badge = screen.getByRole('button');
    fireEvent.click(badge);

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/Conexión a la Nube Estable|Modo Fuera de Línea Activo/),
        confirmButtonText: '🔄 Sincronizar Ahora',
      })
    );
  });
});
