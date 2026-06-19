export type EstadoPedido = 'CREADO' | 'ALISTADO' | 'FACTURADO' | 'EN_RUTA' | 'ENTREGADO' | 'ANULADO';

export interface LineaPedido {
  productoId: string;
  cantidadSolicitada: number;
  cantidadAlistada: number;
  precioPactado: number;
  totalLinea: number;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  fecha: string;
  origen: 'VISITA' | 'RAPPI' | 'TELEFONO';
  clienteId: string;
  bodegaId: string;
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
}
