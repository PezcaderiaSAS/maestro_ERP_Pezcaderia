# BRIEFING — 2026-11-09T12:35:30Z

## Mission
Investigate and design the architectural specification for `usePOSKeyboardShortcuts.ts` (Hito M4 - Tarea 4).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, architectural analysis, synthesis
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_explorer_hook
- Original parent: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Milestone: Hito M4 - Tarea 4 (Interceptor Global de Atajos de Teclado POS)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in production source code
- Strictly write reports/handoffs only in state folder `.agents/teamwork/m4_explorer_hook/`
- Deliver detailed handoff report in `.agents/teamwork/m4_explorer_hook/handoff.md` following Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- Send completion message to parent upon finishing via send_message

## Current Parent
- Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Updated: 2026-11-09T12:26:26Z

## Investigation State
- **Explored paths**:
  - `specs/spec_057_pos_integral_refactor_frontend.md` (SPEC-057 Phase 4)
  - `PROJECT.md` & `ORIGINAL_REQUEST.md` (Hito M4 / F12 specifications)
  - `src/hooks/usePOSKeyboardShortcuts.ts` (existing SPEC-047 supermarket implementation)
  - `src/hooks/useMostradorKeyboard.ts` (table-based mostrador hotkeys reference)
  - `src/tests/commercialFlowSupermarket.test.tsx` (existing 20 test suite verifying F1-F12 and inputs)
  - `src/views/pos/components/POSMultivendorView.tsx` (container view)
  - `src/views/pos/components/POSMultivendorLightHeader.tsx` (F8 search input and F9 cashier toggle)
  - `src/views/pos/components/POSMultivendorCart.tsx` (F4 discount popover, F6 draft, F2 checkout)
  - `src/views/pos/components/ManualWeightModal.tsx` & `SupervisorPinModal.tsx` (Escape handling)
  - `.agents/teamwork/m4_explorer_integration/DISPATCH.md` & `m4_explorer_tdd/DISPATCH.md` (peer sync)
- **Key findings**:
  - Existing `usePOSKeyboardShortcuts` from SPEC-047 is tested in `commercialFlowSupermarket.test.tsx`. A backwards-compatible polymorphic interface is essential to avoid breaking 20 existing passing tests while adding SPEC-057 semantic callbacks (`onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`, `onEscape`).
  - `{ passive: false }` is required in `addEventListener` to guarantee cancellation of native browser behaviors (F1 Help, F3 Find, F5 Reload, F6 Address Bar, F9 Reader Mode, Ctrl+K / Cmd+K URL search, F12 DevTools).
  - Input/Textarea handling: `F1`–`F12`, `Ctrl+K`/`Cmd+K`, and `Escape` must execute and call `preventDefault()` even when an `<input>`, `<textarea>`, `<select>`, or `contentEditable` is focused. Navigation keys (`ArrowUp`, `ArrowDown`, `Enter`) must be bypassed inside inputs to preserve normal text editing.
  - Modal context awareness (`isModalOpen?: boolean`): When a modal is open, POS action shortcuts are suppressed while `Escape` is kept alive for modal closing.
  - Cross-platform support: `(e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')` guarantees both Windows/Linux (Ctrl) and macOS (Command) work properly without AltGr collisions.
  - `e.repeat` deduplication for action keys prevents double checkouts or spamming comanda emissions.
- **Unexplored areas**: None. All task requirements fully investigated.

## Key Decisions Made
- Use polymorphic handler interface supporting both new semantic handlers and legacy function key handlers.
- Use `useRef` for handlers to decouple callback updates from window listener re-registration.
- Add `isModalOpen?: boolean` and `customerSelectorKey?: 'F1' | 'F3' | 'F6'` to `POSShortcutOptions`.

## Artifact Index
- `.agents/teamwork/m4_explorer_hook/DISPATCH.md` — Incoming dispatch from parent
- `.agents/teamwork/m4_explorer_hook/BRIEFING.md` — Persistent working memory
- `.agents/teamwork/m4_explorer_hook/progress.md` — Liveness heartbeat
- `.agents/teamwork/m4_explorer_hook/handoff.md` — Final 5-component architectural handoff report
