# /sdd-flow

**Descripción:** Orquesta la secuencia SDD completa garantizando que cada ciclo de construcción (@implementer) finalice con inspección de Chrome DevTools.

**Agente Objetivo:** @coordinator

**Prompt:**
Inicia la orquestación SDD para la funcionalidad: $ARGUMENTS. Coordina a @planner, @implementer y @reviewer. Exige a @implementer y @reviewer ejecutar chrome-devtools MCP en cada iteración del bucle.
