import { generateProductSVGAvatar } from './productVisualGenerator';
import { isUserActive } from './userActivityDetector';

export interface RawProductInput {
  nombre: string;
  sku?: string;
  categoria?: string;
  unidadMedida?: 'kg' | 'und' | 'lb' | 'gr';
  precio_compra?: number;
  precio_venta_pos?: number;
  precio_venta_restaurante?: number;
  precio_venta_mayorista?: number;
  buffer_seguridad?: number;
  codigo_barras?: string;
  iva?: number;
  ivaIncluido?: boolean;
  control_inventario?: boolean;
  produccion?: boolean;
  imagen?: string;
}

export interface ProcessedBatchResult<T> {
  successCount: number;
  failedCount: number;
  items: T[];
  errors: Array<{ index: number; name: string; error: string }>;
}

export interface BatchProgress {
  processed: number;
  total: number;
  percentage: number;
  currentChunkIndex: number;
  totalChunks: number;
  isWaitingCooldown: boolean;
  cooldownRemainingMs?: number;
}

export interface BulkQueueOptions {
  activeUserDelayMs?: number; // Default: 5 minutos (300,000 ms)
  idleUserDelayMs?: number;   // Default: 30 ms (Modo Turbo)
  onProgress?: (progress: BatchProgress) => void;
  saveBatchFn?: (batch: any[]) => Promise<void> | void;
  isUserActiveFn?: () => boolean;
  storageKey?: string;
}

const CHUNK_SIZE = 5;
const DEFAULT_ACTIVE_DELAY_MS = 5 * 60 * 1000; // 5 minutos
const DEFAULT_IDLE_DELAY_MS = 30; // 30 milisegundos

/**
 * Procesa una lista masiva de productos en lotes acotados de máximo 5 elementos (Bounded Queue).
 * Aplica una pausa inteligente de 5 minutos si hay usuarios activos en la app,
 * o procesa en modo rápido (30ms) si el sistema está en reposo/inactividad.
 */
export async function processBulkProductsQueue(
  rawItems: RawProductInput[],
  options?: BulkQueueOptions
): Promise<ProcessedBatchResult<any>> {
  const total = rawItems.length;
  const processedItems: any[] = [];
  const errors: Array<{ index: number; name: string; error: string }> = [];

  if (total === 0) {
    return { successCount: 0, failedCount: 0, items: [], errors: [] };
  }

  // Dividir en chunks de 5 elementos
  const chunks: RawProductInput[][] = [];
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    chunks.push(rawItems.slice(i, i + CHUNK_SIZE));
  }

  const totalChunks = chunks.length;
  const activeCheck = options?.isUserActiveFn ?? isUserActive;
  const activeDelay = options?.activeUserDelayMs ?? DEFAULT_ACTIVE_DELAY_MS;
  const idleDelay = options?.idleUserDelayMs ?? DEFAULT_IDLE_DELAY_MS;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    const chunkProcessed: any[] = [];

    for (let itemIndex = 0; itemIndex < chunk.length; itemIndex++) {
      const globalIndex = chunkIndex * CHUNK_SIZE + itemIndex;
      const raw = chunk[itemIndex];

      try {
        if (!raw.nombre || !raw.nombre.trim()) {
          throw new Error('El nombre del producto es obligatorio.');
        }

        const cleanName = raw.nombre.trim();
        const categoria = raw.categoria?.trim() || 'General';
        
        // 1. Asignar Avatar SVG temático si no tiene imagen previa
        const finalImage = raw.imagen && raw.imagen.trim() 
          ? raw.imagen 
          : generateProductSVGAvatar(cleanName, categoria);

        // 2. Generar SKU automático si no fue provisto
        const finalSku = raw.sku && raw.sku.trim()
          ? raw.sku.trim().toUpperCase()
          : `SKU-${Date.now().toString(36).toUpperCase()}-${(globalIndex + 1).toString().padStart(3, '0')}`;

        const normalizedProduct = {
          id: `p-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          sku: finalSku,
          nombre: cleanName,
          categoria,
          unidadMedida: raw.unidadMedida || 'kg',
          precio_compra: Number(raw.precio_compra) || 0,
          precio_venta_pos: Number(raw.precio_venta_pos) || Number(raw.precio_compra || 0) * 1.3,
          precio_venta_restaurante: Number(raw.precio_venta_restaurante) || Number(raw.precio_compra || 0) * 1.25,
          precio_venta_mayorista: Number(raw.precio_venta_mayorista) || Number(raw.precio_compra || 0) * 1.18,
          buffer_seguridad: Number(raw.buffer_seguridad) || 5,
          codigo_barras: raw.codigo_barras || '',
          iva: raw.iva !== undefined ? Number(raw.iva) : 0,
          ivaIncluido: raw.ivaIncluido !== undefined ? Boolean(raw.ivaIncluido) : true,
          control_inventario: raw.control_inventario !== undefined ? Boolean(raw.control_inventario) : true,
          produccion: Boolean(raw.produccion),
          imagen: finalImage,
          activo: true,
        };

        chunkProcessed.push(normalizedProduct);
        processedItems.push(normalizedProduct);
      } catch (err: any) {
        errors.push({
          index: globalIndex,
          name: raw.nombre || `Ítem #${globalIndex + 1}`,
          error: err.message || 'Error desconocido',
        });
      }
    }

    // Ejecutar guardado del lote (si se proveyó handler asíncrono)
    if (options?.saveBatchFn && chunkProcessed.length > 0) {
      await options.saveBatchFn(chunkProcessed);
    }

    // Persistir estado de cola en almacenamiento local
    if (typeof localStorage !== 'undefined') {
      const storageKey = options?.storageKey ?? 'pezkaderia_bulk_queue_checkpoint';
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          lastProcessedChunk: chunkIndex + 1,
          totalChunks,
          timestamp: Date.now(),
        }));
      } catch {
        // Ignorar si localStorage está deshabilitado
      }
    }

    // Notificar progreso a la interfaz de usuario
    const processedCount = Math.min((chunkIndex + 1) * CHUNK_SIZE, total);
    const isLastChunk = chunkIndex === totalChunks - 1;

    if (options?.onProgress) {
      options.onProgress({
        processed: processedCount,
        total,
        percentage: Math.round((processedCount / total) * 100),
        currentChunkIndex: chunkIndex + 1,
        totalChunks,
        isWaitingCooldown: !isLastChunk,
      });
    }

    // Si aún quedan bloques por procesar, aplicar la pausa dinámica
    if (!isLastChunk) {
      const active = activeCheck();
      const delayMs = active ? activeDelay : idleDelay;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    successCount: processedItems.length,
    failedCount: errors.length,
    items: processedItems,
    errors,
  };
}
