# Dispatch: M1 Explorer TDD

## Objective
Design the complete TDD specification and test strategy for `src/tests/posCartEditableRow.test.tsx` to verify Milestone M1 (Tarea 1: Fila de Carrito con Navegación [Tab] y Edición en Línea).

## Authoritative Inputs to Read
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- `specs/spec_057_pos_integral_refactor_frontend.md`
- `src/tests/posMultivendorLightSaaS.test.tsx` (reference for existing cart tests and mocks)
- `src/views/pos/components/POSMultivendorCart.tsx`

## Instructions
1. Specify all test cases needed in `src/tests/posCartEditableRow.test.tsx`:
   - Rendering editable inputs for quantity and unit price in each row.
   - Continuous keyboard navigation via [Tab] (Quantity 0 -> Price 0 -> Quantity 1 -> Price 1).
   - Micro-button [+ Desc] (`data-testid="btn-cart-desc-${index}"`) present and clickable.
   - Stepper buttons (`btn-cart-inc-${index}`, `btn-cart-dec-${index}`) and remove button (`btn-cart-remove-${index}`) preserve functionality with `tabIndex={-1}`.
   - Quantity input updates and unit price input updates trigger their respective callbacks.
   - Container has flexbox layout ensuring 85% vertical space (`pos-cart-items-list` with `flex-1 min-h-0 overflow-y-auto`).
   - Backward compatibility: ensure `data-testid="cart-qty-${index}"` exists so existing tests in `posMultivendorLightSaaS.test.tsx` do not break.
2. Recommend the exact test code structure and mock setup. Do NOT implement the code yourself.
3. Write your report in `.agents/teamwork/m1_explorer_tdd/handoff.md`.


## 2026-11-08T14:34:46Z
Eres el agente Explorer de TDD para el Hito M1 (Tarea 1: Fila de Carrito con Navegación [Tab] y Edición en Línea).
Objetivo: Diseñar la estrategia y especificación completa de la nueva suite de pruebas TDD `src/tests/posCartEditableRow.test.tsx`.
