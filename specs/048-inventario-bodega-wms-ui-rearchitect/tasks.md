# Tareas Atómicas de Implementación — SPEC-048 (Límite WIP = 1)
## Reestructuración UI/UX Integral de Inventario & Bodega WMS (`InventoryView.tsx`)

- **Código:** SPEC-048
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** COMPLETADA Y CERTIFICADA (100%)

---

## Estado General del Tablero Kanban

| Por Hacer (To Do) | En Progreso (In Progress - WIP = 1) | En Revisión (In Review) | Terminado (Done) |
| :--- | :--- | :--- | :--- |
| Ninguna | Ninguna | Ninguna | `TASK-048-01` a `TASK-048-05` (100%) |

---

## Desglose Granular de Tareas

- [x] **`TASK-048-01` [UI/UX] Implementar Bento Grid de KPIs Ejecutivos WMS `InventoryBentoKpis.tsx`**
  - **Objetivo:** Desarrollar el componente `src/views/inventory/components/InventoryBentoKpis.tsx` con 4 tarjetas de diseño Dark Glassmorphism 60-30-10:
    1. Valor Total del Inventario ($) con micro-tendencia.
    2. Ocupación y Temperatura Promedio de Cuartos Fríos (°C).
    3. Lotes Perecederos en Riesgo FEFO (< 48 hrs) con semáforo ámbar/rojo.
    4. Tasa de Merma de Despiece Acumulada (%) y Pareto ABC Clase A.
  - **Pruebas:** Actualizar `src/tests/inventoryView7Tabs.test.tsx` verificando renderizado de las 4 métricas con datos dinámicos.
  - **Criterio de Aceptación:** 100% tests verdes, números en `font-mono`, ratio de contraste WCAG AAA $\ge 7:1$.
  - **Estado:** COMPLETADA Y VERIFICADA (4/4 tests verdes en `inventoryBentoKpis.test.tsx`).

- [x] **`TASK-048-02` [UI/UX] Implementar Barra de Pestañas Flotante (Floating Pills) `InventoryFloatingPills.tsx`**
  - **Objetivo:** Crear `src/views/inventory/components/InventoryFloatingPills.tsx` con posición sticky (`top-3 z-30`), efecto glassmorphism `backdrop-blur-2xl` y 7 pastillas ergonómicas ($\ge 44\text{px}$) con íconos de Lucide y micro-badges numéricos.
  - **Pruebas:** Test de interacción y cambio de pestaña activa en `inventoryFloatingPills.test.tsx`.
  - **Criterio de Aceptación:** Navegación táctil fluida, indicador activo en cian `#00F2FE` y selector móvil ergonómico $\ge 44\text{px}$.
  - **Estado:** COMPLETADA Y VERIFICADA (4/4 tests verdes en `inventoryFloatingPills.test.tsx`, 0 errores `tsc --noEmit`).

- [x] **`TASK-048-03` [UI/UX] Implementar Barra de Acciones Rápidas `InventoryQuickActionBar.tsx`**
  - **Objetivo:** Crear `src/views/inventory/components/InventoryQuickActionBar.tsx` con botones ergonómicos conformes a la Ley de Fitts ($\ge 48\text{px}$) para:
    - Nuevo Producto (`+`)
    - Recepción en Muelle
    - Traslado entre Bodegas
    - Carga Masiva (CSV/Excel)
    - Re-clasificación Pareto ABC
  - **Pruebas:** Test de disparo de callbacks y apertura de modales en `inventoryQuickActionBar.test.tsx`.
  - **Criterio de Aceptación:** Botones táctiles amplios ($\ge 44\text{px}$ - $48\text{px}$), respuesta visual táctil (hover/active micro-animaciones).
  - **Estado:** COMPLETADA Y VERIFICADA (3/3 tests verdes en `inventoryQuickActionBar.test.tsx`, 0 errores `tsc --noEmit`).

- [x] **`TASK-048-04` [Refactor & Integración] Ensamblar `InventoryView.tsx` Modular y Modularizar Pestañas**
  - **Objetivo:** Reestructurar `src/views/InventoryView.tsx` integrando `InventoryHeroHeader`, `InventoryBentoKpis`, `InventoryQuickActionBar` y `InventoryFloatingPills`, canalizando el contenido de las 7 pestañas sin lógica pesada en la vista principal.
  - **Pruebas:** Ejecutar la suite completa `inventoryView7Tabs.test.tsx` y pruebas de integración.
  - **Criterio de Aceptación:** 0 regresiones en el cambio de pestañas, componentes existentes montados limpiamente y 0 errores de compilación `tsc --noEmit`.
  - **Estado:** COMPLETADA Y VERIFICADA (2/2 tests verdes en `inventoryView7Tabs.test.tsx`, 0 errores `tsc --noEmit`).

- [x] **`TASK-048-05` [DevTools MCP & Certificación] Bucle de Verificación DevTools y Responsividad Móvil**
  - **Objetivo:** Auditar la vista en vivo contra `http://localhost:3000/` usando Playwright / DevTools MCP.
  - **Verificación:**
    1. Consola JS con **0 errores fatales**.
    2. Captura de pantalla de escritorio a 1280px (`inventory_wms_desktop_audit.png`).
    3. Captura de pantalla móvil a 375px (`inventory_wms_mobile_audit.png`).
    4. Captura interactiva de conmutación de pestaña (`inventory_wms_tab_interactive.png`).
  - **Criterio de Aceptación:** Certificación visual completa, 0 desbordamientos horizontales y aprobación del usuario.
  - **Estado:** COMPLETADA Y CERTIFICADA (0 errores fatales, capturas guardadas en artefactos).
