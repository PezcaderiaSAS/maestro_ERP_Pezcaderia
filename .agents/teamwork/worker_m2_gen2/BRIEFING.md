# BRIEFING — 2026-10-29T16:30:00Z

## Mission
Implement Milestone M2: POS Multivendedor & Ergonomía (Features F5–F10 + responsive Swal) ensuring WCAG AA, Fitts's Law touch targets (min 44px), mobile tab switching (< lg), debouncing, Miller chunking, and responsive wrapping without horizontal overflow.

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m2_gen2\
- Original parent: e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7
- Milestone: M2: POS Multivendedor & Ergonomía

## 🔒 Key Constraints
- Exclusive write ownership:
  - `src/views/POSView.tsx`
  - `src/views/pos/components/ProductSearchPanel.tsx`
  - `src/views/pos/components/CartPanel.tsx`
  - `src/views/pos/components/ParkedOrdersBar.tsx`
  - `src/views/pos/components/LineaVentaRow.tsx`
  - `src/views/pos/components/TerminalVendorBadge.tsx`
  - `src/views/pos/components/PaymentPanel.tsx`
  - `src/views/pos/components/PendingOrdersDrawer.tsx`
  - `src/tests/m2POSMultivendor.test.tsx`
- Integrity Mandate: No cheating, no hardcoding test results, genuine logic.
- Run `npx tsc --noEmit` and `npx vitest run src/tests/m2POSMultivendor.test.tsx` + `src/tests/m1ShellAndTokens.test.tsx`.

## Current Parent
- Conversation ID: e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7
- Updated: 2026-10-29T16:30:00Z

## Task Summary
- **What to build**:
  - F5: POS Mobile Switcher (Catálogo/Carrito) on `< lg` in `POSView.tsx`
  - F6: POS Asesores de Mostrador Fitts's Law (min-h-[44px]) in `POSView.tsx`
  - F7: POS Badges y Botones de Acción Fitts's Law in `TerminalVendorBadge.tsx`, `PaymentPanel.tsx`, `POSView.tsx`
  - F8: POS Barcode & Búsqueda Wrap in `ProductSearchPanel.tsx` (wrap, min-h-[44px])
  - F9: POS Parked Orders Bar Wrap in `ParkedOrdersBar.tsx`
  - F10: POS Doherty (<400ms debounce 200ms) & Miller (Chunking stock warehouses) in `ProductSearchPanel.tsx`
  - Responsive SweetAlert2 Modals in `POSView.tsx`
- **Success criteria**: All tests pass, build passes (`tsc --noEmit`), genuine responsive layout & ergonomics.
- **Interface contracts**: PROJECT.md, survey 1 & 2 handoff reports.

## Change Tracker
- **Files modified**: None yet.
- **Build status**: Pending.
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Not run yet.
- **Lint status**: Clean.
- **Tests added/modified**: `src/tests/m2POSMultivendor.test.tsx` (to be written).

## Loaded Skills
- None explicitly assigned beyond standard skills.

## Key Decisions Made
- [TBD]

## Artifact Index
- DISPATCH.md — Assignment and constraints.
- progress.md — Liveness heartbeat.
- handoff.md — Verification report upon completion.
