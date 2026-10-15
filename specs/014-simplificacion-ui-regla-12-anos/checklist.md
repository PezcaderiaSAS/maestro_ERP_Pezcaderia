# Checklist de Calidad y Estándares de Industria: SPEC-014

**Código:** SPEC-014  
**Título:** Simplificación Radical de UI en POS y Operaciones (Regla del Niño de 12 Años)  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  

---

## 1. Estándares de Ergonomía Táctil y Accesibilidad (WCAG 2.2 Level AAA Target Size)
- [ ] **CH-01:** Todos los botones de acción primaria e interactivos (`Cobrar`, `Vaciar Carrito`, `Guardar Espera`, `Recuperar Espera`, `Cambiar Vendedor`) poseen una altura mínima de $48\text{ px}$ (o $56\text{ px}$ para el botón `Cobrar`).
- [ ] **CH-02:** Los controles de ajuste de cantidad `+` y `-` en cada línea del carrito tienen una zona táctil mínima garantizada de $48 \times 48\text{ px}$ con espacio de separación para evitar toques adyacentes accidentales.
- [ ] **CH-03:** El botón de eliminación de ítem (`Trash2`) cuenta con target size de $48 \times 48\text{ px}$ y contraste visual inmediato.
- [ ] **CH-04:** En el panel de pago, los botones de billetes rápidos colombianos (`$2.000`, `$5.000`, `$10.000`, `$20.000`, `$50.000`, `$100.000` y `Exacto`) tienen una altura mínima de $48\text{ px}$ con tipografía numérica monoespaciada legible.
- [ ] **CH-05:** Para productos vendidos por peso (`kg`/granel), al seleccionarlos o pulsar su cantidad se ofrece entrada táctil manual inmediata con chips de peso rápido (`0.5`, `1`, `1.5`, `2`, `5 kg`) y campo numérico auto-enfocado de $\ge 48\text{ px}$, prescindiendo de requerimientos de conexión electrónica de balanza.

---

## 2. Flujo de Foco y Cero Fricción (Keyboard & Touch Ergonomics)
- [ ] **CH-06:** Al iniciar el POS o cambiar de vista hacia el POS, el elemento `#pos-product-search-input` recibe el foco de forma automática e inmediata (`autoFocus`).
- [ ] **CH-07:** Al añadir un ítem mediante código de barras, clic o balanza, el cursor y el foco regresan de inmediato a `#pos-product-search-input` sin requerir clic manual.
- [ ] **CH-08:** Al pulsar sobre el número de cantidad o peso en la fila del carrito, el input inline entra en modo de edición con su texto/valor completamente seleccionado (`select()`), permitiendo sobrescribirlo instantáneamente.
- [ ] **CH-09:** Al completar exitosamente un cobro en `PaymentPanel`, los modales se cierran inmediatamente, se dispara la orden de impresión térmica y el foco se reubica en `#pos-product-search-input` para la siguiente venta.
- [ ] **CH-10:** Se mantiene el soporte completo de atajos de teclado físico (`Enter`/`F4` = Cobrar, `Espacio` = Monto Exacto, `Alt+1..6` = Medios de Pago) sin interferir con la digitación en inputs de texto.

---

## 3. Feedback Táctil, Percepción y Despeje Visual
- [ ] **CH-11:** Cada adición o cambio de ítem en el carrito dispara una micro-interacción visual suave (pulso o resalte sutil) en el total del carrito y en la línea afectada.
- [ ] **CH-12:** Tras el cobro exitoso, la confirmación visual se realiza mediante un toast no invasivo con duración máxima de 1200 ms, sin obligar al cajero a descartar diálogos modales para atender al siguiente cliente.
- [ ] **CH-13:** Se ocultan o colapsan badges técnicos y métricas redundantes en la vista del carrito, priorizando Nombre, Cantidad, Precio Unitario y Subtotal en tipografía de alto contraste.
- [ ] **CH-14:** Ratio de contraste verificado en 100% Modo Claro (Light Mode) cumpliendo WCAG 2.2 AA (ratio $\ge 4.5:1$ para textos regulares y $\ge 3:1$ para bordes/botones).

---

## 4. Calidad Técnica, Pruebas TDD y Bucle DevTools
- [ ] **CH-15:** Cobertura de pruebas unitarias e integración en Vitest $\ge 80\%$ para los componentes modificados (`ProductSearchPanel`, `CartPanel`, `LineaVentaRow`, `PaymentPanel`).
- [ ] **CH-16:** Verificación de tipos TypeScript estricta (`npx tsc --noEmit`) sin advertencias ni uso de tipos `any` inseguros.
- [ ] **CH-17:** Verificación en bucle Chrome DevTools MCP en vivo:
  - 0 errores y 0 warnings en la consola JavaScript.
  - Validación de renderizado responsivo y touch targets en viewport móvil de **375 px** y tablet de **768 px**.
- [ ] **CH-18:** Límite Kanban WIP = 1 respetado rigurosamente durante todo el ciclo de desarrollo.
