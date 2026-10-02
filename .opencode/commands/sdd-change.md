# /sdd-change

**Descripción:** Gestiona modificaciones sobre funcionalidades existentes actualizando spec, plan y validando visualmente en DevTools cada cambio.

**Agente Objetivo:** @planner

**Prompt:**
Registra el nuevo requisito sobre la spec specs/$1/: $ARGUMENTS. Genera el diff en spec.md, indica impactos en plan.md e incluye la prueba obligatoria con chrome-devtools MCP tras actualizar el código.
