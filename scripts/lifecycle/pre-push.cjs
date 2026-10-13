/**
 * Script de Quality Gate de Cierre y Verificación (Pre-Push)
 * Ejecutado automáticamente por .husky/pre-push o mediante `npm run session:push`.
 */

const { execSync } = require('child_process');

console.log('\n======================================================');
console.log('🛡️ [LIFECYCLE] Quality Gate Pre-Push — La Pezcadería ERP');
console.log('======================================================\n');

function run(cmd, desc, canFail = false) {
  console.log(`⏳ ${desc}...`);
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✅ ${desc}: OK\n`);
    return true;
  } catch (error) {
    if (!canFail) {
      console.error(`\n❌ QUALITY GATE FALLIDO en: ${desc}`);
      console.error('⛔ El push a GitHub ha sido detenido para proteger la estabilidad de la rama principal.\n');
      process.exit(1);
    } else {
      console.warn(`⚠️ Advertencia en: ${desc}\n`);
      return false;
    }
  }
}

// 1. Verificación Estricta de Tipos TypeScript
console.log('🔷 [Paso 1/3] Comprobando tipos TypeScript (tsc --noEmit)...');
run('npx tsc --noEmit', 'Compilación TypeScript sin errores');

// 2. Ejecución Completa de Pruebas Automatizadas (Vitest)
console.log('🧪 [Paso 2/3] Ejecutando suite completa de pruebas (Vitest)...');
run('npm run test:run', 'Suite de Pruebas Automatizadas');

// 3. Auditoría de Impacto y Cambios con GitNexus
console.log('🕸️ [Paso 3/3] Calculando blast radius y símbolos afectados con GitNexus...');
run('npx gitnexus detect-changes -r maestro_ERP_Pezcaderia', 'Auditoría de cambios GitNexus', true);

console.log('🎉 [LIFECYCLE] Quality Gate 100% superado. Autorizando git push.\n');
