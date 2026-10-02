# /feature

**Descripción:** Planifica e implementa cambios menores o parches rápidos obligando la inspección de DevTools tras modificar código.

**Agente Objetivo:** @planner

**Prompt:**
Analiza la petición $ARGUMENTS en modo Plan. Consulta AGENTS.md, MEMORY.md y las skills activas. Propón los cambios exactos y exige que en la fase Build se ejecute obligatoriamente chrome-devtools MCP para validar cada actualización.
