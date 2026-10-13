# Plan de Ingeniería SDD 010: Inventario Multi-Sucursal, Abastecimiento Dependiente y Reportes por Punto de Venta

## 1. Arquitectura y Principios de Diseño
- **Inmutabilidad Estricta:** Los estados de stock y movimientos en Zustand y servicios se manejan mediante nuevos objetos y mutaciones inmutables (`map`, `spread`, `filter`).
- **Segregación de Responsabilidades:**
  1. `Layer 1: Esquemas de Validación (Zod)` en `packages/validation-schemas/src/`.
  2. `Layer 2: Servicios de Dominio` en `src/services/` (`branchInventoryService.ts`, `branchReportsService.ts`).
  3. `Layer 3: Estado React & Hooks` en `src/hooks/` o integración con `useInventoryStore.ts` y `usePOSCart.ts`.
  4. `Layer 4: Componentes Visuales Táctiles (Light Mode WCAG AA+)` en `src/views/pos/` y `src/views/inventory/components/BranchSalesReport.tsx`.
  5. `Layer 5: Cobertura TDD / E2E` en `src/tests/branchInventoryLifecycle.test.ts`.

---

## 2. Fases de Implementación

### Fase 1: Extensión del Modelo y Esquemas Zod
- Extender la interfaz `Bodega` en `src/types/inventory.types.ts`:
  - `tipo: 'PRINCIPAL' | 'PUNTO_VENTA' | 'SECUNDARIA'`
  - `bodegaPadreId?: string | null`
  - `esPuntoVenta: boolean`
- Crear/ampliar esquemas Zod en `packages/validation-schemas/src/branchInventory.schema.ts`:
  - `BranchTransferValidationSchema`: Valida que la bodega destino sea tipo `PUNTO_VENTA`, que la bodega origen sea la bodega padre autorizada, y que `cantidad <= stockDisponibleOrigen`.
  - `BranchSalesReportFilterSchema`: Filtro por fechas (`fechaInicio`, `fechaFin`), `bodegaId` / `sucursalId`, y agrupación.

### Fase 2: Lógica de Servicios (Abastecimiento y Reportes)
- Crear `src/services/branchInventoryService.ts`:
  - `validarAbastecimientoSucursal(origenId, destinoId, sku, cantidad)`: Valida stock en Bodega Principal antes de autorizar.
  - `ejecutarAbastecimientoInmediato(...)`: Transfiere stock atómicamente (decrementa bodega principal e incrementa sucursal destino).
  - `obtenerStockPorSucursal(sucursalId)`: Retorna el inventario exclusivo del punto de venta.
- Crear `src/services/branchReportsService.ts`:
  - `generarReporteVentasPorSucursal(filtros)`: Consolida ventas, ingresos COP, volumen en kg/unidades, tickets y desglose de medios de pago.
  - `generarReporteMovimientosSucursal(sucursalId, fechas)`: Trazabilidad de entradas por traslado vs salidas por venta y mermas.
  - `exportarReporteSucursalCsv(...)` y `exportarReporteSucursalPdf(...)`.

### Fase 3: Integración en POS (Operación por Sucursal)
- Vincular la sesión del POS a la bodega del punto de venta actual (`bodegaActivaId`).
- Descontar el stock local al emitir la venta.
- Mostrar alerta visual si el stock local baja del umbral de seguridad, ofreciendo botón directo: `[⚡ Solicitar Reabastecimiento a Bodega Principal]`.

### Fase 4: Vista y Tab de Reportes por Sucursal
- Crear `src/views/inventory/components/BranchSalesReport.tsx`:
  - Selector ergonómico de Sucursal / Punto de Venta.
  - Tarjetas KPI: Total Ventas COP, Kilos Despachados, Margen Bruto Estimado, Stock Crítico.
  - Tabla de alta densidad con transacciones y traslados recibidos.
  - Exportación en 1 clic a CSV y PDF con el motor corporativo jsPDF.
- Integrar la pestaña en `InventoryView.tsx`.

### Fase 5: Suite de Pruebas Automatizadas TDD
- Crear `src/tests/branchInventoryLifecycle.test.ts`:
  1. Validación de abastecimiento dependiente (bloqueo si Bodega Principal no tiene saldo).
  2. Traslado exitoso incrementando punto de venta y decrementando bodega principal.
  3. Venta POS en sucursal A afectando solo sucursal A sin tocar bodega principal ni sucursal B.
  4. Generación precisa de reportes por sucursal con cálculos deterministas.
