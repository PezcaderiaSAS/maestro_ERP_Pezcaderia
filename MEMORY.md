# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-15 - Sincronizada)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados.
- **Git & Lifecycle Post-Pull:** Sincronizado. Al reanudar sesión tras `git pull`, ejecutar `npm run session:pull`.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, suites Vitest 100% verdes (72 suites, 480 tests globales).
- **Servidor Dev:** Vite activo en `http://localhost:3000/`.

## Módulos y Especificaciones en Marcha
1. **SPEC-014 (Completada 100%):** Simplificación radical de UI POS - Regla del Niño de 12 Años. Pesaje manual táctil asistido en `ManualWeightModal.tsx`, auto-foco continuo, targets $\ge 48\text{ px}$, botón `COBRAR` gigante $56\text{ px}$ esmeralda. 27/27 tests verdes.
2. **SPEC-015 (Completada 100% - CERTIFICADA):** Flujo Completo de Integración B2B (Cotizaciones $\rightarrow$ Pedidos $\rightarrow$ Alistamiento en Bodega $\rightarrow$ Despacho a Rutas).
   - `TASK-015-01` [DONE]: Tipos y Contratos TypeScript (Pedido, LineaPedido, Cotizacion con los 3 actores y catch weight). 2/2 tests verdes.
   - `TASK-015-02` [DONE]: Orquestador B2B Fase 1 Comercial (`convertirCotizacionAPedido`, cupo de crédito, retenciones NIIF y `b2bCommercialFlow.test.ts`). 6/6 tests verdes.
   - `TASK-015-03` [DONE]: Orquestador B2B Fase 2 WMS (Alistamiento, Báscula Frío, Catch Weight $\pm 5\%$, FEFO, QR y Remisión WMS). 6/6 tests verdes.
   - `TASK-015-04` [DONE]: Orquestador B2B Fase 3 Despacho (Manifiesto, Check-in Furgón $\le 4^\circ\text{C}/-18^\circ\text{C}$, Entrega en Sitio, Cuarentena & Liquidación). 7/7 tests verdes.
   - `TASK-015-05` [DONE]: UI & Kanban Integration (Badges 3 Actores WCAG AA+, Pesaje Real vs Nominal Catch Weight $\pm 5\%$ y Botones $\ge 48\text{ px}$). 9/9 tests verdes.
   - `TASK-015-06` [DONE]: Suite Integral E2E Vitest (6/6 tests verdes) & Quality Gate DevTools MCP (0 errores JS, 1280px y móvil 375px).
   - **Métricas Ecosistema B2B:** 61/61 tests verdes en 9 suites dedicadas.
3. **SPEC-016 (En Curso - TASK-016-01 Completada):** Sistema de Ventas B2B para Bodega Principal (Regla Niño de 12 Años). Ruta `AppRouteId.B2B_EXTERNAL_SALES = 'ventas_b2b'` en Dominio Comercial, método `crearPedidoVentaExternaB2B()`, Catch Weight nominal y validación de cupo. 7/7 tests verdes en `b2bExternalSalesService.test.ts`. Siguiente: `TASK-016-02` (B2BClientSelectorStep).
4. **SPEC-017 (Completada 100% - CERTIFICADA):** Guardián de Arquitectura Supremo y Auditoría Continua SOLID Post-Git-Pull (Master Architect).
   - Política vinculante `MANDATORY_GLOBAL_ENFORCEMENT` en `.agent/rules/master-architect-solid.md` y `AGENTS.md`.
   - Motor ultraligero `scripts/architecture/audit-solid-boundaries.cjs` (analiza 304 archivos en < 500 ms con 0 violaciones críticas).
   - Integración nativa en `scripts/lifecycle/post-pull.cjs` (paso 4/5) y script npm `"audit:architecture"`.
   - 9/9 tests verdes en `architecturalBoundaries.test.ts`.

## Protocolo Brownfield al Abrir Sesión
- Ejecutar `npm run session:pull` (corre Graphify, GitNexus, `tsc --noEmit`, Auditoría Master Architect y chequeo servidor).
- Quality Gate: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.


