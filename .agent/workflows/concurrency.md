---
name: concurrency
description: Control de concurrencia de usuarios simultáneos, OCC, locks distribuidos en Redis y transacciones atómicas en Supabase.
---

# Workflow: /concurrency

Activa y ejecuta las directrices de la skill `erp-concurrency-async-engine` ubicada en `.agents/skills/erp-concurrency-async-engine/SKILL.md`.

## Pasos de Ejecución
1. **Determinar la Estrategia de Concurrencia**:
   - Optimistic Concurrency Control (OCC) con columna `version` para catálogos y precios.
   - Pessimistic Locking (`SELECT FOR UPDATE`) para reservas de lotes WMS y consecutivos de factura.
   - Locks distribuidos atómicos en Upstash Redis (`SET NX EX`) para control de sesiones activas y edge.
2. **Implementar Manejo de Error 409 Conflict**:
   - Devolver respuestas amigables al usuario con los datos modificados para resolución manual o reintento automático.
