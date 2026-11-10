## 2026-11-09T12:26:26Z
Sender: 214a0168-c4c8-4555-84a8-e65c4fad7287
Content: Investigate architecture for the hook `usePOSKeyboardShortcuts.ts` for Tarea 4 (Hito M4): Interceptor Global de Atajos de Teclado POS (F8, Ctrl+K, F6, F4, F2, F9, Esc).

Mandatory files to read:
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- `specs/spec_057_pos_integral_refactor_frontend.md`
- Existing hooks in `src/hooks/` and `src/views/pos/`

Task:
1. Define the hook signature, TypeScript interfaces, and configuration parameters for `usePOSKeyboardShortcuts`:
   - Callback handlers: `onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`, `onEscape`.
   - Enabled/disabled flag or modal context awareness.
2. Determine event listener strategy:
   - `window.addEventListener('keydown', handleKeyDown)` with passive: false.
   - Clean removal in cleanup function of `useEffect`.
   - Normalization of key names (`e.key`, `e.code`, `e.ctrlKey`, `e.metaKey`).
   - Cross-platform support (Windows/Linux/Mac: Ctrl vs Meta/Command).
3. Conflict prevention and browser collision mitigation:
   - When an input/textarea is focused, which shortcuts should fire? (F2, F4, F6, F8, F9, Ctrl+K and Esc should still intercept and call `preventDefault()`).
   - Preventing browser default actions reliably on all targeted function keys.

Rules:
- Read-only exploration. DO NOT write or edit source code files.
- Deliver detailed handoff report in `.agents/teamwork/m4_explorer_hook/handoff.md` following Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- Send completion message to parent upon finishing.
