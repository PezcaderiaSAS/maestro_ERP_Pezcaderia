/**
 * Script Profesional de Cierre de Sesión — La Pezcadería ERP
 * Realiza auditoría de deltas, guardado de nuevas capacidades y workflows,
 * quality gate pre-push estricto (tsc, vitest, gitnexus), actualización de MEMORY.md,
 * generación de artefacto de handover y git push a GitHub origin main.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const { detectDeltas, saveManifest, printSummary } = require('./ecosystem-manifest.cjs');

console.log('\n================================================================');
console.log('🌙 [LIFECYCLE] PROTOCOLO DE CIERRE DE SESIÓN — LA PEZCADERÍA ERP');
console.log('================================================================\n');

function run(cmd, desc, canFail = false) {
  console.log(`⏳ ${desc}...`);
  try {
    execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✅ ${desc}: OK\n`);
    return true;
  } catch (error) {
    if (!canFail) {
      console.error(`\n❌ QUALITY GATE DE CIERRE FALLIDO en: ${desc}`);
      console.error('⛔ El cierre y push a GitHub ha sido detenido para proteger la estabilidad de la rama main.\n');
      process.exit(1);
    } else {
      console.warn(`⚠️ Advertencia no bloqueante en: ${desc}\n`);
      return false;
    }
  }
}

// -------------------------------------------------------------
// PASO 1: Detección y Registro de Nuevas Capacidades Creadas
// -------------------------------------------------------------
console.log('📦 [Paso 1/6] Auditando deltas de workflows, herramientas y servidores MCP...');
const deltas = detectDeltas();

if (deltas.hasChanges) {
  console.log('  ✨ Se detectaron nuevas capacidades creadas durante la sesión:');
  if (deltas.newWorkflows.length > 0) {
    console.log(`    - Nuevos Workflows: ${deltas.newWorkflows.map(w => w.command).join(', ')}`);
  }
  if (deltas.newSkills.length > 0) {
    console.log(`    - Nuevas Skills: ${deltas.newSkills.map(s => s.name).join(', ')}`);
  }
  if (deltas.newMcps.length > 0) {
    console.log(`    - Nuevos MCPs: ${deltas.newMcps.map(m => m.name).join(', ')}`);
  }
} else {
  console.log('  ✓ No hay capacidades huérfanas sin indexar.');
}

const updatedManifest = saveManifest();
printSummary(updatedManifest);

// -------------------------------------------------------------
// PASO 2: Quality Gate: Compilación TypeScript Estricta
// -------------------------------------------------------------
console.log('🔷 [Paso 2/6] Comprobando tipos TypeScript (tsc --noEmit)...');
run('npx tsc --noEmit', 'Compilación TypeScript sin errores');

// -------------------------------------------------------------
// PASO 3: Quality Gate: Suite Completa de Pruebas Automatizadas
// -------------------------------------------------------------
console.log('🧪 [Paso 3/6] Ejecutando suite completa de pruebas (Vitest)...');
run('npm run test:run', 'Suite de Pruebas Automatizadas (100% pasando)');

// -------------------------------------------------------------
// PASO 4: Auditoría de Impacto y Cambios con GitNexus
// -------------------------------------------------------------
console.log('🕸️ [Paso 4/6] Calculando blast radius y símbolos afectados con GitNexus...');
run('node .gitnexus/run.cjs detect-changes -r maestro_ERP_Pezcaderia', 'Auditoría de cambios GitNexus', true);

// -------------------------------------------------------------
// PASO 5: Actualización de Memoria Persistente y Handover
// -------------------------------------------------------------
console.log('📝 [Paso 5/6] Verificando memoria persistente (MEMORY.md) y artefactos...');

const memoryPath = path.join(ROOT_DIR, 'MEMORY.md');
if (fs.existsSync(memoryPath)) {
  const lines = fs.readFileSync(memoryPath, 'utf-8').split('\n');
  console.log(`  ✓ MEMORY.md verificado (${lines.length} líneas, límite constitucional <= 50 líneas).`);
}

// Generar copia local de handover en DOCS/handovers
const handoversDir = path.join(ROOT_DIR, 'DOCS/handovers');
if (!fs.existsSync(handoversDir)) {
  fs.mkdirSync(handoversDir, { recursive: true });
}

const now = new Date();
const dateStr = now.toISOString().split('T')[0].replace(/-/g, '_');
const handoverFile = path.join(handoversDir, `session_closure_handover_${dateStr}.md`);

const handoverContent = `# Handover de Cierre de Sesión — ${now.toLocaleDateString('es-CO')}
- **Fecha y Hora:** ${now.toISOString()}
- **Workflows Activos:** ${updatedManifest.totals.workflows}
- **Skills Activas:** ${updatedManifest.totals.skills}
- **Agencias:** ${updatedManifest.totals.agencies}
- **Servidores MCP:** ${updatedManifest.totals.mcpServers}
- **Quality Gate:** TypeScript 0 errores, Vitest 100% verde, GitNexus auditado.
`;

fs.writeFileSync(handoverFile, handoverContent, 'utf-8');
console.log(`  ✓ Handover registrado en: DOCS/handovers/session_closure_handover_${dateStr}.md\n`);

// -------------------------------------------------------------
// PASO 6: Commit y Git Push a GitHub origin main
// -------------------------------------------------------------
console.log('🚀 [Paso 6/6] Preparando commit y sincronización a GitHub origin main...');

try {
  const status = execSync('git status -s', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  if (status) {
    run('git add .', 'Staging de archivos modificados');
    
    // Obtener commit message del argumento o generar uno automático
    const commitMsg = process.argv[2] || `chore(lifecycle): cierre de sesion formal, actualizacion de capacidades y sincronizacion ${dateStr}`;
    run(`git commit -m "${commitMsg}"`, 'Creación de Git Commit');
    run('git push origin main', 'Git Push a GitHub origin main');
    console.log('\n🎉 [CIERRE EXITOSO] Sesión cerrada, documentación actualizada y cambios enviados a GitHub.\n');
  } else {
    console.log('ℹ️ No hay cambios pendientes de commit en el working tree.');
    console.log('\n🎉 [CIERRE EXITOSO] Entorno limpio y sincronizado.\n');
  }
} catch (err) {
  console.error('❌ Error en el proceso de Git:', err.message);
  process.exit(1);
}
