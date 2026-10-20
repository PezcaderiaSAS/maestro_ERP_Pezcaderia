# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-16 - Sincronizada)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados y regla de **CERO IMÁGENES** (iconografía vectorial semántica a Costo $0 con Lucide React).
- **Git & Lifecycle Post-Pull:** Sincronizado. Pipeline de 8 pasos en `node scripts/lifecycle/post-pull.cjs` (incluye validación de dependencias e investigación oficial con Brave Search / RULE-SDD-001). Ejecutar con `npm run session:pull`.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, suites Vitest 100% verdes (108 suites, 736 tests globales).
- **Master Architect SOLID:** 383 archivos analizados en 104 ms, 0 violaciones críticas (`passed = true`).
- **Gobernanza SDD (RULE-SDD-001):** 38 dependencias oficiales intactas (0 deltas). PWA nativa W3C y Vanilla SW sin librerías externas.
- **Servidor Dev & DevTools:** Vite activo en `http://localhost:3000/` con 0 errores en consola JS y renderizado móvil verificado (375 px).

## Módulos y Especificaciones en Marcha
1. **SPEC-023 (Completada 100% - CERTIFICADA):** App PWA Móvil para Repartidores y Rutas B2B (Firma digital táctil, paradas, devoluciones `CUARENTENA_CALIDAD`). 37/37 tests verdes en 5 suites dedicadas.
2. **SPEC-024 (Completada 100% - CERTIFICADA):** Service Worker PWA, Web App Manifest y Modo Pago Crédito B2B para Repartidores.
   - `TASK-024-01` a `TASK-024-05` [DONE]: `manifest.webmanifest` e iconos semánticos SVG ($0), Service Worker nativo `sw.js` (Pre-cache, Network-First con fallback App Shell, Stale-While-Revalidate en assets y Network-Only en Supabase/API), `serviceWorkerRegistration.ts`, Zustand `usePwaStore.ts`, componentes táctiles `PwaUpdatePromptModal.tsx` (56px) y `PwaInstallBannerButton.tsx` (48px), y selector de pago en `DriverStopExecutionView.tsx` con opción "Crédito" ($0 recaudado físico, causación contable B2B, info-banner azul). 14/14 tests verdes dedicados en `pwaServiceWorkerRegistration.test.tsx`.
3. **Backlog Priorizado para Reanudación Post-Pull (WIP = 1):**
   - `SPEC-025`: Dispatcher HTTP Real SIIGO Nube API v2 (Tokens Bearer, sync background outbox e integración contable automática).
   - `SPEC-026`: Dashboard Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B.
   - `SPEC-027`: Portal de Clientes B2B Auto-Servicio para HORECA (Consulta de estados de cuenta, pedidos recurrentes y remisiones).

## Protocolo Brownfield al Abrir Sesión (Reanudación)
- Ejecutar `npm run session:pull` (8 pasos: Verificación Entorno, Investigador SDD RULE-SDD-001, Graphify, GitNexus, `tsc --noEmit`, Auditoría 5 Diagramas Mermaid, Auditoría Master Architect y chequeo Vite).
- Mandato de Modelado: `MANDATORY MULTI-PHASE SYSTEM MODELING & DIAGRAMMING` (5 diagramas Mermaid en `spec.md`).
- Quality Gate: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.
