# Plan de Implementación Técnica: SPEC-051
## Pipeline Automatizado de CI/CD para Despliegue Continuo en Vercel con GitHub Actions

- **Código:** SPEC-051
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Arquitectura de Archivos y Componentes

```
.github/
└── workflows/
    └── deploy-vercel.yml            # Workflow oficial de CI/CD para GitHub Actions
scripts/
└── lifecycle/
    └── deploy-vercel.cjs            # Script asistido para ejecución local y diagnóstico
package.json                         # Script "deploy:vercel"
specs/
└── 051-cicd-pipeline-automatizado-vercel-github-actions/
    ├── spec.md                      # Especificación técnica con los 5 diagramas Mermaid
    ├── plan.md                      # Este plan de implementación
    ├── checklist.md                 # Lista de verificación de calidad
    ├── tasks.md                     # Tareas atómicas secuenciales
    └── analyze.md                   # Reporte de consistencia y validación
```

---

## 2. Definición Detallada del Workflow GitHub Actions

### `.github/workflows/deploy-vercel.yml`
```yaml
name: Despliegue Continuo a Vercel Producción

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID || 'team_WPyjpiE2nTUFMqd4bn0arY31' }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID || 'prj_g7iK0oZHr5mVrhV9TTh7vWd4V5NZ' }}

jobs:
  quality-gate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Clonar Repositorio
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ⚙️ Configurar Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Instalar Dependencias
        run: npm ci

      - name: 🛡️ Quality Gate 1: Compilación TypeScript Estricta
        run: npx --no-install tsc --noEmit

      - name: 🧪 Quality Gate 2: Suite Completa de Pruebas Unitarias
        run: npm run test:run

      - name: ⚡ Instalar Vercel CLI
        run: npm install --global vercel@latest

      - name: 🔐 Sincronizar Entorno de Vercel (Pull)
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: 🏗️ Construir Artefactos de Producción (Build)
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: 🚀 Desplegar Artefactos Pre-construidos a Producción
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 3. Script Local de Diagnóstico y Despliegue Asistido

### `scripts/lifecycle/deploy-vercel.cjs`
1. **Detección de Variables:**
   - Lee `VERCEL_TOKEN` desde `.env.local`, `.env`, o argumentos `--token=...`.
   - Si no existe, imprime las instrucciones paso a paso para generarlo en `https://vercel.com/account/tokens`.
2. **Pre-flight Quality Gates:**
   - Ejecuta `tsc --noEmit` y `vitest run`. Si alguno falla, cancela el despliegue de inmediato.
3. **Ejecución del Despliegue:**
   - Ejecuta `npx vercel --prod --token=<TOKEN>`.
4. **Verificación Post-Despliegue:**
   - Realiza un `https.get` a `https://maestro-erp-pezcaderia.vercel.app/` confirmando HTTP 200 y verificando que el hash del script coincida con el build local.

---

## 4. Guía de Configuración de Secretos en GitHub

En la configuración del repositorio GitHub (`https://github.com/PezcaderiaSAS/maestro_ERP_Pezcaderia/settings/secrets/actions`), se deben configurar:

| Secreto en GitHub | Valor / Origen | Propósito |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Generado en `vercel.com/account/tokens` | Autenticación desatendida del runner |
| `VERCEL_ORG_ID` | `team_WPyjpiE2nTUFMqd4bn0arY31` | Identificador del equipo en Vercel |
| `VERCEL_PROJECT_ID` | `prj_g7iK0oZHr5mVrhV9TTh7vWd4V5NZ` | Identificador del proyecto ERP en Vercel |

---

## 5. Estrategia de Pruebas y Validación TDD

1. **Test Sintáctico y Estructural del Workflow:**
   - Validar sintaxis YAML con `actionlint` o parser Node.js (`yaml.parse`).
2. **Test Unitario del Script Asistido:**
   - Crear `src/tests/deployVercelScript.test.ts` verificando:
     - Detección de token ausente y modo instructivo.
     - Detección de Quality Gates fallidos.
     - Formateo correcto del comando CLI de Vercel.

