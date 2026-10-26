# Desglose de Tareas de Implementación: /speckit.tasks (SPEC-029)

**Código:** SPEC-029  
**Fase:** /speckit.tasks (SDD v3.0)  
**Dominio:** Ventas POS / Ergonomía Táctil / UI-UX Industrial  
**Estado:** COMPLETADO_CERTIFICADO  
**Fecha:** 2026-10-26  
**Límite Kanban:** `WIP = 1` (Una sola tarea activa a la vez)  

---

## 1. Matriz de Tareas Secuenciales (Flujo TDD Estricto)

```
[TASK-029-01: Tests TDD] ──► [TASK-029-02: Keypad Embebido] ──► [TASK-029-03: Ergonomía Mostrador] ──► [TASK-029-04: Shell POS & Type-Safety] ──► [TASK-029-05: Certificación DevTools]
```

---

### [x] TASK-029-01: Suite de Pruebas Unitarias TDD para Ergonomía y Keypad POS (COMPLETADA - FASE RED)
- **Objetivo:** Escribir las pruebas automatizadas en Vitest que definan el comportamiento esperado antes de escribir el código de producción (Fase RED).
- **Archivos a crear:**
  - `src/tests/onScreenKeypadModal.test.tsx`:
    - Verifica renderizado de teclas táctiles con altura $\ge 56\text{ px}$.
    - Prueba digitación de números, punto decimal, borrado (`Backspace`) y limpieza (`Clear`).
    - Valida selección de chips de peso/unidades a 1-tap.
    - Valida cálculo en vivo del subtotal en COP y confirmación con tecla `Enter`.
  - `src/tests/posErgonomicsLayout.test.tsx`:
    - Valida que la barra superior de `POSView` contenga como máximo 3 botones primarios y un dropdown "Más Acciones...".
    - Valida que los botones de cobro en `PaymentPanel` tengan `min-h-[56px]`.
    - Valida que no existan magic strings de rutas (`'precios'`, `'dashboard'`) en `POSView.tsx`.
- **Criterio de Aceptación:** Tests escritos y fallando controladamente (RED) por falta de componentes/props.

---

### [x] TASK-029-02: Construcción del Componente `OnScreenKeypadModal.tsx` (COMPLETADA - GREEN)
- **Objetivo:** Implementar el modal/popover táctil numérico de alta respuesta con teclas gigantes ($\ge 56\text{ px}$) y chips a 1-tap.
- **Archivos a crear/modificar:**
  - `src/views/pos/components/OnScreenKeypadModal.tsx`:
    - Teclas numéricas `0-9`, `.`, `Backspace` con `min-h-[56px] min-w-[56px]`.
    - Chips de pesos y unidades frecuentes con `min-h-[48px]`.
    - Visor monoespaciado gigante de cantidad y subtotal COP en tiempo real.
    - Supresión de teclado nativo del OS con `inputMode="none"`.
    - Atajos de teclado físico (`0-9`, `Enter`, `Escape`).
  - `src/views/pos/components/ManualWeightModal.tsx`:
    - Ajustar alturas de teclas numéricas a `min-h-[56px]` y chips a `min-h-[48px]`.
    - Incorporar `inputMode="none"`.
- **Criterio de Aceptación:** `onScreenKeypadModal.test.tsx` pasa al 100% (GREEN).

---

### [x] TASK-029-03: Saneamiento Ergonómico de `PaymentPanel.tsx`, `CartPanel.tsx` y `LineaVentaRow.tsx` (COMPLETADA - GREEN)
- **Objetivo:** Adecuar las áreas de toque en los paneles de pago y carrito a los estándares $\ge 56\text{ px}$ y $\ge 48\text{ px}$, e integrar el Keypad emergente.
- **Archivos a modificar:**
  - `src/views/pos/components/PaymentPanel.tsx`:
    - Elevar botones de categorías a `min-h-[56px]` y sub-pills a `min-h-[48px]`.
    - Reforzar botón `⚡ Cobro Rápido 1-Tap` con `min-h-[56px]` y foco automático a `#pos-product-search-input`.
    - Asegurar botón principal de cobro `min-h-[56px]` y borrador `min-h-[48px]`.
  - `src/views/pos/components/CartPanel.tsx` & `src/views/pos/components/LineaVentaRow.tsx`:
    - Conectar clic sobre cantidad/peso al `OnScreenKeypadModal`.
    - Ajustar botones `+`, `-` y eliminar a `min-h-[48px] min-w-[48px]`.
- **Criterio de Aceptación:** Interacción táctil fluida sin solapamiento de teclados del OS y tests asociados en verde.

---

### [x] TASK-029-04: Layout Shell Canónico Universal y Type-Safety en `POSView.tsx` (COMPLETADA - GREEN)
- **Objetivo:** Reorganizar la vista principal `POSView` bajo el Layout Shell de 4 zonas fijas y erradicar magic strings de navegación.
- **Archivos a modificar:**
  - `src/views/POSView.tsx`:
    - Implementar Zona 1: Breadcrumb limpio + Título + 1 badge dinámico de turno.
    - Implementar Zona 2: Barra de control con máx. 3 botones primarios (`⚡ Cobro 1-Tap / Nuevo`, `Borrador`, `Balanza/Peso`) + Menú desplegable "Más Acciones..." (`Arqueo Parcial`, `Cerrar Turno`, `Reimprimir Ticket`, `Resolución DIAN`, `Monitor Siigo`).
    - Implementar Zona 3: 4 Tarjetas KPI con alto contraste Light Mode WCAG 2.2 AAA (`text-slate-900 font-black font-mono` sobre fondo blanco).
    - Erradicar magic strings: Reemplazar `'precios'` por `AppRouteId.PRICING` y `'dashboard'` por `AppRouteId.DASHBOARD`.
  - `src/views/pos/components/ProductSearchPanel.tsx`:
    - Garantizar `vectorOnly={true}` en todos los avatares para certificar Cero Imágenes en POS.
- **Criterio de Aceptación:** `posErgonomicsLayout.test.tsx` pasa al 100% y `audit-solid-boundaries.cjs` no emite alertas de magic strings en `POSView.tsx`.

---

### [x] TASK-029-05: Verificación Integral TDD, Auditoría SOLID y Bucle DevTools (COMPLETADA - CERTIFICADA)
- **Objetivo:** Certificar la compilación estricta, suite completa de Vitest, auditoría Master Architect y prueba visual con Chrome DevTools.
- **Acciones:**
  - `npx tsc --noEmit` en 0 errores.
  - Ejecución de la suite completa de pruebas de POS (`npm run test:run`).
  - Auditoría `node scripts/architecture/audit-solid-boundaries.cjs`.
  - Invocación de `chrome-devtools` para verificar renderizado responsive en móvil (375 px) y mostrador (1024 px) con 0 errores en consola JS.
- **Criterio de Aceptación:** 100% verde en pruebas, 0 errores en consola y certificación para cierre de sprint.
