# Reporte de Auditoría y Revisión UI/UX & Ergonomía (Hito M2)

**Agente**: Revisor 2 de Ergonomía UI/UX y Accesibilidad (`m2_rev_saas_2`)  
**Roles**: Reviewer & Adversarial Critic  
**Hito**: Milestone M2 — Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand (SPEC-057 Tarea 2)  
**Fecha**: 2026-11-08  
**Tipo**: Hard Handoff (Auditoría Completada)  
**Destinatario**: Orquestador (`214a0168-c4c8-4555-84a8-e65c4fad7287`)

---

## Review Summary

**Verdict**: **APPROVE**

---

## 1. Observation

Se inspeccionó de forma exhaustiva la implementación del Hito M2 en los archivos fuente del proyecto:

1. **Estructura y Ubicación en Footer (`src/views/pos/components/POSMultivendorCart.tsx` líneas 444-472):**
   - El botón interactivo anclado posee el id y testid `btn-descuento-global-f4`.
   - Se encuentra ubicado de forma fija dentro del contenedor de pie del carrito (`shrink-0 mt-auto`), inmediatamente antes del Total a Pagar y del botón principal de comanda.
   - Estado inactivo/deshabilitado estricto cuando `items.length === 0`: aplica `cursor-not-allowed opacity-60`, previniendo la apertura del popover si el carrito no tiene productos.
   - Estado activo con descuento aplicado: el botón conmuta de un borde discontinuo ambarino (`border-dashed border-amber-300 bg-amber-50/70 text-amber-800`) a un diseño sólido resaltado (`border-amber-300 bg-amber-100/80 text-amber-900`) con un chip interno que indica el descuento actual (ej. `-10%` o `-$5.000`).

2. **Popover Selector Flotante Anti-CLS (`POSMultivendorCart.tsx` líneas 475-665):**
   - Contenedor con `data-testid="pos-discount-popover"`.
   - Clases CSS: `absolute bottom-full left-0 right-0 mb-2 z-30 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150`.
   - Al posicionarse de forma absoluta flotando por encima del botón (`bottom-full`), su despliegue y cierre **no modifica la altura del footer**, garantizando cero desplazamiento acumulativo de diseño (CLS = 0) y preservando el 85% del espacio vertical asignado a la lista de ítems (`flex-1 min-h-0 overflow-y-auto`).

3. **Selector de Modo y Ergonomía de Presets Rápidos (`POSMultivendorCart.tsx` líneas 498-612):**
   - Alternancia entre `%` (`btn-modo-porcentaje`) y `$` (`btn-modo-monto`) con estado visual activo de alto contraste (`bg-amber-600 text-white`).
   - Presets táctiles directos:
     - En porcentaje: `5%` (`btn-preset-desc-5`), `10%` (`btn-preset-desc-10`), `15%` (`btn-preset-desc-15`).
     - En monto fijo COP: `$2.000` (`btn-preset-desc-2000`), `$5.000` (`btn-preset-desc-5000`), `$10.000` (`btn-preset-desc-10000`).
   - Input manual `input-descuento-global-valor`: auto-selección en foco (`onFocus={(e) => e.target.select()}`), prefijo adaptativo `%` o `$`, y restricciones de límites dinámicos `max={localTipo === 'porcentaje' ? 100 : subtotal}`.

4. **Accesibilidad y Ergonomía de Teclado (`POSMultivendorCart.tsx` líneas 107-137):**
   - Listener de teclado:
     - Tecla `Escape`: cierra inmediatamente el selector sin perder el estado del carrito.
     - Tecla `F4`: ejecuta `e.preventDefault()` y conmuta la apertura del popover si el carrito contiene ítems.
   - Cierre al hacer clic fuera del componente (`handleClickOutside`) con exclusión controlada del botón disparador para evitar dobles conmutaciones.

5. **Fila de Desglose Financiero (`POSMultivendorCart.tsx` líneas 669-702):**
   - Contenedor `cart-discount-breakdown-row` visible condicionalmente cuando `descuento > 0 || currentDiscountValor > 0`.
   - Badge visual `badge-descuento-global` (`bg-amber-200 text-amber-950 font-black font-mono`).
   - Botón de remoción rápida `btn-quick-remove-discount` con icono `X` para descarte en 1 clic.
   - Cumplimiento de contraste WCAG AAA (relación de contraste texto ambarino sobre fondo > 7:1).

6. **Verificación de Pruebas y Compilación Ejecutada Independientemente:**
   - Vitest: `npx vitest run src/tests/posCartEditableRow.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts`
     - **4 test files passed, 45 tests passed (100% verde)** en 23.82s.
   - TypeScript: `npx tsc --noEmit`
     - **Exit code 0, 0 errores**.

7. **Auditoría de Integridad del Código:**
   - No se hallaron resultados de prueba cableados ("hardcoded").
   - Las operaciones matemáticas en `src/stores/useMultiVendorPosStore.ts` se ejecutan síncronamente con bucles iterativos reales sobre `cartItems`.
   - El benchmark de recálculo con 50 productos ejecutó en sub-10ms de forma genuina con `performance.now()`.

---

## 2. Logic Chain

1. **Preservación del Layout y Prevención de Saltos Visuales (Anti-CLS)**:
   - *Observación*: El popover utiliza posicionamiento `absolute bottom-full`.
   - *Inferencia*: Al estar fuera del flujo normal del documento del footer, abrir o cerrar el modal de descuento no altera el tamaño del contenedor inferior (`p-3 bg-slate-50 border-t shrink-0`).
   - *Conclusión*: Se respeta la regla de oro de mantener el 85% del área vertical disponible para el listado con scroll (`flex-1 min-h-0 overflow-y-auto`), sin provocar saltos bruscos que desorienten al cajero o asesor.

2. **Usabilidad Operativa en Punto de Venta (Ergonomía Táctica)**:
   - *Observación*: Presets para descuentos frecuentes en pescadería (5%, 10%, 15% y $2.000, $5.000, $10.000) más atajo `F4`.
   - *Inferencia*: En un entorno de alto tráfico de mostrador, el cajero puede aplicar un descuento de cortesía o fidelización en menos de 2 segundos sin soltar el teclado o con un único tap en pantalla táctil.
   - *Conclusión*: La combinación de presets táctiles de 40px y atajos de teclado responde directamente al estándar ergonómico requerido para cajas registradoras y terminales POS.

3. **Robustez Financiera y Manejo de Casos Límite**:
   - *Observación*: El componente aplica `Math.min(subtotal, numVal)` y el store aplica `Math.max(0, subtotalNeto - descuentoGlobalMonto)`.
   - *Inferencia*: Ni la interfaz ni el estado permiten generar comandas con valores negativos o inconsistencias de redondeo.
   - *Conclusión*: El cálculo financiero en memoria es determinista, seguro y resiste entradas adversas.

---

## 3. Caveats

1. **Alcance de Atajos Globales fuera del Carrito**:
   - El listener de `F4` dentro de `POSMultivendorCart.tsx` atiende los eventos cuando el carrito está montado en pantalla. La captura unificada a nivel de ventana global con prevención cruzada de atajos de sistema (F8, Ctrl+K, F6, F2, F9, Esc) está planificada para el Hito M4 (`usePOSKeyboardShortcuts.ts`).
2. **Modal de PIN de Supervisor (Hito M5)**:
   - La bandera `requiereSupervisor: true` es calculada y devuelta correctamente por el store cuando el descuento excede el 10% permitido a los vendedores. La interrupción visual mediante el diálogo `SupervisorPinModal` será integrada en el Hito M5.

---

## 4. Conclusion

El trabajo presentado en el Hito M2 satisface plenamente los requisitos de ergonomía, UI/UX, accesibilidad y rendimiento instantáneo sub-10ms estipulados en SPEC-057 Tarea 2. No se detectaron violaciones de integridad ni degradación visual.

El veredicto formal es **APPROVE**.

---

## 5. Verification Method

Para replicar de forma independiente esta auditoría:

```bash
# 1. Ejecutar las suites de prueba de la interfaz de carrito y descuento global
npx vitest run src/tests/posCartEditableRow.test.tsx src/tests/posGlobalDiscount.test.tsx

# 2. Ejecutar la suite completa de regresión POS (45 tests)
npx vitest run src/tests/posCartEditableRow.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posMultivendorLightSaaS.test.tsx src/tests/useMultiVendorPosStore.test.ts

# 3. Validar tipado TypeScript estricto
npx tsc --noEmit
```

*Criterio de Invalidación*:
- Si el popover no utiliza posicionamiento `absolute bottom-full`.
- Si el atajo `F4` o `Escape` no opera de forma bidireccional.
- Si algún test de `posGlobalDiscount.test.tsx` o `posCartEditableRow.test.tsx` falla.

---

## Verified Claims

- Botón anclado `btn-descuento-global-f4` ubicado en el footer de totales -> Verificado en `POSMultivendorCart.tsx:446` -> PASS.
- Popover selector flotante `absolute bottom-full` con cero CLS -> Verificado en `POSMultivendorCart.tsx:479` -> PASS.
- Preservación del 85% de espacio vertical para lista de productos -> Verificado en `POSMultivendorCart.tsx:265` -> PASS.
- Alternancia de modos `%` y `$` con presets rápidos funcionales -> Verificado en `POSMultivendorCart.tsx:501-610` y test Casos 6-8 -> PASS.
- Cierre con `Escape` y conmutación con `F4` -> Verificado en `POSMultivendorCart.tsx:128-133` y test Caso 5 -> PASS.
- Fila de desglose con badge y descarte en 1 clic (`btn-quick-remove-discount`) -> Verificado en `POSMultivendorCart.tsx:671-700` y test Caso 14 -> PASS.
- Recálculo sub-10ms en Zustand con 50 productos en memoria -> Verificado en test Casos 18-19 -> PASS.
- 0 errores TypeScript (`tsc --noEmit`) -> Verificado con salida 0 -> PASS.

---

## Adversarial Challenge & Stress Test Results

| Escenario Adversario | Comportamiento Esperado | Comportamiento Observado | Resultado |
|---|---|---|---|
| Ingreso de descuento COP mayor al subtotal ($999.999 sobre $70.500) | Clamping al subtotal exacto, total = $0 COP | `Math.min(subtotal, numVal)` acota el valor; test Caso 12 pasa limpiamente | PASS |
| Ingreso de porcentaje negativo o mayor al 100% | Descuento se acota entre 0% y 100% | `handleCustomValueChange` fuerza `Math.max(0, ...)` y `Math.min(100, ...)` | PASS |
| Apertura y cierre repetido del popover en pantalla | 0 CLS, la lista de productos no salta ni cambia de altura | Popover flota de forma `absolute` por fuera del flujo del footer | PASS |
| Carrito con 0 productos al presionar F4 | No abrir popover ni disparar errores | Condición `items.length > 0` bloquea la acción; botón deshabilitado | PASS |
| Descuento por línea simultáneo con descuento global | Descuento global se aplica sobre `subtotalNeto` (evita doble beneficio) | `obtenerTotalesCart` calcula `descuentoGlobalMonto` sobre `subtotalNeto` | PASS |
