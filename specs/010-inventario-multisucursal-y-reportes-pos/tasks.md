# Lista de Tareas Brownfield SDD 010: Inventario Multi-Sucursal y Reportes por Punto de Venta

- [x] **Tarea 1: Esquemas de Validación y Contratos de Tipo (`branchInventory.schema.ts` & `inventory.types.ts`)**
  - [x] **T-1.1:** Extender `Bodega` en `src/types/inventory.types.ts` con `tipo?: 'PRINCIPAL' | 'PUNTO_VENTA' | 'SECUNDARIA'`, `bodegaPadreId?: string | null` y `esPuntoVenta?: boolean`.
  - [x] **T-1.2:** Crear `packages/validation-schemas/src/branchInventory.schema.ts` con esquemas Zod para validación de abastecimiento dependiente y filtros de reportes de sucursal.
  - [x] **T-1.3:** Exportar los nuevos esquemas en `packages/validation-schemas/src/index.ts`.
  - [x] *Criterio de Aceptación / QA Gate:* Validación Zod estricta y tipado TypeScript limpio sin regresiones.

- [x] **Tarea 2: Servicio de Inventario Multi-Sucursal y Abastecimiento (`branchInventoryService.ts`)**
  - [x] **T-2.1:** Implementar función `validarAbastecimientoSucursal` para comprobar stock disponible en Bodega Principal.
  - [x] **T-2.2:** Implementar `ejecutarAbastecimientoInmediato` con movimiento atómico y Kardex trazable.
  - [x] **T-2.3:** Implementar `obtenerStockPorSucursal` para filtrar stock local por bodega de punto de venta.
  - [x] *Criterio de Aceptación / QA Gate:* Pruebas unitarias en Vitest validando abastecimiento y rechazo por saldo insuficiente en bodega principal.

- [x] **Tarea 3: Servicio de Reportes y Exportación por Sucursal (`branchReportsService.ts`)**
  - [x] **T-3.1:** Implementar consolidación determinista de ventas por sucursal (ingresos COP, kilos vendidos, tickets, medios de pago).
  - [x] **T-3.2:** Implementar consolidación de transferencias y rotación de stock por sucursal.
  - [x] **T-3.3:** Implementar exportación a CSV y PDF de los reportes de sucursal.
  - [x] *Criterio de Aceptación / QA Gate:* Pruebas unitarias de cálculo matemático exacto de ingresos y balance de movimientos.

- [x] **Tarea 4: Integración en POS (Vinculación, Descuento Aislado y Bypass Guiado)**
  - [x] **T-4.1:** Permitir configurar o seleccionar la sucursal/bodega de venta activa en el POS.
  - [x] **T-4.2:** Asegurar que las ventas en mostrador descuenten el inventario exclusivamente de dicha bodega local sin alterar la bodega principal.
  - [x] **T-4.3:** Implementar modal de bypass guiado en POS ante stock local insuficiente: muestra stock de Bodega Principal y botón para transferir al instante la cantidad faltante.
  - [x] *Criterio de Aceptación / QA Gate:* Comprobación en test E2E de que la venta en sucursal A no afecta el stock de bodega principal ni de otras sucursales, y que el bypass transfiere con éxito.

- [x] **Tarea 5: Interfaz de Reportes por Sucursal y Flujo Dual (`BranchSalesReport.tsx` & Recepción de Compra)**
  - [x] **T-5.1:** Diseñar componente `BranchSalesReport.tsx` con estética Light Mode WCAG AA+, selector multi-nivel de sucursal (cajero / consolidado admin) y tarjetas KPI.
  - [x] **T-5.2:** Integrar data table de transacciones con filtros por fecha y botones de exportación CSV/PDF.
  - [x] **T-5.3:** Añadir diálogo de traslado rápido al finalizar la recepción en `BucaramangaReceivingWizard.tsx` y botón permanente en `InventoryView.tsx` (Flujo Dual).
  - [x] *Criterio de Aceptación / QA Gate:* Interfaz táctil, responsive en móvil (375 px) y sin errores en DevTools.

- [x] **Tarea 6: Suite Completa de Pruebas TDD, Auditoría DevTools y Documentación**
  - [x] **T-6.1:** Crear `src/tests/branchInventoryLifecycle.test.ts` con todos los flujos de ciclo de vida multi-sucursal.
  - [x] **T-6.2:** Ejecutar Vitest y asegurar que el 100% de tests continúen verdes.
  - [x] **T-6.3:** Auditar en Chrome DevTools MCP (0 errores y 0 warnings en consola JS).
  - [x] **T-6.4:** Sincronizar `MEMORY.md` y documentar en `CHANGELOG_AGENTS.md`.
