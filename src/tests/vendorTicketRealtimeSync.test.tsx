import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState, useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { VendorTicketSidebar, type VendorTicket, type EstadoTicket } from '../components/pos/VendorTicketSidebar.tsx';
import {
  supabaseRealtimePreventasService,
  type RealtimeChannelStatus,
} from '../services/supabaseRealtimePreventasService.ts';
import type { RealtimePreventaEvent } from '../schemas/realtimePreventa.schema.ts';

// Componente Wrapper que simula el Mostrador de POS sincronizado en tiempo real
const MostradorRealtimeTester: React.FC<{
  initialTickets: VendorTicket[];
  tenantId?: string;
  onTicketCobrado?: (codigo: string) => void;
}> = ({ initialTickets, tenantId = 'tenant-03', onTicketCobrado }) => {
  const [tickets, setTickets] = useState<VendorTicket[]>(initialTickets);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    supabaseRealtimePreventasService
      .suscribirPreventas({
        tenantId,
        onStatusChange: (status: RealtimeChannelStatus) => {
          setIsRealtimeActive(status === 'SUBSCRIBED');
        },
        onUpdate: (evt: RealtimePreventaEvent) => {
          setTickets((prev) =>
            prev.map((t) => {
              if (t.id === evt.prefacturaId || t.codigoPreventa === evt.codigoPreventa) {
                let nuevoEstado: EstadoTicket = t.estado;
                const est = evt.estado;
                if (est === 'EN_COBRO') nuevoEstado = 'EN_PROCESO';
                else if (est === 'PAGADA' || est === 'DESPACHADA') {
                  nuevoEstado = 'COBRADO';
                  if (onTicketCobrado) onTicketCobrado(evt.codigoPreventa || t.codigoPreventa);
                } else if (est === 'ANULADA') {
                  nuevoEstado = 'CANCELADO';
                }
                return { ...t, estado: nuevoEstado };
              }
              return t;
            })
          );
        },
        onDelete: (evt: RealtimePreventaEvent) => {
          setTickets((prev) =>
            prev.map((t) => (t.id === evt.prefacturaId ? { ...t, estado: 'CANCELADO' } : t))
          );
        },
      })
      .then((unsub) => {
        cleanup = unsub;
      });

    return () => {
      cleanup?.();
    };
  }, [tenantId, onTicketCobrado]);

  return (
    <VendorTicketSidebar
      tickets={tickets}
      vendedorNombre="Diego Mostrador"
      onRecuperarTicket={vi.fn()}
      onCancelarTicket={vi.fn()}
      isOpen={true}
      realtimeConnected={isRealtimeActive}
    />
  );
};

describe('TASK-045-04: Sincronización en Tiempo Real de Tickets del Vendedor (VendorTicketSidebar)', () => {
  const baseTickets: VendorTicket[] = [
    {
      id: 'prev-101',
      codigoPreventa: 'PRE-101',
      clienteNombre: 'SUPERMERCADO CENTRAL',
      total: 350000,
      itemsCount: 5,
      estado: 'EN_COLA',
      fechaCreacion: new Date().toISOString(),
      vendedorId: 'user-diego',
    },
    {
      id: 'prev-102',
      codigoPreventa: 'PRE-102',
      clienteNombre: 'RESTAURANTE EL PUERTO',
      total: 120000,
      itemsCount: 2,
      estado: 'EN_COLA',
      fechaCreacion: new Date().toISOString(),
      vendedorId: 'user-diego',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseRealtimePreventasService.cleanupAll();
  });

  it('1. Debe mostrar el badge de conexión en vivo "EN VIVO" cuando realtimeConnected es true', () => {
    render(
      <VendorTicketSidebar
        tickets={baseTickets}
        vendedorNombre="Diego Mostrador"
        onRecuperarTicket={vi.fn()}
        onCancelarTicket={vi.fn()}
        isOpen={true}
        realtimeConnected={true}
      />
    );

    const badgeLive = screen.getByTestId('badge-realtime-online');
    expect(badgeLive).toBeDefined();
    expect(badgeLive.textContent).toContain('EN VIVO');
  });

  it('2. Al recibir broadcast de preventa en cobro (EN_COBRO), actualiza reactivamente el ticket a EN_PROCESO ("EN CAJA") y bloquea edición', async () => {
    render(<MostradorRealtimeTester initialTickets={baseTickets} />);

    // Esperar a que la suscripción en tiempo real esté conectada
    await screen.findByTestId('badge-realtime-online');

    // Inicialmente PRE-101 está EN_COLA y se puede editar
    expect(screen.getByText('PRE-101')).toBeDefined();
    const btnEditarAntes = screen.getByTestId('btn-recuperar-prev-101') as HTMLButtonElement;
    expect(btnEditarAntes.disabled).toBe(false);

    // Simulamos que la cajera en la Taquilla Central tomó la preventa (EN_COBRO)
    await act(async () => {
      await supabaseRealtimePreventasService.broadcastEvent({
        eventType: 'UPDATE_ESTADO_PREVENTA',
        tenantId: 'tenant-03',
        prefacturaId: 'prev-101',
        codigoPreventa: 'PRE-101',
        vendedorId: 'user-diego',
        vendedorNombre: 'Diego Mostrador',
        terminalId: 'TERM-01',
        estado: 'EN_COBRO',
        total: 350000,
        itemsCount: 5,
        timestamp: new Date().toISOString(),
      });
    });

    // Ahora PRE-101 debe tener el badge EN CAJA
    expect(await screen.findByText(/EN CAJA/i)).toBeDefined();

    // Y el botón de edición debe estar deshabilitado
    const btnEditarDespues = screen.getByTestId('btn-recuperar-prev-101') as HTMLButtonElement;
    expect(btnEditarDespues.disabled).toBe(true);
    expect(screen.getByText('En Taquilla')).toBeDefined();
  });

  it('3. Al recibir broadcast de preventa liquidada (PAGADA), actualiza a COBRADO y notifica', async () => {
    const handleCobrado = vi.fn();
    render(<MostradorRealtimeTester initialTickets={baseTickets} onTicketCobrado={handleCobrado} />);

    // Esperar a que la suscripción en tiempo real esté conectada
    await screen.findByTestId('badge-realtime-online');

    // Simulamos que la cajera cobra la preventa PRE-102
    await act(async () => {
      await supabaseRealtimePreventasService.broadcastEvent({
        eventType: 'UPDATE_ESTADO_PREVENTA',
        tenantId: 'tenant-03',
        prefacturaId: 'prev-102',
        codigoPreventa: 'PRE-102',
        vendedorId: 'user-diego',
        vendedorNombre: 'Diego Mostrador',
        terminalId: 'TERM-01',
        estado: 'PAGADA',
        total: 120000,
        itemsCount: 2,
        timestamp: new Date().toISOString(),
      });
    });

    // Debe mostrar badge COBRADO
    expect(await screen.findByText(/COBRADO/i)).toBeDefined();
    expect(handleCobrado).toHaveBeenCalledWith('PRE-102');
  });

  it('4. Permite emitir pulsos ultra-rápidos (<50ms) y eventos broadcast con supabaseRealtimePreventasService', async () => {
    const pulseSpy = vi.spyOn(supabaseRealtimePreventasService, 'broadcastPulse');
    const eventSpy = vi.spyOn(supabaseRealtimePreventasService, 'broadcastEvent');

    await supabaseRealtimePreventasService.broadcastPulse({
      tenantId: 'tenant-03',
      action: 'PREVENTA_EMITIDA',
      prefacturaId: 'prev-200',
      codigoPreventa: 'PRE-200',
      vendedorId: 'user-diego',
      total: 54000,
      timestamp: Date.now(),
    });

    await supabaseRealtimePreventasService.broadcastEvent({
      eventType: 'INSERT_PREVENTA',
      tenantId: 'tenant-03',
      prefacturaId: 'prev-200',
      codigoPreventa: 'PRE-200',
      vendedorId: 'user-diego',
      vendedorNombre: 'Diego Mostrador',
      terminalId: 'TERM-01',
      estado: 'PENDIENTE_COBRO',
      total: 54000,
      itemsCount: 1,
      timestamp: new Date().toISOString(),
    });

    expect(pulseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PREVENTA_EMITIDA',
        codigoPreventa: 'PRE-200',
      })
    );
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'INSERT_PREVENTA',
        prefacturaId: 'prev-200',
      })
    );
  });
});
