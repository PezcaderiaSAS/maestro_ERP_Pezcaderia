import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PendingOrdersDrawer, type PendingOrderComanda } from '../views/pos/components/PendingOrdersDrawer';

describe('PendingOrdersDrawer - Cola Central de Preventas (SPEC-032: TASK-032-01)', () => {
  const mockOrders: PendingOrderComanda[] = [
    {
      id: 'pre-001',
      consecutivoTicket: 'PRE-0042',
      terminalId: 'TERM-01',
      vendedorId: 'vend-01',
      vendedorNombre: 'Carlos Vendedor',
      clienteNombre: 'Restaurante El Ancla',
      montoTotal: 150000,
      itemsCount: 3,
      createdAt: new Date().toISOString(),
      estado: 'PENDIENTE_PAGO',
    },
    {
      id: 'pre-002',
      consecutivoTicket: 'PRE-0043',
      terminalId: 'TERM-03',
      vendedorId: 'vend-02',
      vendedorNombre: 'María Mostrador',
      clienteNombre: 'Consumidor Final',
      montoTotal: 45000,
      itemsCount: 1,
      createdAt: new Date().toISOString(),
      estado: 'PENDIENTE_PAGO',
    },
  ];

  it('debe renderizar la lista de preventas pendientes con sus tickets y vendedores', () => {
    render(
      <PendingOrdersDrawer
        isOpen={true}
        onClose={() => {}}
        orders={mockOrders}
        onSelectOrder={() => {}}
      />
    );

    expect(screen.getByText('PRE-0042')).toBeInTheDocument();
    expect(screen.getByText('PRE-0043')).toBeInTheDocument();
    expect(screen.getByText(/Carlos Vendedor/i)).toBeInTheDocument();
    expect(screen.getByText(/María Mostrador/i)).toBeInTheDocument();
    expect(screen.getByText('TERM-01')).toBeInTheDocument();
    expect(screen.getByText('TERM-03')).toBeInTheDocument();
  });

  it('debe filtrar las preventas al escribir en el buscador de tickets', () => {
    render(
      <PendingOrdersDrawer
        isOpen={true}
        onClose={() => {}}
        orders={mockOrders}
        onSelectOrder={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por ticket/i);
    fireEvent.change(searchInput, { target: { value: '0043' } });

    expect(screen.queryByText('PRE-0042')).toBeNull();
    expect(screen.getByText('PRE-0043')).toBeInTheDocument();
  });

  it('debe invocar onSelectOrder al hacer clic en Cobrar en Caja', () => {
    const onSelectOrder = vi.fn();
    render(
      <PendingOrdersDrawer
        isOpen={true}
        onClose={() => {}}
        orders={mockOrders}
        onSelectOrder={onSelectOrder}
      />
    );

    const btnCobrar = screen.getAllByRole('button', { name: /Cobrar en Caja/i })[0];
    fireEvent.click(btnCobrar);

    expect(onSelectOrder).toHaveBeenCalledWith(mockOrders[0]);
  });
});
