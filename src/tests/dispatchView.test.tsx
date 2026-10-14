import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DispatchView } from '../views/inventory/DispatchView';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { useClientStore } from '../store/useClientStore';
import { deliveryRouteService } from '../services/deliveryRouteService';
import { routeManifestPdfService } from '../services/routeManifestPdfService';

describe('DispatchView & Route Manifest Suite (CARD-012-04)', () => {
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

    useClientStore.setState({
      clientes: [
        {
          id: 'cli-1',
          nombre: 'Restaurante El Ancla',
          direccion: 'Carrera 35 # 48-12, Bucaramanga',
          telefono: '3109876543',
        },
        {
          id: 'cli-2',
          nombre: 'Cevichería del Puerto',
          direccion: 'Calle 15 # 22-04, Floridablanca',
          telefono: '3151234567',
        },
      ] as any,
    });

    useOrderStore.setState({
      ventas: [
        {
          id: 'v-001',
          numeroPedido: 'PED-001',
          clienteId: 'cli-1',
          estado: 'LISTO',
          fechaEntrega: '2026-10-14T10:00:00Z',
          totalFinal: 850000,
          lineas: [
            { productoId: 'prod-1', cantidadSolicitada: 15, pesoReal: 15, precioPactado: 35000 },
          ],
        },
      ] as any,
      quotations: [
        {
          id: 'q-002',
          numeroPedido: 'PED-002',
          clienteId: 'cli-2',
          estado: 'LISTO',
          fechaEntrega: '2026-10-14T11:00:00Z',
          totalFinal: 1200000,
          lineas: [
            { productoId: 'prod-2', cantidadSolicitada: 30, pesoReal: 30, precioPactado: 40000 },
          ],
        },
      ] as any,
    });
  });

  it('debe renderizar el encabezado y las 4 pestañas de la Torre de Control', () => {
    render(<DispatchView />);

    expect(screen.getByText('Centro de Despachos & Gobernanza de Rutas')).toBeInTheDocument();
    expect(screen.getByText('Pedidos Listos')).toBeInTheDocument();
    expect(screen.getByText('Rutas en Curso')).toBeInTheDocument();
    expect(screen.getByText('Rutas Liquidadas')).toBeInTheDocument();
    expect(screen.getByText('Gobernanza & OTIF')).toBeInTheDocument();
  });

  it('debe mostrar los pedidos listos unificados de ventas y cotizaciones aprobadas', () => {
    render(<DispatchView />);

    expect(screen.getByText('#PED-001')).toBeInTheDocument();
    expect(screen.getByText('Restaurante El Ancla')).toBeInTheDocument();
    expect(screen.getByText('#PED-002')).toBeInTheDocument();
    expect(screen.getByText('Cevichería del Puerto')).toBeInTheDocument();
  });

  it('debe filtrar pedidos en tiempo real por número de pedido o nombre de cliente', () => {
    render(<DispatchView />);

    const searchInput = screen.getByPlaceholderText('Buscar pedido o cliente...');
    fireEvent.change(searchInput, { target: { value: 'Ancla' } });

    expect(screen.getByText('Restaurante El Ancla')).toBeInTheDocument();
    expect(screen.queryByText('Cevichería del Puerto')).not.toBeInTheDocument();
  });

  it('debe mostrar las rutas activas con botones táctiles y permitir la descarga del PDF de Hoja de Ruta', () => {
    // Creamos un manifiesto ficticio
    const res = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Mendoza',
        conductorTelefono: '3104567890',
        vehiculoPlaca: 'WOP-482',
        zonaRuta: 'Cabecera & Cañaveral',
        pedidosIds: ['v-001'],
      },
      [
        {
          id: 'v-001',
          numeroPedido: 'PED-001',
          clienteId: 'cli-1',
          clienteNombre: 'Restaurante El Ancla',
          clienteDireccion: 'Carrera 35 # 48-12',
          total: 850000,
          items: [{ sku: 'ROB-01', cantidad: 15, precioUnitario: 35000 }],
        },
      ]
    );

    expect(res.success).toBe(true);

    render(<DispatchView />);

    // Cambiar a la pestaña de Rutas en Curso
    const rutasActivasTab = screen.getByRole('button', { name: /Rutas en Curso/i });
    fireEvent.click(rutasActivasTab);

    expect(screen.getByText(/Carlos Mendoza/i)).toBeInTheDocument();
    expect(screen.getByText('WOP-482')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Imprimir Ruta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portal Conductor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Liquidar Ruta/i })).toBeInTheDocument();

    // Verificamos que el servicio de generación de PDF genera el documento válido
    const pdfDoc = routeManifestPdfService.generarManifiestoPDF(res.data!);
    expect(pdfDoc).toBeDefined();
    expect(pdfDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('debe abrir el modal RouteManifestBuilderModal al presionar Nueva Hoja de Ruta', () => {
    render(<DispatchView />);

    const nuevoBtn = screen.getByRole('button', { name: /\+ Nueva Hoja de Ruta/i });
    fireEvent.click(nuevoBtn);

    expect(screen.getByText('Planificador de Manifiesto de Ruta')).toBeInTheDocument();
    expect(screen.getByText('Vehículo de Entrega')).toBeInTheDocument();
    expect(screen.getByText('Capacidad Ocupada')).toBeInTheDocument();
  });
});
