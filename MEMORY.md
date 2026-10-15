# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-15 - Sincronizada)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados.
- **Git & Lifecycle Post-Pull:** Sincronizado. Al reanudar sesión tras `git pull`, ejecutar `npm run session:pull`.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, suites Vitest 100% verdes (61 suites, 424 tests).
- **Servidor Dev:** Vite activo en `http://localhost:3000/`.

## Módulos y Especificaciones en Marcha
1. **SPEC-014 (Completada 100%):** Simplificación radical de UI POS - Regla del Niño de 12 Años. Pesaje manual táctil asistido en `ManualWeightModal.tsx`, auto-foco continuo, targets $\ge 48\text{ px}$, botón `COBRAR` gigante $56\text{ px}$ esmeralda. 27/27 tests verdes.
2. **SPEC-015 (Fase de Diseño & Auditoría 100% Completada):** Flujo Completo de Integración B2B (Cotizaciones $\rightarrow$ Pedidos $\rightarrow$ Alistamiento en Bodega $\rightarrow$ Despacho a Rutas).
   - Documentación completa en `specs/015-flujo-integral-b2b-cotizaciones-pedidos-bodega-rutas/` (`spec.md`, `clarify.md`, `checklist.md`, `plan.md`, `tasks.md`, `analyze.md`).
   - Aprobado unánimemente por los 4 agentes de Agency Swarm (`SoftwareArchitect`, `DataEngineer`, `UIReviewer`, `QualityEngineer`).
   - Trazabilidad estricta de 3 actores (`vendedorId`, `operarioAlistadorId`, `conductorRepartidorId`).
   - Liquidación por peso real de lote en cuarto frío (Catch Weight $\pm 5\%$), retenciones NIIF y devoluciones a `CUARENTENA_CALIDAD`.

## Punto de Partida Inmediato para la Próxima Sesión
1. **Ejecución TDD Kanban (Límite WIP = 1) - Tarea Inmediata:**
   - Iniciar `TASK-015-01`: Tipos y Contratos TypeScript (`Pedido`, `LineaPedido` y `Cotizacion`) en `src/types/orders.types.ts` y `src/store/useOrderStore.ts`.
   - Continuar en orden estricto con `TASK-015-02` (Fase 1 Comercial), `TASK-015-03` (Fase 2 WMS), `TASK-015-04` (Fase 3 Despacho), `TASK-015-05` (UI Kanban) y `TASK-015-06` (E2E Vitest & DevTools).
2. **Prioridad 2 (Posterior):** Facturación electrónica exclusiva para el módulo POS con validación DIAN.

## Protocolo Brownfield al Abrir Sesión
- Ejecutar `npm run session:pull`.
- Verificar `npx tsc --noEmit` y bucle DevTools en `http://localhost:3000/`.
