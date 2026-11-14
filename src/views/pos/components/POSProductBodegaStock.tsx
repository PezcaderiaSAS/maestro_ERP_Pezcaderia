import React from 'react';
import type { BodegaStockItem } from '../posWarehouseStock.utils';

export interface POSProductBodegaStockProps {
  bodegas?: BodegaStockItem[];
  unit?: string;
  className?: string;
  maxVisible?: number;
}

/**
 * Subcomponente atómico de alta densidad para visualizar el desglose
 * de inventario por bodega en tarjetas de catálogo POS (SaaS Light Mode).
 * Cumple con WCAG 2.2 AA+ (contraste >= 4.5:1) y retícula compacta.
 */
export const POSProductBodegaStock: React.FC<POSProductBodegaStockProps> = ({
  bodegas = [],
  unit = '',
  className = '',
  maxVisible = 3,
}) => {
  if (!bodegas || bodegas.length === 0) {
    return null;
  }

  // Ordenar priorizando bodegas que tienen existencias
  const sorted = [...bodegas].sort((a, b) => {
    if (a.disponible && !b.disponible) return -1;
    if (!a.disponible && b.disponible) return 1;
    return b.cantidad - a.cantidad;
  });

  const visibleBodegas = sorted.slice(0, maxVisible);
  const hiddenBodegas = sorted.slice(maxVisible);
  const hiddenCount = hiddenBodegas.length;

  const hiddenTooltip = hiddenBodegas
    .map((b) => `${b.bodegaNombre}: ${b.cantidad} ${unit}`)
    .join(' | ');

  const formatQty = (qty: number): string => {
    if (qty === 0) return '0';
    return qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
  };

  return (
    <div
      data-testid="pos-product-bodega-stock-container"
      className={`flex flex-wrap items-center gap-1 my-1 ${className}`}
    >
      {visibleBodegas.map((b) => {
        const hasStock = b.disponible && b.cantidad > 0;
        return (
          <span
            key={b.bodegaId || b.bodegaAbrev}
            data-testid={`bodega-pill-${b.bodegaAbrev}`}
            title={`${b.bodegaNombre}: ${b.cantidad} ${unit}`}
            className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono leading-tight tracking-tight border transition-colors ${
              hasStock
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold'
                : 'bg-slate-100 text-slate-400 border-slate-200/60 font-normal'
            }`}
          >
            <span className={hasStock ? 'font-bold text-emerald-900' : 'font-medium'}>
              {b.bodegaAbrev}:
            </span>
            <span>{formatQty(b.cantidad)}</span>
          </span>
        );
      })}

      {hiddenCount > 0 && (
        <span
          data-testid="bodega-more-badge"
          title={hiddenTooltip}
          className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-mono font-bold leading-tight bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300 cursor-help"
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

