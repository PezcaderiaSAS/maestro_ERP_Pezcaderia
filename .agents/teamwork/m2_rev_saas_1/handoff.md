# Reporte de Auditoría y Revisión: Motor de Descuento Global F4 y Recálculo Sub-10ms (Hito M2)

**Revisor**: Revisor 1 de Correctitud y Conformidad (`m2_rev_saas_1`)  
**Roles**: Reviewer, Adversarial Critic  
**Hito**: Milestone M2 — Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand (SPEC-057 Tarea 2)  
**Fecha**: 2026-11-08  
**Tipo**: Hard Handoff (Auditoría Completada)  
**Destinatario**: Orquestador (`214a0168-c4c8-4555-84a8-e65c4fad7287`)  

---

## Review Summary

**Verdict**: **APPROVE**  
**Integrity Assessment**: **CLEAN (No violations detected)**  
**Risk Level**: **LOW**  

---

## 1. Observation

### 1.1 Verificación de Compilación y Tipado TypeScript
- **Comando ejecutado**: `npx tsc --noEmit`
- **Resultado observado**:
  ```
  Command exited with code 0.
  No output from the command.
  ```
- **Hallazgo**: Cero errores de tipado en todo el repositorio.

### 1.2 Verificación de Suite de Pruebas Unitarias M2
- **Comando ejecutado**: `npx vitest run src/tests/posGlobalDiscount.test.tsx`
- **Resultado observado**:
  ```
  RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia

  ✓ src/tests/posGlobalDiscount.test.tsx (19 tests) 1397ms

  Test Files  1 passed (1)
       Tests  19 passed (19)
    Start at  10:43:17
    Duration  15.94s (transform 1.65s, setup 800ms, collect 2.73s, tests 1.40s, environment 6.38s, prepare 3.09s)
  ```
- **Hallazgo**: 19 de 19 pruebas de `src/tests/posGlobalDiscount.test.tsx` pasaron satisfactoriamente.

### 1.3 Verificación de Regresión en Subsistema POS
- **Comando ejecutado**: `npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts`
- **Resultado observado**:
  ```
  RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia

  ✓ src/tests/posMultivendorLightSaaS.test.tsx (8 tests) 824ms
  ✓ src/tests/posCartEditableRow.test.tsx (10 tests) 970ms
  ✓ src/tests/posGlobalDiscount.test.tsx (19 tests) 1615ms
  ✓ src/tests/useMultiVendorPosStore.test.ts (8 tests) 16ms

  Test Files  4 passed (4)
       Tests  45 passed (45)
    Start at  10:43:52
    Duration  30.60s
  ```
- **Hallazgo**: 4 archivos de prueba evaluados, 45 pruebas pasadas sin un solo fallo ni regresión.

### 1.4 Auditoría de Integridad y Código Fuente en `src/stores/useMultiVendorPosStore.ts`
- **Tipos TypeScript exportados**:
  - `TipoDescuentoGlobal = 'porcentaje' | 'monto'` (línea 25).
  - `DescuentoGlobalConfig` (líneas 27-33) con campos `tipo`, `valor`, `montoCalculado`, `supervisorPinAutorizado`, `supervisorId`.
  - `TotalesCartResultado` (líneas 35-42) con `subtotalBruto`, `descuentoLineas`, `subtotalNeto`, `descuentoGlobalMonto`, `descuentoTotal`, `totalFinal`.
- **Implementación de `aplicarDescuentoGlobal`** (líneas 246-293):
  - Limpieza y sanitización de entrada: `const cleanValor = Math.max(0, Number(valor) || 0)`.
  - Si el valor es `<= 0`, resetea `descuentoGlobal: null` y retorna `{ ok: true, requiereSupervisor: false }`.
  - Cálculo de `subtotalNetoLineas` considerando los descuentos individuales por ítem.
  - Modo porcentaje acotado con `Math.min(100, cleanValor)`.
  - Modo monto acotado con `Math.min(subtotalNetoLineas, Math.round(cleanValor))`.
  - Determinación de `requiereSupervisor = pctEquivalente > maxDescuentoVendedorPct`.
- **Implementación de `obtenerTotalesCart`** (líneas 299-338):
  - Recorrido síncrono O(N) sin I/O ni llamadas asíncronas.
  - Prevención de totales negativos: `const totalFinal = Math.max(0, subtotalNeto - descuentoGlobalMonto)`.
  - Consistencia contable estricta: `subtotalBruto - descuentoTotal === totalFinal`.
- **Limpieza de estado**:
  - `limpiarDescuentoGlobal()` resetea `descuentoGlobal: null` (líneas 295-297).
  - `limpiarCart()` y `emitirPreventaActual()` vacían los ítems y restablecen `descuentoGlobal: null` (líneas 353-355 y 380-383).

### 1.5 Auditoría de UI/UX en `src/views/pos/components/POSMultivendorCart.tsx`
- **Estructura Flotante Anti-CLS**:
  - Popover posicionado con `absolute bottom-full left-0 right-0 mb-2 z-30` (línea 479). No altera el alto del footer (`shrink-0 mt-auto`).
  - Preserva el 85% de espacio vertical para la lista de ítems (`flex-1 min-h-0 overflow-y-auto`).
- **Accesibilidad y Atajos**:
  - Tecla `Escape` cierra el popover (línea 128).
  - Tecla `F4` abre/cierra el popover si hay productos en el carrito (`items.length > 0`) (línea 130).
  - Clic externo detectado vía listener `mousedown` en `handleClickOutside` (líneas 108-124).
- **Prevención de Errores de Usuario**:
  - Botón deshabilitado si `items.length === 0` (`disabled={items.length === 0}`).
  - Botón de remoción rápida `btn-quick-remove-discount` en la fila de desglose (líneas 691-700).

---

## 2. Logic Chain

1. **Ausencia de Violaciones de Integridad**:
   - Se verificó que el store `useMultiVendorPosStore.ts` y la vista `POSMultivendorCart.tsx` no contienen valores de prueba hardcodeados (como montos fijos $4.000 o $7.500 condicionados por ID o nombre de producto). La lógica matemática opera con cálculos aritméticos dinámicos estándar (Obs 1.4).
   - Los 19 tests en `posGlobalDiscount.test.tsx` evalúan casos de negocio reales mediante manipulación de estado e interacción DOM con `@testing-library/react`.
2. **Correctitud Financiera y Matemática**:
   - El orden de prelación contable es correcto: primero se aplican los descuentos de línea sobre los precios brutos (`subtotalNeto = sum(precioFinal * cantidad)`), y luego el descuento global se aplica sobre el remanente neto (`descuentoGlobalMonto = f(subtotalNeto)`). Esto previene doble cómputo o descuentos fantasmas.
   - La no-negatividad está blindada a doble nivel: tanto en la entrada del popover (`Math.min(subtotal, numVal)` en `POSMultivendorCart.tsx:162`) como en el núcleo del store (`Math.max(0, subtotalNeto - descuentoGlobalMonto)` en `useMultiVendorPosStore.ts:328`).
3. **Resiliencia Dinámica ante Cambios de Carrito**:
   - Si se aplica un descuento fijo de $20.000 con un carrito de $50.000, y posteriormente el vendedor elimina ítems reduciendo el subtotal a $15.000, la función `obtenerTotalesCart()` re-evalúa en tiempo real `Math.min(subtotalNeto, descuentoGlobal.valor)`, resultando en un descuento acotado a $15.000 y un `totalFinal = 0`, sin desbordamientos negativos ni excepciones en tiempo de ejecución.
4. **Rendimiento Reactivo Sub-10ms**:
   - `obtenerTotalesCart` opera en memoria Heap en tiempo O(N) sin side effects ni llamadas asíncronas.
   - Las pruebas de estrés (Casos 18 y 19) confirmaron que 50 productos toman menos de 10ms y una ráfaga de 100 recálculos sucesivos mantiene una latencia promedio inferior a 1ms (Obs 1.2).
5. **Calidad de Software y Cero Regresiones**:
   - La suite completa de TypeScript ejecutó sin errores (`tsc --noEmit` exit 0).
   - Los 45 tests del subsistema POS (incluyendo la Fila Editable de M1 y pruebas de contrato multivendor) pasaron con 100% de éxito (Obs 1.3).

---

## 3. Caveats

1. **Atajo Global de Teclado a Nivel de Aplicación (Hito M4)**:
   El atajo `F4` implementado en `POSMultivendorCart.tsx` escucha a nivel de ventana cuando el componente está montado. El interceptor unificado de atajos de teclado para toda la aplicación POS (`src/hooks/usePOSKeyboardShortcuts.ts`), que maneja F8, Ctrl+K, F6, F2, F9 y Esc sin colisiones del navegador, está programado para el Hito M4 según `PROJECT.md`.
2. **Modal de PIN de Supervisor (Hito M5)**:
   La bandera `requiereSupervisor: true` se calcula y reporta adecuadamente en `aplicarDescuentoGlobal` cuando el descuento supera el 10% (`maxDescuentoVendedorPct`). La intercepción visual y bloqueo modal mediante `SupervisorPinModal.tsx` corresponde a la Tarea 5 (Hito M5).

---

## 4. Conclusion

El trabajo entregado por el worker (`worker_m2_actions`) para el **Hito M2 (Tarea 2: Motor de Descuento Global F4 y Recálculo Sub-10ms en Zustand)** cumple rigurosamente con todos los criterios de aceptación especificados en `ORIGINAL_REQUEST.md` y `PROJECT.md`.

- Tipos TypeScript consistentes y estrictos.
- Lógica síncrona en Zustand con recálculo instantáneo (<1ms promedio).
- Total a pagar acotado a `>= 0` de manera determinista.
- Selector ergonómico emergente tipo popover flotante sin salto de layout (anti-CLS).
- Cobertura de 19 pruebas unitarias exhaustivas y 45 pruebas de regresión conjuntas en verde.
- Ausencia total de infracciones de integridad.

**Veredicto Oficial**: **APPROVE**. Se recomienda proceder a la consolidación del hito y avanzar al Hito M3.

---

## 5. Verification Method

Para reproducir de manera independiente esta auditoría:

1. **Verificar ausencia de errores TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
   *Criterio de éxito*: Salida limpia con código de salida 0.
2. **Ejecutar la suite de pruebas unitarias de M2**:
   ```bash
   npx vitest run src/tests/posGlobalDiscount.test.tsx
   ```
   *Criterio de éxito*: 19 tests pasando al 100%.
3. **Ejecutar la suite conjunta de regresión POS**:
   ```bash
   npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts
   ```
   *Criterio de éxito*: 45 tests pasando en verde (0 fallos).
4. **Condiciones de Invalidación**:
   - Si `npx tsc --noEmit` arroja errores de tipado en `useMultiVendorPosStore.ts` o `POSMultivendorCart.tsx`.
   - Si aplicar un descuento en pesos mayor al subtotal neto produce un `totalFinal` negativo.
   - Si el recálculo financiero en Zustand excede los 10ms en un carrito de 50 ítems.
