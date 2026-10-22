# Lista de Verificación de Calidad (Quality Checklist): SPEC-026

**Código:** SPEC-026  
**Título:** Dashboard de Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B  
**Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Calidad Grado Empresa.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 2)  

---

## 1. Estándares de Negocio y Cadena de Suministro (SCOR & FMCG)

- [ ] **Fórmula OTIF Binaria Estricta:**
  - El indicador OTIF se computa estrictamente a nivel de parada: `otif_conforme = (cumplimiento_sla === 'A_TIEMPO' || cumplimiento_sla === 'ANTICIPADO') && (tiene_devolucion === false) && (estado_entrega === 'ENTREGADO_TOTAL')`.
  - El porcentaje global calcula: $\frac{\text{Paradas con OTIF Conforme}}{\text{Total Paradas Entregadas}} \times 100$.
- [ ] **Ventana de Gracia On-Time:**
  - Se implementa tolerancia máxima de 15 minutos posteriores a la hora o jornada límite pactada (acordado en `/speckit.clarify`).
  - Entregas dentro del margen se clasifican como `A_TIEMPO`. Entregas que exceden los 15 minutos se marcan como `DEMORADO`.
- [ ] **Inocuidad y Monitoreo de Cadena de Frío (HACCP / ISO 22000):**
  - Registro y auditoría visual de temperatura en salida y en punto de entrega.
  - Semáforo térmico determinista:
    - Conforme: $\le 4.0^\circ\text{C}$ (verde esmeralda).
    - Alerta Térmica: $4.1^\circ\text{C} - 7.0^\circ\text{C}$ (ámbar preventivo).
    - Ruptura Crítica: $> 7.0^\circ\text{C}$ (rojo carmesí).
- [ ] **Auditoría de Devoluciones a Cuarentena:**
  - Clasificación de causas de no-conformidad (calibre no conforme, frescura/olor, retraso excesivo, error de pedido).
  - Cálculo del monto económico devuelto y kilos afectados.
- [ ] **Conciliación de Recaudo en Calle:**
  - Desglose y conciliación del monto total cobrado en ruta: Contado (Efectivo), Transferencia bancaria, y Facturación a Crédito B2B.

---

## 2. Arquitectura de Software, SOLID y Type-Safety

- [ ] **Fuente Canónica de Navegación (`AppRouteId`):**
  - Adición formal de `OTIF_METRICS = 'metricas_otif'` al enum canónico `AppRouteId` en `src/routes/AppRoute.ts`.
  - Cero cadenas mágicas (`'metricas_otif'`), siempre tipado estricto `AppRouteId.OTIF_DASHBOARD`.
  - Registro en la matriz de rutas con soporte RBAC (Roles: `ADMIN`, `GERENTE`, `LOGISTICA`, `DESPACHADOR`).
- [ ] **Principio de Responsabilidad Única (SRP) y Modularidad:**
  - Ningún archivo nuevo o modificado superará las 400 líneas de código.
  - Separación estricta de responsabilidades:
    - `OtifDashboardView.tsx`: Contenedor principal de orquestación de layout (< 250 líneas).
    - `OtifKpiHeaderCards.tsx`: Renderizado atómico de métricas clave y semáforos.
    - `OtifFilterBar.tsx`: Controles de filtrado temporal, zona, conductor y estatus SLA.
    - `DriverPerformanceTable.tsx`: Tabla táctil de rendimiento de repartidores.
    - `ColdChainAuditTimeline.tsx`: Monitoreo y auditoría de eventos térmicos.
    - `otifAnalyticsService.ts`: Lógica matemática y agregaciones deterministas puras (100% aislada de React).
    - `otifCsvExporter.ts`: Exportador puro en memoria con BOM UTF-8 y delimitador `;`.
- [ ] **Gobernanza de Dependencias (RULE-SDD-001):**
  - Cero paquetes npm adicionales (conservar exactamente las 38 dependencias oficiales existentes).
  - Uso de librerías ya instaladas: React 18, Tailwind CSS, Lucide React, Zustand, Date-fns.

---

## 3. Ergonomía Táctil y Accesibilidad ("Regla del Niño de 12 Años")

- [ ] **Modo Claro Estricto (Light Mode WCAG 2.2 AA+):**
  - Fondos claros contrastados (`bg-slate-50`, `bg-white`, bordes `border-slate-200/80`).
  - Textos de alta legibilidad con ratio de contraste $\ge 4.5:1$ para texto regular y $\ge 7:1$ para títulos y KPIs numéricos.
  - Prohibido el uso de modo oscuro forzado o paletas de bajo contraste en este dashboard.
- [ ] **Dimensiones Táctiles Ergonométricas:**
  - Todos los inputs, selectores, botones de filtro y tarjetas interactivas tendrán una altura y área táctil mínima de $\ge 48\text{ px}$ (`min-h-[48px]`).
  - Botón primario de exportación gerencial / refresco con altura $\ge 56\text{ px}$ (`h-14` / `min-h-[56px]`).
- [ ] **Regla de Cero Imágenes Externas:**
  - Ninguna etiqueta `<img>` o imagen bitmap externa.
  - Iconografía 100% vectorial, semántica y ligera mediante `lucide-react`.

---

## 4. Rendimiento, Reactividad y Resiliencia Offline

- [ ] **Cálculo Reactivo en Memoria con Mutex y Deduplicación:**
  - Procesamiento instantáneo (< 50 ms) de filtros dinámicos mediante `useMemo` y cacheo en servicio.
  - Sin parpadeos de interfaz ni recargas completas del DOM al alternar filtros de fecha o conductor.
- [ ] **Resiliencia ante Datos Parciales u Offline:**
  - Si un manifiesto no tiene registros de temperatura o tiempos, el sistema aplica fallbacks amigables (`"Sin registro térmico"`, `"En espera de llegada"`) sin arrojar excepciones ni `NaN` en los KPIs.

---

## 5. Calidad, Pruebas TDD y Bucle Chrome DevTools

- [ ] **Suite de Pruebas Unitarias TDD Completa (Vitest):**
  - Suite de servicio `otifAnalyticsService.test.ts`: Pruebas de cálculo de % OTIF binario, tolerancia de 15 min, semáforo de frío y desglose de cobros.
  - Suite de UI `otifDashboardView.test.tsx`: Pruebas de renderizado en Light Mode, alturas táctiles $\ge 48\text{ px}$ y botón $\ge 56\text{ px}$, filtrado interactivo y cero imágenes `<img>`.
  - Cobertura de pruebas $\ge 85\%$ en las nuevas unidades de código.
- [ ] **Compilación TypeScript Limpia:**
  - `npx tsc --noEmit` sin ningún error o warning de tipos.
- [ ] **Auditoría Master Architect SOLID:**
  - `node scripts/architecture/audit-solid-boundaries.cjs` aprobado con 0 violaciones críticas.
- [ ] **Validación en Vivo con Chrome DevTools MCP:**
  - Inspección en `http://localhost:3000/#/metricas-otif`.
  - 0 errores o advertencias en la consola JavaScript.
  - Renderizado responsivo verificado en vista de escritorio y vista móvil a 375 px.

---

## 6. Checkpoint de Aprobación Humana

> **Directiva SDD v3.0:** La fase `/speckit.checklist` concluye aquí. Queda formalmente prohibido escribir código de producción hasta recibir la confirmación expresa del usuario.
