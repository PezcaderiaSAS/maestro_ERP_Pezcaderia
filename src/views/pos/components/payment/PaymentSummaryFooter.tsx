import React from 'react';
import { Check, X, FileText, CheckCircle2 } from 'lucide-react';
import type { MetodoCobroPos } from './payment.types';

export interface PaymentSummaryFooterProps {
  totalPagar: number;
  totalRecibido: number;
  vueltoTotal: number;
  puedeConfirmar: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  requiereFacturaElectronica: boolean;
  onToggleFacturaElectronica: () => void;
  metodoActivo: MetodoCobroPos;
}

export const PaymentSummaryFooter: React.FC<PaymentSummaryFooterProps> = ({
  totalPagar,
  totalRecibido,
  vueltoTotal,
  puedeConfirmar,
  onConfirmar,
  onCancelar,
  requiereFacturaElectronica,
  onToggleFacturaElectronica,
  metodoActivo,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-950/90 rounded-2xl border border-white/10 mt-2">
      {/* Lado Izquierdo: Toggle Facturación Electrónica DIAN y Total a Cobrar */}
      <div className="flex items-center gap-4">
        {/* Toggle DIAN */}
        <button
          type="button"
          data-testid="toggle-factura-electronica"
          onClick={onToggleFacturaElectronica}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            requiereFacturaElectronica
              ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 ring-1 ring-indigo-500/30'
              : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800'
          }`}
        >
          <FileText className={`w-4 h-4 ${requiereFacturaElectronica ? 'text-indigo-400' : 'text-slate-500'}`} />
          <div className="text-left">
            <div>Factura Electrónica</div>
            <div className="text-[10px] text-slate-500 font-normal">
              {requiereFacturaElectronica ? 'DIAN Siigo Activada' : 'Ticket POS Estándar'}
            </div>
          </div>
        </button>

        {/* Resumen Total */}
        <div className="border-l border-white/10 pl-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Total a Liquidar
          </span>
          <span className="text-2xl font-extrabold font-mono text-cyan-200">
            ${totalPagar.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Lado Derecho: Acciones de Botón (Cancelar / Confirmar) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-[48px] px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5"
        >
          <X className="w-4 h-4 text-slate-400" />
          <span>Cancelar</span>
          <span className="text-[10px] bg-white/10 px-1 rounded font-mono text-slate-400">Esc</span>
        </button>

        <button
          type="button"
          data-testid="btn-confirmar-pago"
          disabled={!puedeConfirmar}
          onClick={onConfirmar}
          className={`min-h-[48px] px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
            puedeConfirmar
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Confirmar Cobro</span>
          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono font-normal">
            Enter
          </span>
        </button>
      </div>
    </div>
  );
};

