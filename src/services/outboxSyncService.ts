/**
 * Servicio Transaccional de Cola Outbox Offline con Idempotencia
 * Especificación: SPEC-021
 * Arquitectura: Offline-First, IndexedDB v2 con fallback resiliente.
 */

import {
  OfflineOutboxItem,
  EstadoOutboxItem,
  TipoTransaccionOutbox,
} from '../types/offlineSync.types';

const DB_NAME = 'MaestroPescaderiaOfflineDB';
const STORE_NAME = 'caja_outbox_v2';
const DB_VERSION = 2;

// In-memory fallback para entornos sin IndexedDB o tests unitarios ligeros
let inMemoryFallback: Map<string, OfflineOutboxItem> = new Map();

/**
 * Función pura para calcular clave de idempotencia determinista
 */
export function generarIdempotencyKey(
  empresaId: string,
  ventaId: string,
  consecutivoInterno: string,
  tipoOperacion: string = 'VENTA'
): string {
  const raw = `${empresaId.trim()}::${ventaId.trim()}::${consecutivoInterno.trim()}::${tipoOperacion.trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `idemp-${hex}-${ventaId.substring(0, 8)}`;
}

/**
 * Algoritmo de retroceso exponencial con jitter
 * Intervalos: 1s, 5s, 15s, 30s, 60s
 */
export function calcularProximoBackoff(intentos: number): number {
  const demorasMs = [1000, 5000, 15000, 30000, 60000];
  const idx = Math.min(Math.max(0, intentos), demorasMs.length - 1);
  const base = demorasMs[idx];
  // Jitter pseudo-aleatorio de hasta 500ms para evitar tormenta de reintentos
  const jitter = Math.floor(Math.random() * 500);
  return Date.now() + base + jitter;
}

/**
 * Inicializador de conexión IndexedDB con tolerancia a fallos
 */
async function getIDBDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
          store.createIndex('estado', 'estado', { unique: false });
          store.createIndex('creadoEn', 'creadoEn', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[OutboxSyncService] Falló apertura de IndexedDB, usando fallback in-memory.');
        resolve(null);
      };
    } catch (err) {
      console.warn('[OutboxSyncService] Excepción al abrir IndexedDB:', err);
      resolve(null);
    }
  });
}

export class OutboxSyncService {
  /**
   * Encolar una nueva transacción en Outbox garantizando idempotencia.
   * Si ya existe un ítem con la misma idempotencyKey en estado PENDIENTE, EN_PROCESO o SINCRONIZADO,
   * retorna el ítem existente sin duplicar.
   */
  static async encolarTransaccion(
    params: {
      empresaId: string;
      ventaId: string;
      consecutivoInterno: string;
      consecutivoFiscal?: string;
      tipoOperacion: TipoTransaccionOutbox;
      payload: Record<string, any>;
      maxIntentos?: number;
    }
  ): Promise<OfflineOutboxItem> {
    const idempotencyKey = generarIdempotencyKey(
      params.empresaId,
      params.ventaId,
      params.consecutivoInterno,
      params.tipoOperacion
    );

    // 1. Verificar si ya existe en cola con esa idempotencyKey
    const existentes = await this.obtenerTodos();
    const duplicado = existentes.find((i) => i.idempotencyKey === idempotencyKey);
    if (duplicado) {
      return duplicado;
    }

    const now = new Date().toISOString();
    const nuevoItem: OfflineOutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      idempotencyKey,
      empresaId: params.empresaId,
      tipoOperacion: params.tipoOperacion,
      ventaId: params.ventaId,
      consecutivoInterno: params.consecutivoInterno,
      consecutivoFiscal: params.consecutivoFiscal,
      estado: 'PENDIENTE',
      intentos: 0,
      maxIntentos: params.maxIntentos ?? 5,
      creadoEn: now,
      proximoReintentoEn: now,
      payload: params.payload,
    };

    const db = await getIDBDatabase();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(nuevoItem);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      }).catch((err) => {
        console.warn('[OutboxSyncService] Falló guardado en IDB, replicando en memoria:', err);
        inMemoryFallback.set(nuevoItem.id, nuevoItem);
      });
    } else {
      inMemoryFallback.set(nuevoItem.id, nuevoItem);
    }

    return nuevoItem;
  }

  /**
   * Obtiene todos los ítems registrados en el almacén outbox.
   */
  static async obtenerTodos(): Promise<OfflineOutboxItem[]> {
    const db = await getIDBDatabase();
    if (!db) {
      return Array.from(inMemoryFallback.values());
    }

    return new Promise<OfflineOutboxItem[]>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result as OfflineOutboxItem[]) || [];
          // Si memoria tiene ítems no persistidos, combinarlos
          for (const item of inMemoryFallback.values()) {
            if (!results.some((r) => r.id === item.id)) {
              results.push(item);
            }
          }
          resolve(results);
        };
        req.onerror = () => {
          resolve(Array.from(inMemoryFallback.values()));
        };
      } catch {
        resolve(Array.from(inMemoryFallback.values()));
      }
    });
  }

  /**
   * Obtiene todos los ítems pendientes o en reintento en la cola Outbox.
   */
  static async obtenerPendientes(): Promise<OfflineOutboxItem[]> {
    const todos = await this.obtenerTodos();
    return todos.filter((i) => i.estado === 'PENDIENTE' || i.estado === 'ERROR_REINTENTO');
  }

  /**
   * Obtiene los ítems listos para procesar (estado PENDIENTE o ERROR_REINTENTO
   * cuyo proximoReintentoEn sea menor o igual a la hora actual), ordenados FIFO.
   */
  static async obtenerPendientesParaProcesar(): Promise<OfflineOutboxItem[]> {
    const todos = await this.obtenerTodos();
    const ahoraMs = Date.now();

    return todos
      .filter((i) => {
        if (i.estado !== 'PENDIENTE' && i.estado !== 'ERROR_REINTENTO') {
          return false;
        }
        const reintentoMs = new Date(i.proximoReintentoEn).getTime();
        return reintentoMs <= ahoraMs;
      })
      .sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime());
  }

  /**
   * Obtiene un ítem por su ID único.
   */
  static async obtenerPorId(id: string): Promise<OfflineOutboxItem | undefined> {
    const todos = await this.obtenerTodos();
    return todos.find((i) => i.id === id);
  }

  /**
   * Marca un ítem en estado EN_PROCESO.
   */
  static async marcarEnProceso(id: string): Promise<void> {
    await this.actualizarParcial(id, { estado: 'EN_PROCESO' });
  }

  /**
   * Marca un ítem como SINCRONIZADO exitosamente y guarda la respuesta fiscal.
   */
  static async marcarSincronizado(
    id: string,
    respuestaFiscal?: {
      cufe?: string;
      qrUrl?: string;
      siigoInvoiceId?: string;
      numeroFiscal?: string;
    }
  ): Promise<void> {
    await this.actualizarParcial(id, {
      estado: 'SINCRONIZADO',
      respuestaFiscal,
      sincronizadoEn: new Date().toISOString(),
      ultimoError: undefined,
    });
  }

  /**
   * Registra un fallo de transmisión con retroceso exponencial.
   * Si excede maxIntentos, pasa a ERROR_FATAL_DATOS.
   */
  static async marcarErrorReintento(id: string, mensajeError: string): Promise<void> {
    const item = await this.obtenerPorId(id);
    if (!item) return;

    const nuevosIntentos = item.intentos + 1;
    if (nuevosIntentos >= item.maxIntentos) {
      await this.actualizarParcial(id, {
        estado: 'ERROR_FATAL_DATOS',
        intentos: nuevosIntentos,
        ultimoError: `Límite de ${item.maxIntentos} reintentos superado: ${mensajeError}`,
      });
    } else {
      const proximoMs = calcularProximoBackoff(nuevosIntentos);
      await this.actualizarParcial(id, {
        estado: 'ERROR_REINTENTO',
        intentos: nuevosIntentos,
        proximoReintentoEn: new Date(proximoMs).toISOString(),
        ultimoError: mensajeError,
      });
    }
  }

  /**
   * Marca inmediatamente un fallo como fatal sin reintento automático (ej: 400 Bad Request por datos inválidos).
   */
  static async marcarErrorFatal(id: string, mensajeError: string): Promise<void> {
    await this.actualizarParcial(id, {
      estado: 'ERROR_FATAL_DATOS',
      ultimoError: mensajeError,
    });
  }

  /**
   * Actualiza propiedades de un ítem existente en IDB y en memoria.
   */
  private static async actualizarParcial(
    id: string,
    cambios: Partial<OfflineOutboxItem>
  ): Promise<void> {
    const todos = await this.obtenerTodos();
    const item = todos.find((i) => i.id === id);
    if (!item) return;

    const actualizado: OfflineOutboxItem = { ...item, ...cambios };

    const db = await getIDBDatabase();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(actualizado);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      }).catch(() => {
        inMemoryFallback.set(id, actualizado);
      });
    } else {
      inMemoryFallback.set(id, actualizado);
    }
  }

  /**
   * Limpia los ítems que ya han sido sincronizados exitosamente.
   */
  static async limpiarCompletados(): Promise<number> {
    const todos = await this.obtenerTodos();
    const completados = todos.filter((i) => i.estado === 'SINCRONIZADO');

    const db = await getIDBDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          completados.forEach((item) => store.delete(item.id));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }

    completados.forEach((c) => inMemoryFallback.delete(c.id));
    return completados.length;
  }

  /**
   * Restablece el almacén (para tests y reinicios controlados).
   */
  static async resetOutbox(): Promise<void> {
    inMemoryFallback.clear();
    const db = await getIDBDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }
}
