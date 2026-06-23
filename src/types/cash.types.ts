import { Auditable } from './common.types';

export type EstadoTurno = 'ABIERTO' | 'CERRADO' | 'AUDITADO';

export type TipoMovimientoCaja = 
  | 'INGRESO_VENTA' 
  | 'INGRESO_ABONO' 
  | 'INGRESO_TRASLADO' 
  | 'EGRESO_GASTO' 
  | 'EGRESO_TRASLADO' 
  | 'AJUSTE_SOBRANTE' 
  | 'AJUSTE_FALTANTE';

export type MetodoPago = 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA';

export interface Caja {
  id: string;
  bodegaId: string;
  nombre: string;
  activa: boolean;
}

export interface TurnoCaja extends Auditable {
  id: string;
  cajaId: string;
  cajeroId: string;
  fechaApertura: string;
  fechaCierre: string | null;
  baseInicial: number;
  
  saldoTeoricoGlobal: number; // Suma de todos los medios
  totalEfectivo: number;
  totalDatafono: number;
  totalTransferencias: number;
  
  saldoFisicoEfectivo: number | null;
  diferenciaEfectivo: number | null;
  
  estado: EstadoTurno;
  justificacion: string | null;
}

export interface MovimientoCaja extends Auditable {
  id: string;
  turnoId: string;
  cajaId: string;
  tipo: TipoMovimientoCaja;
  metodoPago: MetodoPago;
  monto: number;
  concepto: string;
  referenciaId: string | null;
}

export interface TrasladoDinero extends Auditable {
  id: string;
  cajaOrigenId: string;
  cajaDestinoId: string;
  metodoPago: MetodoPago;
  monto: number;
  estado: 'COMPLETADO';
  concepto: string;
}
