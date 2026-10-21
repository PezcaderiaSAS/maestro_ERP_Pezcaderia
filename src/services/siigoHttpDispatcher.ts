// src/services/siigoHttpDispatcher.ts
import axios from 'axios';
import { SiigoAuthService } from './siigoAuthService';
import type { OfflineOutboxItem } from '../types/offlineSync.types';
import type { TransmitterResult } from './backgroundSyncWorker';
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';
import type { SiigoInvoiceResponse, SiigoErrorResponse } from '../types/siigo.types';

/**
 * Error tipado para fallos de despacho en SIIGO Nube API v2
 */
export class SiigoDispatchError extends Error {
  status: number;
  statusCode: number;
  isFatal: boolean;
  detalles?: any;

  constructor(message: string, status: number = 500, isFatal: boolean = false, detalles?: any) {
    super(message);
    this.name = 'SiigoDispatchError';
    this.status = status;
    this.statusCode = status;
    this.isFatal = isFatal;
    this.detalles = detalles;
    Object.setPrototypeOf(this, SiigoDispatchError.prototype);
  }
}

/**
 * Dispatcher HTTP oficial para SIIGO Nube API v2
 * Conecta con BackgroundSyncWorker como OutboxTransmitterFn.
 * Mapea comprobantes, gestiona timbrado DIAN y clasifica errores (400 fatal vs 401 reintento vs 429/5xx backoff).
 */
export class SiigoHttpDispatcher {
  private static configGetter: (() => SiigoCredentialsConfig | null) | null = null;

  /**
   * Configura la función proveedora de credenciales (habitualmente ligada a useSiigoConfigStore)
   */
  static setConfigGetter(getter: (() => SiigoCredentialsConfig | null) | null): void {
    this.configGetter = getter;
  }

  /**
   * Obtiene la configuración activa actual
   */
  static getConfig(): SiigoCredentialsConfig | null {
    return this.configGetter ? this.configGetter() : null;
  }

  /**
   * Transmisor principal de comprobantes en cola hacia SIIGO Nube API v2
   * Cumple con la firma canónica de OutboxTransmitterFn.
   */
  static async transmitirFactura(
    item: OfflineOutboxItem,
    configOverride?: SiigoCredentialsConfig | null
  ): Promise<TransmitterResult> {
    const config = configOverride !== undefined ? configOverride : SiigoHttpDispatcher.getConfig();

    // 1. Si no hay credenciales o está en modo Sandbox, generar respuesta fiscal simulada
    if (!config || config.isSandbox || !config.username || !config.accessKey) {
      return SiigoHttpDispatcher.buildSimulatedFiscalResult(item);
    }

    // 2. Extraer el payload JSON formateado para SIIGO
    const payload = item.payload?.payloadSiigo || item.payload;
    if (!payload || Object.keys(payload).length === 0) {
      throw new SiigoDispatchError(
        'El ítem de outbox no contiene un payload de factura válido para SIIGO',
        400,
        true
      );
    }

    // 3. Obtener token Bearer y ejecutar petición HTTP con auto-recuperación ante 401
    const urlBase = (config.urlBase || 'https://api.siigo.com').replace(/\/+$/, '');
    const invoicesUrl = `${urlBase}/v1/invoices`;
    const partnerId = config.partnerId || 'LaPezcaderiaERP';

    let token = await SiigoAuthService.getValidToken(config);

    try {
      return await SiigoHttpDispatcher.executePostInvoice(invoicesUrl, payload, token, partnerId, item);
    } catch (error: any) {
      // 4. Si falló con 401 Unauthorized, invalidar token y reintentar 1 vez con token fresco
      if (error?.status === 401 || error?.response?.status === 401) {
        SiigoAuthService.invalidateToken();
        token = await SiigoAuthService.getValidToken(config);
        return await SiigoHttpDispatcher.executePostInvoice(invoicesUrl, payload, token, partnerId, item);
      }
      throw error;
    }
  }

  /**
   * Ejecuta el POST a /v1/invoices y extrae los datos fiscales
   */
  private static async executePostInvoice(
    invoicesUrl: string,
    payload: any,
    token: string,
    partnerId: string,
    item: OfflineOutboxItem
  ): Promise<TransmitterResult> {
    try {
      const response = await axios.post<SiigoInvoiceResponse>(invoicesUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Partner-Id': partnerId
        },
        timeout: 10000
      });

      const data = response.data;
      if (!data) {
        throw new SiigoDispatchError('Respuesta vacía recibida desde SIIGO Nube', 500, false);
      }

      const cufe =
        data.stamp?.cufe ||
        `cufe-${item.idempotencyKey.replace('idemp-', '')}-${Date.now().toString(16)}`;
      const qrUrl =
        data.stamp?.qr ||
        `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;
      const siigoInvoiceId = data.id || `siigo-${Date.now()}`;
      const numeroFiscal = data.name || item.consecutivoFiscal || 'FEVP-PENDIENTE';

      return {
        cufe,
        qrUrl,
        siigoInvoiceId,
        numeroFiscal
      };
    } catch (err: any) {
      const status = err.response?.status || err.status || 500;
      const errorData: SiigoErrorResponse = err.response?.data;

      // Extraer mensaje descriptivo devuelto por SIIGO / DIAN
      let mensajeError = 'Error desconocido al facturar en SIIGO Nube';
      if (errorData) {
        if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          mensajeError = errorData.errors
            .map((e) => e.message || e.detail || e.code)
            .filter(Boolean)
            .join(' | ');
        } else if (errorData.message) {
          mensajeError = errorData.message;
        }
      } else if (err.message) {
        mensajeError = err.message;
      }

      // Clasificación rigurosa:
      // 400 Bad Request: Error fatal de validación DIAN (no reintentable sin corregir datos)
      if (status === 400) {
        throw new SiigoDispatchError(
          `Rechazo tributario DIAN (400 Bad Request): ${mensajeError}`,
          400,
          true,
          errorData
        );
      }

      // 401 Unauthorized
      if (status === 401) {
        throw new SiigoDispatchError(
          `Error de autorización en SIIGO (401 Unauthorized): ${mensajeError}`,
          401,
          false,
          errorData
        );
      }

      // 429 Rate Limit o 5xx Server Error: Error transitorio reintentable con retroceso exponencial
      const isTransient = status === 429 || status >= 500 || err.code === 'ECONNABORTED';
      throw new SiigoDispatchError(
        `Fallo de comunicación con SIIGO (${status}): ${mensajeError}`,
        status,
        !isTransient, // Si no es transitorio, marcar fatal
        errorData
      );
    }
  }

  /**
   * Genera una respuesta fiscal virtual simulada para modo Sandbox / Offline
   */
  static buildSimulatedFiscalResult(item: OfflineOutboxItem): TransmitterResult {
    const numFiscal =
      item.consecutivoFiscal || `FEVP-${Math.floor(1000 + Math.random() * 9000)}`;
    const cufe = `cufe-${item.idempotencyKey.replace('idemp-', '')}-${Date.now().toString(16)}`;
    const qrUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;

    return {
      cufe,
      qrUrl,
      siigoInvoiceId: `siigo-sim-${Date.now()}`,
      numeroFiscal: numFiscal
    };
  }
}
