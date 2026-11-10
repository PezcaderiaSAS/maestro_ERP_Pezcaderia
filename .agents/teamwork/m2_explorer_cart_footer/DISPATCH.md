# Dispatch: M2 Explorer Cart Footer & UI

## Objective
Analyze and design the exact technical implementation strategy for the cart footer in `src/views/pos/components/POSMultivendorCart.tsx` to support the anchored `+ Descuento (F4)` button and interactive [% / $] discount selector.

## Authoritative Inputs to Read
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
- `specs/spec_057_pos_integral_refactor_frontend.md`
- `src/views/pos/components/POSMultivendorCart.tsx`

## Instructions
1. Analyze the footer structure of `POSMultivendorCart.tsx` (lines 306-380):
   - Where to place `+ Descuento (F4)` (`data-testid="btn-descuento-global-f4"`).
   - How to anchor it cleanly above or alongside the totals breakdown (Subtotal, Descuento, Total).
   - UI design of the discount selector: popover vs modal, mode toggle `[%]` / `[$]`, preset chips (5%, 10%, 15% / $2.000, $5.000, $10.000 COP), and clear button.
   - Props contract: adding `onOpenGlobalDiscount?: () => void` or inline state / callback `onApplyGlobalDiscount?: (type: 'porcentaje' | 'monto', val: number) => void`.
2. Ensure flexbox vertical containment (`shrink-0 mt-auto`) is preserved without expanding the footer unnecessarily or shrinking the 85% item list space.
3. Recommend implementation strategy. Do NOT implement code yourself.
4. Write your report in `.agents/teamwork/m2_explorer_cart_footer/handoff.md` and notify orchestrator via `send_message`.


## 2026-11-08T15:14:23Z
Eres el agente Explorer de UI/UX del Pie de Carrito para el Hito M2 (Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand).

Tu directorio de trabajo: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
Tu carpeta de estado: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_cart_footer

Archivos a consultar:
1. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
3. `specs/spec_057_pos_integral_refactor_frontend.md`
4. `src/views/pos/components/POSMultivendorCart.tsx`
5. `.agents/teamwork/m2_explorer_cart_footer/DISPATCH.md`

Objetivo:
Diseñar la estrategia de UI/UX para incorporar en `POSMultivendorCart.tsx`:
1. El botón permanente anclado `+ Descuento (F4)` con `data-testid="btn-descuento-global-f4"` en la sección de totales (`shrink-0 mt-auto`).
2. El selector de descuento interactivo: alternancia entre porcentaje (`%`) y monto fijo (`$`), presets rápidos (5%, 10%, 15% / $2.000, $5.000, $10.000 COP), botón de aplicar y botón de remover.
3. El desglose visual en el resumen: mostrar línea de `Descuento comanda: -$X.XXX` con badge destacable.
4. Preservación del flexbox: el footer debe mantener `shrink-0 mt-auto` sin crecer excesivamente ni restar espacio al 85% de la lista de ítems.

Escribe tu reporte en `.agents/teamwork/m2_explorer_cart_footer/handoff.md`.
NO implementes código directamente.
Notifica a tu orquestador vía send_message al finalizar.
