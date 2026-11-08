# Handoff Report: Milestone M1 Adversarial Challenge

**Agent**: `m1_challenger_2`  
**Role**: Empirical Challenger (critic, specialist)  
**Parent**: `ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7`  
**Date**: 2026-11-07T19:14:00Z  
**Verdict**: **APPROVE**  

---

## 1. Observation

### 1.1 Direct Source Code Observations

1. **COP Integer Rounding & Line Math**:
   - **File**: `src/services/posService.ts:17-44`
   - **Implementation**:
     ```ts
     const precio = Math.round(Number(precioLista) || 0);
     const desc = Number(descuentoPct) || 0;
     const cant = Number(cantidad) || 0;
     const precioFinal = Math.round(precio * (1 - desc / 100));
     const totalLinea = Math.round(cant * precioFinal);
     let baseGravableLinea = totalLinea;
     let cuotaIvaLinea = 0;
     if (tarifaIva > 0) {
       if (ivaIncluido) {
         baseGravableLinea = Math.round(totalLinea / (1 + tarifaIva / 100));
         cuotaIvaLinea = totalLinea - baseGravableLinea;
       } ...
     }
     ```
   - **Observation**: `Math.round` is applied at every stage in COP. When `ivaIncluido` is `true`, `cuotaIvaLinea` is computed by exact residual subtraction (`totalLinea - baseGravableLinea`), mathematically guaranteeing `baseGravableLinea + cuotaIvaLinea === totalLinea` with zero rounding drift or fractional cents.

2. **Derived Product Cost Proportions**:
   - **File**: `src/services/posService.ts:88-92`
   - **Implementation**:
     ```ts
     export function calcularCostoProductoDerivado(costoKiloMP: number, gramosContenido: number = 500): number {
       const costoKilo = Math.round(Number(costoKiloMP) || 0);
       const factor = (Number(gramosContenido) || 500) / 1000;
       return Math.round(costoKilo * factor);
     }
     ```
   - **Observation**: Strictly rounds derived costs to COP integers.

3. **Quantity Decrement & Edge Input Handling**:
   - **File**: `src/views/pos/components/LineaVentaRow.tsx:117-140`
   - **Implementation**:
     ```tsx
     const handleQtyDelta = (delta: number) => {
       const nuevaCantidad = Number(linea.cantidad) + delta;
       if (nuevaCantidad <= 0) {
         onRemove(linea.productoId);
       } else {
         onUpdateCantidad(linea.productoId, nuevaCantidad);
       }
     };

     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const val = parseFloat(e.target.value);
       if (!isNaN(val) && val > 0) {
         onUpdateCantidad(linea.productoId, val);
       }
     };

     const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
       const val = parseFloat(e.target.value);
       if (isNaN(val) || val <= 0) {
         onRemove(linea.productoId);
       } else {
         onUpdateCantidad(linea.productoId, val);
       }
     };
     ```
   - **Store/Hook Layer Defense (`src/hooks/usePOSCart.ts:114-119`)**:
     ```ts
     const actualizarCantidad = (productoId: string, cantidad: number) => {
       if (cantidad <= 0) {
         removerProducto(productoId);
         return;
       }
     ```
   - **Observation**: Decrementing from quantity 1 or any quantity `<= 1` yields `<= 0`, triggering `onRemove`. Direct input blur on empty string, `0`, `NaN`, or negative numbers immediately triggers `onRemove`. If bypassed programmatically, `usePOSCart.actualizarCantidad` intercepts any `cantidad <= 0` and removes the item.

4. **Comanda / Mostrador Mode Switching**:
   - **File**: `src/views/pos/components/CartPanel.tsx:764-876`
   - **Implementation**:
     - When `isMostradorAuto` (`isAsesorMostrador: true`):
       - Renders `data-testid="btn-emitir-preventa-mostrador"` with label `EMITIR PREVENTA / COMANDA` and shortcut badge `(F6)`.
       - Cashier action `data-testid="btn-cobrar"` (`⚡ Vender / Cobrar`) is completely omitted from the DOM.
       - PaymentPanel drawer is suppressed; keyboard shortcut `F2` is intercepted and blocked (lines 155-158).
     - When `isMostradorAuto` (`isAsesorMostrador: false`):
       - Renders primary cashier action `data-testid="btn-cobrar"` displaying `⚡ Vender / Cobrar` and `$totales.totalFinal`.
       - Renders secondary action button `Guardar (En Espera F6)` (`aria-label="Poner pedido actual en espera (Atajo F6)"`).
       - `data-testid="btn-emitir-preventa-mostrador"` is completely omitted from the DOM.

### 1.2 Verbatim Test Execution Logs

**Test Command 1 (Targeted Challenge Suites)**:
```powershell
npx vitest run src/tests/posPricingAndTaxCop.test.ts src/tests/posParkedSalesFlow.test.tsx src/tests/asesorMostradorSinCobro.test.tsx src/tests/m1Challenger2Stress.test.tsx
```
**Output**:
```text
 RUN  v2.1.9 C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia

 ✓ src/tests/posPricingAndTaxCop.test.ts (10 tests) 9ms
 ✓ src/tests/posParkedSalesFlow.test.tsx (4 tests) 995ms
   ✓ Flujo de Ventas en Espera (Parked Orders & Multi-Client) > debe permitir solicitar suspender la venta actual e iniciar una nueva venta limpia 743ms
 ✓ src/tests/m1Challenger2Stress.test.tsx (11 tests) 1568ms
   ✓ M1 Challenger 2: Empirical Stress Test Suite > 3. Comanda / Mostrador Mode Switching Toggling & Shortcuts > renders "⚡ Vender / Cobrar" and "Guardar (En Espera F6)" in Cashier Mode 709ms
 ✓ src/tests/asesorMostradorSinCobro.test.tsx (2 tests) 369ms

 Test Files  4 passed (4)
      Tests  27 passed (27)
   Start at  14:11:39
   Duration  19.54s (transform 3.39s, setup 3.33s, collect 8.31s, tests 2.94s, environment 25.13s, prepare 2.28s)
```

**Test Command 2 (Milestone M1 Full Suite)**:
```powershell
npx vitest run src/tests/posCartPanelErgonomics.test.tsx src/tests/posCartRowErgonomics.test.tsx src/tests/posCart12ItemsScroll.test.tsx src/tests/posCartRedesignAndCashierMode.test.tsx src/tests/usePOSCart.test.ts
```
**Output**:
```text
 Test Files  5 passed (5)
      Tests  47 passed (47)
   Start at  14:12:12
   Duration  30.05s
```

**TypeScript Verification**:
```powershell
npx tsc --noEmit
```
**Output**: Exit code `0`, 0 compiler errors.

---

## 2. Logic Chain

1. **Precision Chain**:
   - Observation 1.1 shows `posService.ts` executes `Math.round` on prices, line totals, and bases, calculating IVA by subtraction (`totalLinea - baseGravableLinea`).
   - In `m1Challenger2Stress.test.tsx`, an empirical stress test evaluated 100 randomly varied weighted lines with fractional weights (e.g., 0.005, 0.123, 0.333, 1.345, 2.718, 3.1415 kg) and irregular prices (13789, 21500, 28500, 33333, 52333, 99999).
   - In all 100 lines and aggregated totals, 100% of outputs satisfied `Number.isInteger() === true`. Zero fractional cents were generated.
   - The invariant `subtotalBaseGravable + totalIva === totalFinal` held in every single case.

2. **Edge Quantity Chain**:
   - Observation 1.1 reveals dual-guard protection: UI level (`handleQtyDelta` and `handleInputBlur` in `LineaVentaRow.tsx`) and hook level (`actualizarCantidad` in `usePOSCart.ts`).
   - Stress testing verified:
     - Item at quantity 1 -> click decrement -> `1 - 1 = 0 <= 0` -> triggers `onRemove`.
     - Item at fractional quantity 0.65 kg -> click decrement -> `0.65 - 1 = -0.35 <= 0` -> triggers `onRemove`.
     - Direct input blurred with `""` (`NaN`), `"0"`, or `"-4"` -> triggers `onRemove`.
     - Hook call `actualizarCantidad(id, 0)` or `actualizarCantidad(id, -1.5)` -> triggers `removerProducto(id)`.
   - Result: Invalid, zero, or negative quantities cannot persist in cart state.

3. **Mode Switching Chain**:
   - Observation 1.1 establishes conditional rendering based on `isMostradorAuto`:
     - When `isAsesorMostrador: true`, renders `btn-emitir-preventa-mostrador` and suppresses `btn-cobrar` and payment drawers.
     - When `isAsesorMostrador: false`, renders `btn-cobrar` ("⚡ Vender / Cobrar") and secondary "Guardar (En Espera F6)".
   - Dynamic toggling in `m1Challenger2Stress.test.tsx` confirmed seamless transition back and forth within the same component lifecycle without lingering state or duplicate event listeners.
   - Result: Separation of concerns between mostrador (preventa/comanda) and caja (cobro directo) is strictly enforced.

---

## 3. Adversarial Challenge Assessment

### Challenge Summary
**Overall Risk Assessment**: **LOW**

### Challenges Evaluated

#### Challenge 1: Rounding Accumulation Drift in High-Volume Orders
- **Assumption**: Multiple decimal weights could accumulate fractional cents or cause discrepancy between `subtotalBaseGravable + totalIva` and `totalFinal`.
- **Attack Scenario**: 100-line order with prime prices and 3-decimal weights.
- **Result**: PASSED. Rounding by subtraction guarantees zero drift.
- **Blast Radius**: None.

#### Challenge 2: Cart Ghost Items via Zero or Negative Quantity Bypass
- **Assumption**: User clearing input or typing negative numbers could bypass stepper logic and leave items with 0 or negative quantities.
- **Attack Scenario**: Direct input editing and blur with `""`, `"0"`, `"-4"`, and hook calls with `0` and `-1.5`.
- **Result**: PASSED. Both UI and store purge the item immediately.
- **Blast Radius**: None.

#### Challenge 3: Unauthorized Cobro from Mostrador Mode via Keyboard Shortcuts
- **Assumption**: A mostrador seller pressing `F2` or `Enter` might open the cashier payment drawer.
- **Attack Scenario**: Simulate `F2` keydown while in `isAsesorMostrador: true`.
- **Result**: PASSED. `CartPanel.tsx:155` checks `!isMostradorAuto` before handling `F2`, completely neutralizing shortcut activation.
- **Blast Radius**: None.

### Stress Test Results Table

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| 100 weighted lines with decimal quantities | Strictly integer values for total, base, and IVA; `base + iva === total` | Strictly integer, invariant holds on all 100 lines and order totals | PASS |
| Irregular gram content (1g, 7g, 333g, 999g) | Cost derived strictly rounded to integer COP | Strict integers via `Math.round(cost * g / 1000)` | PASS |
| Decrement item with qty = 1 | Calls `onRemove`, does not set qty 0 | `onRemove` called immediately | PASS |
| Decrement item with fractional qty = 0.65 kg | Calls `onRemove`, does not set negative qty | `onRemove` called immediately | PASS |
| Blur quantity input with "", "0", or "-4" | Calls `onRemove` | `onRemove` called immediately | PASS |
| Call `usePOSCart.actualizarCantidad(id, 0)` | Purges item from store | Cart lines length drops to 0 | PASS |
| Call `usePOSCart.actualizarCantidad(id, -1.5)` | Purges item from store | Cart lines length drops to 0 | PASS |
| Mount CartPanel with `isAsesorMostrador: true` | Shows "EMITIR PREVENTA / COMANDA (F6)", hides "Vender / Cobrar" | Correct button rendered, cashier button absent | PASS |
| Mount CartPanel with `isAsesorMostrador: false` | Shows "⚡ Vender / Cobrar" and "Guardar (En Espera F6)" | Correct buttons rendered, mostrador button absent | PASS |
| Dynamic mode toggle (`false` -> `true` -> `false`) | Toggles cleanly without state corruption | Toggles instantly without errors | PASS |
| Press F2 in Mostrador Mode | Payment drawer does NOT open | Payment drawer backdrop absent | PASS |

---

## 4. Caveats

- **Hardware Serial Scales**: Physical RS-232 scale transmission was simulated through the standard `onWeightRead` callback and mock weight handlers rather than a physical USB COM port.
- **Non-destructive Challenge**: Implementation files were inspected and empirically challenged without modifying production code. The adversarial test suite was saved to `src/tests/m1Challenger2Stress.test.tsx`.

---

## 5. Conclusion & Verdict

**Verdict**: **APPROVE**

Milestone M1 satisfies all mathematical, edge-case, and mode-switching requirements:
1. COP integer rounding is strict, robust, and mathematically sound across all fractional weights.
2. Quantity decrements and direct inputs prevent zero or negative states with dual-layer defense.
3. Comanda/Mostrador mode toggles cleanly and securely separates counter preparation from cashiering.
4. All test suites pass 100% (27/27 challenge tests, 47/47 target tests) with 0 TypeScript compilation errors.

---

## 6. Verification Method

To independently reproduce this verification:

```powershell
# 1. Execute the 4 mathematical, parked flow, mostrador, and stress suites
npx vitest run src/tests/posPricingAndTaxCop.test.ts src/tests/posParkedSalesFlow.test.tsx src/tests/asesorMostradorSinCobro.test.tsx src/tests/m1Challenger2Stress.test.tsx

# 2. Execute the 5 target M1 ergonomics suites
npx vitest run src/tests/posCartPanelErgonomics.test.tsx src/tests/posCartRowErgonomics.test.tsx src/tests/posCart12ItemsScroll.test.tsx src/tests/posCartRedesignAndCashierMode.test.tsx src/tests/usePOSCart.test.ts

# 3. Verify TypeScript compilation
npx tsc --noEmit
```

**Invalidation Conditions**:
- Any non-integer value produced in `totalLinea`, `baseGravableLinea`, `cuotaIvaLinea`, or `totalFinal`.
- Discrepancy where `baseGravableLinea + cuotaIvaLinea !== totalLinea`.
- Retaining an item in cart with quantity `<= 0`.
- Rendering `btn-cobrar` while `isAsesorMostrador: true`.
- Opening the payment drawer via F2 while `isAsesorMostrador: true`.
