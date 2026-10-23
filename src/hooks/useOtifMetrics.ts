/**
 * ============================================================================
 * LA PEZCADERIA ERP — HOOK REACTIVO: useOtifMetrics
 * ============================================================================
 * Orquestador reactivo para el Dashboard de Métricas Logísticas OTIF B2B.
 * Manejo estricto de fechas locales (evitando desfases UTC), cálculos analíticos
 * memoizados (< 50 ms) y exportación nativa a Excel CSV con delimitador ';'.
 */

import { useState, useMemo, useCallback } from 'react';
import { deliveryRouteService, DeliveryRouteRecord } from '../services/deliveryRouteService';
import { otifAnalyticsService } from '../services/otifAnalyticsService';
import { otifCsvExporter } from '../services/otifCsvExporter';
import type {
  OtifFilterParams,
  OtifKpiSummary,
  OtifStopRecord,
  DriverPerformanceRecord,
  OtifConsolidatedResult,
} from '../types/otif.types';

export type OtifDatePreset = 'HOY' | '7_DIAS' | 'MES' | 'PERSONALIZADO';

export interface UseOtifMetricsOptions {
  filtrosIniciales?: Partial<OtifFilterParams>;
  manifiestosCustom?: DeliveryRouteRecord[];
}

export interface UseOtifMetricsReturn {
  filtros: OtifFilterParams;
  presetActivo: OtifDatePreset;
  consolidado: OtifConsolidatedResult;
  kpis: OtifKpiSummary;
  paradas: OtifStopRecord[];
  conductoresScorecard: DriverPerformanceRecord[];
  zonasEstadisticas: Record<string, { totalEntregas: number; entregasOtif: number; tasaOtif: number }>;
  totalRutas: number;
  conductoresDisponibles: Array<{ id: string; nombre: string }>;
  zonasDisponibles: string[];
  setPreset: (preset: OtifDatePreset) => void;
  actualizarFiltro: <K extends keyof OtifFilterParams>(clave: K, valor: OtifFilterParams[K]) => void;
  limpiarFiltros: () => void;
  exportarReporteCsv: (nombreArchivo?: string) => { success: boolean; lineasExportadas: number };
  recargar: () => void;
}

/**
 * Retorna fecha en formato YYYY-MM-DD según hora local estricta
 */
function obtenerFechaLocalIso(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Calcula rango de fechas según preset operativo
 */
function calcularRangoPreset(preset: OtifDatePreset): { fechaDesde: string; fechaHasta: string } {
  const hoy = new Date();
  const fechaHasta = obtenerFechaLocalIso(hoy);

  switch (preset) {
    case 'HOY':
      return { fechaDesde: fechaHasta, fechaHasta };
    case '7_DIAS': {
      const sieteDiasAtras = new Date(hoy);
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 6);
      return { fechaDesde: obtenerFechaLocalIso(sieteDiasAtras), fechaHasta };
    }
    case 'MES': {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { fechaDesde: obtenerFechaLocalIso(inicioMes), fechaHasta };
    }
    case 'PERSONALIZADO':
    default:
      return { fechaDesde: fechaHasta, fechaHasta };
  }
}

export function useOtifMetrics(options: UseOtifMetricsOptions = {}): UseOtifMetricsReturn {
  const { filtrosIniciales, manifiestosCustom } = options;

  // Estado del preset activo
  const [presetActivo, setPresetActivo] = useState<OtifDatePreset>(() => {
    if (filtrosIniciales?.fechaDesde && filtrosIniciales?.fechaHasta) {
      return 'PERSONALIZADO';
    }
    return 'HOY';
  });

  // Estado de los filtros reactivos
  const [filtros, setFiltros] = useState<OtifFilterParams>(() => {
    const rangoDefecto = calcularRangoPreset('HOY');
    return {
      fechaDesde: filtrosIniciales?.fechaDesde || rangoDefecto.fechaDesde,
      fechaHasta: filtrosIniciales?.fechaHasta || rangoDefecto.fechaHasta,
      conductorId: filtrosIniciales?.conductorId,
      zonaRuta: filtrosIniciales?.zonaRuta,
      estatusSLA: filtrosIniciales?.estatusSLA || 'TODOS',
    };
  });

  // Señal de refresco manual
  const [versionRefresco, setVersionRefresco] = useState(0);

  // Obtención memoizada de los manifiestos de ruta
  const rutas = useMemo(() => {
    // Si se pasa una lista personalizada (para testing o aislamiento), se usa directamente
    if (manifiestosCustom) return manifiestosCustom;
    // Sino, se carga desde el servicio central
    return deliveryRouteService.obtenerManifiestos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifiestosCustom, versionRefresco]);

  // Lista deduplicada de conductores registrados para filtros UI
  const conductoresDisponibles = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const r of rutas) {
      if (r.conductorId && r.conductorNombre && !mapa.has(r.conductorId)) {
        mapa.set(r.conductorId, r.conductorNombre);
      }
    }
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [rutas]);

  // Lista deduplicada de zonas de ruta registradas para filtros UI
  const zonasDisponibles = useMemo(() => {
    const setZonas = new Set<string>();
    for (const r of rutas) {
      if (r.zonaRuta && r.zonaRuta.trim()) {
        setZonas.add(r.zonaRuta.trim());
      }
    }
    return Array.from(setZonas).sort();
  }, [rutas]);

  // Cálculo consolidado de analítica OTIF memoizado (< 50 ms)
  const consolidado = useMemo(() => {
    return otifAnalyticsService.calcularConsolidadoOtif(rutas, filtros);
  }, [rutas, filtros]);

  // Cambiar preset de fecha y sincronizar fechas automáticamente
  const setPreset = useCallback((nuevoPreset: OtifDatePreset) => {
    setPresetActivo(nuevoPreset);
    if (nuevoPreset !== 'PERSONALIZADO') {
      const nuevoRango = calcularRangoPreset(nuevoPreset);
      setFiltros((prev) => ({
        ...prev,
        fechaDesde: nuevoRango.fechaDesde,
        fechaHasta: nuevoRango.fechaHasta,
      }));
    }
  }, []);

  // Actualizador genérico de claves de filtro
  const actualizarFiltro = useCallback(
    <K extends keyof OtifFilterParams>(clave: K, valor: OtifFilterParams[K]) => {
      if (clave === 'fechaDesde' || clave === 'fechaHasta') {
        setPresetActivo('PERSONALIZADO');
      }
      setFiltros((prev) => ({
        ...prev,
        [clave]: valor,
      }));
    },
    []
  );

  // Limpiar filtros y regresar a preset base
  const limpiarFiltros = useCallback(() => {
    const rangoBase = filtrosIniciales?.fechaDesde && filtrosIniciales?.fechaHasta
      ? { fechaDesde: filtrosIniciales.fechaDesde, fechaHasta: filtrosIniciales.fechaHasta }
      : calcularRangoPreset('HOY');

    setPresetActivo(filtrosIniciales?.fechaDesde ? 'PERSONALIZADO' : 'HOY');
    setFiltros({
      fechaDesde: rangoBase.fechaDesde,
      fechaHasta: rangoBase.fechaHasta,
      conductorId: undefined,
      zonaRuta: undefined,
      estatusSLA: 'TODOS',
    });
  }, [filtrosIniciales]);

  // Exportar reporte consolidado a Excel CSV con BOM UTF-8 y delimitador ';'
  const exportarReporteCsv = useCallback(
    (nombreArchivo?: string) => {
      const lineas = consolidado.paradas.length;
      otifCsvExporter.descargarExcelCsv(consolidado.paradas, nombreArchivo);
      return { success: true, lineasExportadas: lineas };
    },
    [consolidado]
  );

  // Forzar recarga de datos
  const recargar = useCallback(() => {
    setVersionRefresco((v) => v + 1);
  }, []);

  return {
    filtros,
    presetActivo,
    consolidado,
    kpis: consolidado.kpis,
    paradas: consolidado.paradas,
    conductoresScorecard: consolidado.conductoresScorecard,
    zonasEstadisticas: consolidado.zonasEstadisticas,
    totalRutas: rutas.length,
    conductoresDisponibles,
    zonasDisponibles,
    setPreset,
    actualizarFiltro,
    limpiarFiltros,
    exportarReporteCsv,
    recargar,
  };
}
