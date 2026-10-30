import React from 'react';
import { Plus } from 'lucide-react';

interface DiscountPanelProps {
  subtotal: number;
  totalItems: number;
  descuentoPct: number;
  descuentoValor: number;
  totalIva?: number;
  subtotalBaseGravable?: number;
  onDescuentoClick: () => void;
}

export const DiscountPanel: React.FC<DiscountPanelProps> = ({
  subtotal,
  totalItems,
  descuentoPct,
  descuentoValor,
  totalIva = 0,
  subtotalBaseGravable,
  onDescuentoClick,
}) => {
  return (
    <div className="pos-discount-panel flex flex-col gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/10 select-none">
      <div className="summary-row flex justify-between items-center text-xs text-slate-400">
        <span>Subtotal ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})</span>
        <span className="font-bold text-slate-200 font-mono tracking-tight">${subtotal.toLocaleString('es-CO')}</span>
      </div>

      {totalIva > 0 && subtotalBaseGravable !== undefined && (
        <div className="summary-row flex justify-between items-center text-[11px] text-slate-400">
          <span>Base Gravable</span>
          <span className="font-mono text-slate-300">${subtotalBaseGravable.toLocaleString('es-CO')}</span>
        </div>
      )}

      <div className="summary-row flex justify-between items-center text-xs text-slate-400">
        <span>{totalIva > 0 ? 'IVA Incluido' : 'Impuestos (0%)'}</span>
        <span className="font-bold text-slate-200 font-mono tracking-tight">${totalIva.toLocaleString('es-CO')}</span>
      </div>

      <div 
        className="summary-row flex justify-between items-center text-xs pt-1 border-t border-white/10 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors"
        onClick={onDescuentoClick}
        title="Aplicar o modificar descuento global (Atajo: F4)"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDescuentoClick();
          }
        }}
      >
        <span className="text-cyan-400 font-bold flex items-center gap-1.5">
          Descuento {descuentoPct > 0 && `(${descuentoPct}%)`} <Plus size={12} />
          <kbd className="px-1 py-0.5 text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded ml-1">F4</kbd>
          {descuentoPct > 10 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-medium">
              Supervisor
            </span>
          )}
        </span>
        <span className={`font-mono font-bold ${descuentoPct > 0 ? 'text-cyan-300' : 'text-slate-400'}`}>
          -${descuentoValor.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
};
