## 2026-11-05T16:06:50Z
You are teamwork_worker.
Your working directory is: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m1\
Parent conversation ID: e581d92b-b34a-4a1c-839f-2a3c9710cd5f

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read the authoritative user request at:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md

Read the project scope and architecture at:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md

Read the survey findings from the Explorers:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_cart\handoff.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_parked\handoff.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_swarm\handoff.md

Exclusive Write Ownership (You own these files exclusively):
- `src/views/pos/components/CartPanel.tsx`
- `src/views/pos/components/ParkedOrdersBar.tsx`
- `src/views/POSView.tsx`

Task: Milestone M1 — Desacoplamiento de Cobro on-Demand, Footer Condensado y Ergonomía de Cabecera

1. Desacoplamiento de PaymentPanel hacia Cobro on-Demand en `CartPanel.tsx`:
   - El pie `.pos-cart-footer` en modo cajero/taquilla NO debe renderizar de forma estática permanente los 617px de `PaymentPanel`.
   - Condensa `.pos-cart-footer` a un bloque estilizado de <= 115px con:
     - Resumen de totales compacto (Subtotal, Base, Impuestos, F4 Descuento si aplica).
     - Banner prominente de TOTAL: `$XX.XXX` en `font-mono font-black text-2xl sm:text-3xl text-emerald-400 tabular-nums`.
     - Botón principal de ancho completo `[ ⚡ COBRAR / LIQUIDAR (F2 / Enter) ]` (id `btn-cobrar`, `min-h-[48px] h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg`).
   - Al pulsar `⚡ Cobrar` (o presionar la tecla de acceso rápido `F2` / `Enter` cuando no haya inputs en foco), se debe abrir un Cajón Deslizante (Slide-Over Drawer) o Modal centrado con backdrop (`isPaymentDrawerOpen`), que renderice `PaymentPanel` con todos sus medios de pago, desglose de billetes, datáfono y facturación electrónica sin canibalizar el área de productos del carrito.
   - En modo mostrador (`isMostradorAuto`), mantener el botón principal de preventa `[ ⏸ EMITIR PREVENTA / COMANDA (F6) ]` con footer compacto (<= 115px).
   - PRESERVA estrictamente los `data-testid` y clases contractuales existentes (`data-testid="cart-glass-panel"`, `data-testid="cart-items-container"`, `pos-cart-panel`, `pos-cart-items-list`, `pos-cart-footer`, `btn-cobrar`, `btn-emitir-preventa-mostrador`).

2. Reorganización Ergonómica de `ParkedOrdersBar` y Cabecera de `CartPanel`:
   - Extraer la barra pesada de 96px de `ParkedOrdersBar` del flujo vertical apilado sobre los productos.
   - Convertirla en una cinta horizontal ultra-fina (32px) integrada en la cabecera o dotar al botón `[ ⏸ En Espera (F6) ]` y `[ Borradores (N) ]` en `.pos-cart-header` de un acceso ágil que abra `PendingOrdersDrawer` o despliegue los borradores sin restar espacio permanente a la lista de ítems.

3. Consolidación de Cabecera y Restauración de Tokens Fitts en `POSView.tsx`:
   - En `src/views/POSView.tsx:2290`, restaura los botones de asesores a `min-h-[44px]` y padding `px-3.5 py-2.5` (cumpliendo F6).
   - En `src/views/POSView.tsx:2399`, restaura el botón `#btn-open-comandas-drawer` a `min-h-[44px]` (cumpliendo F7).
   - Compacta las franjas de cabecera de `POSView.tsx` (márgenes y paddings) para maximizar la altura neta de la grilla central.

4. Verificación Obligatoria:
   - Ejecuta `npx tsc --noEmit` y verifica que haya 0 errores de TypeScript.
   - Ejecuta `npx vitest run src/tests/m2POSMultivendor.test.tsx src/tests/posCartPanelErgonomics.test.tsx src/tests/posParkedSalesFlow.test.tsx src/tests/pendingOrdersDrawer.test.tsx src/tests/challengerPOSCartAndSOPStress.test.tsx` y verifica que todas las pruebas pasen al 100%.

5. Documentación y Entrega:
   - Escribe tu informe de traspaso completo en `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m1\handoff.md`.
   - Envía un mensaje a este orquestador informando la finalización y resultados.
