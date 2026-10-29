// src/workers/catalogSearch.worker.ts
// Web Worker ESM nativo para indexación y búsqueda fuzzy en segundo plano (Off-Thread)
// No congela el hilo principal de React y responde en < 2ms.

import { SearchEngineCore } from './searchEngineCore';

const engine = new SearchEngineCore();

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INDEX_DATASET': {
      const start = performance.now();
      const { products = [], clients = [] } = payload;
      engine.indexProducts(products);
      if (clients.length > 0) {
        engine.indexClients(clients);
      }
      const durationMs = performance.now() - start;

      self.postMessage({
        type: 'INDEX_COMPLETE',
        payload: {
          productsCount: products.length,
          clientsCount: clients.length,
          durationMs,
        },
      });
      break;
    }

    case 'UPDATE_DELTA': {
      const start = performance.now();
      const { products = [] } = payload;
      engine.updateDelta(products);
      const durationMs = performance.now() - start;

      self.postMessage({
        type: 'DELTA_UPDATE_COMPLETE',
        payload: {
          updatedCount: products.length,
          durationMs,
        },
      });
      break;
    }

    case 'SEARCH_PRODUCTS': {
      const start = performance.now();
      const { queryId, query, options } = payload;
      const results = engine.searchProducts(query, options);
      const durationMs = performance.now() - start;

      self.postMessage({
        type: 'SEARCH_PRODUCTS_RESULT',
        payload: {
          queryId,
          results,
          durationMs,
        },
      });
      break;
    }

    case 'SEARCH_CLIENTS': {
      const start = performance.now();
      const { queryId, query, options } = payload;
      const results = engine.searchClients(query, options);
      const durationMs = performance.now() - start;

      self.postMessage({
        type: 'SEARCH_CLIENTS_RESULT',
        payload: {
          queryId,
          results,
          durationMs,
        },
      });
      break;
    }

    case 'CLEAR_INDEX': {
      engine.clear();
      self.postMessage({ type: 'CLEAR_COMPLETE' });
      break;
    }

    default:
      console.warn('Tipo de mensaje no reconocido en CatalogSearchWorker:', type);
  }
};
