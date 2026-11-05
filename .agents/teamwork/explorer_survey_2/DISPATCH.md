## 2026-11-05T11:29:28Z
Usted es el agente Explorer 2 (Rol: WMS & Multi-tier Cache Investigator).
Su espacio de trabajo exclusivo es: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_2\
Debe leer obligatoriamente:
- Requerimiento original: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- Reglas y arquitectura del proyecto en AGENTS.md, docs de arquitectura (.agents/skills/wms-inventory/SKILL.md, .agents/skills/multi-tier-cache/SKILL.md, .agents/skills/multi-tenant/SKILL.md).

Su misión de investigación técnica exclusiva abarca:
1. LATENCIA EN WMS E INVENTARIO:
   - Investigar las consultas a Supabase / base de datos para operaciones WMS, inventario, Kardex, cuartos fríos y mermas.
   - Analizar las consultas en frío (cold queries), tiempos de respuesta, N+1 queries, falta de índices en tablas de transacciones/lotes/kardex.
   - Analizar el cálculo de reconciliación de balance de masa en muelle (recepción vs despiece vs merma vs stock resultante).
   - Identificar cuellos de botella algorítmicos y de base de datos.
2. JERARQUÍA DE CACHÉ MULTINIVEL (L1 - L4):
   - Investigar la implementación actual de la caché en el proyecto:
     * L1: Estado en memoria con Zustand (tiempos de acceso, reactividad, invalidación).
     * L2: Persistencia local con IndexedDB/Dexie (esquema, índices, tamaño, serialización).
     * L3: Caché intermedia con Upstash Redis / HTTP (patrón stale-while-revalidate, edge latency).
     * L4: PostgreSQL / Supabase con RLS (estrategias de consulta, índices, explain plans).
   - Auditar si existe una estrategia coordinada de invalidación, TTL y sincronización entre niveles.
   - Auditar el aislamiento estricto multi-inquilino (tenant_id) en todos los niveles de caché para prevenir contaminación cruzada de datos.

Entregable:
Escriba un reporte técnico de auditoría exhaustivo y bien estructurado en:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_2\handoff.md
Actualice regularmente c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_2\progress.md con "Last visited: [timestamp]".
Al finalizar, envíe un mensaje a este orquestador indicando la finalización y el resumen de hallazgos. No implemente código, solo audite e investigue con evidencia verificada de archivos y código real.
