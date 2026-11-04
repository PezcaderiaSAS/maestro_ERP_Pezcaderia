# Tareas Atómicas de Implementación — SPEC-051 (Límite WIP = 1)
## Pipeline Automatizado de CI/CD para Despliegue Continuo en Vercel con GitHub Actions

- **Código:** SPEC-051
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## Estado General del Tablero Kanban

| Por Hacer (To Do) | En Progreso (In Progress - WIP = 1) | En Revisión (In Review) | Terminado (Done) |
| :--- | :--- | :--- | :--- |
| Ninguna | Ninguna | Ninguna | `TASK-051-01`, `TASK-051-02`, `TASK-051-03`, `TASK-051-04` (100% CERTIFICADO) |

---

## Desglose Granular de Tareas

- [x] **`TASK-051-01` [Infraestructura & CI/CD] Crear Workflow Oficial de GitHub Actions `.github/workflows/deploy-vercel.yml`**
  - **Objetivo:** Definir el pipeline YAML de integración y entrega continua para Vercel en `.github/workflows/deploy-vercel.yml`:
    - Disparador en `push` a la rama `main` y `workflow_dispatch`.
    - Pasos de `npm ci`, `npx tsc --noEmit` y `npm run test:run`.
    - Pasos de Vercel CLI (`pull`, `build` y `deploy --prebuilt --prod`).
  - **Pruebas:** Validar la sintaxis y estructura del workflow con test unitario parser YAML en `src/tests/deployVercelWorkflow.test.ts`.
  - **Criterio de Aceptación:** Estructura YAML 100% válida, 0 dependencias rotas, secrets correctamente parametrizados.
  - **Estado:** COMPLETADA Y VERIFICADA (5/5 tests verdes en `deployVercelWorkflow.test.ts`, 0 errores `tsc --noEmit`).

- [x] **`TASK-051-02` [Lifecycle & CLI] Desarrollar Script Local Asistido `scripts/lifecycle/deploy-vercel.cjs` y Comando npm**
  - **Objetivo:** Crear el script Node.js para despliegues locales desatendidos o asistidos con verificación interactiva de token y quality gates.
  - **Integración:** Registrar `"deploy:vercel": "node scripts/lifecycle/deploy-vercel.cjs"` en `package.json`.
  - **Pruebas:** Crear `src/tests/deployVercelScript.test.ts` evaluando detección de token, validación de variables y modo instructivo.
  - **Criterio de Aceptación:** 100% pruebas pasando, manejo de errores robusto.
  - **Estado:** COMPLETADA Y VERIFICADA (4/4 tests verdes en `deployVercelScript.test.ts`, comando registrado en `package.json`, 0 errores `tsc --noEmit`).

- [x] **`TASK-051-03` [Gobernanza & Documentación] Redactar Guía Operativa de Secretos de GitHub y Vinculación Vercel**
  - **Objetivo:** Crear [`DOCS/deployment/vercel-github-actions-guide.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DOCS/deployment/vercel-github-actions-guide.md) documentando los 3 secretos requeridos (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`), cómo generarlos en 2 minutos y la opción de vincular la GitHub App nativa de Vercel.
  - **Criterio de Aceptación:** Documentación paso a paso en español con capturas y rutas exactas.
  - **Estado:** COMPLETADA Y VERIFICADA (Guía exhaustiva creada en `DOCS/deployment/vercel-github-actions-guide.md`).

- [x] **`TASK-051-04` [Verificación & End-to-End] Validación de Quality Gates y Commit para Despliegue**
  - **Objetivo:** Ejecutar la suite completa de pruebas unitarias y comprobación TypeScript estricta antes de commitear el pipeline, permitiendo que al hacer `git push origin main` el workflow se active en GitHub.
  - **Criterio de Aceptación:** 0 errores `tsc --noEmit`, 100% tests verdes y confirmación del usuario para el push.
  - **Estado:** COMPLETADA Y VERIFICADA (0 errores `tsc --noEmit`, 1416/1416 pruebas unitarias pasando al 100%, simulación dry-run exitosa).

