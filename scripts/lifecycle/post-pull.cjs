/**
 * Script de Puesta en Marcha Automática (Post-Pull / Session Start)
 * Ejecutado automáticamente por .husky/post-merge o mediante `npm run session:pull`.
 */

const { execSync } = require('child_process');
const http = require('http');

console.log('\n======================================================');
console.log('🚀 [LIFECYCLE] Puesta en Marcha y Sincronización Post-Pull');
console.log('======================================================\n');

function run(cmd, desc, ignoreError = false) {
  console.log(`⏳ ${desc}...`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
    return true;
  } catch (error) {
    if (!ignoreError) {
      console.error(`❌ Falló: ${desc}`);
      process.exit(1);
    } else {
      console.warn(`⚠️ Advertencia no bloqueante en: ${desc}`);
      return false;
    }
  }
}

// 1. Actualización de Grafo de Conocimiento (Graphify)
console.log('📊 [1/4] Sincronizando grafo estructural con Graphify...');
run('graphify update .', 'Actualización de Graphify', true);

// 2. Actualización de Call-Graph e Índice de Símbolos (GitNexus)
console.log('🕸️ [2/4] Sincronizando índice AST con GitNexus...');
run('npx gitnexus analyze --index-only', 'Reindexación incremental de GitNexus', true);

// 3. Verificación de Tipos TypeScript
console.log('🔷 [3/5] Verificando compilación TypeScript (tsc --noEmit)...');
run('npx tsc --noEmit', 'Verificación TypeScript');

// 4. Auditoría Master Architect (SOLID & Boundaries)
console.log('🏛️ [4/5] Ejecutando Auditoría Master Architect (SOLID & Boundaries)...');
run('node scripts/architecture/audit-solid-boundaries.cjs', 'Auditoría Master Architect');

// 5. Verificación de Servidor Vite (Puerto 3000)
console.log('🌐 [5/5] Comprobando disponibilidad del servidor en http://localhost:3000/...');
const req = http.get('http://localhost:3000/', (res) => {
  console.log(`✅ Servidor Vite activo y respondiendo (HTTP ${res.statusCode}).`);
  console.log('\n🎉 [LIFECYCLE] Entorno 100% sincronizado y listo para trabajar.\n');
});

req.on('error', () => {
  console.log('ℹ️ Servidor Vite no está escuchando en el puerto 3000.');
  console.log('👉 Ejecuta "npm run dev" para iniciar la interfaz.');
  console.log('\n🎉 [LIFECYCLE] Entorno sincronizado.\n');
});
req.setTimeout(1500, () => {
  req.destroy();
});
