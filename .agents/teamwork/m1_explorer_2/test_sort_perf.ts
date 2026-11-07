// Testing the sorting bottleneck: localeCompare vs binary string comparison
const names = Array.from({ length: 1250 }, (_, i) => `SALMON CHILENO FILETE ${i}`);
const items = names.map((nombre, i) => ({ item: { nombre }, score: 30 }));

const t0 = performance.now();
const s1 = [...items].sort((a, b) => b.score - a.score || a.item.nombre.localeCompare(b.item.nombre));
const durLocale = performance.now() - t0;

const t1 = performance.now();
const s2 = [...items].sort((a, b) => b.score - a.score || (a.item.nombre < b.item.nombre ? -1 : 1));
const durBinary = performance.now() - t1;

console.log(`localeCompare on 1250 items: ${durLocale.toFixed(2)} ms`);
console.log(`Binary string compare on 1250 items: ${durBinary.toFixed(2)} ms`);
console.log(`Speedup factor: ${(durLocale / durBinary).toFixed(1)}x`);
