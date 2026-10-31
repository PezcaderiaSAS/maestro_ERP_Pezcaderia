// src/views/pos/components/InternalQueueTicker.tsx
// Cintillo compacto de cola interna y monitoreo de turnos (SPEC-047)
// Dark Glassmorphism 60-30-10 con tipografía tabular font-mono y llamada verbal

import React from 'react';
import { Clock, Users, Volume2, Radio, CheckCircle2 } from 'lucide-react';

export interface InternalQueueTickerProps {
  currentTurn?: string | null;
  pendingCount?: number;
  averageWaitMinutes?: number;
  onCallTurn?: (turn: string) => void;
  className?: string;
  isRealtimeConnected?: boolean;
}

export const InternalQueueTicker: React.FC<InternalQueueTickerProps> = ({
  currentTurn,
  pendingCount = 0,
  averageWaitMinutes = 0,
  onCallTurn,
  className = '',
  isRealtimeConnected = true,
}) => {
  const hasActiveTurn = Boolean(currentTurn);

  return (
    <div
      role="region"
      aria-label="Cintillo de monitoreo de turnos y cola comercial"
      className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-md ${className}`}
    >
      {/* Indicador de Estado Realtime */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {isRealtimeConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600" />
          )}
        </span>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider hidden sm:inline">
          {isRealtimeConnected ? 'Cola En Vivo' : 'Offline'}
        </span>
      </div>

      {/* Turno en Atención */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Turno:</span>
        {hasActiveTurn ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-800/60 font-mono text-sm font-bold text-cyan-300 tracking-wide shadow-inner">
            {currentTurn}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/50 text-xs font-medium text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Cola Libre
          </span>
        )}
      </div>

      {/* Métricas de Espera */}
      <div className="flex items-center gap-3">
        {/* Comandas en espera */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono font-bold text-amber-400">
            {pendingCount} en espera
          </span>
        </div>

        {/* Tiempo promedio */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`font-mono font-bold ${
              averageWaitMinutes > 15
                ? 'text-rose-400'
                : averageWaitMinutes > 5
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            ~{averageWaitMinutes} min
          </span>
        </div>

        {/* Botón de Llamada Verbal */}
        {onCallTurn && hasActiveTurn && (
          <button
            type="button"
            aria-label="Llamar turno al cliente"
            onClick={() => onCallTurn(currentTurn!)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Llamar</span>
          </button>
        )}
      </div>
    </div>
  );
};
