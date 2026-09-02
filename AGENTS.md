<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **maestro_ERP_Pezcaderia** (80129 symbols, 131399 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

**Reglas de Gobernanza Preceptiva:** Ver [`.agent/rules/design-governance.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agent/rules/design-governance.md) y [`DOCS/ecosistema_herramientas_agentes_uiux.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DOCS/ecosistema_herramientas_agentes_uiux.md).
