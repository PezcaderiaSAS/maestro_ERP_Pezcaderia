/**
 * ============================================================================
 * LA PEZCADERIA ERP — TIPOS DE DOMINIO: MÉTRICAS LOGÍSTICAS OTIF
 * ============================================================================
 * Contratos de datos tipados para el Dashboard Ejecutivo y Operativo OTIF B2B.
 */

export type ColdChainStatus = 'CONFORME' | 'ALERTA' | 'CRITICO' | 'SIN_REGISTRO';

export type OtifSlaStatus = 'A_TIEMPO' | 'ANTICIPADO' | 'DEMORADO' | 'PENDIENTE' | 'NO_APLICA';

export type DeliveryStatus = 'ENTREGADO_TOTAL' | 'ENTREGADO_PARCIAL' | 'NO_ENTREGADO_RECHAZADO' | 'PENDIENTE' | 'EN_RUTA';

export interface OtifFilterParams {
  fechaDesde: string;
  fechaHasta: string;
  conductorId?: string;
  zonaRuta?: string;
  estatusSLA?: 'TODOS' | 'CUMPLE_OTIF' | 'NO_CUMPLE_TIEMPO' | 'NO_CUMPLE_COMPLETO' | 'RECHAZADO';
}

export interface OtifKpiSummary {
  totalDespachos: number;
  totalEntregas: number;
  entregasOtif: number;
  tasaOtifPorcentaje: number;
  entregasOnTime: number;
  tasaOnTimePorcentaje: number;
  entregasInFull: number;
  tasaInFullPorcentaje: number;
  entregasCadenaFrioConforme: number;
  tasaCadenaFrioPorcentaje: number;
  montoTotalRecaudadoCop: number;
  tiempoPromedioAtencionMinutos: number;
}

export interface OtifStopRecord {
  manifiestoId: string;
  numeroManifiesto: string;
  conductorId: string;
  conductorNombre: string;
  vehiculoPlaca: string;
  zonaRuta: string;
  temperaturaSalidaCelsius?: number;
  temperaturaEntregaCelsius?: number;
  estadoCadenaFrio: ColdChainStatus;
  pedidoId: string;
  numeroPedido: string;
  clienteId: string;
  clienteNombre: string;
  jornadaPactada?: string;
  horaLimitePactada?: string;
  horaLlegadaSitio?: string;
  horaEntregaEfectiva?: string;
  tiempoTransitoMinutos?: number;
  tiempoAtencionMinutos?: number;
  cumplimientoSLA: OtifSlaStatus;
  onTime: boolean;
  inFull: boolean;
  isOtif: boolean;
  formaPago?: string;
  montoCobrado: number;
  estadoEntrega: DeliveryStatus;
  tieneDevolucion: boolean;
  totalKilosDespachados: number;
  totalKilosDevueltos: number;
}

export interface DriverPerformanceRecord {
  conductorId: string;
  conductorNombre: string;
  vehiculoPlaca: string;
  pedidosAsignados: number;
  pedidosEntregados: number;
  pedidosOtifConformes: number;
  tasaOtifPorcentaje: number;
  entregasOnTime: number;
  tasaOnTimePorcentaje: number;
  entregasInFull: number;
  tasaInFullPorcentaje: number;
  tiempoPromedioAtencionMinutos: number;
  totalCobradoEfectivoCop: number;
  totalCobradoTransferenciaCop: number;
  totalCreditoEntregadoCop: number;
  totalRecaudadoEnCalleCop: number;
}

export interface OtifConsolidatedResult {
  filtros: OtifFilterParams;
  kpis: OtifKpiSummary;
  paradas: OtifStopRecord[];
  conductoresScorecard: DriverPerformanceRecord[];
  zonasEstadisticas: Record<string, {
    totalEntregas: number;
    entregasOtif: number;
    tasaOtif: number;
  }>;
}
