/**
 * ============================================================================
 * AUDITOR Y SCAFFOLDER DE MODELADO Y DIAGRAMAS MERMAID OBLIGATORIOS
 * ============================================================================
 * Proyecto: La Pezcadería ERP
 * Archivo: scripts/architecture/audit-diagrams-compliance.cjs
 * Mandato: MANDATORY MULTI-PHASE SYSTEM MODELING & DIAGRAMMING
 * Ejecutado por: .husky/post-merge, post-pull.cjs, o `npm run audit:diagrams`
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const SPECS_DIR = path.join(ROOT_DIR, 'specs');

const IS_SCAFFOLD = process.argv.includes('--scaffold');
const SPEC_ARG = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]);
const IS_STRICT = process.argv.includes('--strict');

/**
 * 1. Definición canónica de los 5 diagramas obligatorios
 */
const MANDATORY_DIAGRAMS = [
  {
    id: '1_process_flowcharts',
    title: 'Flujo de Procesos (Secuencia Operativa)',
    type: 'flowchart',
    validator: (content) => /```mermaid[\s\S]*?(flowchart|graph)\s+(TD|LR|TB|BT)[\s\S]*?```/i.test(content),
    hint: 'Debe contener un bloque ```mermaid con flowchart TD/LR y bloques de proceso rectangulares.'
  },
  {
    id: '2_decision_logic_diagrams',
    title: 'Rombos de Decisión y Lógica Condicional',
    type: 'decision',
    validator: (content) => {
      const match = content.match(/```mermaid[\s\S]*?```/gi);
      if (!match) return false;
      // Debe contener al menos un nodo en rombo {¿Condición?}
      return match.some(b => /\{[^{}]+?\}/.test(b) && (b.includes('flowchart') || b.includes('graph')));
    },
    hint: 'Debe contener compuertas de decisión en rombo {...} mapeando bifurcaciones y edge cases.'
  },
  {
    id: '3_entity_relationship_diagrams',
    title: 'Modelo Entidad-Relación (ERD & Persistencia)',
    type: 'erDiagram',
    validator: (content) => /```mermaid[\s\S]*?erDiagram[\s\S]*?```/i.test(content),
    hint: 'Debe contener un bloque ```mermaid con erDiagram definiendo entidades, PK, FK y cardinalidad.'
  },
  {
    id: '4_sequence_diagrams',
    title: 'Diagrama de Secuencia Temporal',
    type: 'sequenceDiagram',
    validator: (content) => /```mermaid[\s\S]*?sequenceDiagram[\s\S]*?```/i.test(content),
    hint: 'Debe contener un bloque ```mermaid con sequenceDiagram mostrando mensajes sincrónicos/asincrónicos.'
  },
  {
    id: '5_component_architecture_diagrams',
    title: 'Arquitectura de Componentes y Límites de Capas',
    type: 'architecture',
    validator: (content) => {
      const match = content.match(/```mermaid[\s\S]*?```/gi);
      if (!match) return false;
      return match.some(b => (b.includes('subgraph') || b.includes('C4Context')) && (b.includes('graph') || b.includes('flowchart') || b.includes('C4')));
    },
    hint: 'Debe contener arquitectura por capas con subgraphs (Presentación, Casos de Uso, Acceso a Datos).'
  }
];

/**
 * 2. Plantilla Scaffold de Alta Fidelidad para los 5 Diagramas
 */
function generateDiagramsScaffoldTemplate(featureName = 'Módulo ERP') {
  return `
<!-- MANDATORY MULTI-PHASE SYSTEM MODELING (Mermaid.js) -->
## 5 Diagramas de Ingeniería Obligatorios (Mermaid.js)

### 1. Flujo de Procesos: Ciclo de Vida Operativo (\`1_process_flowcharts\`)
\`\`\`mermaid
flowchart TD
    A[Inicio: Solicitud de Operación] --> B[Validación Previa de Estado y Tenant]
    B --> C[Procesamiento del Caso de Uso en Servicio]
    C --> D[Transacción Atómica en Base de Datos]
    D --> E[Emisión de Evento / Notificación SweetAlert2]
    E --> F[Fin del Proceso Operativo]
\`\`\`

### 2. Rombos de Decisión: Lógica Condicional y Edge Cases (\`2_decision_logic_diagrams\`)
\`\`\`mermaid
flowchart TD
    A[Recepción de Datos de Entrada] --> B{¿Cumple Validación de Esquema Zod?}
    B -- No --> C[Retornar Error 400: Datos Inválidos]
    B -- Sí --> D{¿Cuenta con Autorización y RLS?}
    D -- No --> E[Bloqueo 403: Violación de Seguridad RLS]
    D -- Sí --> F{¿Stock / Cupo Suficiente Disponible?}
    F -- No --> G[Alerta: Desvío a Backorder o Cuarentena]
    F -- Sí --> H[Aprobar y Ejecutar Transacción]
\`\`\`

### 3. Modelo Entidad-Relación: Persistencia y Llaves (\`3_entity_relationship_diagrams\`)
\`\`\`mermaid
erDiagram
    TENANT ||--o{ PRODUCTO : "posee"
    PRODUCTO ||--o{ MOVIMIENTO_INVENTARIO : "registra"
    PRODUCTO {
        uuid id PK
        uuid tenant_id FK
        string nombre
        numeric precio_base
        numeric stock_actual
        timestamp created_at
    }
    MOVIMIENTO_INVENTARIO {
        uuid id PK
        uuid producto_id FK
        uuid tenant_id FK
        string tipo_movimiento
        numeric cantidad_kg
        timestamp fecha
    }
\`\`\`

### 4. Diagrama de Secuencia: Mensajería entre Capas y Servicios (\`4_sequence_diagrams\`)
\`\`\`mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (POS / Operativo)
    participant UI as Vista React (Component / Hook)
    participant SVC as Servicio de Dominio (Service)
    participant DB as Supabase PostgreSQL (RLS)
    participant CACHE as Upstash Redis (L3 Cache)

    U->>UI: Interacción (Submit / Confirmar)
    UI->>SVC: Invocación de Caso de Uso con DTO
    SVC->>CACHE: Validar Lock Distribuido / Caché
    CACHE-->>SVC: Lock Adquirido
    SVC->>DB: Query / Mutación con JWT autenticado
    DB-->>SVC: Confirmación de fila afectada
    SVC-->>UI: Respuesta tipada exitosa
    UI-->>U: Feedback Visual en Pantalla (Toast / Swal)
\`\`\`

### 5. Arquitectura de Componentes y Límites de Capas (\`5_component_architecture_diagrams\`)
\`\`\`mermaid
flowchart TB
    subgraph Presentacion["1. Capa de Presentación (UI / React 18)"]
        V[Vistas y Componentes Atómicos]
        H[Custom Hooks y Stores Zustand]
        V --> H
    end

    subgraph Dominio["2. Capa de Dominio y Casos de Uso"]
        SVC[Servicios de Negocio Deterministas]
        ZOD[Validación y Contratos Zod]
        H --> SVC
        SVC --> ZOD
    end

    subgraph Infraestructura["3. Capa de Datos e Infraestructura"]
        SB[Supabase Client + RLS]
        REDIS[Upstash Redis L3 Client]
        SVC --> SB
        SVC --> REDIS
    end
\`\`\`
<!-- END MANDATORY MULTI-PHASE SYSTEM MODELING -->
`;
}

/**
 * 3. Ejecutar Scaffolding sobre una especificación
 */
function runScaffold(specTarget) {
  if (!specTarget) {
    console.error('❌ Error: Debes indicar el nombre o ruta de la carpeta de la especificación.');
    console.error('Uso: node scripts/architecture/audit-diagrams-compliance.cjs --scaffold <spec-folder>');
    process.exit(1);
  }

  let targetDir = path.isAbsolute(specTarget) ? specTarget : path.join(SPECS_DIR, specTarget);
  if (!fs.existsSync(targetDir)) {
    // Buscar si coincide con el inicio del nombre
    const entries = fs.readdirSync(SPECS_DIR, { withFileTypes: true });
    const match = entries.find(e => e.isDirectory() && e.name.toLowerCase().startsWith(specTarget.toLowerCase()));
    if (match) {
      targetDir = path.join(SPECS_DIR, match.name);
    } else {
      console.error(`❌ No se encontró la carpeta de spec: "${specTarget}" en ${SPECS_DIR}`);
      process.exit(1);
    }
  }

  const specFilePath = path.join(targetDir, 'spec.md');
  const featureName = path.basename(targetDir);

  if (!fs.existsSync(specFilePath)) {
    fs.writeFileSync(specFilePath, `# Especificación: ${featureName}\n\n${generateDiagramsScaffoldTemplate(featureName)}`, 'utf-8');
    console.log(`✔ Archivo creado con plantilla de diagramas: ${specFilePath}`);
  } else {
    const existingContent = fs.readFileSync(specFilePath, 'utf-8');
    if (existingContent.includes('<!-- MANDATORY MULTI-PHASE SYSTEM MODELING')) {
      console.log(`ℹ️ La spec "${featureName}" ya cuenta con la sección de diagramas obligatorios.`);
    } else {
      fs.appendFileSync(specFilePath, `\n\n${generateDiagramsScaffoldTemplate(featureName)}`, 'utf-8');
      console.log(`✔ Plantilla de 5 diagramas Mermaid inyectada con éxito en: ${specFilePath}`);
    }
  }
}

/**
 * 4. Obtener especificaciones activas (en curso)
 */
function getActiveSpecs() {
  if (!fs.existsSync(SPECS_DIR)) return [];
  const entries = fs.readdirSync(SPECS_DIR, { withFileTypes: true });
  // Filtrar carpetas de especificaciones
  const specDirs = entries
    .filter(e => e.isDirectory() && /^\d{3}-/.test(e.name))
    .map(e => e.name)
    .sort();

  // La última especificación numerada es típicamente la activa en desarrollo
  // o cualquiera que contenga un spec.md
  return specDirs;
}

/**
 * 5. Función de Auditoría
 */
function runAudit() {
  console.log('\n======================================================================');
  console.log('🏛️  [MASTER ARCHITECT] Auditoría de Modelado y Diagramas Mermaid');
  console.log('Directiva: MANDATORY MULTI-PHASE SYSTEM MODELING & DIAGRAMMING');
  console.log('======================================================================\n');

  const allSpecs = getActiveSpecs();
  if (allSpecs.length === 0) {
    console.log('ℹ️ No se detectaron especificaciones en specs/.');
    process.exit(0);
  }

  // Identificar la spec activa: la última en desarrollo (o la especificada en args)
  let activeSpecName = allSpecs[allSpecs.length - 1];
  if (SPEC_ARG) {
    const match = allSpecs.find(s => s.toLowerCase().startsWith(SPEC_ARG.toLowerCase()) || s.toLowerCase().includes(SPEC_ARG.toLowerCase()));
    if (match) {
      activeSpecName = match;
    } else {
      activeSpecName = SPEC_ARG;
    }
  }
  const activeSpecDir = path.join(SPECS_DIR, activeSpecName);
  const specFile = path.join(activeSpecDir, 'spec.md');

  console.log(`🎯 Especificación Auditada: \x1b[36m${activeSpecName}\x1b[0m`);

  if (!fs.existsSync(specFile)) {
    console.warn(`⚠️ Advertencia: No existe "spec.md" en ${activeSpecDir}`);
    console.warn(`👉 Ejecuta: npm run scaffold:diagrams ${activeSpecName}`);
    process.exit(0);
  }

  const specContent = fs.readFileSync(specFile, 'utf-8');
  let hasMissing = false;

  console.log('\n--------------------------------------------------------------------------------------');
  console.log('Diagrama Obligatorio'.padEnd(48) + 'Tipo Mermaid'.padEnd(20) + 'Estado');
  console.log('--------------------------------------------------------------------------------------');

  for (const diag of MANDATORY_DIAGRAMS) {
    const isCompliant = diag.validator(specContent);
    const titleCol = diag.title.padEnd(48);
    const typeCol = diag.type.padEnd(20);

    if (isCompliant) {
      console.log(`${titleCol}${typeCol}\x1b[32m✔ CUMPLE\x1b[0m`);
    } else {
      hasMissing = true;
      console.log(`${titleCol}${typeCol}\x1b[31m✖ FALTA\x1b[0m`);
    }
  }

  console.log('--------------------------------------------------------------------------------------\n');

  if (hasMissing) {
    console.error('❌ INCUMPLIMIENTO DE GOBERNANZA ARQUITECTÓNICA:');
    console.error(`   La especificación activa "${activeSpecName}" no cuenta con los 5 diagramas obligatorios.`);
    console.error('   MANDATO: Queda terminantemente PROHIBIDO escribir código de implementación hasta');
    console.error('   completar y validar cada uno de los esquemas gráficos requeridos.\n');
    console.error(`👉 Para inyectar la plantilla automáticamente ejecuta:\n   npm run scaffold:diagrams ${activeSpecName}\n`);

    if (IS_STRICT) {
      process.exit(1);
    } else {
      console.warn('⚠️ Se permite continuar con observación para permitir maquetar los diagramas en la spec.');
      process.exit(0);
    }
  } else {
    console.log('🎉 \x1b[32m[APROBADO] La especificación activa cumple al 100% con los 5 diagramas de ingeniería.\x1b[0m\n');
    process.exit(0);
  }
}

if (IS_SCAFFOLD) {
  runScaffold(SPEC_ARG);
} else {
  runAudit();
}
