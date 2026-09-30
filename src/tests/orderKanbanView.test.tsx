import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderKanbanView from '../views/OrderKanbanView';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';

describe('OrderKanbanView Suite (Paso 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock seguro del data service
    setOrderDataService({
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);

    useOrderStore.setState({
      quotations: [

        {
          id: 'quote-101',
          numeroPedido: 'PED-101',
          clientName: 'Restaurante Mar y Sabor',
          estado: 'CREADO',
          fecha: '2026-09-30',
          lineas: [
            {
              id: 'l-1',
              nombre: 'Filete de Róbalo',
              sku: 'ROB-001',
              cantidadSolicitada: 15,
              precioPactado: 35000,
            },
          ],
          totalFinal: 525000,
        },
        {
          id: 'quote-102',
          numeroPedido: 'PED-102',
          clientName: 'Hotel Dann Carlton',
          estado: 'EN_FILETEO',
          fecha: '2026-09-30',
          lineas: [
            {
              id: 'l-2',
              nombre: 'Salmón Porcionado Catch Weight',
              sku: 'SALM-002',
              cantidadSolicitada: 60,
              modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
              piezasSolicitadas: 30,
              precioPactado: 48000,
            },
          ],
          totalFinal: 2880000,
          prioridad: 'ALTA',
        },
      ] as any,
      ventas: [] as any,
    });
  });

  it('debe renderizar el tablero kanban con sus columnas de bodega iniciales', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    expect(screen.getByText('Picking, Packing & Despachos B2B')).toBeInTheDocument();
    expect(screen.getByText('Por Alistar')).toBeInTheDocument();
    expect(screen.getByText('En Fileteo & Corte')).toBeInTheDocument();
    expect(screen.getByText('Pesaje & Packing Báscula')).toBeInTheDocument();

    // Pedidos presentes
    expect(screen.getByText('Restaurante Mar y Sabor')).toBeInTheDocument();
    expect(screen.getByText('Hotel Dann Carlton')).toBeInTheDocument();
  });

  it('debe mostrar los tags de SLA OTIF en las tarjetas', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    // El Hotel Dann Carlton tiene prioridad alta / 60 kg -> RUTA PRIORITARIA AM
    expect(screen.getByText('RUTA PRIORITARIA AM')).toBeInTheDocument();
    // El Restaurante Mar y Sabor -> OTIF ON-TRACK
    expect(screen.getByText('OTIF ON-TRACK')).toBeInTheDocument();
  });

  it('debe filtrar pedidos en tiempo real por el buscador', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/buscar por cliente, pedido/i);
    fireEvent.change(searchInput, { target: { value: 'Dann Carlton' } });

    expect(screen.getByText('Hotel Dann Carlton')).toBeInTheDocument();
    expect(screen.queryByText('Restaurante Mar y Sabor')).not.toBeInTheDocument();
  });

  it('debe permitir cambiar a la pestaña de Despachos & Remisiones WMS', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const despachoTab = screen.getByRole('button', { name: /2\. Despachos/i });
    fireEvent.click(despachoTab);

    // Debe mostrar columnas de despacho
    expect(screen.getByText('Listos para Despacho')).toBeInTheDocument();
    expect(screen.getByText('En Ruta / Despachados')).toBeInTheDocument();
    expect(screen.getByText('Entregados en Destino')).toBeInTheDocument();
  });

  it('debe permitir avanzar una orden mediante el botón directo de avance táctil', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    // El pedido PED-101 está en "Por Alistar", debe tener el botón "A Fileteo"
    const advanceBtn = screen.getByRole('button', { name: /a fileteo/i });
    expect(advanceBtn).toBeInTheDocument();

    fireEvent.click(advanceBtn);

    // El estado del pedido se actualiza
    const updatedQuotation = useOrderStore.getState().quotations.find((q: any) => q.id === 'quote-101');
    expect(updatedQuotation?.estado).toBe('EN_FILETEO');
  });
});
