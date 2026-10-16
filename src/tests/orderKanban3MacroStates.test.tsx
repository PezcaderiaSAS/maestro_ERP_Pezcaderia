import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderKanbanView from '../views/OrderKanbanView';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';

describe('OrderKanbanView - 3 Macro-Estados Operativos (TASK-018-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

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
          id: 'order-wms-1',
          numeroPedido: 'PED-WMS-001',
          clientName: 'Restaurante El Ancla',
          estado: 'CREADO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-1',
              nombre: 'Filete de Corvina',
              sku: 'CORV-001',
              cantidadSolicitada: 10,
              precioPactado: 40000,
            },
          ],
          totalFinal: 400000,
        },
        {
          id: 'order-wms-2',
          numeroPedido: 'PED-WMS-002',
          clientName: 'Marisquería Bahía Azul',
          estado: 'EN_FILETEO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-2',
              nombre: 'Salmón Premium',
              sku: 'SALM-001',
              cantidadSolicitada: 25,
              precioPactado: 55000,
            },
          ],
          totalFinal: 1375000,
          prioridad: 'ALTA',
        },
        {
          id: 'order-wms-3',
          numeroPedido: 'PED-WMS-003',
          clientName: 'Club Náutico',
          estado: 'LISTO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-3',
              nombre: 'Camarón Jumbo',
              sku: 'CAM-001',
              cantidadSolicitada: 15,
              pesoReal: 15,
              precioPactado: 60000,
            },
          ],
          totalFinal: 900000,
        },
        {
          id: 'order-wms-4',
          numeroPedido: 'PED-WMS-004',
          clientName: 'Hotel Hilton Cartagena',
          estado: 'EN_DESPACHO',
          fecha: '2026-10-16',
          remisionWmsNumero: 'REM-WMS-9090',
          lineas: [
            {
              id: 'l-4',
              nombre: 'Langosta del Caribe',
              sku: 'LANG-001',
              cantidadSolicitada: 8,
              pesoReal: 8,
              precioPactado: 120000,
            },
          ],
          totalFinal: 960000,
        },
        {
          id: 'order-wms-5',
          numeroPedido: 'PED-WMS-005',
          clientName: 'Bistro del Pescador',
          estado: 'ENTREGADO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-5',
              nombre: 'Pulpo Gallego',
              sku: 'PULP-001',
              cantidadSolicitada: 12,
              pesoReal: 12,
              precioPactado: 75000,
            },
          ],
          totalFinal: 900000,
        },
      ] as any,
      ventas: [] as any,
    });
  });

  it('debe renderizar la pestaña Flujo Táctil (3 Pasos) con data-testid="tab-tactil-3-pasos"', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const tactilTabBtn = screen.getByTestId('tab-tactil-3-pasos');
    expect(tactilTabBtn).toBeInTheDocument();
    expect(tactilTabBtn.className).toContain('min-h-[48px]');
  });

  it('debe conmutar al modo 3 macro-estados al hacer clic en la pestaña táctil', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const tactilTabBtn = screen.getByTestId('tab-tactil-3-pasos');
    fireEvent.click(tactilTabBtn);

    // Debe renderizar exactamente los 3 títulos canónicos de macro-estados
    expect(screen.getByText('1. Preparación WMS')).toBeInTheDocument();
    expect(screen.getByText('2. En Ruta de Entrega')).toBeInTheDocument();
    expect(screen.getByText('3. Entregado / Liquidado')).toBeInTheDocument();
  });

  it('debe agrupar pedidos correctamente en las 3 macro-columnas', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const tactilTabBtn = screen.getByTestId('tab-tactil-3-pasos');
    fireEvent.click(tactilTabBtn);

    // En "1. Preparación WMS" deben estar CREADO (El Ancla) y EN_FILETEO (Bahía Azul)
    expect(screen.getByText('Restaurante El Ancla')).toBeInTheDocument();
    expect(screen.getByText('Marisquería Bahía Azul')).toBeInTheDocument();

    // En "2. En Ruta de Entrega" deben estar LISTO (Club Náutico) y EN_DESPACHO (Hilton Cartagena)
    expect(screen.getByText('Club Náutico')).toBeInTheDocument();
    expect(screen.getByText('Hotel Hilton Cartagena')).toBeInTheDocument();

    // En "3. Entregado / Liquidado" debe estar ENTREGADO (Bistro del Pescador)
    expect(screen.getByText('Bistro del Pescador')).toBeInTheDocument();
  });

  it('debe renderizar botones ergonómicos de avance táctil con altura mínima de 48px', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const tactilTabBtn = screen.getByTestId('tab-tactil-3-pasos');
    fireEvent.click(tactilTabBtn);

    // Botones de acción táctil en preparación
    const btnPesar = screen.getByTestId('tactil-pesar-order-wms-1');
    const btnAvanzarRuta = screen.getByTestId('tactil-advance-despacho-order-wms-1');

    expect(btnPesar).toBeInTheDocument();
    expect(btnPesar.className).toContain('min-h-[48px]');
    expect(btnAvanzarRuta).toBeInTheDocument();
    expect(btnAvanzarRuta.className).toContain('min-h-[48px]');

    // Botón en pedido en ruta (Hotel Hilton)
    const btnMarcarEntregado = screen.getByTestId('tactil-advance-entregado-order-wms-4');
    expect(btnMarcarEntregado).toBeInTheDocument();
    expect(btnMarcarEntregado.className).toContain('min-h-[48px]');
  });

  it('debe permitir avanzar un pedido en ruta hacia Entregado al hacer clic en el botón táctil', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const tactilTabBtn = screen.getByTestId('tab-tactil-3-pasos');
    fireEvent.click(tactilTabBtn);

    const btnMarcarEntregado = screen.getByTestId('tactil-advance-entregado-order-wms-4');
    fireEvent.click(btnMarcarEntregado);

    const updatedOrder = useOrderStore.getState().quotations.find((q: any) => q.id === 'order-wms-4');
    expect(updatedOrder?.estado).toBe('ENTREGADO');
  });

  it('debe verificar que los chips de filtro rápido tengan altura ergonómica táctil >= 48px', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const chipTodos = screen.getByTestId('filter-chip-todos');
    const chipUrgentes = screen.getByTestId('filter-chip-urgentes');
    const chipCatchWeight = screen.getByTestId('filter-chip-catch_weight');
    const chipPausados = screen.getByTestId('filter-chip-pausados');

    expect(chipTodos.className).toContain('min-h-[48px]');
    expect(chipUrgentes.className).toContain('min-h-[48px]');
    expect(chipCatchWeight.className).toContain('min-h-[48px]');
    expect(chipPausados.className).toContain('min-h-[48px]');

    // Filtrar por Urgentes
    fireEvent.click(chipUrgentes);
    expect(screen.getByText('Marisquería Bahía Azul')).toBeInTheDocument();
  });
});
