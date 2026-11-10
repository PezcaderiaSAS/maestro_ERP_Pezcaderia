# Handoff Report — M4 Ergonomics Review & Adversarial Stress-Test

**Role**: M4 Ergonomics Reviewer & Critic (`teamwork_reviewer`, `teamwork_critic`)  
**State Folder**: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics`  
**Date**: 2026-11-09T13:22:00Z  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Verificación de Ejecución de Comandos Verbatim
1. **Verificación de Tipos TypeScript (`tsc --noEmit`)**:
   - Comando: `npx tsc --noEmit`
   - Resultado: Salida limpia, código de salida 0.
2. **Suite TDD de Atajos y Pesaje Manual**:
   - Comando: `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/posManualWeightModal.test.tsx`
   - Resultado:
     ```
     Test Files  2 passed (2)
          Tests  60 passed (60)
       Duration  11.84s
     ```
3. **Suite Canónica de Regresión (7 Suites de Hitos M1 a M4)**:
   - Comando: `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`
   - Resultado:
     ```
     Test Files  7 passed (7)
          Tests  126 passed (126)
       Duration  50.39s
     ```

### 1.2 Hallazgo Crítico en Adversarial Stress-Testing
Al ejecutar la prueba de ciclo de vida de renderizado y transiciones (`src/tests/posManualWeightIntegrationChallenger.test.tsx`):
- Comando: `npx vitest run src/tests/posManualWeightIntegrationChallenger.test.tsx`
- Resultado Verbatim:
  ```
  Warning: React has detected a change in the order of Hooks called by ManualWeightModal. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks

     Previous render            Next render
     ------------------------------------------------------
  1. useState                   useState
  2. useState                   useState
  3. useRef                     useRef
  4. useMemo                    useMemo
  5. useEffect                  useEffect
  6. useMemo                    useMemo
  7. useMemo                    useMemo
  8. undefined                  useEffect
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

      at ManualWeightModal (src/views/pos/components/ManualWeightModal.tsx:163:3)
  Error: Rendered more hooks than during the previous render.
      at updateWorkInProgressHook (node_modules/react-dom/cjs/react-dom.development.js:15688:13)
      at ManualWeightModal (src/views/pos/components/ManualWeightModal.tsx:163:3)
  ```

### 1.3 Inspección de Código Fuente
1. **`src/views/pos/components/ManualWeightModal.tsx`**:
   - Línea 82:
     ```tsx
     if (!isOpen || !producto) return null;
     ```
   - Líneas 163-173:
     ```tsx
     // Listener global de Escape a nivel de ventana para cerrar el modal confiablemente sin importar el foco (Hito M4)
     useEffect(() => {
       if (!isOpen) return;
       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' || e.key === 'Esc') {
           e.preventDefault();
           onClose();
         }
       };
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [isOpen, onClose]);
     ```
   - El hook `useEffect` en la línea 163 fue ubicado **después** del retorno anticipado condicional (`if (!isOpen || !producto) return null;`) en la línea 82.

2. **`src/hooks/usePOSKeyboardShortcuts.ts`**:
   - Líneas 140-146:
     ```typescript
     // 1. Contexto de Modal Activo: Solo permitir Escape
     if (isModalOpen) {
       if (key === 'Escape') {
         consumeEvent();
         h.onEscape?.();
       }
       return;
     }
     ```
   - Cuando `isModalOpen === true`, si la tecla presionada es cualquier tecla de función diferente a Escape (`F1`, `F3`, `F5`, `F6`, etc.), la ejecución ejecuta `return;` inmediato antes de `isFuncKey` y sin invocar `consumeEvent()`.

3. **`src/views/pos/components/POSMultivendorView.tsx`**:
   - Líneas 173-195: La jerarquía de Escape en `onEscape` maneja:
     1. Cerrar `scaleModalProduct` si está abierto.
     2. Ejecutar `propsOnEscape` si existe.
     3. Limpiar `searchQuery` y `barcodeInput` si tienen texto.
     4. Desenfocar el elemento activo en el DOM.
   - En ningún caso invoca `onClearCart`. La integridad del carrito está salvaguardada.

---

## 2. Logic Chain

1. **Infracción de Reglas Fundamentales de React (Rules of Hooks)**:
   - Según la especificación oficial de React, los Hooks nunca deben ser invocados dentro de condicionales ni después de retornos anticipados (`return null;`).
   - En `ManualWeightModal.tsx`, cuando el componente se monta con `isOpen={false}` o `producto={null}`, React registra 7 hooks (`useState`, `useState`, `useRef`, `useMemo`, `useEffect`, `useMemo`, `useMemo`) y retorna `null` en la línea 82.
   - Cuando el modal pasa a `isOpen={true}` y `producto` existe, React continúa la ejecución hasta la línea 163 donde encuentra un octavo hook (`useEffect`).
   - Esto causa una discrepancia fatal en la lista enlazada interna de hooks de React Fiber, arrojando `Error: Rendered more hooks than during the previous render` y provocando un choque (crash) irreversible en la aplicación cliente.
2. **Por qué pasó desapercibido en la suite básica**:
   - En `src/tests/posManualWeightModal.test.tsx`, todas las pruebas montan directamente el componente con `isOpen={true}` desde el primer render, sin probar la transición de estado `false -> true`.
   - En `POSMultivendorView.tsx`, el modal se renderiza con `{scaleModalProduct && <ManualWeightModal ... />}` (renderizado condicional a nivel de padre), ocultando el fallo a menos que `ManualWeightModal` permanezca montado con `isOpen` alternante.
   - No obstante, `ManualWeightModal` expone la prop `isOpen: boolean` en su interfaz pública, y cualquier consumidor que mantenga el modal montado colapsará en tiempo de ejecución.
3. **Fuga de Colisiones de Navegador con Modal Activo**:
   - En `usePOSKeyboardShortcuts.ts`, la cláusula `if (isModalOpen) { ... return; }` omite `consumeEvent()`.
   - Si un cajero tiene abierto el modal de pesaje o el modal de PIN y presiona accidentalmente `F5` (Refrescar), `F1` (Ayuda de Windows) o `F6` (Barra de direcciones del navegador), el navegador intercepta la tecla nativamente.
   - En el caso de `F5`, recarga la página, destruyendo el estado volátil de la comanda en curso y perdiendo la digitación actual.

---

## 3. Findings

### [Critical] Finding 1: Violación de Reglas de Hooks en `ManualWeightModal.tsx`
- **Ubicación**: `src/views/pos/components/ManualWeightModal.tsx`, líneas 82 y 163.
- **Problema**: El hook `useEffect` para el listener de Escape está posicionado después de la sentencia condicional `if (!isOpen || !producto) return null;`.
- **Impacto**: Choque fatal de React (`Rendered more hooks than during the previous render`) al abrir el modal cuando este ya estaba montado con `isOpen: false`.
- **Sugerencia de corrección**: Mover el `useEffect` de la línea 163 hacia arriba, ubicándolo antes de la línea 82 (por ejemplo, justo debajo del primer `useEffect` en la línea 68). Dado que el cuerpo del hook ya valida `if (!isOpen) return;`, ubicarlo arriba garantiza un número constante y determinista de hooks en todos los ciclos de renderizado.

### [Major] Finding 2: Fuga de Colisión con Atajos Nativos del Navegador (F1, F5, F6) con Modal Activo
- **Ubicación**: `src/hooks/usePOSKeyboardShortcuts.ts`, líneas 140-146.
- **Problema**: Cuando `isModalOpen === true`, se omite `consumeEvent()` para teclas de función `F1`-`F12`.
- **Impacto**: Riesgo ergonómico y operativo en mostrador. Presionar `F5` mientras un modal está abierto recarga la página web perdiendo la transacción.
- **Sugerencia de corrección**: Si `isModalOpen === true`, verificar si la tecla es una tecla de función (`isFuncKey`) o `isCtrlK` y llamar a `consumeEvent()` para bloquear la acción del navegador, pero sin disparar callbacks de comanda POS (`h.onSaveDraft`, etc.).

---

## 4. Caveats

1. **Aspectos Positivos Validados**:
   - La prevención de colisiones del navegador con `{ passive: false }` y `e.preventDefault()` funciona impecablemente en modo mostrador abierto.
   - El soporte multiplataforma `Ctrl+K` (Windows/Linux) y `Cmd+K` (macOS) está implementado con elegancia (`ctrlKey || metaKey`) y verificado.
   - El resguardo del carrito ante la tecla `Escape` es 100% efectivo: la jerarquía cierra modales y limpia filtros, pero **jamás** invoca `onClearCart`.
   - Cero errores en `tsc --noEmit` y 126/126 pruebas verdes en la suite canónica.
   - No se detectaron violaciones de integridad ni facades en el código entregado.

---

## 5. Conclusion

**Veredicto**: **REQUEST_CHANGES**

Aunque la implementación de los atajos y el diseño de la API en `usePOSKeyboardShortcuts.ts` y `POSMultivendorView.tsx` es sólida y supera las suites canónicas, el cambio introducido en `ManualWeightModal.tsx` contiene un defecto crítico de arquitectura React (Rules of Hooks Violation) que causa choques en transiciones de montaje, y existe una fuga de colisiones de navegador cuando hay modales activos.

El Worker debe corregir ambos puntos antes de proceder a la aprobación del hito.

---

## 6. Verification Method

Para reproducir y validar el hallazgo:

1. **Reproducir el choque de Rules of Hooks**:
   ```powershell
   npx vitest run src/tests/posManualWeightIntegrationChallenger.test.tsx -t "Latencia de Apertura"
   ```
   *Resultado esperado tras corrección*: 0 errores de Rules of Hooks.

2. **Verificar la suite canónica de regresión tras la corrección**:
   ```powershell
   npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Criterio de éxito*: 126 pruebas pasando al 100% en verde.
