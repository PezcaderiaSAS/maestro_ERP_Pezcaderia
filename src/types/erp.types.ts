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

export type TipoPromocion = 'PORCENTAJE' | 'PRECIO_FIJO' | '2X1' | '12_MAS_1' | 'VOLUMEN';

export interface PromocionProducto {
  tipo: TipoPromocion;
  valor: number; // Porcentaje (%) o Precio Fijo ($)
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  min_kg?: number;
  descripcion?: string;
}

export interface VentaAncladaItem {
  producto_id: string;
  sku: string;
  nombre: string;
  descuento_combo_pct: number;
}

export type EstadoMargen = 'OPTIMO' | 'AJUSTADO' | 'PERDIDA';

export interface SimulacionCanal {
  canal: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  precio_venta: number;
  precio_base_sin_iva: number;
  cuota_iva: number;
  margen_bruto_pct: number;
  utilidad_cop: number;
  margen_objetivo_pct: number;
  precio_sugerido_asesor: number;
  estado: EstadoMargen;
  break_even: number;
}

export interface EvaluacionPromocionAvanzada {
  precio_unitario_efectivo: number;
  margen_efectivo_pct: number;
  utilidad_efectiva_cop: number;
  estado: EstadoMargen;
  advertencia?: string;
}

export interface ProductCatalog {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida?: 'kg' | 'und' | 'lb' | 'gr';
  imagen?: string;
  codigo_barras?: string;
  precio_compra?: number;
  iva?: number;
  ivaIncluido?: boolean;
  control_inventario?: boolean;
  produccion?: boolean;
  activo: boolean;
  categoriaABC?: 'A' | 'B' | 'C';
  cuenta_contable_ingreso?: string;
  promocion_activa?: PromocionProducto;
  ventas_ancladas?: VentaAncladaItem[];
  porcentaje_merma_esperada?: number;
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
  costo_promedio_ponderado?: number;
  costo_ultima_compra?: number;
  cuenta_contable_inventario?: string;
  cuenta_contable_costo?: string;
  stock_total?: number;
  stock_available?: number;
  stock_reserved?: number;
  min_stock_alert?: number;
}

/** Tipos de Movimiento de Inventario Kardex */
export type TipoMovimientoKardex =
  | 'ENTRADA_COMPRA'
  | 'SALIDA_VENTA_POS'
  | 'SALIDA_DESPACHO_B2B'
  | 'ENTRADA_TRASLADO'
  | 'SALIDA_TRASLADO'
  | 'SALIDA_MATERIA_PRIMA'
  | 'ENTRADA_PRODUCTO_TERMINADO'
  | 'AJUSTE_MERMA'
  | 'AJUSTE_INVENTARIO'
  | 'DEVOLUCION_CLIENTE'
  | 'DEVOLUCION_PROVEEDOR';

/** Registro de Movimiento en Kardex Contable NIIF (NIC 2) */
export interface KardexMovement {
  id: string;
  fecha: string;
  producto_id: string;
  sku: string;
  nombre_producto: string;
  tipo_movimiento: TipoMovimientoKardex;
  cantidad_kg: number;
  costo_unitario: number;
  costo_total: number;
  saldo_cantidad_kg: number;
  saldo_costo_promedio: number;
  saldo_valor_total: number;
  documento_referencia: string;
  usuario_responsable: string;
  bodega_id?: string;
  bodega_nombre?: string;
  lote_id?: string;
  notas?: string;
}

/** Estado de Guía de Traslado Multibodega */
export type EstadoTraslado = 'BORRADOR' | 'EN_TRANSITO' | 'RECIBIDO_CONFORME' | 'CANCELADO';

export interface WarehouseTransferItem {
  producto_id: string;
  sku: string;
  nombre: string;
  lote_id?: string;
  cantidad_kg: number;
  costo_unitario: number;
}

/** Guía de Transferencia Interna entre Bodegas / Cuartos Fríos */
export interface WarehouseTransfer {
  id: string;
  codigo_guia: string;
  bodega_origen_id: string;
  bodega_origen_nombre: string;
  bodega_destino_id: string;
  bodega_destino_nombre: string;
  items: WarehouseTransferItem[];
  estado: EstadoTraslado;
  fecha_creacion: string;
  fecha_recepcion?: string;
  usuario_despacha: string;
  usuario_recibe?: string;
  notas?: string;
}

/** Estado y Origen de Comanda de Despiece Inmediata */
export type EstadoComandaProcesamiento = 'PENDIENTE' | 'EN_CORTE' | 'COMPLETADA' | 'CANCELADA';
export type OrigenComandaProcesamiento = 'POS_MOSTRADOR' | 'COTIZACION_B2B' | 'MANUAL';

/** Comanda / Solicitud de Despiece de Cuarto Frío */
export interface ProcessingOrder {
  id: string;
  codigo_comanda: string;
  origen: OrigenComandaProcesamiento;
  producto_solicitado_id: string;
  sku_solicitado: string;
  nombre_producto_solicitado: string;
  cantidad_solicitada_kg: number;
  materia_prima_disponible_id?: string;
  materia_prima_nombre?: string;
  estado: EstadoComandaProcesamiento;
  prioridad: 'ALTA' | 'NORMAL';
  fecha_emision: string;
  fecha_completada?: string;
  responsable_corte?: string;
  notas?: string;
}

/** Corte resultante en Transformación / Despiece */
export interface YieldCut {
  producto_id: string;
  sku: string;
  nombre_corte: string;
  peso_obtenido_kg: number;
  factor_valor_mercado: number;
  costo_asignado_unitario: number;
  costo_asignado_total: number;
}

/** Payload de Ejecución de Despiece / Transformación de Materia Prima */
export interface DespieceTransformationPayload {
  materia_prima_id: string;
  materia_prima_nombre: string;
  lote_mp_id?: string;
  bodega_id: string;
  peso_inicial_kg: number;
  costo_unitario_mp: number;
  costo_total_mp: number;
  cortes_obtenidos: YieldCut[];
  merma_no_aprovechable_kg: number;
  merma_porcentaje: number;
  usuario_responsable: string;
  fecha: string;
  comanda_id?: string;
}

/** Lote Perecedero FEFO */
export interface BatchFefo {
  id: string;
  producto_id: string;
  sku: string;
  numero_lote: string;
  fecha_ingreso: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  cantidad_inicial_kg: number;
  cantidad_disponible_kg: number;
  bodega_id: string;
  bodega_nombre: string;
  costo_compra_unitario: number;
  temperatura_almacenamiento?: string;
  estado: 'OPTIMO' | 'ALERTA' | 'CRITICO' | 'VENCIDO';
}

/** Ítem vendido dentro de una Venta */
export interface ItemVenta {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

/** Registro permanente de toda venta (contado Y crédito) */
export interface Venta {
  id: string;
  clienteId: string | null;   // null = consumidor final anónimo
  clienteNombre: string;       // Desnormalizado para lectura histórica
  fecha: string;
  items: ItemVenta[];
  subtotal: number;
  total: number;
  metodoPago: 'CONTADO' | 'CREDITO' | 'MIXTO';
  facturaCarteraId?: string;   // Si hay crédito → referencia a InvoiceAR
  actor: string;
  metadata?: {
    id_pedido_externo?: string;
    canal?: string;
    metodo_pago_codigo?: string;
  };
  clienteIdentificacion?: string;
  descuento?: number;
  montoPagadoEfectivo?: number;
  montoPagadoTransferencia?: number;
  montoPagadoTarjeta?: number;
  montoPagadoCredito?: number;
  cambioEntregado?: number;
}

export interface LogIntegracion {
  id: string;
  id_pedido_externo: string;
  canal: string;
  fecha_recepcion: string;
  payload_json: string;
  estado: 'PENDIENTE' | 'PROCESADO' | 'ERROR' | 'REVISION_MANUAL';
  id_factura_pos?: string;
  mensaje_error?: string;
}


