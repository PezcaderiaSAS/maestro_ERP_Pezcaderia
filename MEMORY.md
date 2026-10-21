# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-21 - Sincronizada)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados y regla de **CERO IMÁGENES** (iconografía vectorial semántica a Costo $0 con Lucide React).
- **Git & Lifecycle Post-Pull:** Sincronizado en commit `93b1d24`.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones críticas (`passed = true`), y auditoría de 5 Diagramas Mermaid aprobada al 100%.
- **Gobernanza SDD (RULE-SDD-001):** 38 dependencias oficiales intactas (0 deltas). Axios existente para integración HTTP de SIIGO.

## Módulos y Especificaciones en Marcha
1. **SPEC-024 (Completada 100% - CERTIFICADA):** Service Worker PWA, Web App Manifest y Modo Pago Crédito B2B para Repartidores. 14/14 tests verdes dedicados.
2. **SPEC-025 (Completada 100% - CERTIFICADA):** Dispatcher HTTP Real SIIGO Nube API v2.
   - Adquisición Bearer con mutex concurrente y caché de 24h (`SiigoAuthService`).
   - Timbrado fiscal DIAN, auto-renovación ante 401, reintentos 429/5xx y aislamiento fatal ante 400 (`SiigoHttpDispatcher`).
   - Store Zustand reactivo con persistencia local (`useSiigoConfigStore`) e inyección en `BackgroundSyncWorker`.
   - UI táctil accesible: `SiigoConfigModal` (targets $\ge 48\text{ px}$, botón primario $\ge 56\text{ px}$) y `SiigoStatusBadge` semáforo.
   - 46/46 tests unitarios verdes (6 suites), `tsc --noEmit` 0 errores, Master Architect SOLID aprobado y bucle DevTools verificado.
3. **Backlog Priorizado Siguiente (WIP = 1):**
   - `SPEC-026`: Dashboard Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B.
   - `SPEC-027`: Portal de Clientes B2B Auto-Servicio para HORECA (Consulta de estados de cuenta, pedidos recurrentes y remisiones).

## Protocolo Brownfield Activo
- Límite Kanban estricto: `WIP = 1` (Una sola tarea activa a la vez).
- TDD Quirúrgico: Test RED -> Implementación GREEN -> Refactorización -> Checkpoint humano.
- Quality Gate obligatorio: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.
