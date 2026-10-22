# Matriz de Tareas de Implementación: SPEC-026

**Código:** SPEC-026  
**Título:** Dashboard de Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B  
**Fase:** Spec Kit v3.0 — `/speckit.tasks` (Actualizada Post-Análisis de Consistencia)  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Ejecución Quirúrgica TDD.  
**Estado:** LISTA PARA IMPLEMENTACIÓN QUIRÚRGICA (Pendiente Checkpoint de Aprobación Humana)  

---

## Matriz de Tareas Secuenciales (WIP = 1)

### `TASK-026-01`: Esquemas Zod y Contratos de Validación de Datos OTIF [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Definir los esquemas Zod de validación y tipos TypeScript para los filtros de consulta, resumen de KPIs logísticos, registros individuales por parada y scorecard de repartidores.
- **Entregables:**
  - `packages/validation-schemas/src/otifMetrics.schema.ts`: Esquemas `OtifFilterParamsSchema`, `OtifKpiSummarySchema`, `OtifStopRecordSchema`, `DriverPerformanceRecordSchema` y funciones de validación.
  - Exportación en `packages/validation-schemas/src/index.ts`.
  - `src/types/otif.types.ts`: Interfaces tipadas `OtifFilterParams`, `OtifKpiSummary`, `OtifStopRecord`, `DriverPerformanceRecord`, `ColdChainStatus`, `OtifConsolidatedResult`.
  - `src/tests/otifMetrics.schema.test.ts`: Suite de pruebas unitarias TDD validando contratos, límites numéricos, formato ISO y casos borde con **11/11 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - 100% de tests de esquemas pasando en verde (11/11).
  - `npx tsc --noEmit` en 0 errores.
  - Master Architect SOLID aprobado sin violaciones críticas.
  - Cero dependencias añadidas (RULE-SDD-001).

---

### `TASK-026-02`: Motor Analítico Determinista OTIF y Exportador Excel CSV [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Desarrollar el servicio de cálculo matemático en memoria para métricas OTIF (con ventana de gracia de 15 min, evaluación de pedidos completos y semáforo térmico de cadena de frío) y el generador de exportación CSV con BOM UTF-8 y delimitador `;`.
- **Entregables:**
  - `src/services/otifAnalyticsService.ts`: Métodos `calcularConsolidadoOtif`, `evaluarParadaOtif`, `calcularScorecardRepartidores`, `calcularHoraLimitePactada` (con manejo seguro de husos horarios locales y UTC).
  - `src/services/otifCsvExporter.ts`: Métodos `generarCsvString` y `descargarExcelCsv` con BOM UTF-8 (`\uFEFF`) y delimitador `;` para compatibilidad nativa con Microsoft Excel en español (Colombia).
  - `src/tests/otifAnalyticsService.test.ts`: Suite TDD con casos para entregas a tiempo, ventana de gracia de 15 min, entregas parciales/devoluciones, cálculo de porcentajes y desglose de cobros con **9/9 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - Fórmula OTIF binaria estricta: `isOtif = onTime && inFull`.
  - Tolerancia de 15 min respetada deterministamente.
  - 100% tests verdes acumulados (20/20 tests en SPEC-026).
  - `npx tsc --noEmit` en 0 errores.
  - Master Architect SOLID aprobado sin violaciones críticas.
  - Cero dependencias añadidas (RULE-SDD-001).

---

### `TASK-026-03`: Hook Reactivo y Tipado Canónico de Rutas
- **Objetivo:** Implementar el hook `useOtifMetrics` para orquestar reactivamente los filtros, el cálculo en memoria con `useMemo` y registrar formalmente la ruta `AppRouteId.OTIF_DASHBOARD`.
- **Entregables:**
  - Modificación de `src/routes/AppRoute.ts`: Adición de `OTIF_DASHBOARD = 'metricas_otif'` al enum `AppRouteId` y metadatos de presentación/RBAC.
  - `src/hooks/useOtifMetrics.ts`: Hook reactivo que conecta con `deliveryRouteService`, aplica filtros temporales, gestiona presets ('HOY', '7_DIAS', 'MES') y expone métricas memoizadas.
  - Actualización de `src/tests/appRoute.test.ts`: Validación de la nueva ruta canónica y cero cadenas mágicas.
- **Criterios de Aceptación:**
  - Cero magic strings en navegación.
  - Hook reactivo memoizado con respuesta instantánea (< 50 ms).

---

### `TASK-026-04`: Componentes Táctiles Atómicos de Métricas ("Regla del Niño de 12 Años")
- **Objetivo:** Construir los componentes modulares de interfaz para el Dashboard OTIF en estricto Modo Claro (Light Mode WCAG AA+), con áreas de contacto táctil $\ge 48\text{ px}$ y botón principal $\ge 56\text{ px}$.
- **Entregables:**
  - `src/views/logistics/components/OtifKpiHeaderCards.tsx`: 5 tarjetas de KPI semafóricas (Tasa OTIF %, On-Time %, In-Full %, Cadena de Frío %, Recaudo en Calle) con iconografía Lucide React.
  - `src/views/logistics/components/OtifFilterBar.tsx`: Barra de filtros táctiles rápidos con altura $\ge 48\text{ px}$ para fecha, conductor, zona y estatus SLA.
  - `src/views/logistics/components/DriverPerformanceTable.tsx`: Tabla táctil de ranking de conductores.
  - `src/views/logistics/components/ColdChainAuditTimeline.tsx`: Monitoreo térmico con semáforo cromático (verde, ámbar, rojo).
  - `src/views/logistics/components/OtifAuditDetailTable.tsx`: Tabla de paradas detalladas con paginación táctil y badges semafóricos.
- **Criterios de Aceptación:**
  - Light Mode WCAG 2.2 AA+ (contrastes $\ge 4.5:1$ y $\ge 7:1$).
  - Elementos táctiles $\ge 48\text{ px}$, botón primario $\ge 56\text{ px}$.
  - Cero imágenes bitmap (100% vectores Lucide React).
  - Cada componente $< 300$ líneas de código (SRP).

---

### `TASK-026-05`: Vista Principal `OtifDashboardView.tsx`, Enlace en Sidebar y Registro en `App.tsx`
- **Objetivo:** Integrar la vista principal contenedora `OtifDashboardView.tsx`, conectarla al enrutador en `src/App.tsx` y agregar el botón de navegación en `EnterpriseSidebar.tsx`.
- **Entregables:**
  - `src/views/logistics/OtifDashboardView.tsx`: Vista orquestadora principal (< 250 líneas) con layout responsivo, cabecera ejecutiva y botón primario de exportación CSV de $56\text{ px}$ de altura.
  - Actualización de `src/components/layout/EnterpriseSidebar.tsx`: Entrada de menú táctil "Métricas OTIF" con icono `Award` / `Truck` bajo *Operaciones & WMS*.
  - Actualización de `src/App.tsx`: Enlace condicional para renderizar `OtifDashboardView` bajo `AppRouteId.OTIF_DASHBOARD`.
  - `src/tests/otifDashboardView.test.tsx`: Suite de renderizado y ergonomía táctil en Vitest.
- **Criterios de Aceptación:**
  - Navegación bidireccional fluida hacia `#/metricas-otif`.
  - 100% tests verdes de renderizado y ergonomía táctil.

---

### `TASK-026-06`: Suite Integral E2E, Auditoría Master Architect y Quality Gate Final en Vivo
- **Objetivo:** Ejecutar la batería global de pruebas, auditar límites arquitectónicos y validar la experiencia en vivo con Chrome DevTools MCP.
- **Entregables:**
  - Batería completa de pruebas de SPEC-026 pasando al 100% en Vitest sin regresiones.
  - `npx tsc --noEmit` en 0 errores.
  - Auditoría Master Architect SOLID (`audit-solid-boundaries.cjs`): 0 violaciones críticas.
  - Auditoría de 5 Diagramas Mermaid (`audit-diagrams-compliance.cjs`): 100% de cumplimiento.
  - Bucle Chrome DevTools MCP en `http://localhost:3000/#/metricas-otif`: 0 errores en consola JS y vista móvil responsiva a 375 px.
  - Sincronización final de `MEMORY.md` y cierre de la especificación.
- **Criterios de Aceptación:**
  - Quality Gate 100% verde y lista para despliegue o push.

---

*Fin de la matriz de tareas para SPEC-026.*
