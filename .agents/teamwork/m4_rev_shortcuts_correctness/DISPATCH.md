# Dispatch — m4_rev_shortcuts_correctness

## Assignment
- Role: M4 Correctness Reviewer (`teamwork_reviewer`)
- Scope: Review code implementation and tests for Milestone M4 (Tarea 4: Interceptor Global de Atajos de Teclado POS F8, Ctrl+K, F6, F4, F2, F9, Esc).
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_correctness`

## Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Worker Handoff: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md`

## Key Files to Review
- `src/hooks/usePOSKeyboardShortcuts.ts`
- `src/views/pos/components/POSMultivendorView.tsx`
- `src/views/pos/components/ManualWeightModal.tsx`
- `src/tests/posKeyboardShortcuts.test.tsx`
- `src/tests/commercialFlowSupermarket.test.tsx`

## Verification Requirements
1. Run `npx tsc --noEmit` to verify type cleanliness.
2. Run `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx` to verify functional correctness and backward compatibility.
3. Verify that all shortcuts (F8, Ctrl+K, F6, F4, F2, F9, Esc) are mapped accurately to their semantic actions.
4. Verify input focus discrimination (ordinary typing inside `<input>` is not swallowed, but function keys/Ctrl+K are intercepted).
5. Produce `handoff.md` in your state folder with verdict APPROVE or REQUEST_CHANGES.


## 2026-11-09T12:57:35Z
[Message] timestamp=2026-11-09T12:57:35Z sender=214a0168-c4c8-4555-84a8-e65c4fad7287 priority=MESSAGE_PRIORITY_HIGH content=You are the M4 Correctness Reviewer.
Please read your task assignment in c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_correctness\DISPATCH.md.
Also read:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md

Your state directory is:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_correctness
Create BRIEFING.md and progress.md there.
Verify functional correctness, backward compatibility, and test coverage of keyboard shortcuts.
Run tests and type checks via run_command.
Write your final verdict (APPROVE or REQUEST_CHANGES) in handoff.md in your state folder and send a completion message back.


## 2026-11-09T13:13:40Z
[Message] timestamp=2026-11-09T13:13:40Z sender=214a0168-c4c8-4555-84a8-e65c4fad7287 priority=MESSAGE_PRIORITY_HIGH content=**Context**: Reanudación tras reinicio de servidor para Gate de Verificación Hito M4.
**Content**: El servidor se reinició. Por favor reanudar de inmediato tu revisión de correctitud y retrocompatibilidad del Hito M4 desde tu progress.md. Ejecuta las verificaciones con run_command (npx tsc --noEmit, vitest), redacta tu handoff.md con tu veredicto (APPROVE o REQUEST_CHANGES) en c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_correctness\handoff.md y envíame un mensaje de finalización.
**Action**: Reanudar y completar tu revisión inmediatamente.
