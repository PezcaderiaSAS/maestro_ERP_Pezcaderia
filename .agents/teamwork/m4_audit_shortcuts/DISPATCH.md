# Dispatch — m4_audit_shortcuts

## Assignment
- Role: M4 Forensic Auditor (`teamwork_auditor`)
- Scope: Forensic integrity verification of Milestone M4 (Tarea 4: Interceptor Global de Atajos de Teclado POS).
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts`

## Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Worker Handoff: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md`

## Auditing Tasks
1. Verify genuine logic in `src/hooks/usePOSKeyboardShortcuts.ts` and `src/views/pos/components/POSMultivendorView.tsx`.
2. Check for anti-patterns: hardcoded test values, mock bypasses, dummy handlers, ignored keyboard events.
3. Audit listener registration: verify `{ passive: false }`, proper cleanup on `useEffect` unmount (`removeEventListener`), and absence of memory leaks.
4. Verify tests in `src/tests/posKeyboardShortcuts.test.tsx` test real behaviors (DOM dispatchEvent, keydown events, spy assertions) without tautologies.
5. Run `npx tsc --noEmit` and run the canonical regression suites:
   `npx vitest run src/tests/posKeyboardShortcuts.test.tsx src/tests/commercialFlowSupermarket.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`
6. Issue a binary integrity verdict: CLEAN or INTEGRITY VIOLATION.
7. Produce `handoff.md` in your state folder.


## 2026-11-09T12:57:37Z
You are the M4 Forensic Auditor.
Please read your task assignment in c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts\DISPATCH.md.
Also read:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m4_shortcuts\handoff.md

Your state directory is:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts
Create BRIEFING.md and progress.md there.
Perform rigorous forensic integrity audit: zero hardcoding, zero mock facades, genuine event dispatching, passive: false registration, and multi-suite regression.
Run verification commands (tsc, vitest) via run_command.
Issue binary verdict (CLEAN or INTEGRITY VIOLATION) in handoff.md in your state folder and send a completion message back.


## 2026-11-09T13:13:41Z
**Context**: Reanudación tras reinicio de servidor para Gate de Verificación Hito M4.
**Content**: El servidor se reinició. Por favor reanudar de inmediato tu auditoría forense de integridad del Hito M4 desde tu progress.md. Realiza la inspección de código y pruebas, corre npx tsc --noEmit y la suite de regresión completa con run_command, emite tu veredicto binario (CLEAN o INTEGRITY VIOLATION) en c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts\handoff.md y envíame un mensaje de finalización.
**Action**: Reanudar y completar tu auditoría forense inmediatamente.
