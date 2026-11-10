# Forensic Audit Report — Milestone M4 (Tarea 4: Interceptor Global de Atajos de Teclado POS)

**Work Product**: `src/hooks/usePOSKeyboardShortcuts.ts`, `src/views/pos/components/POSMultivendorView.tsx`, `src/views/pos/components/ManualWeightModal.tsx`, `src/tests/posKeyboardShortcuts.test.tsx`  
**Profile**: General Project (Mode: Development)  
**Verdict**: **INTEGRITY VIOLATION**  
**Auditor**: Forensic Auditor (`m4_audit_shortcuts`)  
**Fecha/Hora**: 2026-11-09T13:25:00Z  

---

### Phase Results

| # | Check Name | Status | Details |
|---|------------|--------|---------|
| 1 | **Hardcoded Output Detection** | **PASS** | No se encontraron literales fijos, strings de prueba prefabricados ni bypasses en `usePOSKeyboardShortcuts.ts` o `POSMultivendorView.tsx`. Los eventos son genuinamente despachados y evaluados. |
| 2 | **Facade & Dummy Implementation Detection** | **PASS** | Las funciones y callbacks en `usePOSKeyboardShortcuts.ts` y `POSMultivendorView.tsx` ejecutan lógica real de filtrado, discriminación de inputs (`isInput`), prevención de repetición (`e.repeat`), prevención de colisión (`e.preventDefault()`), y llamadas a estado. |
| 3 | **Pre-populated Artifact Detection** | **PASS** | Cero archivos `*.log`, `*result*`, o `*output*` pre-existentes en el repositorio (`src/` y `.agents/teamwork/`). |
| 4 | **Build & TypeScript Compilation (`tsc --noEmit`)** | **PASS** | `npx tsc --noEmit` completó limpiamente con código de salida 0 y 0 errores de tipado. |
| 5 | **Test Suite Authenticity & Coverage** | **PASS** | `posKeyboardShortcuts.test.tsx` ejecuta 35 pruebas TDD auténticas despachando eventos DOM nativos (`window.dispatchEvent(new KeyboardEvent(...))`, `fireEvent.keyDown`). |
| 6 | **Canonical Regression Suites (7 Suites)** | **PASS** | 126/126 pruebas pasando en verde en las 7 suites requeridas por el plan. |
| 7 | **React Rules of Hooks & Lifecycle Integrity** | **FAIL** | **VIOLACIÓN CRÍTICA DETECTADA**: En `src/views/pos/components/ManualWeightModal.tsx`, el Worker introdujo un hook `useEffect` en la línea 163, **después** del retorno anticipado `if (!isOpen || !producto) return null;` (línea 82). Esto viola directamente las Reglas de Hooks de React (`react-hooks/rules-of-hooks`), causando un fallo fatal en tiempo de ejecución (`Error: Rendered more hooks than during the previous render`) cuando el modal transiciona entre estados abierto y cerrado. |

---

## 1. Observation

### 1.1 Infracción de Reglas de Hooks en `src/views/pos/components/ManualWeightModal.tsx`
Al inspeccionar el código fuente modificado en `src/views/pos/components/ManualWeightModal.tsx`:
- **Línea 82**: Retorno temprano condicional cuando el modal está cerrado o sin producto:
  ```tsx
  82: if (!isOpen || !producto) return null;
  ```
- **Línea 163-173**: Declaración de un hook `useEffect` **posterior** a la línea 82:
  ```tsx
  162: // Listener global de Escape a nivel de ventana para cerrar el modal confiablemente sin importar el foco (Hito M4)
  163: useEffect(() => {
  164:   if (!isOpen) return;
  165:   const handleKeyDown = (e: KeyboardEvent) => {
  166:     if (e.key === 'Escape' || e.key === 'Esc') {
  167:       e.preventDefault();
  168:       onClose();
  169:     }
  170:   };
  171:   window.addEventListener('keydown', handleKeyDown);
  172:   return () => window.removeEventListener('keydown', handleKeyDown);
  173: }, [isOpen, onClose]);
  ```

### 1.2 Salida Verbatim de ESLint
Comando ejecutado:
```powershell
npx eslint src/views/pos/components/ManualWeightModal.tsx
```
Salida Verbatim:
```
C:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\src\views\pos\components\ManualWeightModal.tsx
  163:3  error  React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks

✖ 1 problem (1 error, 0 warnings)
```
Código de salida: 1.

### 1.3 Salida Verbatim de Vitest en Ciclo de Vida del Modal
Al ejecutar la suite de integración de ciclo de vida `src/tests/posManualWeightIntegrationChallenger.test.tsx`:
Comando ejecutado:
```powershell
npx vitest run src/tests/posManualWeightIntegrationChallenger.test.tsx
```
Salida Verbatim:
```
stderr | src/tests/posManualWeightIntegrationChallenger.test.tsx > Challenger 2: M3 Barcode Burst, Repetitive Weighing & Modal Lifecycle Stress Suite > Desafío 5: Benchmarking de Latencia de Apertura (< 16ms, 60 FPS) > 5.1 Actualización reactiva y apertura de ManualWeightModal cumple con presupuesto de 16ms (60 FPS)
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

    at ManualWeightModal (src\views\pos\components\ManualWeightModal.tsx:19:3)
Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (node_modules/react-dom/cjs/react-dom.development.js:15688:13)
    at updateEffectImpl (node_modules/react-dom/cjs/react-dom.development.js:16248:14)
    at updateEffect (node_modules/react-dom/cjs/react-dom.development.js:16279:10)
    at Object.useEffect (node_modules/react-dom/cjs/react-dom.development.js:17043:14)
    at Proxy.useEffect (node_modules/react/cjs/react.development.js:1634:21)
    at ManualWeightModal (src\views\pos\components\ManualWeightModal.tsx:163:3)
```

---

## 2. Logic Chain

1. **Premisa 1**: Las directrices de arquitectura de React y la regla innegociable `react-hooks/rules-of-hooks` exigen que los Hooks de React se invoquen siempre al nivel superior del componente y antes de cualquier retorno temprano (`early return`), para mantener idéntico el orden y la cantidad de hooks en cada renderizado.
2. **Premisa 2**: En el Hito M4, para solucionar el cierre por Escape del modal de pesaje, el Worker modificó `ManualWeightModal.tsx` introduciendo un `useEffect` a nivel de ventana en la línea 163, después de la línea 82 (`if (!isOpen || !producto) return null;`).
3. **Premisa 3**: Cuando `ManualWeightModal` se renderiza con `isOpen={false}` (o `producto={null}`), ejecuta 7 hooks antes de retornar `null`. Cuando pasa a `isOpen={true}`, renderiza más allá de la línea 82 y llama al hook #8 (`useEffect`).
4. **Premisa 4**: React detecta la discrepancia en la lista enlazada de hooks (`Previous render: 7 hooks, Next render: 8 hooks`), lanzando una advertencia crítica y abortando con `Error: Rendered more hooks than during the previous render`.
5. **Conclusión**: El cambio introduce una regresión arquitectónica y de estabilidad que quiebra la ejecución en producción y falla los estándares de calidad del proyecto. De acuerdo con el principio rector del Auditor Forense (*"If ANY check fails, your verdict is INTEGRITY VIOLATION and you MUST reject the work product"*), el producto de trabajo debe ser **RECHAZADO**.

---

## 3. Caveats

1. La implementación en `src/hooks/usePOSKeyboardShortcuts.ts` y `src/views/pos/components/POSMultivendorView.tsx` es genuina, robusta y libre de hardcoding o fachadas dummy.
2. La suite TDD `src/tests/posKeyboardShortcuts.test.tsx` (35 tests) y las 7 suites canónicas (126 tests) pasan al 100%.
3. El fallo radica estrictamente en la colocación sintáctica del nuevo `useEffect` en `ManualWeightModal.tsx`, no en su lógica interna ni en la orquestación general de atajos.

---

## 4. Conclusion

El producto de trabajo del Hito M4 (Tarea 4: Interceptor Global de Atajos de Teclado POS) contiene una violación estructural de las Reglas de Hooks de React en `ManualWeightModal.tsx` (línea 163).
- **Veredicto Final**: **INTEGRITY VIOLATION**
- **Acción requerida**: El Worker Implementer debe reubicar el hook `useEffect` al nivel superior del componente en `ManualWeightModal.tsx` (antes de la línea 82 `if (!isOpen || !producto) return null;`), verificar con `npx eslint src/views/pos/components/ManualWeightModal.tsx`, y re-someter a auditoría.

---

## 5. Verification Method (Reproducción Independiente)

1. **Comprobar fallo de ESLint en `ManualWeightModal.tsx`**:
   ```powershell
   npx eslint src/views/pos/components/ManualWeightModal.tsx
   ```
   *Evidencia esperada*: Error 163:3 `React Hook "useEffect" is called conditionally`.

2. **Comprobar excepción en tiempo de ejecución en suite de ciclo de vida**:
   ```powershell
   npx vitest run src/tests/posManualWeightIntegrationChallenger.test.tsx
   ```
   *Evidencia esperada*: Fallo en Desafío 5 con `Error: Rendered more hooks than during the previous render`.

---

## 6. Prescripción de Remediación Exacta para el Worker

En `src/views/pos/components/ManualWeightModal.tsx`:
Mover el bloque del `useEffect` de la línea 163 hacia arriba, situándolo junto con los demás hooks (por ejemplo, entre las líneas 68 y 70, antes de la línea 82):

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

Al estar ubicado antes de `if (!isOpen || !producto) return null;`, React ejecutará siempre el mismo número de hooks en idéntico orden, eliminando el error de ESLint y el crash de runtime. Adicionalmente, actualizar la aserción en el test 3.4 de `posManualWeightIntegrationChallenger.test.tsx` a `not.toBeInTheDocument()` dado que ahora el modal sí se cierra correctamente por Escape.
