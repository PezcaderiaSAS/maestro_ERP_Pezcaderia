// src/types/inventory.types.ts

/**
 * Contratos de tipo para el dominio de Inventario.
 * Regla constitucional: Análisis ABC prioriza Pareto 80/20 (categoriaABC).
 * Los campos `readonly` previenen mutaciones accidentales fuera de los stores Zustand.
 */

// ---------------------------------------------------------------------------
// Entidades de Catálogo
// ---------------------------------------------------------------------------

export interface Producto {
  readonly id: string;
  readonly sku: string;                        // ÚNICO en el catálogo
  nombre: string;
  categoriaId: string;
  unidadMedida: 'KG' | 'UNIDAD' | 'GRAMO';
  precioCompra: number;
  precioVentaPOS: number;
  precioVentaRestaurante: number;
  precioVentaMayorista: number;
  codigoBarras: string | null;
  imagenUrl: string | null;
  bufferSeguridad: number;                     // Nivel mínimo para alerta de stock
  categoriaABC?: 'A' | 'B' | 'C';             // Clasificación Pareto (80/20)
  activo: boolean;
}

export interface Categoria {
  readonly id: string;
  tipo: string;    // Nivel 1 (ej: "Pescados")
  linea: string;   // Nivel 2 (ej: "Frescos")
  clase: string;   // Nivel 3 (ej: "Entero")
}

export interface Bodega {
  readonly id: string;
  nombre: string;
  ubicacion: string;
  activa: boolean;
}

// ---------------------------------------------------------------------------
// Stock e Inventario (Readonly — no mutar fuera del store)
// ---------------------------------------------------------------------------

/** Stock de un producto en una bodega específica. */
export interface StockItem {
  readonly bodegaId: string;
  readonly productoId: string;
  cantidad: number;
  /** Nivel de stock valorizado (cantidad × precioCompra). */
  valorizado?: number;
}

/** @deprecated Usar StockItem. Alias mantenido por compatibilidad transitoria. */
export type StockBodega = StockItem;

/** Registro inmutable de un movimiento de inventario. */
export interface MovimientoInventario {
  readonly id: string;
  readonly bodegaId: string;
  readonly productoId: string;
  readonly fecha: string;                      // ISO 8601
  tipo: 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE';
  cantidad: number;
  referenciaId?: string;                       // ID de OrdenCompra, VentaPOS, etc.
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// Análisis ABC / Pareto (regla constitucional: priorizar 80/20)
// ---------------------------------------------------------------------------

/** Item resultante del cálculo de análisis ABC sobre ventas históricas. */
export interface AnalisisAbcItem {
  readonly productoId: string;
  readonly sku: string;
  readonly nombreProducto: string;
  readonly valorTotalVentas: number;
  readonly porcentajeAcumulado: number;
  readonly clasificacion: 'A' | 'B' | 'C';
  readonly categoriaId?: string;
}

// ---------------------------------------------------------------------------
// Órdenes de Compra
// ---------------------------------------------------------------------------

export interface OrdenCompra {
  id: string;
  numeroFacturaProveedor: string;
  proveedorId: string;
  bodegaId: string;
  fecha: string;
  total: number;
  formaPago: 'CREDITO' | 'CONTADO';
  estado: 'SOLICITADO' | 'RECIBIDO' | 'ANULADO';
  idempotencyKey: string;
  lineas: LineaCompra[];
}

export interface LineaCompra {
  id: string;
  productoId: string;
  loteProveedor: string;
  fechaVencimiento: string;
  cantidad: number;
  precioCompra: number;
  totalLinea: number;
}

export interface LineaTraslado {
  productoId: string;
  cantidad: number;
}

// Nota: ResultadoOperacion<T> se elimina de aquí — usar src/types/common.types.ts
