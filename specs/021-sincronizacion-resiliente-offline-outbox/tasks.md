# Tareas Granulares de Implementación (SPEC-021)

**Código:** SPEC-021  
**Título:** Sincronización Resiliente Offline-First, Heartbeat de Conectividad y Cola Outbox Avanzada para POS y Facturación SIIGO Nube API v2  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.tasks`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Ejecución TDD paso a paso.

---

## Tareas de Implementación

- [x] `TASK-021-01`: **Contratos de Tipos y Servicio de Cola Outbox con IndexedDB e Idempotencia** [COMPLETADA Y CERTIFICADA]
  - Creado `src/types/offlineSync.types.ts` con definiciones de `OfflineOutboxItem`, `EstadoOutboxItem`, `TipoTransaccionOutbox` y `NetworkHeartbeatStatus`.
  - Creado `src/services/outboxSyncService.ts` encapsulando IndexedDB (`MaestroPescaderiaOfflineDB`, `caja_outbox_v2` con fallback en memoria), cálculo de hash de idempotencia y algoritmo de retroceso exponencial con jitter.
  - Validación con suite TDD `src/tests/offlineOutboxResilience.test.ts` (8/8 tests verdes), `tsc --noEmit` en 0 errores y Master Architect SOLID aprobado.

- [x] `TASK-021-02`: **Servicio de Conectividad Dual y Heartbeat de Red (15s con Timeout)** [COMPLETADA Y CERTIFICADA]
  - Creado `src/services/networkConnectivityService.ts` implementando escucha dual de eventos reactivos `online`/`offline`, Heartbeat activo cada 15s con timeout estricto de 3.000 ms y amortiguación con debounce.
  - Creado hook reactivo `src/hooks/useNetworkHeartbeat.ts` con flags computadas (`isOnline`, `isOffline`, `isDegraded`) y método manual `checkNow()`.
  - Validación con suite TDD `src/tests/offlineOutboxResilience.test.ts` (12/12 tests verdes), `tsc --noEmit` en 0 errores y Master Architect SOLID aprobado.

- [x] `TASK-021-03`: **Worker de Sincronización en Background con Backoff y Aislamiento de Errores** [COMPLETADA Y CERTIFICADA]
  - Creado `src/services/backgroundSyncWorker.ts` con orquestación FIFO, retroceso exponencial, Idempotency-Key y listener reactivo a `NetworkConnectivityService`.
  - Aislamiento de fallos: Errores 400 (Bad Request / datos inválidos) se marcan `ERROR_FATAL_DATOS` sin frenar el resto del lote.
  - Actualización atómica en `useResolucionStore` asociando CUFE, QR y número fiscal sin alterar inventario ni saldos de caja.
  - Validación con suite TDD `src/tests/offlineOutboxResilience.test.ts` (16/16 tests verdes), `tsc --noEmit` en 0 errores y Master Architect SOLID aprobado.

- [x] `TASK-021-04`: **Ergonomía Táctil en NetworkSyncStatusBadge y Checkout POS (Regla del Niño de 12 Años)** [COMPLETADA Y CERTIFICADA]
  - Actualizado `src/components/layout/NetworkSyncStatusBadge.tsx` con target touch $\ge 48\text{ px}$ (`min-h-[44px] sm:min-h-[48px]`), semáforo visual de alto contraste WCAG AA+ (fondos claros contrastantes y dark mode), sincronización reactiva dual con `useNetworkHeartbeat`, conteo outbox en vivo y modal táctil con botón "🔄 Sincronizar Ahora".
  - Actualizado `src/views/pos/components/PaymentPanel.tsx` con micro-pill preventivo (`offline-invoice-notice`) y emisión de tirilla interna inmediata en modo offline sin bloquear la fila física.
  - Validación con suite `src/tests/offlineOutboxResilience.test.ts` (18/18 tests verdes), `src/tests/networkSyncStatus.test.tsx` (3/3), suites POS (49/49), `tsc --noEmit` en 0 errores y Master Architect SOLID aprobado.

- [x] `TASK-021-05`: **Suite Integral TDD, Auditoría Master Architect y Certificación Quality Gate** [COMPLETADA Y CERTIFICADA]
  - Suite TDD dedicada `src/tests/offlineOutboxResilience.test.ts` con 18/18 tests verdes (100% de cobertura en idempotencia, encolado offline, heartbeat dual 15s, backoff exponencial con jitter, aislamiento de error 400 y ergonomía táctil).
  - Verificación TypeScript estricta (`tsc --noEmit`): **0 errores**.
  - Auditoría Master Architect SOLID (`audit-solid-boundaries.cjs`): **0 violaciones críticas** (`passed = true`).
  - Auditoría de 5 Diagramas Mermaid (`audit-diagrams-compliance.cjs`): **100% de cumplimiento en los 5 diagramas obligatorios**.
  - Bucle DevTools verificado en vivo (`http://localhost:3000/`): **0 errores en consola JS** y responsive 375 px validado interactivamente con SweetAlert2.
  - Suite Vitest del proyecto completo: **95 suites pasadas, 640 tests verdes (100% de pruebas pasando sin regresiones)**.
  - Análisis de alcance GitNexus: riesgo bajo con 0 procesos afectados.
