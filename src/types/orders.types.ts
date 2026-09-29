export type EstadoPedido = 
  | 'CREADO' 
  | 'EN_ALISTAMIENTO'
  | 'EN_FILETEO'
  | 'EN_PESAJE'
  | 'LISTO' 
  | 'EN_DESPACHO' 
  | 'ENTREGADO' 
  | 'FACTURADO' 
  | 'PAGADO' 
  | 'PAUSADO' 
  | 'PAUSADO_POR_CREDITO' 
  | 'ANULADO';

export type EstadoLineaPedido = 'PENDIENTE' | 'PARCIAL' | 'COMPLETO';

export interface LineaPedido {
  productoId: string;
  cantidadSolicitada: number;
  cantidadAlistada: number;
  cantidadDespachada: number; // Para despachos parciales (fulfilled_quantity)
  estadoLinea: EstadoLineaPedido; // Para manejar el estado del despacho (status)
  pesoEstimado?: number;     // Para productos por KG
  pesoReal?: number;         // Peso real pesado en la báscula durante alistamiento
  loteSeleccionado?: string; // Lote asignado para trazabilidad (FIFO)
  precioPactado: number;
  totalLinea: number;
  // Campos Catch Weight Dual y Especificaciones
  modalidadVenta?: 'PESO_DIRECTO' | 'CATCH_WEIGHT_PIEZAS' | 'UNIDADES_FIJAS';
  piezasSolicitadas?: number;
  piezasAlistadas?: number;
  calibreMinGramos?: number;
  calibreMaxGramos?: number;
  corte?: string;
  empaque?: string;
  temperaturaC?: number;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  fecha: string;
  origen: 'VISITA' | 'RAPPI' | 'TELEFONO';
  clienteId: string;
  bodegaId: string;
  branch_id: string; // ID de la sucursal para filtrado RLS y Realtime
  vendedorId: string;
  formaPago: 'CONTADO' | 'CREDITO';
  tipoEntrega: 'EN_RUTA' | 'RECOGE';
  fechaEntrega: string;
  jornada: 'MANANA' | 'TARDE';
  estado: EstadoPedido;
  observaciones: string;
  lineas: LineaPedido[];
  subtotal: number;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totalFinal: number;
  idempotencyKey: string;
  rutaId: string | null;
  facturacionElectronica: boolean;
  idSiigo: string | null;
  inventarioDescontado?: boolean; // True si ya se registró la salida en inventario
}
