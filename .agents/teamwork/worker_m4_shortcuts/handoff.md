# Handoff Report — Hito M4 (Tarea 4: Interceptor Global de Atajos de Teclado POS)

**Autor**: Worker Implementer (`worker_m4_shortcuts`)  
**Fecha/Hora**: 2026-11-09T12:57:00Z  
**Hito**: M4 — Tarea 4 (SPEC-057)  
**Tipo**: Hard Handoff (Task Complete)  

---

## 1. Observation

### 1.1 Archivos Modificados y Producidos
1. **`src/tests/posKeyboardShortcuts.test.tsx`** (Nuevo archivo, 729 líneas):
   - Suite TDD exhaustiva que cubre los 10 bloques funcionales requeridos por la especificación:
     - Bloque 1: Atajo F8 (Enfoque y selección de buscador con preventDefault).
     - Bloque 2: Atajo Ctrl+K / Cmd+K (Búsqueda rápida / alternancia de vista multiplataforma).
     - Bloque 3: Atajo F6 (Selector de cliente / preventDefault).
     - Bloque 4: Atajo F4 (Motor de descuento global de comanda y toggle reactivo).
     - Bloque 5: Atajo F2 (Guardar borrador / emisión de comanda).
     - Bloque 6: Atajo F9 (Cobro en caja / checkout inmediato).
     - Bloque 7: Atajo Escape (Cierre seguro de modales sin vaciar carrito ni perder ítems).
     - Bloque 8: Discriminación de contexto de foco (inputs de texto permiten digitación ordinaria mientras interceptan teclas de función F1-F12, Ctrl+K y Escape).
     - Bloque 9: Ciclo de vida, desmontaje y `isModalOpen` (suspensión de atajos de comanda durante modales activos mientras Escape permanece operativo).
     - Bloque 10: Integración UI completa en `POSMultivendorView` y flujo integrado de comanda.

2. **`src/hooks/usePOSKeyboardShortcuts.ts`** (Modificado):
   - Interfaz `POSShortcutHandlers` extendida con handlers semánticos: `onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`, `onEscape`, `onCtrlK`, `onF1`–`onF12`.
   - Interfaz `POSShortcutOptions` enriquecida con: `isModalOpen?: boolean`, `customerSelectorKey?: 'F1' | 'F3' | 'F6'`, `stopPropagation?: boolean`, `target?: EventTarget | null`.
   - Registro en `window` con `{ passive: false }` para asegurar que `event.preventDefault()` bloquee colisiones nativas del navegador (e.g., F1 Ayuda, F3 Buscar, F5 Recargar, F6 Barra URL, Ctrl+K Búsqueda de Chrome, F12 DevTools).
   - Soporte multiplataforma para `Ctrl+K` (Windows/Linux) y `Cmd+K` (macOS): `(e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')`.
   - Compatibilidad retroactiva estricta al 100% con todos los handlers legacy (`onF1Help`, `onF2Cash`, `onF3Card`, `onF4Transfer`, `onF5Refresh`, `onF6Search`, `onF8Void`, `onF9SplitPayment`, `onF12Checkout`, `onEnter`, `onArrowUp`, `onArrowDown`).

3. **`src/views/pos/components/POSMultivendorView.tsx`** (Modificado):
   - Integración directa del hook `usePOSKeyboardShortcuts` con la vista de mostrador.
   - Props opcionales no-bloqueantes añadidas a `POSMultivendorViewProps`: `onSaveDraft?`, `onToggleView?`, `onCheckout?`, `isKeyboardShortcutsEnabled?`, `onEscape?`, `searchInputRef?`.
   - Mapeo semántico de teclas:
     - `F8`: Enfoca y selecciona `#pos-light-product-search-input` (con fallback a `#pos-light-barcode-input`), normalizando a la pestaña `catalogo` en móvil.
     - `Ctrl+K` / `Cmd+K`: Alterna la vista (`propsOnToggleView`, `onToggleModoCajero`, `onOpenComandasQueue` o `mobileTab`).
     - `F6`: Invoca el selector de clientes (`onOpenClientModal`).
     - `F4`: Delegado fluidamente al popover de descuento de `POSMultivendorCart`.
     - `F2`: Dispara `propsOnSaveDraft` o `onEmitirComanda()` si hay ítems en carrito y `!isSubmitting`.
     - `F9`: Dispara `propsOnCheckout` o `onCobrarCaja()` si hay ítems en carrito y `!isSubmitting`.
     - `Escape`: Descarte jerárquico seguro: 1. Cierra `scaleModalProduct` si está abierto; 2. Callback `propsOnEscape`; 3. Limpia `searchQuery`/`barcodeInput`; 4. Desenfoca el elemento activo. **Nunca vacía el carrito de compras**.

4. **`src/views/pos/components/ManualWeightModal.tsx`** (Modificado):
   - Listener de ventana (`window.addEventListener('keydown', handleKeyDown)`) activo cuando `isOpen === true` para garantizar que la tecla `Escape` cierre el modal de pesaje confiablemente, independientemente de si el foco del cursor está en el input numérico, en un botón del keypad táctil o en un chip de peso rápido.
   - Eliminación del listener redundante en `handleInputKeyDown` para evitar doble invocación de `onClose()`.

### 1.2 Ejecución de Comandos y Resultados Verbatim

1. **Fase RED (Fallo Genuino Inicial)**:
   - Comando: `npx vitest run src/tests/posKeyboardShortcuts.test.tsx`
   - Salida Verbatim:
     ```
     Test Files  1 failed (1)
          Tests  22 failed | 13 passed (35)
     ```
   - Fallos genuinos observados en: ausencia de `Ctrl+K`, falta de soporte semántico (`onFocusSearch`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`), falta de cableado en `POSMultivendorView` y falta de listener de Escape en `ManualWeightModal`.

2. **Fase GREEN (Suite TDD de Atajos Aprobada al 100%)**:
   - Comando: `npx vitest run src/tests/posKeyboardShortcuts.test.tsx`
   - Salida Verbatim:
     ```
     RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia

     ✓ src/tests/posKeyboardShortcuts.test.tsx (35 tests) 1154ms

     Test Files  1 passed (1)
          Tests  35 passed (35)
       Start at  07:49:35
       Duration  6.79s (transform 342ms, setup 432ms, collect 806ms, tests 1.15s, environment 2.89s, prepare 212ms)
     ```

3. **Verificación de Tipos TypeScript (`tsc --noEmit`)**:
   - Comando: `npx tsc --noEmit`
   - Salida Verbatim:
     ```
     Command exited with code 0.
     No output from the command.
     ```

4. **Verificación de Regresión Completa (7 Suites Canónicas)**:
   - Comando: `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`
   - Salida Verbatim:
     ```
     RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia

     ✓ src/tests/posGlobalDiscount.test.tsx (19 tests) 1299ms
     ✓ src/tests/posKeyboardShortcuts.test.tsx (35 tests) 2583ms
     ✓ src/tests/posManualWeightModal.test.tsx (25 tests) 3498ms
     ✓ src/tests/posCartEditableRow.test.tsx (10 tests) 1018ms
     ✓ src/tests/posMultivendorLightSaaS.test.tsx (8 tests) 805ms
     ✓ src/tests/commercialFlowSupermarket.test.tsx (20 tests) 2451ms
     ✓ src/tests/posTouchErgonomics.test.tsx (9 tests) 2105ms

      Test Files  7 passed (7)
           Tests  126 passed (126)
        Start at  07:54:01
        Duration  26.61s (transform 1.60s, setup 3.57s, collect 8.42s, tests 13.76s, environment 30.67s, prepare 2.34s)
     ```

---

## 2. Logic Chain

1. **Unificación Arquitectónica**: Previo al Hito M4, existían manejadores de eventos fragmentados en componentes hijos (`POSMultivendorLightHeader` para F8 y `POSMultivendorCart` para F4/Esc). La orquestación centralizada en `usePOSKeyboardShortcuts.ts` y su integración en `POSMultivendorView.tsx` unifica el control periférico en la capa contenedora de acuerdo a la arquitectura multicapa de SPEC-057.
2. **Prevención de Colisiones de Navegador**: Los navegadores asignan por defecto acciones a teclas como F1 (ayuda), F3 (búsqueda), F5 (recarga), F6 (barra de direcciones) y Ctrl+K (omnibox de búsqueda). El uso explícito de `{ passive: false }` en `window.addEventListener` y la ejecución incondicional de `e.preventDefault()` en las teclas de comando garantiza que ningún evento nativo indeseado interfiera con la operación del cajero.
3. **Discriminación de Contexto de Foco**: Para evitar que la digitación de texto y edición numérica en el carrito sea interrumpida, el hook verifica si `target` es un `INPUT`, `TEXTAREA` o `contenteditable`. Si lo es, las teclas alfanuméricas, flechas (`ArrowUp`/`ArrowDown`) y `Enter` continúan su comportamiento nativo (`return;`). No obstante, las teclas globales de hardware POS (`F1`–`F12`, `Ctrl+K`, `Escape`) son interceptadas incluso dentro de campos de entrada, permitiendo que el operador presione F6 (cliente), F4 (descuento) o F2 (comanda) sin abandonar manualmente el cursor.
4. **Resguardo de Datos en Cancelación (Escape)**: Se implementó una jerarquía estricta para la tecla `Escape`: primero cierra modales subordinados (`ManualWeightModal`), segundo cierra popovers activos, tercero limpia filtros de búsqueda, y cuarto desenfoca el input. Bajo ninguna circunstancia `Escape` invoca `onClearCart`, salvaguardando la venta en curso ante pulsaciones accidentales.
5. **Compatibilidad Retroactiva Cero-Ruptura**: Al mantener intacta la API de `POSShortcutHandlers` de SPEC-047 (`onF1Help`, `onF2Cash`, etc.) y resolver las llamadas con fallback semántico, se preservó el 100% de la suite `commercialFlowSupermarket.test.tsx` (20/20 pasando en verde).

---

## 3. Caveats

1. **Nota sobre Prueba Adversarial de Hito Anterior (`posManualWeightIntegrationChallenger.test.tsx`)**:
   - En el Hito M3, Challenger 2 diseñó el test 3.4 (`3.4 Vulnerabilidad de Escape: Si el usuario hace clic en el teclado numérico (o chip) y presiona Escape, el modal NO se cierra si el evento no está en el input`) con la aserción explícita `expect(dialogStillOpen).toBeInTheDocument()` para probar empíricamente la vulnerabilidad existente en M3.
   - En el presente Hito M4, esa vulnerabilidad fue subsanada genuinamente mediante el listener a nivel de ventana en `ManualWeightModal.tsx` y la gestión en `POSMultivendorView.tsx`.
   - Dado que `src/tests/posManualWeightIntegrationChallenger.test.tsx` no forma parte de los archivos autorizados para edición de este Worker y no está incluido en la suite canónica de regresión de M4 (la cual consta de las 7 suites especificadas en el Dispatch), dicho archivo se mantuvo intacto. Se deja constancia para que el Auditor o Reviewer actualice la aserción de ese test adversarial a `not.toBeInTheDocument()` si se desea correr la totalidad de suites históricas de challengers.

---

## 4. Conclusion

El Hito M4 (Tarea 4: Interceptor Global de Atajos de Teclado POS) ha sido implementado satisfactoriamente bajo metodología SDD v3.0 y TDD estricto. La solución implementada:
- Captura unificada y confiablemente los atajos F8, Ctrl+K / Cmd+K, F6, F4, F2, F9 y Escape.
- Protege la integridad del carrito evitando vaciados accidentales.
- Cumple con cero errores de TypeScript (`tsc --noEmit` código 0).
- Supera el 100% de las 7 suites de prueba de regresión con 126 pruebas en verde.

---

## 5. Verification Method

Para reproducir independientemente los resultados:

1. **Ejecutar Suite TDD de Atajos de Teclado (Hito M4)**:
   ```powershell
   npx vitest run src/tests/posKeyboardShortcuts.test.tsx
   ```
   *Criterio de éxito*: 35 pruebas pasando al 100% en verde.

2. **Verificar Tipado Estricto TypeScript**:
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de éxito*: Salida limpia con código de salida 0.

3. **Ejecutar la Suite Canónica de Regresión de Hitos M1 a M4 (7 Suites)**:
   ```powershell
   npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Criterio de éxito*: 126 pruebas pasando al 100% en verde (0 fallos).
