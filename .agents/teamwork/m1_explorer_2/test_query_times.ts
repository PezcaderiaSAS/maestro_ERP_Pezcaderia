// Test realistic seafood with binary comparison in sort
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

// Create modified engine that overrides searchProducts sorting
class FastSortEngine extends SearchEngineCore {
  public searchProducts(query: string, options: any = {}): any[] {
    const orig = super.searchProducts(query, { ...options, limit: 10000 });
    // In our optimized implementation, sort will use binary string comparison:
    // b.score - a.score || (a.item.nombre < b.item.nombre ? -1 : 1)
    return orig.slice(0, options.limit || 80);
  }
}

const engine = new SearchEngineCore();
engine.indexProducts(products);

// Direct benchmark of candidate query times
const testQueries = ['SALMON', 'TRUCHA ARCOIRIS', 'samon chileno', 'truca arcoiris', '7709990000042'];

for (const q of testQueries) {
  const t0 = performance.now();
  const res = engine.searchProducts(q, { limit: 80 });
  const t = performance.now() - t0;
  console.log(`Query "${q}": ${t.toFixed(2)} ms`);
}
