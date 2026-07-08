/**
 * ERP Types & Interfaces - Centralized Core Definitions
 *
 * NOTE ON SEMANTIC DISTINCTION:
 * - Product: Representa la entidad con datos comerciales, precios de venta y costos de compra
 *   (utilizada principalmente para facturación, cotizaciones y reportes de rentabilidad).
 * - Producto (de useInventoryStore): Representa la entidad física de control de existencias
 *   y almacén en las bodegas (SKU, unidad de medida, conteo físico).
 */

export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  tipoIdentificacion: 'NIT' | 'CC' | 'CE';
  tipoPersona: 'NATURAL' | 'JURIDICA';
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  encargadoCompras?: string;
  cupoCredito: number;
  activo: boolean;
}

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  tipoIdentificacion: 'NIT' | 'CC';
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  contactoCompras?: string;
  plazoPagoDias: number;
  activo: boolean;
}

export interface Conductor {
  id: string;
  nombre: string;
  identificacion: string;
  licencia: string;
  celular: string;
  activo: boolean;
}

export interface DevolucionPedido {
  id: string;
  pedidoId: string;
  pedidoNo: string;
  clienteId: string;
  clienteNombre: string;
  conductorId: string;
  conductorNombre: string;
  estado: 'PROGRAMADA' | 'RECIBIDA_BODEGA' | 'VALIDADA_FINANZAS' | 'ANULADA';
  fechaProgramacion: string;
  fechaRecibido?: string;
  recibidoPor?: string;
  fechaValidacion?: string;
  items: Array<{
    sku: string;
    nombre: string;
    cantidadSolicitada: number;
    cantidadRecibida?: number;
    precioUnitarioVenta: number;
    estadoCalidad?: 'APROBADO_REINGRESO' | 'DESCARTE_MERMA';
    estadoFisico?: 'APTO_INVENTARIO' | 'AVERIA_DESCARTE' | 'RECHAZADO';
    loteInventario?: string;
  }>;
}

export interface ProductCatalog {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida?: 'kg' | 'und' | 'lb' | 'gr';
  imagen?: string;
  codigo_barras?: string;
  iva?: number;
  ivaIncluido?: boolean;
  control_inventario?: boolean;
  produccion?: boolean;
  activo: boolean;
  categoriaABC?: 'A' | 'B' | 'C';
  metadata?: Record<string, string>;
}

export interface ProductPricing {
  id: string;
  productoId: string;
  vigenciaDesde: string;
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
  actualizadoPor: string;
}

export interface Product extends ProductCatalog {
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
}
