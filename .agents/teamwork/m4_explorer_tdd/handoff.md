# Reporte de Exploración e Investigación TDD — Hito M4 (SPEC-057 Tarea 4)
**Interceptor Global de Atajos de Teclado POS (F8, Ctrl+K, F6, F4, F2, F9, Esc)**

---

## 1. Observation

### 1.1. Contexto de Archivos y Especificación
- **`specs/spec_057_pos_integral_refactor_frontend.md`**:
  - En la sección 2.5 (Diagrama de Arquitectura de Componentes, líneas 232-235), se especifica `Hotkeys ["usePOSHotkeys (F1, F2, F4, F6, F7, F8, F9, Ctrl+K)"]` coordinando la Cabecera y el Carrito.
  - En la sección 4 (Fase 4: Integración Periférica, líneas 317-324):
    - `F8`: Enfocar buscador de catálogo.
    - `Ctrl+K`: Búsqueda rápida multi-criterio / alternancia de vista.
    - `F6`: Emitir Preventa / Comanda de Mostrador o Selector de Cliente.
    - `F2`: Cobro Directo en Terminal (Apertura de Drawer) / Guardar Borrador.
    - `F9`: Alternar a Modo Caja Única (Cola en Vivo) / Cobro en Caja.
    - `Esc`: Cerrar modales o limpiar selección transitoria sin vaciar carrito.
- **`PROJECT.md`**:
  - Línea 29 (Feature Inventory F12): *"Interceptor Global de Atajos de Teclado: Captura unificada de atajos F8 (Buscador), Ctrl+K (Búsqueda rápida), F6 (Comanda), F4 (Descuento), F2 (Cobrar), F9 (Cajero), Esc (Cerrar)."*
  - Línea 43 (Milestone M4): *"Scope: `src/views/pos/components/POSMultivendorView.tsx`, `src/hooks/usePOSKeyboardShortcuts.ts` (F12) | Dependencies: M1, M2 | Status: IN_PROGRESS"*.
  - Líneas 89-91 (Code Layout): Especifica `src/hooks/usePOSKeyboardShortcuts.ts` y las suites en `src/tests/`.
- **`ORIGINAL_REQUEST.md`**:
  - Líneas 25-26: *"R4. Interceptor Global de Atajos de Teclado (Tarea 4): Implementar interceptor global de atajos de teclado para POS: F8, Ctrl+K, F6, F2, F9 y Esc."*
  - Líneas 49-50: *"Los atajos de teclado F8, Ctrl+K, F6, F2, F9 y Esc ejecutan las acciones de navegación y comanda correspondientes sin colisionar con atajos del navegador."*
  - Líneas 81-85: Confirmación de aprobación del Hito M3 y autorización formal para iniciar Hito M4.

### 1.2. Estado Actual del Código Base
- **`src/hooks/usePOSKeyboardShortcuts.ts`**:
  - Diseñado inicialmente para SPEC-047 (Flujo Supermercado) con handlers: `onF1Help`, `onF2Cash`, `onF3Card`, `onF4Transfer`, `onF5Refresh`, `onF6Search`, `onF8Void`, `onF9SplitPayment`, `onF12Checkout`, `onEscape`, `onEnter`, `onArrowUp`, `onArrowDown`.
  - **Faltante Crítico**: No incluye `Ctrl+K` (`(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'`).
  - **Faltante Crítico**: No cuenta con los nombres de handlers semánticos de SPEC-057 (`onF8FocusSearch`, `onCtrlK`, `onF6Client`, `onF4Discount`, `onF2SaveDraft`, `onF9Checkout`).
  - **Comportamiento en inputs (líneas 116-119)**:
    ```typescript
    if (isInput) {
      return;
    }
    ```
    Actualmente, las teclas F1-F12 y Escape se evalúan antes de esta cláusula (líneas 54-114), permitiendo que las teclas de función actúen incluso si el foco está en un input. Sin embargo, al no existir `Ctrl+K`, este atajo quedaría bloqueado o no capturado si no se ubica antes de la validación de `isInput`.
- **`src/views/pos/components/POSMultivendorLightHeader.tsx`**:
  - Líneas 60-70: Contiene un listener aislado e independiente en `useEffect` exclusivamente para `F8`:
    ```typescript
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F8') {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    ```
  - Identificadores DOM presentes:
    - Input código de barras: `id="pos-light-barcode-input"`, `data-testid="pos-light-barcode-input"`
    - Input búsqueda producto: `id="pos-light-product-search-input"`, `data-testid="pos-light-product-search-input"`
    - Selector de cliente: `id="btn-header-seleccionar-cliente"`, `data-testid="btn-header-seleccionar-cliente"`
    - Botón alternar cajero: `id="btn-toggle-modo-cajero"`, `data-testid="btn-toggle-modo-cajero"`
    - Botón cola de comandas: `id="btn-open-comandas-drawer"`, `data-testid="btn-open-comandas-drawer"`
- **`src/views/pos/components/POSMultivendorCart.tsx`**:
  - Líneas 126-137: Contiene un listener aislado e independiente para `F4` y `Escape`:
    ```typescript
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isDiscountOpen) {
          setIsDiscountOpen(false);
        } else if (e.key === 'F4' && items.length > 0) {
          e.preventDefault();
          handleToggleDiscountPopover();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDiscountOpen, items.length, currentDiscountTipo, currentDiscountValor]);
    ```
  - Identificadores DOM presentes:
    - Botón Descuento F4: `id="btn-descuento-global-f4"`, `data-testid="btn-descuento-global-f4"`
    - Botón Emitir Comanda: `id="btn-emitir-preventa-f6"`, `data-testid="btn-emitir-preventa-f6"`
    - Botón Cobrar Caja: `id="btn-cart-cobrar-caja"`, `data-testid="btn-cart-cobrar-caja"`
- **`src/views/pos/components/POSMultivendorView.tsx`**:
  - Actualmente **no invoca** a `usePOSKeyboardShortcuts`.
  - Recibe callbacks relevantes: `onOpenClientModal`, `onToggleModoCajero`, `onOpenComandasQueue`, `onEmitirComanda`, `onCobrarCaja`, `onClearCart`, etc.
  - Orquesta el estado modal de pesaje: `scaleModalProduct` (`ManualWeightModal`).
- **Pruebas Existentes**:
  - `src/tests/commercialFlowSupermarket.test.tsx`: Posee 20 pruebas que verifican `usePOSKeyboardShortcuts` con la API legacy de SPEC-047 (`onF1Help`, `onF2Cash`, etc.). Todas pasan en verde (6.1s).
  - No existe aún `src/tests/posKeyboardShortcuts.test.tsx`.

---

## 2. Logic Chain

1. **Aislamiento vs Unificación**: Actualmente existen listeners fragmentados dispersos en `POSMultivendorLightHeader` (F8) y `POSMultivendorCart` (F4, Esc). Esto vulnera la arquitectura limpia especificada en SPEC-057 (Fase 4) y `PROJECT.md` (F12), donde se requiere un interceptor unificado en `usePOSKeyboardShortcuts.ts` coordinado desde la vista contenedora `POSMultivendorView.tsx`.
2. **Compatibilidad Dual (SPEC-047 + SPEC-057)**: `usePOSKeyboardShortcuts.ts` está cubierto por 20 pruebas en `commercialFlowSupermarket.test.tsx`. Modificar destructivamente su interfaz rompería la regresión. Por ende, la interfaz `POSShortcutHandlers` debe extenderse de manera aditiva para soportar tanto los handlers legacy como los nuevos handlers semánticos de SPEC-057 (`onF8FocusSearch`, `onCtrlK`, `onF6Client`, `onF4Discount`, `onF2SaveDraft`, `onF9Checkout`, `onEscape`).
3. **Mapeo Riguroso de Atajos y Prevención de Colisiones del Navegador**:
   - `F8`: Colisiona con la pausa/reanudación del depurador en DevTools de Chromium. Requiere `e.preventDefault()`, enfocar el input de búsqueda (`pos-light-product-search-input` o `[data-testid="pos-search-input"]`) y ejecutar `select()`.
   - `Ctrl+K` (o `Cmd+K` en macOS): Colisiona con la barra de búsqueda del navegador (Omnibox de Chrome/Firefox/Edge). Requiere `e.preventDefault()` e invocar la alternancia entre mostrador y cola de comandas / modo cajero (`onToggleModoCajero` / `onOpenComandasQueue` / paleta de comandos).
   - `F6`: Colisiona directamente con el selector de barra de direcciones/marcos del navegador en Chromium. Requiere `e.preventDefault()` y disparar la selección de cliente (`onOpenClientModal`).
   - `F4`: En navegadores puede asociarse con cierre de ventanas (`Alt+F4`) o historial de barra de direcciones. Requiere `e.preventDefault()` y desplegar/alternar el popover de descuento global solo si el carrito tiene productos (`items.length > 0`).
   - `F2`: En sistemas operativos se asocia con "Renombrar archivo". Requiere `e.preventDefault()` y disparar el guardado de borrador / emisión de comanda (`onSaveDraft` / `onEmitirComanda`).
   - `F9`: En entornos de desarrollo puede asociarse con breakpoints/stepping. Requiere `e.preventDefault()` y disparar el cobro directo en terminal (`onCobrarCaja`).
   - `Escape`: Atajo de cancelación universal. Debe cerrar modales activos (`ManualWeightModal`, popover F4, selector de cliente) o limpiar estados transitorios, pero **NUNCA debe vaciar el carrito** para evitar pérdidas accidentales de ventas en curso.
4. **Contexto de Foco (Inputs vs Global)**:
   - Los inputs de texto (`<input>`, `<textarea>`, `contenteditable`) requieren que la digitación ordinaria (letras, números, espacios, Backspace, Delete) no sea interceptada.
   - Sin embargo, las teclas de comando y función (`F1-F12`, `Ctrl+K`, `Escape`) son teclas globales de hardware en terminales POS de grado industrial. Un operador digitando en el buscador debe poder presionar `F6` (cliente), `F4` (descuento), `F2` (comanda), `F9` (cobro) o `Ctrl+K` sin necesidad de deseleccionar manualmente el input con el mouse.
5. **Higiene de Event Listeners**:
   - Cada componente o hook que registre eventos en `window` debe eliminar su listener en la función de limpieza de `useEffect` (`window.removeEventListener('keydown', handleKeyDown)`).
   - Se debe verificar que tras el `unmount()` no persistan listeners zombis en memoria.

---

## 3. Caveats

- **Retrocompatibilidad con SPEC-047**: No se deben renombrar ni eliminar las propiedades existentes de `POSShortcutHandlers` (`onF1Help`, `onF2Cash`, etc.) para no quebrar `commercialFlowSupermarket.test.tsx`.
- **Prevalencia de Modales en Escape**: Si `ManualWeightModal` está abierto, `Escape` debe cerrar dicho modal antes de cerrar el popover de descuento o cualquier otro contenedor subordinado.
- **Sincronización entre Cart y View para F4**: `POSMultivendorCart` ya gestiona internamente el estado `isDiscountOpen`. Al integrarse con `usePOSKeyboardShortcuts`, se debe asegurar que el listener global no duplique el toggle (doble invocación en el mismo ciclo de evento).

---

## 4. Conclusion & Especificación Detallada de Pruebas TDD

Se concluye el diseño completo de la suite de pruebas TDD para `src/tests/posKeyboardShortcuts.test.tsx`, estructurada en **10 bloques de prueba exhaustivos** que cubren unitariamente el hook `usePOSKeyboardShortcuts` y la integración funcional completa en `POSMultivendorView`:

### Estructura de la Suite `src/tests/posKeyboardShortcuts.test.tsx`

```typescript
// ============================================================================
// SUITE TDD: INTERCEPTOR GLOBAL DE ATAJOS DE TECLADO POS (SPEC-057 HITO M4)
// Archivo canónico: src/tests/posKeyboardShortcuts.test.tsx
// ============================================================================

describe('Hito M4: Interceptor Global de Atajos de Teclado POS (SPEC-057 Tarea 4)', () => {
  // BLOQUE 1: Atajo F8 (Enfoque y Selección de Buscador)
  // - 1.1 Presionar F8 enfoca y selecciona el input de búsqueda pos-light-product-search-input
  // - 1.2 Presionar F8 invoca preventDefault() para evitar colisiones con DevTools
  // - 1.3 Presionar F8 funciona incluso si el foco inicial está en otro input o botón

  // BLOQUE 2: Atajo Ctrl+K / Cmd+K (Alternancia de Vista / Modo Cajero / Paleta)
  // - 2.1 Presionar Ctrl+K invoca el callback de alternancia de vista (onToggleModoCajero / onOpenComandasQueue)
  // - 2.2 Presionar Cmd+K (metaKey) en macOS invoca el handler de forma idéntica
  // - 2.3 Presionar Ctrl+K invoca preventDefault() evitando abrir la barra de búsqueda del navegador
  // - 2.4 Ctrl+K opera correctamente cuando el foco está dentro de un input de texto

  // BLOQUE 3: Atajo F6 (Selector de Cliente / Modal Multicliente)
  // - 3.1 Presionar F6 invoca onOpenClientModal y previene la navegación a la barra de direcciones del navegador
  // - 3.2 F6 opera tanto con carrito vacío como con ítems cargados
  // - 3.3 F6 opera cuando el foco está activo en cualquier input numérico del carrito

  // BLOQUE 4: Atajo F4 (Motor de Descuento Global de Comanda)
  // - 4.1 Presionar F4 con ítems en el carrito abre el popover de descuento global
  // - 4.2 Presionar F4 con popover abierto lo cierra (comportamiento toggle)
  // - 4.3 Presionar F4 con carrito vacío (items.length === 0) no abre el popover ni altera el estado
  // - 4.4 F4 invoca preventDefault() evitando acciones del navegador

  // BLOQUE 5: Atajo F2 (Guardar Borrador / Emitir Comanda de Mostrador)
  // - 5.1 Presionar F2 con ítems en carrito invoca la emisión de comanda / guardar borrador (onEmitirComanda / onSaveDraft)
  // - 5.2 Presionar F2 con carrito vacío no ejecuta la acción de emisión
  // - 5.3 Presionar F2 mientras isSubmitting === true no dispara envíos duplicados
  // - 5.4 F2 invoca preventDefault()

  // BLOQUE 6: Atajo F9 (Cobro en Caja / Checkout Inmediato)
  // - 6.1 Presionar F9 con ítems en carrito invoca onCobrarCaja
  // - 6.2 Presionar F9 con carrito vacío no dispara el cobro
  // - 6.3 Presionar F9 degrada elegantemente sin errores si onCobrarCaja no está definido (mostrador puro)
  // - 6.4 F9 invoca preventDefault()

  // BLOQUE 7: Atajo Escape (Cierre de Modales y Cancelación Segura sin Pérdida de Datos)
  // - 7.1 Presionar Escape cierra ManualWeightModal si está desplegado sin alterar los ítems del carrito
  // - 7.2 Presionar Escape cierra el popover de descuento global F4 sin aplicar valores pendientes
  // - 7.3 Presionar Escape sin modales abiertos NUNCA vacía el carrito ni pierde ítems agregados
  // - 7.4 Presionar Escape con foco en un input de búsqueda desenfoca (blur) el campo o limpia el filtro

  // BLOQUE 8: Discriminación de Contexto de Foco (Inputs vs Comandos)
  // - 8.1 La digitación ordinaria de caracteres, números y espacios dentro de un <input> no es interceptada
  // - 8.2 Teclas de flecha (ArrowUp, ArrowDown) y Enter dentro de inputs numéricos no disparan atajos globales
  // - 8.3 Teclas de función (F8, F6, F4, F2, F9) se capturan y procesan incluso con cursor dentro de un input

  // BLOQUE 9: Ciclo de Vida, Desmontaje y Prevención de Fugas de Memoria
  // - 9.1 Al desmontar el componente (unmount), se remueve el listener de window
  // - 9.2 Tras el desmontaje, disparar teclas no invoca ningún callback
  // - 9.3 La bandera isEnabled: false inhabilita la captura de todos los atajos
  // - 9.4 Re-renderizar con nuevos handlers mantiene una única suscripción activa sin duplicados

  // BLOQUE 10: Integración UI Completa en POSMultivendorView
  // - 10.1 Flujo integrado F8 -> Búsqueda -> F6 -> Selección Cliente -> F4 -> Descuento -> F2 -> Emisión Comanda
  // - 10.2 Flujo de cancelación con Escape en cadena de modales
```

---

## 5. Verification Method

Para verificar independientemente esta especificación una vez implementada en la fase TDD:

1. **Ejecución de Pruebas Unitarias TDD**:
   ```powershell
   npx vitest run src/tests/posKeyboardShortcuts.test.tsx
   ```
2. **Verificación de Regresión de Atajos Previos (SPEC-047)**:
   ```powershell
   npx vitest run src/tests/commercialFlowSupermarket.test.tsx
   ```
3. **Verificación de Tipado Estricto TypeScript**:
   ```powershell
   npx tsc --noEmit
   ```
4. **Condiciones de Invalidación**:
   - Si `Ctrl+K` abre la barra de navegación del navegador en pruebas con `defaultPrevented === false`.
   - Si `Escape` vacía el arreglo de productos en el carrito de compras.
   - Si `F8`, `F6` o `Ctrl+K` dejan de funcionar cuando el usuario tiene el cursor dentro de un campo de texto.
   - Si al desmontar el componente persisten escuchadores en `window`.
