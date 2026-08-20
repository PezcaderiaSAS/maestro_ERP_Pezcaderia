/**
 * @deprecated Este archivo está DEPRECADO.
 * Usar `src/types/cash.types.ts` como única fuente de verdad para el dominio de Caja.
 *
 * Re-exporta desde el archivo canónico para mantener compatibilidad transitoria
 * con cualquier import existente. ELIMINAR en la Fase 2 una vez migrados todos los imports.
 */
export type {
  EstadoTurno,
  TipoCaja,
  Caja,
  TurnoCaja,
  DetalleArqueo,
  MovimientoCaja,
  TransaccionCaja,
  TrasladoDinero,
  AuditLog,
  AperturaCajaDTO,
  CierreCajaDTO,
  ICashService,
  MetodoPago,
  TipoMovimientoCaja,
} from './cash.types';

// Alias de compatibilidad: 'Turno' (nombre antiguo) → 'TurnoCaja'
export type { TurnoCaja as Turno } from './cash.types';
// Alias de compatibilidad: 'ArqueoCaja' → 'DetalleArqueo'
export type { DetalleArqueo as ArqueoCaja } from './cash.types';
