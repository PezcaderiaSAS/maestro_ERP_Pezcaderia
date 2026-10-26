# Tareas Granulares de Implementación: SPEC-033 — Reestructuración Integral del Frontend (Dark Mode Abisal Linear/Raycast)

**Especificación:** SPEC-033 — Reestructuración Integral del Frontend  
**Fase:** /speckit.tasks (SDD v3.0)  
**Ticket:** FRONTEND-PALETTE-REARCHITECT-V8  
**Fecha:** 2026-10-26  
**Regla de Ejecución:** TDD Quirúrgico | Una sola tarea activa a la vez (`WIP = 1`) | Stop & Checkpoint  

---

### Lista de Tareas Secuenciales (WIP = 1)

- [x] **`TASK-033-01` — Suite de Pruebas Automatizadas TDD (Fase RED):**
  - Crear o extender `src/tests/posDarkGlassmorphismV8.test.tsx` o crear `src/tests/frontendAbyssalThemeV8.test.tsx`.
  - Definir aserciones para:
    1. Ausencia absoluta de clases `border-slate-200`, `border-gray-200` y `bg-slate-100` en las zonas clave de navegación y POS.
    2. Verificación de tokens de fondo abisal `#070A10` y micro-bordes `border-white/10` o `border-white/12`.
    3. Verificación de estilos translúcidos en banners de alerta de caja y chips de categoría.
  - *Checkpoint de Verificación:* Tests en estado RED confirmado (4 fallos controlados / 1 pasando) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-033-02` — Normalización del Canvas Base, Scrollbars y Variables CSS:**
  - Actualizar `src/index.css` y `src/App.tsx`:
    - Definir fondo abisal `#070A10` en `body` y contenedor global.
    - Configurar scrollbars invisibles con thumb translúcido (`rgba(255, 255, 255, 0.15)`).
    - Normalizar variables CSS de tema oscuro a la paleta Linear / Raycast.
  - *Checkpoint de Verificación:* `tsc --noEmit` en 0 errores y renderizado base limpio. [COMPLETADA]

- [x] **`TASK-033-03` — Saneamiento y Erradicación de Franjas en Layout Shell:**
  - Actualizar `EnterpriseSidebar.tsx` y `EnterpriseTopbar.tsx`:
    - Purgar cualquier borde gris o fondo claro residual.
    - Unificar botones de acción en `bg-slate-800/80 border-white/10 text-slate-200`.
    - Garantizar micro-bordes luminosos `border-r border-white/10` en sidebar colapsado y expandido.
  - *Checkpoint de Verificación:* Pruebas de sidebar y topbar en verde y `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-033-04` — Saneamiento Visual del Shell de `POSView.tsx`:**
  - En `src/views/POSView.tsx`:
    - Zona 1: Reemplazar `bg-slate-100` y `border-slate-200` en badge de vendedor por `bg-slate-900/80 border-white/10 text-white`.
    - Zona 2: Eliminar `bg-white` y `border-slate-200` en barra de control de subvistas, aplicando `bg-slate-900/85 border-white/12`.
    - Zona 3: Unificar las 4 tarjetas de KPI de turno con `bg-slate-900/85 border-white/12` y specular highlight.
    - Banner de caja cerrada: Transformar a `bg-rose-500/15 border-rose-500/30 text-rose-300`.
  - *Checkpoint de Verificación:* Pruebas de `POSView` en verde y `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-033-05` — Purga de Franjas en Catálogo de Productos (`ProductSearchPanel.tsx`):**
  - En `src/views/pos/components/ProductSearchPanel.tsx`:
    - Inputs de búsqueda y escaneo con `bg-slate-950/70 border-white/12 text-white`.
    - Chips de categoría con `bg-slate-800/80 border-white/10 text-slate-300` y seleccionado en `bg-indigo-600 text-white shadow-indigo-600/30`.
    - Tarjetas de producto `.product-card` con `bg-slate-900/80 border-white/10 hover:border-cyan-500/40 rounded-2xl`.
  - *Checkpoint de Verificación:* Pruebas de catálogo táctil en verde y `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-033-06` — Certificación Integral, Suite Completa de Tests y Bucle DevTools:**
  - Ejecución de la suite completa de pruebas unitarias y de integración (100% verde: 24/24 tests pasando).
  - Verificación estricta de `tsc --noEmit` con 0 errores.
  - Auditoría visual en vivo en Chrome DevTools / Browser Subagent (`http://localhost:3000/`) confirmando 0 elementos con `rgb(229, 231, 235)` o franjas grises sobre fondo oscuro en Desktop y Móvil (375 px), con 0 errores en consola JS. [COMPLETADA]

---

**NOTA:** Este desglose de tareas se entrega formalmente para la revisión y aprobación explícita del usuario antes de proceder a la fase de análisis cruzado (`/speckit.analyze`).
