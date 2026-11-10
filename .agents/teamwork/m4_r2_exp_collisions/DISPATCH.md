# Dispatch — m4_r2_exp_collisions (Milestone M4 - Iteration 2 Explorer)

## Assignment
- Role: M4 Browser Collision & Modal Isolation Explorer (`teamwork_explorer`)
- Scope: Formulate an exact fix strategy for `src/hooks/usePOSKeyboardShortcuts.ts` to block native browser keys (`consumeEvent()`) when `isModalOpen === true`.
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_r2_exp_collisions`

## Mandatory Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Forensic Auditor Full Evidence Report: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts\handoff.md`
- Reviewer 2 Full Report: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics\handoff.md`

## Problem Statement
In `src/hooks/usePOSKeyboardShortcuts.ts`, lines 140-146 currently do:
```typescript
if (isModalOpen) {
  if (key === 'Escape') {
    consumeEvent();
    h.onEscape?.();
  }
  return;
}
```
When `isModalOpen === true`, if `F5` (or `F1`, `F6`, etc.) is pressed, `return;` is executed before `consumeEvent()`. This allows the browser to reload the page or navigate away, losing cart data!
Analyze and prescribe the exact implementation to consume `isFuncKey` and `isCtrlK` during `isModalOpen === true` while keeping POS comanda callbacks dormant.
Do NOT modify production files directly. Deliver `handoff.md` in your state folder.
