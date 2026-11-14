import React from 'react';

export interface OmniboxFooterProps {
  resultCount: number;
}

export const OmniboxFooter: React.FC<OmniboxFooterProps> = ({ resultCount }) => {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 border-t border-white/10 bg-slate-950/80 text-[11px] text-slate-400">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-slate-300">
            ↑↓
          </kbd>{' '}
          Navegar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-slate-300">
            Enter
          </kbd>{' '}
          Seleccionar
        </span>
        <span className="flex items-center gap-1 hidden sm:inline-flex">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-slate-300">
            Tab
          </kbd>{' '}
          Filtro
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-slate-300">
            Esc
          </kbd>{' '}
          Cerrar
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
        <span>{resultCount} resultados</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-cyan-400/80 font-bold hidden sm:inline">Pezcadería Omnibox</span>
      </div>
    </div>
  );
};

