# Lista de Tareas Atómicas (Atomic Tasks): SPEC-037
## Flujo de Preventa Multivendedor sin Recaudo, Kanban en Caja Única, Despacho Verificado y Sidebar Compacto con Leyes de UX

**Código:** SPEC-037  
**Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). TDD Quirúrgico.  
**Plataforma Objetivo:** Desktop y Laptop (1366x768 px hasta 1920x1080 px).  
**Fecha:** 2026-10-27  
**Fecha Límite:** 2026-10-30  

---

## Tareas de Implementación Secuencial

- [x] **TASK-037-01: Tipos TypeScript y Validadores Zod de Preventa, Descuentos y Despacho**
  - **Archivos:** `src/types/prefactura.types.ts`, `src/schemas/prefactura.schema.ts`, `src/tests/prefactura.schema.test.ts`
  - **Objetivo:** Definir contratos TypeScript y esquemas Zod para la preventa de mostrador: validación de ítems, precio base, límite estricto de descuento ($\le 10\%$ sin PIN), payload de emisión de prefactura, payload de cobro en caja y validación de despacho con verificación de factura.
  - **TDD:** 14/14 pruebas unitarias pasando al 100% en `prefactura.schema.test.ts` y 0 errores en `tsc --noEmit`.

- [x] **TASK-037-02: Servicio de Negocio de Preventas (Hard-Hold Stock, Transiciones y Despacho)**
  - **Archivos:** `src/services/prefacturaService.ts`, `src/tests/prefacturaService.test.ts`
  - **Objetivo:** Implementar la lógica del ciclo de vida de prefacturas con aislamiento multi-tenant por `tenant_id`: creación con reserva inmediata de stock (Hard-Hold), generación de código QR/ticket, transición a `EN_COBRO`, validación de cobro por cajero y registro de despacho verificado por el asesor.
  - **TDD:** 7/7 pruebas unitarias pasando al 100% en `prefacturaService.test.ts` (21/21 acumuladas) con aislamiento Zero Cross-Tenant Leakage y 0 errores en `tsc --noEmit`.

- [x] **TASK-037-03: Rediseño Ergonómico de EnterpriseSidebar (Rail Compacto 64px con Leyes de UX)**
  - **Archivos:** `src/components/layout/EnterpriseSidebar.tsx`, `src/tests/enterpriseSidebarUx.test.tsx`
  - **Objetivo:** Refactorizar el menú lateral aplicando las Leyes de UX: ancho rail ultra-compacto de **64px**, agrupación en **4 núcleos cognitivos** (Ley de Miller $\le 7$), hit-boxes ergonómicos de **48px** (Ley de Fitts), supresión de saturación visual y badges redundantes (Ley de Hick), y tooltips flotantes translúcidos en hover (Progressive Disclosure) respetando el Dark Glassmorphism V8 (`#070A10`).
  - **TDD & Calidad:** 21/21 pruebas de sidebar pasando al 100%, 0 errores en `tsc --noEmit`, y validación visual DevTools en laptop 1366x768 con 0 errores en consola JS.

- [x] **TASK-037-04: Extensión de useMultiVendorPosStore (Preventa Asesor, Límite Descuento 10% y F-Keys Desktop)**
  - **Archivos:** `src/stores/useMultiVendorPosStore.ts`, `src/views/pos/components/DiscountPanel.tsx`, `src/tests/useMultiVendorPosStore.test.ts`
  - **Objetivo:** Ampliar el store reactivo del asesor para soportar el flujo de preventa sin recaudo: bloqueo de botones de cobro para rol vendedor, verificación del umbral del 10% de descuento con invocación a `SupervisorPinModal` si se supera, y atajos de teclado (`F1`: Búsqueda, `F2`: Emitir Preventa, `F4`: Descuento).
  - **TDD:** 8/8 pruebas unitarias pasando al 100% en `useMultiVendorPosStore.test.ts` (33/33 acumuladas) y 0 errores en `tsc --noEmit`.

- [x] **TASK-037-05: Tablero Kanban de Caja Única (3 Columnas, Filtro por Asesor y Recaudo F9)**
  - **Archivos:** `src/stores/useCashierKanbanStore.ts`, `src/views/pos/components/CashierKanbanView.tsx`, `src/tests/cashierKanban.test.tsx`
  - **Objetivo:** Crear la vista Kanban de alta productividad para el cajero central: 3 columnas (`En Espera`, `En Cobro`, `Pagado / Para Despacho`) en cuadrícula paralela optimizada para laptops (1366x768 sin scroll horizontal), filtro rápido táctil por asesor comercial, y procesamiento de recaudo mediante atajo `F9` o escaneo de ticket.
  - **TDD:** 4/4 pruebas unitarias pasando al 100% en `cashierKanban.test.tsx` (37/37 acumuladas) y 0 errores en `tsc --noEmit`.

- [x] **TASK-037-06: Módulo de Despacho del Asesor (Bandeja Táctil y Verificación QR de Factura)**
  - **Archivos:** `src/views/pos/components/DispatchScannerModal.tsx`, `src/tests/dispatchScannerModal.test.tsx`
  - **Objetivo:** Desarrollar el componente de entrega rápida para los asesores comerciales: bandeja sincronizada que alerta cuando una preventa pasa a `PAGADA`, modal de escaneo de QR de factura y botón de 1-clic para registrar el despacho físico y dar salida definitiva a la orden.
  - **TDD:** 4/4 pruebas unitarias pasando al 100% en `dispatchScannerModal.test.tsx` (41/41 acumuladas) y 0 errores en `tsc --noEmit`.

- [x] **TASK-037-07: Migración SQL Supabase (pos_prefacturas, items_prefactura, RLS Zero-Leakage) & Bucle de Calidad DevTools**
  - **Archivos:** `supabase/migrations/20261027150000_pos_prefacturas_kanban.sql`, `database/38_pos_prefacturas_kanban.sql`, `MEMORY.md`
  - **Objetivo:** Crear la migración DDL en Supabase con tablas `pos_prefacturas` e `items_prefactura`, políticas RLS estrictas por `tenant_id` e índices de alto rendimiento. Ejecutar `tsc --noEmit` (0 errores), suite completa Vitest (100% verde) y verificación con Chrome DevTools MCP en resolución de laptop (1366x768) y 0 errores en consola JS.
  - **Certificación:** Migraciones aplicadas, 41/41 pruebas SPEC-037 pasando en verde, 0 errores `tsc` y consola JS limpia.
