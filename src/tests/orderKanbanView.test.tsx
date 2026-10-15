import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderKanbanView from '../views/OrderKanbanView';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { deliveryRouteService } from '../services/deliveryRouteService';

describe('OrderKanbanView Suite (Paso 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

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
        {
          id: 'quote-103',
          numeroPedido: 'PED-103',
          clientName: 'Pescadería del Mar',
          estado: 'LISTO',
          fecha: '2026-09-30',
          lineas: [
            {
              id: 'l-3',
              nombre: 'Camarón Tigre',
              sku: 'CAM-003',
              cantidadSolicitada: 20,
              pesoReal: 20,
              precioPactado: 50000,
            },
          ],
          totalFinal: 1000000,
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
    expect(screen.getByText('Pescadería del Mar')).toBeInTheDocument();
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

  it('debe permitir seleccionar pedidos listos en Despachos y mostrar la barra contextual con kilos y COP', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    // Cambiar a pestaña Despacho
    const despachoTab = screen.getByRole('button', { name: /2\. Despachos/i });
    fireEvent.click(despachoTab);

    // Encontrar el checkbox del pedido listo PED-103
    const checkbox = screen.getByTestId('checkbox-select-quote-103');
    expect(checkbox).toBeInTheDocument();

    // Seleccionar
    fireEvent.click(checkbox);

    // Debe aparecer la barra flotante con kilos y COP
    expect(screen.getByText((content) => content.includes('1 pedidos listos seleccionados'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('20.0 kg totales'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('1.000.000 COP'))).toBeInTheDocument();
  });

  it('debe sincronizar reactivamente un pedido a ENTREGADO cuando deliveryRouteService registra entrega', async () => {
    // Configuramos un pedido en EN_DESPACHO
    useOrderStore.setState({
      quotations: [
        {
          id: 'quote-200',
          numeroPedido: 'PED-200',
          clientName: 'Cevichería Central',
          estado: 'EN_DESPACHO',
          fecha: '2026-09-30',
          lineas: [],
          totalFinal: 450000,
        },
      ] as any,
      ventas: [] as any,
    });

    // Creamos un manifiesto ficticio donde el pedido está ENTREGADO_TOTAL
    const res = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Ruiz',
        conductorTelefono: '3101234567',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Bogotá Norte',
        pedidosIds: ['quote-200'],
      },
      [
        {
          id: 'quote-200',
          numeroPedido: 'PED-200',
          clienteId: 'cli-99',
          clienteNombre: 'Cevichería Central',
          clienteDireccion: 'Calle 100 # 15-20',
          total: 450000,
          items: [{ sku: 'PROD-1', cantidad: 15, precioUnitario: 30000 }],
        },
      ]
    );

    const manifiesto = res.data!;
    deliveryRouteService.iniciarRuta(manifiesto.id);
    const regRes = deliveryRouteService.registrarEntregaPedido({
      manifiestoId: manifiesto.id,
      pedidoId: 'quote-200',
      estadoEntrega: 'ENTREGADO_TOTAL',
      formaPago: 'EFECTIVO',
      montoOriginal: 450000,
      montoCobradoFinal: 450000,
      montoEfectivo: 450000,
      montoDigital: 0,
      firmaClienteUrl: 'data:image/png;base64,mockSign',
    });
    expect(regRes.success).toBe(true);

    // Renderizamos el componente
    render(<OrderKanbanView onEditOrder={() => {}} />);

    // El pedido debe haber sido promovido reactivamente a ENTREGADO
    await waitFor(() => {
      const qActualizado = useOrderStore.getState().quotations.find((q: any) => q.id === 'quote-200');
      expect(qActualizado?.estado).toBe('ENTREGADO');
      expect(qActualizado?.firmaClienteUrl).toBe('data:image/png;base64,mockSign');
    });
  });

  it('debe mostrar los badges de trazabilidad tripartita (Vendedor, Alistador, Conductor) y semáforo catch weight', () => {
    useOrderStore.setState({
      quotations: [
        {
          id: 'quote-301',
          numeroPedido: 'PED-301',
          clientName: 'Restaurante El Pescador',
          estado: 'EN_PESAJE',
          fecha: '2026-10-15',
          vendedorNombre: 'Camilo Vendedor',
          operarioAlistadorNombre: 'Pedro Alistador',
          conductorRepartidorNombre: 'Hernan Conductor',
          lineas: [
            {
              id: 'l-301',
              nombre: 'Pargo Rojo',
              sku: 'PAR-001',
              pesoNominalKg: 10,
              pesoReal: 10.3, // Variación +3% (en tolerancia ±5%)
              precioPactado: 40000,
            },
          ],
          totalFinal: 412000,
        },
      ] as any,
      ventas: [] as any,
    });

    render(<OrderKanbanView onEditOrder={() => {}} />);

    // Verificar insignias de los 3 actores
    expect(screen.getByText(/V: Camilo Vendedor/i)).toBeInTheDocument();
    expect(screen.getByText(/A: Pedro Alistador/i)).toBeInTheDocument();
    expect(screen.getByText(/C: Hernan Conductor/i)).toBeInTheDocument();

    // Verificar semáforo de tolerancia (en tolerancia +3%)
    expect(screen.getByText(/\+3%/i)).toBeInTheDocument();
    expect(screen.getByText(/Nom: 10.0k/i)).toBeInTheDocument();
    expect(screen.getByText(/Real: 10.3k/i)).toBeInTheDocument();
  });

  it('debe contar con botones de acción ergonómicos con clase min-h-[48px] y touch-manipulation', () => {
    render(<OrderKanbanView onEditOrder={() => {}} />);

    const advanceBtn = screen.getByRole('button', { name: /a fileteo/i });
    expect(advanceBtn).toHaveClass('min-h-[48px]');
    expect(advanceBtn).toHaveClass('touch-manipulation');
  });
});
