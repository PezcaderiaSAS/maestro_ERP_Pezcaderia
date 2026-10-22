# Plan de Implementación Técnica (Technical Plan): SPEC-026

**Código:** SPEC-026  
**Título:** Dashboard de Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B  
**Fase:** Spec Kit SDD v3.0 — `/speckit.plan`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Arquitectura Data-Driven.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 3)  

---

## 1. Resumen Ejecutivo y Decisiones Arquitectónicas

Con base en la especificación [spec.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/specs/026-dashboard-metricas-logisticas-otif/spec.md), los acuerdos de clarificación en `/speckit.clarify` y el diseño de esquemas del DataEngineer de Agency Swarm (`gemini-2.5-flash-lite`), este plan establece la hoja de ruta técnica para construir el **Dashboard de Métricas Logísticas OTIF B2B**:

1. **Ubicación Canónica de la Vista:**
   - Vista independiente dedicada en el menú lateral principal accesible vía `#/metricas-otif`.
   - Incorporación en el enum canónico `AppRouteId.OTIF_DASHBOARD = 'metricas_otif'` en `src/routes/AppRoute.ts` con tipado estricto (cero *magic strings*).
2. **Cálculo Determinista OTIF:**
   - **Binario Estricto por Parada:** Una entrega es OTIF conforme si y solo si se entregó al 100% (`ENTREGADO_TOTAL` sin devoluciones/mermas) Y dentro de la ventana horaria pactada (con **15 minutos de gracia** para tráfico urbano de Bucaramanga).
   - $\% OTIF = (\text{Entregas OTIF Conformes} / \text{Total Entregas Efectuadas}) \times 100$.
3. **Auditoría de Inocuidad y Cadena de Frío:**
   - Monitoreo de temperaturas en salida y entrega con semáforo cromático: Conforme ($\le 4.0^\circ\text{C}$), Alerta ($4.1^\circ\text{C} - 7.0^\circ\text{C}$) y Crítico ($> 7.0^\circ\text{C}$).
4. **Ergonomía Táctil y Accesibilidad ("Regla del Niño de 12 Años"):**
   - Modo Claro estricto con ratio de contraste WCAG AA+ ($\ge 4.5:1$ y $\ge 7:1$).
   - Todos los inputs, selectores y tarjetas con altura mínima $\ge 48\text{ px}$.
   - Botón primario de exportación gerencial / refresco con altura $\ge 56\text{ px}$ (`h-14`).
   - Cero imágenes tipo bitmap (100% iconos Lucide React vectoriales a Costo $0$).
5. **Gobernanza de Dependencias (RULE-SDD-001):**
   - Exactamente 0 dependencias añadidas (38 dependencias oficiales intactas).

---

## 2. Mapa de Archivos y Responsabilidades (Límites de Capas)

```
packages/validation-schemas/src/
└── otifMetrics.schema.ts               # Contratos Zod para filtros, KPIs y paradas auditadas

src/types/
└── otif.types.ts                       # Tipos e interfaces TypeScript del dominio OTIF

src/routes/
└── AppRoute.ts                         # Registro de AppRouteId.OTIF_DASHBOARD con RBAC

src/services/
├── otifAnalyticsService.ts             # Motor de cálculo y agregación determinista en memoria
└── otifCsvExporter.ts                  # Generador de exportación CSV con BOM UTF-8 y delimitador ';'

src/hooks/
└── useOtifMetrics.ts                   # Hook reactivo de agregación, filtros dinámicos y memoización

src/views/logistics/
├── OtifDashboardView.tsx               # Vista principal contenedora y orquestador (< 250 líneas)
└── components/
    ├── OtifKpiHeaderCards.tsx          # Tarjetas KPI (OTIF %, On-Time %, In-Full %, Frío %, Cobro)
    ├── OtifFilterBar.tsx               # Barra de filtros táctiles (Rango fecha, conductor, zona, SLA)
    ├── DriverPerformanceTable.tsx      # Ranking y métricas de rendimiento por repartidor
    ├── ColdChainAuditTimeline.tsx      # Auditoría térmica de eventos y control de inocuidad
    └── OtifAuditDetailTable.tsx        # Tabla detallada de paradas y trazabilidad de entrega

src/components/layout/
└── EnterpriseSidebar.tsx               # Enlace táctil en barra de navegación lateral con icono Truck/Award

src/tests/
├── otifMetrics.schema.test.ts          # Pruebas de esquemas Zod y validaciones de bordes
├── otifAnalyticsService.test.ts        # Pruebas de lógica matemática, tolerancia 15 min y OTIF
└── otifDashboardView.test.tsx          # Pruebas de renderizado UI, Light Mode, targets >= 48px y botón >= 56px
```

---

## 3. Especificación Técnica de Componentes y Capas

### Capa 1: Esquemas Zod y Tipos de Datos (`otifMetrics.schema.ts` & `otif.types.ts`)
* **`OtifFilterSchema`:**
  - `fechaDesde`: string (ISO date/time).
  - `fechaHasta`: string (ISO date/time).
  - `conductorId`: string opcional / `'TODOS'`.
  - `zonaRuta`: string opcional / `'TODOS'`.
  - `estatusSLA`: enum (`'TODOS'`, `'CUMPLE_OTIF'`, `'NO_CUMPLE_TIEMPO'`, `'NO_CUMPLE_COMPLETO'`, `'RECHAZADO'`).
* **`OtifKpiSummarySchema`:**
  - `totalDespachos`: number ($\ge 0$).
  - `totalEntregas`: number ($\ge 0$).
  - `entregasOtif`: number ($\ge 0$).
  - `tasaOtifPorcentaje`: number ($0 - 100$).
  - `entregasOnTime`: number ($\ge 0$).
  - `tasaOnTimePorcentaje`: number ($0 - 100$).
  - `entregasInFull`: number ($\ge 0$).
  - `tasaInFullPorcentaje`: number ($0 - 100$).
  - `tasaCadenaFrioPorcentaje`: number ($0 - 100$).
  - `montoTotalRecaudado`: number ($\ge 0$).
  - `tiempoPromedioAtencionMinutos`: number ($\ge 0$).
* **`DriverPerformanceRecordSchema`:**
  - `conductorId`: string.
  - `conductorNombre`: string.
  - `vehiculoPlaca`: string.
  - `pedidosAsignados`: number.
  - `pedidosEntregados`: number.
  - `tasaOtif`: number.
  - `tiempoPromedioAtencionMin`: number.
  - `totalCobrado`: number.

---

### Capa 2: Motor Analítico y Exportación (`otifAnalyticsService.ts` & `otifCsvExporter.ts`)
* **`otifAnalyticsService.calcularMetricas(manifiestos, filtros)`:**
  1. Extrae y aplana todas las paradas de los manifiestos en el rango temporal.
  2. Evalúa para cada parada si la hora de entrega cumplió la ventana pactada considerando **15 minutos de gracia**:
     - `horaEntrega <= horaPactada + 15 min => onTime = true`.
  3. Evalúa si el pedido se entregó completo:
     - `estadoEntrega === 'ENTREGADO_TOTAL' && !tieneDevolucion => inFull = true`.
  4. Determina: `isOtif = onTime && inFull`.
  5. Agrega métricas por conductor y por zona.
  6. Evalúa conformidad térmica de cadena de frío ($\le 4.0^\circ\text{C}$).
* **`otifCsvExporter.exportarExcelCsv(registrosAuditoria)`:**
  - Construye archivo CSV con BOM UTF-8 (`\uFEFF`) y delimitador `;` para visualización inmediata en Microsoft Excel en español (Colombia).
  - Incluye: Pedido, Cliente, Conductor, Placa, Zona, Fecha, Hora Pactada, Hora Entrega, On-Time, In-Full, OTIF Conforme, Temp Salida, Temp Entrega, Semáforo Frío, Cobro COP.

---

### Capa 3: Capa de Presentación React (Light Mode WCAG AA+)
* **`OtifDashboardView.tsx`:**
  - Layout ergonómico de alta densidad:
    - Barra Superior con título, badge de estado en vivo y botón primario de exportación $\ge 56\text{ px}$.
    - `OtifKpiHeaderCards`: 5 tarjetas semafóricas con indicadores clave e iconos semánticos de Lucide React.
    - `OtifFilterBar`: Filtros interactivos rápidos con altura $\ge 48\text{ px}$.
    - Vista en dos columnas / tabs: Rendimiento por Repartidor y Auditoría Térmica de Cadena de Frío.
    - `OtifAuditDetailTable`: Tabla paginada de paradas con estados semafóricos y visualización clara.
* **Integración en Navegación Central:**
  - Registro en `AppRouteId.OTIF_DASHBOARD` en `src/routes/AppRoute.ts`.
  - Conexión en `src/App.tsx` para renderizar `OtifDashboardView` cuando `currentView === AppRouteId.OTIF_DASHBOARD`.
  - Adición de botón con icono `Truck` / `Award` en `EnterpriseSidebar.tsx` bajo la categoría *Operaciones & WMS*.

---

## 4. Estrategia de Pruebas Quirúrgica TDD (Vitest)

1. **Fase Roja (RED):**
   - Escribir `otifMetrics.schema.test.ts` verificando que los esquemas Zod fallen ante datos inválidos y pasen con datos conformes.
   - Escribir `otifAnalyticsService.test.ts` con casos de prueba cubriendo:
     - Caso 1: A tiempo y completo => OTIF = 100%.
     - Caso 2: A tiempo pero con devolución parcial => OTIF = 0%, In-Full = 0%.
     - Caso 3: Completo pero con 16 minutos de retraso => OTIF = 0%, On-Time = 0%.
     - Caso 4: Completo dentro de los 14 minutos de gracia => OTIF = 100%, On-Time = 100%.
     - Caso 5: Agregación por conductor y cálculo de cadena de frío.
   - Escribir `otifDashboardView.test.tsx` verificando renderizado de componentes, alturas táctiles $\ge 48\text{ px}$ y botón $\ge 56\text{ px}$, cero imágenes `<img>` y filtros interactivos.
2. **Fase Verde (GREEN):**
   - Implementar los esquemas, servicio y componentes de UI hasta lograr 100% de tests verdes.
3. **Fase Refactorización (IMPROVE):**
   - Verificar que ningún archivo supere las 400 líneas de código y auditar con Master Architect SOLID (`audit-solid-boundaries.cjs`).

---

## 5. Checkpoint de Aprobación Humana

> **Directiva SDD v3.0:** La fase `/speckit.plan` concluye aquí. Queda formalmente prohibido escribir código de producción hasta recibir la confirmación expresa del usuario.
