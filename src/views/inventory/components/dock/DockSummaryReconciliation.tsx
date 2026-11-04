// src/views/inventory/components/dock/DockSummaryReconciliation.tsx
// Panel de Conciliación de Mermas de Viaje & Liquidación Financiera de Muelle (SPEC-050: TASK-050-03)
// Dark Glassmorphism 60-30-10, font-mono de alto impacto, WCAG AAA y tolerancia de merma configurable

import React, { useMemo } from 'react';
import {
  Scale,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Truck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export type MermaSemaforo = 'NORMAL' | 'ALERTA' | 'CRITICA';

export interface ReconciliationSummary {
  kilosGuia: number;
  kilosBascula: number;
  mermaKilos: number;
  mermaPct: number;
  esExceso: boolean;
  excesoKilos: number;
  toleranciaPct: number;
  kilosTolerancia: number;
  kilosExcedentesMerma: number;
  semaforo: MermaSemaforo;
  precioKiloPromedio: number;
  subtotalGuia: number;
  subtotalBascula: number;
  valorMermaTotal: number;
  montoNotaDebitoSugerida: number;
  anticipos: number;
  fleteTotal: number;
  saldoNetoProveedor: number;
  costoPuestoEnPlanta: number;
  costoRealKiloPlanta: number;
}

export interface CalculateReconciliationParams {
  kilosGuia: number;
  kilosBascula: number;
  precioKiloPromedio: number;
  toleranciaPct?: number;
  anticipos?: number;
  fleteTotal?: number;
}

/**
 * Función pura determinista para conciliar mermas de transporte y liquidar cuentas por pagar.
 * Regla de tolerancia comercial:
 * - Hasta 3.0%: Merma natural por deshielo / transporte (NORMAL).
 * - De 3.1% a 7.0%: Merma alta que requiere autorización de supervisor (ALERTA).
 * - Superior a 7.0%: Merma crítica con sugerencia automática de Nota Débito (CRÍTICA).
 */
export function calculateReconciliation(params: {
  kilosGuia: number;
  kilosBascula: number;
  precioKiloPromedio: number;
  toleranciaPct?: number;
  anticipos?: number;
  fleteTotal?: number;
}): ReconciliationSummary {
  const {
    kilosGuia,
    kilosBascula,
    precioKiloPromedio,
    toleranciaPct = 3.0,
    anticipos = 0,
    fleteTotal = 0,
  } = params;

  const esExceso = kilosBascula > kilosGuia;
  const excesoKilos = esExceso ? Number((kilosBascula - kilosGuia).toFixed(2)) : 0;
  const mermaKilos = esExceso ? 0 : Number((kilosGuia - kilosBascula).toFixed(2));
  const mermaPct = kilosGuia > 0 && !esExceso ? Number(((mermaKilos / kilosGuia) * 100).toFixed(2)) : 0;

  const kilosTolerancia = Number(((kilosGuia * toleranciaPct) / 100).toFixed(2));
  const kilosExcedentesMerma = Math.max(0, Number((mermaKilos - kilosTolerancia).toFixed(2)));

  let semaforo: MermaSemaforo = 'NORMAL';
  if (mermaPct > 7.0) {
    semaforo = 'CRITICA';
  } else if (mermaPct > toleranciaPct) {
    semaforo = 'ALERTA';
  }

  const subtotalGuia = Math.round(kilosGuia * precioKiloPromedio);
  const subtotalBascula = Math.round(kilosBascula * precioKiloPromedio);
  const valorMermaTotal = Math.round(mermaKilos * precioKiloPromedio);
  const montoNotaDebitoSugerida = Math.round(kilosExcedentesMerma * precioKiloPromedio);
  const costoPuestoEnPlanta = subtotalBascula + fleteTotal;
  const saldoNetoProveedor = Math.max(0, subtotalBascula - anticipos);
  const costoRealKiloPlanta = kilosBascula > 0 ? Math.round(costoPuestoEnPlanta / kilosBascula) : 0;

  return {
    kilosGuia,
    kilosBascula,
    mermaKilos,
    mermaPct,
    esExceso,
    excesoKilos,
    toleranciaPct,
    kilosTolerancia,
    kilosExcedentesMerma,
    semaforo,
    precioKiloPromedio,
    subtotalGuia,
    subtotalBascula,
    valorMermaTotal,
    montoNotaDebitoSugerida,
    anticipos,
    fleteTotal,
    saldoNetoProveedor,
    costoPuestoEnPlanta,
    costoRealKiloPlanta,
  };
}

export interface DockSummaryReconciliationProps {
  kilosGuia: number;
  kilosBascula: number;
  precioKiloPromedio: number;
  toleranciaPct?: number;
  anticipos?: number;
  fleteTotal?: number;
  onConfirmReconciliation?: (summary: ReconciliationSummary) => void;
  onGenerateDebitNote?: (monto: number, kilosExcedentes: number) => void;
  readOnly?: boolean;
  className?: string;
}

export const DockSummaryReconciliation: React.FC<DockSummaryReconciliationProps> = ({
  kilosGuia = 0,
  kilosBascula = 0,
  precioKiloPromedio = 0,
  toleranciaPct = 3.0,
  anticipos = 0,
  fleteTotal = 0,
  onConfirmReconciliation,
  onGenerateDebitNote,
  readOnly = false,
  className = '',
}) => {
  const summary = useMemo(
    () =>
      calculateReconciliation({
        kilosGuia,
        kilosBascula,
        precioKiloPromedio,
        toleranciaPct,
        anticipos,
        fleteTotal,
      }),
    [kilosGuia, kilosBascula, precioKiloPromedio, toleranciaPct, anticipos, fleteTotal]
  );

  const semaforoConfig = {
    NORMAL: {
      title: 'MERMA TOLERABLE (<= 3%)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      desc: 'Merma natural por deshidratación y deshielo en trayecto. Liquidación estándar aprobada.',
    },
    ALERTA: {
      title: 'MERMA EN ALERTA (3% - 7%)',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      desc: 'Merma superior a la tolerancia pactada. Requiere autorización del supervisor de compras.',
    },
    CRITICA: {
      title: 'MERMA CRÍTICA (> 7%)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/40',
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      desc: 'Merma excesiva fuera de todo parámetro. Se sugiere retención y emisión de Nota Débito.',
    },
  }[summary.semaforo];

  return (
    <div
      data-testid="dock-summary-reconciliation"
      className={`bg-[#131C2E]/80 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-5 shadow-2xl shadow-cyan-950/20 space-y-6 ${className}`}
    >
      {/* ── 1. Encabezado & Badge de Semáforo ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Conciliación de Mermas & Liquidación de Compra
            </h3>
            <p className="text-xs text-slate-400">
              Contraste determinista de kilos según guía vs báscula real y cálculo de tolerancia
            </p>
          </div>
        </div>

        {/* Badge Semáforo */}
        <div
          data-testid="dock-reconciliation-badge"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black font-mono border shadow-lg ${semaforoConfig.badgeClass}`}
        >
          {semaforoConfig.icon}
          <span>{semaforoConfig.title}</span>
        </div>
      </div>

      {/* ── 2. Bento Grid de 4 Métricas Clave ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Kilos en Guía */}
        <div className="bg-[#0B0F19]/70 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Kilos en Guía</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-mono text-2xl font-black text-slate-100">
            {summary.kilosGuia.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </div>
          <p className="text-[11px] text-slate-500">Despacho según remisión del proveedor</p>
        </div>

        {/* KPI 2: Kilos en Báscula */}
        <div className="bg-[#0B0F19]/70 border border-cyan-500/30 rounded-xl p-4 space-y-1 bg-gradient-to-b from-cyan-950/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
            <span>Kilos en Báscula</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-black text-cyan-300">
            {summary.kilosBascula.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </div>
          <p className="text-[11px] text-cyan-500/80">Peso neto capturado en muelle</p>
        </div>

        {/* KPI 3: Merma / Diferencia */}
        <div
          className={`bg-[#0B0F19]/70 border rounded-xl p-4 space-y-1 ${
            summary.semaforo === 'CRITICA'
              ? 'border-rose-500/50 bg-rose-950/10'
              : summary.semaforo === 'ALERTA'
              ? 'border-amber-500/50 bg-amber-950/10'
              : 'border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase">
            <span
              className={
                summary.semaforo === 'CRITICA'
                  ? 'text-rose-400'
                  : summary.semaforo === 'ALERTA'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            >
              Merma de Viaje
            </span>
            <TrendingDown
              className={`w-4 h-4 ${
                summary.semaforo === 'CRITICA'
                  ? 'text-rose-400'
                  : summary.semaforo === 'ALERTA'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            />
          </div>
          <div
            className={`font-mono text-2xl font-black ${
              summary.semaforo === 'CRITICA'
                ? 'text-rose-300'
                : summary.semaforo === 'ALERTA'
                ? 'text-amber-300'
                : 'text-emerald-300'
            }`}
          >
            {summary.mermaKilos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </div>
          <p className="text-[11px] font-mono font-bold text-slate-400">
            Tasa: {summary.mermaPct.toFixed(2)}% (Tol: {summary.toleranciaPct}%)
          </p>
        </div>

        {/* KPI 4: Saldo a Liquidar */}
        <div className="bg-[#0B0F19]/70 border border-emerald-500/40 rounded-xl p-4 space-y-1 bg-gradient-to-b from-emerald-950/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
            <span>Saldo a Liquidar</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-black text-emerald-300">
            ${summary.saldoNetoProveedor.toLocaleString('es-CO')}
          </div>
          <p className="text-[11px] text-emerald-500/80">Neto a pagar tras anticipos</p>
        </div>
      </div>

      {/* ── 3. Banner Informativo del Semáforo ── */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
          summary.semaforo === 'CRITICA'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : summary.semaforo === 'ALERTA'
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="mt-0.5 shrink-0">{semaforoConfig.icon}</div>
        <div className="text-xs sm:text-sm">
          <p className="font-bold">{semaforoConfig.desc}</p>
          <p className="text-[11px] opacity-80 mt-0.5">
            Tolerancia pactada: {summary.toleranciaPct}% ({summary.kilosTolerancia} kg exentos). Merma real observada: {summary.mermaPct}%.
          </p>
        </div>
      </div>

      {/* ── 4. Desglose Financiero & Auditoría de Costos ── */}
      <div className="bg-[#0B0F19]/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-slate-800/60 pb-2">
          Desglose Financiero de Compra y Transporte
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Subtotal según Báscula ({summary.kilosBascula} kg):</span>
            <span className="font-mono font-bold text-slate-200">${summary.subtotalBascula.toLocaleString('es-CO')} COP</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Anticipos previos deducidos:</span>
            <span className="font-mono font-bold text-amber-300">-${summary.anticipos.toLocaleString('es-CO')} COP</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Flete terrestre consolidado:</span>
            <span className="font-mono font-bold text-cyan-300">+${summary.fleteTotal.toLocaleString('es-CO')} COP</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Costo total puesto en planta:</span>
            <span className="font-mono font-bold text-slate-100">${summary.costoPuestoEnPlanta.toLocaleString('es-CO')} COP</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Costo real efectivo por kilo:</span>
            <span className="font-mono font-bold text-cyan-400">${summary.costoRealKiloPlanta.toLocaleString('es-CO')} COP / kg</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Valor merma total de viaje:</span>
            <span className="font-mono font-bold text-rose-400">${summary.valorMermaTotal.toLocaleString('es-CO')} COP</span>
          </div>
        </div>
      </div>

      {/* ── 5. Alerta de Nota Débito Sugerida (si excede tolerancia) ── */}
      {summary.kilosExcedentesMerma > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-rose-200">
                Nota Débito Sugerida: {summary.kilosExcedentesMerma.toFixed(2)} kg de exceso
              </h5>
              <p className="text-xs text-rose-300/80">
                La merma excede la tolerancia en {summary.kilosExcedentesMerma.toFixed(2)} kg. Valor a reclamar al proveedor:{' '}
                <strong className="font-mono text-rose-200">${summary.montoNotaDebitoSugerida.toLocaleString('es-CO')} COP</strong>.
              </p>
            </div>
          </div>

          {onGenerateDebitNote && !readOnly && (
            <button
              type="button"
              onClick={() => onGenerateDebitNote(summary.montoNotaDebitoSugerida, summary.kilosExcedentesMerma)}
              className="min-h-[48px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all active:scale-[0.98] shrink-0"
            >
              <FileText className="w-4 h-4" />
              Aplicar Nota Débito
            </button>
          )}
        </div>
      )}

      {/* ── 6. Barra de Acciones Fitts >= 48px ── */}
      {onConfirmReconciliation && !readOnly && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onConfirmReconciliation(summary)}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98]"
          >
            <span>Confirmar Liquidación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

