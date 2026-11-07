// Benchmark script for M1 Fast Search Engine Optimizations
// Testing with 10,000 items

import { SearchEngineCore } from '../../../src/workers/searchEngineCore';
import type { LocalIndexedDbProduct } from '../../../src/types/indexedDb.types';

console.log('--- Generando 10,000 productos sintéticos ---');
const products: LocalIndexedDbProduct[] = Array.from({ length: 10000 }, (_, i) => {
  const isPareto = i >= 5000 && i < 5100; // Pareto items placed in the middle
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

const engine = new SearchEngineCore();
const t0 = performance.now();
engine.indexProducts(products);
const indexTime = performance.now() - t0;
console.log(`Indexación de 10,000 productos completada en: ${indexTime.toFixed(2)} ms`);

// 1. Benchmark Barcode & SKU Lookup
console.log('\n--- 1. Benchmark Barcode & SKU Lookup ---');
const testBarcode = products[42].codigoBarras!;
const testSku = products[999].sku;

// Current engine.searchProducts for exact SKU/Barcode
const tSku0 = performance.now();
const resSku = engine.searchProducts(testSku, { limit: 1 });
const tSku = performance.now() - tSku0;
console.log(`searchProducts('${testSku}'): ${tSku.toFixed(4)} ms | Results: ${resSku.length}`);

const tBar0 = performance.now();
const resBar = engine.searchProducts(testBarcode, { limit: 1 });
const tBar = performance.now() - tBar0;
console.log(`searchProducts('${testBarcode}'): ${tBar.toFixed(4)} ms | Results: ${resBar.length}`);

// Direct O(1) Map lookup simulation
const skuMap = new Map<string, LocalIndexedDbProduct>();
const barcodeMap = new Map<string, LocalIndexedDbProduct>();
for (const p of products) {
  skuMap.set(p.sku.toLowerCase(), p);
  if (p.codigoBarras) barcodeMap.set(p.codigoBarras, p);
}

const tO1_0 = performance.now();
for (let k = 0; k < 1000; k++) {
  const p = skuMap.get(testSku.toLowerCase()) || barcodeMap.get(testBarcode);
}
const tO1_total = performance.now() - tO1_0;
console.log(`Direct O(1) Map lookup (avg per lookup over 1,000 calls): ${(tO1_total / 1000).toFixed(6)} ms (< 0.05ms target)`);

// 2. Empty Query (Top 100 Pareto)
console.log('\n--- 2. Benchmark Empty Query ---');
const tEmpty0 = performance.now();
const resEmpty = engine.searchProducts('', { limit: 100 });
const tEmpty = performance.now() - tEmpty0;
console.log(`Current searchProducts(''): ${tEmpty.toFixed(4)} ms | Results: ${resEmpty.length}`);
console.log(`Current empty query Pareto count in top 100: ${resEmpty.filter(r => r.item.esParetoTop100).length} / 100 (EXPECTED: 100!)`);

// 3. Multi-word search
console.log('\n--- 3. Benchmark Fuzzy / Multi-token Search ---');
const tSearch0 = performance.now();
const resSearch = engine.searchProducts('SALMON CHILENO 20G', { limit: 80 });
const tSearch = performance.now() - tSearch0;
console.log(`searchProducts('SALMON CHILENO 20G'): ${tSearch.toFixed(2)} ms | Results: ${resSearch.length}`);

const tFuzzy0 = performance.now();
const resFuzzy = engine.searchProducts('samon cileno', { limit: 80 });
const tFuzzy = performance.now() - tFuzzy0;
console.log(`searchProducts('samon cileno' [2 typos]): ${tFuzzy.toFixed(2)} ms | Results: ${resFuzzy.length}`);
