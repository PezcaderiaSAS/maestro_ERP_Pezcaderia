// src/hooks/useVirtualGrid.ts
// Hook Headless y Función Matemática de Virtualización de Grilla Responsiva para Catálogos Masivos (16k+ ítems)
// Mantiene el consumo de nodos DOM constante O(1) y 120 FPS sin dependencias externas.

import { useMemo } from 'react';

export interface UseVirtualGridOptions {
  totalItems: number;
  columnsCount: number;
  rowHeight: number;
  containerHeight: number;
  scrollTop: number;
  overscan?: number;
}

export interface VirtualGridItem {
  index: number;
  row: number;
  col: number;
  top: number;
  leftPercent: number;
  widthPercent: number;
}

export interface UseVirtualGridReturn {
  totalRows: number;
  totalHeight: number;
  startRow: number;
  endRow: number;
  startIndex: number;
  endIndex: number;
  virtualItems: VirtualGridItem[];
}

/**
 * Función pura de cálculo matemático de ventana virtual (Zero React Hook overhead)
 */
export function calculateVirtualGrid({
  totalItems,
  columnsCount,
  rowHeight,
  containerHeight,
  scrollTop,
  overscan = 2,
}: UseVirtualGridOptions): UseVirtualGridReturn {
  const cols = Math.max(1, columnsCount);
  const totalRows = Math.ceil(totalItems / cols);
  const totalHeight = totalRows * rowHeight;

  if (totalItems === 0 || containerHeight <= 0) {
    return {
      totalRows: 0,
      totalHeight: 0,
      startRow: 0,
      endRow: 0,
      startIndex: 0,
      endIndex: 0,
      virtualItems: [],
    };
  }

  const calculatedStartRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const calculatedEndRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  const startIndex = calculatedStartRow * cols;
  const endIndex = Math.min(totalItems, calculatedEndRow * cols);

  const virtualItems: VirtualGridItem[] = [];
  const widthPercent = 100 / cols;

  for (let r = calculatedStartRow; r < calculatedEndRow; r++) {
    const top = r * rowHeight;
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      if (index < totalItems) {
        virtualItems.push({
          index,
          row: r,
          col: c,
          top,
          leftPercent: c * widthPercent,
          widthPercent,
        });
      }
    }
  }

  return {
    totalRows,
    totalHeight,
    startRow: calculatedStartRow,
    endRow: calculatedEndRow,
    startIndex,
    endIndex,
    virtualItems,
  };
}

/**
 * Hook de React memoizado para componentes funcionales
 */
export function useVirtualGrid(options: UseVirtualGridOptions): UseVirtualGridReturn {
  return useMemo(() => calculateVirtualGrid(options), [
    options.totalItems,
    options.columnsCount,
    options.rowHeight,
    options.containerHeight,
    options.scrollTop,
    options.overscan,
  ]);
}
