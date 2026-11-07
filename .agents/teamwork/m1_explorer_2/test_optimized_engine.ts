// Benchmark comparing current SearchEngineCore vs OptimizedSearchEngineCore
// on 10,000 items

import type { LocalIndexedDbProduct } from '../../../src/types/indexedDb.types';

export class OptimizedSearchEngineCore {
  private products: LocalIndexedDbProduct[] = [];
  private skuMap = new Map<string, LocalIndexedDbProduct>();
  private barcodeMap = new Map<string, LocalIndexedDbProduct>();
  private paretoTop100: LocalIndexedDbProduct[] = [];

  // Inverted index: word -> Set of products
  private wordToProducts = new Map<string, Set<LocalIndexedDbProduct>>();
  // Prefix map: 2-char prefix -> list of unique vocabulary words
  private prefixToWords = new Map<string, string[]>();
  private vocabulary: string[] = [];

  // Reusable buffers for Levenshtein to eliminate GC pressure
  private v0 = new Int32Array(64);
  private v1 = new Int32Array(64);

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(/[\s,.\-_/]+/)
      .filter((t) => t.length > 0);
  }

  private fastLevenshtein(a: string, b: string, maxLimit = 2): number {
    if (a === b) return 0;
    const lenA = a.length;
    const lenB = b.length;
    if (Math.abs(lenA - lenB) > maxLimit) return maxLimit + 1;
    if (lenA >= 64 || lenB >= 64) return maxLimit + 1;

    for (let j = 0; j <= lenB; j++) this.v0[j] = j;

    for (let i = 1; i <= lenA; i++) {
      this.v1[0] = i;
      let minRow = this.v1[0];
      const charA = a.charCodeAt(i - 1);

      for (let j = 1; j <= lenB; j++) {
        const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
        const insert = this.v1[j - 1] + 1;
        const del = this.v0[j] + 1;
        const sub = this.v0[j - 1] + cost;
        const cell = insert < del ? (insert < sub ? insert : sub) : (del < sub ? del : sub);
        this.v1[j] = cell;
        if (cell < minRow) minRow = cell;
      }

      if (minRow > maxLimit) return maxLimit + 1;
      // Copy v1 to v0
      for (let j = 0; j <= lenB; j++) this.v0[j] = this.v1[j];
    }

    return this.v0[lenB];
  }

  public indexProducts(products: LocalIndexedDbProduct[]): void {
    this.products = products;
    this.skuMap.clear();
    this.barcodeMap.clear();
    this.wordToProducts.clear();
    this.prefixToWords.clear();

    const paretoArr: LocalIndexedDbProduct[] = [];
    const nonParetoArr: LocalIndexedDbProduct[] = [];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];

      // Pareto segregation
      if (prod.esParetoTop100) {
        paretoArr.push(prod);
      } else if (nonParetoArr.length < 100) {
        nonParetoArr.push(prod);
      }

      // SKU directo
      const normSku = this.normalize(prod.sku);
      this.skuMap.set(normSku, prod);

      // Barcode directo (both normalized and trimmed)
      if (prod.codigoBarras) {
        const trimmed = prod.codigoBarras.trim();
        this.barcodeMap.set(trimmed, prod);
        const normBar = this.normalize(trimmed);
        if (normBar !== trimmed) {
          this.barcodeMap.set(normBar, prod);
        }
      }

      // Inverted index tokens
      const tokens = this.tokenize(`${prod.sku} ${prod.nombre} ${prod.categoria || ''}`);
      for (let t = 0; t < tokens.length; t++) {
        const token = tokens[t];
        let set = this.wordToProducts.get(token);
        if (!set) {
          set = new Set<LocalIndexedDbProduct>();
          this.wordToProducts.set(token, set);
        }
        set.add(prod);
      }
    }

    // Top 100 Pareto pre-computed
    this.paretoTop100 = paretoArr.slice(0, 100);
    if (this.paretoTop100.length < 100) {
      this.paretoTop100.push(...nonParetoArr.slice(0, 100 - this.paretoTop100.length));
    }

    this.vocabulary = Array.from(this.wordToProducts.keys());

    // Build 2-character prefix map for vocabulary
    for (let w = 0; w < this.vocabulary.length; w++) {
      const word = this.vocabulary[w];
      const pfx = word.length >= 2 ? word.slice(0, 2) : word;
      let list = this.prefixToWords.get(pfx);
      if (!list) {
        list = [];
        this.prefixToWords.set(pfx, list);
      }
      list.push(word);
    }
  }

  // O(1) Instant lookup (< 0.05ms)
  public lookupByBarcodeOrSku(code: string): LocalIndexedDbProduct | undefined {
    if (!code) return undefined;
    const trimmed = code.trim();
    const norm = this.normalize(trimmed);
    return this.skuMap.get(norm) || this.barcodeMap.get(norm) || this.barcodeMap.get(trimmed);
  }

  // Instant Top 100 Pareto (< 0.01ms)
  public getTop100Pareto(category?: string, limit = 100): LocalIndexedDbProduct[] {
    if (!category) {
      return this.paretoTop100.slice(0, limit);
    }
    return this.products
      .filter((p) => p.categoria === category)
      .sort((a, b) => (b.esParetoTop100 ? 1 : 0) - (a.esParetoTop100 ? 1 : 0))
      .slice(0, limit);
  }

  public searchProducts(query: string, options: { limit?: number; category?: string; minScore?: number } = {}): { item: LocalIndexedDbProduct; score: number }[] {
    const { limit = 80, category, minScore = 10 } = options;
    const cleanQuery = this.normalize(query);

    // 0. Empty query: instant Pareto top 100
    if (!cleanQuery) {
      const pareto = this.getTop100Pareto(category, limit);
      return pareto.map((item) => ({ item, score: item.esParetoTop100 ? 100 : 50 }));
    }

    // 1. Direct Barcode / SKU short-circuit
    const directHit = this.lookupByBarcodeOrSku(cleanQuery);
    if (directHit && (!category || directHit.categoria === category)) {
      // If exact SKU or barcode matches, put it top
      // If user typed exact SKU or scanned barcode, we can return immediately
      return [{ item: directHit, score: 100 }];
    }

    const qTokens = this.tokenize(cleanQuery);
    if (qTokens.length === 0) return [];

    // Candidate selection with Prefix Bucketing and length filtering
    const candidateSetsPerToken: Map<LocalIndexedDbProduct, number>[] = [];

    for (let i = 0; i < qTokens.length; i++) {
      const qToken = qTokens[i];
      const tokenCandidates = new Map<LocalIndexedDbProduct, number>();
      const maxFuzzyDist = qToken.length <= 4 ? 1 : 2;

      // a. Exact word match
      const exactSet = this.wordToProducts.get(qToken);
      if (exactSet && exactSet.size > 0) {
        for (const prod of exactSet) {
          tokenCandidates.set(prod, 30);
        }
      } else {
        // b. Prefix / Bucketed Fuzzy Search
        // Use prefix map if token length >= 2
        const pfx = qToken.slice(0, 2);
        const searchBucket = this.prefixToWords.get(pfx) || this.vocabulary;

        for (let w = 0; w < searchBucket.length; w++) {
          const vocabWord = searchBucket[w];
          // Pre-check length diff
          if (Math.abs(vocabWord.length - qToken.length) > maxFuzzyDist && !vocabWord.startsWith(qToken)) {
            continue;
          }

          let matchQuality = 0;
          if (vocabWord.startsWith(qToken)) {
            matchQuality = 25;
          } else if (vocabWord.includes(qToken)) {
            matchQuality = 20;
          } else if (qToken.length >= 4) {
            const dist = this.fastLevenshtein(qToken, vocabWord, maxFuzzyDist);
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

    if (candidateSetsPerToken.length === 0) return [];

    // Sort candidate sets by size ascending (intersect smallest first)
    candidateSetsPerToken.sort((a, b) => a.size - b.size);
    const smallestSet = candidateSetsPerToken[0];
    const resultsMap = new Map<LocalIndexedDbProduct, number>();

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
        if (this.normalize(prod.sku).includes(cleanQuery)) {
          totalScore += 30;
        }
        if (prod.esParetoTop100) {
          totalScore += 5;
        }

        if (totalScore >= minScore) {
          resultsMap.set(prod, totalScore);
        }
      }
    }

    // Sort and limit
    const sorted = Array.from(resultsMap.entries())
      .map(([item, score]) => ({ item, score }))
      .sort((a, b) => b.score - a.score || a.item.nombre.localeCompare(b.item.nombre));

    return sorted.slice(0, limit);
  }
}

// RUN BENCHMARK
const products: LocalIndexedDbProduct[] = Array.from({ length: 10000 }, (_, i) => {
  const isPareto = i >= 5000 && i < 5100;
  return {
    sku: `SKU-${i.toString().padStart(5, '0')}`,
    tenantId: 'tenant-pezca-01',
    nombre: `FILETE DE SALMON CHILENO PREMIUM ${i % 10}X${(i % 50) + 10}G CON CORTE LIMPIO LOTE ${i}`,
    codigoBarras: `77099900${i.toString().padStart(5, '0')}`,
    categoria: i % 2 === 0 ? 'PESCADOS' : 'MARISCOS',
    precioDetal: 25000 + (i % 100) * 500,
    precioMayorista: 21000 + (i % 100) * 500,
    precioRestaurante: 22000 + (i % 100) * 500,
    cantidadMinimaMayorista: 5,
    stockDisponible: 100 + (i % 20),
    esParetoTop100: isPareto,
    activo: true,
    updatedAt: new Date().toISOString(),
  };
});

const optEngine = new OptimizedSearchEngineCore();
const t0 = performance.now();
optEngine.indexProducts(products);
const idxTime = performance.now() - t0;
console.log(`Optimized Indexing 10k: ${idxTime.toFixed(2)} ms`);

// Test 1: lookupByBarcodeOrSku
const tL0 = performance.now();
for (let i = 0; i < 1000; i++) {
  optEngine.lookupByBarcodeOrSku('7709990000042');
}
const avgLookup = (performance.now() - tL0) / 1000;
console.log(`lookupByBarcodeOrSku avg: ${avgLookup.toFixed(6)} ms (Target: < 0.05ms)`);

// Test 2: Empty query Pareto
const tE0 = performance.now();
const paretoResults = optEngine.searchProducts('', { limit: 100 });
const tE = performance.now() - tE0;
const paretoCount = paretoResults.filter(r => r.item.esParetoTop100).length;
console.log(`Empty query time: ${tE.toFixed(4)} ms | Pareto items in top 100: ${paretoCount} / 100`);

// Test 3: Multi-token
const tM0 = performance.now();
const multiRes = optEngine.searchProducts('SALMON CHILENO 20G', { limit: 80 });
const tM = performance.now() - tM0;
console.log(`Multi-token 'SALMON CHILENO 20G': ${tM.toFixed(2)} ms | Results: ${multiRes.length}`);

// Test 4: Fuzzy
const tF0 = performance.now();
const fuzzyRes = optEngine.searchProducts('samon cileno', { limit: 80 });
const tF = performance.now() - tF0;
console.log(`Fuzzy 'samon cileno': ${tF.toFixed(2)} ms | Results: ${fuzzyRes.length}`);
