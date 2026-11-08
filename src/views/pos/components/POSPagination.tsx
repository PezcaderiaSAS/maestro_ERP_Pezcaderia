import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface POSPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export const POSPagination: React.FC<POSPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 18,
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  // Generar ventana de páginas visibles (hasta 5 páginas centradas)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = totalItems ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className="pos-pagination flex flex-wrap items-center justify-between sm:justify-center gap-2 pt-2 pb-0.5 border-t border-white/10 text-xs shrink-0 select-none">
      {/* Botón Anterior */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="min-h-[36px] px-3 rounded-lg flex items-center gap-1 font-bold transition-all disabled:opacity-40 disabled:pointer-events-none bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 active:scale-95 cursor-pointer shadow-sm"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
        <span>&lt; Anterior</span>
      </button>

      {/* Lista de números de página */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span key={`dots-${idx}`} className="px-2 text-slate-500 font-bold">
                ...
              </span>
            );
          }

          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg flex items-center justify-center font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm ${
                isCurrent
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="min-h-[36px] px-3 rounded-lg flex items-center gap-1 font-bold transition-all disabled:opacity-40 disabled:pointer-events-none bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 active:scale-95 cursor-pointer shadow-sm"
        aria-label="Página siguiente"
      >
        <span>Siguiente &gt;</span>
        <ChevronRight size={16} />
      </button>

      {/* Contador Informativo */}
      {totalItems !== undefined && (
        <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 ml-2">
          {startItem}-{endItem} de {totalItems}
        </span>
      )}
    </div>
  );
};
