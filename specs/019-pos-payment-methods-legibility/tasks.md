# Desglose Atómico de Tareas: SPEC-019

**Código:** SPEC-019  
**Título:** Optimización de Legibilidad, Ergonometría Táctil y Desbordamiento en Medios de Pago POS  
**Estado:** IMPLEMENTACIÓN EN REVISIÓN  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.tasks`  
**Regla de Ejecución:** Límite Kanban WIP = 1 estricto. Una sola tarea activa a la vez.

---

## Tablero Kanban de Implementación

### Tarea 1: Suite de Pruebas Unitarias TDD (Vitest)
- [x] **TASK-01:** Crear la suite de pruebas unitarias en `src/tests/posPaymentMethodsLegibility.test.tsx` que modele la nueva jerarquía de medios de pago:
  - Renderizado de los 4 botones principales (`Efectivo`, `Transferencia`, `Datáfono`, `Crédito`) sin truncamiento.
  - Comportamiento al presionar `Transferencia`: renderizado de píldoras (`Nequi`, `Daviplata`, `QR Bancolombia`).
  - Atajos `F1-F4` y teclas `1-3`.
  - Verificación de emisión de `MetodoCobroPos` correcto en `onPagar`.
- **Criterio de Aceptación:** Prueba escrita y ejecutada en rojo (RED).
- **Estado:** ✅ Completado

---

### Tarea 2: Refactorización Estructural de Grilla y Estado en `PaymentPanel.tsx`
- [x] **TASK-02:** Actualizar `PaymentPanel.tsx` eliminando la grilla `sm:grid-cols-6` e implementando:
  - Estado `categoriaActiva` (`'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO'`) y `subTransferencia` (`'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA'`).
  - Grilla 2x2 para los 4 botones principales con altura mínima de $50\text{ px}$, iconos semánticos y badges de atajos `[F1]-[F4]`.
  - Sub-barra de transferencias en `grid-cols-3` con píldoras de $44\text{ px}$ para Nequi, Daviplata y QR Bancolombia con acentos de marca y cero truncamiento.
- **Criterio de Aceptación:** Los 6 métodos son plenamente legibles; la prueba pasa a verde (GREEN).
- **Estado:** ✅ Completado

---

### Tarea 3: Unificación de Iconos Semánticos en Modo Split (+ Split)
- [x] **TASK-03:** Refactorizar el renderizado del modo mixto (`isModoMixto`) en `PaymentPanel.tsx`:
  - Reemplazar el icono duplicado `Phone` por `Smartphone` (Nequi) y `Wallet` (Daviplata).
  - Asignar acentos de color en cada etiqueta de medio mixto (`text-fuchsia-600`, `text-rose-600`, `text-amber-600`, etc.).
  - Asegurar inputs `NumericFormat` con altura mínima de $44\text{ px}$ y contraste WCAG AA+.
- **Criterio de Aceptación:** Modo Split alineado con la identidad visual y táctil del cobro único.
- **Estado:** ✅ Completado

---

### Tarea 4: Soporte de Atajos de Teclado y Control de Foco
- [x] **TASK-04:** Actualizar el listener de eventos de teclado en `PaymentPanel.tsx`:
  - Mapear `F1` (Efectivo), `F2` (Transferencia), `F3` (Datáfono), `F4` (Crédito).
  - Si `categoriaActiva === 'TRANSFERENCIA'`, mapear teclas `1`, `2`, `3` a Nequi, Daviplata y QR si el foco no está en un input.
  - Actualizar el label visual del atajo en la cabecera a `<kbd>F1-F4</kbd>`.
- **Criterio de Aceptación:** Cambio fluido de medio sin mouse y sin interferir con la digitación de montos.
- **Estado:** ✅ Completado

---

### Tarea 5: Verificación de Bucle DevTools, Build y Quality Gate
- [x] **TASK-05:** Auditoría completa de calidad en medios de pago:
  - `npm test src/tests/posPaymentMethodsLegibility.test.tsx` (100% pasando: 5/5 pruebas).
  - `src/tests/posCartPanelErgonomics.test.tsx` y `src/tests/posQuickCashAndReturnFocus.test.tsx` (100% pasando: 8/8 pruebas).
  - `npx tsc --noEmit` sin errores de tipado (0 errores).
  - Servidor Vite operativo en `http://localhost:3000` (Status 200).
- **Criterio de Aceptación:** Aprobación visual confirmada por el usuario.
- **Estado:** ✅ Completado

---

### Tarea 6: Refactorización Ergonómica de Línea de Producto en Carrito (`LineaVentaRow.tsx`)
- [x] **TASK-06:** Reestructurar la fila de producto del carrito en un diseño card de 2 niveles (Two-Tier):
  - **Nivel 1 (Cabecera):** Título completo sin roturas verticales de palabras (`PESCADO ENTERO (MATERIA PRIMA)`), badges de unidad (`⚖️ KILOS`/`📦 UNIDAD`), badge manual y botón eliminar `[✕]` táctil $\ge 48\text{px}$ en esquina superior derecha.
  - **Nivel 2 (Detalles y Controles):** Total línea prominente, botón de edición de precio unitario (`Edit3`), badge de stock disponible a la izquierda; botón Balanza (`BalanzaButton`), botón decrementar `[-]` ($\ge 48\text{px}$), input numérico directo sin artefacto de contenedor doble/anidado ($\ge 48\text{px}$ con auto-selección) y botón incrementar `[+]` ($\ge 48\text{px}$) a la derecha.
  - Verificación de suites: `src/tests/posCartRowErgonomics.test.tsx`, `src/tests/posTouchErgonomics.test.tsx` (100% pasando: 14/14 pruebas).
  - Verificación `npx tsc --noEmit` (0 errores).
- **Criterio de Aceptación:** Título legible con amplitud horizontal, input de cantidad limpio con un solo borde, controles táctiles ergonómicos $\ge 48\text{px}$.
- **Estado:** ✅ Completado

