# Dispatch: m2_challenger_1
Role: Milestone M2 Challenger (Parked sales stress, drafts restore, delete, switch & persistence)


## 2026-11-08T01:50:17Z
Read ORIGINAL_REQUEST.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md.
Read worker handoff at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_worker_actions\handoff.md.

You are m2_challenger_1.
Your role is to adversarially challenge Milestone M2: Parked sales stress, drafts restore, delete, switch, and persistence.

Challenger Scope:
1. Verify drafts operations: creating new parked sale (`onNewParkedSale`), switching active draft, restoring draft lines to cart, and deleting draft.
2. Verify that deleting a draft updates the badge count and that an empty draft list renders a clean empty state.
3. Execute tests:
   `npx vitest run src/tests/posParkedSalesFlow.test.tsx src/tests/posCartDrafts.test.ts src/tests/posDraftService.test.ts`
4. Confirm empirical correctness and issue a verdict: **APPROVE** or **REJECT**.

Write your handoff report to:
`c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_challenger_1\handoff.md`.
Send a message to your parent when finished.
