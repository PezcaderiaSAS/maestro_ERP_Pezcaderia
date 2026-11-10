# Dispatch: POS Modals, Shortcuts and Test Harness Explorer

## Objective
Investigate existing POS modals (`ManualWeightModal`, `SupervisorPinModal`), keyboard shortcut handling, catalog pagination/virtualization, and the test suite (`src/tests/posCartEditableRow.test.tsx` and related Vitest tests).

## Authoritative Inputs to Read
- `src/tests/posCartEditableRow.test.tsx` (check if exists or needs to be created)
- Relevant modals: `ManualWeightModal.tsx`, `SupervisorPinModal.tsx`
- Keyboard shortcuts in `POSMultivendorView.tsx` or related hooks
- Existing POS test suites in `src/tests/`
- `.agents/teamwork/ORIGINAL_REQUEST.md`

## Instructions
1. Check if `src/tests/posCartEditableRow.test.tsx` exists. If so, read its contents. If not, inspect the testing conventions in `src/tests/` (Vitest, React Testing Library, userEvent, fireEvent, mocks).
2. Locate `ManualWeightModal` and `SupervisorPinModal` or check where/how they are implemented or referenced.
3. Check how keyboard shortcuts (F8, Ctrl+K, F6, F2, F9, Esc) are handled in `POSMultivendorView.tsx` or whether a global interceptor exists.
4. Check the product catalog matrix in `POSMultivendorView.tsx` (18 cards 6x3 and pagination `< Anterior 1 2 3 ... Siguiente >`).
5. Report your findings in `.agents/teamwork/survey_explorer_pos_infra/handoff.md`.


## 2026-11-08T14:25:23Z
Sender: 214a0168-c4c8-4555-84a8-e65c4fad7287
Priority: MESSAGE_PRIORITY_HIGH

Eres el agente Explorer de infraestructura de pruebas, modales y atajos POS para SPEC-057.
Objetivo de la misión:
1. Estado del archivo de test `src/tests/posCartEditableRow.test.tsx`: ¿existe? Si existe, ¿qué casos cubre? Si no existe, ¿qué utilidades y mocks se usan en pruebas similares de Vitest/RTL?
2. Existencia y API de `ManualWeightModal` y `SupervisorPinModal`. ¿Cuáles son sus props y contratos actuales?
3. Estado de atajos de teclado (F8, Ctrl+K, F6, F2, F9, Esc): ¿existen actualmente en la vista multivendedor o en qué hooks están implementados?
4. Estado de la matriz de 18 tarjetas (6x3) y paginación en `POSMultivendorView.tsx`.
5. Ejecutar diagnóstico de comandos de verificación: comando exacto para correr Vitest en `src/tests/posCartEditableRow.test.tsx`, `tsc --noEmit`, etc.
