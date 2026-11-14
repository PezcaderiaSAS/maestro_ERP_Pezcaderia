import React from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { MetodoCobroPos, SplitPaymentLineItem } from './payment.types';

export interface SplitPaymentSectionProps {
  totalPagar: number;
  lineas: SplitPaymentLineItem[];
  saldoRestante: number;
  totalAsignado: number;
  onAddLinea: () => void;
  onUpdateLinea: (id: string, updates: Partial<SplitPaymentLineItem>) => void;
  onRemoveLinea: (id: string) => void;
}

const AVAILABLE_METHODS: Array<{ id: MetodoCobroPos; label: string }> = [
  { id: 'EFECTIVO', label: 'Efectivo' },
  { id: 'DATAFONO', label: 'Datáfono (Tarjeta)' },
  { id: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { id: 'NEQUI', label: 'Nequi' },
  { id: 'DAVIPLATA', label: 'Daviplata' },
  { id: 'QR_BANCOLOMBIA', label: 'QR Bancolombia' },
  { id: 'CREDITO', label: 'Crédito' },
];

export const SplitPaymentSection: React.FC<SplitPaymentSectionProps> = ({
  totalPagar,
  lineas,
  saldoRestante,
  totalAsignado,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
}) => {
  const estaCuadrado = Math.abs(saldoRestante) < 0.01;

  return (
    <div data-testid="section-split-payment" className="flex flex-col gap-4">
      {/* Banner de Balance y Estado de Cuadre */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-white/5">
        <div>
          <span className="text-xs uppercase text-slate-400 font-medium">Total de la Venta</span>
          <div className="text-xl font-bold font-mono text-slate-200">
            ${totalPagar.toLocaleString('es-CO')}
          </div>
        </div>

        <div>
          <span className="text-xs uppercase text-slate-400 font-medium">Total Asignado</span>
          <div className="text-xl font-bold font-mono text-cyan-300">
            ${totalAsignado.toLocaleString('es-CO')}
          </div>
        </div>

        <div>
          <span className="text-xs uppercase text-slate-400 font-medium">Saldo por Cubrir</span>
          <div
            data-testid="split-remaining-balance"
            className={`text-xl font-bold font-mono flex items-center gap-1.5 ${
              estaCuadrado ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {estaCuadrado ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>${saldoRestante.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* Lista de Líneas de Pago Fraccionado */}
      <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
        {lineas.map((linea, idx) => (
          <div
            key={linea.id}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-white/5"
          >
            {/* Selector de Método */}
            <div className="w-full sm:w-48 shrink-0">
              <select
                value={linea.metodo}
                onChange={(e) =>
                  onUpdateLinea(linea.id, { metodo: e.target.value as MetodoCobroPos })
                }
                aria-label={`Método de pago línea ${idx + 1}`}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {AVAILABLE_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input de Monto */}
            <div className="flex-1 min-w-[140px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                data-testid={`split-amount-${idx}`}
                aria-label={`Monto línea ${idx + 1}`}
                value={linea.monto > 0 ? linea.monto.toLocaleString('es-CO') : ''}
                placeholder="0"
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, '');
                  onUpdateLinea(linea.id, { monto: num ? parseInt(num, 10) : 0 });
                }}
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-base font-bold font-mono text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Input Opcional de Referencia */}
            <div className="w-full sm:w-44 shrink-0">
              <input
                type="text"
                placeholder="Ref / Comprobante"
                aria-label={`Referencia línea ${idx + 1}`}
                value={linea.referencia || ''}
                onChange={(e) => onUpdateLinea(linea.id, { referencia: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/5 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Botón Eliminar Línea */}
            <button
              type="button"
              aria-label={`Eliminar línea ${idx + 1}`}
              disabled={lineas.length <= 1}
              onClick={() => onRemoveLinea(linea.id)}
              className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors rounded-lg hover:bg-rose-950/30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Botón para Añadir Nueva Línea */}
      <button
        type="button"
        onClick={onAddLinea}
        className="w-full py-2.5 px-4 bg-slate-900/40 hover:bg-cyan-950/30 border border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-sm font-semibold text-cyan-300 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>+ Agregar Método</span>
      </button>
    </div>
  );
};

