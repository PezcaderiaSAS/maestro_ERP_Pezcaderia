import type { Product } from '../../types/erp.types';
import type { Bodega } from '../../store/useWarehouseStore';

/**
 * Representación atómica de inventario por bodega para una tarjeta de producto.
 */
export interface BodegaStockItem {
  bodegaId: string;
  bodegaNombre: string;
  bodegaAbrev: string;
  cantidad: number;
  disponible: boolean;
}

/**
 * Resumen consolidado y detallado de inventario para un producto.
 */
export interface ProductStockBreakdown {
  totalStock: number;
  sinStock: boolean;
  bodegas: BodegaStockItem[];
}

/**
 * Diccionario de retorno optimizado para acceso O(1) en catálogos de alta densidad.
 */
export interface StockMapResult {
  flatStockMap: Record<string, number>;
  breakdownMap: Record<string, BodegaStockItem[]>;
}

/**
 * Genera una abreviatura ergonómica (3-5 letras) a partir del nombre o tipo de bodega.
 */
export function getBodegaAbrev(nombre: string, esPuntoVenta?: boolean): string {
  if (esPuntoVenta) return 'Most';
  const clean = (nombre || '').toLowerCase().trim();

  if (clean.includes('mostrador') || clean.includes('punto de venta') || clean.includes('pos')) {
    return 'Most';
  }
  if (clean.includes('frío') || clean.includes('frio') || clean.includes('congelador') || clean.includes('refrig')) {
    return 'Frío';
  }
  if (clean.includes('principal') || clean.includes('central') || clean.includes('matriz')) {
    return 'Princ';
  }
  if (clean.includes('avería') || clean.includes('averia') || clean.includes('merma')) {
    return 'Aver';
  }
  if (clean.includes('secundaria') || clean.includes('auxiliar')) {
    return 'Sec';
  }
  if (clean.includes('tránsito') || clean.includes('transito')) {
    return 'Trán';
  }

  // Fallback: Tomar la primera palabra o hasta 4 letras limpias
  const firstWord = clean.split(' ')[0] || 'Bod';
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1, 4);
}

/**
 * Determina si una bodega es comercialmente apta para venta en POS.
 */
function isBodegaSellable(b: Bodega): boolean {
  if (!b.activa) return false;
  if (b.tipo === 'AVERIAS') return false;
  const lower = (b.nombre || '').toLowerCase();
  if (lower.includes('avería') || lower.includes('averia')) return false;
  return true;
}

/**
 * Extrae la cantidad en stock de una bodega específica soportando búsqueda por id o por nombre,
 * y por sku o por productId.
 */
function getQuantityFromBodega(
  stockNested: Record<string, Record<string, number>> | undefined,
  bodega: Bodega,
  product: Product
): number {
  if (!stockNested) return 0;
  const bodegaDict = stockNested[bodega.id] || stockNested[bodega.nombre];
  if (!bodegaDict) return 0;

  const sku = product.sku || '';
  const id = product.id || '';

  if (sku && typeof bodegaDict[sku] === 'number') {
    return bodegaDict[sku];
  }
  if (id && typeof bodegaDict[id] === 'number') {
    return bodegaDict[id];
  }
  return 0;
}

/**
 * Calcula el inventario desglosado y consolidado para un producto individual.
 */
export function getProductBodegaStock(
  product: Product,
  stockNested: Record<string, Record<string, number>> | undefined,
  bodegas: Bodega[]
): ProductStockBreakdown {
  // Productos de servicio o sin control de inventario
  if (product.control_inventario === false || (product as any).controlInventario === false) {
    return {
      totalStock: Infinity,
      sinStock: false,
      bodegas: [],
    };
  }

  const sellableBodegas = bodegas.filter(isBodegaSellable);
  let total = 0;
  const items: BodegaStockItem[] = [];

  for (const b of sellableBodegas) {
    const qty = getQuantityFromBodega(stockNested, b, product);
    total += qty;
    items.push({
      bodegaId: b.id,
      bodegaNombre: b.nombre,
      bodegaAbrev: getBodegaAbrev(b.nombre, b.esPuntoVenta),
      cantidad: qty,
      disponible: qty > 0,
    });
  }

  return {
    totalStock: Math.max(0, total),
    sinStock: total <= 0,
    bodegas: items,
  };
}

/**
 * Normaliza y compila los diccionarios de stock para toda la lista de productos del POS.
 * Retorna accesos rápidos O(1) tanto por ID como por SKU.
 */
export function buildAllProductsStockMap(
  products: Product[],
  stockNested: Record<string, Record<string, number>> | undefined,
  bodegas: Bodega[]
): StockMapResult {
  const flatStockMap: Record<string, number> = {};
  const breakdownMap: Record<string, BodegaStockItem[]> = {};

  for (const prod of products) {
    const { totalStock, bodegas: items } = getProductBodegaStock(prod, stockNested, bodegas);

    if (prod.id) {
      flatStockMap[prod.id] = totalStock;
      breakdownMap[prod.id] = items;
    }
    if (prod.sku) {
      flatStockMap[prod.sku] = totalStock;
      breakdownMap[prod.sku] = items;
    }
  }

  return { flatStockMap, breakdownMap };
}

