# BRIEFING — 2026-11-09T12:56:00Z

## Mission
Implement Tarea 4 (Hito M4): Interceptor Global de Atajos de Teclado POS (F8, Ctrl+K, F6, F4, F2, F9, Esc) under SDD v3.0 / TDD.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\
- Original parent: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Milestone: Hito M4 - Tarea 4 (Interceptor Global de Atajos POS)

## 🔒 Key Constraints
- DO NOT CHEAT. All implementations must be genuine.
- Zero regression on existing commercial flows (`commercialFlowSupermarket.test.tsx`, `posManualWeightModal.test.tsx`, `posGlobalDiscount.test.tsx`, `posCartEditableRow.test.tsx`, `posTouchErgonomics.test.tsx`, `posMultivendorLightSaaS.test.tsx`).
- Type safety: `tsc --noEmit` must pass with 0 errors.
- Strict TDD: RED phase first (write comprehensive tests, run and observe genuine failure), then GREEN phase (implement hook and view wiring, pass tests), then VERIFY.
- Keep backwards compatibility in `usePOSKeyboardShortcuts.ts` for all legacy handlers (`onF1Help`, `onF2Cash`, etc.).
- Register window keydown with `{ passive: false }` for collision prevention.
- Intercept function keys (`F1`–`F12`), `Ctrl+K`/`Cmd+K`, and `Escape` even when focused inside inputs, textareas, contenteditable elements, while allowing standard typing.
- Suspend comanda shortcuts when `isModalOpen` is true, except `Escape`.

## Current Parent
- Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Updated: 2026-11-09T12:56:00Z

## Task Summary
- **What to build**: Full implementation and wiring of POS keyboard shortcuts (F8 focus search, Ctrl+K/Cmd+K toggle multivendor view, F6 customer selector, F4 discount popover, F2 save draft/emit comanda, F9 cashier checkout, Esc close modals without cart discard) in `usePOSKeyboardShortcuts.ts`, `POSMultivendorView.tsx`, and `ManualWeightModal.tsx`, covered by `posKeyboardShortcuts.test.tsx`.
- **Success criteria**: 35 tests passing in `src/tests/posKeyboardShortcuts.test.tsx`, 126/126 passed across all 7 regression suites, 0 errors in `tsc --noEmit`.
- **Interface contracts**: PROJECT.md and m4_explorer handoffs.
- **Code layout**: `src/hooks/usePOSKeyboardShortcuts.ts`, `src/views/pos/components/POSMultivendorView.tsx`, `src/views/pos/components/ManualWeightModal.tsx`, `src/tests/posKeyboardShortcuts.test.tsx`.

## Key Decisions Made
- Extended `usePOSKeyboardShortcuts.ts` with polymorphic semantic handlers (`onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`, `onEscape`) while preserving 100% of legacy handlers (`onF1Help`, `onF2Cash`, `onF6Search`, etc.) for zero regression on SPEC-047.
- Added `{ passive: false }` to `window.addEventListener('keydown', ...)` ensuring browser shortcut interception (`preventDefault()`) works consistently.
- Added cross-platform modifier detection `(e.ctrlKey || e.metaKey) && !e.altKey` with key 'k' / 'K' / code 'KeyK' for `Ctrl+K` (Windows/Linux) and `Cmd+K` (macOS).
- Supported `isModalOpen?: boolean` option: when true, suspends command shortcuts (`F2`, `F4`, `F6`, `F8`, `F9`, `Ctrl+K`) while keeping `Escape` active to dismiss dialogs.
- Bound `Escape` at window level in `ManualWeightModal.tsx` while removing redundant input handler call to prevent duplicate `onClose` calls.
- Wired shortcuts in `POSMultivendorView.tsx` with hierarchical `Escape` handler (1. close scale modal, 2. custom escape callback, 3. clear search/barcode, 4. blur element; NEVER clear cart).

## Change Tracker
- **Files modified**:
  - `src/hooks/usePOSKeyboardShortcuts.ts`: Complete semantic upgrade, cross-platform Ctrl+K/Cmd+K, modal awareness, input command penetration.
  - `src/views/pos/components/POSMultivendorView.tsx`: Integrated `usePOSKeyboardShortcuts`, forwarded optional props, hierarchical Escape.
  - `src/views/pos/components/ManualWeightModal.tsx`: Added window-level Escape listener for reliable dismissal regardless of active DOM focus.
  - `src/tests/posKeyboardShortcuts.test.tsx`: 35 comprehensive TDD tests across 10 functional blocks.
- **Build status**: PASS (`tsc --noEmit` exit code 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (126/126 tests green across 7 suites in 26.61s)
- **Lint status**: 0 TypeScript errors
- **Tests added/modified**: 35 new tests in `src/tests/posKeyboardShortcuts.test.tsx`

## Loaded Skills
- None requested in dispatch.

## Artifact Index
- `.agents/teamwork/worker_m4_shortcuts/DISPATCH.md` — Dispatch instructions
- `.agents/teamwork/worker_m4_shortcuts/BRIEFING.md` — Working memory
- `.agents/teamwork/worker_m4_shortcuts/progress.md` — Liveness heartbeat
- `.agents/teamwork/worker_m4_shortcuts/handoff.md` — Handoff report
