import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OtifDashboardView } from '../views/logistics/OtifDashboardView';
import { deliveryRouteService, DeliveryRouteRecord } from '../services/deliveryRouteService';
import { otifCsvExporter } from '../services/otifCsvExporter';

describe('OtifDashboardView — Vista Principal de Métricas Logísticas (TASK-026-05)', () => {
  const mockRutas: DeliveryRouteRecord[] = [
    {
      id: 'ROUTE-01',
      numeroManifiesto: 'MAN-2026-10-001',
      conductorId: 'COND-01',
      conductorNombre: 'Carlos Gómez',
      conductorTelefono: '3001234567',
      vehiculoPlaca: 'ABC-123',
      zonaRuta: 'Zona Norte',
      estado: 'LIQUIDADA',
      totalPedidos: 1,
      totalPesoKg: 20,
      totalFacturadoEsperado: 350000,
      totalRecaudadoEfectivo: 350000,
      totalRecaudadoDigital: 0,
      totalCreditoFirmado: 0,
      totalDevolucionesMonto: 0,
      totalGastosRuta: 0,
      efectivoNetoEntregado: 350000,
      diferenciaCuadre: 0,
      pedidos: [
        {
          id: 'STOP-01',
          pedidoId: 'PED-01',
          numeroPedido: 'PED-2026-001',
          clienteId: 'CLI-01',
          clienteNombre: 'Restaurante Bahía',
          clienteDireccion: 'Calle 100 # 15-20',
          montoPedidoOriginal: 350000,
          montoCobradoFinal: 350000,
          formaPago: 'EFECTIVO',
          montoEfectivo: 350000,
          montoDigital: 0,
          estadoEntrega: 'ENTREGADO_TOTAL',
          fechaRequeridaEntrega: '2026-10-23',
          jornadaRequerida: 'MANANA',
          horaEntrega: '2026-10-23T10:30:00Z',
          horaLlegadaEnSitio: '2026-10-23T10:15:00Z',
          horaEntregaEfectiva: '2026-10-23T10:30:00Z',
          tiempoTransitoMinutos: 30,
          tiempoAtencionMinutos: 15,
        },
      ],
      gastos: [],
      devolucionesGlobales: [],
      creadoEn: '2026-10-23T07:00:00Z',
      salidaEn: '2026-10-23T08:00:00Z',
      liquidadoEn: '2026-10-23T13:00:00Z',
      temperaturaSalidaCelsius: 3.5,
      temperaturaRetornoCelsius: 3.8,
    },
  ];

  it('debe renderizar el encabezado y componentes principales del dashboard', () => {
    vi.spyOn(deliveryRouteService, 'obtenerManifiestos').mockReturnValue(mockRutas);

    render(<OtifDashboardView />);

    expect(screen.getByText(/Métricas Logísticas & OTIF B2B/i)).toBeDefined();
    expect(screen.getByText(/Control de On-Time \(A Tiempo\), In-Full \(Completo\)/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Vista Integral/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Conductores/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Detalle Paradas/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cadena de Frío/i })).toBeDefined();
  });

  it('debe permitir cambiar de pestaña a Detalle Paradas', () => {
    vi.spyOn(deliveryRouteService, 'obtenerManifiestos').mockReturnValue(mockRutas);

    render(<OtifDashboardView />);

    const tabParadas = screen.getByRole('button', { name: /Detalle Paradas/i });
    fireEvent.click(tabParadas);

    expect(screen.getByText(/Auditoría Detallada de Paradas y Entregas/i)).toBeDefined();
  });

  it('debe disparar la exportación Excel CSV al hacer clic en el botón correspondiente', () => {
    vi.spyOn(deliveryRouteService, 'obtenerManifiestos').mockReturnValue(mockRutas);
    const spyExport = vi.spyOn(otifCsvExporter, 'descargarExcelCsv').mockImplementation(() => {});

    render(<OtifDashboardView />);

    const btnExport = screen.getByRole('button', { name: /Exportar Excel \(CSV\)/i });
    fireEvent.click(btnExport);

    expect(spyExport).toHaveBeenCalledTimes(1);
  });
});
