/**
 * Worker de Sincronización en Segundo Plano con Backoff y Aislamiento de Errores
 * Especificación: SPEC-021 (TASK-021-03)
 * Arquitectura: FIFO secuencial, Idempotency-Key y actualización atómica en Zustand.
 */

import { OutboxSyncService } from './outboxSyncService';
import { NetworkConnectivityService } from './networkConnectivityService';
import { useResolucionStore } from '../store/useResolucionStore';
import { OfflineOutboxItem } from '../types/offlineSync.types';
import { SiigoHttpDispatcher } from './siigoHttpDispatcher';

export interface TransmitterResult {
  cufe?: string;
  qrUrl?: string;
  siigoInvoiceId?: string;
  numeroFiscal?: string;
}

export type OutboxTransmitterFn = (item: OfflineOutboxItem) => Promise<TransmitterResult>;

export interface SyncBatchSummary {
  processed: number;
  succeeded: number;
  failed: number;
  timestamp: string;
}

type SyncCallback = (summary: SyncBatchSummary) => void;

export class BackgroundSyncWorker {
  private static isProcessing: boolean = false;
  private static timerId: any = null;
  private static connectivityUnsubscribe: (() => void) | null = null;
  private static transmitterFn: OutboxTransmitterFn | null = null;
  private static listeners: Set<SyncCallback> = new Set();

  /**
   * Inicializa y arranca el ciclo del worker
   */
  static start(intervalMs: number = 15000) {
    this.stop();

    // 1. Suscripción a cambios de red: si vuelve ONLINE, disparar sincronización inmediata
    this.connectivityUnsubscribe = NetworkConnectivityService.subscribe((status) => {
      if (status.estado === 'ONLINE') {
        this.syncNow().catch(() => {});
      }
    });

    // 2. Timer periódico para reintentar ítems cuyos backoffs hayan expirado
    this.timerId = setInterval(() => {
      const netStatus = NetworkConnectivityService.getStatus();
      if (netStatus.estado !== 'OFFLINE') {
        this.syncNow().catch(() => {});
      }
    }, intervalMs);
  }

  /**
   * Detiene el worker y libera timers y listeners
   */
  static stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.connectivityUnsubscribe) {
      this.connectivityUnsubscribe();
      this.connectivityUnsubscribe = null;
    }
    this.isProcessing = false;
  }

  /**
   * Inyecta una función de transmisión personalizada (para testing o adaptadores custom)
   */
  static setTransmitter(fn: OutboxTransmitterFn | null) {
    this.transmitterFn = fn;
  }

  /**
   * Indica si el worker está ejecutando un lote activamente
   */
  static isBusy(): boolean {
    return this.isProcessing;
  }

  /**
   * Suscribe un listener que recibe el resumen al finalizar un ciclo de sincronización
   */
  static onSyncComplete(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Transmisor predeterminado para SIIGO Nube API v2
   */
  private static async defaultTransmit(item: OfflineOutboxItem): Promise<TransmitterResult> {
    return SiigoHttpDispatcher.transmitirFactura(item);
  }

  /**
   * Ejecuta el procesamiento de ítems pendientes en orden cronológico estricto (FIFO)
   */
  static async syncNow(): Promise<SyncBatchSummary> {
    const summary: SyncBatchSummary = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      timestamp: new Date().toISOString(),
    };

    if (this.isProcessing) {
      return summary;
    }

    const netStatus = NetworkConnectivityService.getStatus();
    if (netStatus.estado === 'OFFLINE') {
      return summary;
    }

    this.isProcessing = true;

    try {
      const itemsPendientes = await OutboxSyncService.obtenerPendientesParaProcesar();

      for (const item of itemsPendientes) {
        summary.processed++;

        // 1. Marcar EN_PROCESO
        await OutboxSyncService.marcarEnProceso(item.id);

        try {
          // 2. Ejecutar transmisión con Idempotency-Key
          const transmit = this.transmitterFn || this.defaultTransmit;
          const respuestaFiscal = await transmit(item);

          // 3. Éxito: Marcar SINCRONIZADO en Outbox
          await OutboxSyncService.marcarSincronizado(item.id, respuestaFiscal);

          // 4. Actualización atómica en useResolucionStore sin duplicar caja ni inventario
          if (item.tipoOperacion === 'FACTURA_ELECTRONICA_SIIGO') {
            const store = useResolucionStore.getState();
            const facturas = store.facturasElectronicas;
            const facturaExistente = facturas.find(
              (f) => f.ventaId === item.ventaId || f.consecutivoCompleto === item.consecutivoFiscal
            );

            if (facturaExistente) {
              store.updateFacturaElectronica(facturaExistente.id, {
                estadoSiigo: 'SINCRONIZADO',
                cufe: respuestaFiscal.cufe,
                qrUrl: respuestaFiscal.qrUrl,
                siigoInvoiceId: respuestaFiscal.siigoInvoiceId,
                fechaSincronizacion: new Date().toISOString(),
                ultimoError: undefined,
              });
            }
          }

          summary.succeeded++;
        } catch (err: any) {
          summary.failed++;
          const mensaje = err?.message || 'Error desconocido de sincronización';
          const esErrorFatal =
            err?.status === 400 ||
            err?.statusCode === 400 ||
            err?.isFatal === true ||
            mensaje.toLowerCase().includes('invalido') ||
            mensaje.toLowerCase().includes('bad request');

          if (esErrorFatal) {
            // Aislamiento: No bloquear la cola por errores de validación de datos
            await OutboxSyncService.marcarErrorFatal(item.id, mensaje);
          } else {
            // Error transitorio de red: Aplicar retroceso exponencial
            await OutboxSyncService.marcarErrorReintento(item.id, mensaje);
          }

          // Si es de tipo factura, reflejar en el store
          if (item.tipoOperacion === 'FACTURA_ELECTRONICA_SIIGO') {
            const store = useResolucionStore.getState();
            const factura = store.getFacturaElectronicaByVentaId(item.ventaId);
            if (factura) {
              store.updateFacturaElectronica(factura.id, {
                estadoSiigo: 'ERROR_REINTENTO',
                ultimoError: mensaje,
              });
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyComplete(summary);
    }

    return summary;
  }

  private static notifyComplete(summary: SyncBatchSummary) {
    for (const listener of this.listeners) {
      try {
        listener(summary);
      } catch (e) {
        console.error('[BackgroundSyncWorker] Error en listener:', e);
      }
    }
  }

  /**
   * Restablece el worker a estado inicial para suites de prueba
   */
  static reset() {
    this.stop();
    this.listeners.clear();
    this.transmitterFn = null;
  }
}
