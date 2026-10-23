import React from 'react';
import {
  Award,
  Clock,
  PackageCheck,
  ThermometerSnowflake,
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { OtifKpiSummary } from '../../../types/otif.types';

interface OtifKpiHeaderCardsProps {
  kpis: OtifKpiSummary;
  cargando?: boolean;
}

export const OtifKpiHeaderCards: React.FC<OtifKpiHeaderCardsProps> = ({
  kpis,
  cargando = false,
}) => {
  // Determinar estatus de OTIF
  const getOtifStatus = (tasa: number) => {
    if (tasa >= 95) {
      return {
        label: 'Meta Cumplida',
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: CheckCircle2,
      };
    }
    if (tasa >= 90) {
      return {
        label: 'En Alerta',
        colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'Crítico',
      colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertTriangle,
    };
  };

  const otifStatus = getOtifStatus(kpis.tasaOtifPorcentaje);
  const StatusIcon = otifStatus.icon;

  if (cargando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse h-36"
          >
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. OTIF Global */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              OTIF Global
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.tasaOtifPorcentaje}%
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            {kpis.entregasOtif} de {kpis.totalEntregas} entregas
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${otifStatus.colorClass}`}
          >
            <StatusIcon className="w-3 h-3" />
            {otifStatus.label}
          </span>
        </div>
      </div>

      {/* 2. A Tiempo (On-Time) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              A Tiempo (On-Time)
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.tasaOnTimePorcentaje}%
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            <strong className="text-slate-800">{kpis.entregasOnTime}</strong> dentro de horario
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, kpis.tasaOnTimePorcentaje))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Pedido Completo (In-Full) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Completo (In-Full)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.tasaInFullPorcentaje}%
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            <strong className="text-slate-800">{kpis.entregasInFull}</strong> sin devolución
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, kpis.tasaInFullPorcentaje))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Cadena de Frío Conforme */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cadena de Frío
            </span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.tasaCadenaFrioPorcentaje}%
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            <strong className="text-slate-800">{kpis.entregasCadenaFrioConforme}</strong> conformes (≤ 4°C)
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                kpis.tasaCadenaFrioPorcentaje >= 95 ? 'bg-cyan-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, kpis.tasaCadenaFrioPorcentaje))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Recaudo Total en Ruta */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recaudo Ruta
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            ${kpis.montoTotalRecaudadoCop.toLocaleString('es-CO')}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            {kpis.totalDespachos} despachos liquidados
          </span>
          <span className="text-[11px] font-semibold text-slate-500">COP</span>
        </div>
      </div>
    </div>
  );
};
