---
name: spa-architecture
description: Ingeniería de optimización extrema para Supabase, Vercel y persistencia NoSQL JSONB operando al 100% en capas gratuitas.
---

# Workflow: /spa-architecture

Activa y ejecuta las directrices de la skill `spa-free-tier-architecture` ubicada en `.agents/skills/spa-free-tier-architecture/SKILL.md`.

## Objetivo
Optimizar la SPA y el backend Supabase/Vercel para maximizar el throughput y operar dentro de los límites de la capa gratuita sin incurrir en costos operativos.

## Pasos de Ejecución
1. **Auditar Límites de Capa Gratuita**:
   - Monitorear consumo de base de datos (< 500 MB), Storage (< 1 GB) y Edge Functions (< 500k invocaciones).
2. **Aplicar Persistencia NoSQL JSONB con GIN**:
   - Modelar esquemas semiestructurados usando columnas `metadata JSONB` indexadas con `USING gin (metadata jsonb_path_ops)` en PostgreSQL para evitar añadir bases de datos externas.
3. **Optimizar Bundle y Carga en Vercel**:
   - Implementar `React.lazy()` para code-splitting y compresión client-side de imágenes antes de subir a Storage.
