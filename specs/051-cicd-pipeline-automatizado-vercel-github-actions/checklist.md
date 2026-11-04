# Lista de Verificación de Calidad (Checklist): SPEC-051
## Pipeline Automatizado de CI/CD para Despliegue Continuo en Vercel con GitHub Actions

- **Código:** SPEC-051
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.

---

## 1. Seguridad & Credenciales (Security-First)
- [ ] No existen tokens de Vercel hardcodeados en archivos versionados por Git.
- [ ] `.env.local` y `.env.production.local` permanecen en `.gitignore`.
- [ ] El workflow consume exclusivamente `secrets.VERCEL_TOKEN` inyectado en el runtime seguro de GitHub Actions.
- [ ] El script local rechaza tokens vacíos o placeholders (`tu_token_aqui`).

## 2. Gobernanza & Quality Gates (Test-Driven & Zero-Defects)
- [ ] El workflow exige que `tsc --noEmit` devuelva código de salida 0 antes de iniciar el build.
- [ ] El workflow exige que la suite completa de pruebas unitarias (1394+ tests) devuelva código 0 antes del despliegue.
- [ ] El build local de Vite (`npm run build`) produce el directorio `dist/` sin advertencias críticas de Rollup.

## 3. Configuración de Plataforma (Vercel & SPA Routing)
- [ ] `vercel.json` tiene configurada la regla de reescritura hacia `/index.html` para soportar SPA routing de React Router sin errores 404 en refrescos de página.
- [ ] Las cabeceras `Cache-Control` inmutables para `/assets/(.*)` están presentes en `vercel.json`.
- [ ] Los identificadores de proyecto (`prj_g7iK0oZHr5mVrhV9TTh7vWd4V5NZ`) y organización (`team_WPyjpiE2nTUFMqd4bn0arY31`) coinciden exactamente con `.vercel/project.json`.

## 4. Automatización & Operatividad
- [ ] El workflow se dispara automáticamente con `git push origin main`.
- [ ] El workflow permite ejecución manual desde la UI de GitHub (`workflow_dispatch`).
- [ ] Existe comando local `npm run deploy:vercel` para contingencias o despliegues asistidos.
- [ ] El script local verifica el código HTTP 200 de producción post-despliegue.

