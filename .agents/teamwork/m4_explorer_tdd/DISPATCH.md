## 2026-11-09T12:26:26Z
[Message] sender=214a0168-c4c8-4555-84a8-e65c4fad7287 priority=MESSAGE_PRIORITY_HIGH content=Investigate requirements for Tarea 4 (Hito M4): Interceptor Global de Atajos de Teclado POS (F8, Ctrl+K, F6, F4, F2, F9, Esc).

Mandatory files to read:
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- `specs/spec_057_pos_integral_refactor_frontend.md`
- `src/tests/posCartEditableRow.test.tsx` and `src/tests/posGlobalDiscount.test.tsx` (as references for testing conventions)

Task:
1. Design the comprehensive TDD test specification for `src/tests/posKeyboardShortcuts.test.tsx`.
2. Cover each required shortcut:
   - F8: Focus search input (`#pos-barcode-input` or `[data-testid="pos-search-input"]`).
   - Ctrl+K: Toggle view between mostrador and comanda or open command palette.
   - F6: Open client selector / multiclient modal or trigger client dropdown.
   - F4: Open global discount popover.
   - F2: Save draft comanda (`Guardar Borrador` / `onSaveDraft`).
   - F9: Trigger cash payment / checkout (`Cobrar en Caja` / `onCobrarCaja`).
   - Esc: Close active modal or cancel current transient state (without clearing the cart).
3. Test edge cases:
   - Prevention of default browser behaviors (`e.preventDefault()`).
   - Collisions with browser shortcuts (F6 address bar, Ctrl+K search bar, F8 debugging).
   - Behavior when focus is inside text inputs vs outside text inputs (should F8/F4/F9 trigger while typing in customer search or cart inputs? What about Ctrl+K?).
   - Event listener cleanup on component unmount (no memory leaks).

Rules:
- Read-only exploration. DO NOT write or edit source code files.
- Deliver detailed handoff report in `.agents/teamwork/m4_explorer_tdd/handoff.md` following Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- Send completion message to parent upon finishing.
