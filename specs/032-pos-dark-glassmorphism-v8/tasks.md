# Tareas Granulares de Implementación: SPEC-032 — Módulo POS Dark Glassmorphism V8

**Especificación:** SPEC-032 — Migración del Módulo POS al Estándar Dark Glassmorphism V8  
**Fase:** /speckit.tasks (SDD v3.0)  
**Ticket:** POS-DARK-GLASSMORPHISM-V8  
**Fecha:** 2026-10-26  
**Regla de Ejecución:** TDD Quirúrgico | Una sola tarea activa a la vez (`WIP = 1`) | Stop & Checkpoint  

---

### Lista de Tareas Secuenciales (WIP = 1)

- [x] **`TASK-032-01` — Suite de Pruebas Automatizadas TDD (Fase RED):**
  - Crear archivo de prueba `src/tests/posDarkGlassmorphismV8.test.tsx`.
  - Definir pruebas para:
    1. Renderizado de contenedores `GlassCard` con `box-shadow` especular y aceleración GPU `translateZ(0)`.
    2. Controles macOS funcionales en el panel de carrito (modo ultracompacto activado con botón amarillo `#FFBD2E`).
    3. Alturas táctiles ergonómicas del Keypad numérico ($\ge 56\text{ px}$), chips de billetes COP ($\ge 48\text{ px}$) y botón gigante COBRAR ($\ge 56\text{ px}$).
    4. Tipografía financiera monoespaciada en total y cambio devuelto (`text-emerald-400`).
    5. Preservación incondicional del retorno de foco al buscador `#pos-product-search-input`.
  - *Checkpoint de Verificación:* Test en estado RED inicial (4 fallos esperados / 1 pasando) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-032-02` — Migración de `CartPanel.tsx` a Dark Glassmorphism V8:**
  - Envolver el panel de carrito en `GlassCard` con controles macOS semánticos (`#FF5F56`, `#FFBD2E`, `#27C93F`).
  - Implementar alternancia de modo ultracompacto / detallado activado por el botón `#FFBD2E`.
  - Estilizar filas de ítems con `hover:bg-white/5`, botones táctiles `+` / `-` ($\ge 44\text{ px}$), botón de borrador de ticket con badge ámbar, y total acumulado en `text-emerald-400 font-mono font-black`.
  - *Checkpoint de Verificación:* Pruebas unitarias de `CartPanel` verdes (9/9 existentes + 2/2 nuevas) y `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-032-03` — Migración de `PaymentPanel.tsx` y Keypad Táctil Numérico:**
  - Transformar el modal/drawer de cobro a `GlassCard` centrado (`backdrop-blur-2xl`, `bg-slate-900/90`).
  - Cuadrantes táctiles de medios de pago con estado activo en Rojo Code XR (`bg-red-600 text-white shadow-lg shadow-red-600/30`).
  - Chips de billetes rápidos COP ($10k, $20k, $50k, $100k, Exacto) con altura $\ge 48\text{ px}$.
  - Teclado numérico táctil en pantalla con botones de $\ge 56\text{ px} \times 56\text{ px}$ y micro-animación `active:scale-95`.
  - Botón gigante de liquidación $\ge 56\text{ px}$ con cálculo en tiempo real del cambio (vuelto).
  - *Checkpoint de Verificación:* Pruebas de cobro y ergonomía táctil verdes (27/27 tests pasando entre nuevas y regresión) y `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-032-04` — Migración del Shell `POSView.tsx` y Modales Auxiliares de Caja:**
  - Reestructurar el layout general de `POSView.tsx` sobre el canvas `#0B0F19` con paneles flotantes desacoplados.
  - Panel de catálogo y búsqueda en `GlassCard` con buscador auto-enfocado y chips de categoría táctiles $\ge 48\text{ px}$.
  - Adaptar a `GlassCard` los modales de apertura de caja (`AperturaCajaModal.tsx`), retiro parcial (`RetiroParcialModal.tsx`), toggle de factura electrónica (`PosElectronicInvoiceToggle.tsx`) y botón de báscula (`BalanzaButton.tsx`).
  - *Checkpoint de Verificación:* Pruebas de `POSView` verdes (8/8 V8 + 69/69 regresión en 11 suites) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-032-05` — Certificación Integral, Suite Completa de Tests y Bucle DevTools:**
  - Ejecución de la suite completa de pruebas unitarias y de integración de POS (100% verde: 77/77 tests pasando).
  - Verificación estricta de `tsc --noEmit` con 0 errores de compilación.
  - Auditoría visual en vivo en Chrome DevTools (`http://localhost:3000/`) en desktop (1440 px) y móvil (375 px) certificando 0 errores fatales en consola JS.
  - *Checkpoint de Verificación:* Calidad 100% aprobada, grabada en `pos_glass_v8_audit_1793030347672.webp` y lista para el commit/cierre. [COMPLETADA]

---

**NOTA:** Este desglose de tareas se entrega formalmente para la revisión y aprobación explícita del usuario antes de proceder a la fase de análisis cruzado (`/speckit.analyze`).
