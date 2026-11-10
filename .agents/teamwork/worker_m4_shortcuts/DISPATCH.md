## 2026-11-09T12:36:30Z
Implement Tarea 4 (Hito M4): Interceptor Global de Atajos de Teclado POS (F8, Ctrl+K, F6, F4, F2, F9, Esc) under SDD v3.0 / TDD.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory files to read before doing anything:
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_explorer_tdd\handoff.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_explorer_hook\handoff.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_explorer_integration\handoff.md`

Files you own exclusively for write operations:
- `src/hooks/usePOSKeyboardShortcuts.ts`
- `src/views/pos/components/POSMultivendorView.tsx`
- `src/views/pos/components/ManualWeightModal.tsx` (only for window Escape listener fix)
- `src/tests/posKeyboardShortcuts.test.tsx`
- State metadata in `.agents/teamwork/worker_m4_shortcuts/`

Execution steps (TDD Mandatory):
1. RED Phase:
   - Create comprehensive test suite in `src/tests/posKeyboardShortcuts.test.tsx` based on the 10 blocks in `m4_explorer_tdd/handoff.md`.
   - Run `npx vitest run src/tests/posKeyboardShortcuts.test.tsx` and observe clean, genuine failure on missing features (Ctrl+K, semantic handlers, view wiring).
2. GREEN Phase:
   - Update `src/hooks/usePOSKeyboardShortcuts.ts` following the blueprint in `m4_explorer_hook/handoff.md`:
     * Add `Ctrl+K` / `Cmd+K` cross-platform support.
     * Add semantic handlers (`onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`, `onEscape`) while preserving ALL legacy handlers (`onF1Help`, `onF2Cash`, etc.) so `src/tests/commercialFlowSupermarket.test.tsx` stays 100% green.
     * Register listener with `{ passive: false }` to ensure `e.preventDefault()` suppresses browser hotkey collisions.
     * Support `isModalOpen?: boolean` to suspend comanda shortcuts while keeping `Escape` active.
     * Support `customerSelectorKey?: 'F1' | 'F3' | 'F6'`.
     * Intercept function keys (`F1`–`F12`), `Ctrl+K`, and `Escape` even when focus is in an `<input>`, `<textarea>`, or contenteditable, while leaving normal typing and arrow keys unintercepted.
   - Wire `usePOSKeyboardShortcuts` into `src/views/pos/components/POSMultivendorView.tsx` per `m4_explorer_integration/handoff.md`:
     * F8: focus search input (`#pos-light-product-search-input` / `[data-testid="pos-barcode-input"]`).
     * Ctrl+K / Cmd+K: toggle view mode / comanda queue.
     * F6: trigger customer selector modal (`onOpenClientModal`).
     * F4: trigger global discount popover (`items.length > 0`).
     * F2: trigger save draft / emit comanda.
     * F9: trigger cashier checkout (`onCobrarCaja`).
     * Esc: close active modals (`scaleModalProduct`, discount popover) without clearing cart.
   - Update `ManualWeightModal.tsx` to ensure `Escape` closes the modal reliably regardless of where DOM focus is inside the dialog.
   - Run `npx vitest run src/tests/posKeyboardShortcuts.test.tsx` and achieve 100% green.
3. VERIFY Phase:
   - Run `npx tsc --noEmit` and confirm 0 type errors (exit code 0).
   - Run regression test suite:
     `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`
     Confirm 100% pass across all suites.
4. Document all work in `.agents/teamwork/worker_m4_shortcuts/handoff.md` with:
   - Observation (files changed, tests executed, outputs verbatim)
   - Logic Chain (why implementation is correct and complete)
   - Caveats (any non-blocking advisory notes)
   - Conclusion (final status)
   - Verification Method (exact commands to replicate)
5. Send completion message to parent upon finishing.
