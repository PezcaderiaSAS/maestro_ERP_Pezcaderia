# Handoff Report: Spec Mining de SPEC-057 (Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS)

**Fecha:** 2026-11-08  
**Agente:** Spec Miner (`survey_spec_miner_spec057`)  
**Metodología:** SDD v3.0 / Spec Kit & EARS  
**Proyecto:** Maestro Pescadería ERP (`maestro_ERP_Pezcaderia`)  
**Directorio de Estado:** `.agents/teamwork/survey_spec_miner_spec057`  

---

## 1. Observation

A partir de la inspección exhaustiva de las fuentes autorizadas de especificación y del código fuente existente:
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- `specs/spec_057_pos_integral_refactor_frontend.md`
- `specs/spec_057_plan_checklist.md`
- `.agents/teamwork/survey_spec_miner_spec057/DISPATCH.md`
- Componentes y stores de producción:
  - `src/views/pos/components/POSMultivendorCart.tsx` (Líneas 1-289)
  - `src/views/pos/components/POSMultivendorView.tsx` (Líneas 1-209)
  - `src/views/pos/components/POSMultivendorCatalog.tsx` (Líneas 1-272)
  - `src/views/pos/components/POSMultivendorLightHeader.tsx` (Líneas 1-247)
  - `src/views/pos/components/ManualWeightModal.tsx` (Líneas 1-286)
  - `src/views/pos/components/SupervisorPinModal.tsx` (Líneas 1-288)
  - `src/stores/useMultiVendorPosStore.ts` (Líneas 1-265)
  - `src/schemas/prefactura.schema.ts` (Líneas 1-213)
  - `src/services/posService.ts` (Líneas 1-133)
  - `src/hooks/usePOSKeyboardShortcuts.ts` (Líneas 1-146)

Se verificaron empíricamente los siguientes hechos técnicos:
1. **Estado Actual de `POSMultivendorCart.tsx`:** Cuenta con botones stepper `[+]` y `[-]`, subtotal de línea y botón `Trash2` para eliminar (`src/views/pos/components/POSMultivendorCart.tsx:167-200`). Sin embargo, **NO** dispone de `inputs` numéricos editables continuos en línea para Cantidad ni Precio Unitario, **NO** implementa navegación continua con la tecla <kbd>Tab</kbd>, **NO** incluye el botón micro `[+ Desc]` por línea, y en el pie fijo de totales **NO** existe el botón anclado `+ Descuento (F4)`.
2. **Estructura Flexbox:** El contenedor de ítems en `POSMultivendorCart.tsx` tiene `flex-1 overflow-y-auto`, pero la especificación exige estrictamente asegurar la regla del **85% de espacio vertical útil** mediante flexbox vertical estricto (`h-full min-h-0 flex flex-col`, `flex-1 min-h-0 overflow-y-auto` y `shrink-0 mt-auto bg-white border-t border-slate-200`) garantizando que los totales y botones de acción nunca se solapen ni queden ocultos.
3. **Estado de Pruebas TDD (`src/tests/posCartEditableRow.test.tsx`):** El archivo no existe actualmente en el repositorio (`Test-Path` retornó `False`). Debe crearse de manera prioritaria bajo metodología TDD (RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR) para la Tarea 1.
4. **Modal de Pesaje Manual (`ManualWeightModal.tsx`):** Ya existe un componente muy completo con teclado táctil numérico en pantalla, chips de peso rápido (0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5 kg) y cálculo reactivo de subtotal en COP (`src/views/pos/components/ManualWeightModal.tsx:15-67`). Sin embargo, en `POSMultivendorView.tsx:89-91`, al escanear código de barras de un ítem a granel se agrega directamente 1 unidad sin disparar `ManualWeightModal`; la Tarea 3 exige desplegar inmediatamente este modal al escanear o seleccionar ítems `KG Balanza` para evitar bloqueos por llamadas seriales.
5. **Modal de Supervisor (`SupervisorPinModal.tsx`):** Ya implementa teclado táctil de 4 dígitos y valida el PIN contra los empleados configurados en `useEmployeeStore` verificando privilegios (`ADMINISTRADOR`, `GERENTE`, `SUPERVISOR`, `JEFE`). En `useMultiVendorPosStore.ts:158-214` ya existe la restricción de que si `descuentoPct > maxDescuentoVendedorPct` (10%) se exige supervisor. No obstante, falta integrar la regla complementaria: si el **Precio Propuesto < Costo Base + 15%**, también debe disparar obligatoriamente `SupervisorPinModal`.
6. **Atajos Globales de Teclado:** En `src/hooks/usePOSKeyboardShortcuts.ts` los atajos estaban mapeados con una asignación anterior de SPEC-047 (donde F8 era anulación y F6 era búsqueda). SPEC-057 define una asignación canónica estricta: <kbd>F8</kbd> (Buscador catálogo), <kbd>Ctrl+K</kbd> (Búsqueda multi-criterio), <kbd>F6</kbd> (Comanda de mostrador), <kbd>F4</kbd> (Descuento global), <kbd>F2</kbd> (Cobro directo en caja), <kbd>F9</kbd> (Modo cajero único), y <kbd>Esc</kbd> (Cerrar modales).
7. **Paginación 18 Tarjetas (6×3):** En `src/views/pos/components/POSMultivendorCatalog.tsx` se tiene `ITEMS_PER_PAGE = 18` y paginación inferior. Se requiere asegurar que el dataset en memoria permanezca virtualizado para garantizar transiciones `< 16ms` (60 FPS) al cambiar categorías o filtrar por texto.
8. **Health Check Base de Código:** `npx tsc --noEmit` compiló limpiamente con 0 errores de tipado TypeScript (exit code 0), y las suites de pruebas existentes de POS (`posMultivendorLightSaaS.test.tsx`, `posManualWeightModal.test.tsx`, `useMultiVendorPosStore.test.ts`) ejecutaron al 100% en verde (20/20 tests pasando).

---

## 2. Features Discovered

| # | Categoría | Feature | Descripción | Inputs | Outputs | Error Behavior | Discovered Via |
|---|-----------|---------|-------------|--------|---------|----------------|----------------|
| F1.1 | Carrito (UI/UX) | Fila Editable: Input Cantidad | Input numérico en línea que permite modificar la cantidad con auto-selección al enfocar (`onFocus select`). | `cantidad: number` (permite decimales para KG) | Actualiza `cantidad`, recalcula subtotal de línea instantáneamente. | Si valor $\le 0$, remueve ítem o resetea a 1. | SPEC-057 §3.4, R1 |
| F1.2 | Carrito (UI/UX) | Fila Editable: Input Precio Unitario | Input numérico en línea que permite modificar el precio unitario pactado para el ítem. | `nuevoPrecio: number` (enteros COP) | Actualiza `precioUnitario` / `precioOverride`, recalcula subtotal. | Si precio $\le 0$, rechaza cambio. Si viola margen $<15\%$ costo, dispara F5. | SPEC-057 §3.4, R1 |
| F1.3 | Carrito (UX) | Navegación Tabular Continua [Tab] | Al pulsar <kbd>Tab</kbd> en el input de Cantidad, el foco salta directamente al input de Precio de la misma fila; al pulsar <kbd>Tab</kbd> en Precio, salta a Cantidad de la siguiente fila. | Evento <kbd>Tab</kbd> / `tabIndex` | Foco continuo sin requerir uso de ratón. | Salto cíclico o salida al pie del carrito al llegar al último ítem. | SPEC-057 §3.4, R1 |
| F1.4 | Carrito (UI) | Micro-Botón `[+ Desc]` por Fila | Botón compacto en cada fila que abre un selector de descuento por ítem (% o $ COP) y muestra badge de descuento. | Clic en `[+ Desc]`, ingreso de % o $ | Aplica descuento individual al ítem (`descuentoPct` o monto). | Si descuento $> 10\%$, dispara F5 (Supervisor PIN). | SPEC-057 §3.4, R1 |
| F1.5 | Carrito (Layout) | Flexbox Vertical Estricto (85% espacio) | Contenedor `h-full min-h-0 flex flex-col`, área de ítems `flex-1 min-h-0 overflow-y-auto` (85% altura), pie anclado `shrink-0 mt-auto`. | Renderizado en viewport desktop y móvil | Lista scrolleable independiente, pie fijo nunca superpuesto. | Cero desbordamientos de ventana externa (`overflow: hidden`). | SPEC-057 §4 Fase 1, Checklist §1 |
| F1.6 | TDD | Suite de Pruebas `posCartEditableRow.test.tsx` | Suite exhaustiva Vitest + RTL que prueba la fila editable, inputs, navegación Tab, micro-botón y recálculos. | Casos de prueba automatizados | 100% tests en verde. | Falla de assertions si inputs no navegan o no recalculan. | SPEC-057 §4, ORIGINAL_REQUEST |
| F2.1 | Finanzas | Botón Anclado `+ Descuento (F4)` | Botón persistente en el bloque inferior de totales del carrito. | Clic o pulsación de <kbd>F4</kbd> | Despliega popover / modal de Descuento Global. | Inhabilitado si carrito vacío (`items.length === 0`). | SPEC-057 §3.5, R2 |
| F2.2 | Finanzas | Selector de Descuento Global [% / $] | Selector de modo (porcentual `%` o valor fijo `$ COP`) con input numérico y presets rápidos. | Modo (`%` o `$`), valor de descuento | Calcula monto de descuento global. | Rechaza si descuento $>$ subtotal bruto. Si $\%$ $> 10\%$, dispara F5. | SPEC-057 §3.5, R2 |
| F2.3 | Estado (Zustand) | Recálculo Reactivo Sub-10ms | Recálculo en tiempo real de Subtotal, Descuento, IVA y Total a Pagar en Zustand al variar cualquier parámetro. | Mutación en store (`setDescuentoGlobal`) | Actualización síncrona en memoria en $<10$ms. | Cero parpadeos o bloqueos de hilo principal (60 FPS). | SPEC-057 §3.5, R2 |
| F3.1 | Balanza (UX) | Trigger Inmediato `ManualWeightModal` | Al pulsar o escanear un producto con `unidadMedida === 'KG'` o pesable, abre inmediatamente el modal de pesaje manual. | Selección de producto granel | Despliegue inmediato de `ManualWeightModal` en pantalla. | No bloquea por llamadas fallidas a Web Serial API. | SPEC-057 §3.2, R3 |
| F3.2 | Balanza (UI) | Teclado Táctil y Chips de Pesaje | Keypad numérico grande ($\ge 48$px) con chips rápidos (0.25 a 5 kg) y cálculo de subtotal COP en tiempo real. | Dígitos táctiles, chips de peso, o teclado físico | String de peso formateado (hasta 3 decimales) y subtotal preview. | Bloquea confirmación si peso $\le 0$ kg. | SPEC-057 §3.2, R3 |
| F3.3 | Carrito (Data) | Incorporación con `esPesoManual: true` | Al confirmar el peso en el modal, agrega la línea al carrito con la cantidad en kg y la bandera de peso manual. | `pesoKg: number` | Nueva línea agregada o cantidad actualizada en carrito. | Cierra modal y devuelve foco a escáner/catálogo. | SPEC-057 §2.3, R3 |
| F4.1 | Hotkeys | Atajo <kbd>F8</kbd>: Buscador de Catálogo | Interceptor global que enfoca y selecciona el texto del input de búsqueda de productos. | Tecla <kbd>F8</kbd> | `searchInputRef.current.focus()` y `select()`. | Previene acción por defecto del navegador (`preventDefault`). | SPEC-057 §4 Fase 4, R4 |
| F4.2 | Hotkeys | Atajo <kbd>Ctrl+K</kbd>: Búsqueda Rápida | Despliega modal o enfoca el campo de búsqueda rápida multi-criterio. | Combinación <kbd>Ctrl+K</kbd> / <kbd>Cmd+K</kbd> | Activación de búsqueda rápida. | Previene atajos nativos de búsqueda de Chrome/Edge. | SPEC-057 §4 Fase 4, R4 |
| F4.3 | Hotkeys | Atajo <kbd>F6</kbd>: Emitir Comanda Mostrador | Dispara la emisión de la preventa/comanda hacia la cola de caja central. | Tecla <kbd>F6</kbd> | Ejecuta `onEmitirComanda()`. | Ignorado si carrito está vacío o en proceso de envío (`isSubmitting`). | SPEC-057 §4 Fase 4, R4 |
| F4.4 | Hotkeys | Atajo <kbd>F4</kbd>: Descuento Global | Abre el popover o modal de descuento global de comanda. | Tecla <kbd>F4</kbd> | Abre popover descuento global. | Ignorado si carrito está vacío. | SPEC-057 §3.5, R4 |
| F4.5 | Hotkeys | Atajo <kbd>F2</kbd>: Cobro Directo en Terminal | Abre el drawer o modal de cobro directo (si la terminal o asesor tiene permiso de caja). | Tecla <kbd>F2</kbd> | Ejecuta `onCobrarCaja()`. | Inhabilitado si asesor solo tiene rol `VENDEDOR`. | SPEC-057 §4 Fase 4, R4 |
| F4.6 | Hotkeys | Atajo <kbd>F9</kbd>: Toggle Modo Cajero Único | Conmuta entre la vista de Mostrador y la vista de Cola de Caja Única. | Tecla <kbd>F9</kbd> | Alterna flag `isModoCajero`. | Previene colisión con atajos del sistema operativo. | SPEC-057 §4 Fase 4, R4 |
| F4.7 | Hotkeys | Atajo <kbd>Esc</kbd>: Cancelar / Cerrar Modales | Cierra cualquier modal abierto (PIN, Pesaje, Descuento, Clientes) o limpia la búsqueda. | Tecla <kbd>Escape</kbd> | Cierra modal en primer plano. | Si no hay modal abierto, limpia input de búsqueda si está enfocado. | SPEC-057 §4 Fase 4, R4 |
| F5.1 | Gobernanza | Validación de Margen Mínimo Comercial | Comprueba si el precio propuesto cubre el costo de compra + 15%: $\text{precioPropuesto} \ge \text{precioCompra} \times 1.15$. | `nuevoPrecio`, `precioCompra` | Booleano `dentroDeMargen`. | Si es menor, exige autorización de supervisor vía PIN. | SPEC-057 §3.1, R5 |
| F5.2 | Gobernanza | Validación de Umbral de Descuento | Comprueba si el descuento aplicado (en ítem o global) supera el 10% permitido al asesor comercial. | `descuentoPct: number` | Booleano `descuentoAutorizado`. | Si descuento $> 10\%$, exige autorización de supervisor vía PIN. | SPEC-057 §3.1, R5 |
| F5.3 | Seguridad | Modal PIN de Supervisor (4 Dígitos) | Modal táctil `SupervisorPinModal` que valida PIN contra empleados con rol administrativo/supervisor. | PIN 4 dígitos | Autorización con token/objeto `SupervisorAuthResult`. | PIN inválido: animación shake, mensaje de error y reseteo. | SPEC-057 §2.4, R5 |
| F5.4 | Seguridad | Rollback de Precio / Descuento | Si el supervisor cancela el modal o el PIN es inválido, el sistema revierte automáticamente el precio o descuento a su valor previo. | Cancelación o fallo de PIN | Restaura `precioLista` o `descuento` anterior, emite Toast advertencia. | El carrito se mantiene íntegro sin estados inconsistentes. | SPEC-057 §2.1, R5 |
| F6.1 | Catálogo | Paginación 18 Tarjetas (6×3) | Matriz ergonómica de 18 tarjetas con controles `< Anterior 1 2 3 ... Siguiente >`. | Dataset de productos filtrados, página actual | 18 tarjetas activas renderizadas en viewport. | Si página actual $>$ total páginas, ajusta a última página válida. | SPEC-057 §3.3, R6 |
| F6.2 | Rendimiento | Transiciones de Catálogo $< 16$ms | Filtrado y cambio de página optimizados en memoria para responder en $\le 1$ frame de 60 FPS ($<16$ms). | Eventos de paginación o filtrado | Renderizado inmediato sin jank ni layout shifts. | Si dataset excede 1,000 SKUs, usa virtualización slice sin saturar DOM. | SPEC-057 §3.3, R6 |
| F6.3 | Inventario | Indicador de Agotados | Tarjetas de productos sin stock muestran opacidad 60%, etiqueta "AGOTADO" y clic inhabilitado para evitar preventas fallidas. | `stockDisponible <= 0` | Estilo `opacity-60`, badge rojo/gris "AGOTADO", cursor not-allowed. | No agrega ítem al carrito (salvo permiso de preventa en negativo). | SPEC-057 §4 Fase 3, R6 |
| F6.4 | Calidad | Quality Gate: TypeScript, Vitest y A11y | Cero errores en `tsc --noEmit`, 100% tests Vitest en verde y validación responsive a 375px móvil y 1280px desktop. | Comandos CI/CD locales | Salida limpia, build exitoso. | Falla de compilación o test aborta el avance a producción. | SPEC-057 §1, ORIGINAL_REQUEST |

---

## 3. Edge Cases

| # | Feature | Input / Condición | Comportamiento Esperado y Observado en Spec |
|---|---------|-------------------|---------------------------------------------|
| E1 | Fila Editable: Cantidad | Usuario digita `0`, valor negativo o deja el input vacío. | Al perder el foco (`onBlur`), si el valor es $\le 0$ o NaN, el sistema debe confirmar la eliminación de la línea o revertir a 1, sin romper el cálculo financiero de totales. |
| E2 | Fila Editable: Cantidad Decimal | Usuario digita cantidad con coma decimal (`1,750`) en producto por peso. | El input debe normalizar coma a punto (`parseFloat(val.replace(',', '.'))`) permitiendo hasta 3 cifras decimales para balanza en KG. |
| E3 | Fila Editable: Precio Unitario | Usuario ingresa precio unitario de $0 COP. | El sistema debe rechazar el valor, ya que no se permiten ventas con precio unitario en cero (requiere mínimo $1 o uso de bonificación/muestra formal). |
| E4 | Fila Editable: Navegación Tab | Usuario presiona <kbd>Tab</kbd> estando en el input de Precio de la última fila del carrito. | El foco debe salir limpiamente de la lista y dirigirse al botón anclado `+ Descuento (F4)` o al campo de Notas de Despacho en el pie del carrito, sin quedar atrapado. |
| E5 | Fila Editable: Navegación Shift+Tab | Usuario presiona <kbd>Shift+Tab</kbd> desde el input de Precio. | El foco debe regresar al input de Cantidad de la misma fila. Desde Cantidad de la fila $N$, debe regresar al Precio de la fila $N-1$. |
| E6 | Descuento Global | Descuento en valor fijo monetario supera el Subtotal de la orden (ej: Subtotal = $20.000, Descuento = $25.000). | El motor financiero (`calcularTotalesPedido`) detecta la condición y rechaza la operación con el error: *"El descuento no puede superar el total del pedido"*, evitando totales negativos. |
| E7 | Descuento Global vs Descuento Línea | Coexistencia de descuento por ítem (10%) y descuento global de comanda (5%). | El descuento por ítem se aplica primero sobre el subtotal bruto de la línea (`precioLista * (1 - descItem/100) * cant`). La suma de estas líneas conforma el Subtotal con descuento de línea. Luego, el descuento global se aplica sobre este resultado: $\text{Total} = \sum(\text{subtotalLinea}) \times (1 - \text{descGlobal}/100)$. |
| E8 | Validación PIN: Margen Mínimo | Producto tiene Costo Base = $20.000 COP. Margen mínimo 15% = $23.000 COP. Usuario ingresa precio = $22.000 COP. | El sistema detecta que $22.000 < 23.000$. Intercepta inmediatamente la confirmación del input, despliega `SupervisorPinModal`. Si el PIN de supervisor es válido, guarda el precio y audita la acción; si se cancela, restaura el precio anterior. |
| E9 | Validación PIN: Descuento Exacto 10% | Asesor aplica descuento del 10% exacto en un ítem o comanda. | La regla establece: `Descuento <= 10%` está dentro del margen del asesor. Por lo tanto, se aplica directamente **SIN** solicitar PIN de supervisor. |
| E10 | Validación PIN: Descuento 10.01% | Asesor aplica descuento del 11% o digita 10.5%. | Supera el umbral del 10.0%. Dispara inmediatamente `SupervisorPinModal`. |
| E11 | Pesaje Granel: Clic vs Escáner | Usuario escanea con pistola código de barras de producto pesable (ej: `MOJ-001`). | El interceptor de código de barras detecta que el producto tiene `unidadMedida === 'KG'`, detiene la adición directa por 1 unidad e invoca inmediatamente `ManualWeightModal` con el producto cargado. |
| E12 | Atajos de Teclado en Inputs | Usuario está digitando una nota de despacho o el nombre de un cliente y presiona teclas que coinciden con atajos ordinarios. | Los atajos de caracteres o navegación no interfieren cuando el foco está en un `INPUT` o `TEXTAREA`. Sin embargo, las teclas de función (<kbd>F8</kbd>, <kbd>F6</kbd>, <kbd>F4</kbd>, <kbd>F2</kbd>, <kbd>F9</kbd>, <kbd>Esc</kbd>) ejecutan `event.preventDefault()` y disparan la acción global prevista. |
| E13 | Catálogo: Búsqueda con 0 Resultados | Usuario busca una palabra inexistente o filtra una categoría sin productos disponibles. | La matriz oculta la paginación y renderiza una vista de estado vacío ergonómica (`Package` icon, texto *"No se encontraron productos coincidentes"*, sugerencia clara), sin colapsar el layout. |
| E14 | Responsive 375px: Vista Carrito | Operador abre la app en un terminal móvil o smartphone de 375px de ancho. | La barra móvil inferior (`pos-mobile-switcher`) permite alternar entre Catálogo y Carrito en pantalla completa. La fila editable apila o ajusta los inputs de forma táctil ($\ge 44$px de alto) sin scroll horizontal en la ventana principal. |

---

## 4. Requirements Breakdown (R1 a R6) en Detalle

### R1. Fila de Carrito con Navegación [Tab] y Edición en Línea (Tarea 1)
- **Archivos Afectados:**
  - `src/views/pos/components/POSMultivendorCart.tsx`
  - `src/views/pos/components/POSMultivendorView.tsx`
  - Nueva suite TDD: `src/tests/posCartEditableRow.test.tsx`
- **Contratos de Interfaz (Props & Callbacks):**
  - Cada ítem del carrito debe permitir mutar directamente tanto `cantidad` como `precioUnitario` / `precioOverride` y `descuentoPct`.
  - Props requeridas en `POSMultivendorCartProps`:
    ```typescript
    onUpdateQuantityExact?: (index: number, newQty: number) => void;
    onUpdatePrice?: (index: number, newPrice: number) => void;
    onApplyItemDiscount?: (index: number, discountPct: number) => void;
    ```
  - Inputs con atributos:
    - Input Cantidad: `data-testid="input-cart-qty-${index}"`, `type="number"`, `step="any"`, `min="0"`, `tabIndex={index * 2 + 1}`, `onFocus={(e) => e.target.select()}`.
    - Input Precio Unitario: `data-testid="input-cart-price-${index}"`, `type="number"`, `step="1"`, `min="0"`, `tabIndex={index * 2 + 2}`, `onFocus={(e) => e.target.select()}`.
    - Micro-botón Descuento: `data-testid="btn-item-discount-${index}"` con texto compacto `[+ Desc]` o badge si ya tiene descuento aplicado.
- **Estructura Flexbox:**
  - Contenedor raíz: `<aside className="... h-full min-h-0 flex flex-col justify-between ...">`
  - Área de productos: `<div data-testid="pos-cart-items-list" className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">` ocupando al menos el 85% de la altura útil disponible.
  - Pie fijo anclado: `<div className="shrink-0 mt-auto p-3 bg-slate-50 border-t border-slate-200 space-y-2">`.
- **Criterios de Aceptación Exactos:**
  1. Cada fila del carrito presenta inputs continuos de Cantidad y Precio Unitario editables en línea.
  2. Presionar <kbd>Tab</kbd> en Cantidad enfoca el Precio Unitario de la misma fila; presionar <kbd>Tab</kbd> en Precio Unitario enfoca la Cantidad de la siguiente fila.
  3. Cada fila dispone del micro-botón `[+ Desc]` que permite fijar descuento específico por ítem.
  4. El contenedor vertical garantiza el 85% del espacio visual para la lista de ítems con scroll independiente y pie anclado.
  5. La suite TDD `src/tests/posCartEditableRow.test.tsx` está creada y pasa al 100% en Vitest.

---

### R2. Motor de Descuento Global de Comanda (Tarea 2)
- **Archivos Afectados:**
  - `src/views/pos/components/POSMultivendorCart.tsx`
  - `src/stores/useMultiVendorPosStore.ts` (o integración con `calcularTotalesPedido` en `posService.ts`)
- **Diseño del Componente & Estado:**
  - Botón anclado en el pie de totales:
    `<button id="btn-descuento-global-f4" data-testid="btn-descuento-global-f4" ...> + Descuento (F4) </button>`
  - Popover / Modal de Descuento:
    - Selector tipo tab o radio: `% Porcentaje` | `$ Valor Fijo`.
    - Input numérico con presets rápidos (5%, 10%, 15% / $2.000, $5.000, $10.000 COP).
    - Botón de Aplicar y Botón de Limpiar Descuento.
  - Actualización reactiva instantánea en Zustand:
    - Recálculo financiero sub-10ms garantizado mediante llamada síncrona a `calcularTotalesPedido`.
- **Criterios de Aceptación Exactos:**
  1. El botón `+ Descuento (F4)` permanece visible y anclado en la zona de totales del carrito.
  2. Permite conmutar fluidamente entre descuento porcentual (%) o valor monetario ($).
  3. El recálculo de Subtotal, Descuento y Total en Zustand se ejecuta en $< 10$ms tras aplicar o cambiar el valor.
  4. Se muestra visualmente el desglose en el resumen: `Descuento aplicado: -$X.XXX`.

---

### R3. Trigger Táctil de Pesaje Manual (Tarea 3)
- **Archivos Afectados:**
  - `src/views/pos/components/POSMultivendorView.tsx`
  - `src/views/pos/components/ManualWeightModal.tsx`
  - `src/views/pos/components/POSMultivendorCatalog.tsx`
- **Flujo Operativo:**
  - En `POSMultivendorCatalog.tsx:152-157`: si el producto es pesable (`isProductPesable(product)`), invoca `onOpenScaleModal(product)`.
  - En `POSMultivendorView.tsx:80-97`: al escanear por código de barras un producto pesable, **NO** agrega automáticamente 1 unidad; en su lugar abre inmediatamente `ManualWeightModal` pasando el producto detectado.
  - El modal presenta el teclado táctil numérico con teclas $\ge 48$px, chips de peso rápido y cálculo reactivo en COP: $\text{subtotal} = \text{pesoKg} \times \text{precioPorKg}$.
  - Al presionar "Confirmar Peso" (o <kbd>Enter</kbd>), agrega el ítem al carrito con `cantidad = pesoKg`, `unidad = 'KG'` y `esPesoManual = true`.
- **Criterios de Aceptación Exactos:**
  1. Al seleccionar en catálogo o escanear por código de barras un producto tipo KG/Balanza, se abre automáticamente `ManualWeightModal`.
  2. El modal dispone de teclado táctil numérico y chips ergonómicos para digitación ultrarrápida sin depender del teclado físico ni de Web Serial API.
  3. Al confirmar, el producto entra al carrito con el peso digitado exacto y su subtotal calculado.

---

### R4. Interceptor Global de Atajos de Teclado (Tarea 4)
- **Archivos Afectados:**
  - `src/hooks/usePOSKeyboardShortcuts.ts`
  - `src/views/pos/components/POSMultivendorView.tsx`
  - `src/views/pos/components/POSMultivendorLightHeader.tsx`
- **Tabla Canónica de Mapeo de Atajos SPEC-057:**
  - <kbd>F8</kbd>: Enfocar buscador de catálogo (`#pos-light-product-search-input`).
  - <kbd>Ctrl+K</kbd> / <kbd>Cmd+K</kbd>: Búsqueda rápida multi-criterio.
  - <kbd>F6</kbd>: Emitir Preventa / Comanda de Mostrador (`#btn-emitir-preventa-f6`).
  - <kbd>F4</kbd>: Abrir popover / modal de Descuento Global de Comanda.
  - <kbd>F2</kbd>: Cobro Directo en Terminal (`#btn-cart-cobrar-caja`).
  - <kbd>F9</kbd>: Alternar a Modo Caja Única / Cola en Vivo (`#btn-toggle-modo-cajero`).
  - <kbd>Esc</kbd>: Cerrar modales activos (`SupervisorPinModal`, `ManualWeightModal`, Descuento, etc.) o limpiar buscador.
- **Criterios de Aceptación Exactos:**
  1. Todos los atajos señalados ejecutan `event.preventDefault()` evitando colisiones con comportamientos por defecto del navegador.
  2. Las teclas de función operan globalmente en la ventana aun cuando el foco esté en inputs secundarios.
  3. Los atajos de navegación y edición tabular dentro de la lista de ítems no se ven interferidos.

---

### R5. Validación Comercial y PIN de Supervisor (Tarea 5)
- **Archivos Afectados:**
  - `src/views/pos/components/POSMultivendorCart.tsx`
  - `src/views/pos/components/SupervisorPinModal.tsx`
  - `src/stores/useMultiVendorPosStore.ts`
  - `src/schemas/prefactura.schema.ts`
- **Regla Comercial Determinista:**
  - Variable 1: Margen Mínimo: $\text{precioMinimo} = \text{precioCompra} \times 1.15$ (Costo Base + 15%).
  - Variable 2: Descuento Máximo Asesor: $\text{descuentoMaximo} = 10\%$.
  - Condición de Intervención:
    $$\text{Requiere Supervisor} \iff (\text{descuento} > 10\%) \lor (\text{precioPropuesto} < \text{precioCompra} \times 1.15)$$
  - Si no requiere supervisor: el precio o descuento se aplica de inmediato.
  - Si requiere supervisor: se suspende la confirmación y se abre `SupervisorPinModal`.
  - Validación de PIN de 4 dígitos contra supervisores registrados en `useEmployeeStore`.
  - Si el supervisor aprueba: se aplica el valor y se registra en la auditoría.
  - Si el supervisor rechaza o cancela: el valor del input se restaura al precio o descuento anterior sin alterar el resto del carrito.
- **Criterios de Aceptación Exactos:**
  1. Modificaciones con Descuento $\le 10\%$ y Precio Propuesto $\ge$ Costo Base + 15% se aplican de forma inmediata sin solicitar PIN.
  2. Si Descuento $> 10\%$ o Precio Propuesto $<$ Costo Base + 15%, se bloquea la operación hasta autorizar mediante `SupervisorPinModal`.
  3. Cancelar el modal o ingresar un PIN inválido revierte el cambio de manera transparente.

---

### R6. Calidad, Virtualización y Quality Gate Final (Tarea 6)
- **Archivos Afectados:**
  - `src/views/pos/components/POSMultivendorCatalog.tsx`
  - Toda la suite de tests en `src/tests/`
- **Especificaciones de Rendimiento y UI:**
  - Matriz fija de 18 tarjetas (6×3) en catálogo.
  - Paginación inferior `< Anterior 1 2 3 ... Siguiente >`.
  - Virtualización / slice en memoria que garantiza transiciones de filtrado y cambio de página en $< 16$ms (60 FPS estables).
  - Badge y estado visual para productos con `stock <= 0`: `opacity-60`, texto destacado "AGOTADO", inhabilitando la selección.
  - Responsive: verificación a 375px móvil sin desbordamientos horizontales ni roturas.
  - Quality Gate:
    - `npx tsc --noEmit` $\rightarrow$ 0 errores.
    - Vitest $\rightarrow$ 100% pruebas pasando.
- **Criterios de Aceptación Exactos:**
  1. Catálogo paginado en 18 tarjetas con transiciones fluidas a 60 FPS ($<16$ms).
  2. Productos sin stock etiquetados como "AGOTADO" e inhabilitados para venta regular.
  3. `npx tsc --noEmit` finaliza con código 0 sin advertencias ni errores.
  4. Suite de pruebas Vitest 100% verde.
  5. Interfaz completamente adaptable y ergonómica en viewport de 375px.

---

## 5. Logic Chain & Architectural Dependencies

```
[SPEC-057 SDD v3.0 & ORIGINAL_REQUEST]
               │
               ▼
   [1. Modelado de Dominio & Store Zustand L1]
       - ItemPrefactura / LineaVenta con precioLista, cantidad, descuentoPct, precioOverride
       - useMultiVendorPosStore con actions: actualizarCantidad, actualizarPrecio, aplicarDescuento
               │
               ▼
   [2. Capa de Presentación: Tarea 1 (POSMultivendorCart)]
       - Implementación TDD: Fila editable con navegación [Tab]
       - Cantidad Input <-> Precio Input (Tab cíclico)
       - Micro [+ Desc] por fila
       - Contenedor 85% flex-1 con footer anclado mt-auto
       - Verificación con src/tests/posCartEditableRow.test.tsx
               │
               ▼
   [3. Capa Financiera: Tarea 2 (Descuento Global)]
       - Botón + Descuento (F4) en footer
       - Popover selector [% / $]
       - Recálculo <10ms en Zustand
               │
               ▼
   [4. Hardware & Trigger Táctil: Tarea 3 (Balanza / KG)]
       - POSMultivendorView intercepta selección/escaneo de productos pesables
       - Abre ManualWeightModal táctil (keypad >=48px, chips 0.25-5 kg)
       - Agrega con esPesoManual = true
               │
               ▼
   [5. Ergonomía de Teclado: Tarea 4 (Hotkeys)]
       - Interceptor unificado F8, Ctrl+K, F6, F4, F2, F9, Esc
       - Previene default del navegador, foco inteligente
               │
               ▼
   [6. Gobernanza Comercial: Tarea 5 (Supervisor PIN)]
       - Regla: Descuento > 10% O Precio < Costo + 15%
       - Dispara SupervisorPinModal
       - Autorización o Rollback
               │
               ▼
   [7. Calidad & Rendimiento: Tarea 6 (Virtualización & Quality Gate)]
       - Matriz 18 tarjetas (6x3) <16ms
       - tsc --noEmit (0 errores)
       - Vitest (100% verde)
       - Responsive 375px
```

---

## 6. Caveats & Edge Cases

1. **Gestión de Foco en Edición Tabular:**
   - Si se re-renderiza la fila tras cada pulsación de tecla, el foco del input puede perderse o resetear el cursor al final. Para evitar esto, se recomienda manejar estado local en el input con debounce o sincronizar en `onBlur` / `onKeyDown(Enter|Tab)`.
2. **Productos con Stock Cero vs Preventa:**
   - La regla general inhabilita el clic en tarjetas con stock $\le 0$. Sin embargo, en preventa comercial de mostrador puede existir autorización especial para despachos futuros si el cliente lo solicita. Por defecto se marca "AGOTADO" e inactivo, a menos que se configure explícitamente el flag de preventa en negativo.
3. **Persistencia en Outbox (Dexie.js):**
   - Cuando se opera en modo offline, las comandas emitidas deben encolarse en IndexedDB con ID idempotente UUIDv4. La interfaz de usuario debe notificar el estado sin interrumpir el flujo del operador.

---

## 7. Conclusion & Recommendations for Decomposition into Milestones

La especificación SPEC-057 es clara, determinista y cuenta con contratos de interfaz y reglas comerciales bien delimitadas.
Para ejecutar el plan de manera quirúrgica bajo metodología SDD v3.0 y Continuous Kanban Flow (WIP = 1), se recomienda la siguiente descomposición en 6 Hitos secuenciales:

- **Hito 1 (Prioridad Inmediata — Tarea 1):**
  - Creación de la suite TDD `src/tests/posCartEditableRow.test.tsx` (fase RED).
  - Refactorización de filas en `POSMultivendorCart.tsx`: inputs numéricos continuos de Cantidad y Precio Unitario con navegación <kbd>Tab</kbd>, micro-botón `[+ Desc]`, flexbox vertical estricto (85% espacio para ítems) y pie anclado.
  - Ejecución de pruebas hasta fase GREEN al 100%.
- **Hito 2 (Tarea 2):**
  - Implementación del botón anclado `+ Descuento (F4)` en el pie de totales con selector [% / $] y recálculo $<10$ms en Zustand.
- **Hito 3 (Tarea 3):**
  - Integración del trigger táctil de pesaje manual en `POSMultivendorView.tsx` conectando `ManualWeightModal` para productos granel (`KG Balanza`).
- **Hito 4 (Tarea 4):**
  - Unificación del interceptor global de atajos de teclado (<kbd>F8</kbd>, <kbd>Ctrl+K</kbd>, <kbd>F6</kbd>, <kbd>F4</kbd>, <kbd>F2</kbd>, <kbd>F9</kbd>, <kbd>Esc</kbd>).
- **Hito 5 (Tarea 5):**
  - Conexión del control comercial y seguridad con `SupervisorPinModal` (Descuento $>10\%$ o Precio $<$ Costo $+15\%$) con mecanismo de rollback.
- **Hito 6 (Tarea 6):**
  - Virtualización en memoria de catálogo 18 tarjetas (6×3), optimización $<16$ms, auditoría responsive 375px y Quality Gate final (`tsc --noEmit` y suite Vitest 100% verde).

---

## 8. Verification Method

Para verificar independientemente todos los hallazgos y validar las futuras implementaciones:
1. **Comprobación de Tipos:**
   `npx tsc --noEmit`
   (Debe concluir con código 0 y cero errores).
2. **Ejecución de Pruebas POS Existentes:**
   `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/useMultiVendorPosStore.test.ts`
   (Verifica que la funcionalidad previa se mantenga al 100% verde).
3. **Ejecución de la Nueva Suite TDD (Tarea 1):**
   `npx vitest run src/tests/posCartEditableRow.test.tsx`
   (Comprueba que los 5-7 casos de prueba de fila editable, navegación Tab y micro-descuento pasen en verde).
4. **Verificación Visual y Responsive:**
   Inspección mediante Chrome DevTools en resolución de 375px (iPhone / viewport móvil) y 1280px (desktop) verificando que el carrito mantenga su flexbox vertical con el 85% de espacio útil para productos y pie fijo sin solapamientos.
