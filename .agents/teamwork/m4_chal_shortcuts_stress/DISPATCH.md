# Dispatch — m4_chal_shortcuts_stress

## Assignment
- Role: M4 Stress Challenger (`teamwork_challenger`)
- Scope: Stress test rapid keystroke bursts, repeating keydown events, modifier combinations (Ctrl/Shift/Alt), and concurrent modal trigger events.
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_stress`

## Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Worker Handoff: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md`

## Tasks
1. Design an empirical stress test suite (e.g. `src/tests/posKeyboardShortcutsStressChallenger.test.tsx`).
2. Test rapid firing of F2/F9 while `isSubmitting` is true (double submission prevention).
3. Test combinations like Alt+F4, Ctrl+Shift+K, Ctrl+Enter, Esc spamming.
4. Test keyboard events when unmounted to ensure 0 memory leaks or dangling window listeners.
5. Execute Vitest on your test file and clean up any temporary files.
6. Produce `handoff.md` in your state folder with verdict APPROVE or REQUEST_CHANGES.


## 2026-11-09T12:57:36Z
[Message] timestamp=2026-11-09T12:57:36Z sender=214a0168-c4c8-4555-84a8-e65c4fad7287 priority=MESSAGE_PRIORITY_HIGH
You are the M4 Stress Challenger.
Please read your task assignment in c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_stress\DISPATCH.md.
Also read:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md

Your state directory is:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_stress
Create BRIEFING.md and progress.md there.
Empirically stress test rapid keystrokes, repeating keydowns, modifier combos, and unmount cleanup.
Write and run an adversarial test file via run_command. Clean up any temporary files when done.
Write your final verdict (APPROVE or REQUEST_CHANGES) in handoff.md in your state folder and send a completion message back.


## 2026-11-09T13:13:41Z
[Message] timestamp=2026-11-09T13:13:41Z sender=214a0168-c4c8-4555-84a8-e65c4fad7287 priority=MESSAGE_PRIORITY_HIGH
**Context**: Reanudación tras reinicio de servidor para Gate de Verificación Hito M4.
**Content**: El servidor se reinició. Por favor reanudar de inmediato tu prueba de estrés adversarial de atajos de teclado (ráfaga de teclas, autorepeat, modifiers, unmount) desde tu progress.md. Ejecuta tus pruebas con run_command, limpia archivos temporales si aplica, redacta tu handoff.md con tu veredicto (APPROVE o REQUEST_CHANGES) en c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_stress\handoff.md y envíame un mensaje de finalización.
**Action**: Reanudar y completar tu desafío de estrés inmediatamente.
