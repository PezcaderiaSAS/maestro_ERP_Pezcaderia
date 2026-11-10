# Checklist de Calidad y Plan Técnico de Implementación (SPEC-057)

**Referencia:** [spec_057_pos_integral_refactor_frontend.md](file:///c:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/spec_057_pos_integral_refactor_frontend.md)  
**Metodología:** Spec-Driven Development (SDD v3.0) & Continuous Kanban Flow (WIP = 1)  

---

## 1. Lista de Verificación de Calidad (Quality Checklist)

### Ergonomía y UI/UX (SaaS Light Mode)
- [x] **Estructura Flexbox Vertical:** El contenedor del carrito ocupa el 100% de la altura útil sin scroll en la ventana global del navegador.
- [x] **Scroll Prioritario:** La lista de ítems del carrito dispone de un mínimo del 85% del espacio visual libre con scroll independiente (`overflow-y-auto`).
- [x] **Pie de Carrito Fijo:** El bloque de Subtotal, Descuentos, Total y Botones de Acción (<kbd>F6</kbd> / <kbd>F2</kbd>) permanece anclado con `shrink-0` sin solaparse nunca con la lista de productos.
- [x] **Ley de Fitts:** Todos los botones interactivos táctiles cumplen un tamaño mínimo de $\ge 48$px en desktop y $\ge 44$px en móvil.
- [x] **Prevención de Desbordamiento:** Títulos de productos y notas truncados a un máximo de 2 líneas (`line-clamp-2`, `min-w-0`), con tooltip en hover / long-press.

### Lógica Comercial y Financiera
- [x] **Edición de Cantidad y Precio:** Inputs editables continuos en cada fila del carrito con alternancia fluida mediante tecla <kbd>Tab</kbd>.
- [x] **Control de Margen y Seguridad:** Si el precio propuesto es menor a `Costo Base + 15%` o el descuento supera el `10%`, se exige obligatoriamente PIN de supervisor (4 dígitos).
- [x] **Descuento en Línea:** Soporte para descuento porcentual (%) y monetario ($) individual por ítem.
- [x] **Descuento Global:** Botón <kbd>+ Descuento (F4)</kbd> con selector `%` o `$` que recalcula instantáneamente el Total a Pagar.
- [x] **Reactividad Sub-10ms:** Las actualizaciones en el store de Zustand disparan el recálculo financiero en menos de 10ms.

### Catálogo y Periféricos
- [x] **Paginación 6×3 con Memoria Virtual:** Grilla de 18 tarjetas con botones inferiores de paginación `< Anterior 1 2 3 ... Siguiente >` y transiciones `< 16ms`.
- [x] **Visualización de Stock:** Productos con stock 0 muestran opacidad reducida (`opacity-60`) y etiqueta destacada de "AGOTADO".
- [x] **Productos KG Balanza:** Al escanear o pulsar un producto a granel, se despliega el teclado numérico táctil para ingreso manual rápido de peso en kilogramos.
- [x] **Atajos de Teclado Globales:** <kbd>F8</kbd> (Búsqueda), <kbd>Ctrl+K</kbd> (Búsqueda rápida), <kbd>F6</kbd> (Comanda mostrador), <kbd>F2</kbd> (Cobro directo), <kbd>F9</kbd> (Modo cajero), <kbd>Esc</kbd> (Cerrar).
- [x] **Resiliencia Offline:** Sincronización continua de comandas con IndexedDB (Dexie.js) en caso de caída de conexión.

---

## 2. Desglose de Tareas Técnicas Granulares (WIP = 1)

### Tarea 1: Estructura de Carrito con Fila Editable y Navegación Tab
- Modificar [`POSMultivendorCart.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/POSMultivendorCart.tsx):
  - Incorporar inputs numéricos editables directos para `cantidad` y `precioUnitario` con soporte de tecla <kbd>Tab</kbd>.
  - Agregar botón micro `[+ Desc]` en cada fila para descuento porcentual/fijo.
  - Asegurar la estructura vertical estricta `flex-1 min-h-0 overflow-y-auto` y anclaje del pie de página.
- Crear suite de pruebas TDD en `src/tests/posCartEditableRow.test.tsx`.

### Tarea 2: Motor de Descuento Global y Bloque de Totales
- Extender el bloque inferior de [`POSMultivendorCart.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/POSMultivendorCart.tsx):
  - Añadir popover interactivo activable mediante botón o atajo <kbd>F4</kbd> para aplicar descuento global en `%` o `$`.
  - Recálculo en tiempo real de Subtotal, Descuento Global, IVA y Total.
- Integrar con el hook financiero del POS.

### Tarea 3: Modal de Teclado Numérico Táctil para Productos Granel (KG)
- Modificar el trigger de pesaje en [`POSMultivendorView.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/POSMultivendorView.tsx):
  - Desplegar [`ManualWeightModal.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/ManualWeightModal.tsx) inmediatamente al seleccionar o escanear productos tipo `KG Balanza`.
  - Habilitar digitación táctil inmediata (botones de teclado numérico grandes $\ge 48$px).

### Tarea 4: Interceptor Global de Atajos de Teclado (<kbd>F8</kbd>, <kbd>F6</kbd>, <kbd>F4</kbd>, <kbd>F2</kbd>, <kbd>F9</kbd>, <kbd>Ctrl+K</kbd>)
- Implementar o unificar el hook de hotkeys en [`POSMultivendorLightHeader.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/POSMultivendorLightHeader.tsx) y [`POSMultivendorView.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/POSMultivendorView.tsx):
  - Mapear estrictamente los atajos sin conflicto cuando el usuario está digitando en un input.

### Tarea 5: Validación Comercial con PIN de Supervisor (SupervisorPinModal)
- Conectar la edición de precio y descuento con la regla acordada:
  - Si el precio modificado reduce el margen a $< 15\%$ o el descuento $> 10\%$, disparar [`SupervisorPinModal`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/SupervisorPinModal.tsx).
  - Revertir el valor si el supervisor no autoriza.

### Tarea 6: Auditoría y Quality Gate Final
- Ejecutar `tsc --noEmit` (0 errores).
- Ejecutar suite completa de pruebas Vitest (100% verde).
- Validar layout responsive (375px móvil y 1280px desktop) con Chrome DevTools.

