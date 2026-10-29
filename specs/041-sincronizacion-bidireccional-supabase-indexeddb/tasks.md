# Lista de Tareas Atómicas de Implementación: SPEC-041 (Finalizada & Certificada)
## Sincronización Bidireccional Supabase <-> IndexedDB (Flujo Multivendedor con Caja Única & Búsqueda Sub-2ms)

- **Código:** SPEC-041
- **Fase:** Spec Kit SDD v3.0 — `/speckit.implement (Completado y Certificado)`
- **Estado:** 100% IMPLEMENTADO Y CERTIFICADO (28/28 tests pasando, 0 errores tsc, DevTools verificado)
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Validación QualityEngineer:** Concurrencia multivendedor con taquilla central, contratos Zod, OCC CLIENT_WINS con delta, Web Worker de 500 registros, DLQ no bloqueante y motor de búsqueda sub-2ms.

---

### Tablero Kanban de Implementación (Límite WIP = 1)

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│     EN PROCESO (WIP = 1)        │            POR HACER            │           TERMINADO             │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ (Ninguna tarea activa)          │ (Cola de SPEC-041 vacía)        │ ✅ TASK-041-01: Esquemas Zod    │
│                                 │                                 │ ✅ TASK-041-02: OCC & Store     │
│                                 │                                 │ ✅ TASK-041-03: SyncWorker & 2ms│
│                                 │                                 │ ✅ TASK-041-04: UI POS & DevTool│
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

---

### Detalle Granular de Tareas

#### ✅ `TASK-041-01` (COMPLETADA): Esquemas Zod y Validadores de Deltas de Sincronización (`deltaSync.schema.ts`)
- **Objetivo:** Definir y validar los contratos de datos en tiempo de ejecución para la Outbox, preventas multivendedor, metadatos de sincronización y registros de colisión OCC.
- **Archivos:**
  - `src/types/deltaSync.schema.ts`
  - `src/tests/deltaSync.schema.test.ts`
- **Resultado:** 14/14 tests pasando (100% verde).

---

#### ✅ `TASK-041-02` (COMPLETADA): Manejador de Conflictos OCC e Integración de Store con Caja Única (`useOutboxSyncStore`)
- **Objetivo:** Implementar la lógica de cola Outbox en IndexedDB, el motor de resolución OCC (`CLIENT_WINS`, `SERVER_WINS`, `MERGE_DELTA`), el Dead-Letter Queue (DLQ) para errores fatales, y conectar la cola central de preventas con `PendingOrdersDrawer`.
- **Archivos:**
  - `src/services/tenantIndexedDbService.ts`
  - `src/stores/useOutboxSyncStore.ts`
  - `src/tests/outboxSyncOcc.test.ts`
- **Resultado:** 6/6 tests pasando (100% verde).

---

#### ✅ `TASK-041-03` (COMPLETADA): Web Worker Off-Thread (`syncWorker`) y Refresco Incremental Sub-2ms
- **Objetivo:** Construir el Web Worker de sincronización en segundo plano con chunking de 500 registros, backoff exponencial ante caídas de red, y motor de actualización incremental delta para búsqueda de ítems a $\le 2\text{ ms}$.
- **Archivos:**
  - `src/workers/syncWorker.worker.ts`
  - `src/workers/syncWorkerService.ts`
  - `src/workers/searchEngineCore.ts`
  - `src/services/fastItemSearchEngine.ts`
  - `src/tests/syncWorkerBatch.test.ts`
- **Resultado:** 6/6 tests pasando (100% verde).

---

#### ✅ `TASK-041-04` (COMPLETADA): Integración UI POS, Comandas en Caja Única y Certificación DevTools
- **Objetivo:** Enlazar la emisión multivendedor desde `useMultiVendorPosStore` con `PendingOrdersDrawer` en `POSView.tsx`, verificar la actualización reactiva del badge de red y certificar con Chromium DevTools.
- **Archivos:**
  - `src/views/POSView.tsx`
  - `src/components/layout/NetworkSyncStatusBadge.tsx`
  - `src/tests/multiVendorCashierSync.test.tsx`
- **Resultado:** 2/2 tests pasando (100% verde), 0 errores TypeScript (`npx tsc --noEmit`), 0 errores consola DevTools en desktop y mobile (375px).
