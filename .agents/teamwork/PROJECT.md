# Project: SPEC-053 Latency Minimization & SDD Engineering Plan

## Architecture Overview
MaestroPescaderia ERP es una plataforma empresarial multi-inquilino (multi-tenant) de alto rendimiento para la comercialización, distribución, cuartos fríos (WMS) y punto de venta (POS) de productos perecederos del mar.
La arquitectura de latencia cero se estructura en 5 subsistemas críticos:
1. **Frontend Core & Bundle Management**: Code splitting con `React.lazy()`, dynamic imports en librerías pesadas (ExcelJS, jsPDF, Sentry, LogRocket), manualChunks optimizados en Vite y prefetching inteligente.
2. **POS Mostrador Engine**: Motor de búsqueda sub-50ms indexado off-thread (Web Worker con `SearchEngineCore`), virtualización con `VirtualCatalogGrid`, y aislamiento del estado del carrito para eliminar re-renders en `POSView`.
3. **WMS, Kardex & Masa Balance**: Persistencia relacional ACID en PostgreSQL/Supabase, índices compuestos para FEFO (`tenant_id, expiration_date`), paginación de Kardex con cursores y consolidación del balance de masa en muelle.
4. **Jerarquía de Caché Multinivel (L1-L4)**:
   - **L1**: Zustand unificado en memoria con selectores atómicos por tenant.
   - **L2**: IndexedDB nativo multi-tenant (`PezcaderiaERP_{tenantId}`) para catálogos, stock y transacciones.
   - **L3**: Upstash Redis REST con patrón Stale-While-Revalidate para stock en mostrador y locks distribuidos.
   - **L4**: Supabase PostgreSQL con RLS optimizado (sin subconsultas en `stock_bodegas`) y RPCs protegidos con verificación de JWT claims.
5. **Realtime Sync & Outbox Worker**: Cola outbox transaccional unificada, sincronización en background por lotes (batching HTTP), backoff exponencial con jitter y WebSockets con reconexión resiliente anti-thundering herd.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Desglose y Auditoría de Bundle Size | Documentación de los 4,609 kB actuales, dependencias pesadas y fugas en path crítico | M2 | Survey Explorer 1 |
| 2 | Diagnóstico de Cuellos de Botella en POS | Análisis del bloqueo por `.includes()`, 10,000 lecturas síncronas de stock y re-renders | M2 | Survey Explorer 1 |
| 3 | Diagnóstico de WMS, Kardex y Balance de Masa | Identificación de 4 orígenes desconectados, consultas frías sin índices y despiece en localStorage | M2 | Survey Explorer 2 |
| 4 | Diagnóstico de Caché Multinivel L1-L4 | Detección de brecha en L3 (0% Upstash), fragmentación en L1/L2 y vulnerabilidad RPC | M2 | Survey Explorer 2 |
| 5 | Diagnóstico de Realtime y Outbox Sync | Identificación de transmisión serial O(N), debounce de 2s y thundering herd | M2 | Survey Spec Miner 3 |
| 6 | Script Benchmark Bundle Size | Script ejecutable que analiza el output de build de Vite, tamaño de chunks y gzip | M1 | Survey Spec Miner 3 |
| 7 | Script Benchmark Latencia POS | Script ejecutable que simula búsqueda y adición al carrito con 16,000 SKUs y mide p50, p95, p99 | M1 | Survey Spec Miner 3 |
| 8 | Script Benchmark Consultas WMS | Script que evalúa tiempos de consulta de Kardex, lotes FEFO y balance de masa | M1 | Survey Spec Miner 3 |
| 9 | Script Benchmark Outbox Throughput | Script que mide la tasa de inserción y vaciado (ops/sec) de la cola de transacciones | M1 | Survey Spec Miner 3 |
| 10 | Runner Unificado de Benchmarks | Comando unificado `npm run benchmark:latency` que genera reporte consolidado | M1 | Survey Spec Miner 3 |
| 11 | Especificación SDD SPEC-053 (spec.md) | Especificación en notación EARS formal con requisitos cuantitativos y cualitativos | M2 | Survey Spec Miner 3 |
| 12 | Plan Técnico de Arquitectura (plan.md) | Plan técnico con los 5 diagramas canónicos de Mermaid validados contra directrices | M2 | Survey Spec Miner 3 |
| 13 | Desglose de Tareas Atómicas (tasks.md) | Desglose granular con criterios de verificación independientes y aislamiento multi-tenant | M2 | Survey Spec Miner 3 |
| 14 | Informe de Auditoría Consolidado | Informe técnico integral de auditoría (audit-report.md) con evidencia de código | M2 | All Explorers |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Automated Benchmark Suite | Scripts ejecutables en `scripts/benchmark/` para bundle, POS, WMS y Outbox con runner unificado | Survey | DONE |
| M2 | SDD SPEC-053 Engineering Specification | Especificación formal en `specs/053-latency-optimization-sdd/` (`spec.md`, `plan.md`, `tasks.md`, `audit-report.md`) con los 5 diagramas Mermaid | Survey | DONE |
| M3 | Multi-Agent Review & Challenge | Auditoría de código y diseño por 2 Reviewers, 2 Challengers, 1 Critic y 1 Forensic Auditor | M1, M2 | DONE (PASS) |

---

## Interface Contracts
### Benchmark Runner ↔ Individual Benchmark Scripts
- Cada script exporta una función `runBenchmark(): Promise<BenchmarkResult>`
- `BenchmarkResult`: `{ suite: string; metrics: Record<string, number>; passed: boolean; details?: string }`
- Salida estándar por consola y guardado estructurado en JSON/Markdown.

### L1 Zustand ↔ L2 IndexedDB ↔ L3 Redis ↔ L4 Supabase
- Contrato de aislamiento multi-tenant:
  ```ts
  interface TenantContext {
    tenantId: string;
    branchId: string;
    userId: string;
  }
  ```
- Todas las claves de caché y transacciones outbox deben incorporar obligatoriamente `tenantId` como primer calificador de namespace: `tenant:${tenantId}:...`.

---

## Code Layout
- `scripts/benchmark/`: Scripts ejecutables de benchmark y análisis de latencia.
  - `measure-bundle-size.ts`: Análisis estático y dinámico de chunks Vite.
  - `benchmark-pos-latency.ts`: Medición microbench de búsqueda y adición en POS (16K SKUs).
  - `benchmark-wms-queries.ts`: Medición de consultas frías de WMS, Kardex y FEFO.
  - `benchmark-outbox-sync.ts`: Medición de throughput y latencia de cola Outbox.
  - `run-benchmarks.ts`: Runner unificado con exportación de reporte.
- `specs/053-latency-optimization-sdd/`:
  - `spec.md`: Requisitos funcionales/no-funcionales cuantitativos en notación EARS.
  - `plan.md`: Arquitectura técnica y los 5 diagramas obligatorios de Mermaid.
  - `tasks.md`: Plan de implementación secuencial con tareas atómicas a prueba de errores.
  - `audit-report.md`: Diagnóstico y auditoría exhaustiva consolidada de los 5 módulos críticos.
