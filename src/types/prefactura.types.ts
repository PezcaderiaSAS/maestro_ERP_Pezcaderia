// src/types/prefactura.types.ts
// Tipos canónicos para el ciclo de vida de Preventa Multivendedor, Caja Única y Despacho Verificado (SPEC-037)

export type EstadoPrefactura =
  | 'PENDIENTE_COBRO'
  | 'EN_COBRO'
  | 'PAGADA'
  | 'DESPACHADA'
  | 'ANULADA';

export type MetodoPagoPrefactura = 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'CREDITO';

export type MetodoVerificacionDespacho = 'QR_SCAN' | 'BANDEJA_TACTIL';

export interface ItemPrefacturaInput {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioLista: number;
  descuentoPct?: number; // 0 a 100
  supervisorPinAutorizado?: boolean;
  supervisorId?: string;
  loteId?: string;
}

export interface ItemPrefactura {
  id?: string;
  prefacturaId?: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioLista: number;
  descuentoPct: number;
  precioFinal: number;
  subtotal: number;
  loteId?: string;
}

export interface EmitirPrefacturaInput {
  tenantId: string;
  vendedorId: string;
  vendedorNombre: string;
  terminalId: string; // ej: 'TERM-01'
  clienteDocumento?: string;
  clienteNombre?: string;
  items: ItemPrefacturaInput[];
  observaciones?: string;
}

export interface Prefactura {
  id: string;
  tenantId: string;
  codigoPreventa: string; // ej: 'PRE-2026-0042'
  vendedorId: string;
  vendedorNombre: string;
  terminalId: string;
  clienteDocumento?: string;
  clienteNombre?: string;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  estado: EstadoPrefactura;
  hardHoldActivo: boolean;
  items: ItemPrefactura[];
  facturaId?: string;
  cajeroId?: string;
  cajeroNombre?: string;
  metodoPago?: MetodoPagoPrefactura;
  plazoDias?: number;
  fechaLimite?: string;
  efectivoRecibido?: number;
  cambioEntregado?: number;
  pagadoAt?: string;
  despachadoAt?: string;
  despachadoPorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagoCobroInput {
  metodoPago: MetodoPagoPrefactura;
  monto: number;
  referenciaComprobante?: string;
}

export interface CobrarPrefacturaInput {
  prefacturaId: string;
  tenantId: string;
  cajeroId: string;
  turnoId: string;
  montoTotal: number;
  pagos: PagoCobroInput[];
  plazoDias?: number;
  fechaLimite?: string;
  efectivoRecibido?: number;
  cambioEntregado?: number;
}

export interface DespachoVerificacionInput {
  prefacturaId: string;
  tenantId: string;
  asesorId: string;
  metodoVerificacion: MetodoVerificacionDespacho;
  codigoEscaneado?: string;
  observaciones?: string;
}

export interface ResultadoValidacionItem {
  success: boolean;
  data?: ItemPrefactura;
  requiereSupervisor: boolean;
  supervisorAutorizado: boolean;
  error?: string;
}

export interface ResultadoValidacion<T> {
  success: boolean;
  data?: T;
  error?: string;
}
