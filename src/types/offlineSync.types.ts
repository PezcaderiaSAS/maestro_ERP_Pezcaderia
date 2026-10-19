/**
 * Contratos de Tipos para Sincronización Resiliente Offline-First y Cola Outbox
 * Especificación: SPEC-021
 */

export type EstadoOutboxItem =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'SINCRONIZADO'
  | 'ERROR_REINTENTO'
  | 'ERROR_FATAL_DATOS';

export type TipoTransaccionOutbox =
  | 'FACTURA_ELECTRONICA_SIIGO'
  | 'VENTA_POS_LOCAL'
  | 'GASTO_CAJA'
  | 'ARQUEO_TURNO'
  | 'POST_FACTURACION_DIAN'
  | 'ENTREGA_RUTA_PWA';

export type EstadoConectividad = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export interface OfflineOutboxItem {
  id: string;
  idempotencyKey: string; // Hash determinista para evitar duplicidad de envíos
  empresaId: string;
  tipoOperacion: TipoTransaccionOutbox;
  ventaId: string;
  consecutivoInterno: string; // Ej: "VTA-1045"
  consecutivoFiscal?: string; // Ej: "FEVP-502"
  estado: EstadoOutboxItem;
  intentos: number;
  maxIntentos: number; // Por defecto 5
  creadoEn: string; // ISO 8601
  proximoReintentoEn: string; // ISO 8601
  ultimoError?: string;
  payload: Record<string, any>;
  respuestaFiscal?: {
    cufe?: string;
    qrUrl?: string;
    siigoInvoiceId?: string;
    numeroFiscal?: string;
  };
  sincronizadoEn?: string;
}

export interface NetworkHeartbeatStatus {
  estado: EstadoConectividad;
  latenciaMs: number;
  ultimoChequeo: string;
  fallaConsecutiva: number;
}
