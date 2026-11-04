// src/tests/deployVercelWorkflow.test.ts
// TDD Suite para Workflow de GitHub Actions hacia Vercel (SPEC-051: TASK-051-01)

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GitHub Actions Workflow Suite: deploy-vercel.yml (TASK-051-01)', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/deploy-vercel.yml');

  it('debe existir el archivo de workflow en .github/workflows/deploy-vercel.yml', () => {
    const exists = fs.existsSync(workflowPath);
    expect(exists).toBe(true);
  });

  it('debe contener los eventos disparadores requeridos (push a main y workflow_dispatch)', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Comprobar eventos de trigger
    expect(content).toMatch(/push:/);
    expect(content).toMatch(/branches:\s*(\n\s*-\s*)?\[?['"]?main['"]?\]?/);
    expect(content).toMatch(/workflow_dispatch:/);
  });

  it('debe configurar las variables de entorno de Vercel con fallback seguro al proyecto oficial', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Comprobar org ID y project ID
    expect(content).toMatch(/VERCEL_ORG_ID:/);
    expect(content).toMatch(/team_WPyjpiE2nTUFMqd4bn0arY31/);
    expect(content).toMatch(/VERCEL_PROJECT_ID:/);
    expect(content).toMatch(/prj_g7iK0oZHr5mVrhV9TTh7vWd4V5NZ/);
  });

  it('debe incorporar los Quality Gates obligatorios (tsc --noEmit y suite de tests)', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Quality Gate 1: TypeScript
    expect(content).toMatch(/tsc --noEmit/);

    // Quality Gate 2: Tests
    expect(content).toMatch(/npm run test:run|vitest run/);
  });

  it('debe ejecutar los pasos atómicos oficiales de Vercel CLI (--prebuilt --prod)', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Step Vercel pull
    expect(content).toMatch(/vercel pull/);
    expect(content).toMatch(/--environment=production/);

    // Step Vercel build
    expect(content).toMatch(/vercel build --prod/);

    // Step Vercel deploy prebuilt
    expect(content).toMatch(/vercel deploy --prebuilt --prod/);

    // Uso de token seguro
    expect(content).toMatch(/secrets\.VERCEL_TOKEN/);
  });
});
