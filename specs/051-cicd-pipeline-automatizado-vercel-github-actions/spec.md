# Especificación Técnica del Requerimiento: SPEC-051
## Pipeline Automatizado de CI/CD para Despliegue Continuo en Vercel con GitHub Actions

- **Código:** SPEC-051
- **Fase:** Spec Kit SDD v3.0 — `/speckit.specify`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Declaración del Problema & Propósito

### 1.1 El "Qué" se va a construir
Una infraestructura de entrega continua (CI/CD) completamente automatizada, segura y verificable para **La Pezcadería ERP**, compuesta por:
1. **GitHub Actions Workflow Oficial (`.github/workflows/deploy-vercel.yml`):**
   - Disparo automático ante cada `push` a la rama `main` y soporte para ejecución manual bajo demanda (`workflow_dispatch`).
   - **Quality Gate Pre-Despliegue:** Validación estricta de tipos TypeScript (`tsc --noEmit` con 0 errores) y ejecución de pruebas unitarias (`vitest run` al 100% pasando).
   - **Compilación Optimizada:** Construcción limpia del bundle SPA (`npm run build` $\rightarrow$ `dist/`) con cabeceras de caché inmutable para assets en `vercel.json`.
   - **Despliegue a Producción Vercel:** Despliegue atómico a la red Edge de Vercel con vinculación estricta al proyecto (`prj_g7iK0oZHr5mVrhV9TTh7vWd4V5NZ`) y organización (`team_WPyjpiE2nTUFMqd4bn0arY31`).
2. **Script de Despliegue Local Resiliente (`scripts/lifecycle/deploy-vercel.cjs` y comando `npm run deploy:vercel`):**
   - Permite a los desarrolladores o agentes desplegar a producción o preview desde la terminal local previa verificación de credenciales y ejecución de quality gates.
3. **Guía de Configuración de Secretos en GitHub:**
   - Mapeo exacto de las variables requeridas en GitHub Secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, variables de Supabase y Redis para compilación Vite).

### 1.2 El "Por qué"
- Actualmente, el despliegue en producción ([https://maestro-erp-pezcaderia.vercel.app/](https://maestro-erp-pezcaderia.vercel.app/)) está congelado en el build del **28 de Octubre de 2026** (`index-Cv3QPOzP.js`), careciendo de los módulos implementados en las especificaciones `SPEC-041` a `SPEC-050` (Flujo Multivendedor, Caja Única, Compras en Muelle, Display Báscula, Checklist INVIMA y Conciliación de Mermas).
- El repositorio no posee el directorio `.github/workflows/`, por lo que los comandos `git push origin main` no generan ninguna acción de despliegue.
- El token CLI local expiró, requiriendo un mecanismo robusto y desatendido que no dependa de sesiones interactivas que caducan.

---

## 2. Modelado de Sistema Multifase (Mermaid.js)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (1_process_flowcharts)
```mermaid
flowchart TD
    A[Desarrollador ejecuta git push origin main] --> B[GitHub detecta evento Push en rama main]
    B --> C[Disparo de GitHub Actions Workflow: deploy-vercel.yml]
    C --> D[Paso 1: Checkout de código & Setup Node.js 20.x con pnpm/npm cache]
    D --> E[Paso 2: Instalación de dependencias limpias: npm ci]
    E --> F[Paso 3: Quality Gate 1 - Compilación TypeScript tsc --noEmit]
    F --> G{¿Compilación tsc 0 errores?}
    G -- Falló --> H[Notificación de Fallo en CI & Bloqueo de Despliegue]
    G -- Exitoso --> I[Paso 4: Quality Gate 2 - Suite de Pruebas Vitest]
    I --> J{¿100% Tests Verdes?}
    J -- Falló --> H
    J -- Exitoso --> K[Paso 5: Compilación Vite de Producción npm run build]
    K --> L[Paso 6: Vercel CLI deploy --prebuilt --prod]
    L --> M[Paso 7: Publicación Atómica en Vercel Edge Network]
    M --> N[Paso 8: URL de Producción Actualizada HTTP 200 OK]
```

---

### Diagrama 2: Lógica de Decisión y Guardas de Despliegue (2_decision_logic_diagrams)
```mermaid
flowchart TD
    A[Inicio del Ciclo de Despliegue] --> B{¿Existen Secretos de Vercel en GitHub?}
    B -- No: VERCEL_TOKEN no configurado --> C[Error Crítico en Step: Bloquear Pipeline y Requerir Configuración]
    B -- Sí: Secretos Presentes --> D{¿Rama activa es main?}
    D -- No: Rama de Feature / PR --> E[Desplegar a Preview Environment con URL Efímera]
    D -- Sí: Rama main --> F{¿Quality Gates TypeScript y Vitest Aprobados?}
    F -- Fallo en Tipos o Tests --> G[Abortar Build: Prevenir Subida de Regresiones a Producción]
    F -- Aprobados al 100% --> H{¿Build Vite dist/ Generado con Éxito?}
    H -- Error en Build / Rollup --> I[Fallo de Compilación: Notificar Error en Consola]
    H -- Exitoso --> J[Despliegue a Producción --prod con Inmutabilidad de Assets]
    J --> K[Generación de Comentario o Notificación de Release]
```

---

### Diagrama 3: Modelo Entidad-Relación de Configuración CI/CD (3_entity_relationship_diagrams)
```mermaid
erDiagram
    GITHUB_REPOSITORY ||--|{ GITHUB_SECRET : contiene
    GITHUB_REPOSITORY ||--|{ GITHUB_WORKFLOW : define
    GITHUB_WORKFLOW ||--|{ WORKFLOW_RUN : ejecuta
    WORKFLOW_RUN ||--|{ WORKFLOW_JOB : compone
    WORKFLOW_JOB ||--o| VERCEL_DEPLOYMENT : genera
    VERCEL_PROJECT ||--|{ VERCEL_DEPLOYMENT : almacena

    GITHUB_REPOSITORY {
        string owner PK
        string repoName PK
        string defaultBranch
    }
    GITHUB_SECRET {
        string secretName PK
        string environment
        datetime lastUpdated
    }
    GITHUB_WORKFLOW {
        string path PK
        string triggerEvents
        string defaultRunner
    }
    WORKFLOW_RUN {
        string runId PK
        string commitSha
        string status
        string conclusion
        datetime createdAt
    }
    VERCEL_PROJECT {
        string projectId PK
        string orgId
        string projectName
        string framework
    }
    VERCEL_DEPLOYMENT {
        string deploymentId PK
        string targetEnvironment
        string deploymentUrl
        string readyState
    }
```

---

### Diagrama 4: Diagrama de Secuencia Temporal (4_sequence_diagrams)
```mermaid
sequenceDiagram
    autonumber
    actor Dev as Desarrollador / Agente
    participant GH as GitHub Repo
    participant GHA as GitHub Actions Runner
    participant VCLI as Vercel CLI Action
    participant VAPI as Vercel Platform API
    participant CDN as Vercel Edge CDN

    Dev->>GH: git push origin main
    GH->>GHA: Dispara evento workflow: deploy-vercel.yml
    GHA->>GHA: npm ci (Instalación limpia de paquetes)
    GHA->>GHA: npx tsc --noEmit (0 errores de tipado)
    GHA->>GHA: npm run test:run (100% pruebas unitarias)
    GHA->>GHA: npm run build (Generación de bundle Vite en dist/)
    GHA->>VCLI: vercel pull --environment=production
    VCLI->>VAPI: Autenticación con VERCEL_TOKEN & descarga de envs
    VAPI-->>VCLI: Configuración de proyecto y entorno inyectada
    GHA->>VCLI: vercel build --prod
    GHA->>VCLI: vercel deploy --prebuilt --prod
    VCLI->>VAPI: Subida atómica de artefactos pre-construidos
    VAPI->>CDN: Propagación global a nodos Edge en sub-segundo
    CDN-->>Dev: https://maestro-erp-pezcaderia.vercel.app (Actualizado)
```

---

### Diagrama 5: Arquitectura de Componentes por Capas (5_component_architecture_diagrams)
```mermaid
flowchart TD
    subgraph Capa_Codigo["1. Capa de Código & Gobernanza Git"]
        Repo["Repositorio GitHub: PezcaderiaSAS/maestro_ERP_Pezcaderia"]
        BranchMain["Rama Protegida: main"]
        WorkflowDef[".github/workflows/deploy-vercel.yml"]
        HookPrePush[".husky/pre-push & scripts/lifecycle/session-close.cjs"]
    end

    subgraph Capa_CI["2. Capa de Integración Continua (GitHub Actions)"]
        Runner["GitHub Hosted Runner: ubuntu-latest / Node.js 20.x"]
        TscGate["Quality Gate: TypeScript tsc --noEmit"]
        VitestGate["Quality Gate: Vitest Suite (1394+ Tests)"]
        ViteBuild["Compilador Vite: Rollup Bundle Generator"]
    end

    subgraph Capa_Secretos["3. Capa de Seguridad & Credenciales (Secrets)"]
        SecToken["VERCEL_TOKEN (Personal Access Token)"]
        SecOrg["VERCEL_ORG_ID (team_WPyjpiE2nTUFMqd4bn0arY31)"]
        SecPrj["VERCEL_PROJECT_ID (prj_g7iK0oZHr5mVrhV9TTh7vWd4V5NZ)"]
        SecSupa["VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY"]
    end

    subgraph Capa_Vercel["4. Capa de Despliegue y Distribución (Vercel Edge)"]
        VercelAPI["Vercel Deployment API v13"]
        BuildArtifacts["Artefactos Estáticos: dist/ (HTML, JS, CSS, SVG)"]
        EdgeNetwork["Red Global Vercel Edge Anycast (HTTP 200)"]
    end

    Repo --> BranchMain
    BranchMain --> WorkflowDef
    HookPrePush --> Repo
    WorkflowDef --> Runner
    Runner --> TscGate
    TscGate --> VitestGate
    VitestGate --> ViteBuild
    Capa_Secretos --> Runner
    ViteBuild --> VercelAPI
    VercelAPI --> BuildArtifacts
    BuildArtifacts --> EdgeNetwork
```

---

## 3. Especificación Técnica de los Componentes a Crear

### 3.1 Archivo de Workflow de GitHub Actions: `.github/workflows/deploy-vercel.yml`
- **Disparadores:**
  - `push` en ramas `main`.
  - `workflow_dispatch` (permite disparar despliegues manuales desde la pestaña Actions de GitHub con un clic).
- **Entorno de Ejecución:** `ubuntu-latest`, `node-version: 20.x`.
- **Pasos:**
  1. `actions/checkout@v4` con fetch-depth completo (`fetch-depth: 0`).
  2. `actions/setup-node@v4` con caché de `npm`.
  3. Instalación de dependencias: `npm ci`.
  4. Verificación estricta de tipos: `npx --no-install tsc --noEmit`.
  5. Verificación de pruebas unitarias: `npm run test:run`.
  6. Instalación de Vercel CLI global: `npm install --global vercel@latest`.
  7. Extracción de configuración de entorno Vercel:
     `vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}`
  8. Construcción de artefactos de producción:
     `vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}`
  9. Despliegue final con artefactos precompilados:
     `vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}`

### 3.2 Script de Despliegue Local Asistido: `scripts/lifecycle/deploy-vercel.cjs`
- **Propósito:** Ofrecer un comando directo `npm run deploy:vercel` para que el desarrollador pueda desplegar de inmediato sin esperar a GitHub o diagnosticar el estado del token.
- **Acciones:**
  1. Verifica si `VERCEL_TOKEN` está en `.env.local` o `process.env`. Si no está, guía al usuario interactivamente para obtenerlo.
  2. Ejecuta `tsc --noEmit` y `vitest run`.
  3. Ejecuta `npx vercel --prod --token=...`.
  4. Valida con una petición HTTP `GET` que `https://maestro-erp-pezcaderia.vercel.app/` responda en HTTP 200 y reporte el nuevo hash del bundle.

### 3.3 Configuración en `package.json`
- Añadir comando `npm run deploy:vercel` mapeado a `node scripts/lifecycle/deploy-vercel.cjs`.

---

## 4. Criterios de Aceptación Innegociables

1. **Automatización:** Cada `git push origin main` debe iniciar el workflow de GitHub Actions sin intervención manual.
2. **Quality Gate:** Si una prueba unitaria falla o `tsc` tiene 1 error, el pipeline DEBE abortar inmediatamente e impedir que el código roto llegue a producción.
3. **Producción Actualizada:** Tras la ejecución, `https://maestro-erp-pezcaderia.vercel.app/` debe servir el bundle con las especificaciones SPEC-041 a SPEC-050 incluidas.
4. **Resiliencia Local:** El desarrollador debe poder desplegar localmente en cualquier momento ejecutando `npm run deploy:vercel`.

