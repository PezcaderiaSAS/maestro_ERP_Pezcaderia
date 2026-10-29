// src/services/tenantIndexedDbService.ts
// Servicio de Persistencia Aislada por Tenant en IndexedDB
// Cumple con la Arquitectura Enterprise Cero-Latencia: DB independiente por Tenant (PezcaderiaERP_{tenantId})

import type {
  LocalIndexedDbProduct,
  LocalIndexedDbClient,
  OutboxTransaction,
} from '../types/indexedDb.types';
import type { PreventaSync, SyncConflict } from '../types/deltaSync.schema';

export class TenantIndexedDbService {
  private tenantId = '';
  private dbName = '';
  private db: IDBDatabase | null = null;
  private isFallbackInMemory = false;

  // Adaptador de memoria volátil transparente (para tests, SSR o modo incógnito restringido)
  private memoryProducts = new Map<string, LocalIndexedDbProduct>();
  private memoryClients = new Map<string, LocalIndexedDbClient>();
  private memoryStock = new Map<string, number>();
  private memoryOutbox = new Map<string, OutboxTransaction>();
  private memoryPreventas = new Map<string, PreventaSync>();
  private memoryConflicts = new Map<string, SyncConflict>();

  /**
   * Inicializa la conexión a la base de datos exclusiva del tenant
   */
  public async init(tenantId: string, version = 1): Promise<void> {
    if (!tenantId) {
      throw new Error('El tenantId es obligatorio para inicializar el almacenamiento local');
    }

    this.tenantId = tenantId;
    this.dbName = `PezcaderiaERP_${tenantId}`;

    // Detectar si IndexedDB nativo está disponible en el entorno
    const hasIndexedDb = typeof window !== 'undefined' && 'indexedDB' in window && !!window.indexedDB;

    if (!hasIndexedDb) {
      this.isFallbackInMemory = true;
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(this.dbName, version);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Almacén de Productos
          if (!db.objectStoreNames.contains('productos')) {
            const prodStore = db.createObjectStore('productos', { keyPath: 'sku' });
            prodStore.createIndex('nombre', 'nombre', { unique: false });
            prodStore.createIndex('codigoBarras', 'codigoBarras', { unique: false });
            prodStore.createIndex('categoria', 'categoria', { unique: false });
            prodStore.createIndex('esParetoTop100', 'esParetoTop100', { unique: false });
          }

          // 2. Almacén de Clientes
          if (!db.objectStoreNames.contains('clientes')) {
            const clientStore = db.createObjectStore('clientes', { keyPath: 'id' });
            clientStore.createIndex('nitOCedula', 'nitOCedula', { unique: false });
            clientStore.createIndex('razonSocialONombre', 'razonSocialONombre', { unique: false });
            clientStore.createIndex('esParetoTop100', 'esParetoTop100', { unique: false });
          }

          // 3. Almacén de Stock por Bodega
          if (!db.objectStoreNames.contains('stock')) {
            db.createObjectStore('stock', { keyPath: 'sku_bodega' });
          }

          // 4. Cola Outbox de Transacciones Offline
          if (!db.objectStoreNames.contains('outbox_transactions')) {
            const outboxStore = db.createObjectStore('outbox_transactions', { keyPath: 'id' });
            outboxStore.createIndex('estado', 'estado', { unique: false });
            outboxStore.createIndex('creadoEn', 'creadoEn', { unique: false });
          }

          // 5. Almacén de Preventas Locales Multivendedor (SPEC-041)
          if (!db.objectStoreNames.contains('preventas_locales')) {
            const prevStore = db.createObjectStore('preventas_locales', { keyPath: 'id' });
            prevStore.createIndex('estado', 'estado', { unique: false });
            prevStore.createIndex('terminalId', 'terminalId', { unique: false });
            prevStore.createIndex('codigoPreventa', 'codigoPreventa', { unique: true });
          }

          // 6. Almacén de Conflictos OCC para Auditoría
          if (!db.objectStoreNames.contains('sync_conflicts')) {
            const confStore = db.createObjectStore('sync_conflicts', { keyPath: 'id' });
            confStore.createIndex('entidadNombre', 'entidadNombre', { unique: false });
            confStore.createIndex('resolucion', 'resolucion', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve();
        };

        request.onerror = (event) => {
          console.warn('Error abriendo IndexedDB, activando fallback en memoria:', (event.target as any).error);
          this.isFallbackInMemory = true;
          resolve();
        };
      } catch (err) {
        console.warn('Excepción inicializando IndexedDB, activando fallback en memoria:', err);
        this.isFallbackInMemory = true;
        resolve();
      }
    });
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getDbName(): string {
    return this.dbName;
  }

  /**
   * Inserción masiva de productos (bulkUpsert)
   */
  public async bulkUpsertProducts(products: LocalIndexedDbProduct[]): Promise<number> {
    if (this.isFallbackInMemory || !this.db) {
      products.forEach((p) => this.memoryProducts.set(p.sku, p));
      return products.length;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('productos', 'readwrite');
      const store = tx.objectStore('productos');

      products.forEach((prod) => store.put(prod));

      tx.oncomplete = () => resolve(products.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Inserción masiva de clientes (bulkUpsert)
   */
  public async bulkUpsertClients(clients: LocalIndexedDbClient[]): Promise<number> {
    if (this.isFallbackInMemory || !this.db) {
      clients.forEach((c) => this.memoryClients.set(c.id, c));
      return clients.length;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('clientes', 'readwrite');
      const store = tx.objectStore('clientes');

      clients.forEach((client) => store.put(client));

      tx.oncomplete = () => resolve(clients.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Obtiene un producto por su SKU
   */
  public async getProductBySku(sku: string): Promise<LocalIndexedDbProduct | null> {
    if (this.isFallbackInMemory || !this.db) {
      return this.memoryProducts.get(sku) || null;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('productos', 'readonly');
      const store = tx.objectStore('productos');
      const request = store.get(sku);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Búsqueda por Código de Barras
   */
  public async searchByBarcode(barcode: string): Promise<LocalIndexedDbProduct | null> {
    if (this.isFallbackInMemory || !this.db) {
      for (const prod of this.memoryProducts.values()) {
        if (prod.codigoBarras === barcode) return prod;
      }
      return null;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('productos', 'readonly');
      const store = tx.objectStore('productos');
      const index = store.index('codigoBarras');
      const request = index.get(barcode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Retorna los productos prioritarios Pareto ABC (Top 100)
   */
  public async getTopParetoProducts(limit = 100): Promise<LocalIndexedDbProduct[]> {
    if (this.isFallbackInMemory || !this.db) {
      const pareto: LocalIndexedDbProduct[] = [];
      for (const prod of this.memoryProducts.values()) {
        if (prod.esParetoTop100) pareto.push(prod);
        if (pareto.length >= limit) break;
      }
      return pareto;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('productos', 'readonly');
      const store = tx.objectStore('productos');
      const results: LocalIndexedDbProduct[] = [];

      try {
        const index = store.index('esParetoTop100');
        const request = index.openCursor(IDBKeyRange.only(true));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => resolve(results);
      } catch (e) {
        // Fallback por cursor general si el índice no está listo
        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor && results.length < limit) {
            if (cursor.value.esParetoTop100) results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => resolve(results);
      }
    });
  }

  /**
   * Obtiene todos los productos (con límite opcional)
   */
  public async getAllProducts(limit?: number): Promise<LocalIndexedDbProduct[]> {
    if (this.isFallbackInMemory || !this.db) {
      const list = Array.from(this.memoryProducts.values());
      return limit ? list.slice(0, limit) : list;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('productos', 'readonly');
      const store = tx.objectStore('productos');
      const request = limit ? store.getAll(null, limit) : store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Obtiene todos los clientes
   */
  public async getAllClients(limit?: number): Promise<LocalIndexedDbClient[]> {
    if (this.isFallbackInMemory || !this.db) {
      const list = Array.from(this.memoryClients.values());
      return limit ? list.slice(0, limit) : list;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('clientes', 'readonly');
      const store = tx.objectStore('clientes');
      const request = limit ? store.getAll(null, limit) : store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Actualización o ajuste atómico de Stock por Bodega
   */
  public async updateStock(sku: string, bodegaKey: string, deltaOCantidad: number, esAbsoluto = false): Promise<void> {
    const key = `${sku}__${bodegaKey}`;

    if (this.isFallbackInMemory || !this.db) {
      const actual = this.memoryStock.get(key) || 0;
      const nuevo = esAbsoluto ? deltaOCantidad : actual + deltaOCantidad;
      this.memoryStock.set(key, nuevo);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('stock', 'readwrite');
      const store = tx.objectStore('stock');
      const getReq = store.get(key);

      getReq.onsuccess = () => {
        const actual = getReq.result ? getReq.result.cantidad : 0;
        const nuevo = esAbsoluto ? deltaOCantidad : actual + deltaOCantidad;
        store.put({ sku_bodega: key, sku, bodegaKey, cantidad: nuevo });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Consulta de Stock disponible por Bodega
   */
  public async getStock(sku: string, bodegaKey: string): Promise<number> {
    const key = `${sku}__${bodegaKey}`;

    if (this.isFallbackInMemory || !this.db) {
      return this.memoryStock.get(key) || 0;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('stock', 'readonly');
      const store = tx.objectStore('stock');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ? request.result.cantidad : 0);
      request.onerror = () => resolve(0);
    });
  }

  /**
   * Encolar una transacción en Outbox para resiliencia offline
   */
  public async addOutboxTransaction(
    txData: Partial<OutboxTransaction> & { tenantId: string }
  ): Promise<string> {
    const id = txData.id || `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullTx: OutboxTransaction = {
      id,
      tenantId: txData.tenantId,
      idempotencyKey: txData.idempotencyKey || '0'.repeat(64),
      tipoOperacion: (txData.tipoOperacion || txData.tipo || 'VENTA_POS_DIRECTA') as any,
      tipo: txData.tipo || (txData.tipoOperacion as any) || 'VENTA_POS_DIRECTA',
      entidadId: txData.entidadId || id,
      versionEntidad: txData.versionEntidad || 1,
      payload: txData.payload || {},
      estado: (txData.estado as any) || 'PENDIENTE',
      intentos: txData.intentos || 0,
      maxIntentos: txData.maxIntentos || 5,
      creadoEn: txData.creadoEn || new Date().toISOString(),
      proximoReintentoEn: txData.proximoReintentoEn,
      ultimoError: txData.ultimoError,
      sincronizadoEn: txData.sincronizadoEn,
    };

    if (this.isFallbackInMemory || !this.db) {
      this.memoryOutbox.set(id, fullTx);
      return id;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox_transactions', 'readwrite');
      const store = tx.objectStore('outbox_transactions');
      store.put(fullTx);

      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Obtiene transacciones pendientes de sincronizar en Outbox
   */
  public async getPendingOutboxTransactions(): Promise<OutboxTransaction[]> {
    if (this.isFallbackInMemory || !this.db) {
      return Array.from(this.memoryOutbox.values()).filter((t) => t.estado === 'PENDIENTE');
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('outbox_transactions', 'readonly');
      const store = tx.objectStore('outbox_transactions');
      const index = store.index('estado');
      const request = index.getAll('PENDIENTE');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Marca una transacción de Outbox como sincronizada
   */
  public async markOutboxSynced(id: string): Promise<void> {
    if (this.isFallbackInMemory || !this.db) {
      const tx = this.memoryOutbox.get(id);
      if (tx) {
        tx.estado = 'SINCRONIZADO';
        this.memoryOutbox.delete(id); // Limpieza de cola
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox_transactions', 'readwrite');
      const store = tx.objectStore('outbox_transactions');
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Actualiza el estado o campos de una transacción de Outbox
   */
  public async updateOutboxTransaction(
    id: string,
    updates: Partial<OutboxTransaction>
  ): Promise<void> {
    if (this.isFallbackInMemory || !this.db) {
      const existing = this.memoryOutbox.get(id);
      if (existing) {
        this.memoryOutbox.set(id, { ...existing, ...updates });
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox_transactions', 'readwrite');
      const store = tx.objectStore('outbox_transactions');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, ...updates };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Obtiene todas las transacciones de Outbox
   */
  public async getAllOutboxTransactions(): Promise<OutboxTransaction[]> {
    if (this.isFallbackInMemory || !this.db) {
      return Array.from(this.memoryOutbox.values());
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('outbox_transactions', 'readonly');
      const store = tx.objectStore('outbox_transactions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Obtiene transacciones en Dead-Letter Queue (ERROR_FATAL_DATOS)
   */
  public async getDlqTransactions(): Promise<OutboxTransaction[]> {
    if (this.isFallbackInMemory || !this.db) {
      return Array.from(this.memoryOutbox.values()).filter(
        (t) => t.estado === 'ERROR_FATAL_DATOS'
      );
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('outbox_transactions', 'readonly');
      const store = tx.objectStore('outbox_transactions');
      const index = store.index('estado');
      const request = index.getAll('ERROR_FATAL_DATOS');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // ==========================================
  // GESTIÓN DE PREVENTAS LOCALES MULTIVENDEDOR (SPEC-041)
  // ==========================================

  public async upsertPreventaLocal(preventa: PreventaSync): Promise<void> {
    if (this.isFallbackInMemory || !this.db) {
      this.memoryPreventas.set(preventa.id, preventa);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('preventas_locales', 'readwrite');
      const store = tx.objectStore('preventas_locales');
      store.put(preventa);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getPreventasLocales(estado?: string): Promise<PreventaSync[]> {
    if (this.isFallbackInMemory || !this.db) {
      const list = Array.from(this.memoryPreventas.values());
      return estado ? list.filter((p) => p.estado === estado) : list;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('preventas_locales', 'readonly');
      const store = tx.objectStore('preventas_locales');

      if (estado) {
        const index = store.index('estado');
        const req = index.getAll(estado);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } else {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      }
    });
  }

  public async getPreventaLocalById(id: string): Promise<PreventaSync | null> {
    if (this.isFallbackInMemory || !this.db) {
      return this.memoryPreventas.get(id) || null;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('preventas_locales', 'readonly');
      const store = tx.objectStore('preventas_locales');
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  public async updatePreventaLocalEstado(
    id: string,
    estado: 'PENDIENTE_COBRO' | 'PAGADO' | 'ANULADO',
    extraData?: any
  ): Promise<void> {
    if (this.isFallbackInMemory || !this.db) {
      const prev = this.memoryPreventas.get(id);
      if (prev) {
        this.memoryPreventas.set(id, {
          ...prev,
          estado,
          ...(extraData || {}),
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('preventas_locales', 'readwrite');
      const store = tx.objectStore('preventas_locales');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = {
            ...getReq.result,
            estado,
            ...(extraData || {}),
            updatedAt: new Date().toISOString(),
          };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async deletePreventaLocal(id: string): Promise<void> {
    if (this.isFallbackInMemory || !this.db) {
      this.memoryPreventas.delete(id);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('preventas_locales', 'readwrite');
      const store = tx.objectStore('preventas_locales');
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==========================================
  // GESTIÓN DE CONFLICTOS OCC (SPEC-041)
  // ==========================================

  public async addSyncConflict(conflict: SyncConflict): Promise<void> {
    if (this.isFallbackInMemory || !this.db) {
      this.memoryConflicts.set(conflict.id, conflict);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('sync_conflicts', 'readwrite');
      const store = tx.objectStore('sync_conflicts');
      store.put(conflict);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getSyncConflicts(resolucion?: string): Promise<SyncConflict[]> {
    if (this.isFallbackInMemory || !this.db) {
      const list = Array.from(this.memoryConflicts.values());
      return resolucion ? list.filter((c) => c.resolucion === resolucion) : list;
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction('sync_conflicts', 'readonly');
      const store = tx.objectStore('sync_conflicts');

      if (resolucion) {
        const index = store.index('resolucion');
        const req = index.getAll(resolucion);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } else {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      }
    });
  }

  /**
   * Cierra la conexión de base de datos
   */
  public async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Limpia todos los datos del tenant actual (sin afectar otros tenants)
   */
  public async clearTenantData(): Promise<void> {
    this.memoryProducts.clear();
    this.memoryClients.clear();
    this.memoryStock.clear();
    this.memoryOutbox.clear();
    this.memoryPreventas.clear();
    this.memoryConflicts.clear();

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const storesToClear = ['productos', 'clientes', 'stock', 'outbox_transactions'];
      if (this.db!.objectStoreNames.contains('preventas_locales')) {
        storesToClear.push('preventas_locales');
      }
      if (this.db!.objectStoreNames.contains('sync_conflicts')) {
        storesToClear.push('sync_conflicts');
      }

      const tx = this.db!.transaction(storesToClear, 'readwrite');

      for (const s of storesToClear) {
        tx.objectStore(s).clear();
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Alias de conveniencia para pruebas y reseteo
   */
  public async clearAll(): Promise<void> {
    return this.clearTenantData();
  }
}

// Instancia singleton por defecto
export const tenantIndexedDb = new TenantIndexedDbService();

