import React, { useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  Truck,
  ShieldCheck,
  Package,
  Layers,
} from 'lucide-react';
import { useOtifMetrics } from '../../hooks/useOtifMetrics';
import {
  OtifKpiHeaderCards,
  OtifFilterBar,
  DriverPerformanceTable,
  ColdChainAuditTimeline,
  OtifAuditDetailTable,
} from './components';

export const OtifDashboardView: React.FC = () => {
  const {
    filtros,
    presetActivo,
    kpis,
    conductoresScorecard,
    paradas,
    conductoresDisponibles,
    zonasDisponibles,
    actualizarFiltro,
    setPreset,
    limpiarFiltros,
    exportarReporteCsv,
    recargar,
  } = useOtifMetrics();

  const [exportando, setExportando] = useState(false);
  const [tabActiva, setTabActiva] = useState<'PANEL' | 'CONDUCTORES' | 'AUDITORIA' | 'CADENA_FRIO'>('PANEL');

  const handleExportarCsv = () => {
    setExportando(true);
    try {
      const fecha = new Date().toISOString().split('T')[0];
      exportarReporteCsv(`Reporte_OTIF_${fecha}.csv`);
    } finally {
      setTimeout(() => setExportando(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Métricas Logísticas & OTIF B2B
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Control de On-Time (A Tiempo), In-Full (Completo), cadena de frío y recaudo
            </p>
          </div>
        </div>

        {/* Botón Refrescar */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={recargar}
            className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar Datos</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Alto Nivel */}
      <OtifKpiHeaderCards kpis={kpis} />

      {/* 3. Barra Táctil de Filtros */}
      <OtifFilterBar
        filtros={filtros}
        presetActivo={presetActivo}
        conductoresDisponibles={conductoresDisponibles}
        zonasDisponibles={zonasDisponibles}
        alCambiarFiltro={actualizarFiltro}
        alCambiarPreset={setPreset}
        alLimpiarFiltros={limpiarFiltros}
        alExportarCsv={handleExportarCsv}
        exportando={exportando}
      />

      {/* 4. Selector de Pestañas / Vistas (Navegación Táctil Móvil y Tablet) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setTabActiva('PANEL')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            tabActiva === 'PANEL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Vista Integral
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('CONDUCTORES')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            tabActiva === 'CONDUCTORES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Conductores ({conductoresScorecard.length})
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('AUDITORIA')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            tabActiva === 'AUDITORIA'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          Detalle Paradas ({paradas.length})
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('CADENA_FRIO')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            tabActiva === 'CADENA_FRIO'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Cadena de Frío
        </button>
      </div>

      {/* 5. Contenido Dinámico según Pestaña */}
      {tabActiva === 'PANEL' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DriverPerformanceTable
              scorecard={conductoresScorecard}
              conductorSeleccionadoId={filtros.conductorId}
              alSeleccionarConductor={(id) =>
                actualizarFiltro(
                  'conductorId',
                  filtros.conductorId === id ? undefined : id
                )
              }
            />
            <ColdChainAuditTimeline paradas={paradas} />
          </div>
          <OtifAuditDetailTable paradas={paradas} />
        </div>
      )}

      {tabActiva === 'CONDUCTORES' && (
        <DriverPerformanceTable
          scorecard={conductoresScorecard}
          conductorSeleccionadoId={filtros.conductorId}
          alSeleccionarConductor={(id) =>
            actualizarFiltro(
              'conductorId',
              filtros.conductorId === id ? undefined : id
            )
          }
        />
      )}

      {tabActiva === 'AUDITORIA' && (
        <OtifAuditDetailTable paradas={paradas} />
      )}

      {tabActiva === 'CADENA_FRIO' && (
        <ColdChainAuditTimeline paradas={paradas} />
      )}
    </div>
  );
};
