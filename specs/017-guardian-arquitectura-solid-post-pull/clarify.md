# Control de Calidad 1: Preguntas Estructuradas de Clarificación (/speckit.clarify)

**Código:** SPEC-017  
**Título:** Guardián de Arquitectura Supremo y Auditoría Continua de Código SOLID Post-Git-Pull (Master Architect)  
**Estado:** PROPUESTO — ESPERANDO CONFIRMACIÓN HUMANA  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — Paso 2 (`/speckit.clarify`)  

---

## 1. Matriz de Ambigüedades y Mitigación de Riesgos

| ID | Dimensión | Ambigüedad Identificada | Riesgo Asociado | Solución Técnica Propuesta (Recomendada) |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | **Severidad y Bloqueo en Post-Pull** | ¿Debe el script post-pull detener el proceso con fallo si detecta código frágil, o emitir un reporte diagnósticador? | Bloquear falsos positivos podría frenar el inicio de sesión; no bloquear podría dejar pasar código frágil. | **Enfoque Semáforo Híbrido:** Bloqueo estricto (`exit code 1`) ante violaciones críticas (ej. infraestructura en dominio o fallas de compilación) y emisión de Scorecard de advertencias accionables para deuda técnica menor. |
| **Q2** | **Motor de Detección Arquitectónica** | ¿Qué tecnología debe ejecutar la auditoría de SOLID y Límites Arquitectónicos? | Depender de herramientas externas pesadas o licencias de terceros aumentaría complejidad y tiempo de pull. | **Script Determinista Ultraligero Node.js (`scripts/architecture/audit-solid-boundaries.cjs`):** Inspecciona el árbol de código en < 2 segundos validando matriz de imports permitidos/prohibidos, límites de tamaño SRP y acoplamiento. |
| **Q3** | **Alcance de la Regla "Aislamiento de Dominio"** | ¿Cuáles carpetas se consideran formalmente "Dominio Puro" en el ERP? | Confusión entre stores Zustand, servicios de orquestación y modelos de datos. | **Definición Canónica:** `src/types/`, contratos de negocio y servicios de cálculo determinista son Núcleo Puro (prohibido importar `@supabase`, `axios`, etc.). `src/services/` son casos de uso; `src/views/` son presentación pura. |
| **Q4** | **Regla Anti-Patrón "Controlador/Vista Gorda"** | ¿Cuál es el criterio formal para rechazar una vista React como "Controladora Gorda"? | Subjetividad en las revisiones de código de frontend. | **Criterio Fijo:** Prohibido en `src/views/`: 1) Queries o mutaciones directas a Supabase (deben pasar por stores/servicios); 2) Cálculos tributarios o de retenciones NIIF duplicados (deben usar `financialAuditService` o `b2bSalesService`); 3) Archivos > 600 líneas sin modularización en componentes atómicos. |
| **Q5** | **Permanencia y Gobernanza en los Agentes** | ¿Dónde debe quedar anclada la directiva para que todos los subagentes la acaten? | Pérdida de contexto si un subagente no lee los archivos de reglas. | **Anclaje Tripartito:** 1) `.agent/rules/master-architect-solid.md`, 2) `AGENTS.md` (resumen ejecutivo vinculante), y 3) Hook de ciclo de vida en `scripts/lifecycle/post-pull.cjs`. |

---

## 2. Recomendación de Diseño Arquitectónico

Se recomienda formalizar estas 5 resoluciones para blindar la fábrica de software sin ralentizar la experiencia de desarrollo, asegurando que cada `git pull` sea recibido por el Master Architect con un reporte de cumplimiento en consola.
