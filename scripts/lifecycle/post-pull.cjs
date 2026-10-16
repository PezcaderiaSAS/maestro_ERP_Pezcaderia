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

// 1. Verificación de Variables de Entorno y Conexiones Reales
console.log('🔍 [1/7] Verificando variables de entorno y conectividad real...');
run('node scripts/lifecycle/verify-env-connections.cjs', 'Verificación de Entorno y Conexiones Reales');

// 2. Actualización de Grafo de Conocimiento (Graphify)
console.log('📊 [2/7] Sincronizando grafo estructural con Graphify...');
run('graphify update .', 'Actualización de Graphify', true);

// 3. Verificación de Índice de Símbolos AST (GitNexus)
console.log('🕸️ [3/7] Verificando índice AST con GitNexus...');
run('node .gitnexus/run.cjs status', 'Comprobación de Índice GitNexus', true);

// 4. Verificación de Tipos TypeScript
console.log('🔷 [4/7] Verificando compilación TypeScript (tsc --noEmit)...');
run('npx --no-install tsc --noEmit', 'Verificación TypeScript', true);

// 5. Auditoría de Diagramas de Ingeniería Obligatorios (Mermaid.js)
console.log('📐 [5/7] Verificando 5 Diagramas de Ingeniería Obligatorios (Mermaid.js)...');
run('node scripts/architecture/audit-diagrams-compliance.cjs', 'Auditoría de Diagramas Obligatorios', false);

// 6. Auditoría Master Architect (SOLID & Boundaries)
console.log('🏛️ [6/7] Ejecutando Auditoría Master Architect (SOLID & Boundaries)...');
run('node scripts/architecture/audit-solid-boundaries.cjs', 'Auditoría Master Architect', true);

// 7. Verificación de Servidor Vite (Puerto 3000)
console.log('🌐 [7/7] Comprobando disponibilidad del servidor en http://localhost:3000/...');
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
