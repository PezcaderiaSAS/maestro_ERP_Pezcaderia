import { Auditable } from './common.types';

export type EstadoTurno = 'ABIERTO' | 'CERRADO' | 'AUDITADO';

export type TipoMovimientoCaja = 
  | 'INGRESO_VENTA' 
  | 'INGRESO_ABONO' 
  | 'INGRESO_TRASLADO' 
  | 'INGRESO_BASE_INICIAL'
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

export interface DetalleArqueo {
  billetes100k: number;
  billetes50k: number;
  billetes20k: number;
  billetes10k: number;
  billetes5k: number;
  billetes2k: number;
  monedas1k: number;
  monedas500: number;
  monedas200: number;
  monedas100: number;
  monedas50: number;
}

export interface TurnoCaja extends Auditable {
  id: string;
  cajaId: string;
  branch_id: string; // ID de la sucursal para filtrado RLS y Realtime
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
  saldoFisicoDatafono?: number | null;
  diferenciaDatafono?: number | null;
  saldoFisicoTransferencias?: number | null;
  diferenciaTransferencias?: number | null;
  
  estado: EstadoTurno;
  justificacion: string | null;
  notasApertura?: string | null;
  
  detalleArqueoApertura?: DetalleArqueo;
  detalleArqueoCierre?: DetalleArqueo;
}

export interface MovimientoCaja extends Auditable {
  id: string;
  turnoId: string;
  cajaId: string;
  branch_id: string; // ID de la sucursal para filtrado RLS
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
