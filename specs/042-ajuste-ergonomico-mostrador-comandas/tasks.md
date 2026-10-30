# Tareas de Implementación — SPEC-042
**Ajuste Ergonómico del Mostrador para Comandas y Ciclo de Vida Preventa**

> **Regla de Oro Brownfield:** Límite estricto de concurrencia `WIP = 1`. Ejecutar una sola tarea a la vez con ciclo TDD, deteniéndose para verificación tras cada modificación.

---

### Tareas Granulares y Secuenciales

- [x] **`TASK-042-01`**: **Suite TDD para Ergonomía y Contención Flexbox**
  - **Archivo:** `src/tests/posCartPanelErgonomics.test.tsx`
  - **Resultado:** Pruebas TDD diseñadas y validadas inicialmente en fase RED y posteriormente 100% en verde. ✅

- [x] **`TASK-042-02`**: **Refactorización de Layout Flexbox y Erradicación del Solapamiento Sticky**
  - **Archivo:** `src/views/pos/components/CartPanel.tsx`
  - **Resultado:** Contenedor `GlassCard` migrado a `overflow-hidden`, pie inferior `pos-cart-footer` anclado con `shrink-0 mt-auto` (erradicando `sticky bottom-0`), cabecera en tokens Dark Glassmorphism V8 (`bg-slate-900/60 border-white/10`) y placeholder de carrito vacío compacto de 80px sin desbordamiento. ✅

- [x] **`TASK-042-03`**: **Modernización Dark Glassmorphism V8 en `DiscountPanel` y `ParkedOrdersBar`**
  - **Archivos:** `src/views/pos/components/DiscountPanel.tsx` y `src/views/pos/components/ParkedOrdersBar.tsx`
  - **Resultado:** Eliminación total de `#0F172A` y `bg-slate-50`, migración a `text-slate-100 font-bold font-mono` y `bg-slate-900/80` con contraste WCAG 2.2 AA+ ($\ge 4.5:1$). Barra multicliente condicional cuando `drafts.length > 0`. ✅

- [x] **`TASK-042-04`**: **Modal de Confirmación de Emisión de Preventa / Comanda para Asesor**
  - **Archivo:** `src/views/pos/components/CartPanel.tsx`
  - **Resultado:** Integración de `modal-confirmar-comanda` con resumen de cliente, total a cobrar e indicación de traslado a Ventanilla antes de despachar el carrito. ✅

- [x] **`TASK-042-05`**: **Auditoría de Calidad Cruzada y Bucle Chrome DevTools MCP**
  - **Resultado:** 18 pruebas unitarias pasando al 100% en Vitest (`posCartPanelErgonomics`, `asesorMostradorSinCobro`, `posDarkGlassmorphismV8`), TypeScript `tsc --noEmit` con 0 errores, y verificación en vivo vía DevTools en `http://localhost:3000/`. ✅
