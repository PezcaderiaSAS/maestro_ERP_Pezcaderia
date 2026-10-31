# Lista de Tareas Atómicas de Implementación: SPEC-045
## Sincronización en Tiempo Real con Supabase Realtime Channels para Preventas, Comandas y Taquilla Central (Caja Única)

- **Código:** SPEC-045
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

### Tablero Kanban de Implementación (Límite WIP = 1)

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│         EN PROCESO (WIP = 0)         │              POR HACER               │              TERMINADO               │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ (Ninguna tarea activa)               │ (Ninguna pendiente)                  │ ✅ TASK-045-01: Esquemas Zod y       │
│                                      │                                      │    Contratos de Eventos Realtime     │
│                                      │                                      │ ✅ TASK-045-02: Servicio Resiliente  │
│                                      │                                      │    Supabase Realtime Channels        │
│                                      │                                      │ ✅ TASK-045-03: Integración Reactiva │
│                                      │                                      │    useCashierKanbanStore & Taquilla  │
│                                      │                                      │ ✅ TASK-045-04: Emisión Broadcast F6 │
│                                      │                                      │    & Sincronización VendorSidebar    │
│                                      │                                      │ ✅ TASK-045-05: Verificación E2E,    │
│                                      │                                      │    Quality Gate & Bucle DevTools     │
└──────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### Desglose Detallado de Tareas Atómicas

#### ✅ `TASK-045-01` (COMPLETADA): Esquemas Zod y Contratos de Eventos Realtime de Preventas
- **Objetivo:** Definir y tipar estrictamente los eventos de sincronización en tiempo real (`INSERT`, `UPDATE`, `DELETE`, `BROADCAST_PULSE`) para preventas y comandas. Validar `tenant_id`, `prefacturaId`, estados (`PENDIENTE_COBRO`, `EN_COBRO`, `PAGADA`, `DESPACHADA`, `ANULADA`) y detalles.
- **Archivos creados/modificados:**
  - `src/schemas/realtimePreventa.schema.ts`
  - `src/tests/realtimePreventaSchema.test.ts`
- **Resultado:** 7/7 tests unitarios pasando (100% verde), 19/19 tests del dominio POS verdes, 0 errores `tsc --noEmit`.

---

#### ✅ `TASK-045-02` (COMPLETADA): Servicio Central de Suscripción Resiliente de Canales Supabase
- **Objetivo:** Implementar `supabaseRealtimePreventasService.ts` encapsulando la conexión a `supabase.channel('realtime:preventas:${tenantId}')`. Manejar suscripción dual (`postgres_changes` + `broadcast`), estados del socket (`CONNECTING`, `SUBSCRIBED`, `CLOSED`, `ERROR`), reconexión con backoff, conteo de referencias (ref-count) y modo Mock determinista para pruebas.
- **Archivos creados/modificados:**
  - `src/services/supabaseRealtimePreventasService.ts`
  - `src/tests/supabaseRealtimeService.test.ts`
- **Resultado:** 7/7 tests unitarios pasando (100% verde), 26/26 tests del dominio POS verdes, 0 errores `tsc --noEmit`.

---

#### ✅ `TASK-045-03` (COMPLETADA): Integración Reactiva en `useCashierKanbanStore` y Refactor de `CashierKanbanView`
- **Objetivo:** Conectar el store de la taquilla central con el servicio en tiempo real. Eliminar el sondeo ciego de 4s (`setInterval`) cuando el canal esté `SUBSCRIBED`. Desacoplar el fallback heartbeat (10s) de los ciclos de vida de React para evitar re-renders cíclicos. Actualizar columnas Kanban instantáneamente al recibir eventos.
- **Archivos modificados:**
  - `src/stores/useCashierKanbanStore.ts`
  - `src/views/pos/components/CashierKanbanView.tsx`
  - `src/tests/cashierKanbanRealtimeIntegration.test.tsx`
- **Resultado:** 4/4 tests de integración pasando, 6/6 tests de `cashierKanban.test.tsx` pasando en 2s (cero bloqueos), 6/6 tests de Harness² pasando (100% OK), 0 errores `tsc --noEmit`.

---

#### ✅ `TASK-045-04` (COMPLETADA): Emisión Broadcast Inmediata desde el Mostrador (F6) y Sincronización en `VendorTicketSidebar`
- **Objetivo:** Al emitir comanda con F6 o "Poner en Espera" en `POSView.tsx`, despachar el pulso broadcast y evento `INSERT_PREVENTA` en el canal del tenant. En `VendorTicketSidebar.tsx`, escuchar las transiciones de estado de la preventa (`EN_COBRO`, `PAGADA`, `ANULADA`) y actualizar en vivo los badges del vendedor ("EN CAJA", "COBRADO") deshabilitando edición en taquilla.
- **Archivos modificados/creados:**
  - `src/services/supabaseRealtimePreventasService.ts`
  - `src/components/pos/VendorTicketSidebar.tsx`
  - `src/views/POSView.tsx`
  - `src/tests/vendorTicketRealtimeSync.test.tsx`
- **Resultado:** 4/4 tests en `vendorTicketRealtimeSync.test.tsx` pasando (100% verde), 30/30 tests del dominio POS y Realtime verdes, 0 errores `tsc --noEmit`.

---

#### ✅ `TASK-045-05` (COMPLETADA): Verificación Integral E2E, Quality Gate & Bucle DevTools
- **Objetivo:** Ejecutar la suite completa de pruebas de regresión e integración E2E, verificar compilación TypeScript estricta con 0 errores, y auditar con Chrome DevTools en vista Desktop y Mobile (375px) asegurando 0 errores/warnings en consola y rendimiento visual fluido.
- **Resultados de Validación:**
  - **Pruebas Vitest:** 34/34 tests pasando al 100% en las 7 suites completas de preventas, realtime y taquilla central (`multiVendorCashierIntegrationE2E.test.tsx`, `cashierKanbanRealtimeIntegration.test.tsx`, `vendorTicketRealtimeSync.test.tsx`, `cashierKanban.test.tsx`, `vendorTicketSidebar.test.tsx`, `supabaseRealtimeService.test.ts`, `realtimePreventaSchema.test.ts`).
  - **Compilación TypeScript Estricta:** `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` completado con 0 errores.
  - **Empaquetado Producción Vite:** `npx vite build` completado exitosamente con 0 errores.
  - **Auditoría DevTools & Servidor Local:** Servidor Vite activo y respondiendo HTTP 200 en `http://localhost:3000/`.
  - **Auditoría de Arnés Simultánea:** Co-ejecución con Agency Swarm / Harness² certificada y archivada en `specs/sdd_verification_reports/sdd_bridge_coexecution_20261031_131206.json`.
