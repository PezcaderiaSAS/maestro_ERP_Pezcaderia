# Dispatch — m4_r2_exp_hooks (Milestone M4 - Iteration 2 Explorer)

## Assignment
- Role: M4 Rules of Hooks Remediation Explorer (`teamwork_explorer`)
- Scope: Formulate an exact fix strategy for the critical React Rules of Hooks violation in `src/views/pos/components/ManualWeightModal.tsx`.
- Working Directory: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`
- State Folder: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_r2_exp_hooks`

## Mandatory Reference Documents
- Original Request: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Master Plan: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- Forensic Auditor Full Evidence Report: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts\handoff.md`
- Reviewer 2 Full Report: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics\handoff.md`

## Forensic Audit Evidence (VERBATIM)
```
C:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\src\views\pos\components\ManualWeightModal.tsx
  163:3  error  React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
✖ 1 problem (1 error, 0 warnings)

Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (node_modules/react-dom/cjs/react-dom.development.js:15688:13)
    at ManualWeightModal (src\views\pos\components\ManualWeightModal.tsx:163:3)
```

## Objective
Analyze `src/views/pos/components/ManualWeightModal.tsx` and detail the exact line-by-line repositioning of the `useEffect` listener (lines 163-173) to place it before line 82 (`if (!isOpen || !producto) return null;`), ensuring ESLint passes with 0 warnings/errors and React lifecycle invariants remain preserved.
Do NOT modify production files directly. Deliver `handoff.md` in your state folder.


## 2026-11-09T13:25:34Z
You are m4_r2_exp_hooks (Milestone M4 - Iteration 2 Explorer).
Please read your task assignment in c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_r2_exp_hooks\DISPATCH.md.
Also read:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_audit_shortcuts\handoff.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_rev_shortcuts_ergonomics\handoff.md

Your state directory is:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m4_r2_exp_hooks
Create BRIEFING.md and progress.md there.
Formulate the exact fix strategy for the Rules of Hooks violation in ManualWeightModal.tsx.
Write handoff.md in your state folder and send a message when done. Do NOT modify source files.
