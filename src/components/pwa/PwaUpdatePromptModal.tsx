/**
 * ============================================================================
 * LA PEZCADERIA ERP — MODAL TÁCTIL DE ACTUALIZACIÓN DISPONIBLE PWA
 * ============================================================================
 * Especificación: SPEC-024 (TASK-024-04)
 * Principios: "Regla del Niño de 12 Años", Botón >= 56px, WCAG 2.2 AA+
 * ============================================================================
 */

import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { usePwaStore } from '../../store/usePwaStore';

export const PwaUpdatePromptModal: React.FC = () => {
  const { hasUpdatePending, applyUpdate, dismissUpdate } = usePwaStore();

  if (!hasUpdatePending) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-update-title"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl p-5 space-y-4">
        {/* Encabezado y botón cerrar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 id="pwa-update-title" className="text-base font-black text-slate-900 leading-tight">
                Nueva Versión Disponible
              </h3>
              <p className="text-xs text-slate-600 font-medium">La Pezcadería ERP</p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissUpdate}
            aria-label="Cerrar aviso de actualización"
            className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje descriptivo */}
        <p className="text-xs text-slate-700 leading-relaxed">
          Hay una actualización lista con mejoras de rendimiento y sincronización en ruta. Actualiza en 1 toque para aplicar los cambios sin perder tus datos locales.
        </p>

        {/* Acciones táctiles ergonómicas */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={applyUpdate}
            className="w-full min-h-[56px] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
            <span>ACTUALIZAR AHORA</span>
          </button>

          <button
            type="button"
            onClick={dismissUpdate}
            className="w-full min-h-[48px] rounded-xl hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <span>Continuar trabajando (Más tarde)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
