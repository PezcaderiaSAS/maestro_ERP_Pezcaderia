---
description: Protocolo profesional de apertura de sesión: sincroniza git pull, verifica variables interactivas, activa agencias y herramientas, audita MCPs y despliega tareas pendientes (WIP = 1).
argument-hint: "[opcional: --skip-pull]"
---

# Workflow: /session-open
## Protocolo Profesional de Apertura de Sesión — La Pezcadería ERP

### Propósito
Garantizar que al inicio de cada jornada de desarrollo el entorno esté 100% sincronizado con el repositorio remoto, las agencias de inteligencia artificial (Swarm, Harness², ECC y roles Brownfield) estén activas y diagnosticadas, todas las capacidades y servidores MCP estén indexados y operativos, y se despliegue de inmediato la cola de tareas pendientes bajo la política de flujo continuo Kanban con límite estricto **WIP = 1**.

---

### Pasos de Ejecución Automatizados (`npm run session:open`)

1. **Sincronización Git Remota (`git pull origin main`):**
   - Asegura que el espacio de trabajo local incorpore los últimos cambios de la rama principal sin conflictos.
2. **Sincronización Interactiva de Variables de Entorno (`setup-harness2-env.cjs`):**
   - Si falta `GEMINI_API_KEY`, solicita la clave de forma interactiva en la terminal y sincroniza tanto `tools/harness2/.env` como `.env.local`.
   - Verifica la conectividad de los 8 servicios clave con `verify-env-connections.cjs`.
3. **Diagnóstico y Activación de Agencias de Agentes:**
   - **Agency Swarm (`tools/agency-swarm/`):** Valida `.venv` y disponibilidad de `DataEngineer`, `MasterArchitect`, `UiUxSpecialist`, `QualityEngineer`.
   - **Google Harness² (`tools/harness2/`):** Valida `.venv` y runner de autorreflexión recursiva a costo $0 con Gemini Flash.
   - **Bridge Co-Ejecución Simultánea:** Verifica `scripts/architecture/run_agency_sdd_bridge.py`.
   - **Roles Brownfield:** Confirma disponibilidad de `@coordinator`, `@planner`, `@implementer`, `@reviewer`.
4. **Auditoría e Indexación de Capacidades y Servidores MCP:**
   - Escanea todos los workflows en `.agent/workflows/` (114+ workflows).
   - Escanea todas las habilidades en `.agents/skills/`.
   - Audita servidores MCP (`chrome-devtools`, `supabase`, `github`, `gemini-api-docs`, `ricoui-design-mcp`, `stitch`, `hindsight`).
   - Genera y actualiza el manifiesto central [`DOCS/ecosystem-manifest.json`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DOCS/ecosystem-manifest.json).
5. **Verificación Estructural y de Calidad:**
   - Compilación estricta TypeScript (`tsc --noEmit`) en 0 errores.
   - Cumplimiento de los 5 Diagramas Mermaid obligatorios (`audit-diagrams-compliance.cjs`).
   - Auditoría Master Architect SOLID y límites arquitectónicos (`audit-solid-boundaries.cjs`).
6. **Comprobación del Servidor Vite:**
   - Verifica disponibilidad en `http://localhost:3000/`.
7. **Presentación de la Cola de Tareas Priorizadas (WIP = 1):**
   - Extrae el backlog activo desde [`MEMORY.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/MEMORY.md) y `specs/`.
   - Muestra la tarea activa en proceso y el orden de ejecución para la jornada.

---

### Comando de Ejecución Rápida
```powershell
npm run session:open
```
