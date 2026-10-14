---
description: Protocolo de interrogatorio continuo activo para eliminar ambigüedades y desafiar suposiciones antes de programar o mover tareas.
argument-hint: "[tema o tarea a interrogar]"
---

# Workflow: /grill-me
## Protocolo de Interrogatorio Continuo Activo

### Propósito
Interrogar exhaustivamente cada requerimiento ambiguo, desafiar suposiciones operativas y profundizar en los detalles técnicos y de negocio antes de aprobar cualquier fase o escribir cualquier línea de código de producción.

### Principios Fundamentales
1. **Cero Adivinanzas:** El sistema tiene prohibido asumir parámetros de negocio, flujos ocultos o decisiones de arquitectura no fundamentadas.
2. **Inspección Previa del Código:** Si una duda puede resolverse explorando el código, los tests o los esquemas existentes (`packages/validation-schemas`, `src/services`, `src/types`), el agente debe investigar primero antes de preguntar.
3. **Preguntas Estructuradas Una a la Vez:** Se formulan preguntas secuenciales y precisas utilizando la herramienta `ask_question`, acompañadas siempre de una opción recomendada bien fundamentada.
4. **Resolución de Árbol de Dependencias:** Resolver las decisiones paso a paso (ej. Modelo de datos $\rightarrow$ Lógica de negocio $\rightarrow$ UX/UI $\rightarrow$ Validaciones de frontera).

### Pasos de Ejecución
1. **Identificar la Incertidumbre o Frontera de Decisión:** Localizar el punto ciego en la tarjeta Kanban o documento de arquitectura activo.
2. **Consultar la Base de Código:** Validar modelos de datos, servicios existentes (`cashService`, `branchInventoryService`, etc.) y contratos Zod.
3. **Formular la Pregunta con `ask_question`:**
   - Presentar contexto claro y conciso.
   - Ofrecer alternativas viables con la opción `(Recommended)` al inicio.
   - Permitir al usuario seleccionar o escribir su respuesta.
4. **Incorporar la Decisión:** Registrar la resolución en los documentos base correspondientes (PRD, TRD, App Flow, Design Brief, Backend Schema o Plan) y en `MEMORY.md`.
