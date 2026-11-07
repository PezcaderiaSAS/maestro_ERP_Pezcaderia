# Tareas Granulares de Implementación: SPEC-054
**Fase:** `/speckit.tasks` (SDD v3.0)  
**Límite de Concurrencia:** WIP = 1 estricto (una sola tarea en ejecución a la vez)

---

## Tablero Kanban de Flujo Continuo

### [x] Tarea 1: Rediseño Anatómico de `LineaVentaRow.tsx` (Fila de Alta Densidad)
- **Estado:** Terminado (Done)
- **Descripción:** Rediseñar la fila de producto para adoptar formato de tabla esbelta:
  - Fondo uniforme oscuro de alto contraste (`bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/40`).
  - Nombre del producto en `text-white font-bold text-sm leading-tight`.
  - Edición inline tipo Excel: al tocar la cantidad o peso, activa foco inmediato en el input numérico.
  - Botones táctiles `[-]` y `[+]` de $\ge 36\text{px}$ para ajuste rápido.
  - Botón de báscula serial para pesaje directo en productos pesables (`KG`).
  - Subtotal en `text-emerald-400 font-mono font-bold text-sm tabular-nums`.
- **Verificación:** `npx vitest run src/tests/posCart12ItemsScroll.test.tsx` (100% verde).

---

### [x] Tarea 2: Reestructuración del Contenedor `CartPanel.tsx` (Espacio y Scroll)
- **Estado:** Terminado (Done)
- **Descripción:** Reestructurar `CartPanel.tsx` para garantizar que la lista de productos no colapse:
  - Header `pos-cart-header` condensado a $\le 40\text{px}$ (selector de cliente limpio, botón `En Espera (F6)` y badge de borradores).
  - Barra `ParkedOrdersBar` condensada a una cinta horizontal mínima $\le 36\text{px}$.
  - Contenedor de lista de productos con `flex-1 min-h-0 overflow-y-auto overscroll-contain` que asegura visualización fluida de más de 12 ítems.
  - Footer condensado con Subtotal, Descuento (<kbd>F4</kbd>), TOTAL gigante de alto contraste y botón principal.
- **Verificación:** `npx vitest run src/tests/challengerCartAdversarialStress.test.tsx` (100% verde).

---

### [x] Tarea 3: Componentes del Modo Cajero (`LiveComandasQueuePanel.tsx` & `DirectCashierCheckoutPanel.tsx`)
- **Estado:** Terminado (Done)
- **Descripción:** Desarrollar los dos componentes dedicados para la taquilla del cajero:
  - `LiveComandasQueuePanel.tsx`: Lista de preventas en espera (`PRE-YYYY-XXXXX`), orden FIFO, tarjetas táctiles con número de turno, asesor, cliente, total y tiempo en espera. Buscador rápido por turno/asesor/cliente.
  - `DirectCashierCheckoutPanel.tsx`: Panel de liquidación rápida permanente con total a pagar gigante, botones táctiles de denominaciones de billetes colombianos ($100k, $50k, $20k, $10k, $5k, $2k), input de efectivo recibido, cálculo instantáneo de vueltas/cambio y botón de confirmación de cobro (<kbd>Enter</kbd> / <kbd>F10</kbd>).
- **Verificación:** Pruebas unitarias en `src/tests/posCartRedesignAndCashierMode.test.tsx` (100% verde).

---

### [x] Tarea 4: Integración en `POSView.tsx` (Toggle Modo Cajero y Barra de Turno)
- **Estado:** Terminado (Done)
- **Descripción:** Conectar el Modo Cajero en `POSView.tsx`:
  - Botón toggle "Modo Caja Única / Modo Vendedor" en la barra de sub-vistas del POS (auto-activado si `userRole === 'cajero'`).
  - Renderizado condicional:
    - En Modo Cajero: área izquierda muestra `LiveComandasQueuePanel` y área derecha muestra `DirectCashierCheckoutPanel`.
    - En Modo Vendedor: área izquierda muestra Catálogo de Productos y área derecha muestra el nuevo `CartPanel` de alta densidad.
  - Barra superior de turno con total recaudado en el turno en vivo, acceso con un clic/tecla a **Arqueo Ciego (<kbd>F4</kbd>)** y **Egreso Rápido (<kbd>F7</kbd>)**.
- **Verificación:** Ejecución de flujo de navegación y pruebas de integración (100% verde).

---

### [x] Tarea 5: Suite de Pruebas Integrales y Quality Gate Final
- **Estado:** Terminado (Done)
- **Descripción:** Creada `src/tests/posCartRedesignAndCashierMode.test.tsx` cubriendo todos los criterios de aceptación (CHK-01 a CHK-15):
  - 12+ productos en carrito con scroll vertical fluido y 0px de colapso.
  - Edición inline y ajuste con botones `[-]` y `[+]`.
  - Conmutación al Modo Cajero y liquidación con billetes y cambio.
  - `npx tsc --noEmit` (0 errores) y suite completa pasando.
- **Verificación:** `npx tsc --noEmit && npm run build` (100% verde).

