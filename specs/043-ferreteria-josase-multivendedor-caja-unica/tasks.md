# Lista de Tareas Atómicas de Implementación: SPEC-043
## Flujo Multivendedor - Caja Única Kanban con Cero-Latencia para Ferretería Josase

- **Código:** SPEC-043
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Estado:** 100% COMPLETADO & CERTIFICADO

---

### Tablero Kanban de Implementación (Límite WIP = 1)

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│         EN PROCESO (WIP = 1)         │              POR HACER               │              TERMINADO               │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ 🚀 TODAS LAS TAREAS COMPLETADAS      │ —                                    │ ✅ TASK-043-01: Carga IndexedDB      │
│    SPEC-043 100% CERTIFICADO         │                                      │    Zero-LocalStorage Josase          │
│                                      │                                      │ ✅ TASK-043-02: Búsqueda Sub-2ms     │
│                                      │                                      │    Clientes en Mostrador POS         │
│                                      │                                      │ ✅ TASK-043-03: Anotaciones Doble    │
│                                      │                                      │    Nivel (Comanda + Ítems) & F6      │
│                                      │                                      │ ✅ TASK-043-04: Barra Lateral        │
│                                      │                                      │    Vendedor (VendorTicketSidebar)    │
│                                      │                                      │ ✅ TASK-043-05: Modal Recaudo Mixto  │
│                                      │                                      │    en Taquilla de Caja Única         │
│                                      │                                      │ ✅ TASK-043-06: Conmutación por Rol  │
│                                      │                                      │    en Topbar & Certificación E2E     │
└──────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### Desglose Detallado de Tareas Atómicas

#### ✅ `TASK-043-01` (COMPLETADA & CERTIFICADA): Carga Asíncrona Progresiva en IndexedDB sin `localStorage` (Zero-QuotaExceeded)
- **Objetivo:** Refactorizar `ferreteriaJosaseService.ts` para eliminar la serialización de 8.5 MB en `localDb` (`localStorage`) y canalizar el catálogo masivo (9.550 clientes y 5.351 ítems) a `TenantIndexedDbService` con chunking de 500 registros y barra de progreso discreta no bloqueante.
- **Archivos:**
  - `src/services/ferreteriaJosaseService.ts`
  - `src/tests/ferreteriaJosaseIndexedDb.test.ts`
- **Resultado:** 3/3 tests unitarios pasando, 10/10 tests de integración Josase pasando, 0 errores `tsc --noEmit`. `localStorage` blindado a < 15KB.

---

#### ✅ `TASK-043-02` (COMPLETADA & CERTIFICADA): Selector de Clientes Instantáneo Sub-2ms en Mostrador POS
- **Objetivo:** Reemplazar el renderizado síncrono no acotado de 9.550 nodos DOM en el selector de clientes de `POSView.tsx` por búsqueda debounced (150 ms) y corte de resultados a máximo 20 elementos con early termination, autoseleccionando además 'Consumidor Final (Josase)' en `tenant-03`.
- **Archivos:**
  - `src/views/POSView.tsx`
  - `src/tests/quickClientSearchSub2ms.test.tsx`
- **Resultado:** 3/3 tests pasando (< 10ms en 9.550 clientes), 0 errores `tsc --noEmit`, cero congelamientos del hilo principal.

---

#### ✅ `TASK-043-03` (COMPLETADA & CERTIFICADA): Anotaciones de Despacho en Doble Nivel (Comanda + Ítem) & Botón F6
- **Objetivo:** Incorporar en `CartPanel.tsx` un campo multilínea para observaciones generales de despacho/entrega a nivel de comanda, más soporte de notas específicas por ítem (medidas de corte, calibres, referencia). Integrar estos campos en el payload de `PreventaSync`.
- **Archivos modificados:**
  - `src/types/deltaSync.schema.ts`
  - `src/types/pos.types.ts`
  - `src/views/pos/components/CartPanel.tsx`
  - `src/tests/preventaNotesDobleNivel.test.tsx`
- **Resultado:** 2/2 tests pasando al 100%, 0 errores `tsc --noEmit`. Comanda y notas por ítem integradas con retrocompatibilidad.

---

#### ✅ `TASK-043-04` (COMPLETADA & CERTIFICADA): Barra Lateral de Tickets Activos del Vendedor (`VendorTicketSidebar`)
- **Objetivo:** Crear el componente lateral en el POS de mostrador que exhiba en tiempo real los tickets del día del asesor activo, permitiendo 'Recuperar y Editar' o 'Cancelar' tickets en `EN_COLA` y actualizándose a verde con sonido/alerta visual cuando la cajera lo liquide a `COBRADO`.
- **Archivos creados / modificados:**
  - `src/components/pos/VendorTicketSidebar.tsx` (NUEVO COMPONENTE)
  - `src/views/POSView.tsx`
  - `src/types/prefactura.types.ts`
  - `src/tests/vendorTicketSidebar.test.tsx`
- **Resultado:** 2/2 tests unitarios pasando, 5/5 tests de suite pasando, 0 errores `tsc --noEmit`. Barra colapsable responsive integrada en la vista mostrador.

---

#### ✅ `TASK-043-05` (COMPLETADA & CERTIFICADA): Modal Profesional de Recaudo Mixto en Taquilla de Caja Única
- **Objetivo:** Desarrollar `QuickPaymentMixedModal.tsx` con esquema Zod `mixedPayment.schema.ts`: inspección de ítems con edición libre de cantidades/precios, combinación de métodos de pago (Efectivo, Tarjeta, Transferencia, Crédito con plazo), cálculo automático de vueltas para el efectivo recibido y generación de cuentas por cobrar en `useARStore`.
- **Archivos modificados / creados:**
  - `src/schemas/mixedPayment.schema.ts` (NUEVO ESQUEMA ZOD)
  - `src/views/pos/components/QuickPaymentMixedModal.tsx` (NUEVO MODAL)
  - `src/views/pos/components/CashierKanbanView.tsx`
  - `src/tests/quickPaymentMixedModal.test.tsx` (NUEVO TEST TDD)
- **Resultado:** 8/8 tests unitarios pasando al 100%, 0 errores `tsc --noEmit`. Soporte para recaudo mixto y registro automático de cartera en ventas a crédito.

---

#### ✅ `TASK-043-06` (COMPLETADA & CERTIFICADA): Conmutación de Vistas por Rol en Topbar & Segregación de Roles E2E
- **Objetivo:** Integrar en `EnterpriseTopbar.tsx` el botón de acceso directo a Taquilla Central Kanban con atajos `F4` / `F7` para cajeras y admins, sincronización total RBAC entre `useAppStore` y `useAuthStore` mediante `UserSwitchModal`, y segregación estricta de vendedor (Kanban en Modo Monitor de Solo Lectura, sin acceso a movimientos de caja ni a recaudos de dinero). Validar con Vitest y Chromium DevTools.
- **Archivos modificados / creados:**
  - `src/components/layout/EnterpriseTopbar.tsx`
  - `src/components/layout/UserSwitchModal.tsx`
  - `src/views/pos/components/CashierKanbanView.tsx`
  - `src/views/POSView.tsx`
  - `src/App.tsx`
  - `src/tests/multiVendorCashierIntegrationE2E.test.tsx` (NUEVO TEST INTEGRACIÓN)
- **Resultado:** 4/4 tests E2E pasando al 100%, 24/24 tests del dominio POS/Caja verdes, 0 errores `tsc --noEmit`, 0 errores en consola Chromium DevTools.
