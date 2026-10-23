---
description: Protocolo profesional de cierre de sesión: audita deltas de herramientas y workflows, ejecuta quality gate estricto (tsc, vitest 100%, gitnexus), actualiza MEMORY.md y handover, y realiza git push.
argument-hint: "[mensaje de commit opcional]"
---

# Workflow: /session-close
## Protocolo Profesional de Cierre de Sesión — La Pezcadería ERP

### Propósito
Garantizar un cierre de jornada impecable, seguro y documentado. Detecta y registra nuevas herramientas, workflows o servidores MCP creados durante la sesión; somete todo el código al Quality Gate Pre-Push más estricto (0 errores TypeScript, 100% pruebas Vitest pasando y auditoría GitNexus); sincroniza la memoria persistente (`MEMORY.md` en $\le 50$ líneas); genera el artefacto de Handover; y envía todo el trabajo a la rama principal de GitHub (`git push origin main`).

---

### Pasos de Ejecución Automatizados (`npm run session:close`)

1. **Auditoría y Registro de Nuevas Capacidades Creadas:**
   - Compara el estado actual del proyecto contra el manifiesto previo con `ecosystem-manifest.cjs`.
   - Si se crearon nuevos workflows, skills o configuraciones MCP, los indexa automáticamente en [`DOCS/ecosystem-manifest.json`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DOCS/ecosystem-manifest.json).
2. **Quality Gate Estricto — Compilación TypeScript:**
   - Ejecuta `npx tsc --noEmit`. Bloquea el cierre si existe cualquier error de tipos.
3. **Quality Gate Estricto — Suite Completa Vitest (100% Verde):**
   - Ejecuta `npm run test:run` sobre todas las suites unitarias, de integración y E2E.
   - Prohibido hacer commit o push con pruebas fallidas.
4. **Auditoría de Cambios y Blast Radius (GitNexus):**
   - Ejecuta `npx gitnexus detect-changes -r maestro_ERP_Pezcaderia` para auditar símbolos afectados.
5. **Actualización de Documentación, MEMORY.md y Handover:**
   - Actualiza [`MEMORY.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/MEMORY.md) respetando el límite constitucional de $\le 50$ líneas con el estado exacto de la sesión y la cola priorizada para la próxima apertura.
   - Genera el documento de Handover fechado en `DOCS/handovers/session_closure_handover_YYYY_MM_DD.md`.
6. **Git Commit y Push a GitHub origin main:**
   - Añade todos los archivos modificados e indexados (`git add .`).
   - Genera un commit convencional estructurado.
   - Sincroniza con el repositorio remoto (`git push origin main`) dejando el árbol de trabajo limpio.

---

### Comando de Ejecución Rápida
```powershell
npm run session:close
# O con mensaje de commit personalizado:
npm run session:close -- "feat(logistics): implementar TASK-026-03 y componentes tactiles"
```
