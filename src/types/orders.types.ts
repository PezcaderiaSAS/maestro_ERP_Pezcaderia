export type EstadoPedido = 
  | 'CREADO' 
  | 'EN_ALISTAMIENTO'
  | 'EN_FILETEO'
  | 'EN_PESAJE'
  | 'LISTO' 
  | 'EN_DESPACHO'
  | 'PLANIFICADA'
  | 'EN_RUTA'
  | 'EN_LIQUIDACION'
  | 'ENTREGADO' 
  | 'FACTURADO' 
  | 'PAGADO' 
  | 'PAUSADO' 
  | 'PAUSADO_POR_CREDITO' 
  | 'ANULADO';

export type EstadoLineaPedido = 'PENDIENTE' | 'PARCIAL' | 'COMPLETO';

export interface LineaPedido {
  productoId: string;
  sku?: string;
  nombre?: string;
  cantidadSolicitada: number;
  cantidadAlistada: number;
  cantidadDespachada: number; // Para despachos parciales (fulfilled_quantity)
  estadoLinea: EstadoLineaPedido; // Para manejar el estado del despacho (status)
  pesoEstimado?: number;     // Para productos por KG
  pesoReal?: number;         // Peso real pesado en la báscula durante alistamiento
  variacionPesoPct?: number; // Variación porcentual vs peso estimado (+-5% tolerancia)
  toleranciaAceptada?: boolean; // Aprobado si la variación está en rango permitido
  subtotalRealAjustado?: number; // Total recalculado con pesoReal * precioPactado
  loteSeleccionado?: string; // Lote asignado para trazabilidad (FIFO)
  precioPactado: number;
  totalLinea: number;
  unidadMedida?: 'kg' | 'und' | 'g' | 'lb';
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
  vendedorNombre?: string;
  cotizacionIdOriginal?: string;
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

  // Trazabilidad Tripartita & WMS Dispatch (SPEC-015)
  operarioAlistadorId?: string;
  operarioAlistadorNombre?: string;
  horaInicioAlistamiento?: string;
  horaFinAlistamiento?: string;
  remisionId?: string;
  tokenQrRemision?: string;
  precintoCanastilla?: string;
  conductorRepartidorId?: string;
  conductorRepartidorNombre?: string;
  manifiestoRutaId?: string;
  horaDespachoRuta?: string;
  horaLlegadaCliente?: string;
  horaEntregaEfectiva?: string;
  firmaClienteUrl?: string;
  retefuenteValor?: number;
  reteicaValor?: number;
  ivaValor?: number;
  subtotalNeto?: number;
}

export type EstadoCotizacion =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'APROBADA'
  | 'CONVERTIDA_A_PEDIDO'
  | 'RECHAZADA'
  | 'Listo'
  | 'Pausado'
  | 'En Proceso';

export interface Cotizacion {
  id: string;
  fecha: string;
  cliente: string;
  clienteId?: string;
  total: number;
  items?: any[];
  lineas?: any[];
  montoTotal?: number;
  subtotal?: number;
  estado?: EstadoCotizacion | string;
  vendedorId?: string;
  vendedorNombre?: string;
  fechaActualizacion?: string;
  [key: string]: any;
}
