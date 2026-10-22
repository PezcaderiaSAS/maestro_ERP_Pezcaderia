# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-22 - Cierre & Push)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados y regla de **CERO IMÁGENES** (iconografía vectorial semántica a Costo $0 con Lucide React).
- **Git & Lifecycle Post-Pull:** Sincronizado en `main`. Nuevo hook de setup interactivo `setup-harness2-env.cjs` para solicitar y sincronizar `GEMINI_API_KEY` en `tools/harness2/.env` y `.env.local` en cada `git pull`.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones críticas (`passed = true`), y auditoría de 5 Diagramas Mermaid aprobada al 100%.
- **Gobernanza SDD (RULE-SDD-001):** 38 dependencias oficiales intactas (0 deltas).
- **Frameworks IA (Tétrada Canónica):** Google Harness² y Agency Swarm integrados en co-ejecución simultánea (`run_agency_sdd_bridge.py`) a costo $0 para fases SDD y validación post-pull.

## Módulos y Especificaciones en Marcha
1. **SPEC-025 (Completada 100% - CERTIFICADA):** Dispatcher HTTP Real SIIGO Nube API v2 (46/46 tests verdes).
2. **SPEC-026 (EN PROGRESO - SDD v3.0 / WIP = 1):** Dashboard Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B.
   - `/speckit.specify`: 5 Diagramas Mermaid aprobados al 100% (`audit-diagrams-compliance.cjs`).
   - `/speckit.clarify`: Tolerancia de 15 min de gracia acordada y fórmula binaria por parada.
   - `/speckit.checklist` & `/speckit.plan`: Aprobados con asesoría de DataEngineer y QualityEngineer de Swarm + Harness².
   - `TASK-026-01` [COMPLETADA]: Esquemas Zod y contratos de datos (`otifMetrics.schema.ts`, `otif.types.ts`, 11/11 tests).
   - `TASK-026-02` [COMPLETADA]: Motor analítico OTIF y exportador Excel CSV (`otifAnalyticsService.ts`, `otifCsvExporter.ts`, 9/9 tests).
   - **Batería Acumulada SPEC-026:** 20/20 tests unitarios pasando en verde.

## Cola de Tareas Pendientes para Iniciar Post-Git-Pull (WIP = 1)
1. **`TASK-026-03`:** Hook Reactivo `useOtifMetrics.ts` y Registro Canónico de Ruta `AppRouteId.OTIF_DASHBOARD = 'metricas_otif'` en `src/routes/AppRoute.ts`.
2. **`TASK-026-04`:** Componentes Táctiles Atómicos de Métricas ("Regla del Niño de 12 Años") (`OtifKpiHeaderCards.tsx`, `OtifFilterBar.tsx`, `DriverPerformanceTable.tsx`, `ColdChainAuditTimeline.tsx`, `OtifAuditDetailTable.tsx`).
3. **`TASK-026-05`:** Vista Principal `OtifDashboardView.tsx`, Enlace en Sidebar y Registro en `App.tsx`.
4. **`TASK-026-06`:** Suite Integral E2E, Auditoría Master Architect SOLID y Validación en Vivo con Chrome DevTools MCP.
5. **Backlog Siguiente:** `SPEC-027` (Portal de Clientes B2B Auto-Servicio HORECA).

## Protocolo Brownfield Activo
- Límite Kanban estricto: `WIP = 1` (Una sola tarea activa a la vez).
- TDD Quirúrgico: Test RED -> Implementación GREEN -> Refactorización -> Checkpoint humano.
- Quality Gate obligatorio: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.
