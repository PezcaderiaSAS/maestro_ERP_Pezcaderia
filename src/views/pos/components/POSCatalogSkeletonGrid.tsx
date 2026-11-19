import React from 'react';

export interface POSCatalogSkeletonGridProps {
  cardsCount?: number; // Default: 18 (matriz 6x3 canónica de alta densidad)
  darkTheme?: boolean;
}

export const POSCatalogSkeletonGrid: React.FC<POSCatalogSkeletonGridProps> = ({
  cardsCount = 18,
  darkTheme = false,
}) => {
  return (
    <div
      data-testid="pos-catalog-skeleton-grid"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5"
    >
      {Array.from({ length: cardsCount }).map((_, idx) => (
        <div
          key={`pos-skeleton-card-${idx}`}
          data-testid="pos-product-card-skeleton"
          className={`border rounded-xl p-2 flex flex-col justify-between min-h-[120px] sm:min-h-[130px] relative transition-all shadow-xs ${
            darkTheme
              ? 'bg-slate-900/60 border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Fila superior: Placeholder de Unidad y Balanza/Estado */}
          <div className="flex items-center justify-between gap-1 h-5">
            <div className="h-3.5 w-7 rounded bg-slate-200 animate-pulse" />
            <div className="h-3.5 w-10 rounded bg-slate-100 animate-pulse" />
          </div>

          {/* Avatar Vectorial: Cuadrado 40x40 (w-10 h-10) matching ProductAvatar sm */}
          <div className="flex items-center justify-center my-0.5 py-0.5">
            <div className="w-10 h-10 rounded-lg bg-slate-200/80 animate-pulse" />
          </div>

          {/* Título: Dos líneas simuladas matching min-h-[26px] */}
          <div className="min-h-[26px] flex flex-col items-center justify-center gap-1 w-full px-1">
            <div className="h-2.5 w-4/5 rounded bg-slate-200 animate-pulse" />
            <div className="h-2 w-3/5 rounded bg-slate-100 animate-pulse" />
          </div>

          {/* Placeholder Bodegas */}
          <div className="h-3.5 flex items-center justify-center gap-1">
            <div className="h-2 w-10 rounded bg-slate-100 animate-pulse" />
          </div>

          {/* Pie de Tarjeta: Stock, Precio Grande y Botón Adición */}
          <div className="mt-0.5 pt-0.5 border-t border-slate-100 flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="h-2 w-12 rounded bg-slate-200/60 animate-pulse" />
              <div className="h-3.5 w-14 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};
