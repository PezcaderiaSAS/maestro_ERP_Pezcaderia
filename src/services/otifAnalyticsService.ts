/**
 * ============================================================================
 * LA PEZCADERIA ERP — MOTOR ANALÍTICO LOGÍSTICO: OTIF ANALYTICS ENGINE
 * ============================================================================
 * Lógica matemática determinista para cálculo de OTIF (On-Time In-Full),
 * control térmico de cadena de frío y auditoría de repartidores B2B.
 */

import { determinarSemaforoFrio } from '../../packages/validation-schemas/src/otifMetrics.schema';
import type { DeliveryRouteRecord, DeliveryOrderItem } from './deliveryRouteService';
import type { RouteReturnItem } from '../../packages/validation-schemas/src/deliveryRoute.schema';
import type { 
  OtifFilterParams, 
  OtifKpiSummary, 
  OtifStopRecord, 
  DriverPerformanceRecord, 
  OtifConsolidatedResult,
  OtifSlaStatus,
  ColdChainStatus
} from '../types/otif.types';

export const otifAnalyticsService = {
  /**
   * Ventana de gracia permitida en minutos para tráfico urbano en Bucaramanga
   */
  VENTANA_GRACIA_MINUTOS_DEFECTO: 15,

  /**
   * Resuelve la fecha y hora límite pactada según la jornada requerida y la fecha pactada.
   * Si no tiene hora explícita:
   * - MAÑANA: 11:30 AM local
   * - TARDE: 16:30 PM local
   */
  calcularHoraLimitePactada(fechaRequerida?: string, jornadaRequerida?: string): Date {
    let year: number;
    let month: number;
    let day: number;

    if (fechaRequerida && fechaRequerida.includes('-')) {
      const parts = fechaRequerida.split('T')[0].split('-').map(Number);
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    } else {
      const now = new Date();
      year = now.getUTCFullYear();
      month = now.getUTCMonth();
      day = now.getUTCDate();
    }

    if (jornadaRequerida === 'TARDE') {
      return new Date(Date.UTC(year, month, day, 16, 30, 0, 0));
    }
    // Por defecto MAÑANA: 11:30 AM UTC
    return new Date(Date.UTC(year, month, day, 11, 30, 0, 0));
  },

  /**
   * Evalúa individualmente si una parada de pedido cumplió On-Time, In-Full y OTIF.
   */
  evaluarParadaOtif(
    pedido: DeliveryOrderItem, 
    manifiesto: DeliveryRouteRecord,
    ventanaGraciaMinutos = 15
  ): OtifStopRecord {
    const fechaLimite = this.calcularHoraLimitePactada(
      pedido.fechaRequeridaEntrega, 
      pedido.jornadaRequerida
    );

    const horaEntregaStr = pedido.horaEntregaEfectiva || pedido.horaEntrega;
    const horaEntrega = horaEntregaStr ? new Date(horaEntregaStr) : undefined;

    let onTime = false;
    let cumplimientoSLA: OtifSlaStatus = 'PENDIENTE';

    if (horaEntrega && !isNaN(horaEntrega.getTime())) {
      const limiteConGracia = new Date(fechaLimite.getTime() + ventanaGraciaMinutos * 60 * 1000);
      if (horaEntrega.getTime() <= limiteConGracia.getTime()) {
        onTime = true;
        cumplimientoSLA = horaEntrega.getTime() < (fechaLimite.getTime() - 60 * 60 * 1000) 
          ? 'ANTICIPADO' 
          : 'A_TIEMPO';
      } else {
        onTime = false;
        cumplimientoSLA = 'DEMORADO';
      }
    } else if (pedido.estadoEntrega === 'ENTREGADO_TOTAL' || pedido.estadoEntrega === 'ENTREGADO_PARCIAL') {
      // Fallback si no tiene timestamp exacto pero fue entregado
      onTime = true;
      cumplimientoSLA = 'A_TIEMPO';
    }

    const tieneDevolucion = Boolean(pedido.devoluciones && pedido.devoluciones.length > 0);
    const inFull = pedido.estadoEntrega === 'ENTREGADO_TOTAL' && !tieneDevolucion;
    const isOtif = onTime && inFull;

    const totalKilosDevueltos = pedido.devoluciones?.reduce(
      (acc: number, d: RouteReturnItem) => acc + (d.cantidadDevueltaKg || 0), 0
    ) || 0;

    const temperaturaEntrega = (pedido as any).temperaturaEntregaCelsius;
    const estadoCadenaFrio: ColdChainStatus = determinarSemaforoFrio(temperaturaEntrega);

    return {
      manifiestoId: manifiesto.id,
      numeroManifiesto: manifiesto.numeroManifiesto,
      conductorId: manifiesto.conductorId,
      conductorNombre: manifiesto.conductorNombre,
      vehiculoPlaca: manifiesto.vehiculoPlaca,
      zonaRuta: manifiesto.zonaRuta,
      temperaturaSalidaCelsius: manifiesto.temperaturaSalidaCelsius,
      temperaturaEntregaCelsius: temperaturaEntrega,
      estadoCadenaFrio,
      pedidoId: pedido.pedidoId,
      numeroPedido: pedido.numeroPedido,
      clienteId: pedido.clienteId,
      clienteNombre: pedido.clienteNombre,
      jornadaPactada: pedido.jornadaRequerida || 'MAÑANA',
      horaLimitePactada: fechaLimite.toISOString(),
      horaLlegadaSitio: pedido.horaLlegadaEnSitio,
      horaEntregaEfectiva: pedido.horaEntregaEfectiva || pedido.horaEntrega,
      tiempoTransitoMinutos: pedido.tiempoTransitoMinutos || 0,
      tiempoAtencionMinutos: pedido.tiempoAtencionMinutos || 0,
      cumplimientoSLA,
      onTime,
      inFull,
      isOtif,
      formaPago: pedido.formaPago,
      montoCobrado: pedido.montoCobradoFinal || 0,
      estadoEntrega: (pedido.estadoEntrega as any) || 'ENTREGADO_TOTAL',
      tieneDevolucion,
      totalKilosDespachados: (pedido as any).pesoTotalKg || 0,
      totalKilosDevueltos,
    };
  },

  /**
   * Genera el consolidado general de métricas OTIF, KPIs, auditoría y scorecards.
   */
  calcularConsolidadoOtif(
    manifiestos: DeliveryRouteRecord[], 
    filtros: OtifFilterParams
  ): OtifConsolidatedResult {
    const fechaDesdeTime = new Date(filtros.fechaDesde).getTime();
    const fechaHastaTime = new Date(filtros.fechaHasta).getTime();

    // 1. Filtrar manifiestos por rango temporal, conductor y zona
    const manifiestosFiltrados = manifiestos.filter((m) => {
      const fechaManifiesto = m.salidaEn ? new Date(m.salidaEn).getTime() : Date.now();
      const matchFecha = fechaManifiesto >= fechaDesdeTime && fechaManifiesto <= fechaHastaTime;
      const matchConductor = filtros.conductorId === 'TODOS' || !filtros.conductorId || m.conductorId === filtros.conductorId;
      const matchZona = filtros.zonaRuta === 'TODOS' || !filtros.zonaRuta || m.zonaRuta === filtros.zonaRuta;

      return matchFecha && matchConductor && matchZona;
    });

    // 2. Extraer y evaluar todas las paradas
    const paradasEvaluadas: OtifStopRecord[] = [];
    for (const m of manifiestosFiltrados) {
      for (const p of m.pedidos) {
        const parada = this.evaluarParadaOtif(p, m);
        
        // Filtro por estatus SLA si aplica
        let matchSLA = true;
        if (filtros.estatusSLA && filtros.estatusSLA !== 'TODOS') {
          if (filtros.estatusSLA === 'CUMPLE_OTIF') matchSLA = parada.isOtif;
          else if (filtros.estatusSLA === 'NO_CUMPLE_TIEMPO') matchSLA = !parada.onTime;
          else if (filtros.estatusSLA === 'NO_CUMPLE_COMPLETO') matchSLA = !parada.inFull;
          else if (filtros.estatusSLA === 'RECHAZADO') matchSLA = parada.estadoEntrega === 'NO_ENTREGADO_RECHAZADO';
        }

        if (matchSLA) {
          paradasEvaluadas.push(parada);
        }
      }
    }

    // 3. Calcular métricas agregadas
    const totalEntregas = paradasEvaluadas.length;
    let entregasOtif = 0;
    let entregasOnTime = 0;
    let entregasInFull = 0;
    let entregasCadenaFrioConforme = 0;
    let montoTotalRecaudadoCop = 0;
    let sumaTiempoAtencion = 0;

    const zonasMap: Record<string, { totalEntregas: number; entregasOtif: number; tasaOtif: number }> = {};

    for (const p of paradasEvaluadas) {
      if (p.isOtif) entregasOtif++;
      if (p.onTime) entregasOnTime++;
      if (p.inFull) entregasInFull++;
      if (p.estadoCadenaFrio === 'CONFORME') entregasCadenaFrioConforme++;

      montoTotalRecaudadoCop += p.montoCobrado || 0;
      sumaTiempoAtencion += p.tiempoAtencionMinutos || 0;

      // Agregación por zona
      const zona = p.zonaRuta || 'OTRAS';
      if (!zonasMap[zona]) {
        zonasMap[zona] = { totalEntregas: 0, entregasOtif: 0, tasaOtif: 100 };
      }
      zonasMap[zona].totalEntregas++;
      if (p.isOtif) zonasMap[zona].entregasOtif++;
    }

    // Calcular tasas por zona
    for (const z in zonasMap) {
      const item = zonasMap[z];
      item.tasaOtif = item.totalEntregas > 0 
        ? Math.round((item.entregasOtif / item.totalEntregas) * 100 * 10) / 10 
        : 100;
    }

    const tasaOtifPorcentaje = totalEntregas > 0
      ? Math.round((entregasOtif / totalEntregas) * 100 * 10) / 10
      : 100.0;

    const tasaOnTimePorcentaje = totalEntregas > 0
      ? Math.round((entregasOnTime / totalEntregas) * 100 * 10) / 10
      : 100.0;

    const tasaInFullPorcentaje = totalEntregas > 0
      ? Math.round((entregasInFull / totalEntregas) * 100 * 10) / 10
      : 100.0;

    const tasaCadenaFrioPorcentaje = totalEntregas > 0
      ? Math.round((entregasCadenaFrioConforme / totalEntregas) * 100 * 10) / 10
      : 100.0;

    const tiempoPromedioAtencionMinutos = totalEntregas > 0
      ? Math.round(sumaTiempoAtencion / totalEntregas)
      : 0;

    const kpis: OtifKpiSummary = {
      totalDespachos: manifiestosFiltrados.length,
      totalEntregas,
      entregasOtif,
      tasaOtifPorcentaje,
      entregasOnTime,
      tasaOnTimePorcentaje,
      entregasInFull,
      tasaInFullPorcentaje,
      entregasCadenaFrioConforme,
      tasaCadenaFrioPorcentaje,
      montoTotalRecaudadoCop,
      tiempoPromedioAtencionMinutos,
    };

    // 4. Scorecard por repartidor
    const conductoresScorecard = this.calcularScorecardRepartidores(paradasEvaluadas);

    return {
      filtros,
      kpis,
      paradas: paradasEvaluadas,
      conductoresScorecard,
      zonasEstadisticas: zonasMap,
    };
  },

  /**
   * Agrupa y calcula el rendimiento por repartidor.
   */
  calcularScorecardRepartidores(paradas: OtifStopRecord[]): DriverPerformanceRecord[] {
    const mapa = new Map<string, {
      conductorId: string;
      conductorNombre: string;
      vehiculoPlaca: string;
      pedidosAsignados: number;
      pedidosEntregados: number;
      pedidosOtifConformes: number;
      entregasOnTime: number;
      entregasInFull: number;
      sumaTiempoAtencion: number;
      totalCobradoEfectivoCop: number;
      totalCobradoTransferenciaCop: number;
      totalCreditoEntregadoCop: number;
      totalRecaudadoEnCalleCop: number;
    }>();

    for (const p of paradas) {
      if (!mapa.has(p.conductorId)) {
        mapa.set(p.conductorId, {
          conductorId: p.conductorId,
          conductorNombre: p.conductorNombre,
          vehiculoPlaca: p.vehiculoPlaca,
          pedidosAsignados: 0,
          pedidosEntregados: 0,
          pedidosOtifConformes: 0,
          entregasOnTime: 0,
          entregasInFull: 0,
          sumaTiempoAtencion: 0,
          totalCobradoEfectivoCop: 0,
          totalCobradoTransferenciaCop: 0,
          totalCreditoEntregadoCop: 0,
          totalRecaudadoEnCalleCop: 0,
        });
      }

      const c = mapa.get(p.conductorId)!;
      c.pedidosAsignados++;
      c.pedidosEntregados++;
      if (p.isOtif) c.pedidosOtifConformes++;
      if (p.onTime) c.entregasOnTime++;
      if (p.inFull) c.entregasInFull++;
      c.sumaTiempoAtencion += p.tiempoAtencionMinutos || 0;

      const forma = (p.formaPago || '').toUpperCase();
      const monto = p.montoCobrado || 0;

      if (forma.includes('EFECTIVO') || forma.includes('CONTADO')) {
        c.totalCobradoEfectivoCop += monto;
        c.totalRecaudadoEnCalleCop += monto;
      } else if (forma.includes('TRANSFERENCIA')) {
        c.totalCobradoTransferenciaCop += monto;
        c.totalRecaudadoEnCalleCop += monto;
      } else if (forma.includes('CREDITO')) {
        c.totalCreditoEntregadoCop += monto;
      } else {
        c.totalRecaudadoEnCalleCop += monto;
      }
    }

    const resultado: DriverPerformanceRecord[] = [];
    for (const c of mapa.values()) {
      const tasaOtifPorcentaje = c.pedidosEntregados > 0
        ? Math.round((c.pedidosOtifConformes / c.pedidosEntregados) * 100 * 10) / 10
        : 100;
      const tasaOnTimePorcentaje = c.pedidosEntregados > 0
        ? Math.round((c.entregasOnTime / c.pedidosEntregados) * 100 * 10) / 10
        : 100;
      const tasaInFullPorcentaje = c.pedidosEntregados > 0
        ? Math.round((c.entregasInFull / c.pedidosEntregados) * 100 * 10) / 10
        : 100;
      const tiempoPromedioAtencionMinutos = c.pedidosEntregados > 0
        ? Math.round(c.sumaTiempoAtencion / c.pedidosEntregados)
        : 0;

      resultado.push({
        conductorId: c.conductorId,
        conductorNombre: c.conductorNombre,
        vehiculoPlaca: c.vehiculoPlaca,
        pedidosAsignados: c.pedidosAsignados,
        pedidosEntregados: c.pedidosEntregados,
        pedidosOtifConformes: c.pedidosOtifConformes,
        tasaOtifPorcentaje,
        entregasOnTime: c.entregasOnTime,
        tasaOnTimePorcentaje,
        entregasInFull: c.entregasInFull,
        tasaInFullPorcentaje,
        tiempoPromedioAtencionMinutos,
        totalCobradoEfectivoCop: c.totalCobradoEfectivoCop,
        totalCobradoTransferenciaCop: c.totalCobradoTransferenciaCop,
        totalCreditoEntregadoCop: c.totalCreditoEntregadoCop,
        totalRecaudadoEnCalleCop: c.totalRecaudadoEnCalleCop,
      });
    }

    return resultado;
  },
};
