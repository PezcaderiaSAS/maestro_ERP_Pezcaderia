// src/views/inventory/components/dock/ScaleIndustrialDisplay.tsx
// Display Industrial de Báscula y Botones Táctiles Fitts >= 56px (SPEC-050: TASK-050-01)
// Dark Glassmorphism 60-30-10, tipografía font-mono de alto impacto, WCAG AAA y teclado físico

import React from 'react';
import {
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';

export interface ScaleIndustrialDisplayProps {
  pesoBruto: number;
  tara: number;
  pesoNeto: number;
  isStable: boolean;
  isConnected?: boolean;
  onCapture: () => void;
  onTare: () => void;
  onStabilize?: () => void;
  canastillaNumero?: number;
  className?: string;
}

export const ScaleIndustrialDisplay: React.FC<ScaleIndustrialDisplayProps> = ({
  pesoBruto = 0,
  tara = 0,
  pesoNeto = 0,
  isStable = true,
  isConnected = true,
  onCapture,
  onTare,
  onStabilize,
  canastillaNumero = 1,
  className = '',
}) => {
  const isNetoValido = pesoNeto > 0;

  return (
    <div
      data-testid="scale-industrial-display"
      className={`bg-[#131C2E]/80 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-5 shadow-2xl shadow-cyan-950/20 space-y-5 ${className}`}
    >
      {/* ── 1. Barra Superior de Estado y Conectividad de Báscula ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Báscula Digital de Muelle
              {canastillaNumero && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                  Canastilla #{canastillaNumero}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">Captura de peso para recepción de furgón</p>
          </div>
        </div>

        {/* Badges de Conectividad & Estabilidad */}
        <div className="flex items-center gap-2">
          {/* Badge Conectividad */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isConnected
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                CONECTADA
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                DESCONECTADA
              </>
            )}
          </span>

          {/* Badge Estabilidad */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              isStable
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStable ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
              }`}
            />
            {isStable ? 'ESTABLE' : 'LEYENDO / INESTABLE'}
          </span>
        </div>
      </div>

      {/* ── 2. Display Numérico Central (WCAG AAA & font-mono) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Sub-tarjeta: Peso Bruto */}
        <div className="bg-[#0B0F19]/90 border border-slate-800 rounded-xl p-3.5 text-center flex flex-col justify-between shadow-inner">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peso Bruto</span>
          <div className="font-mono text-2xl font-black text-slate-200 my-1">
            {pesoBruto.toFixed(2)} kg
          </div>
          <span className="text-[10px] text-slate-500">Plataforma total</span>
        </div>

        {/* Sub-tarjeta: Tara */}
        <div className="bg-[#0B0F19]/90 border border-amber-500/30 rounded-xl p-3.5 text-center flex flex-col justify-between shadow-inner">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Tara Canastilla</span>
          <div className="font-mono text-2xl font-black text-amber-300 my-1">
            {tara.toFixed(2)} kg
          </div>
          <span className="text-[10px] text-amber-500/80">Descuento de empaque</span>
        </div>

        {/* Sub-tarjeta Principal: Peso Neto Real */}
        <div className="bg-[#0B0F19]/95 border-2 border-emerald-500/50 rounded-xl p-3.5 text-center flex flex-col justify-between shadow-lg shadow-emerald-950/20">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Peso Neto Real
          </span>
          <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 my-1">
            {pesoNeto.toFixed(2)} kg
          </div>
          <span className="text-[10px] text-emerald-500/80">Kilos a liquidar</span>
        </div>
      </div>

      {/* ── 3. Botones Táctiles de Gran Formato (Ley de Fitts >= 56px) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Botón 1: Tarar Báscula */}
        <button
          type="button"
          onClick={onTare}
          className="min-h-[56px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] text-amber-300 border border-amber-500/40 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          title="Establecer tara actual en báscula [Atajo: T]"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Tarar Báscula</span>
        </button>

        {/* Botón 2: Estabilizar / Leer */}
        {onStabilize && (
          <button
            type="button"
            onClick={onStabilize}
            className="min-h-[56px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-[0.98] text-slate-300 border border-white/10 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            title="Solicitar nueva lectura de estabilización"
          >
            <Scale className="w-4 h-4 text-slate-400" />
            <span>Estabilizar</span>
          </button>
        )}

        {/* Botón 3: Capturar Pesada (Primario Sobredimensionado) */}
        <button
          type="button"
          disabled={!isNetoValido}
          onClick={() => {
            if (isNetoValido) {
              onCapture();
            }
          }}
          className={`min-h-[56px] sm:col-span-1 flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
            isNetoValido
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
          }`}
          title="Guardar peso de la canastilla actual [Atajo: Espacio / Enter]"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Capturar Pesada</span>
        </button>
      </div>

      {/* Micro-ayuda ergonómica */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
        <span>Atajos: [Espacio] Capturar • [T] Tarar</span>
        {!isNetoValido && (
          <span className="text-amber-400 flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            El peso neto debe ser mayor a 0 kg
          </span>
        )}
      </div>
    </div>
  );
};

export default ScaleIndustrialDisplay;
