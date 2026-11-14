import React from 'react';
import { Search, X } from 'lucide-react';

export interface OmniboxHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const OmniboxHeader: React.FC<OmniboxHeaderProps> = ({
  query,
  onQueryChange,
  onClear,
  onClose,
  inputRef,
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/70">
      <Search className="h-5 w-5 text-cyan-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar módulo, producto, cliente o comando... (Ctrl+K)"
        className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none tracking-wide"
        aria-label="Buscar en Pezcadería ERP"
      />
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Limpiar búsqueda"
        >
          <X size={15} />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Cerrar (Esc)"
      >
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 rounded border border-white/15 text-slate-300">
          Esc
        </kbd>
      </button>
    </div>
  );
};
