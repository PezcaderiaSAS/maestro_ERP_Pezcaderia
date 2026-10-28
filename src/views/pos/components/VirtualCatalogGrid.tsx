// src/views/pos/components/VirtualCatalogGrid.tsx
// Grilla Virtualizada de Catálogo Masivo para POS (Dark Glassmorphism V8)
// Renderiza exactamente los elementos visibles en el viewport (12-24 tarjetas) a 120 FPS.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Producto } from '../../../store/useInventoryStore';
import { useVirtualGrid } from '../../../hooks/useVirtualGrid';
import { Plus, Tag } from 'lucide-react';

export interface VirtualCatalogGridProps {
  products: Producto[];
  onSelectProduct?: (product: Producto) => void;
  onAddToCart?: (product: Producto) => void;
  containerHeight?: number;
  columnsCount?: number;
  rowHeight?: number;
}

export const VirtualCatalogGrid: React.FC<VirtualCatalogGridProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  containerHeight = 600,
  columnsCount = 4,
  rowHeight = 140,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Manejador de scroll con requestAnimationFrame para 120 FPS
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  const { totalHeight, virtualItems } = useVirtualGrid({
    totalItems: products.length,
    columnsCount,
    rowHeight,
    containerHeight,
    scrollTop,
    overscan: 2,
  });

  return (
    <div
      ref={containerRef}
      data-testid="virtual-catalog-grid"
      onScroll={handleScroll}
      className="relative w-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10"
      style={{ height: `${containerHeight}px` }}
    >
      {/* Contenedor fantasma que da la altura virtual completa del scroll */}
      <div
        className="w-full relative"
        style={{ height: `${totalHeight}px`, minHeight: '100%' }}
      >
        {virtualItems.map((vItem) => {
          const product = products[vItem.index];
          if (!product) return null;

          const precioDetal = product.precio_venta_pos || 0;
          const precioMayorista =
            (product as any).precio_venta_mayorista || (product as any).precioMayorista || precioDetal;
          const tieneMayorista = precioMayorista > 0 && precioMayorista < precioDetal;

          return (
            <div
              key={product.sku || product.id || vItem.index}
              data-testid="virtual-product-card"
              className="absolute p-1.5 box-border"
              style={{
                top: `${vItem.top}px`,
                left: `${vItem.leftPercent}%`,
                width: `${vItem.widthPercent}%`,
                height: `${rowHeight}px`,
              }}
            >
              <div
                onClick={() => onSelectProduct?.(product)}
                className="w-full h-full p-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-cyan-500/10 text-slate-100"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40 truncate max-w-[80px]">
                      {product.sku}
                    </span>
                    {tieneMayorista && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/50 px-1 py-0.5 rounded border border-amber-800/40 flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" /> MAYORISTA
                      </span>
                    )}
                  </div>
                  <h4
                    className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors"
                    title={product.nombre}
                  >
                    {product.nombre}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-1">
                  <div>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      ${precioDetal.toLocaleString('es-CO')}
                    </span>
                    {tieneMayorista && (
                      <span className="block text-[9px] text-slate-400 font-mono">
                        May: ${precioMayorista.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(product);
                    }}
                    aria-label={`Agregar ${product.nombre}`}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
