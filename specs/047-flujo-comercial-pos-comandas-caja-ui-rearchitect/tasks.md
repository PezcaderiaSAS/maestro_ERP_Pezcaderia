# Tareas de Implementación — SPEC-047 (Límite WIP = 1)

## Estado General del Tablero Kanban

| Por Hacer (To Do) | En Progreso (In Progress - WIP = 1) | En Revisión (In Review) | Terminado (Done) |
| :--- | :--- | :--- | :--- |
| Ninguna | Ninguna | Ninguna | `TASK-047-01` a `TASK-047-06` (100%) |

---

## Desglose Granular de Tareas

- [x] **`TASK-047-01` [TDD] Implementar Hook de Atajos de Teclado `usePOSKeyboardShortcuts` y Suite de Pruebas**
  - **Objetivo:** Crear `src/hooks/usePOSKeyboardShortcuts.ts` con manejo de eventos de teclado (F1 a F12, Enter, Espacio, Escape) e ignorado inteligente en inputs de texto.
  - **Pruebas:** Crear `src/tests/commercialFlowSupermarket.test.tsx` verificando el disparo y bloqueo de atajos.
  - **Criterio de Aceptación:** Tests unitarios de atajos pasando en verde al 100% (5/5 tests superados).

- [x] **`TASK-047-02` [UI/UX] Implementar Cintillo de Cola Interno `InternalQueueTicker.tsx`**
  - **Objetivo:** Desarrollar el componente compacto `src/views/pos/components/InternalQueueTicker.tsx` para mostrar turno activo y métricas de espera bajo la regla 60-30-10 en Dark Glassmorphism.
  - **Pruebas:** Test de renderizado y reactividad de estado en `commercialFlowSupermarket.test.tsx`.
  - **Criterio de Aceptación:** Muestra el turno actual, comandas en espera y badge de tiempo promedio sin errores (8/8 tests superados).

- [x] **`TASK-047-03` [UI/UX] Implementar Terminal Tabular de Supermercado `CashierSupermarketTerminal.tsx`**
  - **Objetivo:** Crear `src/views/pos/components/CashierSupermarketTerminal.tsx` con filas ultradensas $\ge 40\text{px}$, navegación con teclas de flecha `ArrowUp`/`ArrowDown`, selección con `Enter`/`F9`, alineación monetaria en `font-mono` y barra de ayuda visual de atajos en el pie.
  - **Pruebas:** Test de interacción por teclado y selección de filas en la suite de pruebas.
  - **Criterio de Aceptación:** Navegación fluida por teclado, llamada verbal destacada y contraste WCAG AAA (13/13 tests superados).

- [x] **`TASK-047-04` [Lógica & UI] Implementar Modal de Cobro Dividido / Mixto Dinámico `SplitPaymentModal.tsx`**
  - **Objetivo:** Desarrollar `src/views/pos/components/SplitPaymentModal.tsx` con soporte para combinar múltiples formas de pago (Efectivo, Datáfono, Transferencia QR, Crédito), cálculo automático en vivo de saldo restante y cambio/vueltas en tipografía `font-mono`.
  - **Pruebas:** Test de cálculo matemático de pagos fraccionados y validación de liquidación completa.
  - **Criterio de Aceptación:** Saldo restante calculado al centavo, vueltas exactas y botón de cobro bloqueado hasta saldo cero (17/17 tests superados).

- [x] **`TASK-047-05` [UI/UX] Implementar Chips de Corte Rápido `QuickCutNotes.tsx` e Integración en Mostrador POS**
  - **Objetivo:** Crear `src/views/pos/components/QuickCutNotes.tsx` con botones táctiles $\ge 48\text{px}$ para preparación de pescado e integrarlo junto al `InternalQueueTicker` en `src/views/POSView.tsx`.
  - **Pruebas:** Test de selección de corte y agregación de nota a la comanda.
  - **Criterio de Aceptación:** Flujo de 1 toque operativo en mostrador integrado con cero regresiones (21/21 tests superados).

- [x] **`TASK-047-06` [Integración & DevTools] Integrar Flujo en `CashierKanbanView.tsx` y Bucle de Auditoría DevTools**
  - **Objetivo:** Integrar la nueva terminal tabular y modal de cobro dividido en `CashierKanbanView.tsx` con selector de modo interactivo.
  - **Bucle DevTools:** Ejecutar Playwright/Chrome DevTools contra `http://localhost:3000/` certificando 0 errores fatales en consola JS y vistas responsivas en escritorio (1280px) y móvil (375px).
  - **Criterio de Aceptación:** 100% de tests pasando en Vitest (26/26 pruebas combinadas), consola JS validada y capturas de pantalla certificadas.
