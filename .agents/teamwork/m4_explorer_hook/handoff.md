# Handoff Report: Architectural Specification for `usePOSKeyboardShortcuts.ts` (Hito M4 - Tarea 4)

## 1. Observation

Direct observations from the codebase, project documentation, specifications, and test suites:

1. **Existing Hook Implementation (`src/hooks/usePOSKeyboardShortcuts.ts`)**:
   - Lines 6–24:
     ```typescript
     export interface POSShortcutHandlers {
       onF1Help?: () => void;
       onF2Cash?: () => void;
       onF3Card?: () => void;
       onF4Transfer?: () => void;
       onF5Refresh?: () => void;
       onF6Search?: () => void;
       onF8Void?: () => void;
       onF9SplitPayment?: () => void;
       onF12Checkout?: () => void;
       onEscape?: () => void;
       onEnter?: () => void;
       onArrowUp?: () => void;
       onArrowDown?: () => void;
     }

     export interface POSShortcutOptions {
       isEnabled?: boolean;
     }
     ```
   - Lines 35–40: Uses `useRef<POSShortcutHandlers>(handlers)` to keep the reference updated across renders without re-subscribing `handleKeyDown` on every render.
   - Lines 41–51: Adds `handleKeyDown` directly to `window.addEventListener('keydown', handleKeyDown)` without specifying `{ passive: false }`. Inspects `target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable`.
   - Lines 54–115: Function keys `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F8`, `F9`, `F12`, and `Escape` call `event.preventDefault()` regardless of whether `isInput` is true.
   - Lines 117–138: If `isInput` is true, returns early before handling `ArrowUp`, `ArrowDown`, `Enter`.
   - Lines 141–144: Cleanup removes listener on unmount or `isEnabled` change.

2. **Active Test Suite (`src/tests/commercialFlowSupermarket.test.tsx`)**:
   - Lines 13–129: Tests `TASK-047-01: usePOSKeyboardShortcuts Hook`.
   - Line 38: Tests that `F1`, `F2`, `F5`, and `F12` prevent default browser action (`expect(event.defaultPrevented).toBe(true)`).
   - Line 90–108: Explicitly requires that `Enter` inside an input is NOT intercepted, but `F1`–`F12` continue operating even if the cursor is inside an `<input>`.
   - Tool execution command: `npx vitest run src/tests/commercialFlowSupermarket.test.tsx`
   - Result: 20 passed (20 tests passed in 1.62s).

3. **SPEC-057 Specification (`specs/spec_057_pos_integral_refactor_frontend.md`)**:
   - Section 2.5 (Component Architecture): Layer 3 Hardware Bridge defines `Hotkeys: usePOSHotkeys (F1, F2, F4, F6, F7, F8, F9, Ctrl+K)`.
   - Section 4 Phase 4 Item 3 (Mapeo Estricto de Atajos de Teclado):
     - `F8`: Enfocar buscador de catálogo.
     - `Ctrl+K`: Búsqueda rápida multi-criterio.
     - `F6`: Emitir Preventa / Comanda de Mostrador.
     - `F2`: Cobro Directo en Terminal (Apertura de Drawer).
     - `F9`: Alternar a Modo Caja Única (Cola en Vivo).
     - `Esc`: Cerrar modales o limpiar selección.

4. **UI Button Bindings in Views**:
   - `src/views/pos/components/POSMultivendorLightHeader.tsx`:
     - Line 60–70: Contains an isolated `handleKeyDown` for `F8` focusing `#pos-light-product-search-input`.
     - Line 154: Input `#pos-light-product-search-input` has placeholder `"Buscar productos (F8)..."`.
     - Line 178: Button `#btn-header-seleccionar-cliente` for customer selection (`onOpenClientModal`).
     - Line 214–230: Button `#btn-toggle-modo-cajero` displays badge `<kbd>F9</kbd>` for alternating between Mostrador and Caja Única.
   - `src/views/pos/components/POSMultivendorCart.tsx`:
     - Line 126–137: Isolated `handleKeyDown` for `F4` (toggle discount popover) and `Escape` (close discount popover).
     - Line 446: Button `#btn-descuento-global-f4` labelled `+ Descuento (F4)`.
     - Line 721: Giant primary action button `#btn-emitir-preventa-f6` labelled `EMITIR COMANDA (F6)`.
     - Line 741: Secondary action button `#btn-cart-cobrar-caja` labelled `Cobrar en Esta Terminal (F2)`.
   - `src/views/pos/components/ManualWeightModal.tsx` & `SupervisorPinModal.tsx`:
     - Both modales support `Escape` to close (`onClose()`).
     - `SupervisorPinModal.tsx` line 147–149 catches `Escape` via `window.addEventListener('keydown')`.

5. **Peer Explorer Synchronization**:
   - `.agents/teamwork/m4_explorer_integration/DISPATCH.md`: Investigates integrating the hook into `POSMultivendorView.tsx`, identifying DOM refs (`searchInputRef`, `btn-header-seleccionar-cliente`), and managing `Escape` when `ManualWeightModal` is active.
   - `.agents/teamwork/m4_explorer_tdd/DISPATCH.md`: Investigates TDD test scenarios for `src/tests/posKeyboardShortcuts.test.tsx` verifying F8, Ctrl+K, F6, F4, F2, F9, Esc, input isolation, and cleanup.

---

## 2. Logic Chain

1. **Logical Synthesis of Handlers & Backward Compatibility**:
   - *Premise A*: `commercialFlowSupermarket.test.tsx` directly imports `usePOSKeyboardShortcuts` and tests 13 legacy handlers (`onF1Help`, `onF2Cash`, `onF3Card`, `onF4Transfer`, `onF5Refresh`, `onF6Search`, `onF8Void`, `onF9SplitPayment`, `onF12Checkout`, `onEscape`, `onEnter`, `onArrowUp`, `onArrowDown`).
   - *Premise B*: SPEC-057 (Hito M4) requires semantic handlers for Mostrador POS: `onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`, `onEscape`.
   - *Inference 1*: `POSShortcutHandlers` must be a polymorphic union interface where both semantic handlers and legacy handlers are supported.
   - *Inference 2*: When a function key or shortcut is pressed, the hook checks for the semantic handler first; if not provided, it falls back to the legacy handler:
     - `F8` or `Ctrl+K`/`Cmd+K` $\rightarrow$ `onFocusSearch` (fallback: `onF8Void` for F8).
     - `F9` $\rightarrow$ `onToggleView` (fallback: `onF9SplitPayment` or `onCheckout`).
     - `F6` $\rightarrow$ `onSaveDraft` (fallback: `onF6Search` or `onOpenCustomerSelector`).
     - `F4` $\rightarrow$ `onOpenDiscountModal` (fallback: `onF4Transfer`).
     - `F2` $\rightarrow$ `onCheckout` (fallback: `onF2Cash` or `onSaveDraft`).
     - `F3` (or `F1`) $\rightarrow$ `onOpenCustomerSelector` (fallback: `onF3Card` or `onF1Help`).
     - `Escape` $\rightarrow$ `onEscape`.
   - *Result*: Zero regressions for existing SPEC-047 tests while delivering 100% of SPEC-057 requirements.

2. **Event Listener Strategy & Passive Options**:
   - *Premise A*: Web browsers natively bind several function keys and shortcuts:
     - `F1`: Windows Help / Browser Help.
     - `F3`: Native Find Bar ("Find on Page").
     - `F5`: Full page reload.
     - `F6`: Cycles focus to address bar.
     - `F9`: Firefox Reader Mode toggle.
     - `Ctrl+K` / `Cmd+K`: In Chrome/Edge/Firefox, moves cursor to browser address bar with `?` search engine query.
     - `F12`: Opens Developer Tools.
   - *Premise B*: If a listener is registered as `passive: true` or default in passive-encouraging contexts, calling `event.preventDefault()` causes a runtime browser warning and fails to cancel the browser action.
   - *Inference 3*: Registering the listener with `window.addEventListener('keydown', handleKeyDown, { passive: false })` guarantees that `event.preventDefault()` successfully intercepts and blocks native browser collisions.
   - *Inference 4*: Using `useRef<POSShortcutHandlers>(handlers)` ensures the event listener is attached once and only re-registers when options (`isEnabled`, `isModalOpen`, `customerSelectorKey`) change, preventing event listener thrashing.
   - *Inference 5*: The cleanup function `return () => window.removeEventListener('keydown', handleKeyDown)` ensures complete teardown on component unmount with zero memory leaks.

3. **Cross-Platform Modifier & Key Normalization**:
   - *Premise A*: macOS users rely on `Command` (`e.metaKey`), whereas Windows and Linux users rely on `Control` (`e.ctrlKey`).
   - *Premise B*: On Spanish and European keyboards, the `AltGr` key generates both `ctrlKey: true` and `altKey: true`.
   - *Inference 6*: To support `Ctrl+K` and `Cmd+K` reliably across platforms without false positives from `AltGr` combinations:
     `const isModifierK = (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK');`
   - *Inference 7*: Key name normalization handles legacy browser variations (e.g., `e.key === 'Esc' ? 'Escape' : e.key`).

4. **Input Conflict Resolution & Modal Context Awareness**:
   - *Premise A*: When editing quantities or prices in `POSMultivendorCart.tsx` or customer names in search, the user presses `Enter`, `ArrowUp`, `ArrowDown`, or alphanumeric keys.
   - *Premise B*: If a cashier is typing in a search bar or editing a row, pressing `F8`, `Ctrl+K`, `F6`, `F4`, `F2`, `F9`, or `Escape` MUST still trigger the POS command.
   - *Inference 8*: Distinguish between command shortcuts and input typing:
     - When `isInput` is true:
       - Function keys (`F1`–`F12`), `Ctrl+K`/`Cmd+K`, and `Escape` call `event.preventDefault()` and execute their handlers.
       - Text editing and cursor navigation (`Enter`, `ArrowUp`, `ArrowDown`, `Tab`, alphanumeric keys) are bypassed (`return;`) so the input receives native keystrokes.
     - When `isInput` is false:
       - `ArrowUp`, `ArrowDown`, `Enter` trigger `onArrowUp`, `onArrowDown`, `onEnter`.
   - *Inference 9*: In `POSShortcutOptions`, introduce `isModalOpen?: boolean`. When `isModalOpen === true`:
     - Global POS comanda actions (`F2`, `F4`, `F6`, `F8`, `F9`, `Ctrl+K`) are suspended to prevent accidental checkouts or view switches during modal workflows (e.g. typing a PIN or entering a weight).
     - `Escape` remains fully operational to close the active modal.
   - *Inference 10*: `e.repeat` deduplication on single-action comanda triggers (`F2`, `F4`, `F6`, `F9`, `Ctrl+K`) prevents duplicate comanda emissions or multiple checkouts if a cashier holds down a key.

---

## 3. Caveats

1. **Operating System Privileged Interceptions**:
   - Certain OS combinations (such as `Alt+F4` on Windows to close application windows, or `Cmd+Q` on macOS) cannot and should not be intercepted by web browser JavaScript for security reasons.
   - Browser DevTools shortcuts like `Ctrl+Shift+I` remain accessible to developers even if `F12` is prevented.
2. **Laptop Multimedia Keys (Fn Lock)**:
   - On some laptops without hardware Fn-Lock active, function keys may emit hardware multimedia events (`VolumeUp`, `BrightnessDown`) rather than `F1`–`F12`.
   - Providing `Ctrl+K` / `Cmd+K` as an alternative to `F8` mitigates this ergonomic constraint for search.
3. **Modal Focus Trap**:
   - When external custom modales create their own key listeners, having `isModalOpen: true` in `usePOSKeyboardShortcuts` avoids dual execution of shortcuts.

---

## 4. Conclusion

The definitive architecture for `src/hooks/usePOSKeyboardShortcuts.ts` is fully specified as follows:

### 4.1. TypeScript Interface Contracts

```typescript
// src/hooks/usePOSKeyboardShortcuts.ts

export interface POSShortcutHandlers {
  // === SPEC-057: Mostrador / Multivendor POS (Hito M4) ===
  /** F8 o Ctrl+K / Cmd+K: Foco inmediato en el input de búsqueda/catálogo */
  onFocusSearch?: () => void;

  /** F9: Alternar entre modo Mostrador (preventas) y modo Caja Única */
  onToggleView?: () => void;

  /** F3 (o tecla configurada): Abrir selector/modal de clientes */
  onOpenCustomerSelector?: () => void;

  /** F4: Abrir popover / modal de descuento global de comanda (+ Descuento) */
  onOpenDiscountModal?: () => void;

  /** F6 / F2: Emitir preventa / comanda de mostrador (guardar borrador) */
  onSaveDraft?: () => void;

  /** F2 / F9: Cobro directo en terminal / liquidación en caja */
  onCheckout?: () => void;

  /** Escape: Cerrar modales activos, popovers o limpiar selección/búsqueda */
  onEscape?: () => void;

  // === Handlers Específicos por Tecla Directa ===
  onCtrlK?: () => void;
  onF1?: () => void;
  onF2?: () => void;
  onF3?: () => void;
  onF4?: () => void;
  onF5?: () => void;
  onF6?: () => void;
  onF7?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onF10?: () => void;
  onF11?: () => void;
  onF12?: () => void;

  // === Retrocompatibilidad SPEC-047 (Supermercado / Terminal Cajero) ===
  onF1Help?: () => void;
  onF2Cash?: () => void;
  onF3Card?: () => void;
  onF4Transfer?: () => void;
  onF5Refresh?: () => void;
  onF6Search?: () => void;
  onF8Void?: () => void;
  onF9SplitPayment?: () => void;
  onF12Checkout?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export interface POSShortcutOptions {
  /** Activar o suspender la interceptación global (default: true) */
  isEnabled?: boolean;

  /**
   * Indica si un modal se encuentra abierto (e.g. ManualWeightModal, SupervisorPinModal).
   * Cuando es true:
   * - Se suprimen los atajos de acción comanda/navegación (F2, F4, F6, F8, F9, Ctrl+K).
   * - Se mantiene activo Escape para cerrar el modal.
   */
  isModalOpen?: boolean;

  /** Tecla asignada para abrir el selector de clientes (default: 'F3') */
  customerSelectorKey?: 'F1' | 'F3' | 'F6';

  /** Si debe llamar event.stopPropagation() además de preventDefault() (default: true) */
  stopPropagation?: boolean;

  /** Target específico para escuchar eventos (default: window) */
  target?: EventTarget | null;
}
```

### 4.2. Implementation Blueprint

```typescript
import { useEffect, useRef } from 'react';

export function usePOSKeyboardShortcuts(
  handlers: POSShortcutHandlers,
  options: POSShortcutOptions = {}
): void {
  const {
    isEnabled = true,
    isModalOpen = false,
    customerSelectorKey = 'F3',
    stopPropagation = true,
    target,
  } = options;

  const handlersRef = useRef<POSShortcutHandlers>(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!isEnabled) return;

    const eventTarget = target || (typeof window !== 'undefined' ? window : null);
    if (!eventTarget) return;

    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      const h = handlersRef.current;

      const domTarget = e.target as HTMLElement | null;
      const isInput =
        domTarget !== null &&
        typeof domTarget.tagName === 'string' &&
        (domTarget.tagName === 'INPUT' ||
          domTarget.tagName === 'TEXTAREA' ||
          domTarget.tagName === 'SELECT' ||
          domTarget.isContentEditable);

      const key = e.key === 'Esc' ? 'Escape' : e.key;
      const code = e.code || '';

      // Detección multiplataforma Ctrl+K (Windows/Linux) o Cmd+K (macOS)
      const isModifier = (e.ctrlKey || e.metaKey) && !e.altKey;
      const isKeyK = key === 'k' || key === 'K' || code === 'KeyK';
      const isCtrlK = isModifier && isKeyK;

      const consumeEvent = () => {
        if (e.cancelable) {
          e.preventDefault();
        }
        if (stopPropagation && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      };

      // 1. Contexto de Modal Activo: Solo permitir Escape
      if (isModalOpen) {
        if (key === 'Escape') {
          consumeEvent();
          h.onEscape?.();
        }
        return;
      }

      // 2. Escape universal (cierra popovers, cancela selecciones)
      if (key === 'Escape') {
        consumeEvent();
        h.onEscape?.();
        return;
      }

      // 3. Ctrl+K / Cmd+K (búsqueda rápida)
      if (isCtrlK) {
        consumeEvent();
        if (h.onCtrlK) {
          h.onCtrlK();
        } else if (h.onFocusSearch) {
          h.onFocusSearch();
        } else if (h.onToggleView) {
          h.onToggleView();
        }
        return;
      }

      // 4. Teclas de función (F1 - F12)
      const isFuncKey = key.startsWith('F') && key.length <= 3 && !isNaN(Number(key.slice(1)));

      if (isFuncKey) {
        // Evitar auto-repetición en teclas de acción comanda
        if (e.repeat) {
          consumeEvent();
          return;
        }

        switch (key) {
          case 'F1': {
            consumeEvent();
            if (customerSelectorKey === 'F1' && h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF1) {
              h.onF1();
            } else if (h.onF1Help) {
              h.onF1Help();
            } else if (h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            }
            return;
          }

          case 'F2': {
            consumeEvent();
            if (h.onF2) {
              h.onF2();
            } else if (h.onCheckout) {
              h.onCheckout();
            } else if (h.onF2Cash) {
              h.onF2Cash();
            } else if (h.onSaveDraft) {
              h.onSaveDraft();
            }
            return;
          }

          case 'F3': {
            consumeEvent();
            if (customerSelectorKey === 'F3' && h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF3) {
              h.onF3();
            } else if (h.onF3Card) {
              h.onF3Card();
            } else if (h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            }
            return;
          }

          case 'F4': {
            consumeEvent();
            if (h.onF4) {
              h.onF4();
            } else if (h.onOpenDiscountModal) {
              h.onOpenDiscountModal();
            } else if (h.onF4Transfer) {
              h.onF4Transfer();
            }
            return;
          }

          case 'F5': {
            consumeEvent();
            if (h.onF5) {
              h.onF5();
            } else if (h.onF5Refresh) {
              h.onF5Refresh();
            }
            return;
          }

          case 'F6': {
            consumeEvent();
            if (customerSelectorKey === 'F6' && h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF6) {
              h.onF6();
            } else if (h.onSaveDraft) {
              h.onSaveDraft();
            } else if (h.onF6Search) {
              h.onF6Search();
            } else if (h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            }
            return;
          }

          case 'F7': {
            consumeEvent();
            if (h.onF7) {
              h.onF7();
            }
            return;
          }

          case 'F8': {
            consumeEvent();
            if (h.onF8) {
              h.onF8();
            } else if (h.onFocusSearch) {
              h.onFocusSearch();
            } else if (h.onF8Void) {
              h.onF8Void();
            }
            return;
          }

          case 'F9': {
            consumeEvent();
            if (h.onF9) {
              h.onF9();
            } else if (h.onToggleView) {
              h.onToggleView();
            } else if (h.onF9SplitPayment) {
              h.onF9SplitPayment();
            } else if (h.onCheckout) {
              h.onCheckout();
            }
            return;
          }

          case 'F10': {
            consumeEvent();
            if (h.onF10) {
              h.onF10();
            }
            return;
          }

          case 'F11': {
            consumeEvent();
            if (h.onF11) {
              h.onF11();
            }
            return;
          }

          case 'F12': {
            consumeEvent();
            if (h.onF12) {
              h.onF12();
            } else if (h.onF12Checkout) {
              h.onF12Checkout();
            }
            return;
          }

          default:
            break;
        }
      }

      // 5. Navegación fuera de inputs
      if (isInput) {
        return;
      }

      if (key === 'ArrowUp') {
        consumeEvent();
        h.onArrowUp?.();
        return;
      }

      if (key === 'ArrowDown') {
        consumeEvent();
        h.onArrowDown?.();
        return;
      }

      if (key === 'Enter') {
        consumeEvent();
        h.onEnter?.();
        return;
      }
    };

    eventTarget.addEventListener('keydown', handleKeyDown as EventListener, { passive: false });

    return () => {
      eventTarget.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isEnabled, isModalOpen, customerSelectorKey, stopPropagation, target]);
}
```

---

## 5. Verification Method

To independently verify the architecture and its implementation:

1. **Verify Existing Regression Tests**:
   - Command: `npx vitest run src/tests/commercialFlowSupermarket.test.tsx`
   - Condition: All 20 tests must continue passing 100% green with 0 errors.

2. **Verify TypeScript Types**:
   - Command: `npx tsc --noEmit`
   - Condition: 0 type errors across the entire codebase.

3. **Verify New TDD Test Suite (`src/tests/posKeyboardShortcuts.test.tsx`)**:
   - Test Cases to cover:
     - `F8`: Calls `onFocusSearch` and sets `defaultPrevented === true`.
     - `Ctrl+K` (`ctrlKey: true, key: 'k'`): Calls `onFocusSearch` and sets `defaultPrevented === true`.
     - `Cmd+K` (`metaKey: true, key: 'K'`): Calls `onFocusSearch` on macOS.
     - `F9`: Calls `onToggleView` and sets `defaultPrevented === true`.
     - `F4`: Calls `onOpenDiscountModal` and sets `defaultPrevented === true`.
     - `F6`: Calls `onSaveDraft` and sets `defaultPrevented === true`.
     - `F2`: Calls `onCheckout` and sets `defaultPrevented === true`.
     - `F3`: Calls `onOpenCustomerSelector` and sets `defaultPrevented === true`.
     - `Escape`: Calls `onEscape` and sets `defaultPrevented === true`.
     - When focused inside `<input>`: `F8`, `F4`, `F2`, `F6`, `F9`, `Ctrl+K`, `Escape` MUST fire and prevent default. `Enter`, `ArrowUp`, `ArrowDown` MUST NOT fire global callbacks.
     - When `isModalOpen: true`: `F2`, `F4`, `F6`, `F8`, `F9`, `Ctrl+K` MUST be blocked; `Escape` MUST still fire `onEscape`.
     - When `isEnabled: false`: No shortcuts fire.
     - Unmount: Event listener cleanly detached without memory leaks.

4. **Invalidation Conditions**:
   - If `npx vitest run src/tests/commercialFlowSupermarket.test.tsx` fails any test, the backward compatibility layer is violated.
   - If `npx tsc --noEmit` produces errors in consuming components, interface types are violated.
   - If pressing `Ctrl+K` inside an `<input>` fails to fire `onFocusSearch`, input mitigation is violated.
