# Lista de Tareas Atómicas de Implementación: SPEC-043
## Flujo Multivendedor - Caja Única Kanban con Cero-Latencia para Ferretería Josase

- **Código:** SPEC-043
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

### Tablero Kanban de Implementación (Límite WIP = 1)

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│         EN PROCESO (WIP = 1)         │              POR HACER               │              TERMINADO               │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ 🎯 TASK-043-05: Modal Recaudo Mixto  │ TASK-043-06: Conmutación y DevTools  │ ✅ TASK-043-01: Carga IndexedDB      │
│    en Taquilla de Caja Única         │                                      │    Zero-LocalStorage Josase          │
│                                      │                                      │ ✅ TASK-043-02: Búsqueda Sub-2ms     │
│                                      │                                      │    Clientes en Mostrador POS         │
│                                      │                                      │ ✅ TASK-043-03: Anotaciones Doble    │
│                                      │                                      │    Nivel (Comanda + Ítems) & F6      │
│                                      │                                      │ ✅ TASK-043-04: Barra Lateral        │
│                                      │                                      │    Vendedor (VendorTicketSidebar)    │
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

#### 📋 `TASK-043-05`: Modal Profesional de Recaudo Mixto en Taquilla de Caja Única
- **Objetivo:** Desarrollar `QuickPaymentMixedModal.tsx` con esquema Zod `mixedPayment.schema.ts`: inspección de ítems con edición libre de cantidades/precios, combinación de métodos de pago (Efectivo, Tarjeta, Transferencia, Crédito con plazo), cálculo automático de vueltas para el efectivo recibido y generación de cuentas por cobrar en `useARStore`.
- **Archivos a modificar / crear:**
  - `src/schemas/mixedPayment.schema.ts` (NUEVO ESQUEMA ZOD)
  - `src/views/pos/components/QuickPaymentMixedModal.tsx` (NUEVO MODAL)
  - `src/views/pos/components/CashierKanbanView.tsx`
  - `src/tests/quickPaymentMixedModal.test.tsx` (NUEVO TEST TDD)
- **Criterio de Aceptación:** Validación matemática estricta al 100%, soporte para pagos divididos (ej. $50k transferencia + $50k efectivo con vueltas de $20k) y liquidación en 1 clic.

---

#### 📋 `TASK-043-06`: Conmutación de Vistas por Rol en Topbar & Certificación DevTools
- **Objetivo:** Integrar en `EnterpriseTopbar.tsx` el botón de acceso directo a Taquilla Central Kanban con atajos `F4` / `F7` para cajeras y admins, ocultando paneles de recaudo para asesores de mostrador. Validar la suite completa con Vitest (100% pasando) y Chromium DevTools (0 errores en consola, 1280px y 375px).
- **Archivos a modificar / crear:**
  - `src/components/layout/EnterpriseTopbar.tsx`
  - `src/tests/multiVendorCashierIntegrationE2E.test.tsx` (NUEVO TEST INTEGRACIÓN)
- **Criterio de Aceptación:** 100% pruebas unitarias verdes, `tsc --noEmit` con 0 errores, y certificación en producción.
