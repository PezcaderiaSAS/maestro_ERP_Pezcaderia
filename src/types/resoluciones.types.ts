// src/types/resoluciones.types.ts

/**
 * Tipos de Resolución admitidos en La Pezcadería ERP
 */
export type TipoResolucion =
  | 'CONTROL_INTERNO'            // Control operativo interno 100% de ventas (VTA-, POS-)
  | 'FACTURA_ELECTRONICA_DIAN'   // Factura electrónica fiscal oficial ligada a Siigo (FEVP-)
  | 'POS_NO_ELECTRONICO';        // Tirilla POS de mostrador no electrónica con resolución DIAN tradicional

/**
 * Estados de sincronización hacia SIIGO Nube API v2
 */
export type EstadoSincronizacionSiigo =
  | 'NO_APLICA'
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'SINCRONIZADO'
  | 'ERROR_REINTENTO';

/**
 * Entidad de Resolución de Venta / Facturación
 */
export interface ResolucionVenta {
  id: string;
  tenantId?: string;
  nombre: string;
  tipo: TipoResolucion;
  prefijo: string;
  numeroResolucion?: string;
  fechaExpedicion?: string;       // Formato ISO YYYY-MM-DD
  fechaVencimiento?: string;      // Formato ISO YYYY-MM-DD
  rangoDesde: number;
  rangoHasta: number;
  consecutivoActual: number;      // Número correlativo actual (permite empate con Siigo)
  siigoDocumentId?: number;       // ID numérico del comprobante en Siigo Nube API
  claveTecnica?: string;
  esPredeterminada: boolean;
  activa: boolean;
  alertaUmbralConsecutivos: number;// Alerta preventiva (por defecto 100 números)
  alertaUmbralDias: number;        // Alerta preventiva (por defecto 30 días)
  sucursalId?: string;            // Opcional si aplica a una sucursal/bodega específica
}

/**
 * Registro fiscal inmutable de Factura Electrónica emitida
 */
export interface FacturaElectronicaRegistro {
  id: string;
  ventaId: string;
  resolucionId: string;
  prefijo: string;
  numeroConsecutivo: number;
  consecutivoCompleto: string;    // Ej: "FEVP-1541"
  fechaEmision: string;           // ISO 8601
  clienteNit: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteDireccion?: string;
  clienteCiudadDane?: string;     // Ej: "11001" (Bogotá)
  subtotal: number;
  totalIva: number;
  total: number;
  siigoInvoiceId?: string;        // UUID retornado por Siigo Nube
  cufe?: string;                  // Código Único de Facturación Electrónica DIAN
  qrUrl?: string;                 // URL de consulta pública DIAN
  estadoSiigo: EstadoSincronizacionSiigo;
  ultimoError?: string;
  fechaSincronizacion?: string;
}

/**
 * Elemento de la cola Outbox asíncrona hacia SIIGO Nube
 */
export interface SiigoQueueItem {
  id: string;
  facturaElectronicaId: string;
  ventaId: string;
  consecutivoCompleto: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO';
  intentos: number;
  maxIntentos: number;
  proximoIntento: string;
  payloadSiigo: SiigoInvoicePayload;
  respuestaSiigo?: any;
  ultimoError?: string;
  fechaCreacion: string;
}

/**
 * Esquema oficial de payload para SIIGO Nube API v2 (POST /v2/invoices)
 */
export interface SiigoInvoicePayload {
  document: {
    id: number;
  };
  date: string;                   // YYYY-MM-DD
  customer: {
    identification: string;
    branch_office?: number;
  };
  seller?: number;
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    price: number;
    discount?: number;
    taxes?: Array<{
      id: number;
      percentage?: number;
    }>;
  }>;
  payments: Array<{
    id: number;
    value: number;
    due_date: string;
  }>;
  observations?: string;
  send_dian: boolean;             // true para timbrado electrónico inmediato
}

/**
 * Estado y Métricas de Diagnóstico de una Resolución
 */
export interface ResolucionDiagnostico {
  consecutivosRestantes: number;
  porcentajeConsumido: number;
  diasVigenciaRestantes?: number;
  isAlertaConsecutivos: boolean;
  isAlertaVigencia: boolean;
  isAgotada: boolean;
  isVencida: boolean;
  estadoSemaforo: 'OPTIMO' | 'PRECAUCION' | 'CRITICO';
}
