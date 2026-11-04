// src/tests/deployVercelScript.test.ts
// TDD Suite para Script Local Asistido deploy-vercel.cjs (SPEC-051: TASK-051-02)

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Script Local de Despliegue: deploy-vercel.cjs (TASK-051-02)', () => {
  const scriptPath = path.resolve(process.cwd(), 'scripts/lifecycle/deploy-vercel.cjs');
  const pkgJsonPath = path.resolve(process.cwd(), 'package.json');

  it('debe existir el script en scripts/lifecycle/deploy-vercel.cjs', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('debe registrar el comando npm "deploy:vercel" en package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    expect(pkg.scripts['deploy:vercel']).toBe('node scripts/lifecycle/deploy-vercel.cjs');
  });

  it('debe resolver el token de Vercel correctamente o detectar ausencia', async () => {
    // Importar dinámicamente las funciones del módulo CommonJS
    const deployModule = await import('../../scripts/lifecycle/deploy-vercel.cjs' as string);
    const { resolveVercelToken } = deployModule.default || deployModule;

    // Caso 1: Token válido proporcionado
    const resValido = resolveVercelToken({ VERCEL_TOKEN: 'Vercel_Secret_Token_123456789' }, []);
    expect(resValido.token).toBe('Vercel_Secret_Token_123456789');
    expect(resValido.isValid).toBe(true);

    // Caso 2: Token pasado por argumento de CLI (--token=...)
    const resArg = resolveVercelToken({}, ['--token=CLI_Token_9876543210']);
    expect(resArg.token).toBe('CLI_Token_9876543210');
    expect(resArg.isValid).toBe(true);

    // Caso 3: Token vacío o placeholder
    const resPlaceholder = resolveVercelToken({ VERCEL_TOKEN: 'tu_vercel_token_aqui' }, []);
    expect(resPlaceholder.isValid).toBe(false);

    // Caso 4: Sin token
    const resVacio = resolveVercelToken({}, []);
    expect(resVacio.isValid).toBe(false);
  });

  it('debe construir el pipeline CLI completo (pull, build, deploy prebuilt)', async () => {
    const deployModule = await import('../../scripts/lifecycle/deploy-vercel.cjs' as string);
    const { buildVercelPullCommand, buildVercelBuildCommand, buildVercelDeployCommand } =
      deployModule.default || deployModule;

    // Pull comandos
    const pullProd = buildVercelPullCommand('token_abc123', { isProduction: true });
    expect(pullProd).toContain('vercel pull');
    expect(pullProd).toContain('--environment=production');
    expect(pullProd).toContain('--token=token_abc123');

    const pullPreview = buildVercelPullCommand('token_abc123', { isProduction: false });
    expect(pullPreview).toContain('--environment=preview');

    // Build comandos
    const buildProd = buildVercelBuildCommand('token_abc123', { isProduction: true });
    expect(buildProd).toContain('vercel build');
    expect(buildProd).toContain('--prod');
    expect(buildProd).toContain('--token=token_abc123');

    const buildPreview = buildVercelBuildCommand('token_abc123', { isProduction: false });
    expect(buildPreview).toContain('vercel build');
    expect(buildPreview).not.toContain('--prod');

    // Deploy prebuilt comandos
    const cmdProd = buildVercelDeployCommand('token_abc123', { isProduction: true });
    expect(cmdProd).toContain('npx vercel');
    expect(cmdProd).toContain('--prebuilt');
    expect(cmdProd).toContain('--prod');
    expect(cmdProd).toContain('--token=token_abc123');

    const cmdPreview = buildVercelDeployCommand('token_abc123', { isProduction: false });
    expect(cmdPreview).toContain('npx vercel');
    expect(cmdPreview).toContain('--prebuilt');
    expect(cmdPreview).not.toContain('--prod');
    expect(cmdPreview).toContain('--token=token_abc123');
  });
});

