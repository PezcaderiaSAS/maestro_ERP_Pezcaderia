# Lista de Verificación de Calidad — SPEC-039
**Calidad Frontend Enterprise, Accesibilidad WCAG 2.2 AA+ y Suite E2E Multivendedor - Caja Única**

---

## 1. Estándares de Accesibilidad Visual (WCAG 2.2 Nivel AA / AAA)
- [ ] **CHK-A11Y-01 (Ratio de Contraste en Semáforo Operativo):**
  - La tarjeta "Stock en Cuarto Frío" (`ExecutiveTrafficLightWidget.tsx`) debe sustituir el fondo `bg-rose-950/40` por una superficie neutra dark glassmorphism (`bg-slate-900/90`) con borde perimetral `border-rose-500/40`.
  - El valor numérico debe renderizarse en `text-white font-mono font-black` y el badge de estado en `bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40`, garantizando una relación de contraste $\ge 7:1$ (WCAG AAA).
- [ ] **CHK-A11Y-02 (Contraste en Textos Secundarios del POS):**
  - Los textos secundarios en paneles de liquidación ("TOTAL A LIQUIDAR", "Medio de Cobro", "Cambio Sugerido") deben mantener una escala mínima de `text-slate-300` o `text-slate-200` sobre fondos oscuros (ratio $\ge 4.5:1$).
- [ ] **CHK-A11Y-03 (Atributos Semánticos y Accesibilidad ARIA):**
  - Los botones interactivos de la barra superior (`EnterpriseTopbar.tsx`) y del Semáforo deben incluir etiquetas `aria-label`, `title` explicativo y estados de foco visibles (`focus:ring-2 focus:ring-cyan-400`).

---

## 2. Ergonomía de Interfaz y Prevención de Errores (Laptops & Pantallas Táctiles)
- [ ] **CHK-ERGO-01 (Acotamiento de Breadcrumbs en Topbar):**
  - La ruta del módulo activo en `EnterpriseTopbar.tsx` no debe colapsar en pantallas `sm` o intermedias. Debe aplicar `truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px]` con atributo `title` nativo para inspección al pasar el cursor.
- [ ] **CHK-ERGO-02 (Zona Segura y Descongestión en Barra Superior):**
  - El grupo de control derecho ("ONLINE", "Facturar POS", selector de temas, avatar de usuario) debe garantizar una separación física mínima de 12px (`gap-2 sm:gap-3` y paddings calibrados) para evitar toques accidentales en laptops táctiles.
- [ ] **CHK-ERGO-03 (Aislamiento de Scroll en POS):**
  - La vista `POSView.tsx` debe estructurarse con `h-full min-h-0 overflow-hidden`, donde el catálogo de productos y el panel de liquidación dispongan de áreas de desplazamiento vertical (`overflow-y-auto`) independientes y estilizadas.

---

## 3. Suite de Pruebas End-to-End (E2E) con Playwright
- [ ] **CHK-E2E-01 (Flujo Completo Multivendedor - Caja Única):**
  - La prueba automatizada debe ejecutar el ciclo secuencial determinista:
    1. Asesor comercial selecciona productos marítimos en mostrador y hace clic en "Crear Preventa".
    2. El sistema emite la comanda con código `PV-XXXX` y estado `PENDIENTE_COBRO`.
    3. En la estación de Caja Única (vía Cajero Central o Cola Central de Comandas), la orden aparece reactivamente.
    4. El cajero selecciona la comanda, ingresa el efectivo recibido en el modal de cobro y confirma la transacción.
    5. El sistema actualiza el estado a `PAGADA`, emite el número de tirilla y renderiza el código QR para validación en despacho.
- [ ] **CHK-E2E-02 (Resiliencia e Idempotencia de Datos):**
  - La prueba debe ejecutar en modo headless y headed sin dependencias externas, sembrando datos de prueba limpios vía `page.addInitScript(SEED_DATA)` y limpiando `localStorage` antes de cada ejecución.
- [ ] **CHK-E2E-03 (Tolerancia a Latencias de Render):**
  - Se deben emplear localizadores estables basados en `data-testid` y `has-text`, con aserciones asíncronas (`toBeVisible()`) configuradas con timeouts prudentes ($\ge 10$s) para prevenir pruebas intermitentes (flaky tests).

---

## 4. Estabilidad y Regresión de la Aplicación
- [ ] **CHK-REG-01 (Cero Errores en Consola JS):**
  - Verificación mediante Chrome DevTools MCP en `localhost:3000` comprobando que no existan errores de renderizado ni warnings críticos de React 18.
- [ ] **CHK-REG-02 (Suite Vitest 100% Verde):**
  - Los 166 archivos de pruebas unitarias y de integración existentes deben continuar pasando sin regresiones tras las mejoras de UI.
- [ ] **CHK-REG-03 (Chequeo Estricto de TypeScript):**
  - `npx tsc --noEmit` debe retornar 0 errores de tipado.
