import { z } from 'zod';

/**
 * Enumeración para clasificación térmica de cadena de frío (HACCP / Pescadería B2B)
 */
export const ColdChainStatusEnum = z.enum([
  'CONFORME',      // <= 4.0 °C
  'ALERTA',        // 4.1 °C a 7.0 °C
  'CRITICO',       // > 7.0 °C
  'SIN_REGISTRO',  // No se tomó temperatura
]);

export type ColdChainStatus = z.infer<typeof ColdChainStatusEnum>;

/**
 * Esquema de validación para los parámetros de filtro del Dashboard OTIF
 */
export const OtifFilterParamsSchema = z
  .object({
    fechaDesde: z.string().datetime({ message: 'La fecha inicial debe tener formato ISO 8601 válido.' }),
    fechaHasta: z.string().datetime({ message: 'La fecha final debe tener formato ISO 8601 válido.' }),
    conductorId: z.string().default('TODOS'),
    zonaRuta: z.string().default('TODOS'),
    estatusSLA: z.enum(['TODOS', 'CUMPLE_OTIF', 'NO_CUMPLE_TIEMPO', 'NO_CUMPLE_COMPLETO', 'RECHAZADO']).default('TODOS'),
  })
  .refine(
    (data) => new Date(data.fechaDesde) <= new Date(data.fechaHasta),
    {
      message: 'La fecha inicial no puede ser posterior a la fecha final de consulta.',
      path: ['fechaDesde'],
    }
  );

export type OtifFilterParams = z.infer<typeof OtifFilterParamsSchema>;

/**
 * Esquema para el resumen consolidado de KPIs logísticos del Dashboard
 */
export const OtifKpiSummarySchema = z.object({
  totalDespachos: z.number().int().nonnegative(),
  totalEntregas: z.number().int().nonnegative(),
  entregasOtif: z.number().int().nonnegative(),
  tasaOtifPorcentaje: z.number().min(0).max(100),
  entregasOnTime: z.number().int().nonnegative(),
  tasaOnTimePorcentaje: z.number().min(0).max(100),
  entregasInFull: z.number().int().nonnegative(),
  tasaInFullPorcentaje: z.number().min(0).max(100),
  entregasCadenaFrioConforme: z.number().int().nonnegative(),
  tasaCadenaFrioPorcentaje: z.number().min(0).max(100),
  montoTotalRecaudadoCop: z.number().nonnegative(),
  tiempoPromedioAtencionMinutos: z.number().nonnegative(),
});

export type OtifKpiSummary = z.infer<typeof OtifKpiSummarySchema>;

/**
 * Esquema para una parada individual de entrega con trazabilidad completa de OTIF
 */
export const OtifStopRecordSchema = z.object({
  manifiestoId: z.string().min(1),
  numeroManifiesto: z.string().min(1),
  conductorId: z.string().min(1),
  conductorNombre: z.string().min(1),
  vehiculoPlaca: z.string().min(1),
  zonaRuta: z.string().min(1),
  temperaturaSalidaCelsius: z.number().optional(),
  temperaturaEntregaCelsius: z.number().optional(),
  estadoCadenaFrio: ColdChainStatusEnum,
  pedidoId: z.string().min(1),
  numeroPedido: z.string().min(1),
  clienteId: z.string().min(1),
  clienteNombre: z.string().min(1),
  jornadaPactada: z.string().optional(),
  horaLimitePactada: z.string().datetime().optional(),
  horaLlegadaSitio: z.string().datetime().optional(),
  horaEntregaEfectiva: z.string().datetime().optional(),
  tiempoTransitoMinutos: z.number().nonnegative().optional(),
  tiempoAtencionMinutos: z.number().nonnegative().optional(),
  cumplimientoSLA: z.enum(['A_TIEMPO', 'ANTICIPADO', 'DEMORADO', 'PENDIENTE', 'NO_APLICA']).default('A_TIEMPO'),
  onTime: z.boolean(),
  inFull: z.boolean(),
  isOtif: z.boolean(),
  formaPago: z.string().optional(),
  montoCobrado: z.number().nonnegative().default(0),
  estadoEntrega: z.enum(['ENTREGADO_TOTAL', 'ENTREGADO_PARCIAL', 'NO_ENTREGADO_RECHAZADO', 'PENDIENTE', 'EN_RUTA']),
  tieneDevolucion: z.boolean().default(false),
  totalKilosDespachados: z.number().nonnegative().default(0),
  totalKilosDevueltos: z.number().nonnegative().default(0),
});

export type OtifStopRecord = z.infer<typeof OtifStopRecordSchema>;

/**
 * Esquema para el scorecard de rendimiento por repartidor
 */
export const DriverPerformanceRecordSchema = z.object({
  conductorId: z.string().min(1),
  conductorNombre: z.string().min(1),
  vehiculoPlaca: z.string().min(1),
  pedidosAsignados: z.number().int().nonnegative(),
  pedidosEntregados: z.number().int().nonnegative(),
  pedidosOtifConformes: z.number().int().nonnegative(),
  tasaOtifPorcentaje: z.number().min(0).max(100),
  entregasOnTime: z.number().int().nonnegative(),
  tasaOnTimePorcentaje: z.number().min(0).max(100),
  entregasInFull: z.number().int().nonnegative(),
  tasaInFullPorcentaje: z.number().min(0).max(100),
  tiempoPromedioAtencionMinutos: z.number().nonnegative(),
  totalCobradoEfectivoCop: z.number().nonnegative().default(0),
  totalCobradoTransferenciaCop: z.number().nonnegative().default(0),
  totalCreditoEntregadoCop: z.number().nonnegative().default(0),
  totalRecaudadoEnCalleCop: z.number().nonnegative().default(0),
});

export type DriverPerformanceRecord = z.infer<typeof DriverPerformanceRecordSchema>;

/**
 * Función pura que determina el semáforo térmico según rangos de inocuidad en pescadería fresca
 */
export function determinarSemaforoFrio(temperaturaCelsius?: number): ColdChainStatus {
  if (temperaturaCelsius === undefined || temperaturaCelsius === null || isNaN(temperaturaCelsius)) {
    return 'SIN_REGISTRO';
  }
  if (temperaturaCelsius <= 4.0) {
    return 'CONFORME';
  }
  if (temperaturaCelsius <= 7.0) {
    return 'ALERTA';
  }
  return 'CRITICO';
}

/**
 * Valida y normaliza filtros del Dashboard OTIF aplicando valores por defecto seguros
 */
export function validarFiltrosOtif(rawParams?: Partial<OtifFilterParams>): OtifFilterParams {
  const hoy = new Date();
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

  const defaults = {
    fechaDesde: inicioDia.toISOString(),
    fechaHasta: finDia.toISOString(),
    conductorId: 'TODOS',
    zonaRuta: 'TODOS',
    estatusSLA: 'TODOS' as const,
  };

  const payload = {
    fechaDesde: rawParams?.fechaDesde || defaults.fechaDesde,
    fechaHasta: rawParams?.fechaHasta || defaults.fechaHasta,
    conductorId: rawParams?.conductorId || defaults.conductorId,
    zonaRuta: rawParams?.zonaRuta || defaults.zonaRuta,
    estatusSLA: rawParams?.estatusSLA || defaults.estatusSLA,
  };

  return OtifFilterParamsSchema.parse(payload);
}
