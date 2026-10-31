// src/views/inventory/components/InventoryBentoKpis.tsx
// Bento Grid de 4 KPIs Ejecutivos WMS en Tiempo Real (SPEC-048: TASK-048-01)
// Dark Glassmorphism 60-30-10, tipografía font-mono, contraste WCAG AAA y semaforización reactiva

import React from 'react';
import {
  DollarSign,
  Boxes,
  Snowflake,
  Clock,
  AlertTriangle,
  Scissors,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export interface InventoryBentoKpisProps {
  valorTotalStock?: number;
  totalProductosActivos?: number;
  ocupacionCuartosFriosKg?: number;
  capacidadTotalKg?: number;
  temperaturaPromedioC?: number;
  lotesCriticosFefoCount?: number;
  lotesAdvertenciaFefoCount?: number;
  tasaMermaDespiecePct?: number;
  productosClaseAPct?: number;
  className?: string;
}

export const InventoryBentoKpis: React.FC<InventoryBentoKpisProps> = ({
  valorTotalStock = 0,
  totalProductosActivos = 0,
  ocupacionCuartosFriosKg = 0,
  capacidadTotalKg = 0,
  temperaturaPromedioC = -18.0,
  lotesCriticosFefoCount = 0,
  lotesAdvertenciaFefoCount = 0,
  tasaMermaDespiecePct = 18.5,
  productosClaseAPct = 80,
  className = '',
}) => {
  const porcentajeOcupacion = capacidadTotalKg > 0
    ? Math.min(100, Math.round((ocupacionCuartosFriosKg / capacidadTotalKg) * 100))
    : 0;

  const isFefoCritico = lotesCriticosFefoCount > 0;
  const isMermaAlta = tasaMermaDespiecePct > 35;

  return (
    <div
      data-testid="inventory-bento-kpis"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${className}`}
    >
      {/* 1. Valor Total del Inventario ($) */}
      <div
        data-testid="bento-kpi-valor-stock"
        className="group relative bg-[#131C2E]/60 backdrop-blur-xl border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 shadow-lg shadow-cyan-950/10 transition-all duration-300 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Valoración Total Stock
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <DollarSign size={16} />
          </div>
        </div>

        <div className="my-1">
          <div className="font-mono text-2xl font-black text-white tracking-tight">
            ${valorTotalStock.toLocaleString('es-CO')}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 mt-1">
          <span className="text-slate-400 truncate">
            {totalProductosActivos} refs activas
          </span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            NIIF Costo Prom.
          </span>
        </div>
      </div>

      {/* 2. Cuartos Fríos & Cámaras Frigoríficas */}
      <div
        data-testid="bento-kpi-cuartos-frios"
        className="group relative bg-[#131C2E]/60 backdrop-blur-xl border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-4 shadow-lg shadow-blue-950/10 transition-all duration-300 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Cámaras & Frío
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Snowflake size={16} />
          </div>
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-black text-white tracking-tight">
            {temperaturaPromedioC > 0 ? `+${temperaturaPromedioC.toFixed(1)}` : temperaturaPromedioC.toFixed(1)} °C
          </span>
          <span className="text-xs text-slate-400 font-mono">promedio</span>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/5 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {ocupacionCuartosFriosKg.toLocaleString('es-CO')} kg
            </span>
            <span className="font-mono font-bold text-blue-300 text-[11px]">
              {porcentajeOcupacion}% cap.
            </span>
          </div>
          {/* Barra de progreso de ocupación */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                porcentajeOcupacion > 90
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${porcentajeOcupacion}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Lotes Perecederos en Riesgo FEFO (< 48 hrs) */}
      <div
        data-testid="bento-kpi-fefo-riesgo"
        className={`group relative bg-[#131C2E]/60 backdrop-blur-xl border rounded-2xl p-4 shadow-lg transition-all duration-300 flex flex-col justify-between ${
          isFefoCritico
            ? 'border-rose-500/40 shadow-rose-950/20 hover:border-rose-500/60'
            : 'border-slate-800/80 hover:border-amber-500/40 shadow-amber-950/10'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Caducidad FEFO
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isFefoCritico
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            {isFefoCritico ? <AlertTriangle size={16} /> : <Clock size={16} />}
          </div>
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span
            className={`font-mono text-2xl font-black tracking-tight ${
              isFefoCritico ? 'text-rose-400' : 'text-white'
            }`}
          >
            {lotesCriticosFefoCount}
          </span>
          <span className="text-xs text-slate-400">
            {lotesCriticosFefoCount === 1 ? 'lote crítico' : 'lotes críticos'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 mt-1">
          <span className="text-slate-400 truncate">
            {isFefoCritico ? '< 48h vencimiento' : 'Sin riesgo inminente'}
          </span>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isFefoCritico
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isFefoCritico ? 'Despachar Hoy' : 'FEFO Normal'}
          </span>
        </div>
      </div>

      {/* 4. Eficiencia de Despiece & Pareto ABC (Clase A) */}
      <div
        data-testid="bento-kpi-despiece-pareto"
        className={`group relative bg-[#131C2E]/60 backdrop-blur-xl border rounded-2xl p-4 shadow-lg transition-all duration-300 flex flex-col justify-between ${
          isMermaAlta
            ? 'border-rose-500/40 shadow-rose-950/20'
            : 'border-slate-800/80 hover:border-emerald-500/40 shadow-emerald-950/10'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rendimiento & ABC
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isMermaAlta
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}
          >
            <Scissors size={16} />
          </div>
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span
            className={`font-mono text-2xl font-black tracking-tight ${
              isMermaAlta ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {tasaMermaDespiecePct.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400 font-mono">merma</span>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 mt-1">
          <span className="text-slate-400 truncate">
            Clase A: {productosClaseAPct}% valor
          </span>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isMermaAlta
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isMermaAlta ? 'Merma Crítica' : 'Pareto 80/20'}
          </span>
        </div>
      </div>
    </div>
  );
};
