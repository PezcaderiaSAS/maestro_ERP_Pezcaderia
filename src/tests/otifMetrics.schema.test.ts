import { describe, it, expect } from 'vitest';
import { 
  OtifFilterParamsSchema, 
  OtifKpiSummarySchema, 
  OtifStopRecordSchema, 
  DriverPerformanceRecordSchema,
  validarFiltrosOtif,
  determinarSemaforoFrio
} from '../../packages/validation-schemas/src/otifMetrics.schema';

describe('TASK-026-01: Esquemas Zod y Contratos de Validación de Datos OTIF', () => {
  describe('OtifFilterParamsSchema', () => {
    it('debe validar exitosamente filtros con fechas ISO válidas y fechaDesde <= fechaHasta', () => {
      const payloadValido = {
        fechaDesde: '2026-10-01T00:00:00.000Z',
        fechaHasta: '2026-10-22T23:59:59.000Z',
        conductorId: 'COND-001',
        zonaRuta: 'CABECERA',
        estatusSLA: 'TODOS',
      };

      const resultado = OtifFilterParamsSchema.safeParse(payloadValido);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.conductorId).toBe('COND-001');
        expect(resultado.data.zonaRuta).toBe('CABECERA');
      }
    });

    it('debe admitir valores por defecto cuando no se especifican conductorId o zona', () => {
      const payloadMinimo = {
        fechaDesde: '2026-10-22T00:00:00.000Z',
        fechaHasta: '2026-10-22T23:59:59.000Z',
      };

      const resultado = OtifFilterParamsSchema.safeParse(payloadMinimo);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.conductorId).toBe('TODOS');
        expect(resultado.data.zonaRuta).toBe('TODOS');
        expect(resultado.data.estatusSLA).toBe('TODOS');
      }
    });

    it('debe fallar si fechaDesde es posterior a fechaHasta', () => {
      const payloadInvalido = {
        fechaDesde: '2026-10-25T00:00:00.000Z',
        fechaHasta: '2026-10-20T00:00:00.000Z',
      };

      const resultado = OtifFilterParamsSchema.safeParse(payloadInvalido);
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toContain('La fecha inicial no puede ser posterior');
      }
    });

    it('debe fallar si las fechas no tienen formato ISO 8601', () => {
      const payloadInvalido = {
        fechaDesde: '22-10-2026',
        fechaHasta: '2026-10-22T23:59:59.000Z',
      };

      const resultado = OtifFilterParamsSchema.safeParse(payloadInvalido);
      expect(resultado.success).toBe(false);
    });
  });

  describe('OtifKpiSummarySchema', () => {
    it('debe validar un resumen de KPIs coherente con porcentajes entre 0 y 100', () => {
      const kpisValidos = {
        totalDespachos: 10,
        totalEntregas: 45,
        entregasOtif: 40,
        tasaOtifPorcentaje: 88.89,
        entregasOnTime: 42,
        tasaOnTimePorcentaje: 93.33,
        entregasInFull: 41,
        tasaInFullPorcentaje: 91.11,
        entregasCadenaFrioConforme: 44,
        tasaCadenaFrioPorcentaje: 97.78,
        montoTotalRecaudadoCop: 14500000,
        tiempoPromedioAtencionMinutos: 18,
      };

      const resultado = OtifKpiSummarySchema.safeParse(kpisValidos);
      expect(resultado.success).toBe(true);
    });

    it('debe rechazar porcentajes negativos o superiores a 100', () => {
      const kpiInvalido = {
        totalDespachos: 5,
        totalEntregas: 10,
        entregasOtif: 12,
        tasaOtifPorcentaje: 120.0, // Inválido > 100
        entregasOnTime: 10,
        tasaOnTimePorcentaje: 100,
        entregasInFull: 10,
        tasaInFullPorcentaje: 100,
        entregasCadenaFrioConforme: 10,
        tasaCadenaFrioPorcentaje: 100,
        montoTotalRecaudadoCop: 1000000,
        tiempoPromedioAtencionMinutos: 15,
      };

      const resultado = OtifKpiSummarySchema.safeParse(kpiInvalido);
      expect(resultado.success).toBe(false);
    });
  });

  describe('OtifStopRecordSchema', () => {
    it('debe validar un registro detallado de parada de entrega con todos los metadatos de auditoría', () => {
      const paradaValida = {
        manifiestoId: 'MAN-2026-10-001',
        numeroManifiesto: 'MAN-001',
        conductorId: 'COND-01',
        conductorNombre: 'Carlos Gómez',
        vehiculoPlaca: 'XTR-892',
        zonaRuta: 'CABECERA',
        temperaturaSalidaCelsius: 2.5,
        temperaturaEntregaCelsius: 3.2,
        estadoCadenaFrio: 'CONFORME',
        pedidoId: 'PED-901',
        numeroPedido: 'PED-0901',
        clienteId: 'CLI-88',
        clienteNombre: 'Restaurante Mar y Fuego',
        jornadaPactada: 'MAÑANA',
        horaLimitePactada: '2026-10-22T11:30:00.000Z',
        horaLlegadaSitio: '2026-10-22T11:15:00.000Z',
        horaEntregaEfectiva: '2026-10-22T11:28:00.000Z',
        tiempoTransitoMinutos: 35,
        tiempoAtencionMinutos: 13,
        cumplimientoSLA: 'A_TIEMPO',
        onTime: true,
        inFull: true,
        isOtif: true,
        formaPago: 'TRANSFERENCIA',
        montoCobrado: 450000,
        estadoEntrega: 'ENTREGADO_TOTAL',
        tieneDevolucion: false,
        totalKilosDespachados: 18.5,
        totalKilosDevueltos: 0,
      };

      const resultado = OtifStopRecordSchema.safeParse(paradaValida);
      expect(resultado.success).toBe(true);
    });

    it('debe validar parada incompleta con devolución donde isOtif es false', () => {
      const paradaConDevolucion = {
        manifiestoId: 'MAN-2026-10-002',
        numeroManifiesto: 'MAN-002',
        conductorId: 'COND-02',
        conductorNombre: 'Andrés López',
        vehiculoPlaca: 'MOT-345',
        zonaRuta: 'FLORIDABLANCA',
        temperaturaSalidaCelsius: 3.0,
        temperaturaEntregaCelsius: 4.5,
        estadoCadenaFrio: 'ALERTA',
        pedidoId: 'PED-902',
        numeroPedido: 'PED-0902',
        clienteId: 'CLI-99',
        clienteNombre: 'Hotel Bucarica',
        jornadaPactada: 'MAÑANA',
        horaLimitePactada: '2026-10-22T11:30:00.000Z',
        horaLlegadaSitio: '2026-10-22T11:40:00.000Z',
        horaEntregaEfectiva: '2026-10-22T11:55:00.000Z',
        tiempoTransitoMinutos: 40,
        tiempoAtencionMinutos: 15,
        cumplimientoSLA: 'DEMORADO',
        onTime: false,
        inFull: false,
        isOtif: false,
        formaPago: 'CREDITO',
        montoCobrado: 0,
        estadoEntrega: 'ENTREGADO_PARCIAL',
        tieneDevolucion: true,
        totalKilosDespachados: 25.0,
        totalKilosDevueltos: 5.0,
      };

      const resultado = OtifStopRecordSchema.safeParse(paradaConDevolucion);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.isOtif).toBe(false);
        expect(resultado.data.tieneDevolucion).toBe(true);
      }
    });
  });

  describe('DriverPerformanceRecordSchema', () => {
    it('debe validar un scorecard de conductor con métricas agregadas', () => {
      const driverRecord = {
        conductorId: 'COND-01',
        conductorNombre: 'Carlos Gómez',
        vehiculoPlaca: 'XTR-892',
        pedidosAsignados: 20,
        pedidosEntregados: 20,
        pedidosOtifConformes: 18,
        tasaOtifPorcentaje: 90.0,
        entregasOnTime: 19,
        tasaOnTimePorcentaje: 95.0,
        entregasInFull: 19,
        tasaInFullPorcentaje: 95.0,
        tiempoPromedioAtencionMinutos: 14,
        totalCobradoEfectivoCop: 1200000,
        totalCobradoTransferenciaCop: 2800000,
        totalCreditoEntregadoCop: 1500000,
        totalRecaudadoEnCalleCop: 4000000,
      };

      const resultado = DriverPerformanceRecordSchema.safeParse(driverRecord);
      expect(resultado.success).toBe(true);
    });
  });

  describe('Funciones Auxiliares de Validación y Lógica Térmica', () => {
    it('determinarSemaforoFrio debe clasificar correctamente según los rangos HACCP', () => {
      expect(determinarSemaforoFrio(2.0)).toBe('CONFORME');
      expect(determinarSemaforoFrio(4.0)).toBe('CONFORME');
      expect(determinarSemaforoFrio(4.1)).toBe('ALERTA');
      expect(determinarSemaforoFrio(7.0)).toBe('ALERTA');
      expect(determinarSemaforoFrio(7.1)).toBe('CRITICO');
      expect(determinarSemaforoFrio(12.5)).toBe('CRITICO');
      expect(determinarSemaforoFrio(undefined)).toBe('SIN_REGISTRO');
    });

    it('validarFiltrosOtif debe normalizar fechas predeterminadas de hoy si están vacías', () => {
      const filtrosNormalizados = validarFiltrosOtif({});
      expect(filtrosNormalizados.fechaDesde).toBeDefined();
      expect(filtrosNormalizados.fechaHasta).toBeDefined();
      expect(filtrosNormalizados.conductorId).toBe('TODOS');
      expect(filtrosNormalizados.zonaRuta).toBe('TODOS');
    });
  });
});
