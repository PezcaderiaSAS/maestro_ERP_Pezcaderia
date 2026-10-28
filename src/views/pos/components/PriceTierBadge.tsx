// src/views/pos/components/PriceTierBadge.tsx
// Badge de Indicación de Tarifa Aplicada (Detal vs Mayorista) en Dark Glassmorphism V8

import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

export interface PriceTierBadgeProps {
  tarifa: 'DETAL' | 'MAYORISTA';
  ahorroTotal?: number;
  className?: string;
}

export const PriceTierBadge: React.FC<PriceTierBadgeProps> = ({
  tarifa,
  ahorroTotal = 0,
  className = '',
}) => {
  if (tarifa === 'MAYORISTA') {
    return (
      <span
        data-testid="tier-badge-wholesale"
        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 ${className}`}
        title={
          ahorroTotal > 0
            ? `Tarifa Mayorista aplicada. Ahorro total: $${ahorroTotal.toLocaleString('es-CO')}`
            : 'Tarifa Mayorista aplicada'
        }
      >
        <Tag className="w-2.5 h-2.5 text-amber-400" />
        <span>MAYORISTA</span>
        {ahorroTotal > 0 && (
          <span className="ml-1 text-[9px] font-bold text-amber-200 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-600/30">
            -${ahorroTotal.toLocaleString('es-CO')}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      data-testid="tier-badge-retail"
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300 border border-white/10 ${className}`}
      title="Precio estándar al detal de mostrador"
    >
      <Sparkles className="w-2.5 h-2.5 text-slate-400" />
      <span>DETAL</span>
    </span>
  );
};

