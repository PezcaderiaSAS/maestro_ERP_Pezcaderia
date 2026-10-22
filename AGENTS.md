<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **maestro_ERP_Pezcaderia** (155622 symbols, 299353 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/maestro_ERP_Pezcaderia/context` | Codebase overview, check index freshness |
| `gitnexus://repo/maestro_ERP_Pezcaderia/clusters` | All functional areas |
| `gitnexus://repo/maestro_ERP_Pezcaderia/processes` | All execution flows |
| `gitnexus://repo/maestro_ERP_Pezcaderia/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# Rico UI Brands & Google Stitch Frontend Design Capabilities

This repository is equipped with the **Rico UI Brands MCP server** (`ricoui-design-mcp`) and **Google Stitch** design pipeline.

## Design Protocol
- **Source of Truth:** Always consult [`DESIGN.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DESIGN.md) and [`stitch.json`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/stitch.json) before building or refactoring UI components.
- **Brand Tokens (Rico UI):** Query brand tokens at runtime via MCP tool `ricoui_get_brand_tokens` or CLI `node tools/ricoui-mcp/server.cjs tokens <brand>` (supported: `linear`, `stripe`, `raycast`, `supabase`, `vercel`, `apple`, `pezcaderia-glass`).
- **Generation Workflow:** Use the workflow [`/stitch-design`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agent/workflows/stitch-design.md) or skill [`.agents/skills/stitch-ricoui-design/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/stitch-ricoui-design/SKILL.md).
- **Aesthetic Standard:** Strict Dark Mode Glassmorphism (`backdrop-blur-xl`, `border-white/10`, `bg-slate-900/60`, vibrant HSL accents, high data density, zero generic placeholders).

---

# Ecosistema de Herramientas de Agente, Comandos Slash (/) y Gobernanza

El proyecto cuenta con un ecosistema formal de habilidades y comandos slash de uso preceptivo:

| Comando | Skill | Propósito & Obligatoriedad |
| :--- | :--- | :--- |
| `/archify` | [`.agents/skills/archify-architecture/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/archify-architecture/SKILL.md) | **Obligatorio:** Diagramas C4 y análisis estructural antes de refactorizaciones o nuevos módulos. |
| `/humanize` | [`.agents/skills/humanizer-refinement/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/humanizer-refinement/SKILL.md) | **Obligatorio:** Filtro de naturalidad anti-robótico para copy, PRs, errores y documentación. |
| `/penpot-ui` | [`.agents/skills/penpot-design-system/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/penpot-design-system/SKILL.md) | **Obligatorio:** Maquetación con estándares Flexbox/Grid y diseño vectorial de Penpot. |
| `/open-design` | [`.agents/skills/open-design-assets/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/open-design-assets/SKILL.md) | Catálogo de avatares SVG, micro-componentes y paletas abiertas a costo cero. |
| `/scientific-skills` | [`.agents/skills/scientific-agent-analytics/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/scientific-agent-analytics/SKILL.md) | **Obligatorio:** Algoritmos Pareto ABC (80/20), mermas de despiece y conversión gramos/kilos. |
| `/ponytail` | [`.agents/skills/ponytail-harness/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/ponytail-harness/SKILL.md) | Harness de pipelines de tareas encadenadas con checkpoints de verificación. |
| `/ui-tools` | [`.agents/skills/ui-ux-ecosystem/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/ui-ux-ecosystem/SKILL.md) | Hub consolidado de Awesome-Design-Tools, Awesome-UI y Awesome-Styleguides. |
| `/swarm` | [`tools/agency-swarm/`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/tools/agency-swarm/) | Enjambre multi-agente en Python (Gemini 2.5 Flash Lite) a costo $0 para ideación técnica especializada. |
| `/harness2` | [`.agent/workflows/harness2.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agent/workflows/harness2.md) | Framework de autorreflexión y optimización recursiva de arneses de IA a costo $0 con Gemini Flash y Antigravity en Español. |

---

# Tétrada Canónica de Ahorro de Tokens y Agentes Autónomos

El proyecto implementa una tétrada jerárquica obligatoria para optimizar consumo de contexto y evitar lecturas masivas de archivos:

1. **Exploración Conceptual Rápida:** `graphify query "<concepto>"`
   - Fuente primaria constitucional para entender módulos y dependencias temáticas a costo mínimo de tokens (`--budget 2000`).
2. **Blast Radius & Call-Graph de Código:** `npx gitnexus impact <simbolo> -r maestro_ERP_Pezcaderia`
   - Obligatorio antes de editar cualquier símbolo TypeScript para conocer callers, callees y flujos afectados.
   - Verificación de alcance con `npx gitnexus detect-changes -r maestro_ERP_Pezcaderia`.
3. **Ideación Técnica Especializada a Costo $0:** `/swarm` (Agency Swarm)
   - Ejecución mediante `python tools/agency-swarm/run_cli.py -a [data|architect|ui|quality] -p "<requerimiento>"` para diseñar SQL, RLS, esquemas Zod o arquitectura sin gastar cuota del LLM principal.
4. **Optimización Recursiva y Autorreflexión de Arneses a Costo $0:** `/harness2` (Google Harness²)
   - Ejecución mediante `powershell -ExecutionPolicy Bypass -File tools/harness2/run_harness2.ps1` para contrastar evolutivamente arneses (Propose-Probe-Compose), verificar invariantes y acumular lecciones duraderas sin alterar pesos de modelos.
   - **Co-Ejecución Simultánea Swarm + Harness²:** Disparo concurrente en paralelo mediante `python scripts/architecture/run_agency_sdd_bridge.py -a [data|architect|ui|quality] -p "<requerimiento>"` para que Agency Swarm ideé la solución mientras Harness² evalúa y optimiza el arnés en tiempo real.

---

# Pipeline Automatizado de Ciclo de Vida Git (Hooks & Scripts)

- **Post-Pull (Puesta en Marcha):**
  - Hook automático: `.husky/post-merge` y `.git/hooks/post-merge`
  - Comando npm: `npm run session:pull`
  - Acciones: Verificación de entorno $\rightarrow$ **Investigador SDD de Dependencias y Documentación Oficial ([`.antigravity-rules.json`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.antigravity-rules.json) con Brave Search API)** $\rightarrow$ Sincronización Graphify $\rightarrow$ Reindexación GitNexus $\rightarrow$ Verificación `tsc --noEmit` $\rightarrow$ Auditoría de 5 Diagramas Mermaid $\rightarrow$ **Auditoría Master Architect (SOLID & Boundaries: `scripts/architecture/audit-solid-boundaries.cjs`)** $\rightarrow$ **Verificación de Salud de Arneses IA Simultáneos (Harness² & Swarm)** $\rightarrow$ Comprobación de servidor Vite (`http://localhost:3000/`).
- **Pre-Push (Quality Gate de Cierre):**
  - Hook automático: `.husky/pre-push`
  - Comando npm: `npm run session:push`
  - Acciones: `tsc --noEmit` estricto $\rightarrow$ Suite Vitest completa (100% pasando) $\rightarrow$ `gitnexus detect-changes` (reporte de blast radius). Si falla cualquiera, **bloquea el push a GitHub**.

**Reglas de Gobernanza Preceptiva:** Ver [`.agent/rules/master-architect-solid.md`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/.agent/rules/master-architect-solid.md), [`.agent/rules/design-governance.md`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/.agent/rules/design-governance.md) y [`DOCS/ecosistema_herramientas_agentes_uiux.md`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/DOCS/ecosistema_herramientas_agentes_uiux.md).

---

# Protocolo Brownfield v2.2 — Fábrica de Software y Bucle DevTools Obligatorio

El proyecto se rige por el protocolo formal de ingeniería brownfield [`protocol.json`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/.opencode/protocol.json):

## 1. Infraestructura de Arnés
- **Punto de Entrada:** [`AGENTS.md`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/AGENTS.md)
- **Constitución:** [`docs/constitution.md`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/docs/constitution.md)
- **Memoria Persistente:** [`MEMORY.md`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/MEMORY.md) (máx. ~50 líneas, sincronizada con `/session-sync`).
- **Directorio SDD:** [`specs/NNN-nombre/`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/specs/) con `spec.md` (notación EARS), `plan.md` y `tasks.md`.

## 2. Roles de Agentes (.opencode/agents/)
- `@coordinator`: Director de orquesta y guardián de aprobaciones humanas.
- `@planner`: Redactor de specs EARS, planes técnicos y tareas atómicas.
- `@implementer`: Desarrollador TDD con validación en bucle tras cada modificación.
- `@reviewer`: Auditor de especificaciones, código, pruebas e interfaces.

## 3. Regla Innegociable de Bucle DevTools
> Tras **CADA** cambio de código realizado por `@implementer`, es **OBLIGATORIO** invocar inmediatamente el MCP `chrome-devtools` para:
> 1. Abrir la aplicación y verificar **0 errores / warnings** en la consola JS.
> 2. Comprobar el renderizado responsivo en vista móvil (**375 px**).
> 3. Validar interactivamente el flujo modificado antes de marcar cualquier tarea como completada.

## 4. Comandos Slash del Protocolo (.opencode/commands/)
- `/setup-mcps`: Inspecciona y verifica servidores MCP (`chrome-devtools`, `context7`, `figma`, `github`).
- `/audit-project`: Audita el estado de la app en vivo con DevTools y sincroniza la memoria.
- `/feature`: Planifica e implementa cambios menores exigiendo validación DevTools.
- `/sdd-flow`: Orquesta el ciclo completo de SDD con loop continuo de DevTools.
- `/sdd-change`: Gestiona modificaciones sobre especificaciones activas.
- `/session-sync`: Condensa y depura `MEMORY.md` manteniendo el límite de ~50 líneas.

---

# Flujo Mandatorio e Innegociable Spec Kit (SDD v3.0)

A partir de esta sesión, ante **CADA** solicitud o requerimiento nuevo, la IA DEBE ejecutar sin excepción el siguiente flujo con checkpoints de aprobación humana:

1. **/speckit.specify:**
   - Define el "Qué" se va a construir y el "Por qué".
   - Ejecuta `graphify query "<concepto>"` para consultar el grafo local y entender dependencias exactas antes de planificar, evitando lecturas masivas.
   - **Co-Ejecución Simultánea Swarm + Harness²:** Disparar `python scripts/architecture/run_agency_sdd_bridge.py -a architect -p "<requerimiento>"` para explorar el espacio de diseño y evaluar candidatos de arnés al mismo tiempo a costo $0.
   - **MANDATORIO MULTI-PHASE SYSTEM MODELING (Mermaid.js):** Generar obligatoriamente los 5 diagramas de ingeniería:
     1. `1_process_flowcharts`: Flujo de procesos y ciclo de vida secuencial.
     2. `2_decision_logic_diagrams`: Rombos de decisión `{...}` con bifurcaciones y edge cases.
     3. `3_entity_relationship_diagrams`: Modelo ER `erDiagram` con PK, FK y cardinalidad.
     4. `4_sequence_diagrams`: Diagrama de secuencia temporal `sequenceDiagram`.
     5. `5_component_architecture_diagrams`: Arquitectura por capas (Presentación, Lógica, Acceso a Datos).
   - **NO generes código todavía.** Espera la aprobación del usuario.
2. **/speckit.clarify (Control de Calidad 1):**
   - Realiza preguntas estructuradas para eliminar ambigüedades y mitigar riesgos antes de proponer soluciones técnicas.
   - Usa `graphify query "..."`.
   - **NO generes código todavía.** Espera la aprobación del usuario.
3. **/speckit.checklist:**
   - Genera una lista de verificación de calidad contra los estándares de la industria.
   - Usa `graphify query "..."`.
   - **NO generes código todavía.** Espera la aprobación del usuario.
4. **/speckit.plan:**
   - Crea el plan técnico (el "Cómo"): componentes, esquemas de datos y flujos de información respaldados por los 5 diagramas Mermaid aprobados.
   - Usa `graphify query "..."` y co-ejecuta `run_agency_sdd_bridge.py -a data -p "<plan>"` para contrastar arneses y esquemas con el enjambre en paralelo.
   - **NO generes código todavía.** Espera la aprobación del usuario.
5. **/speckit.tasks:**
   - Traduce el plan en tareas granulares, secuenciales y accionables.
   - Usa `graphify query "..."`.
   - **NO generes código todavía.** Espera la aprobación del usuario.
6. **/speckit.analyze (Control de Calidad 2):**
   - Reporte de consistencia y alineación cruzada (Spec $\rightarrow$ Plan $\rightarrow$ Tasks) para auditar fisuras antes de programar.
   - Ejecuta validación simultánea con Harness² (`run_agency_sdd_bridge.py -a quality --dry-run`) para asegurar que el arnés no viole restricciones ni presupuesto.
   - Usa `graphify query "..."`.
   - **NO generes código todavía.** Espera la aprobación del usuario.
7. **/speckit.tasks (Actualización post-análisis):**
   - Actualiza las tareas según el reporte de consistencia anterior.
   - **NO generes código todavía.** Espera la aprobación del usuario.
8. **/speckit.implement (Ejecución Quirúrgica TDD):**
   - **Regla Crítica 1:** Ejecuta **UNA SOLA tarea a la vez**.
   - **Regla Crítica 2:** Asegúrate de no romper integraciones existentes (100% tests verdes).
   - **Regla Crítica 3:** Al finalizar el código de cada tarea, **DETENTE INMEDIATAMENTE y espera la confirmación del usuario** antes de continuar.
   - **Regla Crítica 4:** Bucle DevTools obligatorio (0 errores consola JS y vista 375 px).

---

# Flujo Continuo Kanban (Continuous-Kanban-Flow) y Protocolo /grill-me

- **System Role:** Experto Desarrollador de Software, Arquitecto de IA y Gestor de Procesos Ágiles.
- **Directiva Mandatoria:** Antes de iniciar cualquier desarrollo o escritura de código, el sistema de desarrollo operativo debe estructurarse obligatoriamente bajo un flujo continuo Kanban (sin sprints rígidos ni roles fijos, ideal para soporte, iteración rápida y mantenimiento), respaldado por los 6 documentos fundamentales de arquitectura y el protocolo de interrogatorio continuo `/grill-me`. Se prohíbe adivinar, improvisar o acumular tareas sin control.

### Los 6 Documentos Fundamentales
1. **PRD (Product Requirements Document):** Requisitos de producto, funcionalidades exactas, idea general y qué se construye.
2. **TRD (Technical Requirements Document):** Requisitos técnicos, stack tecnológico, herramientas, librerías y APIs (plano claro sin adivinanzas).
3. **App Flow (Flujo de la Aplicación):** Mapa de navegación, UX/UI, user journey y comportamiento exacto ante cada interacción.
4. **Design Brief (Brief de Diseño):** Paleta de colores, tipografía, componentes y especificación visual de cada pantalla (Light Mode WCAG 2.2 AA+).
5. **Backend Schema (Esquema del Backend):** Almacenamiento de datos, autenticación, diseño de tablas, columnas, tipos y relaciones.
6. **Implementation Plan (Plan de Implementación):** Hoja de ruta paso a paso traducida en tarjetas accionables dentro del tablero de flujo continuo.

### Columnas del Tablero Kanban (Límite WIP = 1)
- **Por hacer (To Do):** Cola priorizada desglosada a partir de los 6 documentos base.
- **En proceso (In Progress - WIP Limited):** Tareas activas de desarrollo donde el agente aplica código estrictamente basado en los planos.
- **En revisión (In Review):** Validación de calidad, pruebas unitarias TDD y bucle Chrome DevTools MCP en vivo.
- **Terminado (Done):** Módulos completados y validados listos para producción o integración.

### Reglas de Ejecución Innegociables
- **Cero improvisación:** Ninguna línea de código de producción será escrita si los 6 documentos no están completos y validados.
- **Activación permanente de `/grill-me`:** Ante cualquier instrucción ambigua o vacíos en la especificación, el sistema se detiene para interrogar activamente al usuario antes de mover la tarea en el flujo Kanban.
- **Control de flujo WIP:** Se prohíbe abrir múltiples tareas de desarrollo en paralelo que excedan los límites establecidos (`WIP = 1`).
