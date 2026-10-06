import React from 'react';
import { usePosStore } from '../../stores/usePosStore';

export const PosHeaderActions: React.FC = () => {
  const { state, openSession, closeSession } = usePosStore();

  const handleOpen = () => {
    // Valores de ejemplo. En producción se ingresa mediante UI.
    openSession('caja-principal', 0);
  };

  const handleBlindCount = () => {
    usePosStore.setState({ state: 'BLIND_COUNT' });
  };

  return (
    <header className="flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 relative z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white tracking-tight">Pezcadería POS</h1>
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-slate-900 border border-white/5 text-slate-300">
          Estado: <span className={state === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{state}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        {state === 'CLOSED' && (
          <button 
            onClick={handleOpen}
            className="min-h-[44px] px-6 font-semibold text-white bg-emerald-600/90 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20 backdrop-blur-md transition-all active:scale-95"
          >
            Abrir Caja
          </button>
        )}
        {state === 'ACTIVE' && (
          <>
            <button 
              className="min-h-[44px] px-6 font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg backdrop-blur-md transition-all active:scale-95"
            >
              Reabastecimiento
            </button>
            <button 
              onClick={handleBlindCount}
              className="min-h-[44px] px-6 font-semibold text-white bg-rose-600/90 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20 backdrop-blur-md transition-all active:scale-95"
            >
              Cerrar Turno (Arqueo)
            </button>
          </>
        )}
      </div>
    </header>
  );
};
