---
trigger: always_on
---

# Constitución de La Pezcadería ERP

- **Arquitectura:** Sistema estricto "Data-Driven".
- **Frontend:** React 18, Vite.
- **Lenguaje:** TypeScript estricto.
- **Backend:** Supabase.
- **Estilos / UI:** Tailwind CSS.
- **Alertas:** SweetAlert2.
- **Estructura de Código:** Todo el código debe ser modular. No debe existir lógica pesada en las vistas.
- **Regla de Negocio (Inventario):** Los cálculos de inventario deben priorizar el Análisis ABC (Pareto al 80/20).

### Reglas de Arquitectura y Ahorro de Tokens
1. Para cualquier análisis de código, dependencias o arquitectura en este ERP, TIENES PROHIBIDO leer los archivos fuente directamente de forma masiva.
2. Tu única fuente de verdad para el contexto estructural es Graphify (`graphify query "..."` o `graphify-out/graph.json`).

### Protocolo Preceptivo e Innegociable: Flujo Spec Kit (SDD)
Ante CADA nueva solicitud o requerimiento, es OBLIGATORIO seguir este ciclo secuencial con aprobaciones humanas intermedias:

1. **/speckit.specify:** Crea la especificación base del requerimiento. Responde al "Qué" se va a construir y "Por qué". Usa `graphify query "..."` para consultar el grafo de conocimiento local antes de planificar. **MANDATORIO:** Incluir los 5 diagramas de ingeniería en Mermaid (Flujo de Procesos, Rombos de Decisión, ERD, Secuencia y Arquitectura de Componentes). **PROHIBIDO generar código. Espera la aprobación del usuario.**
2. **/speckit.clarify (Control de Calidad 1):** Realiza preguntas estructuradas para eliminar ambigüedades y mitigar riesgos antes de proponer soluciones técnicas. Usa `graphify query "..."`. **PROHIBIDO generar código. Espera la aprobación del usuario.**
3. **/speckit.checklist:** Genera una lista de verificación de calidad contra los estándares de la industria. Usa `graphify query "..."`. **PROHIBIDO generar código. Espera la aprobación del usuario.**
4. **/speckit.plan:** Crea el plan de implementación técnica (el "Cómo"). Define componentes, esquemas de datos y flujos de información respaldados por los 5 diagramas Mermaid validados. **PROHIBIDO generar código. Espera la aprobación del usuario.**
5. **/speckit.tasks:** Traduce el plan técnico en tareas granulares, secuenciales y accionables. Usa `graphify query "..."`. **PROHIBIDO generar código. Espera la aprobación del usuario.**
6. **/speckit.analyze (Control de Calidad 2):** Reporte de consistencia y alineación cruzada (Spec -> Plan -> Tasks) para detectar fisuras antes de programar. Usa `graphify query "..."`. **PROHIBIDO generar código. Espera la aprobación del usuario.**
7. **/speckit.tasks (Actualización):** Actualiza y ajusta las tareas según el reporte de consistencia anterior. **PROHIBIDO generar código. Espera la aprobación del usuario.**
8. **/speckit.implement (Implementación Quirúrgica TDD):**
   - Ejecuta **UNA SOLA tarea a la vez**.
   - Garantiza que las integraciones operativas existentes no se rompan.
   - Tras finalizar el código de cada tarea, **DETENTE INMEDIATAMENTE y espera la confirmación explícita del usuario** antes de continuar con la siguiente.
   - Valida con el MCP de Chrome DevTools (0 errores en consola JS y móvil 375 px).