// src/types/cash.types.ts
// ARCHIVO CANÓNICO para todos los tipos del dominio de Caja y Flujo de Caja.
// ⚠️  caja.types.ts está DEPRECADO — no importar desde él. Usar este archivo.

import { Auditable } from './common.types';

// ---------------------------------------------------------------------------
// Enums y Union Types
// ---------------------------------------------------------------------------

/** Estado del turno de caja. Versión canónica (migrada desde caja.types.ts). */
export type EstadoTurno = 'ABIERTO' | 'CERRADO' | 'AUDITADO';

/** Clasificación de la caja: Mayor (central) o Menor (punto de venta). */
export type TipoCaja = 'MAYOR' | 'MENOR';

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

// ---------------------------------------------------------------------------
// Entidades Base
// ---------------------------------------------------------------------------

export interface Caja {
  id: string;
  bodegaId: string;
  nombre: string;
  tipo: TipoCaja;
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

// ---------------------------------------------------------------------------
// Turno de Caja
// ---------------------------------------------------------------------------

export interface TurnoCaja extends Auditable {
  id: string;
  cajaId: string;
  branch_id: string;
  cajeroId: string;
  fechaApertura: string;
  fechaCierre: string | null;
  baseInicial: number;

  saldoTeoricoGlobal: number;
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

// ---------------------------------------------------------------------------
// Movimientos de Caja
// ---------------------------------------------------------------------------

export interface MovimientoCaja extends Auditable {
  id: string;
  turnoId: string;
  cajaId: string;
  branch_id: string;
  tipo: TipoMovimientoCaja;
  metodoPago: MetodoPago;
  monto: number;
  concepto: string;
  referenciaId: string | null;
}

/** Transacción con categorías de negocio (absorbida desde caja.types.ts). */
export interface TransaccionCaja {
  id: string;
  turnoId: string;
  cajaId: string;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  metodoPago: MetodoPago;
  categoria: 'VENTA_POS' | 'ABONO_CXC' | 'GASTO' | 'BASE';
  referenciaId?: string;
  descripcion?: string;
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

// ---------------------------------------------------------------------------
// Auditoría (absorbida desde caja.types.ts)
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  fecha: string;
  usuarioId: string;
  accion: 'APERTURA_TURNO' | 'CIERRE_TURNO' | 'INGRESO_CAJA' | 'EGRESO_CAJA';
  detalles: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// DTOs de Operación
// ---------------------------------------------------------------------------

export interface AperturaCajaDTO {
  cajaId: string;
  cajeroId: string;
  baseInicial: number;
  notasApertura?: string;
  detalleArqueoApertura?: DetalleArqueo;
}

export interface CierreCajaDTO {
  turnoId: string;
  saldoFisicoEfectivo: number;
  saldoFisicoDatafono?: number;
  saldoFisicoTransferencias?: number;
  justificacion?: string;
  detalleArqueoCierre?: DetalleArqueo;
}

// ---------------------------------------------------------------------------
// Contrato de Servicio (ICashService)
// ---------------------------------------------------------------------------

export interface ICashService {
  abrirTurno(dto: AperturaCajaDTO): Promise<TurnoCaja>;
  cerrarTurno(dto: CierreCajaDTO): Promise<TurnoCaja>;
  getTurnoActivo(cajaId: string): Promise<TurnoCaja | null>;
  getTurnoActivoPorCajero(cajeroId: string): Promise<TurnoCaja | null>;
  registrarMovimiento(movimiento: Omit<MovimientoCaja, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<MovimientoCaja>;
  getMovimientosPorTurno(turnoId: string): Promise<MovimientoCaja[]>;
  registrarTraslado(traslado: Omit<TrasladoDinero, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'estado'>): Promise<TrasladoDinero>;
}
