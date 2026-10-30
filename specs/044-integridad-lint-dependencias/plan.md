# Plan técnico — SPEC-044

- **Estado:** Revisión ampliada pendiente de aprobación
- **Precondición:** Preservar todos los cambios que ya estaban en el árbol de trabajo; aislar este alcance en los archivos enumerados.

## Línea base observada

- ESLint 8.57.1 y `@typescript-eslint` 7.18.0; TypeScript 5.9.3 está fuera del rango declarado por esa versión del parser.
- ESLint no carga `eslint-plugin-react-hooks`; por ello fallan directivas de `react-hooks/exhaustive-deps` en `useOtifMetrics.ts` y `BranchSalesReport.tsx`.
- Otros errores: regla `no-var-requires` en `architecturalBoundaries.test.ts` y `ban-types` en `cash.types.ts`. Dos advertencias `prefer-const`.
- Auditoría: rutas directas vulnerables para `jspdf` y `axios`; `zod` es compartido con `packages/validation-schemas`. Vulnerabilidades transitivas incluyen Express/body-parser/qs, ExcelJS y su árbol, DOMPurify y dependencias de desarrollo de Vite/Vitest.
- Activar las reglas de Hooks reveló 68 errores en 36 archivos: `react-hooks/exhaustive-deps` (41) y `react-hooks/rules-of-hooks` (27), más un `prefer-const` en `ProductDetailFinancialModal.tsx`.

## Enfoque

1. Mantener `eslint-plugin-react-hooks` activo, con ambas reglas a nivel `error`, y `@typescript-eslint` alineado a TypeScript 5.9.3.
2. Corregir primero las llamadas condicionales a hooks moviendo hooks antes de retornos tempranos o extrayendo componentes/hooks cuando sea necesario; nunca cambiar el orden de hooks por render.
3. Corregir `exhaustive-deps` según los cierres reales: estabilizar funciones con `useCallback` solo cuando corresponda, derivar valores durante render, ajustar estado funcional, y conservar explícitamente señales de recarga. No añadir dependencias que creen ciclos ni eliminar dependencias para silenciar el linter.
4. Antes de cada tarea de código, ejecutar `impact` GitNexus para todos los símbolos modificados; informar blast radius. Para riesgo HIGH/CRITICAL, explicar el alcance y hacer cambios quirúrgicos con pruebas enfocadas antes de seguir. Las consultas ambiguas se deben desambiguar por archivo/símbolo, nunca suponer riesgo bajo.
5. Dividir la remediación en tareas WIP=1 por dominio/archivo y detenerse tras cada tarea completada para pedir confirmación antes de la siguiente. La fase de dependencias empieza solo después de finalizar y aprobar la fase lint.
6. Remediar advisories con inventario fresco. Preferir parches dentro del major; para majors requeridos, inspeccionar usos/API y adaptar con pruebas. Para transitivas, actualizar primero el padre; usar `pnpm.overrides` solo con justificación y compatibilidad demostrada.
7. No actualizar indiscriminadamente a `latest`; mantener Prisma, React, Tailwind y majors no afectados estables. Evitar pruebas de red/base de datos.
8. Tras cada tarea ejecutar lint, build y tests focalizados. Al cierre ejecutar suite completa, build recursivo, Prisma validate con URLs locales ficticias y ambas auditorías.

## Inventario React Hooks al 2026-10-30

Los conteos son diagnósticos ESLint, no necesariamente símbolos distintos. Una tarea puede cubrir varias infracciones del mismo archivo; no puede dar por terminada una sin re-ejecutar ESLint focalizado.

| Archivo | Errores Hooks | Diagnósticos |
|---|---:|---|
| `src/App.tsx` | 6 | exhaustive-deps |
| `src/components/common/ProductAvatar.tsx` | 1 | rules-of-hooks |
| `src/components/layout/NetworkSyncStatusBadge.tsx` | 1 | exhaustive-deps |
| `src/dev/DevTestDashboard.tsx` | 1 | rules-of-hooks |
| `src/hooks/useActionLogger.ts` | 1 | exhaustive-deps |
| `src/hooks/usePricing.ts` | 1 | exhaustive-deps |
| `src/hooks/useVirtualGrid.ts` | 1 | exhaustive-deps |
| `src/views/CRMView.tsx` | 1 | exhaustive-deps |
| `src/views/InventoryView.tsx` | 2 | exhaustive-deps |
| `src/views/OrderKanbanView.tsx` | 1 | exhaustive-deps |
| `src/views/POSView.tsx` | 4 | exhaustive-deps |
| `src/views/b2b/portal/components/B2BItemConfiguratorModal.tsx` | 7 | rules-of-hooks |
| `src/views/cash/CashFlowView.tsx` | 3 | exhaustive-deps |
| `src/views/cash/components/EgresoOperativoModal.tsx` | 1 | exhaustive-deps |
| `src/views/coldStorageRental/ColdStorageRentalView.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/AnalisisAbcWidget.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/BranchSalesReport.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/FishYieldProductionTab.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/InternalTransferKanban.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/KardexTable.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/ProductDetailFinancialModal.tsx` | 1 | exhaustive-deps + 1 prefer-const |
| `src/views/inventory/components/ProductionForm.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/RouteManifestBuilderModal.tsx` | 2 | rules-of-hooks |
| `src/views/inventory/components/StockMatrizTable.tsx` | 1 | exhaustive-deps |
| `src/views/inventory/components/TransferPickingModal.tsx` | 5 | rules-of-hooks |
| `src/views/inventory/components/TransferReceivingChecklistModal.tsx` | 4 | rules-of-hooks |
| `src/views/inventory/components/WarehouseTransferPanel.tsx` | 2 | exhaustive-deps |
| `src/views/inventory/components/WeightPackingModal.tsx` | 2 | rules-of-hooks |
| `src/views/payroll/components/PayrollWizard3Steps.tsx` | 1 | exhaustive-deps |
| `src/views/pos/components/CashierKanbanView.tsx` | 1 | exhaustive-deps |
| `src/views/pos/components/DispatchScannerModal.tsx` | 1 | exhaustive-deps |
| `src/views/pos/components/OnScreenKeypadModal.tsx` | 2 | exhaustive-deps + rules-of-hooks |
| `src/views/pos/components/PaymentPanel.tsx` | 2 | exhaustive-deps |
| `src/views/pricing/components/BatchCategoryRecalculateModal.tsx` | 3 | rules-of-hooks |
| `src/views/pricing/components/PriceHistoryAuditDrawer.tsx` | 2 | rules-of-hooks |
| `src/views/quotations/B2BQuotationView.tsx` | 1 | rules-of-hooks |

El inventario GitNexus ya señala blast radius crítico para `BranchSalesReport` (un candidato: 321 impactos) y `ProductDetailFinancialModal` (un candidato: 316 impactos); las consultas de dichos símbolos resultaron ambiguas. Antes de tocar esos archivos se requiere desambiguar el símbolo exacto y reportar la evaluación; ningún candidato HIGH/CRITICAL se modifica sin revisión específica.

## Archivos esperados

- `.eslintrc.cjs`
- `package.json`, `pnpm-lock.yaml`
- Manifiestos necesarios en `packages/*/package.json`
- `src/tests/architecturalBoundaries.test.ts`
- `src/types/cash.types.ts`
- Los 36 archivos del inventario de React Hooks anterior.
- Fuentes de dependencias señaladas por auditoría fresca, solo después de aprobar la fase lint.

## Riesgos y mitigaciones

- **Cambios mayores de API** en jsPDF/Zod u otras dependencias: localizar usos primero, ejecutar pruebas focalizadas y pausar al completar cada tarea atómica.
- **Cambio de comportamiento al corregir hooks:** inspeccionar cierres, orden de render y rutas de refresh; cubrir flujos con pruebas antes/después.
- **Blast radius alto:** GitNexus marcó candidatos ambiguos de riesgo crítico; desambiguar y revisar por cada archivo antes de modificarlo.
- **Rangos transitivos:** comprobar el árbol real antes de introducir overrides; no forzar versiones incompatibles.
- **Datos de trabajo ajenos:** nunca usar `git restore`, resets ni limpieza automática; revisar diffs por archivo antes de cada edición.

## Fuera de alcance

Refactor arquitectónico general, cambios de negocio/UI, cambios de esquema o base de datos, actualizaciones de dependencias no vulnerables, y reversión de los cambios preexistentes.
