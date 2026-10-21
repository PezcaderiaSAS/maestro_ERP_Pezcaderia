// src/types/siigo.types.ts
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';

/**
 * Estados de conexión del ERP hacia SIIGO Nube API v2
 */
export type EstadoConexionSiigo =
  | 'NO_CONFIGURADO'        // No se han ingresado credenciales
  | 'ONLINE'                // Token Bearer activo y válido contra SIIGO Producción
  | 'SANDBOX'               // Modo simulación / pruebas activo (sin llamadas reales a DIAN)
  | 'ERROR_AUTENTICACION';  // Falló la autenticación con las credenciales suministradas

/**
 * Respuesta del endpoint de autenticación POST /auth de SIIGO Nube API
 */
export interface SiigoAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Segundos de vigencia (habitualmente 86400 = 24 horas)
}

/**
 * Nodo de timbrado electrónico oficial de la DIAN devuelto por SIIGO
 */
export interface SiigoStampInfo {
  cufe: string;
  qr: string;
  date?: string;
  status?: string;
}

/**
 * Respuesta del endpoint POST /v1/invoices al crear una factura en SIIGO Nube
 */
export interface SiigoInvoiceResponse {
  id: string; // UUID asignado en SIIGO
  name: string; // Consecutivo fiscal oficial (ej: "FEVP-502")
  date: string;
  customer?: {
    identification: string;
    branch_office?: number;
  };
  total?: number;
  balance?: number;
  stamp?: SiigoStampInfo;
  metadata?: {
    created?: string;
  };
}

/**
 * Detalle individual de error devuelto por la API de SIIGO
 */
export interface SiigoInvoiceErrorItem {
  code: string;
  message: string;
  params?: any;
  detail?: string;
}

/**
 * Estructura de error estándar de SIIGO Nube API v2
 */
export interface SiigoErrorResponse {
  status: number;
  message: string;
  errors?: SiigoInvoiceErrorItem[];
}

/**
 * Resultado estructurado de una prueba de conexión (Ping) hacia SIIGO
 */
export interface SiigoTestPingResult {
  success: boolean;
  latencyMs: number;
  isSandbox: boolean;
  timestamp: string;
  message: string;
  error?: string;
}

/**
 * Resultado completo del despacho de una factura procesada por SiigoHttpDispatcher
 */
export interface SiigoDispatchResult {
  cufe?: string;
  qrUrl?: string;
  siigoInvoiceId?: string;
  numeroFiscal?: string;
  isSimulated: boolean;
  sincronizadoEn: string;
}

/**
 * Estado global persistente de la configuración de SIIGO en el ERP
 */
export interface SiigoConfigState {
  config: SiigoCredentialsConfig | null;
  estadoConexion: EstadoConexionSiigo;
  ultimoPing: SiigoTestPingResult | null;
  ultimoError?: string;
}
