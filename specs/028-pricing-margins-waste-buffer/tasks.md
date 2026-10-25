# Tareas Granulares de Implementación: SPEC-028 — Precios Dinámicos, Márgenes Multicanal y Módulo de Mermas (Admin)

**Código:** SPEC-028  
**Fase:** /speckit.tasks (SDD v3.0)  
**Fecha:** 2026-10-24  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Regla de Ejecución:** TDD Quirúrgico | Una sola tarea activa a la vez (`WIP = 1`) | Stop & Checkpoint  

---

## Matriz de Tareas Secuenciales (Límite Kanban WIP = 1)

```
[TASK-028-01] Esquemas Zod y Tipos de Dominio (Configuración, Simulación y Snapshots)
     │
     ▼
[TASK-028-02] Servicios de Dominio SOLID (Cálculo Determinista, Gestión de Config y Auditoría)
     │
     ▼
[TASK-028-03] Hook Reactivo Orquestador usePricingEngine.ts y Sincronización de Estado
     │
     ▼
[TASK-028-04] Panel Exclusivo Admin para Configuración de Mermas y Márgenes (PricingConfigManager.tsx)
     │
     ▼
[TASK-028-05] Simulador Multicanal, Tarjetas Táctiles y Modal de Recálculo en Lote
     │
     ▼
[TASK-028-06] Integración Modular en PricingView.tsx, Auditoría de Snapshots y Certificación DevTools MCP
```

---

### - [x] **`TASK-028-01` — Esquemas Zod y Contratos de Dominio:**
- **Objetivo:** Definir la validación estricta en tiempo de ejecución y los tipos TypeScript para la configuración de mermas, márgenes por canal, inputs de simulación y snapshots inmutables.
- **Archivos a Crear/Modificar:**
  - `packages/validation-schemas/src/pricingEngine.schema.ts` (esquemas Zod).
  - `packages/validation-schemas/src/index.ts` (exportación pública).
  - `src/types/pricingEngine.types.ts` (tipos de dominio derivados vía `z.infer`).
  - `src/tests/pricingEngineSchema.test.ts` (suite unitaria TDD).
- **Criterio de Éxito:** 100% tests verdes en `pricingEngineSchema.test.ts` (9/9 tests), validación de rangos tolerados (buffers $0\%-50\%$, márgenes $1\%-200\%$, costos $>0$) y compilación `tsc --noEmit` con 0 errores. [COMPLETADA]

---

### - [x] **`TASK-028-02` — Servicios de Dominio SOLID:**
- **Objetivo:** Implementar los motores de cálculo matemático puro, gestión de configuración y auditoría de márgenes desacoplados de React.
- **Archivos a Crear/Modificar:**
  - `src/services/pricing/pricingCalculationService.ts` (fórmula determinista de costo ajustado por merma, proyección multicanal e IVA con redondeo entero COP `RN-06`).
  - `src/services/pricing/pricingConfigService.ts` (persistencia en `localDb('pricingGlobalConfig')`, resolución de jerarquía bimodal categoría $\rightarrow$ producto).
  - `src/services/pricing/marginAuditService.ts` (bloqueo estricto de venta bajo costo y verificación de umbral de margen mínimo).
  - `src/tests/pricingCalculationService.test.ts` (suite unitaria TDD de algoritmos y casos borde).
- **Criterio de Éxito:** 100% tests verdes en `pricingCalculationService.test.ts` (9/9 tests), validación de invariantes sin decimales espurios y compilación `tsc --noEmit` en 0 errores. [COMPLETADA]

---

### - [x] **`TASK-028-03` — Hook Reactivo Orquestador `usePricingEngine.ts`:**
- **Objetivo:** Orquestar el ciclo de vida reactivo de la configuración maestra, simulación en caliente (<50ms), mutación de tarifas de productos y recálculo masivo.
- **Archivos a Crear/Modificar:**
  - `src/hooks/usePricingEngine.ts`.
  - `src/tests/usePricingEngine.test.ts` (suite TDD con renderHook).
- **Criterio de Éxito:** 100% tests verdes en `usePricingEngine.test.ts` (5/5 tests), reactividad probada ante cambios en inputs y emisión de eventos de dominio a `useEventStore`. [COMPLETADA]

---

### - [x] **`TASK-028-04` — Panel Exclusivo Admin para Configuración de Mermas y Márgenes:**
- **Objetivo:** Construir la interfaz de control de alto nivel para usuarios con rol `ADMIN` que permite parametrizar los buffers por especie y los márgenes por canal.
- **Archivos a Crear/Modificar:**
  - `src/views/pricing/components/PricingConfigManager.tsx`.
  - `src/tests/pricingConfigManager.test.tsx` (suite de componentes con validación RBAC).
- **Criterio de Éxito:** Bloqueo de acceso para roles no-admin, edición fluida de sliders táctiles $\ge 48\text{ px}$, confirmación SweetAlert2 y tests verdes al 100% (4/4 tests). [COMPLETADA]

---

### - [x] **`TASK-028-05` — Simulador Multicanal, Tarjetas Táctiles y Modal de Recálculo en Lote:**
- **Objetivo:** Construir el simulador interactivo para comerciales, las tarjetas visuales por canal con desglose de IVA y el modal de previsualización masiva.
- **Archivos a Crear/Modificar:**
  - `src/views/pricing/components/PricingSimulatorTab.tsx`.
  - `src/views/pricing/components/PricingChannelCard.tsx`.
  - `src/views/pricing/components/BatchCategoryRecalculateModal.tsx`.
  - `src/tests/pricingSimulatorTab.test.tsx` (suite de componentes y simulación en lote).
- **Criterio de Éxito:** Semáforos cromáticos en vivo (verde, ámbar, rojo), cálculo instantáneo de ganancia en COP y tests verdes al 100% (4/4 tests). [COMPLETADA]

---

### - [x] **`TASK-028-06` — Integración Modular en `PricingView.tsx`, Auditoría y Certificación DevTools MCP:**
- **Objetivo:** Integrar la nueva pestaña en `PricingView.tsx`, cajón de auditoría `PriceHistoryAuditDrawer.tsx`, verificar la suite global y certificar en vivo con Chrome DevTools MCP.
- **Archivos a Crear/Modificar:**
  - `src/views/pricing/components/PriceHistoryAuditDrawer.tsx`.
  - `src/views/PricingView.tsx` (integración de pestañas y permisos).
  - `src/tests/pricingViewIntegration.test.tsx` (suite de integración global).
- **Criterio de Éxito:** 100% tests verdes en Vitest (36/36 tests), compilación `tsc --noEmit` con 0 errores, consola JS con 0 errores y certificación visual completada con Chrome DevTools. [COMPLETADA]
