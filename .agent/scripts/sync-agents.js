const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de rutas relativas al directorio raíz del proyecto
const ROOT_DIR = path.resolve(__dirname, '../../');
const SKILLS_DIR = path.join(ROOT_DIR, '.agents/skills');
const WORKFLOWS_DIR = path.join(ROOT_DIR, '.agent/workflows');

// Orquestadores principales (INMUTABLES)
const PROTECTED_SKILLS = [
  'ai_agents/agency-swarm-orchestrator'
];
const PROTECTED_WORKFLOWS = [
  'swarm.md',
  'orch-build-mvp.md'
];

const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}⚡ [ECC Sync] Iniciando unificación de Skills y Workflows...${RESET}`);

// 1. Verificación de Integridad de Orquestadores Críticos
function checkProtectedAssets() {
  console.log('🔍 Verificando orquestadores críticos...');
  
  let allIntact = true;
  
  // Validar Skills Protegidas
  PROTECTED_SKILLS.forEach(skill => {
    const fullPath = path.join(SKILLS_DIR, skill);
    if (!fs.existsSync(fullPath)) {
      console.error(`${RED}❌ ALERTA CRÍTICA: La skill protegida '${skill}' no se encontró.${RESET}`);
      allIntact = false;
    }
  });

  // Validar Workflows Protegidos
  PROTECTED_WORKFLOWS.forEach(wf => {
    const fullPath = path.join(WORKFLOWS_DIR, wf);
    if (!fs.existsSync(fullPath)) {
      console.error(`${RED}❌ ALERTA CRÍTICA: El workflow protegido '${wf}' no se encontró.${RESET}`);
      allIntact = false;
    }
  });

  if (!allIntact) {
    console.error(`${RED}⚠️  Abortando sincronización. Se requiere intervención manual (git checkout).${RESET}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}✅ Orquestadores principales intactos y protegidos.${RESET}`);
  }
}

// 2. Limpieza de archivos huérfanos (Tracked in git)
// Eliminaremos cualquier archivo en las carpetas de agentes que GIT considere como 'untracked' (creado por un desarrollador, pero no pusheado al canónico)
// O alertar sobre archivos eliminados que sí están en el índice.
function cleanOrphanedFiles() {
  try {
    console.log('🧹 Limpiando archivos locales no unificados...');
    // Obtenemos los archivos untracked y modificados dentro de los directorios de agentes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    const lines = status.split('\n').filter(Boolean);
    let orphansRemoved = 0;

    lines.forEach(line => {
      const state = line.substring(0, 2);
      const filePath = line.substring(3).trim();

      // Si el archivo es untracked (??) y pertenece a las carpetas de ECC
      if (state === '??' && (filePath.startsWith('.agents/skills') || filePath.startsWith('.agent/workflows'))) {
        const fullPath = path.join(ROOT_DIR, filePath);
        if (fs.existsSync(fullPath)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`   🗑️ Eliminado huérfano local: ${filePath}`);
          orphansRemoved++;
        }
      }
    });

    if (orphansRemoved === 0) {
      console.log('✨ No se encontraron archivos huérfanos.');
    }
  } catch (error) {
    console.error(`${YELLOW}⚠️ No se pudo ejecutar git status. Ignorando limpieza de huérfanos.${RESET}`);
  }
}

// Ejecución
checkProtectedAssets();
cleanOrphanedFiles();

console.log(`${GREEN}✅ Sincronización ECC completada con éxito. Listo para operar.${RESET}`);
