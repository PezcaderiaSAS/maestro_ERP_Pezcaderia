// src/workers/catalogSearch.worker.ts
// Web Worker ESM nativo para indexación y búsqueda fuzzy en segundo plano (Off-Thread)
// No congela el hilo principal de React y responde en < 10ms sobre 10.000 ítems.

import { SearchEngineCore } from './searchEngineCore';

const engine = new SearchEngineCore();

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  try {
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
        const { queryId, query, options = {} } = payload;
        const results = engine.searchProducts(query, options);
        const durationMs = performance.now() - start;

        // Si se solicita returnSkusOnly, reducir el payload de serialización estructurada (10x más ligero)
        const outputResults = options.returnSkusOnly
          ? results.map((r) => ({ sku: r.item.sku, score: r.score }))
          : results;

        self.postMessage({
          type: 'SEARCH_PRODUCTS_RESULT',
          payload: {
            queryId,
            results: outputResults,
            durationMs,
          },
        });
        break;
      }

      case 'LOOKUP_BARCODE_OR_SKU': {
        const start = performance.now();
        const { queryId, code } = payload;
        const result = engine.lookupByBarcodeOrSku(code);
        const durationMs = performance.now() - start;

        self.postMessage({
          type: 'LOOKUP_RESULT',
          payload: {
            queryId,
            result,
            durationMs,
          },
        });
        break;
      }

      case 'GET_TOP_PARETO': {
        const start = performance.now();
        const { queryId, category, limit = 100 } = payload;
        const items = engine.getTop100Pareto(category, limit);
        const durationMs = performance.now() - start;

        self.postMessage({
          type: 'TOP_PARETO_RESULT',
          payload: {
            queryId,
            items,
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
  } catch (error) {
    console.error('Error interno en CatalogSearchWorker:', error);
    self.postMessage({
      type: 'WORKER_ERROR',
      payload: {
        error: error instanceof Error ? error.message : String(error),
        queryId: payload?.queryId,
      },
    });
  }
};
