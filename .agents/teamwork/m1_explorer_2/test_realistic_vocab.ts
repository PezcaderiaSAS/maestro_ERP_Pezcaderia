// Test with realistic seafood catalog vocabulary
import { SearchEngineCore } from '../../../src/workers/searchEngineCore';
import type { LocalIndexedDbProduct } from '../../../src/types/indexedDb.types';

const seafoodSpecies = [
  'SALMON CHILENO', 'TRUCHA ARCOIRIS', 'MOJARRA ROJA', 'TILAPIA NEGRA', 
  'CAMARON TITI', 'CAMARON TIGRE', 'ROBALO FILETE', 'CORVINA ENTERA',
  'ATUN ALETA AMARILLA', 'PULPO BABY', 'CALAMAR TUBO', 'LANGOSTINO U15',
  'MERLUZA AUSTRAL', 'PARGO ROJO', 'BAGRE DEL MAGDALENA', 'SIERRA FRESCA'
];

const cuts = ['FILETE CON PIEL', 'FILETE SIN PIEL', 'ENTERO EVISCERADO', 'PORCIONADO', 'DESVENADO', 'CONGELADO IQF', 'FRESCO DEPLAYA'];
const sizes = ['200G', '500G', '1KG', '1.5KG', 'CALIBRE 16/20', 'CALIBRE 21/25', 'GRANDE', 'MEDIANO'];

console.log('--- Generando 10,000 productos con vocabulario realista de pescadería ---');
const products: LocalIndexedDbProduct[] = Array.from({ length: 10000 }, (_, i) => {
  const species = seafoodSpecies[i % seafoodSpecies.length];
  const cut = cuts[i % cuts.length];
  const size = sizes[i % sizes.length];
  const isPareto = i < 100;

  return {
    sku: `PEZ-${species.slice(0, 3)}-${(i % 500).toString().padStart(4, '0')}`,
    tenantId: 'tenant-pezca-01',
    nombre: `${species} ${cut} ${size}`,
    codigoBarras: `770999${i.toString().padStart(7, '0')}`,
    categoria: species.includes('CAMARON') || species.includes('LANGOSTINO') || species.includes('PULPO') || species.includes('CALAMAR') ? 'MARISCOS' : 'PESCADOS',
    precioDetal: 28000 + (i % 50) * 1000,
    precioMayorista: 24000 + (i % 50) * 1000,
    precioRestaurante: 25000 + (i % 50) * 1000,
    cantidadMinimaMayorista: 5,
    stockDisponible: 50 + (i % 30),
    esParetoTop100: isPareto,
    activo: true,
    updatedAt: new Date().toISOString(),
  };
});

const engine = new SearchEngineCore();
const tIdx = performance.now();
engine.indexProducts(products);
console.log(`Indexación completada en: ${(performance.now() - tIdx).toFixed(2)} ms`);

// Test queries
const queries = [
  'SALMON',
  'TRUCHA ARCOIRIS',
  'CAMARON DESVENADO',
  'samon chileno', // typo
  'truca arcoiris', // typo
  'langostino 16/20',
  '7709990000042', // barcode
  'PEZ-SAL-0042' // sku
];

for (const q of queries) {
  const t0 = performance.now();
  const results = engine.searchProducts(q, { limit: 50 });
  const dur = performance.now() - t0;
  console.log(`Query "${q}": ${dur.toFixed(2)} ms | Results: ${results.length} | Top: ${results[0]?.item.nombre}`);
}
