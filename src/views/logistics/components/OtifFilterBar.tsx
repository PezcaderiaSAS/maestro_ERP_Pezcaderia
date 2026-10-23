import React from 'react';
import {
  Calendar,
  Filter,
  RotateCcw,
  Download,
  User,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import type { OtifFilterParams } from '../../../types/otif.types';
import type { OtifDatePreset } from '../../../hooks/useOtifMetrics';

interface OtifFilterBarProps {
  filtros: OtifFilterParams;
  presetActivo: OtifDatePreset;
  conductoresDisponibles: Array<{ id: string; nombre: string }>;
  zonasDisponibles: string[];
  alCambiarFiltro: <K extends keyof OtifFilterParams>(
    campo: K,
    valor: OtifFilterParams[K]
  ) => void;
  alCambiarPreset: (preset: 'HOY' | '7_DIAS' | 'MES') => void;
  alLimpiarFiltros: () => void;
  alExportarCsv: () => void;
  exportando?: boolean;
}

export const OtifFilterBar: React.FC<OtifFilterBarProps> = ({
  filtros,
  presetActivo,
  conductoresDisponibles,
  zonasDisponibles,
  alCambiarFiltro,
  alCambiarPreset,
  alLimpiarFiltros,
  alExportarCsv,
  exportando = false,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Fila Superior: Presets de Fecha Rápidos + Botón de Exportación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Presets Rápidos (Táctiles >= 48px) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Período:
          </span>
          <button
            type="button"
            onClick={() => alCambiarPreset('HOY')}
            className={`min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
              presetActivo === 'HOY'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => alCambiarPreset('7_DIAS')}
            className={`min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
              presetActivo === '7_DIAS'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            type="button"
            onClick={() => alCambiarPreset('MES')}
            className={`min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
              presetActivo === 'MES'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Mes Actual
          </button>
        </div>

        {/* Botón de Exportación Gerencial CSV */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={alExportarCsv}
            disabled={exportando}
            className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto"
          >
            <Download className="w-4 h-4" />
            <span>{exportando ? 'Exportando...' : 'Exportar Excel (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Fila Inferior: Controles Detallados de Filtrado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
        {/* Fecha Desde */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => alCambiarFiltro('fechaDesde', e.target.value)}
            className="w-full min-h-[48px] px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => alCambiarFiltro('fechaHasta', e.target.value)}
            className="w-full min-h-[48px] px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Conductor */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Conductor
          </label>
          <select
            value={filtros.conductorId || 'TODOS'}
            onChange={(e) =>
              alCambiarFiltro(
                'conductorId',
                e.target.value === 'TODOS' ? undefined : e.target.value
              )
            }
            className="w-full min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            <option value="TODOS">Todos los Conductores</option>
            {conductoresDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Zona */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Zona de Ruta
          </label>
          <select
            value={filtros.zonaRuta || 'TODOS'}
            onChange={(e) =>
              alCambiarFiltro(
                'zonaRuta',
                e.target.value === 'TODOS' ? undefined : e.target.value
              )
            }
            className="w-full min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            <option value="TODOS">Todas las Zonas</option>
            {zonasDisponibles.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Estatus SLA / Limpiar */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
              Estatus SLA
            </label>
            <select
              value={filtros.estatusSLA || 'TODOS'}
              onChange={(e) =>
                alCambiarFiltro('estatusSLA', e.target.value as any)
              }
              className="w-full min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="TODOS">Todos los Estatus</option>
              <option value="CUMPLE_OTIF">Cumple OTIF (Perfecto)</option>
              <option value="NO_CUMPLE_TIEMPO">Demorado (Tiempo)</option>
              <option value="NO_CUMPLE_COMPLETO">Incompleto (Faltante/Dev.)</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          <button
            type="button"
            onClick={alLimpiarFiltros}
            title="Restablecer filtros"
            className="min-h-[48px] min-w-[48px] px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl flex items-center justify-center transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
