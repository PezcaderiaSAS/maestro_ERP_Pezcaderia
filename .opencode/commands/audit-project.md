# /audit-project

**Descripción:** Inspecciona el proyecto en marcha, analiza la estructura existente, sincroniza AGENTS.md y genera el borrador inicial de MEMORY.md utilizando Chrome DevTools.

**Agente Objetivo:** @coordinator

**Prompt:**
Lee el código actual de la aplicación. Usa chrome-devtools MCP para abrir index.html, tomar una captura inicial y revisar errores de consola. Genera specs/000-base-audit/spec.md junto a la memoria inicial en MEMORY.md.
