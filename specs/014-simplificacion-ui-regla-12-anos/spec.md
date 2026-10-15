# Especificación de Requerimiento (Spec): Simplificación Radical de UI — Regla del Niño de 12 Años

**Código:** SPEC-014  
**Título:** Simplificación Radical de UI en POS y Operaciones (Regla del Niño de 12 Años: Fricción Cero, Targets $\ge 48\text{ px}$, Auto-Focus y Feedback Instantáneo)  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Autor:** Principal Frontend Architect & SDD Coordinator  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.specify`  

---

## 1. Resumen Ejecutivo y Propósito ("Por qué")

En entornos de mostrador de pescadería y puntos de venta minorista, los cajeros y operarios enfrentan un alto ritmo de atención, iluminación cambiante, manipulación con manos húmedas o guantes, y necesidad de rapidez sin margen de error. La interfaz actual del POS y sus módulos asociados acumula elementos densos, tamaños de botón sub-óptimos para pantallas táctiles y requiere múltiples clics o cambios de foco manual para tareas cotidianas.

La **"Regla del Niño de 12 Años"** establece un principio canónico de usabilidad:
> *Cualquier persona, incluso un niño de 12 años sin capacitación previa en sistemas contables ni experiencia en software ERP, debe ser capaz de operar la terminal de punto de venta, agregar productos por peso o unidad, cobrar con cualquier medio de pago y emitir un ticket en menos de 15 segundos sin equivocarse ni pedir ayuda.*

### Objetivos Clave de Negocio
1. **Reducción del Tiempo de Cobro (Speed-to-Checkout):** Disminuir en al menos un 40% los toques necesarios para completar una venta estándar en efectivo o transferencia.
2. **Eliminación de Falsos Toques (Error-Proofing):** Cumplimiento estricto de WCAG 2.2 Target Size Level AAA ($\ge 48 \times 48\text{ px}$) en todos los controles interactivos primarios del POS, carrito y modales.
3. **Flujo de Entrada Continuo (Zero-Friction Auto-Focus):** Retorno automático del cursor e input activo al campo de búsqueda/escáner tras cada acción (agregar ítem, limpiar carrito, liquidar venta, cambiar vendedor).
4. **Claridad Visual Cognitiva:** Jerarquía cromática de alto contraste en Modo Claro (100% WCAG 2.2 AA+, ratio $\ge 4.5:1$ y $\ge 7:1$), evitando textos minúsculos o badges confusos.

---

## 2. Definición del Requerimiento ("Qué")

### 2.1. Targets Táctiles Mínimos ($\ge 48\text{ px}$)
- **Botones de Acción Rápida:**
  - Botón táctil de Cobro: Tamaño prominente (`h-14` / $\ge 56\text{ px}$), ancho completo o preponderante, verde esmeralda (`#059669` / `#10B981`) con tipografía bold monoespaciada para el monto en COP.
  - Botones de incremento/decremento de cantidad (`+` / `-`) en cada línea del carrito: Mínimo $48 \times 48\text{ px}$ con micro-interacción activa (`active:scale-95`).
  - Botón de eliminación de línea (tacho de basura): Mínimo $48 \times 48\text{ px}$ con confirmación táctil directa y segura.
  - Botones de billetes rápidos en cobro ($2.000, $5.000, $10.000, $20.000, $50.000, $100.000 y "Exacto"): Altura mínima de $48\text{ px}$ con etiqueta legible y contraste inmediato.
  - **Pesaje 100% Manual (Sin Balanza Conectada):** La terminal opera sin integración electrónica de hardware de balanza. Para productos a granel/kilo, al seleccionarlos o pulsar su cantidad se despliega un mini-keypad táctil de entrada rápida con chips de peso frecuente (`0.5 kg`, `1 kg`, `1.5 kg`, `2 kg`, `5 kg`) y campo numérico auto-enfocado con selección total para digitar de inmediato el peso visto en la balanza física de mostrador.

### 2.2. Política de Auto-Focus y Fricción Cero
- **Auto-Focus al Montar e Inicializar:**
  - Al renderizar `POSView`, el foco se sitúa de inmediato en el buscador de productos / código de barras (`#pos-product-search-input`).
- **Auto-Focus Post-Transacción:**
  - Al completar un cobro (sea con impresión de ticket o cierre del modal de pago), el sistema limpia el estado y vuelve a enfocar `#pos-product-search-input` sin requerir toques del cajero.
- **Auto-Selección en Inputs Numéricos:**
  - Al abrir modales de cantidad manual, modificación de precio o descuento, el input numérico se abre con su valor seleccionado (`select()`) para que el siguiente toque o pulsación sobreescriba directamente sin necesidad de borrar manualmente con backspace.

### 2.3. Jerarquía Visual y Despeje Cognitivo (Light Mode WCAG AA+)
- **Eliminación de Ruido en el Carrito:**
  - Ocultar badges o métricas secundarias innecesarias durante la venta regular.
  - Destacar con claridad: Nombre del producto en negrita, Cantidad x Precio Unitario, Total de la línea en COP, y botón de eliminar/modificar espaciado.
- **Feedback Sensorial Inmediato:**
  - Cada adición de ítem al carrito dispara una micro-animación de pulso visual (`animate-in fade-in zoom-in-95` o bounce suave) en la barra de totales y en la línea agregada.
  - Mensajes de error claros, en lenguaje natural y sin códigos técnicos crípticos (ej. en lugar de "Constraint foreign key failed", mostrar "Selecciona un cliente válido o déjalo como Cliente Ocasional").

### 2.4. Integración Armónica con Módulos Existentes
- Mantiene compatibilidad total con:
  - `usePOSCart.ts` (cálculo de IVA, descuentos por línea y global).
  - `UserSwitchModal.tsx` (identificación de colaborador y vendedor activo de SPEC-013).
  - `posCashEngine.schema.ts` (arqueo ciego, denominaciones de Colombia).
  - `PosDraftService.ts` (guardar venta en espera y recuperarla en 1 solo toque).

---

## 3. Requerimientos Funcionales en Notación EARS

### EARS-01: Auto-Focus Ubicuo en Buscador POS
* **Condición Ubicua:** El sistema SIEMPRE debe mantener el foco activo en el input de búsqueda/escáner de productos cuando no haya ningún modal de confirmación abierto en pantalla.

### EARS-02: Target Size Táctil Mínimo en Controles de Carrito
* **Condición Ubicua:** El sistema SIEMPRE debe renderizar todos los botones táctiles interactivos de modificación de cantidad, eliminación de línea, pesaje de balanza y cobro con una dimensión mínima de $48 \times 48\text{ px}$ (touch target padding mínimo de $48\text{ px}$).

### EARS-03: Cobro Rápido en 1 Toque con Billetes Sugeridos
* **Evento (When):** Cuando el cajero abre el modal de cobro en efectivo y el monto total es menor o igual a un billete estándar colombiano,
* **Acción:** El sistema debe resaltar automáticamente el billete exacto o sugerido más cercano (`$10.000`, `$20.000`, `$50.000`, `$100.000`) para liquidar la venta y mostrar el cambio en COP con un solo toque.

### EARS-04: Retorno Inmediato a Nuevo Ticket
* **Evento (When):** Cuando se confirma el cobro exitoso de una orden en `PaymentPanel`,
* **Acción:** El sistema debe cerrar los modales superpuestos, emitir un toast de confirmación visual no bloqueante (máximo 1200 ms), limpiar el carrito y situar el foco en el buscador de productos para atender inmediatamente al siguiente cliente.

### EARS-05: Modificación Táctil y Entrada de Peso Manual Fricción Cero
* **Evento (When):** Cuando el operario selecciona un producto vendido por peso (`kg`/granel) o pulsa sobre la cantidad en la línea del carrito,
* **Acción:** El sistema debe desplegar un mini-keypad táctil numérico de acceso rápido con chips de peso frecuente (`0.5`, `1`, `1.5`, `2`, `3`, `5 kg`) y campo de texto numérico auto-enfocado y auto-seleccionado para digitar el peso de la balanza manual de mostrador en 1 solo paso sin salir de la vista de venta ni exigir conexión electrónica de balanza.

---

## 4. Criterios de Aceptación (Gobernanza & Quality Gate)

1. **Aceptación Visual & Accesibilidad:**
   - 100% de los elementos interactivos primarios cumplen con target size $\ge 48\text{ px}$.
   - Contraste WCAG 2.2 AA+ verificado en Light Mode (ratios $\ge 4.5:1$ en texto estándar y $\ge 3:1$ en componentes UI).
2. **Aceptación Funcional & TDD:**
   - Suites unitarias y de integración en Vitest cubriendo:
     - Comportamiento de auto-focus tras añadir ítem y tras liquidar cobro.
     - Dimensionamiento táctil de botones de carrito y cobro.
     - Selección automática de texto en inputs numéricos.
   - 100% de tests pasando (`npm run test:run`).
3. **Validación en Vivo Chrome DevTools MCP:**
   - Cero errores / warnings en consola JS (`list_console_messages`).
   - Inspección en viewport móvil/tablet de 375 px y 768 px demostrando usabilidad sin overflow horizontal indeseado ni solapamiento de botones.
4. **Gobernanza Continuous Kanban:**
   - Límite WIP = 1 respetado estrictamente.
   - Ninguna línea de código de producción será escrita hasta completar las fases `/speckit.clarify`, `/speckit.checklist`, `/speckit.plan`, `/speckit.tasks` y `/speckit.analyze` con las respectivas aprobaciones del usuario.

---

**Siguiente Paso del Flujo:** Esperar aprobación del usuario sobre esta Especificación (`/speckit.specify`) para proceder con el Control de Calidad 1 (`/speckit.clarify`).
