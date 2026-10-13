# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Light Mode WCAG AA+ & SDD 006 a 010 Completados)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) de alto contraste con tokens WCAG 2.2 AA+ (`.agents/skills/erp-pos-design-tokens/SKILL.md`).
- **Verificación Completa:**
  - 53 suites de prueba ejecutadas al 100% (**357/357 tests verdes en Vitest**).
  - TypeScript estricto con **0 errores (`tsc --noEmit`)**.
  - **Bucle DevTools MCP en Vivo:** Verificado en escritorio y móvil (375 px) con **0 errores en consola JS**.

## SDD 010: Inventario Multi-Sucursal, Abastecimiento y Reportes POS (Completado)
- **Flujo Dual de Abastecimiento:**
  - Traslado rápido inmediato post-liquidación en `BucaramangaReceivingWizard.tsx`.
  - Pestaña permanente `9. Reportes Sucursales POS` (`BranchSalesReport.tsx`) en `InventoryView.tsx`.
- **Servicios Transaccionales:**
  - `branchInventoryService.ts`: `validarAbastecimientoSucursal`, `ejecutarAbastecimientoInmediato` con Kardex atómico, `obtenerStockPorSucursal`.
  - `branchReportsService.ts`: Métricas deterministas COP (`Math.round`), deduplicación por ID de venta, exportación CSV (UTF-8 BOM) y PDF (`jsPDF`).
- **Control de Stock POS con Bypass Guiado:**
  - `POSView.tsx`: Impide venta con saldo local negativo; ante stock faltante ofrece bypass asistido que consulta la Bodega Principal y traslada al instante.
  - Trazabilidad aislada de órdenes con `sucursalId` y persistencia en `pos_orders`.

## Automatización de Ciclo de Vida Git (Hooks & Token-Saving Triad)
- **Pipeline de Activación:**
  - `git pull` / `.husky/post-merge` (`session:pull`): Sincroniza Graphify, reindexa GitNexus, valida TS y comprueba Vite (3000).
  - `git push` / `.husky/pre-push` (`session:push`): Quality Gate con `tsc --noEmit`, Vitest (357 tests) y blast radius en GitNexus.
- **Tríada Canónica de Ahorro de Tokens:** Graphify (`graphify query`), GitNexus (`gitnexus impact / detect-changes`), Agency Swarm (`/swarm`).
