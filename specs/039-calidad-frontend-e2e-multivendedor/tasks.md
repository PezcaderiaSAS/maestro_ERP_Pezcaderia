# Tareas de Implementación — SPEC-039
**Calidad Frontend Enterprise, Accesibilidad WCAG 2.2 AA+ y Suite E2E Multivendedor - Caja Única**

> **Gobernanza:** Flujo Continuo Kanban con límite estricto `WIP = 1`.  
> Ninguna tarea comenzará hasta que la anterior esté terminada, testeada y aprobada por el usuario.

---

## Tablero Kanban de Flujo Continuo (WIP = 1)

### Columna: Por Hacer (To Do)
- [x] **TASK-039-01:** Implementar y ejecutar la suite E2E en Playwright (`tests/e2e/multivendor-cashier-flow.spec.ts`) para el ciclo completo Multivendedor - Caja Única.
- [x] **TASK-039-02:** Diseñar suite TDD (`src/tests/executiveTrafficLightA11yV8.test.tsx`) y refactorizar accesibilidad y contraste WCAG AAA en la Tarjeta 3 de `ExecutiveTrafficLightWidget.tsx`.
- [x] **TASK-039-03:** Refactorizar `EnterpriseTopbar.tsx` implementando acotamiento con `title` para breadcrumbs largos y zona segura ergonómica con separación $\ge 12$px.
- [x] **TASK-039-04:** Ajustar aislamiento de scroll en `POSView.tsx` garantizando scrollbars independientes para catálogo y panel de liquidación sin desbordes de ventana.
- [x] **TASK-039-05:** Auditoría en vivo con Chrome DevTools MCP en `localhost:3000` (1366×768 y 375px), verificación de consola (0 errores) y ejecución de suites completas Playwright + Vitest.

---

## Desglose Detallado de Tareas

### TASK-039-01: Suite E2E Playwright de Ciclo Multivendedor - Caja Única
- **Archivo:** `tests/e2e/multivendor-cashier-flow.spec.ts`
- **Acciones:**
  1. Configurar viewport `1366×768` y cargar seeds `seedPOS` y `seedCash` vía `localStorage`.
  2. Simular selección de producto en mostrador y clic en "Crear Preventa" / "Guardar Comanda".
  3. Comprobar asignación de código `PV-` y estado `PENDIENTE_COBRO`.
  4. Abrir la Cola de Comandas o panel de recaudo, seleccionar la preventa y transicionar a cobro.
  5. Completar liquidación con efectivo exacto o superior, validando cálculo de cambio.
  6. Asertar la confirmación con número de tirilla y renderizado de código QR.
- **Criterio de Aceptación:** `npx playwright test tests/e2e/multivendor-cashier-flow.spec.ts` 100% pasando.

### TASK-039-02: Accesibilidad y Contraste WCAG AAA en Semáforo Operativo
- **Archivos:** 
  - `src/tests/executiveTrafficLightA11yV8.test.tsx` (TDD)
  - `src/views/dashboard/components/ExecutiveTrafficLightWidget.tsx`
- **Acciones:**
  1. Escribir test validando que la Tarjeta 3 use superficie neutra `bg-slate-900/90`, borde `border-rose-500/40`, valor `text-white font-mono` y badge con contraste $\ge 7:1$.
  2. Sustituir `bg-rose-950/40` y `text-rose-400` por los tokens de alto contraste.
- **Criterio de Aceptación:** Test unitario verde y verificación de ratio WCAG AAA.

### TASK-039-03: Ergonomía y Acotamiento de Breadcrumb en Barra Superior
- **Archivos:**
  - `src/components/layout/EnterpriseTopbar.tsx`
  - `src/tests/enterpriseTopbarA11yV8.test.tsx` (o suite existente de Topbar)
- **Acciones:**
  1. Acotar el título largo con `truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px]` y atributo `title`.
  2. Ajustar `gap-2 sm:gap-3` en el área derecha para garantizar separación de 12px entre elementos clicables.
- **Criterio de Aceptación:** En resoluciones `1366×768`, los botones "ONLINE", "Facturar POS" y el avatar no se desbordan ni solapan.

### TASK-039-04: Aislamiento de Scroll en POS
- **Archivo:** `src/views/POSView.tsx`
- **Acciones:**
  1. Verificar que el contenedor de `POSView` mantenga `h-full min-h-0 overflow-hidden`.
  2. Asegurar que el catálogo de productos y el panel de liquidación tengan `overflow-y-auto` independiente.
- **Criterio de Aceptación:** Al navegar por un catálogo con decenas de productos, el panel de cobro permanece anclado y visible sin scroll de la ventana global.

### TASK-039-05: Certificación en Vivo Chrome DevTools y Suites Globales
- **Acciones:**
  1. Navegar en `localhost:3000` con Chrome DevTools MCP en `1366×768` y `375px`.
  2. Auditar consola JS (0 errores, 0 warnings de renderizado).
  3. Ejecutar suite Vitest completa (`npm run test:run`) y `npx tsc --noEmit`.
  4. Ejecutar suite E2E con `npm run test:e2e`.
- **Criterio de Aceptación:** 100% pruebas verdes y certificación de calidad antes del despliegue.
