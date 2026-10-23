# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-23 - Workflows Apertura & Cierre)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados y regla de **CERO IMÁGENES** (iconografía vectorial semántica a Costo $0 con Lucide React).
- **Workflows Canónicos de Sesión:** Creados `/session-open` (`session-open.cjs` / `npm run session:open`) y `/session-close` (`session-close.cjs` / `npm run session:close`), respaldados por el manifiesto dinámico `ecosystem-manifest.cjs` (114 workflows, 11 skills, 7 agencias, 14 MCPs).
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones críticas (`passed = true`), y auditoría de 5 Diagramas Mermaid aprobada al 100%.
- **Gobernanza SDD (RULE-SDD-001):** 38 dependencias oficiales intactas (0 deltas).
- **Frameworks IA (Tétrada Canónica):** Google Harness² y Agency Swarm integrados en co-ejecución simultánea (`run_agency_sdd_bridge.py`) a costo $0 para fases SDD y validación post-pull.

## Módulos y Especificaciones en Marcha
1. **SPEC-025 (Completada 100% - CERTIFICADA):** Dispatcher HTTP Real SIIGO Nube API v2 (46/46 tests verdes).
2. **SPEC-026 (Completada 100% - CERTIFICADA):** Dashboard Métricas Logísticas OTIF B2B (36/36 tests + DevTools 0 errores).
3. **SPEC-027 (En Curso - SDD v3.0):** Portal de Clientes B2B Auto-Servicio HORECA.
   - `TASK-027-01` [COMPLETADA]: Esquemas Zod y tipos (`b2bCustomerPortal.schema.ts`, `b2bCustomerPortal.types.ts`, 6/6 tests).
   - `TASK-027-02` [COMPLETADA]: Motor de Servicios B2B (`b2bCustomerPortalService.ts`, cupo crédito, plantillas recurrentes, 6/6 tests).
   - `TASK-027-03` [COMPLETADA]: Hooks reactivos `useB2BCart.ts`, `useB2BCustomerPortal.ts` y ruta canónica `AppRouteId.B2B_PORTAL` (10/10 tests hooks + 9/9 rutas).
   - `TASK-027-04` [COMPLETADA]: 6 Componentes táctiles UI (`B2BClientHeaderBar`, `B2BCreditCardSummary`, `B2BCatalogGrid`, `B2BItemConfiguratorModal`, `B2BRecurringTemplatesDrawer`, `B2BOrderTrackingTimeline`, 7/7 tests).
   - `TASK-027-05` [EN PROCESO]: Vista Principal `B2BCustomerPortalView.tsx`, integración Sidebar e integración en App.tsx.

## Cola de Tareas Priorizadas (WIP = 1)
1. **Tarea Activa:** `TASK-027-05` de `SPEC-027`.
2. **Ciclo de Vida:** Ejecutar `npm run session:close` cuando el usuario decida cerrar la jornada.

## Protocolo Brownfield Activo
- Límite Kanban estricto: `WIP = 1` (Una sola tarea activa a la vez).
- TDD Quirúrgico: Test RED -> Implementación GREEN -> Refactorización -> Checkpoint humano.
- Quality Gate obligatorio: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.
