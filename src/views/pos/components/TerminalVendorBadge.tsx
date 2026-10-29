// src/views/pos/components/TerminalVendorBadge.tsx
// Badge de alta fidelidad Dark Glassmorphism V8 para Terminal POS y Vendedor Activo

import React, { useState } from 'react';
import { Monitor, User, ChevronDown, Check, ShieldAlert } from 'lucide-react';
import { useMultiVendorPosStore } from '../../../stores/useMultiVendorPosStore';

const TERMINALES_DISPONIBLES = [
  'TERM-01',
  'TERM-02',
  'TERM-03',
  'TERM-04',
  'TERM-05',
  'TERM-06',
  'TERM-07',
  'TERM-08',
];

interface TerminalVendorBadgeProps {
  onCambiarVendedor?: () => void;
  className?: string;
}

export const TerminalVendorBadge: React.FC<TerminalVendorBadgeProps> = ({
  onCambiarVendedor,
  className = '',
}) => {
  const {
    terminalId,
    vendedorActivo,
    turnoCentralEstado,
    setTerminalId,
  } = useMultiVendorPosStore();

  const [selectorAbierto, setSelectorAbierto] = useState(false);

  const isCajaAbierta = turnoCentralEstado === 'ABIERTO';

  const handleSeleccionarTerminal = (term: string) => {
    setTerminalId(term);
    setSelectorAbierto(false);
  };

  return (
    <div
      className={`relative inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg text-xs select-none ${className}`}
    >
      {/* 1. Selector de Terminal POS (TERM-01 a TERM-08) */}
      <div className="relative">
        <button
          type="button"
          data-testid="btn-toggle-terminal-select"
          onClick={() => setSelectorAbierto(!selectorAbierto)}
          className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 transition-all cursor-pointer"
          title="Cambiar Terminal de Punto de Venta"
        >
          <Monitor size={14} className="text-cyan-400" />
          <span>{terminalId}</span>
          <ChevronDown size={12} className="opacity-70" />
        </button>

        {/* Menú Desplegable de Terminales */}
        {selectorAbierto && (
          <div className="absolute top-full left-0 mt-2 w-36 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl z-50">
            <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Terminal POS
            </div>
            {TERMINALES_DISPONIBLES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSeleccionarTerminal(term)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  term === terminalId
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{term}</span>
                {term === terminalId && <Check size={13} className="text-cyan-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Vendedor Activo */}
      <button
        type="button"
        data-testid="btn-cambiar-vendedor"
        onClick={onCambiarVendedor}
        className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-medium border border-white/5 transition-all cursor-pointer"
        title="Clic para cambiar de vendedor o cerrar sesión"
      >
        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
          <User size={12} />
        </div>
        <span className="truncate max-w-[120px]">
          {vendedorActivo?.nombre || 'Sin Vendedor'}
        </span>
      </button>

      {/* 3. Semáforo de Estado de Caja Central Compartida */}
      <div
        className={`flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border font-semibold text-[11px] ${
          isCajaAbierta
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
        }`}
        title={
          isCajaAbierta
            ? 'Turno de caja central abierto para cobro en efectivo'
            : 'Caja central cerrada. Se requiere apertura centralizada para recibir efectivo'
        }
      >
        <span
          data-testid="status-caja-indicator"
          className={`w-2 h-2 rounded-full animate-pulse ${
            isCajaAbierta ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
        <span>
          {isCajaAbierta ? 'Caja Central Abierta' : 'Caja Central Cerrada'}
        </span>
        {!isCajaAbierta && <ShieldAlert size={12} className="text-rose-400 ml-0.5" />}
      </div>
    </div>
  );
};
