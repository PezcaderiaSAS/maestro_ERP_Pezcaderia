/**
 * scripts/lifecycle/deploy-vercel.cjs
 * Script Local Asistido para Despliegues a Vercel con Quality Gates (SPEC-051: TASK-051-02)
 * Verifica credenciales, ejecuta tsc y vitest, y despliega a Vercel Edge con verificación HTTP.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '../../');
const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');
const ENV_PATH = path.join(ROOT_DIR, '.env');

/**
 * Lee un archivo .env simple
 */
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[match[1]] = val;
    }
  }
  return env;
}

/**
 * Resuelve el token de Vercel desde argumentos de línea de comandos, .env.local o process.env
 */
function resolveVercelToken(env = {}, args = []) {
  // 1. Argumento --token=...
  const tokenArg = args.find((a) => a.startsWith('--token='));
  if (tokenArg) {
    const val = tokenArg.split('=')[1]?.trim();
    if (val && !val.includes('tu_vercel_token') && val.length > 8) {
      return { token: val, isValid: true, source: 'cli_arg' };
    }
  }

  // 2. Variables en process.env o env pasado
  const candidate =
    env.VERCEL_TOKEN ||
    process.env.VERCEL_TOKEN;

  if (candidate && typeof candidate === 'string') {
    const val = candidate.trim();
    if (val && !val.includes('tu_vercel_token') && !val.includes('tu_token') && val.length > 8) {
      return { token: val, isValid: true, source: 'env' };
    }
  }

  return { token: null, isValid: false, source: 'none' };
}

/**
 * Construye el comando de sincronización de entorno de Vercel CLI (pull)
 */
function buildVercelPullCommand(token, options = {}) {
  const { isProduction = true } = options;
  const envFlag = isProduction ? 'production' : 'preview';
  return `npx vercel pull --yes --environment=${envFlag} --token=${token}`;
}

/**
 * Construye el comando de compilación local de Vercel CLI (build)
 */
function buildVercelBuildCommand(token, options = {}) {
  const { isProduction = true } = options;
  const prodFlag = isProduction ? ' --prod' : '';
  return `npx vercel build${prodFlag} --token=${token}`;
}

/**
 * Construye el comando de despliegue de artefactos pre-construidos de Vercel CLI
 */
function buildVercelDeployCommand(token, options = {}) {
  const { isProduction = true } = options;
  const prodFlag = isProduction ? ' --prod' : '';
  return `npx vercel deploy --prebuilt${prodFlag} --token=${token} --yes`;
}

/**
 * Imprime las instrucciones paso a paso para configurar el token de Vercel
 */
function printTokenInstructions() {
  console.log('\n======================================================================');
  console.log('🔐 [VERCEL SETUP] Token de Acceso No Detectado o Inválido');
  console.log('======================================================================');
  console.log('Para desplegar a producción desde la terminal o mediante CI/CD:');
  console.log('1. Ingresa a: https://vercel.com/account/tokens');
  console.log('2. Genera un nuevo Token ("Create") con alcance completo.');
  console.log('3. Configúralo usando una de las siguientes opciones:');
  console.log('   • Opción A (Local): Agrégalo a tu archivo .env.local:');
  console.log('     VERCEL_TOKEN=tu_token_aqui');
  console.log('   • Opción B (Comando directo):');
  console.log('     npm run deploy:vercel -- --token=tu_token_aqui');
  console.log('   • Opción C (GitHub Actions CI/CD):');
  console.log('     Agrégalo en GitHub > Settings > Secrets and variables > Actions > VERCEL_TOKEN');
  console.log('======================================================================\n');
}

/**
 * Función principal de ejecución
 */
async function main(args = process.argv.slice(2)) {
  console.log('\n======================================================================');
  console.log('🚀 [DEPLOY] Protocolo de Despliegue Asistido a Vercel — La Pezcadería ERP');
  console.log('======================================================================\n');

  const rootEnvLocal = parseEnv(ENV_LOCAL_PATH);
  const rootEnv = parseEnv(ENV_PATH);
  const mergedEnv = { ...rootEnv, ...rootEnvLocal, ...process.env };

  const tokenRes = resolveVercelToken(mergedEnv, args);
  const isPreview = args.includes('--preview');
  const isProduction = !isPreview;
  const skipTests = args.includes('--skip-tests');
  const isDryRun = args.includes('--dry-run');

  if (!tokenRes.isValid) {
    printTokenInstructions();
    if (!isDryRun) {
      process.exit(1);
    }
    return { success: false, reason: 'missing_token' };
  }

  console.log(`✅ Token de Vercel detectado y validado (Origen: ${tokenRes.source}).`);
  console.log(`🎯 Entorno de destino: ${isProduction ? 'PRODUCCIÓN (--prod)' : 'PREVIEW'}\n`);

  // ── Quality Gate 1: Compilación TypeScript Estricta ──
  if (!skipTests) {
    console.log('🛡️ [Quality Gate 1/2] Verificando compilación TypeScript (tsc --noEmit)...');
    try {
      execSync('npx --no-install tsc --noEmit', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log('✅ TypeScript: 0 errores de compilación.\n');
    } catch (err) {
      console.error('\n❌ Despliegue cancelado: Existen errores de TypeScript.');
      process.exit(1);
    }

    // ── Quality Gate 2: Suite Completa de Tests ──
    console.log('🧪 [Quality Gate 2/2] Ejecutando suite de pruebas unitarias (Vitest)...');
    try {
      execSync('npm run test:run', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log('✅ Vitest: 100% pruebas unitarias pasando.\n');
    } catch (err) {
      console.error('\n❌ Despliegue cancelado: Pruebas unitarias fallidas.');
      process.exit(1);
    }
  } else {
    console.warn('⚠️ ADVERTENCIA: Se omitieron los Quality Gates (--skip-tests).\n');
  }

  // ── Ejecución de Vercel CLI (Pipeline Prebuilt: Pull -> Build -> Deploy Prebuilt) ──
  const pullCmd = buildVercelPullCommand(tokenRes.token, { isProduction });
  const buildCmd = buildVercelBuildCommand(tokenRes.token, { isProduction });
  const deployCmd = buildVercelDeployCommand(tokenRes.token, { isProduction });

  console.log(`⚡ Ejecutando pipeline de despliegue prebuilt con Vercel CLI...`);

  if (isDryRun) {
    console.log(`[DRY-RUN] Comandos simulados:`);
    console.log(`  1. ${pullCmd}`);
    console.log(`  2. ${buildCmd}`);
    console.log(`  3. ${deployCmd}`);
    return { success: true, dryRun: true };
  }

  try {
    console.log('⚡ [1/3] Sincronizando variables y proyecto Vercel (pull)...');
    execSync(pullCmd, { cwd: ROOT_DIR, stdio: 'inherit' });

    console.log('\n⚡ [2/3] Compilando artefactos de producción (build)...');
    execSync(buildCmd, { cwd: ROOT_DIR, stdio: 'inherit' });

    console.log('\n⚡ [3/3] Desplegando artefactos pre-construidos a Vercel Edge (deploy --prebuilt)...');
    execSync(deployCmd, { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('\n🎉 Despliegue completado con éxito en Vercel.');

    // ── Verificación de Ping HTTP en Producción ──
    if (isProduction) {
      console.log('🌐 Verificando disponibilidad en https://maestro-erp-pezcaderia.vercel.app/...');
      https
        .get('https://maestro-erp-pezcaderia.vercel.app/', (res) => {
          console.log(`✅ URL de Producción respondiendo en HTTP ${res.statusCode}.\n`);
        })
        .on('error', (e) => {
          console.warn('⚠️ No se pudo verificar la URL de producción:', e.message);
        });
    }

    return { success: true };
  } catch (error) {
    console.error('\n❌ Error durante la ejecución del pipeline Vercel CLI:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error no controlado en deploy-vercel:', err);
    process.exit(1);
  });
}

module.exports = {
  resolveVercelToken,
  buildVercelPullCommand,
  buildVercelBuildCommand,
  buildVercelDeployCommand,
  printTokenInstructions,
  main,
};

