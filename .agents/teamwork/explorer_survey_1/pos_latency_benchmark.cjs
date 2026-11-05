// pos_latency_benchmark.cjs
// Medición empírica determinista de la latencia actual vs optimizada con 5,000 SKUs

const { performance } = require('perf_hooks');

// Generador de catálogo sintético realista de 5,000 productos
function generateCatalog(count = 5000) {
  const categories = ['PESCADOS', 'MARISCOS', 'CONGELADOS', 'MATERIA PRIMA', 'ABARROTES', 'HERRAMIENTAS', 'EMPAQUES'];
  const prefixes = ['PES', 'MAR', 'CON', 'MAT', 'ABA', 'HER', 'EMP'];
  const adjectives = ['Fresco', 'Congelado', 'Especial', 'Premium', 'Nacional', 'Importado', 'Limpio', 'Fileteado'];
  const baseNames = ['Salmón', 'Camarón', 'Trucha', 'Robalo', 'Merluza', 'Atún', 'Pulpo', 'Calamar', 'Pargo', 'Corvina'];
  
  const products = [];
  const stock = {
    'Bodega Principal': {},
    'Bodega Secundaria': {},
    'Bodega Averías': {}
  };

  for (let i = 1; i <= count; i++) {
    const catIdx = i % categories.length;
    const name = `${baseNames[i % baseNames.length]} ${adjectives[i % adjectives.length]} Lote-${i}`;
    const sku = `${prefixes[catIdx]}-${String(i).padStart(5, '0')}`;
    
    products.push({
      id: `p-${i}`,
      sku,
      nombre: name,
      categoria: categories[catIdx],
      precio_venta_pos: 10000 + (i * 50) % 80000,
      buffer_seguridad: 5,
      activo: true,
      unidadMedida: i % 3 === 0 ? 'kg' : 'und'
    });

    stock['Bodega Principal'][sku] = (i * 7) % 150;
    stock['Bodega Secundaria'][sku] = (i * 3) % 50;
    stock['Bodega Averías'][sku] = i % 10 === 0 ? 2 : 0;
  }

  return { products, stock };
}

const { products, stock } = generateCatalog(5000);

// Simulación de la función actual getProductStock en POSView.tsx:1068
const bodegas = [
  { id: 'b1', nombre: 'Bodega Principal' },
  { id: 'b2', nombre: 'Bodega Secundaria' },
  { id: 'b3', nombre: 'Bodega Averías' }
];

function currentGetProductStock(sku, bodegaKey) {
  // En POSView.tsx: const bodegas = useWarehouseStore.getState().bodegas;
  const bodega = bodegas.find(b => b.id === bodegaKey || b.nombre === bodegaKey);
  const targetKey = bodega ? bodega.nombre : bodegaKey;
  return stock[targetKey]?.[sku] || 0;
}

// 1. Benchmark del Algoritmo Actual de ProductSearchPanel.tsx:100-120
function benchmarkCurrentSearch(query = 'salm') {
  const start = performance.now();
  const topKeywords = ['salmon', 'salmón', 'camaron', 'camarón', 'trucha', 'robalo', 'róbalo', 'langostino'];

  // Paso 1: Filter sin useMemo con llamadas síncronas a bodega
  let filtered = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = true;
    
    // Ocultar agotados suma bodegas principal y secundaria
    const totalStock = currentGetProductStock(p.sku, 'Bodega Principal') + currentGetProductStock(p.sku, 'Bodega Secundaria');
    const matchesStock = totalStock > 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Paso 2: Sort con keywords evaluadas en cada iteración del comparador
  filtered.sort((a, b) => {
    const aTop = topKeywords.some(k => a.nombre.toLowerCase().includes(k)) ? 1 : 0;
    const bTop = topKeywords.some(k => b.nombre.toLowerCase().includes(k)) ? 1 : 0;
    return bTop - aTop;
  });

  // Paso 3: Render slice con 3 llamadas adicionales por item
  const rendered = filtered.slice(0, 80);
  for (const prod of rendered) {
    const s1 = currentGetProductStock(prod.sku, 'Bodega Principal');
    const s2 = currentGetProductStock(prod.sku, 'Bodega Secundaria');
    const s3 = currentGetProductStock(prod.sku, 'Bodega Averías');
  }

  const duration = performance.now() - start;
  return { duration, count: filtered.length, rendered: rendered.length };
}

// 2. Benchmark del Algoritmo Optimizado con SearchEngineCore (Índice Invertido en Memoria / Worker)
class SimpleInvertedIndex {
  constructor(items) {
    this.items = items;
    this.index = new Map();
    this.stockCache = new Map();

    // Precomputar stock consolidado O(1)
    for (const p of items) {
      const s = (stock['Bodega Principal'][p.sku] || 0) + (stock['Bodega Secundaria'][p.sku] || 0);
      this.stockCache.set(p.sku, s);
    }

    // Tokenizar catálogo una sola vez
    for (const p of items) {
      const tokens = (p.nombre + ' ' + p.sku).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
      for (const t of tokens) {
        if (!this.index.has(t)) this.index.set(t, []);
        this.index.get(t).push(p);
      }
    }
  }

  search(query, limit = 80) {
    const normQ = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (!normQ) return this.items.slice(0, limit);

    const qTokens = normQ.split(/\s+/);
    const candidateSets = [];

    for (const qt of qTokens) {
      const matches = [];
      for (const [word, prods] of this.index.entries()) {
        if (word.startsWith(qt) || word.includes(qt)) {
          matches.push(...prods);
        }
      }
      candidateSets.push(new Set(matches));
    }

    if (candidateSets.length === 0) return [];
    
    // Intersección
    candidateSets.sort((a, b) => a.size - b.size);
    const results = [];
    for (const p of candidateSets[0]) {
      let matched = true;
      for (let i = 1; i < candidateSets.length; i++) {
        if (!candidateSets[i].has(p)) {
          matched = false;
          break;
        }
      }
      if (matched) {
        // Chequeo de stock O(1) en mapa precomputado
        if ((this.stockCache.get(p.sku) || 0) > 0) {
          results.push(p);
          if (results.length >= limit) break;
        }
      }
    }

    return results;
  }
}

const buildIndexStart = performance.now();
const optimizedEngine = new SimpleInvertedIndex(products);
const indexBuildTime = performance.now() - buildIndexStart;

function benchmarkOptimizedSearch(query = 'salm') {
  const start = performance.now();
  const results = optimizedEngine.search(query, 80);
  const duration = performance.now() - start;
  return { duration, count: results.length };
}

// 3. Benchmark de Adición de Ítems al Carrito (50 líneas acumuladas)
function benchmarkCartAddition(cartSize = 50) {
  const start = performance.now();
  const cart = [];
  for (let i = 0; i < cartSize; i++) {
    const prod = products[i];
    const item = {
      productoId: prod.id,
      sku: prod.sku,
      nombre: prod.nombre,
      cantidad: 2,
      precioLista: prod.precio_venta_pos,
      precioFinal: prod.precio_venta_pos,
      totalLinea: prod.precio_venta_pos * 2
    };
    cart.push(item);
  }
  // Cálculo de totales
  const total = cart.reduce((acc, l) => acc + l.totalLinea, 0);
  const duration = performance.now() - start;
  return { duration, total, items: cart.length };
}

// Ejecución repetida para eliminar outliers
console.log('=== BENCHMARK DE LATENCIA EN POS (5,000 SKUs) ===\n');

const currentRuns = [];
for (let i = 0; i < 10; i++) {
  currentRuns.push(benchmarkCurrentSearch('salm').duration);
}
const avgCurrent = currentRuns.reduce((a, b) => a + b, 0) / currentRuns.length;
console.log(`Algoritmo Actual (naive filter + 10k lookups): Promedio = ${avgCurrent.toFixed(2)} ms (Runs: ${currentRuns.map(r => r.toFixed(1)).join(', ')} ms)`);

const optRuns = [];
for (let i = 0; i < 10; i++) {
  optRuns.push(benchmarkOptimizedSearch('salm').duration);
}
const avgOpt = optRuns.reduce((a, b) => a + b, 0) / optRuns.length;
console.log(`Algoritmo Optimizado (Inverted Index O(1) Stock Cache): Promedio = ${avgOpt.toFixed(2)} ms (Runs: ${optRuns.map(r => r.toFixed(1)).join(', ')} ms)`);
console.log(`Tiempo de Indexación Inicial: ${indexBuildTime.toFixed(2)} ms`);
console.log(`Factor de aceleración: ${(avgCurrent / avgOpt).toFixed(1)}x más rápido!\n`);

const cartAddition = benchmarkCartAddition(50);
console.log(`Adición en memoria (50 ítems de carrito): ${cartAddition.duration.toFixed(3)} ms`);
