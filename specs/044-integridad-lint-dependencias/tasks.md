# Tareas — SPEC-044

- **Estado:** Revisión ampliada pendiente de aprobación
- **WIP:** 1 tarea activa

## T-044.1 — Completar diagnóstico de lint

- Congelar inventario de diagnósticos por archivo y tipos de regla. La línea base actual es 68 errores Hooks (41 dependencias y 27 reglas de orden) en 36 archivos, y un `prefer-const`.
- Mantener plugin/configuración activa sin deshabilitar reglas.
- **Aceptación:** inventario reproducible confirmado; no se altera código de aplicación en esta tarea.
- **Pausa:** detenerse y pedir confirmación antes de la siguiente tarea.

## T-044.2 — Lint en archivos de configuración y bajo riesgo

- Resolver los errores ESLint originales fuera de React Hooks: test arquitectónico, tipo de categoría y advertencia de `outboxSyncService`.
- **Aceptación:** ESLint focalizado pasa; pruebas arquitectónicas/outbox y build pasan.
- **Pausa:** detenerse y pedir confirmación.

## T-044.3 — Corregir orden de Hooks en modales de inventario

- Resolver infracciones de `rules-of-hooks` en `TransferPickingModal`, `TransferReceivingChecklistModal`, `WeightPackingModal` y `RouteManifestBuilderModal`, después del impacto por símbolo.
- **Aceptación:** ESLint focalizado y pruebas de los cuatro modales pasan; se conserva comportamiento cuando modal está cerrado/abierto.
- **Pausa:** detenerse y pedir confirmación.

## T-044.4 — Corregir orden de Hooks en B2B y UI

- Resolver infracciones de `rules-of-hooks` en `B2BItemConfiguratorModal`, `ProductAvatar`, `DevTestDashboard`, `OnScreenKeypadModal`, `BatchCategoryRecalculateModal`, `PriceHistoryAuditDrawer` y `B2BQuotationView`.
- **Aceptación:** ESLint focalizado y pruebas de componentes afectados pasan; orden estable de hooks en todos los estados.
- **Pausa:** detenerse y pedir confirmación.

## T-044.5 — Dependencias de hooks del núcleo y módulos de dominio

- Resolver diagnósticos `exhaustive-deps` en `App.tsx`, `useActionLogger.ts`, `usePricing.ts`, `useVirtualGrid.ts`, `NetworkSyncStatusBadge.tsx`, `CRMView.tsx`, `InventoryView.tsx`, `OrderKanbanView.tsx`, `POSView.tsx`, `CashFlowView.tsx` y `ColdStorageRentalView.tsx`.
- Priorizar pruebas enfocadas; cualquier riesgo HIGH/CRITICAL requiere análisis del símbolo exacto y presentar callers/flujos antes del cambio.
- **Aceptación:** ESLint focalizado y pruebas del módulo pasan sin efectos duplicados, bucles o stale closures.
- **Pausa:** detenerse y pedir confirmación.

## T-044.6 — Dependencias de hooks en inventario, caja y precios

- Resolver diagnósticos `exhaustive-deps` en `EgresoOperativoModal`, `AnalisisAbcWidget`, `BranchSalesReport`, `FishYieldProductionTab`, `InternalTransferKanban`, `KardexTable`, `ProductDetailFinancialModal`, `ProductionForm`, `StockMatrizTable` y `WarehouseTransferPanel`.
- Desambiguar y revisar blast radius para `BranchSalesReport` y `ProductDetailFinancialModal`; ningún candidato crítico se edita sin análisis específico y plan de pruebas.
- **Aceptación:** ESLint focalizado y pruebas específicas pasan; refresh y derivaciones mantienen su semántica.
- **Pausa:** detenerse y pedir confirmación.

## T-044.7 — Dependencias de hooks de POS y nómina

- Resolver diagnósticos `exhaustive-deps` en `CashierKanbanView`, `DispatchScannerModal`, `OnScreenKeypadModal`, `PaymentPanel` y `PayrollWizard3Steps`.
- **Aceptación:** ESLint focalizado y suites POS/caja/nómina relacionadas pasan.
- **Pausa:** detenerse y pedir confirmación.

## T-044.8 — Verificación lint integral

- Ejecutar ESLint en todo `src`, corregir cualquier diagnóstico derivado y ejecutar build más tests afectados.
- **Aceptación:** lint 0 errores/advertencias, sin reglas desactivadas para estos fallos; registrar baseline actualizada. `detect-changes` solo muestra el alcance esperado.
- **Pausa:** detenerse y solicitar aprobación antes de empezar actualizaciones de dependencias.

## T-044.9 — Remediar dependencias vulnerables de producción

- Actualizar los paquetes directos y transitivos de producción que aparezcan vulnerables en una auditoría fresca; limitar overrides a casos justificados.
- Revisar explícitamente los saltos mayores requeridos y los usos/API afectados.
- **Aceptación:** `pnpm audit --prod` no informa advisories corregibles del alcance; build y pruebas focalizadas relacionadas pasan. Documentar todo residual.
- **Pausa:** detenerse y pedir confirmación antes de la siguiente tarea.

## T-044.10 — Remediar dependencias vulnerables de desarrollo

- Actualizar únicamente los paquetes de desarrollo afectados (incluidos Vite/Vitest y su árbol transitivo) con compatibilidad verificada.
- **Aceptación:** `pnpm audit` no informa advisories corregibles del alcance; lockfile coherente; pruebas y compilaciones pasan. Documentar residuales.
- **Pausa:** detenerse y pedir confirmación antes de la siguiente tarea.

## T-044.11 — Verificación integral y detección de alcance

- Ejecutar lint, build frontend, suite Vitest, build recursivo de paquetes, Prisma validate con URLs locales ficticias y ambas auditorías.
- Revisar que no cambió ningún archivo fuera del alcance ni se alteraron los cambios preexistentes.
- **Aceptación:** evidencias registradas y resultado final comunicado; `gitnexus detect-changes` o alternativa equivalente confirma solo el alcance esperado.
- **DevTools:** No aplica si no se modificó UI.
