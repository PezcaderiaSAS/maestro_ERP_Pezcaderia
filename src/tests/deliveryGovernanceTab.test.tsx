import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeliveryGovernanceTab } from '../views/inventory/components/DeliveryGovernanceTab';
import { deliveryRouteService } from '../services/deliveryRouteService';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true })),
  },
}));

describe('CARD-012-07: DeliveryGovernanceTab Suite (Métricas OTIF & Auditoría Enterprise)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    const hoy = new Date().toISOString().slice(0, 10);
    const res = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Wilson Gómez',
        conductorTelefono: '3109876543',
        vehiculoPlaca: 'TRK-982',
        vehiculoTipo: 'Furgón Refrigerado Hino',
        zonaRuta: 'Cabecera del Llano',
        kilometrajeInicial: 12500,
        temperaturaSalidaCelsius: -18,
        pedidosIds: ['PED-201', 'PED-202'],
      },
      [
        {
          id: 'PED-201',
          numeroPedido: 'PED-201',
          clienteNombre: 'Restaurante Gourmet',
          clienteDireccion: 'Calle 48 # 28-12',
          fechaEntrega: hoy,
          jornada: 'AM',
          totalNeto: 450000,
          items: [{ sku: 'ROB-01', nombre: 'Róbalo', cantidad: 10, precioUnitario: 45000 }],
        },
        {
          id: 'PED-202',
          numeroPedido: 'PED-202',
          clienteNombre: 'Cevichería Central',
          clienteDireccion: 'Carrera 33 # 52-19',
          fechaEntrega: hoy,
          jornada: 'AM',
          totalNeto: 250000,
          items: [{ sku: 'CAM-01', nombre: 'Camarón', cantidad: 5, precioUnitario: 50000 }],
        },
      ]
    );

    const m = res.data!;
    deliveryRouteService.confirmarCheckinCarga({
      manifiestoId: m.id,
      temperaturaSalidaCelsius: -18,
      pedidosConfirmados: ['PED-201', 'PED-202'],
      observacionesCarga: 'Cadena de frío óptima',
    });

    // Pedido 201: Llegada rápida, entrega A_TIEMPO (tránsito 20 min, atención 15 min)
    deliveryRouteService.registrarLlegadaEnSitio({
      manifiestoId: m.id,
      pedidoId: 'PED-201',
      horaLlegada: new Date().toISOString(),
    });

    deliveryRouteService.registrarEntregaPedido({
      manifiestoId: m.id,
      pedidoId: 'PED-201',
      estadoEntrega: 'ENTREGADO_TOTAL',
      formaPago: 'EFECTIVO',
      montoOriginal: 450000,
      montoCobradoFinal: 450000,
      montoEfectivo: 450000,
      montoDigital: 0,
      firmaClienteUrl: 'data:image/svg+xml;base64,firma1',
    });

    // Pedido 202: Incidencia y entrega con devolución
    deliveryRouteService.registrarIncidenciaRuta({
      manifiestoId: m.id,
      pedidoId: 'PED-202',
      tipoIncidencia: 'TRAFICO_BLOQUEO',
      descripcion: 'Congestión vehicular en puente La Flora',
      horaReporte: new Date().toISOString(),
    });

    deliveryRouteService.registrarEntregaPedido({
      manifiestoId: m.id,
      pedidoId: 'PED-202',
      estadoEntrega: 'ENTREGADO_PARCIAL',
      formaPago: 'TRANSFERENCIA_DIGITAL',
      montoOriginal: 250000,
      montoCobradoFinal: 150000,
      montoEfectivo: 0,
      montoDigital: 150000,
      referenciaDigital: 'NEQUI-889922',
      firmaClienteUrl: 'data:image/svg+xml;base64,firma2',
      devoluciones: [
        {
          productoId: 'CAM-01',
          sku: 'CAM-01',
          nombre: 'Camarón',
          cantidadDevueltaKg: 2.0,
          precioUnitario: 50000,
          montoDescontado: 100000,
          motivoRechazo: 'CADENA_FRIO',
          destinoBodega: 'CUARENTENA_CALIDAD',
        },
      ],
    });
  });

  it('1. Debe renderizar los 4 KPI cards de gobernanza con métricas calculadas', () => {
    render(<DeliveryGovernanceTab />);

    // Header y título
    expect(screen.getByText(/Gobernanza de Entregas & Auditoría OTIF/i)).toBeInTheDocument();

    // KPI 1: OTIF
    expect(screen.getByText(/Cumplimiento OTIF/i)).toBeInTheDocument();
    expect(screen.getByText(/100%/i)).toBeInTheDocument();

    // KPI 2: Tiempos de ciclo
    expect(screen.getByText(/Tiempos de Ciclo Promedio/i)).toBeInTheDocument();

    // KPI 3: Devoluciones
    expect(screen.getByText(/Devoluciones en Cuarentena/i)).toBeInTheDocument();
    expect(screen.getByText(/100\.000/i)).toBeInTheDocument();

    // KPI 4: Eventualidades
    expect(screen.getByText(/Eventualidades en Ruta/i)).toBeInTheDocument();
  });

  it('2. Debe listar los registros de auditoría de pedidos en la tabla', () => {
    render(<DeliveryGovernanceTab />);

    expect(screen.getByText('#PED-201')).toBeInTheDocument();
    expect(screen.getByText('Restaurante Gourmet')).toBeInTheDocument();

    expect(screen.getByText('#PED-202')).toBeInTheDocument();
    expect(screen.getByText('Cevichería Central')).toBeInTheDocument();
  });

  it('3. Debe filtrar reactivamente por término de búsqueda (cliente, pedido, conductor)', () => {
    render(<DeliveryGovernanceTab />);

    const searchInput = screen.getByPlaceholderText(/Buscar por cliente, conductor o pedido/i);
    fireEvent.change(searchInput, { target: { value: 'Gourmet' } });

    expect(screen.getByText('#PED-201')).toBeInTheDocument();
    expect(screen.queryByText('#PED-202')).not.toBeInTheDocument();
  });

  it('4. Debe disparar la exportación a Excel / CSV al hacer clic en el botón', () => {
    // Mock de descarga en DOM
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DeliveryGovernanceTab />);

    const exportBtn = screen.getByRole('button', { name: /Exportar a Excel \/ CSV/i });
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});
