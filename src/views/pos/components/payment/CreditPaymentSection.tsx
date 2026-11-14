import React from 'react';
import { Calendar, User, AlertCircle, ShieldCheck } from 'lucide-react';
import type { ClientePOS } from '../../../../hooks/usePOSCart';

export interface CreditPaymentSectionProps {
  totalPagar: number;
  cliente?: ClientePOS | null;
  plazoDias: number;
  onChangePlazo: (dias: number) => void;
  fechaVencimiento: string;
  cupoDisponible: number;
  esCreditoExcedido: boolean;
}

const PLAZOS = [
  { dias: 8, label: '8 días' },
  { dias: 15, label: '15 días' },
  { dias: 30, label: '30 días' },
  { dias: 45, label: '45 días' },
];

export const CreditPaymentSection: React.FC<CreditPaymentSectionProps> = ({
  totalPagar,
  cliente,
  plazoDias,
  onChangePlazo,
  fechaVencimiento,
  cupoDisponible,
  esCreditoExcedido,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
      {/* Información del Cliente y Cupo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400 font-semibold">Cliente Titular</div>
            <div className="text-base font-bold text-slate-100">
              {cliente ? cliente.nombre : 'Cliente Ocasional (Sin registro de crédito)'}
            </div>
            {cliente && (
              <div className="text-xs text-slate-400 font-mono">
                {cliente.identificacion} • Tarifa {cliente.tipoPrecio}
              </div>
            )}
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-xs uppercase text-slate-400 font-semibold">Cupo de Crédito</div>
          <div
            className={`text-xl font-bold font-mono ${
              esCreditoExcedido ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            ${cupoDisponible.toLocaleString('es-CO')}
          </div>
        </div>
      </div>

      {/* Alerta si el Crédito Excede el Cupo */}
      {esCreditoExcedido && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>
            Excede cupo disponible: El total a pagar (${totalPagar.toLocaleString('es-CO')}) supera el cupo de crédito asignado (${cupoDisponible.toLocaleString('es-CO')}).
          </span>
        </div>
      )}

      {!cliente && (
        <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Se requiere seleccionar un cliente registrado con cupo activo para autorizar ventas a crédito.
          </span>
        </div>
      )}

      {/* Selector de Plazo y Fecha de Vencimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Plazo de Pago Acordado</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAZOS.map((p) => (
              <button
                key={p.dias}
                type="button"
                onClick={() => onChangePlazo(p.dias)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                  plazoDias === p.dias
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
                    : 'bg-slate-950 hover:bg-slate-800 border-white/5 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between p-3.5 bg-slate-950/80 rounded-xl border border-white/5">
          <span className="text-xs uppercase text-slate-400 font-semibold">
            Fecha Límite de Vencimiento
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight">
            {fechaVencimiento}
          </div>
          <div className="text-[11px] text-slate-500">
            Generará registro automático en módulo Cartera / CXC.
          </div>
        </div>
      </div>
    </div>
  );
};

