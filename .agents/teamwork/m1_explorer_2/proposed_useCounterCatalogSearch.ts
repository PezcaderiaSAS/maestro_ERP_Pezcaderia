// src/hooks/useCounterCatalogSearch.ts
// Hook especializado para la Vista de Mostrador (/mostrador)
// Conecta el Catálogo Masivo (10.000 Ítems) con Búsqueda Sub-10ms, Escáner O(1) y Top 100 Pareto

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { LocalIndexedDbProduct } from '../types/indexedDb.types';
import { useCatalogSearchWorker } from './useCatalogSearchWorker';
import { tenantIndexedDb } from '../services/tenantIndexedDbService';

export interface UseCounterCatalogSearchOptions {
  autoHydrate?: boolean;
  debounceMs?: number;
  initialCategory?: string;
  maxResults?: number;
}

export interface UseCounterCatalogSearchResult {
  // Estado de Búsqueda
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | undefined;
  setSelectedCategory: (category: string | undefined) => void;

  // Resultados
  searchResults: LocalIndexedDbProduct[];
  topParetoItems: LocalIndexedDbProduct[];
  isSearching: boolean;
  isIndexing: boolean;
  searchLatencyMs: number;

  // Acciones y Métodos O(1) Síncronos
  lookupByBarcodeOrSku: (code: string) => LocalIndexedDbProduct | undefined;
  queryProducts: (term: string, limit?: number) => Promise<LocalIndexedDbProduct[]>;
  reloadCatalog: () => Promise<void>;
}

export function useCounterCatalogSearch(
  options: UseCounterCatalogSearchOptions = {}
): UseCounterCatalogSearchResult {
  const {
    autoHydrate = true,
    debounceMs = 50,
    initialCategory,
    maxResults = 80,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isIndexing,
    isSearching,
    searchLatencyMs,
    searchResults,
    topParetoItems,
    indexCatalog,
    search,
    queryProducts,
    lookupByBarcodeOrSku,
  } = useCatalogSearchWorker();

  // Hidratación inicial desde IndexedDB si se solicita
  const reloadCatalog = useCallback(async () => {
    try {
      const products = await tenantIndexedDb.getAllProducts();
      if (products && products.length > 0) {
        indexCatalog(products);
      }
    } catch (err) {
      console.warn('Error al hidratar catálogo desde IndexedDB para el mostrador:', err);
    }
  }, [indexCatalog]);

  useEffect(() => {
    if (autoHydrate) {
      reloadCatalog();
    }
  }, [autoHydrate, reloadCatalog]);

  // Manejo de búsqueda reactiva con Debounce (50ms) y filtro por categoría
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      search(searchQuery, {
        limit: maxResults,
        category: selectedCategory,
      });
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, selectedCategory, debounceMs, maxResults, search]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    searchResults,
    topParetoItems,
    isSearching,
    isIndexing,
    searchLatencyMs,
    lookupByBarcodeOrSku,
    queryProducts,
    reloadCatalog,
  };
}
