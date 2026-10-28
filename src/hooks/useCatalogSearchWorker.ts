// src/hooks/useCatalogSearchWorker.ts
// Hook de Integración React con el Web Worker de Búsqueda Off-Thread

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';
import type { SearchOptions } from '../workers/searchEngineCore';
import { SearchEngineCore } from '../workers/searchEngineCore';

export interface UseCatalogSearchWorkerReturn {
  isIndexing: boolean;
  isSearching: boolean;
  searchLatencyMs: number;
  searchResults: LocalIndexedDbProduct[];
  indexCatalog: (products: LocalIndexedDbProduct[], clients?: LocalIndexedDbClient[]) => void;
  search: (query: string, options?: SearchOptions) => void;
  searchClientsSync: (query: string, options?: { limit?: number }) => LocalIndexedDbClient[];
}

export function useCatalogSearchWorker(
  initialProducts: LocalIndexedDbProduct[] = []
): UseCatalogSearchWorkerReturn {
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState(0);
  const [searchResults, setSearchResults] = useState<LocalIndexedDbProduct[]>(initialProducts);

  const workerRef = useRef<Worker | null>(null);
  const fallbackEngineRef = useRef<SearchEngineCore>(new SearchEngineCore());
  const pendingQueriesRef = useRef(new Map<string, (results: LocalIndexedDbProduct[]) => void>());

  // Inicialización segura del Web Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/catalogSearch.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (event) => {
          const { type, payload } = event.data;

          if (type === 'INDEX_COMPLETE') {
            setIsIndexing(false);
          } else if (type === 'SEARCH_PRODUCTS_RESULT') {
            const { queryId, results, durationMs } = payload;
            setSearchLatencyMs(durationMs);
            setIsSearching(false);

            const prods = results.map((r: any) => r.item);
            setSearchResults(prods);

            const resolver = pendingQueriesRef.current.get(queryId);
            if (resolver) {
              resolver(prods);
              pendingQueriesRef.current.delete(queryId);
            }
          }
        };

        workerRef.current = worker;
      } catch (err) {
        console.warn('No se pudo instanciar Web Worker, usando motor local síncrono:', err);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Indexar el catálogo
  const indexCatalog = useCallback(
    (products: LocalIndexedDbProduct[], clients: LocalIndexedDbClient[] = []) => {
      setIsIndexing(true);

      // Si hay Worker disponible, enviar mensaje al hilo secundario
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'INDEX_DATASET',
          payload: { products, clients },
        });
      }

      // Mantener motor fallback actualizado
      fallbackEngineRef.current.indexProducts(products);
      if (clients.length > 0) {
        fallbackEngineRef.current.indexClients(clients);
      }

      if (!workerRef.current) {
        setIsIndexing(false);
      }
    },
    []
  );

  // Ejecutar búsqueda reactiva
  const search = useCallback((query: string, options: SearchOptions = {}) => {
    setIsSearching(true);
    const queryId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SEARCH_PRODUCTS',
        payload: { queryId, query, options },
      });
    } else {
      // Fallback síncrono si no hay Worker
      const start = performance.now();
      const results = fallbackEngineRef.current.searchProducts(query, options);
      const duration = performance.now() - start;

      setSearchLatencyMs(duration);
      setIsSearching(false);
      setSearchResults(results.map((r) => r.item));
    }
  }, []);

  // Búsqueda de clientes síncrona/fallback
  const searchClientsSync = useCallback(
    (query: string, options: { limit?: number } = {}) => {
      const results = fallbackEngineRef.current.searchClients(query, options);
      return results.map((r) => r.item);
    },
    []
  );

  return {
    isIndexing,
    isSearching,
    searchLatencyMs,
    searchResults,
    indexCatalog,
    search,
    searchClientsSync,
  };
}
