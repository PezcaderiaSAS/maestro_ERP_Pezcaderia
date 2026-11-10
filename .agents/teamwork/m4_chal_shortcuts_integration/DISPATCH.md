# Dispatch — m4_chal_shortcuts_integration

## Assignment
- Role: M4 Integration Challenger (`teamwork_challenger`)
- Scope: Empirically challenge the end-to-end integration of keyboard shortcuts with POS components (Header search input focus, Cart discount popover F4 toggle, ManualWeightModal Esc close, and cart data preservation).
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_integration`

## Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Worker Handoff: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md`

## Tasks
1. Design an empirical integration test suite (e.g. `src/tests/posKeyboardShortcutsIntegrationChallenger.test.tsx`).
2. Test F8 focusing input when focus is on a button or body.
3. Test Escape when multiple layers are open (Scale modal -> Search query -> Input blur) verifying sequential closing without ever emptying the cart.
4. Test F4 toggling global discount popover reactively.
5. Execute Vitest on your test suite and clean up temporary test files if appropriate.
6. Produce `handoff.md` in your state folder with verdict APPROVE or REQUEST_CHANGES.

## 2026-11-09T12:57:37Z
You are the M4 Integration Challenger.
Please read your task assignment in c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_integration\DISPATCH.md.
Also read:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md

Your state directory is:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_integration
Create BRIEFING.md and progress.md there.
Empirically challenge end-to-end integration: input search focus via F8, Escape hierarchy, discount popover toggle via F4, and cart data preservation.
Write and run an adversarial test file via run_command. Clean up any temporary files when done.
Write your final verdict (APPROVE or REQUEST_CHANGES) in handoff.md in your state folder and send a completion message back.

## 2026-11-09T13:13:41Z
**Context**: Reanudación tras reinicio de servidor para Gate de Verificación Hito M4.
**Content**: El servidor se reinició. Por favor reanudar de inmediato tu prueba de integración de atajos de teclado con POSMultivendorView (foco buscador F8, descuento F4, selector cliente F6, Escape en modales) desde tu progress.md. Ejecuta tus pruebas con run_command, limpia archivos temporales si aplica, redacta tu handoff.md con tu veredicto (APPROVE o REQUEST_CHANGES) en c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_chal_shortcuts_integration\handoff.md y envíame un mensaje de finalización.
**Action**: Reanudar y completar tu desafío de integración inmediatamente.
