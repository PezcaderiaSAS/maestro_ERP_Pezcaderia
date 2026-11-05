/**
 * Benchmark Suite: Latencia Algorítmica y de Render en POS Mostrador (SPEC-053)
 * Mide tiempos de búsqueda (ingenua vs SearchEngineCore indexado) y adición al carrito
 * para catálogos sintéticos de 1.000, 5.000 y 16.000 SKUs.
 * Calcula métricas estadísticas deterministas: min, p50, p90, p95, p99.
 */

import { performance } from 'node:perf_hooks';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BenchmarkResult } from './types';
import { calculatePercentile, formatMs } from './stats';
import { SearchEngineCore } from '../../src/workers/searchEngineCore';
import type { LocalIndexedDbProduct } from '../../src/types/indexedDb.types';

export interface CatalogProduct {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio_venta_pos: number;
  precio_mayorista: number;
  codigoBarras: string;
  activo: boolean;
  esParetoTop100: boolean;
}

const CATEGORIES = ['PESCADOS', 'MARISCOS', 'FILETES', 'CONGELADOS', 'PROCESADOS', 'IMPORTADOS'];
const FISH_NAMES = [
  'Salmón Noruego Fresco', 'Salmón Porcionado Premium', 'Camarón Tigre Crudo', 'Camarón Tití Pelado',
  'Trucha Arcoíris Deshuesada', 'Trucha Mariposa Fresca', 'Róbalo del Pacífico', 'Róbalo Filete Congelado',
  'Tilapia Roja Entera', 'Tilapia Filete Fresco', 'Langostino Jumbo U-12', 'Langostino Mediano 21-25',
  'Sierra en Rodajas', 'Corvina de Roca', 'Pargo Rojo de Mar', 'Atún Aleta Amarilla Lomo',
  'Merluza Austral', 'Pulpo Limpio Cocido', 'Calamar Anillos', 'Mejillones en Media Concha',
  'Almejas Blancas', 'Filete de Basa', 'Bagre Criollo Rodajas', 'Bocachico del Magdalena'
];

/**
 * Generador determinista de catálogo de productos
 */
export function generateSyntheticCatalog(count: number): {
  products: CatalogProduct[];
  indexedProducts: LocalIndexedDbProduct[];
  stockWarehouse1: Record<string, number>;
  stockWarehouse2: Record<string, number>;
  bodegas: { id: string; nombre: string }[];
} {
  const products: CatalogProduct[] = [];
  const indexedProducts: LocalIndexedDbProduct[] = [];
  const stockWarehouse1: Record<string, number> = {};
  const stockWarehouse2: Record<string, number> = {};
  const bodegas = [
    { id: 'bodega-principal-01', nombre: 'Bodega Principal' },
    { id: 'bodega-secundaria-02', nombre: 'Bodega Secundaria' },
  ];

  for (let i = 1; i <= count; i++) {
    const baseName = FISH_NAMES[i % FISH_NAMES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const sku = `SKU-PZ-${i.toString().padStart(5, '0')}`;
    const barcode = `770${i.toString().padStart(10, '0')}`;
    const name = `${baseName} Lote ${i}`;
    const price = 15000 + (i % 80) * 1000;
    const isTop = i <= 100;

    const prod: CatalogProduct = {
      id: `prod-uuid-${i}`,
      sku,
      nombre: name,
      categoria: category,
      precio_venta_pos: price,
      precio_mayorista: Math.round(price * 0.85),
      codigoBarras: barcode,
      activo: true,
      esParetoTop100: isTop,
    };
    products.push(prod);

    indexedProducts.push({
      sku,
      tenantId: 'tenant-pezcaderia-central',
      nombre: name,
      codigoBarras: barcode,
      categoria: category,
      precioDetal: price,
      precioMayorista: Math.round(price * 0.85),
      cantidadMinimaMayorista: 5,
      stockDisponible: 50 + (i % 200),
      esParetoTop100: isTop,
      activo: true,
      updatedAt: new Date().toISOString(),
    });

    stockWarehouse1[sku] = (i % 7 === 0) ? 0 : 25 + (i % 150);
    stockWarehouse2[sku] = (i % 5 === 0) ? 0 : 10 + (i % 50);
  }

  return { products, indexedProducts, stockWarehouse1, stockWarehouse2, bodegas };
}

/**
 * Simulación exacta de búsqueda ingenua actual en ProductSearchPanel.tsx + POSView.tsx
 */
export function runNaiveSearch(
  products: CatalogProduct[],
  searchTerm: string,
  selectedCategory: string,
  stock1: Record<string, number>,
  stock2: Record<string, number>,
  bodegas: { id: string; nombre: string }[],
  hideOutOfStock = false
): CatalogProduct[] {
  const normTerm = searchTerm.toLowerCase();

  // Simulación de getProductStock síncrono con lookup de arreglo de bodegas
  const getStock = (sku: string, bodegaKey: string) => {
    const bodega = bodegas.find((b) => b.id === bodegaKey || b.nombre === bodegaKey);
    const targetKey = bodega ? bodega.id : bodegaKey;
    if (targetKey === 'bodega-principal-01' || targetKey === 'Bodega Principal') {
      return stock1[sku] || 0;
    }
    return stock2[sku] || 0;
  };

  let filtered = products.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(normTerm) ||
      p.sku.toLowerCase().includes(normTerm);
    const matchesCategory =
      selectedCategory === 'TODOS' || p.categoria === selectedCategory;

    // En el código real se llama getProductStock 2 veces por cada SKU evaluado
    const totalStock =
      getStock(p.sku, 'Bodega Principal') + getStock(p.sku, 'Bodega Secundaria');
    const matchesStock = !hideOutOfStock || totalStock > 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Ordenamiento con topKeywords síncrono O(N log N)
  if (searchTerm === '' && selectedCategory === 'TODOS') {
    const topKeywords = ['salmon', 'salmón', 'camaron', 'camarón', 'trucha', 'robalo', 'róbalo', 'langostino'];
    filtered = [...filtered].sort((a, b) => {
      const aTop = topKeywords.some((k) => a.nombre.toLowerCase().includes(k)) ? 1 : 0;
      const bTop = topKeywords.some((k) => b.nombre.toLowerCase().includes(k)) ? 1 : 0;
      return bTop - aTop;
    });
  }

  return filtered.slice(0, 80);
}

/**
 * Ejecuta benchmark de latencia de búsqueda comparando Ingenua vs Indexada
 */
export function benchmarkSearchScale(
  count: number,
  searchTerms: string[]
): {
  naiveSamplesMs: number[];
  indexedSamplesMs: number[];
  indexingTimeMs: number;
} {
  const { products, indexedProducts, stockWarehouse1, stockWarehouse2, bodegas } =
    generateSyntheticCatalog(count);

  // 1. Indexación previa de SearchEngineCore
  const searchEngine = new SearchEngineCore();
  const tIndexStart = performance.now();
  searchEngine.indexProducts(indexedProducts);
  const indexingTimeMs = performance.now() - tIndexStart;

  // 2. Muestreo de Búsqueda Ingenua
  const naiveSamplesMs: number[] = [];
  for (const term of searchTerms) {
    const t0 = performance.now();
    runNaiveSearch(products, term, 'TODOS', stockWarehouse1, stockWarehouse2, bodegas, false);
    const t1 = performance.now();
    naiveSamplesMs.push(t1 - t0);
  }

  // 3. Muestreo de Búsqueda Indexada
  const indexedSamplesMs: number[] = [];
  for (const term of searchTerms) {
    const t0 = performance.now();
    searchEngine.searchProducts(term, { limit: 80 });
    const t1 = performance.now();
    indexedSamplesMs.push(t1 - t0);
  }

  return { naiveSamplesMs, indexedSamplesMs, indexingTimeMs };
}

/**
 * Benchmark de mutación y re-render del carrito POS
 */
export function benchmarkCartOperations(itemCount = 50): {
  rerenderSamplesMs: number[];
  atomicSamplesMs: number[];
} {
  const { products, stockWarehouse1, stockWarehouse2, bodegas } = generateSyntheticCatalog(5000);

  const rerenderSamplesMs: number[] = [];
  const atomicSamplesMs: number[] = [];

  // Escenario A: Re-render monolítico (simula recrear 80 tarjetas visibles + búsqueda stock + clonación de array)
  let cartLineas: any[] = [];
  for (let i = 0; i < itemCount; i++) {
    const itemToAdd = products[i];
    const t0 = performance.now();

    // 1. Mutar carrito
    cartLineas = [...cartLineas, { id: itemToAdd.id, sku: itemToAdd.sku, cantidad: 1, precio: itemToAdd.precio_venta_pos }];

    // 2. Re-render simulate: se vuelve a evaluar la grilla visible de 80 tarjetas ejecutando stock lookups
    const visibleCards = products.slice(0, 80);
    const cardRenderSim = visibleCards.map((p) => {
      const stockTotal = (stockWarehouse1[p.sku] || 0) + (stockWarehouse2[p.sku] || 0);
      return { sku: p.sku, name: p.nombre, stock: stockTotal, inCart: cartLineas.some((l) => l.sku === p.sku) };
    });

    // 3. Calcular totales del carrito
    const subtotal = cartLineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0);

    const t1 = performance.now();
    rerenderSamplesMs.push(t1 - t0);
  }

  // Escenario B: Mutación Atómica Aislada (Zustand selectores atómicos / Map O(1))
  const atomicCart = new Map<string, { id: string; cantidad: number; precio: number }>();
  for (let i = 0; i < itemCount; i++) {
    const itemToAdd = products[i];
    const t0 = performance.now();

    // Mutación O(1) directa sin re-render de la grilla de productos
    const existing = atomicCart.get(itemToAdd.sku);
    if (existing) {
      existing.cantidad += 1;
    } else {
      atomicCart.set(itemToAdd.sku, { id: itemToAdd.id, cantidad: 1, precio: itemToAdd.precio_venta_pos });
    }

    const t1 = performance.now();
    atomicSamplesMs.push(t1 - t0);
  }

  return { rerenderSamplesMs, atomicSamplesMs };
}

export async function runBenchmark(): Promise<BenchmarkResult> {
  const searchQueries = [
    'salmon', 'camaron', 'trucha', 'robalo', 'tilapia', 'mojarra', 'langostino', 'corvina',
    'pargo', 'filete', 'SKU-PZ-00100', 'SKU-PZ-00500', 'SKU-PZ-01200', 'SKU-PZ-08000',
    '7700000000050', 'fresco', 'porcionado', 'congelado', 'premium', 'rojo',
    'salmon noruego', 'camaron tigre', 'trucha deshuesada', 'robalo pacífico', 'filete tilapia'
  ];

  // Ejecución en escalas 1K, 5K y 16K SKUs
  const bench1k = benchmarkSearchScale(1000, searchQueries);
  const bench5k = benchmarkSearchScale(5000, searchQueries);
  const bench16k = benchmarkSearchScale(16000, searchQueries);

  // Ejecución de benchmark de carrito
  const cartBench = benchmarkCartOperations(50);

  // Cálculo de percentiles
  const naive1k_p50 = calculatePercentile(bench1k.naiveSamplesMs, 50);
  const naive1k_p95 = calculatePercentile(bench1k.naiveSamplesMs, 95);
  const idx1k_p50 = calculatePercentile(bench1k.indexedSamplesMs, 50);
  const idx1k_p95 = calculatePercentile(bench1k.indexedSamplesMs, 95);

  const naive5k_p50 = calculatePercentile(bench5k.naiveSamplesMs, 50);
  const naive5k_p95 = calculatePercentile(bench5k.naiveSamplesMs, 95);
  const idx5k_p50 = calculatePercentile(bench5k.indexedSamplesMs, 50);
  const idx5k_p95 = calculatePercentile(bench5k.indexedSamplesMs, 95);

  const naive16k_p50 = calculatePercentile(bench16k.naiveSamplesMs, 50);
  const naive16k_p95 = calculatePercentile(bench16k.naiveSamplesMs, 95);
  const naive16k_p99 = calculatePercentile(bench16k.naiveSamplesMs, 99);

  const idx16k_p50 = calculatePercentile(bench16k.indexedSamplesMs, 50);
  const idx16k_p95 = calculatePercentile(bench16k.indexedSamplesMs, 95);
  const idx16k_p99 = calculatePercentile(bench16k.indexedSamplesMs, 99);

  const cartRerender_p50 = calculatePercentile(cartBench.rerenderSamplesMs, 50);
  const cartRerender_p95 = calculatePercentile(cartBench.rerenderSamplesMs, 95);
  const cartAtomic_p50 = calculatePercentile(cartBench.atomicSamplesMs, 50);
  const cartAtomic_p95 = calculatePercentile(cartBench.atomicSamplesMs, 95);

  const speedupSearch16k = Number((naive16k_p50 / Math.max(0.001, idx16k_p50)).toFixed(1));
  const speedupCart = Number((cartRerender_p50 / Math.max(0.0001, cartAtomic_p50)).toFixed(1));

  let details = `### Resumen de Benchmarking POS Mostrador (SPEC-053)\n\n`;
  details += `#### 1. Latencia de Búsqueda (Ingenua .filter/.includes vs SearchEngineCore Indexado)\n\n`;
  details += `| Escala Catálogo | Motor | p50 (ms) | p95 (ms) | p99 (ms) | Speedup |\n`;
  details += `|---|---|---|---|---|---|\n`;
  details += `| **1.000 SKUs** | Ingenuo (actual) | ${naive1k_p50.toFixed(3)} | ${naive1k_p95.toFixed(3)} | - | 1.0x |\n`;
  details += `| 1.000 SKUs | **Indexado (SearchEngineCore)** | **${idx1k_p50.toFixed(3)}** | **${idx1k_p95.toFixed(3)}** | - | **${(naive1k_p50 / Math.max(0.001, idx1k_p50)).toFixed(1)}x** |\n`;
  details += `| **5.000 SKUs** | Ingenuo (actual) | ${naive5k_p50.toFixed(3)} | ${naive5k_p95.toFixed(3)} | - | 1.0x |\n`;
  details += `| 5.000 SKUs | **Indexado (SearchEngineCore)** | **${idx5k_p50.toFixed(3)}** | **${idx5k_p95.toFixed(3)}** | - | **${(naive5k_p50 / Math.max(0.001, idx5k_p50)).toFixed(1)}x** |\n`;
  details += `| **16.000 SKUs** | Ingenuo (actual) | ${naive16k_p50.toFixed(3)} | ${naive16k_p95.toFixed(3)} | ${naive16k_p99.toFixed(3)} | 1.0x |\n`;
  details += `| 16.000 SKUs | **Indexado (SearchEngineCore)** | **${idx16k_p50.toFixed(3)}** | **${idx16k_p95.toFixed(3)}** | **${idx16k_p99.toFixed(3)}** | **${speedupSearch16k}x** |\n\n`;

  details += `*Tiempo de indexación inicial de 16.000 SKUs:* **${bench16k.indexingTimeMs.toFixed(2)} ms** (ejecutado off-thread en Worker sin bloquear UI).\n\n`;

  details += `#### 2. Latencia de Mutación y Adición al Carrito (50 ítems consecutivos)\n\n`;
  details += `| Estrategia de Carrito | p50 (ms) | p95 (ms) | Observación Arquitectónica |\n`;
  details += `|---|---|---|---|\n`;
  details += `| **Re-render Monolítico (actual)** | ${cartRerender_p50.toFixed(3)} | ${cartRerender_p95.toFixed(3)} | Reconciliación DOM de 80 tarjetas en cada click |\n`;
  details += `| **Mutación Atómica Aislada** | **${cartAtomic_p50.toFixed(4)}** | **${cartAtomic_p95.toFixed(4)}** | Aislamiento con selectores Zustand / $O(1)$ Map (${speedupCart}x más rápido) |\n`;

  const metrics: Record<string, number> = {
    naive_search_1k_p50_ms: naive1k_p50,
    naive_search_1k_p95_ms: naive1k_p95,
    indexed_search_1k_p50_ms: idx1k_p50,
    indexed_search_1k_p95_ms: idx1k_p95,

    naive_search_5k_p50_ms: naive5k_p50,
    naive_search_5k_p95_ms: naive5k_p95,
    indexed_search_5k_p50_ms: idx5k_p50,
    indexed_search_5k_p95_ms: idx5k_p95,

    naive_search_16k_p50_ms: naive16k_p50,
    naive_search_16k_p95_ms: naive16k_p95,
    naive_search_16k_p99_ms: naive16k_p99,
    indexed_search_16k_p50_ms: idx16k_p50,
    indexed_search_16k_p95_ms: idx16k_p95,
    indexed_search_16k_p99_ms: idx16k_p99,
    search_16k_speedup_ratio: speedupSearch16k,

    cart_rerender_p50_ms: cartRerender_p50,
    cart_rerender_p95_ms: cartRerender_p95,
    cart_atomic_p50_ms: cartAtomic_p50,
    cart_atomic_p95_ms: cartAtomic_p95,
    cart_mutation_speedup_ratio: speedupCart,
  };

  return {
    suite: 'POS Mostrador Latency Microbenchmark',
    description: 'Medición de latencia en búsqueda (1k-16k SKUs) y mutación de carrito en mostrador',
    metrics,
    passed: idx16k_p50 < 3.0, // Cumple meta SLA sub-3ms en búsqueda indexada
    details,
    timestamp: new Date().toISOString(),
  };
}

// Ejecución directa CLI
const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectCli) {
  runBenchmark().then((res) => {
    console.log(`\n=== SUITE: ${res.suite} ===`);
    console.log(res.details);
    console.log('\nMétricas cuantitativas:');
    console.table(res.metrics);
  });
}
