# Tareas Granulares de Implementación: SPEC-027 — Portal B2B HORECA

**Especificación:** SPEC-027 — Portal de Clientes B2B Auto-Servicio HORECA  
**Fase:** /speckit.tasks (SDD v3.0)  
**Fecha:** 2026-10-23  
**Regla de Ejecución:** TDD Quirúrgico | Una sola tarea activa a la vez (`WIP = 1`) | Stop & Checkpoint  

---

### Lista de Tareas Secuenciales (WIP = 1)

- [x] **`TASK-027-01` — Esquemas Zod y Contratos de Dominio:**
  - Crear `packages/validation-schemas/src/b2bCustomerPortal.schema.ts` (esquemas de cortes, empaques, líneas, órdenes y plantillas recurrentes).
  - Exportar contratos en `packages/validation-schemas/src/index.ts`.
  - Crear tipos TypeScript en `src/types/b2bCustomerPortal.types.ts`.
  - Crear prueba unitaria `src/tests/b2bCustomerPortalSchema.test.ts` con cobertura de validaciones exitosas y errores controlados.
  - *Checkpoint de Verificación:* Tests verdes (6/6) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-027-02` — Motor de Servicios B2B (`b2bCustomerPortalService.ts`):**
  - Implementar `src/services/b2bCustomerPortalService.ts`:
    - Filtrado de catálogo con tarifas preferenciales del cliente según `tipoPrecio`.
    - Cálculo de cupo de crédito disponible (`cupoTotal - facturasPendientes`).
    - Creación de pedidos B2B con enrutamiento automático: `CREADO` (si cupo OK) vs `PENDIENTE_APROBACION_CARTERA` (si excede cupo).
    - Gestión de plantillas recurrentes y método `reordenarDesdePlantilla(id)`.
    - Trazabilidad de remisiones WMS y temperaturas de despacho.
  - Crear prueba unitaria `src/tests/b2bCustomerPortalService.test.ts`.
  - *Checkpoint de Verificación:* Tests verdes (6/6) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-027-03` — Hooks Reactivos `useB2BCart.ts` & `useB2BCustomerPortal.ts`:**
  - Implementar hook de carrito `src/hooks/useB2BCart.ts` (gestión de líneas, cortes, modalidades de venta, cálculo de peso estimado y subtotales).
  - Implementar orquestador `src/hooks/useB2BCustomerPortal.ts` (cliente activo bimodal, catálogo, cartera, carga de plantillas y seguimiento).
  - Registrar ruta oficial `AppRouteId.B2B_PORTAL = 'portal_b2b'` en `src/routes/AppRoute.ts` y actualizar `src/tests/appRoute.test.ts` (25 rutas oficiales).
  - Crear prueba unitaria `src/tests/useB2BCustomerPortal.test.ts`.
  - *Checkpoint de Verificación:* Tests verdes (10/10 en hooks + 9/9 en rutas) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [x] **`TASK-027-04` — Componentes Atómicos UI Táctiles ("Regla del Niño de 12 Años"):**
  - Crear en `src/views/b2b/portal/components/`:
    - `B2BClientHeaderBar.tsx` (switcher rápido de cliente para demo/comercial y selector de sucursal de entrega).
    - `B2BCreditCardSummary.tsx` (tarjeta de crédito con semáforo y estado de cuenta).
    - `B2BCatalogGrid.tsx` (cuadrícula táctil de productos del mar con precios preferenciales).
    - `B2BItemConfiguratorModal.tsx` (modal táctil para elegir corte: filete, entero, rodaja y empaque hielo).
    - `B2BRecurringTemplatesDrawer.tsx` (drawer de plantillas de compra recurrente con re-orden en 1 toque).
    - `B2BOrderTrackingTimeline.tsx` (seguimiento en vivo del pedido en bodega y ruta).
    - `index.ts` (archivo barril).
  - Crear prueba unitaria `src/tests/b2bPortalComponents.test.tsx`.
  - *Checkpoint de Verificación:* Tests verdes (7/7) y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

- [ ] **`TASK-027-05` — Vista Principal `B2BCustomerPortalView.tsx` e Integración en ERP:**
  - Implementar `src/views/b2b/portal/B2BCustomerPortalView.tsx`.
  - Agregar botón de navegación en `src/components/layout/EnterpriseSidebar.tsx` bajo B2B con `data-testid="nav-portal-b2b"`.
  - Agregar enrutamiento en `src/App.tsx`.
  - Crear prueba unitaria `src/tests/b2bCustomerPortalView.test.tsx`.
  - *Checkpoint de Verificación:* Tests verdes y compilación `tsc --noEmit`.

- [ ] **`TASK-027-06` — Suite E2E de Playwright y Certificación DevTools MCP:**
  - Crear `tests/e2e/b2b-customer-portal.spec.ts` (flujo completo de navegación, armado de pedido, re-orden de plantilla y vista móvil a 375 px).
  - Ejecución en vivo con subagente de navegador / Chrome DevTools: verificar 0 errores en consola JS y captura de evidencia visual.
  - *Checkpoint de Verificación:* 100% tests verdes y certificación visual.
