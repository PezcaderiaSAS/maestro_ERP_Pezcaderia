import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOtifMetrics } from '../hooks/useOtifMetrics';
import { deliveryRouteService, DeliveryRouteRecord } from '../services/deliveryRouteService';
import { otifCsvExporter } from '../services/otifCsvExporter';

describe('useOtifMetrics Hook — Orquestador Reactivo de Métricas Logísticas OTIF (TASK-026-03)', () => {
  const mockRutas: DeliveryRouteRecord[] = [
    {
      id: 'ROUTE-001',
      numeroManifiesto: 'MAN-20261022-001',
      conductorId: 'COND-01',
      conductorNombre: 'Carlos Gómez',
      vehiculoPlaca: 'ABC-123',
      zonaRuta: 'Zona Norte',
      estado: 'LIQUIDADA',
      totalPedidos: 2,
      totalPesoKg: 50,
      totalFacturadoEsperado: 450000,
      totalRecaudadoEfectivo: 200000,
      totalRecaudadoDigital: 250000,
      totalCreditoFirmado: 0,
      totalDevolucionesMonto: 0,
      totalGastosRuta: 20000,
      efectivoNetoEntregado: 180000,
      diferenciaCuadre: 0,
      pedidos: [
        {
          id: 'PED-1',
          pedidoId: 'PED-1',
          numeroPedido: 'PED-101',
          clienteId: 'CLI-A',
          clienteNombre: 'Restaurante Marino',
          clienteDireccion: 'Calle 100 # 15-20',
          montoPedidoOriginal: 200000,
          montoCobradoFinal: 200000,
          formaPago: 'EFECTIVO',
          montoEfectivo: 200000,
          montoDigital: 0,
          estadoEntrega: 'ENTREGADO_TOTAL',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'MANANA',
          horaEntrega: '2026-10-22T10:30:00Z',
          horaLlegadaEnSitio: '2026-10-22T10:15:00Z',
          horaEntregaEfectiva: '2026-10-22T10:30:00Z',
          tiempoTransitoMinutos: 30,
          tiempoAtencionMinutos: 15,
        },
        {
          id: 'PED-2',
          pedidoId: 'PED-2',
          numeroPedido: 'PED-102',
          clienteId: 'CLI-B',
          clienteNombre: 'Hotel Pez Dorado',
          clienteDireccion: 'Carrera 7 # 72-10',
          montoPedidoOriginal: 250000,
          montoCobradoFinal: 250000,
          formaPago: 'TRANSFERENCIA_DIGITAL',
          montoEfectivo: 0,
          montoDigital: 250000,
          estadoEntrega: 'ENTREGADO_TOTAL',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'TARDE',
          horaEntrega: '2026-10-22T16:00:00Z',
          horaLlegadaEnSitio: '2026-10-22T15:45:00Z',
          horaEntregaEfectiva: '2026-10-22T16:00:00Z',
          tiempoTransitoMinutos: 45,
          tiempoAtencionMinutos: 15,
        },
      ],
      gastos: [],
      devolucionesGlobales: [],
      creadoEn: '2026-10-22T06:00:00Z',
      salidaEn: '2026-10-22T07:00:00Z',
      liquidadoEn: '2026-10-22T17:00:00Z',
      temperaturaSalidaCelsius: 2.5,
      temperaturaRetornoCelsius: 3.2,
    },
    {
      id: 'ROUTE-002',
      numeroManifiesto: 'MAN-20261022-002',
      conductorId: 'COND-02',
      conductorNombre: 'María Rodríguez',
      vehiculoPlaca: 'XYZ-789',
      zonaRuta: 'Zona Sur',
      estado: 'LIQUIDADA',
      totalPedidos: 1,
      totalPesoKg: 30,
      totalFacturadoEsperado: 150000,
      totalRecaudadoEfectivo: 100000,
      totalRecaudadoDigital: 0,
      totalCreditoFirmado: 0,
      totalDevolucionesMonto: 50000,
      totalGastosRuta: 0,
      efectivoNetoEntregado: 100000,
      diferenciaCuadre: 0,
      pedidos: [
        {
          id: 'PED-3',
          pedidoId: 'PED-3',
          numeroPedido: 'PED-103',
          clienteId: 'CLI-C',
          clienteNombre: 'Cevichería Central',
          clienteDireccion: 'Calle 1 # 10-05',
          montoPedidoOriginal: 150000,
          montoCobradoFinal: 100000,
          formaPago: 'EFECTIVO',
          montoEfectivo: 100000,
          montoDigital: 0,
          estadoEntrega: 'ENTREGADO_PARCIAL',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'MANANA',
          horaEntrega: '2026-10-22T14:00:00Z', // Retrasado (> 12:15)
          horaLlegadaEnSitio: '2026-10-22T13:45:00Z',
          horaEntregaEfectiva: '2026-10-22T14:00:00Z',
          devoluciones: [
            {
              productoId: 'PROD-CAM-01',
              sku: 'CAM-01',
              nombre: 'Camarón',
              precioUnitario: 25000,
              cantidadDevueltaKg: 2,
              montoDescontado: 50000,
              motivoRechazo: 'CADENA_FRIO',
              destinoBodega: 'CUARENTENA_CALIDAD',
            },
          ],
        },
      ],
      gastos: [],
      devolucionesGlobales: [],
      creadoEn: '2026-10-22T08:00:00Z',
      salidaEn: '2026-10-22T08:30:00Z',
      liquidadoEn: '2026-10-22T15:00:00Z',
      temperaturaSalidaCelsius: 5.5, // Alerta cadena de frío
      temperaturaRetornoCelsius: 6.0,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(deliveryRouteService, 'obtenerManifiestos').mockReturnValue(mockRutas);
  });

  it('debe inicializarse con filtros válidos y calcular KPIs en memoria correctamente', () => {
    const { result } = renderHook(() =>
      useOtifMetrics({
        filtrosIniciales: {
          fechaDesde: '2026-10-22',
          fechaHasta: '2026-10-22',
        },
      })
    );

    expect(result.current.filtros.fechaDesde).toBe('2026-10-22');
    expect(result.current.filtros.fechaHasta).toBe('2026-10-22');
    expect(result.current.kpis.totalDespachos).toBe(2);
    expect(result.current.kpis.totalEntregas).toBe(3);
    expect(result.current.kpis.entregasOtif).toBe(2);
    expect(result.current.kpis.tasaOtifPorcentaje).toBe(66.7);
    expect(result.current.kpis.montoTotalRecaudadoCop).toBe(550000);
  });

  it('debe permitir cambiar presets de fecha (HOY, 7_DIAS, MES)', () => {
    const { result } = renderHook(() => useOtifMetrics());

    act(() => {
      result.current.setPreset('HOY');
    });
    expect(result.current.presetActivo).toBe('HOY');

    act(() => {
      result.current.setPreset('7_DIAS');
    });
    expect(result.current.presetActivo).toBe('7_DIAS');

    act(() => {
      result.current.setPreset('MES');
    });
    expect(result.current.presetActivo).toBe('MES');
  });

  it('debe filtrar reactivamente por conductorId recalculando el scorecard y paradas', () => {
    const { result } = renderHook(() =>
      useOtifMetrics({
        filtrosIniciales: {
          fechaDesde: '2026-10-22',
          fechaHasta: '2026-10-22',
        },
      })
    );

    act(() => {
      result.current.actualizarFiltro('conductorId', 'COND-01');
    });

    expect(result.current.filtros.conductorId).toBe('COND-01');
    expect(result.current.paradas.length).toBe(2);
    expect(result.current.paradas.every((p) => p.conductorId === 'COND-01')).toBe(true);
    expect(result.current.kpis.totalEntregas).toBe(2);
    expect(result.current.kpis.tasaOtifPorcentaje).toBe(100);
  });

  it('debe filtrar reactivamente por zonaRuta', () => {
    const { result } = renderHook(() =>
      useOtifMetrics({
        filtrosIniciales: {
          fechaDesde: '2026-10-22',
          fechaHasta: '2026-10-22',
        },
      })
    );

    act(() => {
      result.current.actualizarFiltro('zonaRuta', 'Zona Sur');
    });

    expect(result.current.paradas.length).toBe(1);
    expect(result.current.paradas[0].zonaRuta).toBe('Zona Sur');
    expect(result.current.kpis.entregasOtif).toBe(0);
    expect(result.current.kpis.tasaOtifPorcentaje).toBe(0);
  });

  it('debe exponer listas deduplicadas de conductores y zonas para controles UI', () => {
    const { result } = renderHook(() => useOtifMetrics());

    expect(result.current.conductoresDisponibles).toEqual([
      { id: 'COND-01', nombre: 'Carlos Gómez' },
      { id: 'COND-02', nombre: 'María Rodríguez' },
    ]);

    expect(result.current.zonasDisponibles).toEqual(['Zona Norte', 'Zona Sur']);
  });

  it('debe permitir limpiar filtros regresando al estado inicial sin romper la reactividad', () => {
    const { result } = renderHook(() =>
      useOtifMetrics({
        filtrosIniciales: {
          fechaDesde: '2026-10-22',
          fechaHasta: '2026-10-22',
          conductorId: 'COND-01',
        },
      })
    );

    expect(result.current.filtros.conductorId).toBe('COND-01');

    act(() => {
      result.current.limpiarFiltros();
    });

    expect(result.current.filtros.conductorId).toBeUndefined();
    expect(result.current.filtros.zonaRuta).toBeUndefined();
    expect(result.current.kpis.totalEntregas).toBe(3);
  });

  it('debe invocar la exportación CSV a través de otifCsvExporter', () => {
    const spyExport = vi.spyOn(otifCsvExporter, 'descargarExcelCsv').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useOtifMetrics({
        filtrosIniciales: {
          fechaDesde: '2026-10-22',
          fechaHasta: '2026-10-22',
        },
      })
    );

    act(() => {
      const outcome = result.current.exportarReporteCsv('metricas-otif-test.csv');
      expect(outcome.success).toBe(true);
      expect(outcome.lineasExportadas).toBe(3);
    });

    expect(spyExport).toHaveBeenCalledTimes(1);
  });
});
