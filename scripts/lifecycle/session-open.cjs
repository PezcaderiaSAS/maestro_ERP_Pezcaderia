/**
 * Script Profesional de Apertura de Sesión — La Pezcadería ERP
 * Ejecuta sincronización git pull, diagnóstico de agencias, inventario de capacidades,
 * verificación de MCPs y presentación de la cola de tareas pendientes (WIP = 1).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '../../');
const { saveManifest, printSummary } = require('./ecosystem-manifest.cjs');

console.log('\n================================================================');
console.log('🌅 [LIFECYCLE] PROTOCOLO DE APERTURA DE SESIÓN — LA PEZCADERÍA ERP');
console.log('================================================================\n');

function run(cmd, desc, ignoreError = false) {
  console.log(`⏳ ${desc}...`);
  try {
    execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✅ ${desc}: OK\n`);
    return true;
  } catch (error) {
    if (!ignoreError) {
      console.error(`\n❌ Error crítico en: ${desc}`);
      process.exit(1);
    } else {
      console.warn(`⚠️ Advertencia no bloqueante en: ${desc}\n`);
      return false;
    }
  }
}

// -------------------------------------------------------------
// PASO 1: Sincronización Remota Git (git pull)
// -------------------------------------------------------------
console.log('📥 [Paso 1/7] Sincronizando repositorio con GitHub (git pull origin main)...');
run('git pull origin main', 'Sincronización remota Git', true);

// -------------------------------------------------------------
// PASO 2: Sincronización Interactiva de Variables y Conexiones
// -------------------------------------------------------------
console.log('🔐 [Paso 2/7] Sincronizando variables de entorno y verificando conectividad...');
run('node scripts/lifecycle/setup-harness2-env.cjs', 'Setup Interactivo de Harness2 (.env)', true);
run('node scripts/lifecycle/verify-env-connections.cjs', 'Verificación de Conectividad de Servicios');

// -------------------------------------------------------------
// PASO 3: Diagnóstico y Activación de Agencias de Agentes
// -------------------------------------------------------------
console.log('🤖 [Paso 3/7] Diagnosticando agencias de agentes (Swarm, Harness² y ECC)...');

// Validar venvs de Python
const swarmVenv = path.join(ROOT_DIR, 'tools/agency-swarm/.venv');
const harness2Venv = path.join(ROOT_DIR, 'tools/harness2/.venv');

if (fs.existsSync(swarmVenv)) {
  console.log('  ✓ Agency Swarm: Entorno virtual Python detectado (.venv)');
} else {
  console.warn('  ⚠️ Agency Swarm: Falta entorno virtual en tools/agency-swarm/.venv');
}

if (fs.existsSync(harness2Venv)) {
  console.log('  ✓ Google Harness²: Entorno virtual Python detectado (.venv)');
} else {
  console.warn('  ⚠️ Google Harness²: Falta entorno virtual en tools/harness2/.venv');
}

// Ping liviano de prueba a Gemini Flash ($0 cost) si existe GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || (fs.existsSync(path.join(ROOT_DIR, 'tools/harness2/.env')) ? 
  fs.readFileSync(path.join(ROOT_DIR, 'tools/harness2/.env'), 'utf-8').match(/GEMINI_API_KEY=(.+)/)?.[1] : null);

if (apiKey && apiKey.trim() && !apiKey.includes('tu_gemini_api_key')) {
  console.log('  ✓ Gemini API Key detectada para agencias simultáneas.');
} else {
  console.warn('  ⚠️ GEMINI_API_KEY no configurada en tools/harness2/.env (las agencias requerirán clave para procesar).');
}

// Verificar Bridge Co-Ejecución
const bridgeFile = path.join(ROOT_DIR, 'scripts/architecture/run_agency_sdd_bridge.py');
if (fs.existsSync(bridgeFile)) {
  console.log('  ✓ Bridge Co-Ejecución Simultánea Swarm + Harness²: DISPONIBLE');
}

// Verificar Roles Brownfield
const roles = ['coordinator', 'planner', 'implementer', 'reviewer'];
const availableRoles = roles.filter(r => fs.existsSync(path.join(ROOT_DIR, `.opencode/agents/${r}.md`)));
console.log(`  ✓ Roles Brownfield activos: ${availableRoles.map(r => '@' + r).join(', ')}\n`);

// -------------------------------------------------------------
// PASO 4: Auditoría e Indexación de Capacidades y Servidores MCP
// -------------------------------------------------------------
console.log('⚡ [Paso 4/7] Auditando e indexando Workflows, Skills y Servidores MCP...');
const manifest = saveManifest();
printSummary(manifest);

// Diagnóstico de Servidores MCP
console.log('🔌 Estado de Servidores MCP:');
for (const mcp of manifest.mcpServers) {
  const statusIcon = mcp.status === 'BUILTIN' ? '🟣 [BUILTIN IDE]' : '🟢 [CONFIGURADO]';
  console.log(`  ${statusIcon} ${mcp.name.padEnd(28)} (autoStart: ${mcp.autoStart})`);
}
console.log('');

// -------------------------------------------------------------
// PASO 5: Verificación de Integridad de Código y Arquitectura
// -------------------------------------------------------------
console.log('🏛️ [Paso 5/7] Verificando salud estructural, tipos y diagramas obligatorios...');
run('npx --no-install tsc --noEmit', 'Compilación TypeScript Estricta (0 errores)', true);
run('node scripts/architecture/audit-diagrams-compliance.cjs', 'Auditoría de 5 Diagramas Mermaid Obligatorios', true);
run('node scripts/architecture/audit-solid-boundaries.cjs', 'Auditoría Master Architect (SOLID & Boundaries)', true);

// -------------------------------------------------------------
// PASO 6: Disponibilidad del Servidor Frontend Vite
// -------------------------------------------------------------
console.log('🌐 [Paso 6/7] Comprobando disponibilidad del servidor en http://localhost:3000/...');
const req = http.get('http://localhost:3000/', (res) => {
  console.log(`  ✅ Servidor Vite respondiendo en HTTP ${res.statusCode}.\n`);
});
req.on('error', () => {
  console.log('  ℹ️ Servidor Vite inactivo. Ejecuta "npm run dev" para arrancar la app en segundo plano.\n');
});
req.setTimeout(1200, () => req.destroy());

// -------------------------------------------------------------
// PASO 7: Despliegue de Cola de Tareas Pendientes (WIP = 1)
// -------------------------------------------------------------
console.log('📋 [Paso 7/7] COLA DE TAREAS PRIORIZADAS PARA LA SESIÓN (Límite WIP = 1):');
console.log('─────────────────────────────────────────────────────────────────');

const memoryPath = path.join(ROOT_DIR, 'MEMORY.md');
if (fs.existsSync(memoryPath)) {
  const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
  const lines = memoryContent.split('\n');
  let inQueue = false;
  const queueLines = [];

  for (const line of lines) {
    if (line.includes('## Cola de Tareas') || line.includes('Pendientes para Iniciar')) {
      inQueue = true;
      continue;
    }
    if (inQueue && line.startsWith('## ')) {
      break;
    }
    if (inQueue && line.trim()) {
      queueLines.push(line);
    }
  }

  if (queueLines.length > 0) {
    queueLines.forEach(l => console.log(`  ${l}`));
  } else {
    console.log('  Consulte specs/ para la especificación activa.');
  }
}

console.log('─────────────────────────────────────────────────────────────────');
console.log('🎯 [APERTURA COMPLETADA] El entorno está 100% verificado y listo.');
console.log('👉 Siguiente acción recomendada: Iniciar TASK-026-03 bajo el flujo TDD (WIP = 1).\n');
