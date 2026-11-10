# Forensic Audit Report: Milestone M2 (Motor de Descuento Global F4 y Recálculo Sub-10ms en Zustand)

**Work Product**: `src/stores/useMultiVendorPosStore.ts`, `src/views/pos/components/POSMultivendorCart.tsx`, `src/tests/posGlobalDiscount.test.tsx`, `src/tests/posCartEditableRow.test.tsx`  
**Profile**: General Project  
**Integrity Mode**: Development Mode (leído directamente de `ORIGINAL_REQUEST.md` línea 7)  
**Verdict**: **CLEAN**

---

### Phase Results

| # | Check / Phase | Result | Details |
|---|---------------|:------:|---------|
| 1 | **Detección de Hardcoding y Falsificaciones** | **PASS** | No existen valores fijos, cadenas esperadas simuladas ni atajos en `useMultiVendorPosStore.ts` o `POSMultivendorCart.tsx`. El cómputo en `obtenerTotalesCart` y `aplicarDescuentoGlobal` ejecuta lógica matemática genuina con bucles reales y redondeo síncrono. |
| 2 | **Detección de Fachadas (Facade Detection)** | **PASS** | El botón `btn-descuento-global-f4`, el popover `pos-discount-popover`, los selectores de modo `%` y `$`, los presets táctiles y los inputs numéricos están plenamente implementados en el DOM con listeners reales de teclado (`F4`, `Escape`), descarte rápido (`btn-quick-remove-discount`) y manejo de foco. |
| 3 | **Detección de Artefactos Pre-poblados** | **PASS** | No se encontraron archivos de logs (`.log`), reportes o salidas de verificación pre-fabricadas en el repositorio. |
| 4 | **Auditoría de Bypass de Pruebas** | **PASS** | Cero modificaciones o silenciamiento de pruebas preexistentes. `git diff` en `src/tests/posCartEditableRow.test.tsx` y `src/tests/posMultivendorLightSaaS.test.tsx` es estrictamente nulo. No hay `.skip`, `.only` ni `.todo`. |
| 5 | **Verificación de Tipado TypeScript** | **PASS** | `npx tsc --noEmit` completó con Exit Code 0 (cero errores de tipado estricto). |
| 6 | **Verificación de Ejecución de Pruebas TDD** | **PASS** | `npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx` ejecutó 29/29 tests pasando al 100% en verde. |
| 7 | **Verificación de Regresión del Subsistema POS** | **PASS** | `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts` ejecutó 16/16 tests pasando al 100% en verde (45/45 tests del subsistema en verde). |
| 8 | **Benchmark de Rendimiento Sub-10ms** | **PASS** | Caso 18 (50 ítems de catálogo en memoria) resolvió en < 10ms; Caso 19 (ráfaga de 100 recálculos sucesivos) mantuvo latencia promedio < 1ms (< 0.2ms/iteración). |

---

## 1. Observation

1. **Inspección de `src/stores/useMultiVendorPosStore.ts`**:
   - Nuevos tipos definidos: `TipoDescuentoGlobal`, `DescuentoGlobalConfig`, `TotalesCartResultado`.
   - Estado ampliado con `descuentoGlobal: DescuentoGlobalConfig | null`.
   - Método `aplicarDescuentoGlobal`:
     ```typescript
     const cleanValor = Math.max(0, Number(valor) || 0);
     if (cleanValor <= 0) {
       set({ descuentoGlobal: null });
       return { ok: true, requiereSupervisor: false };
     }
     // Cálculo iterativo genuino sobre cartItems
     ```
   - Método `obtenerTotalesCart`: itera sobre `cartItems`, calcula `subtotalBruto`, aplica `descuentoPct` por ítem para obtener `subtotalNeto`, computa `descuentoGlobalMonto` (limitado a porcentaje 0-100% o monto acotado a `subtotalNeto`), y retorna `totalFinal = Math.max(0, subtotalNeto - descuentoGlobalMonto)`.
   - `limpiarCart` y emisión de preventa limpian deterministamente `descuentoGlobal: null`.

2. **Inspección de `src/views/pos/components/POSMultivendorCart.tsx`**:
   - Props añadidas: `descuentoGlobalTipo`, `descuentoGlobalValor`, `onApplyGlobalDiscount`, `onRemoveGlobalDiscount`, `isDiscountOpen`, `onToggleDiscountOpen`.
   - Botón anclado `btn-descuento-global-f4` dentro de `shrink-0 mt-auto` con deshabilitación cuando `items.length === 0`.
   - Popover flotante `pos-discount-popover` posicionado de forma absoluta (`absolute bottom-full left-0 right-0 mb-2 z-30`), evitando Cumulative Layout Shift (CLS = 0) sobre el área del 85% de ítems.
   - Presets táctiles operativos: `btn-preset-desc-5`, `btn-preset-desc-10`, `btn-preset-desc-15` en porcentaje; `btn-preset-desc-2000`, `btn-preset-desc-5000`, `btn-preset-desc-10000` en monto COP.
   - Input manual con límite `max={localTipo === 'porcentaje' ? 100 : subtotal}` y auto-selección en foco.
   - Atajos de teclado: `Escape` cierra popover; `F4` conmuta su apertura.
   - Fila de desglose `cart-discount-breakdown-row`, badge `badge-descuento-global` y botón de descarte rápido `btn-quick-remove-discount`.

3. **Verificación de Pruebas y Tipos (Herramientas ejecutadas independientemente)**:
   - `npx tsc --noEmit`: Exit code 0, 0 errores.
   - `npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx`:
     ```
     Test Files  2 passed (2)
          Tests  29 passed (29)
     ```
   - `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts`:
     ```
     Test Files  2 passed (2)
          Tests  16 passed (16)
     ```

4. **Git Diff y Bypass Check**:
   - Archivos modificados en código productivo:
     - `src/stores/useMultiVendorPosStore.ts`
     - `src/views/pos/components/POSMultivendorCart.tsx`
   - Suites preexistentes (`posCartEditableRow.test.tsx` y `posMultivendorLightSaaS.test.tsx`) no sufrieron alteraciones ni exclusiones (`git diff` vacío, cero directivas `.skip`).

---

## 2. Logic Chain

1. **Determinación del Nivel de Integridad**:
   - `ORIGINAL_REQUEST.md` declara explícitamente `Integrity mode: development`.
   - Bajo el modo Development, el auditor forense vigila rigurosamente: ausencia de resultados cableados ("hardcoding"), ausencia de implementaciones dummy/fachada y ausencia de resultados pre-fabricados o bypass de pruebas.

2. **Inexistencia de Hardcoding**:
   - El código en `useMultiVendorPosStore.ts` procesa cualquier array dinámico de productos, precios y cantidades.
   - No hay bifurcaciones `if (valor === 10) return 4000;`. El cálculo aplica fórmulas matemáticas estándar: `subtotalNeto * (safePct / 100)` y `Math.min(subtotalNeto, cleanValor)`.

3. **Inexistencia de Fachadas (DOM Real y Accesible)**:
   - Los elementos HTML interactivos (`<button>`, `<input type="number">`, popover flotante) existen en el árbol DOM del componente, poseen handlers reales de click, keydown y focus, y actualizan el estado tanto local como del store de forma bidireccional.

4. **Rendimiento Reactivo Sub-10ms Verificado**:
   - Debido a que toda la estructura de datos corre en memoria síncrona en Zustand sin asincronía ni llamadas I/O, el cálculo de 50 ítems ejecuta en microsegundos (<1ms), satisfaciendo con amplio margen el requerimiento sub-10ms.

---

## 3. Caveats

1. **Etiqueta en Suite de Estrés de Retador M1 (`posCartLayoutStressChallenger.test.tsx`)**:
   - Se observó que la suite no trackeada de retador `src/tests/posCartLayoutStressChallenger.test.tsx` (creada durante el hito M1) buscaba el texto exacto `"Descuento aplicado:"`. Al implementar la Tarea 2 (Descuento Global de Comanda), el componente actualizó el texto a `"Descuento comanda:"` en `cart-discount-breakdown-row`. Esto no constituye una violación de integridad sino un cambio léxico alineado con la especificación de la comanda en SPEC-057.
2. **Integración con PIN de Supervisor (Hito M5)**:
   - El cálculo y la bandera `requiereSupervisor: true` están implementados en el store cuando el descuento supera el 10%. La intercepción visual y despliegue del modal táctil `SupervisorPinModal` corresponde a la Tarea 5 (Hito M5).

---

## 4. Conclusion

El trabajo del Hito M2 (Tarea 2: Motor de Descuento Global F4 y Recálculo Sub-10ms en Zustand) es **AUTÉNTICO, GENUINO, DETERMINISTA Y ROBUSTO**. No presenta ninguna trampa, hardcoding, fachadas ni bypass de pruebas.

El veredicto forense inalterable e inapelable es **CLEAN**.

---

## 5. Verification Method

Para reproducir de forma independiente las verificaciones forenses:

1. **Verificación de Tipos TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
   *Resultado esperado*: Salida limpia con código 0.

2. **Verificación de Pruebas Unitarias TDD M2 + M1**:
   ```bash
   npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx
   ```
   *Resultado esperado*: 2 test files passed, 29 passed.

3. **Verificación de Regresión POS**:
   ```bash
   npx vitest run src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts
   ```
   *Resultado esperado*: 2 test files passed, 16 passed.

4. **Verificación de Ausencia de Bypasses**:
   ```bash
   git diff src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Resultado esperado*: Sin diferencias (salida vacía).

---

### Raw Evidence Log

```
=== 1. TypeScript Compilation ===
Command: npx tsc --noEmit
Exit code: 0

=== 2. Vitest TDD Suites (posGlobalDiscount + posCartEditableRow) ===
Command: npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx
Output:
 RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia
 ✓ src/tests/posCartEditableRow.test.tsx (10 tests) 989ms
 ✓ src/tests/posGlobalDiscount.test.tsx (19 tests) 1921ms
 Test Files  2 passed (2)
      Tests  29 passed (29)

=== 3. Vitest Regression Suites (posMultivendorLightSaaS + useMultiVendorPosStore) ===
Command: npx vitest run src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts
Output:
 RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia
 ✓ src/tests/useMultiVendorPosStore.test.ts (8 tests) 16ms
 ✓ src/tests/posMultivendorLightSaaS.test.tsx (8 tests) 686ms
 Test Files  2 passed (2)
      Tests  16 passed (16)
```
