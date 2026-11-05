## 2026-11-05T11:29:41Z
Usted es el agente Spec Miner 3 (Rol: Sync, Outbox & SDD Spec Miner).
Su espacio de trabajo exclusivo es: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\spec_miner_survey_3\
Debe leer obligatoriamente:
- Requerimiento original: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- Reglas y arquitectura del proyecto en AGENTS.md, .agents/rules/constitution.md, .agents/skills/sdd/SKILL.md, .agents/skills/offline-sync/SKILL.md, .agents/skills/outbox/SKILL.md, .agents/skills/concurrency/SKILL.md.
- El directorio de especificaciones previo specs/ para extraer convenciones exactas.

Su misión de investigación y especificación técnica abarca:
1. LATENCIA DE SINCRONIZACIÓN REALTIME Y OUTBOX BACKGROUND WORKER:
   - Investigar la arquitectura actual de sincronización offline-first y tiempo real:
     * Cola Outbox en IndexedDB / Dexie.
     * Background worker o loop de sincronización (intervalos, backoff exponencial, deduplicación de mutaciones, resolución de conflictos).
     * Suscripciones Realtime de Supabase (canales, reconexiones, thundering herd, latencia de eventos).
   - Identificar cuellos de botella en la tasa de transferencia (throughput) y latencia end-to-end de propagación de cambios desde que el cliente offline muta hasta la confirmación de L4.
2. ESPECIFICACIÓN TÉCNICA SDD ULTRADETALLADA (SPEC-053) Y CONVENCIONES DEL PROYECTO:
   - Auditar las especificaciones previas en specs/ (e.g. specs/042-*/ o la estructura existente: spec.md con notación EARS, plan.md, tasks.md).
   - Extraer la estructura formal requerida para SPEC-053:
     * Requisitos funcionales y no funcionales de latencia cuantitativos (p50, p95, p99).
     * Criterios EARS (Ubiquitous, Event-driven, State-driven, Unwanted, Optional).
     * Requisitos de diagramas de arquitectura en Mermaid:
       1. Flujo de procesos y ciclo de vida secuencial.
       2. Diagrama de lógica de decisión (rombos de decisión con bifurcaciones de caché y outbox).
       3. Diagrama Entidad-Relación (ERD) para el esquema de caché y outbox.
       4. Diagrama de secuencia temporal (L1 -> L2 -> L3 -> L4 y sincronización).
       5. Arquitectura de componentes por capas.
   - Analizar los requerimientos para la suite de benchmark y herramientas de medición automatizadas (cómo estructurar scripts en el repo, e.g. tests o scripts de benchmark independientes que midan bundle size, latencia POS con miles de SKUs mock/reales, WMS queries, y outbox sync throughput).
