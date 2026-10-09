import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'MaestroPescaderiaOfflineDB';
const STORE_NAME = 'caja_outbox';
const DB_VERSION = 1;

interface OutboxOperation {
  idLocal: string;
  tipoOperacion: 'VENTA' | 'GASTO' | 'ARQUEO';
  payload: any;
  creadoEnOffline: string;
}

// Wrapper simple para IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'idLocal' });
      }
    };
  });
};

const saveToIDB = async (operation: OutboxOperation): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(operation);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllFromIDB = async (): Promise<OutboxOperation[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const clearIDB = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const useOutboxSync = (empresaId: string, cajaId: string) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const checkPending = useCallback(async () => {
    try {
      const operations = await getAllFromIDB();
      setPendingCount(operations.length);
    } catch (error) {
      console.error('Error al chequear IndexedDB:', error);
    }
  }, []);

  // Función para guardar operación offline (usada por el UI)
  const enqueueOperation = async (tipoOperacion: 'VENTA' | 'GASTO' | 'ARQUEO', payload: any) => {
    const operation: OutboxOperation = {
      idLocal: crypto.randomUUID(),
      tipoOperacion,
      payload,
      creadoEnOffline: new Date().toISOString()
    };
    
    await saveToIDB(operation);
    await checkPending();
    
    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      triggerSync();
    }
  };

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    try {
      setIsSyncing(true);
      const operations = await getAllFromIDB();
      
      if (operations.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Payload para la API
      const syncPayload = {
        empresaId,
        cajaId,
        operaciones: operations
      };

      const response = await fetch('http://localhost:3001/api/pos/sync-outbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Vaciar IndexedDB si todo salió bien
          await clearIDB();
          await checkPending();
          console.log(`✅ Sincronización exitosa: ${result.data?.sincronizados} operaciones procesadas.`);
        }
      }
    } catch (error) {
      console.error('Error durante la sincronización Outbox:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [empresaId, cajaId, isSyncing, checkPending]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Chequeo inicial
    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, checkPending]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    enqueueOperation,
    triggerSync
  };
};
