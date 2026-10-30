import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorTicketSidebar, type VendorTicket } from '../components/pos/VendorTicketSidebar';

describe('TASK-043-04: Barra Lateral de Tickets Activos del Vendedor (VendorTicketSidebar)', () => {
  const mockTickets: VendorTicket[] = [
    {
      id: 'prev-1',
      codigoPreventa: 'PRE-001',
      clienteNombre: 'JUAN VALENCIA',
      clienteDocumento: '71234567',
      total: 154000,
      itemsCount: 4,
      estado: 'EN_COLA',
      notas: 'Entrega por puerta lateral',
      fechaCreacion: new Date().toISOString(),
      vendedorId: 'user-01',
    },
    {
      id: 'prev-2',
      codigoPreventa: 'PRE-002',
      clienteNombre: 'FERRETERIA EL MARTILLO',
      clienteDocumento: '900888999',
      total: 820000,
      itemsCount: 12,
      estado: 'EN_PROCESO',
      fechaCreacion: new Date().toISOString(),
      vendedorId: 'user-01',
    },
    {
      id: 'prev-3',
      codigoPreventa: 'PRE-003',
      clienteNombre: 'MFL INGENIEROS',
      clienteDocumento: '901475457',
      total: 45000,
      itemsCount: 1,
      estado: 'COBRADO',
      fechaCreacion: new Date().toISOString(),
      vendedorId: 'user-01',
    },
  ];

  it('1. Debe renderizar la lista de tickets del vendedor con sus badges de estado correspondientes', () => {
    render(
      <VendorTicketSidebar
        tickets={mockTickets}
        vendedorNombre="Diego Asesor"
        onRecuperarTicket={vi.fn()}
        onCancelarTicket={vi.fn()}
        isOpen={true}
        onToggleOpen={vi.fn()}
      />
    );

    // Debe mostrar encabezado y conteo
    expect(screen.getByText(/Mis Preventas Activas/i)).toBeDefined();
    expect(screen.getByText('PRE-001')).toBeDefined();
    expect(screen.getByText('PRE-002')).toBeDefined();
    expect(screen.getByText('PRE-003')).toBeDefined();

    // Badges de estado
    expect(screen.getByText(/EN COLA/i)).toBeDefined();
    expect(screen.getByText(/EN CAJA/i)).toBeDefined();
    expect(screen.getByText(/COBRADO/i)).toBeDefined();
  });

  it('2. En preventas EN_COLA permite Recuperar y Cancelar, mientras en EN_PROCESO deshabilita la edición', () => {
    const handleRecuperar = vi.fn();
    const handleCancelar = vi.fn();

    render(
      <VendorTicketSidebar
        tickets={mockTickets}
        vendedorNombre="Diego Asesor"
        onRecuperarTicket={handleRecuperar}
        onCancelarTicket={handleCancelar}
        isOpen={true}
        onToggleOpen={vi.fn()}
      />
    );

    // Ticket en EN_COLA (PRE-001) debe tener botón activo para recuperar
    const btnEditarCola = screen.getByTestId('btn-recuperar-prev-1');
    expect(btnEditarCola).toBeDefined();
    expect((btnEditarCola as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(btnEditarCola);
    expect(handleRecuperar).toHaveBeenCalledWith('prev-1');

    // Botón cancelar en PRE-001
    const btnCancelarCola = screen.getByTestId('btn-cancelar-prev-1');
    fireEvent.click(btnCancelarCola);
    expect(handleCancelar).toHaveBeenCalledWith('prev-1');

    // Ticket en EN_PROCESO (PRE-002) debe tener botón deshabilitado o bloquear edición
    const btnEditarProceso = screen.getByTestId('btn-recuperar-prev-2');
    expect((btnEditarProceso as HTMLButtonElement).disabled).toBe(true);
  });
});
