// src/workers/searchEngineCore.ts
// Motor Matemático de Indexación y Búsqueda Difusa (Fuzzy Search) Off-Thread
// Optimizado con Índice Invertido y Caché de Vocabulario para Latencia < 2ms

import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';

export interface SearchProductResult {
  item: LocalIndexedDbProduct;
  score: number;
}

export interface SearchClientResult {
  item: LocalIndexedDbClient;
  score: number;
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  minScore?: number;
}

export class SearchEngineCore {
  private products: LocalIndexedDbProduct[] = [];
  private clients: LocalIndexedDbClient[] = [];

  // Índices primarios en memoria
  private skuMap = new Map<string, LocalIndexedDbProduct>();
  private barcodeMap = new Map<string, LocalIndexedDbProduct>();
  
  // Índice invertido: Palabra normalizada -> Lista de productos
  private wordToProducts = new Map<string, Set<LocalIndexedDbProduct>>();
  // Vocabulario único para búsqueda difusa rápida
  private vocabulary: string[] = [];

  private clientDocumentMap = new Map<string, LocalIndexedDbClient>();
  private clientWordIndex = new Map<string, Set<LocalIndexedDbClient>>();

  /**
   * Normaliza texto: minúsculas, sin tildes ni caracteres extraños
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Tokeniza texto en palabras individuales
   */
  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(/[\s,.\-_/]+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Distancia de Levenshtein optimizada (con cota superior rápida)
   */
  private levenshteinDistance(a: string, b: string, maxLimit = 2): number {
    if (a === b) return 0;
    const lenA = a.length;
    const lenB = b.length;
    if (Math.abs(lenA - lenB) > maxLimit) return maxLimit + 1;

    let prev = new Array(lenB + 1);
    let curr = new Array(lenB + 1);

    for (let j = 0; j <= lenB; j++) prev[j] = j;

    for (let i = 1; i <= lenA; i++) {
      curr[0] = i;
      let minRow = curr[0];

      for (let j = 1; j <= lenB; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        if (curr[j] < minRow) minRow = curr[j];
      }

      if (minRow > maxLimit) return maxLimit + 1;
      const temp = prev;
      prev = curr;
      curr = temp;
    }

    return prev[lenB];
  }

  /**
   * Indexa el catálogo de productos
   */
  public indexProducts(products: LocalIndexedDbProduct[]): void {
    this.products = products;
    this.skuMap.clear();
    this.barcodeMap.clear();
    this.wordToProducts.clear();

    for (const prod of products) {
      // 1. SKU directo
      const normSku = this.normalize(prod.sku);
      this.skuMap.set(normSku, prod);

      // 2. Barcode directo
      if (prod.codigoBarras) {
        this.barcodeMap.set(prod.codigoBarras.trim(), prod);
      }

      // 3. Índice Invertido
      const tokens = this.tokenize(`${prod.sku} ${prod.nombre} ${prod.categoria || ''}`);
      for (const token of tokens) {
        let set = this.wordToProducts.get(token);
        if (!set) {
          set = new Set<LocalIndexedDbProduct>();
          this.wordToProducts.set(token, set);
        }
        set.add(prod);
      }
    }

    this.vocabulary = Array.from(this.wordToProducts.keys());
  }

  /**
   * Refresco incremental delta de productos sin reconstruir el índice completo (SPEC-041)
   */
  public updateDelta(deltas: LocalIndexedDbProduct[]): void {
    if (!deltas || deltas.length === 0) return;

    for (const prod of deltas) {
      const normSku = this.normalize(prod.sku);

      // 1. Si existía previamente, actualizar en el array general
      const existingIdx = this.products.findIndex((p) => this.normalize(p.sku) === normSku);
      if (existingIdx >= 0) {
        this.products[existingIdx] = prod;
      } else {
        this.products.push(prod);
      }

      // 2. Actualizar mapas directos
      this.skuMap.set(normSku, prod);
      if (prod.codigoBarras) {
        this.barcodeMap.set(prod.codigoBarras.trim(), prod);
      }

      // 3. Actualizar índice invertido para los tokens del producto
      const tokens = this.tokenize(`${prod.sku} ${prod.nombre} ${prod.categoria || ''}`);
      for (const token of tokens) {
        let set = this.wordToProducts.get(token);
        if (!set) {
          set = new Set<LocalIndexedDbProduct>();
          this.wordToProducts.set(token, set);
          this.vocabulary.push(token);
        }
        set.add(prod);
      }
    }
  }

  public getProducts(): LocalIndexedDbProduct[] {
    return this.products;
  }

  public getClients(): LocalIndexedDbClient[] {
    return this.clients;
  }

  /**
   * Indexa el directorio de clientes
   */
  public indexClients(clients: LocalIndexedDbClient[]): void {
    this.clients = clients;
    this.clientDocumentMap.clear();
    this.clientWordIndex.clear();

    for (const client of clients) {
      const normDoc = this.normalize(client.nitOCedula).replace(/\D/g, '');
      if (normDoc) {
        this.clientDocumentMap.set(normDoc, client);
      }

      const tokens = this.tokenize(`${client.nitOCedula} ${client.razonSocialONombre}`);
      for (const token of tokens) {
        let set = this.clientWordIndex.get(token);
        if (!set) {
          set = new Set<LocalIndexedDbClient>();
          this.clientWordIndex.set(token, set);
        }
        set.add(client);
      }
    }
  }

  /**
   * Búsqueda ultra-rápida sub-2ms mediante Índice Invertido y Ranking
   */
  public searchProducts(query: string, options: SearchOptions = {}): SearchProductResult[] {
    const { limit = 80, category, minScore = 10 } = options;
    const cleanQuery = this.normalize(query);

    if (!cleanQuery) {
      const initial = category
        ? this.products.filter((p) => p.categoria === category)
        : this.products;
      return initial
        .slice(0, limit)
        .map((item) => ({ item, score: item.esParetoTop100 ? 100 : 50 }));
    }

    const resultsMap = new Map<LocalIndexedDbProduct, number>();

    // 1. Verificación O(1) de Barcode
    if (/^\d{8,14}$/.test(cleanQuery)) {
      const barcodeMatch = this.barcodeMap.get(cleanQuery);
      if (barcodeMatch && (!category || barcodeMatch.categoria === category)) {
        resultsMap.set(barcodeMatch, 100);
      }
    }

    // 2. Verificación O(1) de SKU exacto
    const skuExactMatch = this.skuMap.get(cleanQuery);
    if (skuExactMatch && (!category || skuExactMatch.categoria === category)) {
      resultsMap.set(skuExactMatch, 100);
    }

    // 3. Búsqueda por Tokens con Índice Invertido
    const qTokens = this.tokenize(cleanQuery);
    if (qTokens.length === 0) return [];

    // Para cada token de la consulta, encontrar las palabras coincidentes en el vocabulario
    const candidateSetsPerToken: Map<LocalIndexedDbProduct, number>[] = [];

    for (const qToken of qTokens) {
      const tokenCandidates = new Map<LocalIndexedDbProduct, number>();
      const maxFuzzyDist = qToken.length <= 4 ? 1 : 2;

      // a. Coincidencia exacta de palabra
      const exactSet = this.wordToProducts.get(qToken);
      if (exactSet && exactSet.size > 0) {
        for (const prod of exactSet) {
          tokenCandidates.set(prod, 30);
        }
      } else {
        // b. Solo si NO hubo coincidencia exacta, buscar prefijo o fuzzy en el vocabulario único
        for (const vocabWord of this.vocabulary) {
          let matchQuality = 0;
          if (vocabWord.startsWith(qToken)) {
            matchQuality = 25;
          } else if (vocabWord.includes(qToken)) {
            matchQuality = 20;
          } else if (qToken.length >= 4) {
            const dist = this.levenshteinDistance(qToken, vocabWord, maxFuzzyDist);
            if (dist <= maxFuzzyDist) {
              matchQuality = Math.max(15, 25 - dist * 5);
            }
          }

          if (matchQuality > 0) {
            const prods = this.wordToProducts.get(vocabWord);
            if (prods) {
              for (const prod of prods) {
                const prev = tokenCandidates.get(prod) || 0;
                if (matchQuality > prev) {
                  tokenCandidates.set(prod, matchQuality);
                }
              }
            }
          }
        }
      }

      candidateSetsPerToken.push(tokenCandidates);
    }

    // Intersección optimizada: ordenar por tamaño ascendente para iterar el conjunto más pequeño
    if (candidateSetsPerToken.length > 0) {
      candidateSetsPerToken.sort((a, b) => a.size - b.size);
      const smallestSet = candidateSetsPerToken[0];

      for (const [prod, score0] of smallestSet.entries()) {
        if (category && prod.categoria !== category) continue;

        let totalScore = score0;
        let matchedAll = true;

        for (let i = 1; i < candidateSetsPerToken.length; i++) {
          const tokenSet = candidateSetsPerToken[i];
          const tokenScore = tokenSet.get(prod);
          if (tokenScore === undefined) {
            matchedAll = false;
            break;
          }
          totalScore += tokenScore;
        }

        if (matchedAll) {
          // Bonificación si el SKU contiene la query
          if (this.normalize(prod.sku).includes(cleanQuery)) {
            totalScore += 30;
          }
          if (prod.esParetoTop100) {
            totalScore += 5;
          }

          if (totalScore >= minScore) {
            const existing = resultsMap.get(prod) || 0;
            if (totalScore > existing) {
              resultsMap.set(prod, totalScore);
            }
          }
        }
      }
    }

    // Ordenar y limitar
    const sorted = Array.from(resultsMap.entries())
      .map(([item, score]) => ({ item, score }))
      .sort((a, b) => b.score - a.score || a.item.nombre.localeCompare(b.item.nombre));

    return sorted.slice(0, limit);
  }

  /**
   * Búsqueda de clientes por documento o nombre
   */
  public searchClients(query: string, options: { limit?: number } = {}): SearchClientResult[] {
    const { limit = 30 } = options;
    const cleanQuery = this.normalize(query);
    const cleanDigits = cleanQuery.replace(/\D/g, '');

    if (!cleanQuery) {
      return this.clients.slice(0, limit).map((item) => ({ item, score: 50 }));
    }

    const resultsMap = new Map<LocalIndexedDbClient, number>();

    // Búsqueda por documento (dígitos)
    if (cleanDigits.length >= 3) {
      for (const client of this.clients) {
        const clientDocDigits = this.normalize(client.nitOCedula).replace(/\D/g, '');
        if (clientDocDigits.includes(cleanDigits)) {
          const score = clientDocDigits === cleanDigits ? 100 : 70;
          resultsMap.set(client, score);
        }
      }
    }

    // Búsqueda por nombre de cliente
    const qTokens = this.tokenize(cleanQuery);
    for (const client of this.clients) {
      if (resultsMap.get(client) === 100) continue;

      const clientNameNorm = this.normalize(client.razonSocialONombre);
      const matchesAll = qTokens.every((token) => clientNameNorm.includes(token));

      if (matchesAll) {
        resultsMap.set(client, (resultsMap.get(client) || 0) + 50);
      }
    }

    return Array.from(resultsMap.entries())
      .map(([item, score]) => ({ item, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public clear(): void {
    this.products = [];
    this.clients = [];
    this.skuMap.clear();
    this.barcodeMap.clear();
    this.wordToProducts.clear();
    this.vocabulary = [];
    this.clientDocumentMap.clear();
    this.clientWordIndex.clear();
  }
}
