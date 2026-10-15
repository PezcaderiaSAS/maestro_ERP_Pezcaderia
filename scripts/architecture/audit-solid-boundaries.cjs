#!/usr/bin/env node
/**
 * ============================================================================
 * LA PEZCADERIA ERP — MASTER ARCHITECT AUDIT ENGINE (SOLID & BOUNDARIES)
 * ============================================================================
 * Auditor estático determinista y ultraligero (<1.5s) que valida:
 * 1. Aislamiento del Dominio (Hexagonal): src/types/ libre de infraestructura.
 * 2. Anti-Patrón Vista Gorda: src/views/ libre de clientes BD directos.
 * 3. Principio de Responsabilidad Única (SRP): Alerta ante archivos > 600 líneas.
 * 4. Type-Safety de Navegación: Prohibición de magic strings de rutas.
 * 
 * Política: MANDATORY_GLOBAL_ENFORCEMENT (SPEC-017)
 * Ejecutado en: post_git_pull (post-pull.cjs) y npm run audit:architecture
 */

const fs = require('fs');
const path = require('path');

// Colores ANSI para el Scorecard
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Configuración de límites y reglas
const ARCH_CONFIG = {
  srcDir: path.resolve(__dirname, '../../src'),
  maxUsefulLinesPerFile: 600,
  forbiddenDomainImports: [
    '@supabase/supabase-js',
    '@supabase/server',
    'axios',
    'prisma',
    'express',
  ],
  forbiddenViewDirectDataImports: [
    'getSupabaseClient',
  ],
};

/**
 * Escanea un directorio recursivamente recolectando rutas de archivos TS/TSX.
 */
function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '__mocks__'].includes(entry.name)) {
        continue;
      }
      getSourceFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Cuenta las líneas útiles de un archivo (descartando vacías y comentarios).
 */
function countUsefulLines(content) {
  const lines = content.split('\n');
  let count = 0;
  let inBlockComment = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }
    if (line.startsWith('//')) continue;
    count++;
  }

  return count;
}

/**
 * Regla 1: Aislamiento del Dominio (src/types/ libre de infraestructura).
 */
function checkDomainPurity(filePath, content, relativePath) {
  const violations = [];
  if (!relativePath.startsWith('types' + path.sep) && !relativePath.startsWith('types/')) {
    return violations;
  }

  for (const forbidden of ARCH_CONFIG.forbiddenDomainImports) {
    const importRegex = new RegExp(`from\\s+['"]${forbidden}['"]`, 'g');
    if (importRegex.test(content)) {
      violations.push({
        severity: 'CRITICAL',
        code: 'BOUND-01-DOMAIN-POLLUTION',
        rule: 'Aislamiento del Dominio',
        file: relativePath,
        message: `El Dominio Puro no debe depender de infraestructura. Encontrado: import '${forbidden}'`,
      });
    }
  }

  return violations;
}

/**
 * Regla 2: Prevención de Vistas Gordas (src/views/ no debe consultar BD directo).
 */
function checkViewSeparation(filePath, content, relativePath) {
  const violations = [];
  const isView = relativePath.startsWith('views' + path.sep) || relativePath.startsWith('views/');
  if (!isView || relativePath.includes('.test.')) {
    return violations;
  }

  for (const forbidden of ARCH_CONFIG.forbiddenViewDirectDataImports) {
    if (content.includes(forbidden)) {
      violations.push({
        severity: 'CRITICAL',
        code: 'ARCH-02-THICK-VIEW-CONTROLLER',
        rule: 'Anti-Patrón Controlador/Vista Gorda',
        file: relativePath,
        message: `La vista accede a infraestructura de datos directamente (${forbidden}). Debe delegar en un Store o Service.`,
      });
    }
  }

  return violations;
}

/**
 * Regla 3: Umbral de Responsabilidad Única (SRP).
 */
function checkSingleResponsibility(filePath, content, relativePath) {
  const violations = [];
  // Excluimos archivos generados o tests largos de mock
  if (relativePath.includes('.test.') || relativePath.includes('setup.ts')) {
    return violations;
  }

  const usefulLines = countUsefulLines(content);
  if (usefulLines > ARCH_CONFIG.maxUsefulLinesPerFile) {
    violations.push({
      severity: 'WARNING',
      code: 'SOLID-01-SRP-FILE-LENGTH',
      rule: 'Principio de Responsabilidad Única (SRP)',
      file: relativePath,
      message: `El archivo contiene ${usefulLines} líneas útiles (máximo sugerido: ${ARCH_CONFIG.maxUsefulLinesPerFile}). Se recomienda modularizar en submódulos o componentes atómicos.`,
      meta: { usefulLines, threshold: ARCH_CONFIG.maxUsefulLinesPerFile },
    });
  }

  return violations;
}

/**
 * Regla 4: Type-Safety de Rutas (Evitar magic strings de rutas).
 */
function checkRouteTypeSafety(filePath, content, relativePath) {
  const violations = [];
  // Verificamos si en src/views hay asignaciones de vista en string suelto
  const isView = relativePath.startsWith('views' + path.sep) || relativePath.startsWith('views/');
  if (!isView || relativePath.includes('.test.')) {
    return violations;
  }

  const magicStringRegex = /setCurrentView\(['"]([a-z_]+)['"]\)/g;
  let match;
  while ((match = magicStringRegex.exec(content)) !== null) {
    const rawVal = match[1];
    // Si no usa AppRouteId.ALGO
    violations.push({
      severity: 'WARNING',
      code: 'CLEAN-04-MAGIC-ROUTE-STRING',
      rule: 'Type-Safety de Navegación',
      file: relativePath,
      message: `Uso de magic string '${rawVal}' en navegación. Use el enum canónico 'AppRouteId' para garantizar tipado estricto.`,
    });
  }

  return violations;
}

/**
 * Ejecuta la auditoría completa sobre el código fuente.
 */
function auditCodebase(options = {}) {
  const startTime = Date.now();
  const root = options.srcDir || ARCH_CONFIG.srcDir;
  const files = getSourceFiles(root);

  const results = {
    totalFiles: files.length,
    criticalCount: 0,
    warningCount: 0,
    passed: true,
    violations: [],
    durationMs: 0,
  };

  for (const filePath of files) {
    const relativePath = path.relative(root, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    const domainViolations = checkDomainPurity(filePath, content, relativePath);
    const viewViolations = checkViewSeparation(filePath, content, relativePath);
    const srpViolations = checkSingleResponsibility(filePath, content, relativePath);
    const routeViolations = checkRouteTypeSafety(filePath, content, relativePath);

    const allFileViolations = [
      ...domainViolations,
      ...viewViolations,
      ...srpViolations,
      ...routeViolations,
    ];

    for (const v of allFileViolations) {
      if (v.severity === 'CRITICAL') results.criticalCount++;
      if (v.severity === 'WARNING') results.warningCount++;
      results.violations.push(v);
    }
  }

  results.durationMs = Date.now() - startTime;
  results.passed = results.criticalCount === 0;

  return results;
}

/**
 * Imprime el Scorecard cromático en terminal.
 */
function printScorecard(results) {
  console.log(`\n${BOLD}======================================================================${RESET}`);
  console.log(`${CYAN}${BOLD}🏛️  [MASTER ARCHITECT] Auditoría de Principios SOLID y Límites de Capas${RESET}`);
  console.log(`${BOLD}======================================================================${RESET}\n`);

  console.log(`📁 Archivos TypeScript analizados: ${BOLD}${results.totalFiles}${RESET}`);
  console.log(`⏱️  Tiempo de análisis: ${BOLD}${results.durationMs} ms${RESET} (Límite: < 1500 ms)\n`);

  if (results.violations.length === 0) {
    console.log(`${GREEN}${BOLD}✅ 100% LIMPIO: Cero violaciones detectadas.${RESET}`);
    console.log(`${GREEN}   El código cumple estrictamente los principios SOLID, Hexagonal y DRY.${RESET}\n`);
    return;
  }

  // Agrupar violaciones por severidad
  const criticals = results.violations.filter(v => v.severity === 'CRITICAL');
  const warnings = results.violations.filter(v => v.severity === 'WARNING');

  if (criticals.length > 0) {
    console.log(`${RED}${BOLD}🚨 VIOLACIONES CRÍTICAS (${criticals.length}) — BLOQUEO DEL PIPELINE:${RESET}`);
    for (const c of criticals) {
      console.log(`  ${RED}✖ [${c.code}] ${c.rule}${RESET}`);
      console.log(`    ${BOLD}Archivo:${RESET} src/${c.file}`);
      console.log(`    ${BOLD}Detalle:${RESET} ${c.message}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log(`${YELLOW}${BOLD}⚠️  ADVERTENCIAS DE MANTENIBILIDAD & SRP (${warnings.length}):${RESET}`);
    for (const w of warnings) {
      console.log(`  ${YELLOW}▲ [${w.code}] ${w.rule}${RESET}`);
      console.log(`    ${BOLD}Archivo:${RESET} src/${w.file}`);
      console.log(`    ${BOLD}Detalle:${RESET} ${w.message}\n`);
    }
  }

  console.log(`${BOLD}----------------------------------------------------------------------${RESET}`);
  if (!results.passed) {
    console.log(`${RED}${BOLD}❌ ESTADO: FALLIDO — Se detectaron ${criticals.length} violaciones críticas.${RESET}`);
    console.log(`${RED}   Corrija las violaciones arquitectónicas antes de integrar o desplegar.${RESET}\n`);
  } else {
    console.log(`${GREEN}${BOLD}✅ ESTADO: APROBADO CON OBSERVACIONES (0 críticas, ${warnings.length} advertencias).${RESET}\n`);
  }
}

// Ejecución directa si se invoca por línea de comando
if (require.main === module) {
  const results = auditCodebase();
  printScorecard(results);

  if (!results.passed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

module.exports = {
  ARCH_CONFIG,
  getSourceFiles,
  countUsefulLines,
  checkDomainPurity,
  checkViewSeparation,
  checkSingleResponsibility,
  checkRouteTypeSafety,
  auditCodebase,
  printScorecard,
};
