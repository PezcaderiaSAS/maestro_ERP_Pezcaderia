# Dispatch — m4_rev_shortcuts_ergonomics

## Assignment
- Role: M4 Ergonomics Reviewer (`teamwork_reviewer`)
- Scope: Review browser collision prevention, modal lifecycle handling (`isModalOpen`), cross-platform support (`Ctrl+K` on Win/Linux, `Cmd+K` on macOS), and cart safety (Escape hierarchy) for Milestone M4.
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics`

## Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Worker Handoff: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md`

## Key Files to Review
- `src/hooks/usePOSKeyboardShortcuts.ts`
- `src/views/pos/components/POSMultivendorView.tsx`
- `src/views/pos/components/ManualWeightModal.tsx`
- `src/tests/posKeyboardShortcuts.test.tsx`

## Verification Requirements
1. Verify `{ passive: false }` and `e.preventDefault()` on intercepted keys to guarantee no native browser collisions (F1 help, F3 find, F5 refresh, F6 omnibox, Ctrl+K search).
2. Verify that Escape closes open modals, popovers, or clears search without EVER clearing the cart (`onClearCart`).
3. Verify cross-platform `Cmd+K` / `Ctrl+K`.
4. Run `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/posManualWeightModal.test.tsx`.
5. Produce `handoff.md` in your state folder with verdict APPROVE or REQUEST_CHANGES.


## 2026-11-09T12:57:35Z
You are the M4 Ergonomics Reviewer.
Please read your task assignment in c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics\DISPATCH.md.
Also read:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md

Your state directory is:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics
Create BRIEFING.md and progress.md there.
Review browser collision prevention, modal lifecycle handling (isModalOpen), cross-platform Cmd+K/Ctrl+K, and cart safety (Escape hierarchy).
Run tests via run_command.
Write your final verdict (APPROVE or REQUEST_CHANGES) in handoff.md in your state folder and send a completion message back.


## 2026-11-09T13:13:40Z
**Context**: Reanudación tras reinicio de servidor para Gate de Verificación Hito M4.
**Content**: El servidor se reinició. Por favor reanudar de inmediato tu revisión de ergonomía, colisiones con navegador, foco en inputs y resguardo de carrito ante Escape desde tu progress.md. Ejecuta las verificaciones con run_command, redacta tu handoff.md con tu veredicto (APPROVE o REQUEST_CHANGES) en c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics\handoff.md y envíame un mensaje de finalización.
**Action**: Reanudar y completar tu revisión inmediatamente.
