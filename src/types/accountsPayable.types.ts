/**
 * Tipos e interfaces de Dominio para Cuentas por Pagar (CxP)
 * La Pezcadería ERP - SPEC-022
 */

export type EstadoCuentaPorPagar =
  | 'PENDIENTE'
  | 'PAGADO_PARCIAL'
  | 'PAGADO'
  | 'VENCIDO'
  | 'ANULADO';

export type MedioPagoAbono =
  | 'TRANSFERENCIA'
  | 'EFECTIVO'
  | 'CHEQUE'
  | 'OTRO';

export interface AbonoCuentaPorPagar {
  id: string;
  cuentaPorPagarId: string;
  fecha: string;
  monto: number; // Monto en COP entero
  medioPago: MedioPagoAbono;
  referenciaComprobante?: string;
  bancoOrigen?: string;
  usuarioId?: string;
  notas?: string;
  createdAt: string;
}

export interface CuentaPorPagar {
  id: string; // Formato: CXP-YYYYMMDD-XXXX
  recepcionMuelleId?: string;
  numeroFacturaProveedor?: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorNit: string;
  montoTotal: number; // Valor total en COP enteros
  saldoPendiente: number; // Saldo pendiente en COP enteros
  fechaEmision: string; // YYYY-MM-DD
  fechaVencimiento: string; // YYYY-MM-DD
  diasCredito: number;
  estado: EstadoCuentaPorPagar;
  abonos: AbonoCuentaPorPagar[];
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrarCuentaPorPagarInput {
  recepcionMuelleId?: string;
  numeroFacturaProveedor?: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorNit: string;
  montoTotal: number;
  fechaEmision: string;
  diasCredito: number;
  observaciones?: string;
}

export interface RegistrarAbonoInput {
  cuentaPorPagarId: string;
  monto: number;
  medioPago: MedioPagoAbono;
  referenciaComprobante?: string;
  bancoOrigen?: string;
  usuarioId?: string;
  notas?: string;
}
