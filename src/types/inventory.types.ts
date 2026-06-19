// src/types/inventory.types.ts

export interface Producto {
  id: string;
  sku: string;                           // ÚNICO en el catálogo
  nombre: string;
  categoriaId: string;
  unidadMedida: 'KG' | 'UNIDAD' | 'GRAMO';
  precioCompra: number;
  precioVentaPOS: number;
  precioVentaRestaurante: number;
  precioVentaMayorista: number;
  codigoBarras: string | null;
  imagenUrl: string | null;
  bufferSeguridad: number;               // Nivel mínimo para alerta de stock
  activo: boolean;
}

export interface Categoria {
  id: string;
  tipo: string;    // Nivel 1 (ej: "Pescados")
  linea: string;   // Nivel 2 (ej: "Frescos")
  clase: string;   // Nivel 3 (ej: "Entero")
}

export interface StockBodega {
  bodegaId: string;
  productoId: string;
  cantidad: number;
}

export interface Bodega {
  id: string;
  nombre: string;
  ubicacion: string;
  activa: boolean;
}

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

export interface ResultadoOperacion<T> {
  data: T | null;
  error: string | null;
}
