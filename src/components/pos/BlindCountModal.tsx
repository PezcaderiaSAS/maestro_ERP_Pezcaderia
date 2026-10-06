import React, { useState } from 'react';
import { usePosStore } from '../../stores/usePosStore';

export const BlindCountModal: React.FC = () => {
  const { state, closeSession, isLoading, error } = usePosStore();
  const [declaredAmount, setDeclaredAmount] = useState('');

  if (state !== 'BLIND_COUNT') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(declaredAmount);
    if (!isNaN(amount) && amount >= 0) {
      await closeSession(amount);
    }
  };

  const handleCancel = () => {
    usePosStore.setState({ state: 'ACTIVE' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Arqueo Ciego</h2>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
          Por favor, cuente el dinero en caja e ingrese el monto total exacto para finalizar su turno. Las discrepancias serán reportadas.
        </p>

        {error && (
          <div className="p-3 mb-4 text-sm text-rose-200 bg-rose-950/50 border border-rose-900/50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Efectivo Total Declarado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <input 
                type="number"
                step="0.01"
                required
                value={declaredAmount}
                onChange={(e) => setDeclaredAmount(e.target.value)}
                className="w-full min-h-[44px] pl-8 pr-4 bg-slate-950 border border-white/10 rounded-lg text-white tabular-nums text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button"
              onClick={handleCancel}
              className="min-h-[44px] px-5 font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isLoading || !declaredAmount}
              className="min-h-[44px] px-6 font-semibold text-white bg-indigo-600/90 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isLoading ? 'Procesando...' : 'Confirmar Arqueo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
