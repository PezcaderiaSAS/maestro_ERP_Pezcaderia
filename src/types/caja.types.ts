export type EstadoTurno = 'ABIERTA' | 'EN_CUADRE' | 'CERRADA';
export type TipoCaja = 'MAYOR' | 'MENOR';

export interface Caja {
  id: string;
  nombre: string;
  tipo: TipoCaja;
  bodegaId: string;
  activa: boolean;
}

export interface Turno {
  id: string;
  cajaId: string;
  usuarioId: string; // Quien abrió el turno
  fechaApertura: string; // ISO 8601
  fechaCierre?: string;
  saldoApertura: number;
  saldoCierreEfectivo?: number;
  saldoCierreTransferencia?: number;
  saldoCierreTarjeta?: number;
  estado: EstadoTurno;
  diferencia?: number; // Calculada al cerrar: (arqueo - (saldoApertura + ventas))
  observaciones?: string;
  desgloseDenominaciones?: Record<string, number>;
}

export interface ArqueoCaja {
  efectivo: number;
  transferencia: number;
  tarjeta: number;
  desgloseDenominaciones?: Record<string, number>;
}

export interface TransaccionCaja {
  id: string;
  turnoId: string;
  cajaId: string;
  fecha: string; // ISO 8601
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'MIXTO';
  categoria: 'VENTA_POS' | 'ABONO_CXC' | 'GASTO' | 'BASE';
  referenciaId?: string; // ID de la VentaPOS, Pago, etc.
  descripcion?: string;
}

export interface AuditLog {
  id: string;
  fecha: string;
  usuarioId: string;
  accion: 'APERTURA_TURNO' | 'CIERRE_TURNO' | 'INGRESO_CAJA' | 'EGRESO_CAJA';
  detalles: Record<string, any>;
}
