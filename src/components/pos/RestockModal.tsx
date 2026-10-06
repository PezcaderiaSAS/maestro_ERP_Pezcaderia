import React, { useState } from 'react';
import { usePosStore } from '../../stores/usePosStore';

export const RestockModal: React.FC = () => {
  const { state } = usePosStore();
  const [isOpen, setIsOpen] = useState(false);

  // En un caso real, el trigger de este modal sería un botón que setea isOpen=true
  // Por simplificación para el flujo actual, expondremos el botón aquí mismo si el estado es ACTIVE.
  
  if (state !== 'ACTIVE') return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="min-h-[44px] px-6 font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg backdrop-blur-md transition-all active:scale-95"
      >
        Reabastecimiento Express
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Reabastecer desde Bodega</h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Genera una solicitud rápida hacia el WMS para traer inventario a la nevera frontal.
            </p>

            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">Producto (Código o Escáner)</label>
                <input 
                  type="text"
                  className="w-full min-h-[44px] px-4 bg-slate-950 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="Escanee el producto..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">Cantidad Solicitada (KG/UN)</label>
                <input 
                  type="number"
                  step="0.1"
                  className="w-full min-h-[44px] px-4 bg-slate-950 border border-white/10 rounded-lg text-white tabular-nums text-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="0.0"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[44px] px-5 font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[44px] px-6 font-semibold text-white bg-amber-600/90 hover:bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  Solicitar a Cuarto Frío
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
