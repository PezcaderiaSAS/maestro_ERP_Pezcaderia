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
3. **SPEC-027 (Completada 100% - CERTIFICADA):** Portal de Clientes B2B Auto-Servicio HORECA (35/35 Vitest + 6/6 Playwright E2E).
4. **SPEC-028 (Completada 100% - CERTIFICADA):** Precios Dinámicos, Márgenes Multicanal y Módulo de Mermas (Admin) (36/36 tests verdes).
5. **GOB-UIUX (En Ejecución - WIP = 1):** Directiva UI/UX Industrial & Regla del Niño de 12 Años.
   - **Sprint 1 (Completado 100% - CERTIFICADO):** Saneamiento de `EnterpriseSidebar.tsx` (acordeón inteligente anti-saturación, unificación de POS, erradicación de badges estáticos ruidosos, compactación vertical) y eliminación de debug en `main.tsx` (14/14 tests Vitest verdes + DevTools 0 errores).
   - **Sprint 2 (Completado 100% - CERTIFICADO):** Saneamiento de `InventoryView.tsx` y `StockMatrizTable.tsx` (reducción a 3 botones primarios + dropdown accesible 'Más Opciones', erradicación de vanity badges, tarjetas KPI de alto contraste WCAG AAA para Light Mode, y corrección del bug de falso 'Sin stock' calculando el estado consolidado sobre Total Global; 18/18 tests verdes + DevTools 0 errores).

## Cola de Tareas Priorizadas (WIP = 1)
1. **Tarea Siguiente:** `SPRINT-3-POS` (Saneamiento de interfaces de Punto de Venta POS & Ventas: ergonomía táctil $\ge 56$px, teclado en pantalla numérico, eliminación de redundancias y contraste WCAG 2.2 AA+).
2. **Ciclo de Vida:** Ejecutar `npm run session:close` cuando el usuario decida cerrar la jornada.

## Protocolo Brownfield Activo
- Límite Kanban estricto: `WIP = 1` (Una sola tarea activa a la vez).
- TDD Quirúrgico: Test RED -> Implementación GREEN -> Refactorización -> Checkpoint humano.
- Quality Gate obligatorio: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.
