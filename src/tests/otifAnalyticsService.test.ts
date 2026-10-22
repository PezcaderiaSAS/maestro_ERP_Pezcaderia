import { describe, it, expect } from 'vitest';
import { otifAnalyticsService } from '../services/otifAnalyticsService';
import { otifCsvExporter } from '../services/otifCsvExporter';
import type { DeliveryRouteRecord } from '../services/deliveryRouteService';
import type { OtifFilterParams } from '../types/otif.types';

describe('TASK-026-02: Motor Analítico Determinista OTIF y Exportador Excel CSV', () => {
  const mockManifiestos: DeliveryRouteRecord[] = [
    {
      id: 'MAN-001',
      numeroManifiesto: 'MAN-2026-001',
      conductorId: 'COND-01',
      conductorNombre: 'Carlos Gómez',
      vehiculoPlaca: 'XTR-892',
      zonaRuta: 'CABECERA',
      estado: 'LIQUIDADA',
      salidaEn: '2026-10-22T08:00:00.000Z',
      horaRetornoBodega: '2026-10-22T13:00:00.000Z',
      creadoEn: '2026-10-22T06:00:00.000Z',
      temperaturaSalidaCelsius: 2.5,
      gastos: [],
      devolucionesGlobales: [],
      totalPedidos: 4,
      totalPesoKg: 75,
      totalFacturadoEsperado: 1040000,
      totalRecaudadoEfectivo: 470000,
      totalRecaudadoDigital: 500000,
      totalCreditoFirmado: 0,
      totalDevolucionesMonto: 70000,
      totalGastosRuta: 0,
      efectivoNetoEntregado: 470000,
      diferenciaCuadre: 0,
      incidenciasRuta: [],
      pedidos: [
        {
          id: 'STOP-101',
          pedidoId: 'PED-101',
          numeroPedido: 'PED-0101',
          clienteId: 'CLI-01',
          clienteNombre: 'Restaurante Mar y Fuego',
          clienteDireccion: 'Calle 48 # 33-12',
          montoPedidoOriginal: 500000,
          montoCobradoFinal: 500000,
          formaPago: 'TRANSFERENCIA_DIGITAL',
          montoEfectivo: 0,
          montoDigital: 500000,
          fechaCreacionPedido: '2026-10-22T06:00:00.000Z',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'MAÑANA',
          horaLlegadaEnSitio: '2026-10-22T11:10:00.000Z',
          horaEntregaEfectiva: '2026-10-22T11:25:00.000Z', // Pactada 11:30 -> A TIEMPO
          tiempoTransitoMinutos: 25,
          tiempoAtencionMinutos: 15,
          estadoEntrega: 'ENTREGADO_TOTAL',
          ...({ temperaturaEntregaCelsius: 3.1, pesoTotalKg: 20 } as any),
        },
        {
          id: 'STOP-102',
          pedidoId: 'PED-102',
          numeroPedido: 'PED-0102',
          clienteId: 'CLI-02',
          clienteNombre: 'Hotel Bucarica',
          clienteDireccion: 'Cra 19 # 35-02',
          montoPedidoOriginal: 320000,
          montoCobradoFinal: 320000,
          formaPago: 'EFECTIVO',
          montoEfectivo: 320000,
          montoDigital: 0,
          fechaCreacionPedido: '2026-10-22T06:00:00.000Z',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'MAÑANA',
          horaLlegadaEnSitio: '2026-10-22T11:35:00.000Z',
          horaEntregaEfectiva: '2026-10-22T11:42:00.000Z', // Pactada 11:30 + 12 min -> Dentro de los 15 min de gracia -> A TIEMPO
          tiempoTransitoMinutos: 30,
          tiempoAtencionMinutos: 7,
          estadoEntrega: 'ENTREGADO_TOTAL',
          ...({ temperaturaEntregaCelsius: 3.8, pesoTotalKg: 15 } as any),
        },
        {
          id: 'STOP-103',
          pedidoId: 'PED-103',
          numeroPedido: 'PED-0103',
          clienteId: 'CLI-03',
          clienteNombre: 'Pescadería El Puerto',
          clienteDireccion: 'Calle 56 # 28-10',
          montoPedidoOriginal: 0,
          montoCobradoFinal: 0,
          formaPago: 'CREDITO_B2B',
          montoEfectivo: 0,
          montoDigital: 0,
          fechaCreacionPedido: '2026-10-22T06:00:00.000Z',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'MAÑANA',
          horaLlegadaEnSitio: '2026-10-22T11:55:00.000Z',
          horaEntregaEfectiva: '2026-10-22T12:05:00.000Z', // Pactada 11:30 + 35 min -> DEMORADO
          tiempoTransitoMinutos: 40,
          tiempoAtencionMinutos: 10,
          estadoEntrega: 'ENTREGADO_TOTAL',
          ...({ temperaturaEntregaCelsius: 4.8, pesoTotalKg: 30 } as any),
        },
        {
          id: 'STOP-104',
          pedidoId: 'PED-104',
          numeroPedido: 'PED-0104',
          clienteId: 'CLI-04',
          clienteNombre: 'Cevichería Central',
          clienteDireccion: 'Calle 36 # 14-22',
          montoPedidoOriginal: 220000,
          montoCobradoFinal: 150000,
          formaPago: 'EFECTIVO',
          montoEfectivo: 150000,
          montoDigital: 0,
          fechaCreacionPedido: '2026-10-22T06:00:00.000Z',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'MAÑANA',
          horaLlegadaEnSitio: '2026-10-22T11:00:00.000Z',
          horaEntregaEfectiva: '2026-10-22T11:15:00.000Z', // A TIEMPO
          tiempoTransitoMinutos: 20,
          tiempoAtencionMinutos: 15,
          estadoEntrega: 'ENTREGADO_PARCIAL', // INCOMPLETO
          ...({ temperaturaEntregaCelsius: 3.0, pesoTotalKg: 10 } as any),
          devoluciones: [
            {
              id: 'DEV-1',
              manifiestoId: 'MAN-001',
              pedidoId: 'PED-104',
              productoId: 'PROD-01',
              productoNombre: 'Filete de Salmón',
              cantidadDevueltaKg: 2,
              motivoRechazo: 'CALIBRE_INCORRECTO',
              montoDescontado: 70000,
              fechaDevolucion: '2026-10-22T11:15:00.000Z',
              destino: 'CUARENTENA_WMS',
            },
          ],
        },
      ],
    },
    {
      id: 'MAN-002',
      numeroManifiesto: 'MAN-2026-002',
      conductorId: 'COND-02',
      conductorNombre: 'Andrés López',
      vehiculoPlaca: 'MOT-345',
      zonaRuta: 'FLORIDABLANCA',
      estado: 'LIQUIDADA',
      salidaEn: '2026-10-22T09:00:00.000Z',
      horaRetornoBodega: '2026-10-22T14:00:00.000Z',
      creadoEn: '2026-10-22T07:00:00.000Z',
      temperaturaSalidaCelsius: 3.0,
      gastos: [],
      devolucionesGlobales: [],
      totalPedidos: 1,
      totalPesoKg: 40,
      totalFacturadoEsperado: 1200000,
      totalRecaudadoEfectivo: 0,
      totalRecaudadoDigital: 1200000,
      totalCreditoFirmado: 0,
      totalDevolucionesMonto: 0,
      totalGastosRuta: 0,
      efectivoNetoEntregado: 0,
      diferenciaCuadre: 0,
      incidenciasRuta: [],
      pedidos: [
        {
          id: 'STOP-201',
          pedidoId: 'PED-201',
          numeroPedido: 'PED-0201',
          clienteId: 'CLI-05',
          clienteNombre: 'Casino Campestre',
          clienteDireccion: 'Autopista Floridablanca',
          montoPedidoOriginal: 1200000,
          montoCobradoFinal: 1200000,
          formaPago: 'TRANSFERENCIA_DIGITAL',
          montoEfectivo: 0,
          montoDigital: 1200000,
          fechaCreacionPedido: '2026-10-22T07:00:00.000Z',
          fechaRequeridaEntrega: '2026-10-22',
          jornadaRequerida: 'TARDE',
          horaLlegadaEnSitio: '2026-10-22T15:00:00.000Z',
          horaEntregaEfectiva: '2026-10-22T15:20:00.000Z', // Pactada 16:30 -> ANTICIPADO / A TIEMPO
          tiempoTransitoMinutos: 30,
          tiempoAtencionMinutos: 20,
          estadoEntrega: 'ENTREGADO_TOTAL',
          ...({ temperaturaEntregaCelsius: 2.8, pesoTotalKg: 40 } as any),
        },
      ],
    },
  ];

  describe('evaluarParadaOtif', () => {
    it('debe marcar onTime=true e inFull=true cuando la entrega es puntual y completa', () => {
      const pedido = mockManifiestos[0].pedidos[0];
      const resultado = otifAnalyticsService.evaluarParadaOtif(pedido, mockManifiestos[0]);

      expect(resultado.onTime).toBe(true);
      expect(resultado.inFull).toBe(true);
      expect(resultado.isOtif).toBe(true);
      expect(resultado.cumplimientoSLA).toBe('A_TIEMPO');
      expect(resultado.estadoCadenaFrio).toBe('CONFORME');
    });

    it('debe considerar A_TIEMPO una entrega realizada dentro de la ventana de gracia de 15 minutos', () => {
      const pedido = mockManifiestos[0].pedidos[1];
      const resultado = otifAnalyticsService.evaluarParadaOtif(pedido, mockManifiestos[0]);

      expect(resultado.onTime).toBe(true);
      expect(resultado.inFull).toBe(true);
      expect(resultado.isOtif).toBe(true);
      expect(resultado.cumplimientoSLA).toBe('A_TIEMPO');
    });

    it('debe marcar onTime=false y cumplimientoSLA=DEMORADO si supera los 15 minutos de gracia', () => {
      const pedido = mockManifiestos[0].pedidos[2];
      const resultado = otifAnalyticsService.evaluarParadaOtif(pedido, mockManifiestos[0]);

      expect(resultado.onTime).toBe(false);
      expect(resultado.isOtif).toBe(false);
      expect(resultado.cumplimientoSLA).toBe('DEMORADO');
      expect(resultado.estadoCadenaFrio).toBe('ALERTA'); // 4.8°C está entre 4.1 y 7.0
    });

    it('debe marcar inFull=false e isOtif=false si tiene devoluciones parciales a cuarentena', () => {
      const pedido = mockManifiestos[0].pedidos[3];
      const resultado = otifAnalyticsService.evaluarParadaOtif(pedido, mockManifiestos[0]);

      expect(resultado.onTime).toBe(true);
      expect(resultado.inFull).toBe(false);
      expect(resultado.isOtif).toBe(false);
      expect(resultado.tieneDevolucion).toBe(true);
      expect(resultado.totalKilosDevueltos).toBe(2);
    });
  });

  describe('calcularConsolidadoOtif', () => {
    it('debe calcular correctamente las tasas globales OTIF, On-Time, In-Full y Cadena de Frío', () => {
      const filtros: OtifFilterParams = {
        fechaDesde: '2026-10-22T00:00:00.000Z',
        fechaHasta: '2026-10-22T23:59:59.000Z',
        conductorId: 'TODOS',
        zonaRuta: 'TODOS',
        estatusSLA: 'TODOS',
      };

      const resultado = otifAnalyticsService.calcularConsolidadoOtif(mockManifiestos, filtros);

      expect(resultado.kpis.totalDespachos).toBe(2);
      expect(resultado.kpis.totalEntregas).toBe(5);

      // Entregas OTIF: PED-101 (sí), PED-102 (sí), PED-103 (no demorado), PED-104 (no devolución), PED-201 (sí) = 3 de 5
      expect(resultado.kpis.entregasOtif).toBe(3);
      expect(resultado.kpis.tasaOtifPorcentaje).toBe(60.0);

      // On-Time: 4 de 5 (PED-101, 102, 104, 201)
      expect(resultado.kpis.entregasOnTime).toBe(4);
      expect(resultado.kpis.tasaOnTimePorcentaje).toBe(80.0);

      // In-Full: 4 de 5 (todos menos PED-104 con devolución)
      expect(resultado.kpis.entregasInFull).toBe(4);
      expect(resultado.kpis.tasaInFullPorcentaje).toBe(80.0);

      // Cadena de Frío Conforme: 4 de 5 (temperaturas <= 4.0 °C: 3.1, 3.8, 3.0, 2.8; PED-103 tiene 4.8°C)
      expect(resultado.kpis.entregasCadenaFrioConforme).toBe(4);
      expect(resultado.kpis.tasaCadenaFrioPorcentaje).toBe(80.0);

      // Monto total recaudado
      expect(resultado.kpis.montoTotalRecaudadoCop).toBe(500000 + 320000 + 0 + 150000 + 1200000);
    });

    it('debe filtrar adecuadamente por conductor', () => {
      const filtros: OtifFilterParams = {
        fechaDesde: '2026-10-22T00:00:00.000Z',
        fechaHasta: '2026-10-22T23:59:59.000Z',
        conductorId: 'COND-02',
        zonaRuta: 'TODOS',
        estatusSLA: 'TODOS',
      };

      const resultado = otifAnalyticsService.calcularConsolidadoOtif(mockManifiestos, filtros);
      expect(resultado.kpis.totalDespachos).toBe(1);
      expect(resultado.kpis.totalEntregas).toBe(1);
      expect(resultado.kpis.entregasOtif).toBe(1);
      expect(resultado.kpis.tasaOtifPorcentaje).toBe(100.0);
    });

    it('debe manejar listas vacías retornando valores neutros sin errores de división por cero', () => {
      const filtros: OtifFilterParams = {
        fechaDesde: '2026-10-01T00:00:00.000Z',
        fechaHasta: '2026-10-02T23:59:59.000Z',
        conductorId: 'TODOS',
        zonaRuta: 'TODOS',
        estatusSLA: 'TODOS',
      };

      const resultado = otifAnalyticsService.calcularConsolidadoOtif([], filtros);
      expect(resultado.kpis.totalDespachos).toBe(0);
      expect(resultado.kpis.totalEntregas).toBe(0);
      expect(resultado.kpis.tasaOtifPorcentaje).toBe(100.0);
      expect(resultado.paradas).toHaveLength(0);
      expect(resultado.conductoresScorecard).toHaveLength(0);
    });
  });

  describe('calcularScorecardRepartidores', () => {
    it('debe generar el desglose por repartidor con cobro en calle y efectividad', () => {
      const filtros: OtifFilterParams = {
        fechaDesde: '2026-10-22T00:00:00.000Z',
        fechaHasta: '2026-10-22T23:59:59.000Z',
        conductorId: 'TODOS',
        zonaRuta: 'TODOS',
        estatusSLA: 'TODOS',
      };

      const resultado = otifAnalyticsService.calcularConsolidadoOtif(mockManifiestos, filtros);
      const scorecard = resultado.conductoresScorecard;

      expect(scorecard).toHaveLength(2);

      const carlos = scorecard.find((c) => c.conductorId === 'COND-01');
      expect(carlos).toBeDefined();
      if (carlos) {
        expect(carlos.pedidosAsignados).toBe(4);
        expect(carlos.pedidosEntregados).toBe(4);
        expect(carlos.pedidosOtifConformes).toBe(2);
        expect(carlos.tasaOtifPorcentaje).toBe(50.0);
        expect(carlos.totalCobradoEfectivoCop).toBe(320000 + 150000);
        expect(carlos.totalCobradoTransferenciaCop).toBe(500000);
      }

      const andres = scorecard.find((c) => c.conductorId === 'COND-02');
      expect(andres).toBeDefined();
      if (andres) {
        expect(andres.pedidosEntregados).toBe(1);
        expect(andres.tasaOtifPorcentaje).toBe(100.0);
        expect(andres.totalCobradoTransferenciaCop).toBe(1200000);
      }
    });
  });

  describe('otifCsvExporter', () => {
    it('debe generar un CSV válido con BOM UTF-8 y delimitador punto y coma', () => {
      const filtros: OtifFilterParams = {
        fechaDesde: '2026-10-22T00:00:00.000Z',
        fechaHasta: '2026-10-22T23:59:59.000Z',
        conductorId: 'TODOS',
        zonaRuta: 'TODOS',
        estatusSLA: 'TODOS',
      };

      const { paradas } = otifAnalyticsService.calcularConsolidadoOtif(mockManifiestos, filtros);
      const csvContent = otifCsvExporter.generarCsvString(paradas);

      // Comprobar presencia del BOM UTF-8 (\uFEFF)
      expect(csvContent.startsWith('\uFEFF')).toBe(true);

      // Comprobar encabezados delimitados por ';'
      expect(csvContent).toContain('Pedido;Cliente;Conductor;Placa;Zona;Manifiesto');
      expect(csvContent).toContain('OTIF Conforme');
      expect(csvContent).toContain('SLA Cumplimiento');
      expect(csvContent).toContain('Temp Entrega C');

      // Comprobar presencia de datos de las paradas
      expect(csvContent).toContain('PED-0101');
      expect(csvContent).toContain('Restaurante Mar y Fuego');
      expect(csvContent).toContain('Carlos Gómez');
    });
  });
});
