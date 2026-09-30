import React from 'react';

export interface ShimmerSkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  height?: string | number;
  width?: string | number;
}

/**
 * Componente base de carga Shimmer Skeleton para Suspense en React 18.
 * Diseñado conforme a los estándares de /erp-uiux-design-system y el Tridecálogo del CSS Moderno:
 * - Aislamiento de contexto con 'isolate'
 * - Compatibilidad total con Dark Mode y Obsidian Mode
 * - Prevención estricta de saltos de pantalla (Cumulative Layout Shift - CLS = 0)
 */
export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  height,
  width,
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-sm',
    rectangular: 'rounded-md',
    circular: 'rounded-full aspect-square',
    card: 'rounded-xl p-5 border border-slate-800/80 bg-slate-900/40',
  };

  const style: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  };

  return (
    <div
      style={style}
      className={`isolate relative overflow-hidden bg-slate-800/60 dark:bg-slate-800/40 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent ${variantStyles[variant]} ${className}`}
    />
  );
};

/**
 * Esqueleto estructurado para Data Tables de alta densidad (WMS / POS / Kardex)
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`isolate w-full rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden ${className}`}>
      {/* Cabecera de la tabla */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        {Array.from({ length: columns }).map((_, i) => (
          <ShimmerSkeleton key={`th-${i}`} variant="text" className="h-4 flex-1 max-w-[120px]" />
        ))}
      </div>
      {/* Filas de la tabla */}
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <ShimmerSkeleton
                key={`td-${r}-${c}`}
                variant="text"
                className={`h-3.5 flex-1 ${c === 0 ? 'max-w-[160px]' : c === columns - 1 ? 'max-w-[80px]' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Esqueleto para tarjetas de indicadores KPI
 */
export const KpiCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`isolate rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <ShimmerSkeleton variant="text" className="h-3 w-24" />
        <ShimmerSkeleton variant="rectangular" className="h-8 w-8 rounded-lg" />
      </div>
      <ShimmerSkeleton variant="text" className="h-7 w-36" />
      <div className="flex items-center gap-2 pt-1">
        <ShimmerSkeleton variant="text" className="h-3 w-16" />
        <ShimmerSkeleton variant="text" className="h-3 w-20" />
      </div>
    </div>
  );
};
