---
name: multi-tier-cache
description: Arquitectura de caché multinivel (Zustand L1 + IndexedDB L2 + Upstash Redis REST L3 + PostgreSQL L4) y control de concurrencia.
---

# Workflow: /multi-tier-cache

Activa y ejecuta las directrices de la skill `saas-multi-tier-cache` ubicada en `.agents/skills/saas-multi-tier-cache/SKILL.md`.

## Objetivo
Configurar, optimizar o auditar la estrategia de caché multinivel, locks atómicos y control de concurrencia para la SPA sobre Supabase y Upstash Redis.

## Pasos de Ejecución
1. **Determinar el Nivel de Caché Adecuado**:
   - L1 (RAM Zustand): Estado reactivo en memoria activa del navegador (0ms).
   - L2 (IndexedDB): Catálogo maestro, listas de precios y soporte Offline-First.
   - L3 (Upstash Redis REST): Locks de stock en cuartos fríos, rate limiting y métricas precalculadas de Pareto ABC.
   - L4 (PostgreSQL): Fuente transaccional ACID de verdad.
2. **Implementar Patrón Cache-Aside o Stale-While-Revalidate**:
   - Evitar sockets TCP persistentes en Edge/SPA; usar cliente HTTP ligero `@upstash/redis`.
3. **Definir Políticas de Invalidación y TTLs**:
   - Asegurar que mutaciones de inventario invaliden las claves correspondientes.
