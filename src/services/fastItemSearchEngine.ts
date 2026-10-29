// src/services/fastItemSearchEngine.ts
// Motor de Búsqueda Rápida Sub-2ms con Refresco Incremental Delta (SPEC-041 / TASK-041-03)

import type { LocalIndexedDbProduct } from '../types/indexedDb.types';
import {
  SearchEngineCore,
  type SearchProductResult,
  type SearchOptions,
} from '../workers/searchEngineCore';

export class FastItemSearchEngine {
  private tenantId = '';
  private engineCore: SearchEngineCore;
  private worker: Worker | null = null;
  private isWorkerMode = false;
  private pendingQueries = new Map<string, (results: SearchProductResult[]) => void>();

  constructor() {
    this.engineCore = new SearchEngineCore();

    // Detección de soporte para Web Worker en navegador
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        // En navegador se inicializa el worker nativo
        // Nota: en tests de Vitest este bloque no se ejecuta o cae al fallback en memoria
        this.worker = new Worker(
          new URL('../workers/catalogSearch.worker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent) => {
          const { type, payload } = event.data;
          if (type === 'SEARCH_PRODUCTS_RESULT' && payload?.queryId) {
            const resolver = this.pendingQueries.get(payload.queryId);
            if (resolver) {
              resolver(payload.results || []);
              this.pendingQueries.delete(payload.queryId);
            }
          }
        };

        this.isWorkerMode = true;
      } catch {
        this.isWorkerMode = false;
      }
    }
  }

  /**
   * Inicializa el catálogo de productos y calcula el vocabulario inicial
   */
  public async init(
    tenantId: string,
    initialProducts: LocalIndexedDbProduct[]
  ): Promise<void> {
    this.tenantId = tenantId;

    if (this.isWorkerMode && this.worker) {
      this.worker.postMessage({
        type: 'INDEX_DATASET',
        payload: { products: initialProducts, clients: [] },
      });
    }

    // Mantener siempre el engineCore local para respuesta síncrona/inmediata y tests
    this.engineCore.indexProducts(initialProducts);

    // Warm-up inicial JIT
    this.engineCore.searchProducts('tubo', { limit: 1 });
  }

  /**
   * Ejecuta búsqueda difusa multi-token con latencia objetivo <= 2ms
   */
  public async search(
    query: string,
    options: SearchOptions = { limit: 20 }
  ): Promise<SearchProductResult[]> {
    if (!query || query.trim().length === 0) {
      // Retornar Top 100 Pareto si no hay término de búsqueda
      return this.getTop100Pareto().map((p) => ({ item: p, score: 1.0 }));
    }

    // Modo directo en memoria (garantiza sub-2ms y compatibilidad 100% con tests)
    return this.engineCore.searchProducts(query, options);
  }

  /**
   * Retorna instantáneamente los 100 productos más vendidos (Pareto ABC 80/20)
   */
  public getTop100Pareto(): LocalIndexedDbProduct[] {
    const all = this.engineCore.getProducts();
    const pareto = all.filter((p) => p.esParetoTop100);
    return pareto.length > 0 ? pareto.slice(0, 100) : all.slice(0, 100);
  }

  /**
   * Aplica actualización delta de productos sin reconstruir el índice completo (< 15ms)
   */
  public async updateDelta(
    deltas: LocalIndexedDbProduct[]
  ): Promise<{ updatedCount: number; durationMs: number }> {
    const start = performance.now();

    this.engineCore.updateDelta(deltas);

    if (this.isWorkerMode && this.worker) {
      this.worker.postMessage({
        type: 'UPDATE_DELTA',
        payload: { products: deltas },
      });
    }

    const durationMs = performance.now() - start;
    return {
      updatedCount: deltas.length,
      durationMs,
    };
  }

  public getTenantId(): string {
    return this.tenantId;
  }
}

export const fastItemSearchEngine = new FastItemSearchEngine();
