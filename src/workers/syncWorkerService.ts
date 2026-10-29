// src/workers/syncWorkerService.ts
// Servicio de Coordinación de Sincronización en Lotes Off-Thread y Backoff (SPEC-041 / TASK-041-03)

import type { OutboxTransaction } from '../types/deltaSync.schema';

/**
 * Calcula el intervalo de backoff exponencial en milisegundos
 * Secuencia: 1s, 2s, 4s, 8s, 16s, 32s, hasta un máximo de 60s
 */
export function calcularBackoffMs(intentos: number): number {
  if (intentos < 0) return 1000;
  const backoff = 1000 * Math.pow(2, intentos);
  return Math.min(backoff, 60000);
}

export interface BatchTransmissionResult {
  succeeded: OutboxTransaction[];
  dlqFatal: OutboxTransaction[];
  retriable: OutboxTransaction[];
}

export class SyncWorkerService {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {
    // Inicialización de Worker nativo si existe entorno de navegador
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('./syncWorker.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        this.worker = null;
      }
    }
  }

  /**
   * Divide un array de transacciones en fragmentos homogéneos de tamaño máximo `size` (por defecto 500)
   */
  public chunkTransactions<T>(items: T[], size = 500): T[][] {
    if (!items || items.length === 0) return [];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Transmite un lote de transacciones a Supabase, clasificando éxitos, errores recuperables y DLQ
   */
  public async transmitBatch(
    batch: OutboxTransaction[],
    transmitterFn: (item: OutboxTransaction) => Promise<any>
  ): Promise<BatchTransmissionResult> {
    const succeeded: OutboxTransaction[] = [];
    const dlqFatal: OutboxTransaction[] = [];
    const retriable: OutboxTransaction[] = [];

    for (const item of batch) {
      try {
        await transmitterFn(item);
        succeeded.push({
          ...item,
          estado: 'SINCRONIZADO',
          sincronizadoEn: new Date().toISOString(),
        });
      } catch (err: any) {
        // Errores HTTP 422 o violaciones irrecuperables de esquema se aíslan en DLQ
        const isFatal =
          err?.status === 422 ||
          err?.code === 'PGRST116' ||
          err?.message?.toLowerCase().includes('schema mismatch') ||
          err?.message?.toLowerCase().includes('unprocessable');

        if (isFatal) {
          dlqFatal.push({
            ...item,
            estado: 'ERROR_FATAL_DATOS',
            ultimoError: err?.message || 'Error fatal de datos / 422',
          });
        } else {
          retriable.push({
            ...item,
            estado: 'ERROR_REINTENTO',
            intentos: item.intentos + 1,
            proximoReintentoEn: new Date(
              Date.now() + calcularBackoffMs(item.intentos)
            ).toISOString(),
            ultimoError: err?.message || 'Fallo de red transitorio',
          });
        }
      }
    }

    return {
      succeeded,
      dlqFatal,
      retriable,
    };
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

export const syncWorkerService = new SyncWorkerService();

