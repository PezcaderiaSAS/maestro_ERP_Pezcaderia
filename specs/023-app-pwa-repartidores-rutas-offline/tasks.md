# Tareas de Implementación Granulares (SPEC-023)

**Código:** SPEC-023  
**Título:** App PWA Móvil para Repartidores y Conductores (Rutas B2B, Entrega en Terreno, Firma Digital Táctil y Sincronización Offline)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.tasks`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Ejecución Quirúrgica TDD.

---

## Matriz de Tareas Secuenciales (WIP = 1)

### `TASK-023-01`: Esquemas Zod y Contratos de Validación PWA [COMPLETADA]
- **Objetivo:** Definir los contratos de tipos y esquemas de validación para credenciales corporativas, evidencia de entrega con firma Canvas Base64, devoluciones parciales y ejecuciones de parada.
- **Entregables:**
  - `packages/validation-schemas/src/driverDeliveryPwa.schema.ts`: Esquemas `DriverLoginCredentialsSchema`, `EvidenciaEntregaClienteSchema`, `DevolucionItemRutaSchema` y `RegistroEjecucionParadaSchema`.
  - Exportación en `packages/validation-schemas/src/index.ts`.
  - `src/tests/driverDeliveryPwa.schema.test.ts`: Suite de pruebas unitarias TDD (16/16 tests pasando).
- **Quality Gate:** 100% de tests verdes, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas.

---

### `TASK-023-02`: Tipos, Servicio Transaccional PWA y Store Reactivo con Outbox [COMPLETADA]
- **Objetivo:** Implementar la capa de lógica de negocio del conductor con autenticación corporativa, carga de ruta activa, persistencia de entregas en la cola outbox (`caja_outbox_v2`) y store reactivo Zustand.
- **Entregables:**
  - `src/types/driverDeliveryPwa.types.ts`: Interfaces tipadas completas.
  - `src/services/driverDeliveryPwaService.ts`: Lógica transaccional de entrega, recálculo de cobranza y encolado en IndexedDB con idempotencia.
  - `src/store/useDriverDeliveryPwaStore.ts`: Store Zustand reactivo con estado de sesión, paradas y sync status.
  - `src/tests/driverDeliveryPwaService.test.ts`: Suite de pruebas de servicio e integración (8/8 tests pasando).
- **Quality Gate:** Tests pasando al 100%, aislamiento de fallback en memoria, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas.

---

### `TASK-023-03`: Componente Táctil de Firma Digital con Canvas HTML5 Nativo [COMPLETADA]
- **Objetivo:** Construir el componente de firma digital táctil nativo sin librerías de terceros, con soporte para touch events, alta sensibilidad y exportación a PNG Base64.
- **Entregables:**
  - `src/views/driver/components/DriverSignaturePadCanvas.tsx`: Canvas HTML5 nativo responsive con Pointer Events API, `touch-action: none`, Retina DPR scaling, botón borrar $\ge 48\text{ px}$ y botón confirmar $\ge 56\text{ px}$.
  - `src/tests/driverSignaturePadCanvas.test.tsx`: Suite unitaria con simulación de trazos táctiles y mouse (3/3 tests pasando).
- **Quality Gate:** Cero dependencias externas, targets $\ge 48\text{ px}$ y $\ge 56\text{ px}$, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas.

---

### `TASK-023-04`: Componentes Táctiles del Flujo Móvil ("Regla del Niño de 12 Años") [COMPLETADA]
- **Objetivo:** Desarrollar las vistas móviles táctiles de inicio de turno, lista de paradas del día y detalle de ejecución con llamada directa y Waze/Maps.
- **Entregables:**
  - `src/views/driver/components/DriverLoginView.tsx`: Formulario de credenciales corporativas (inputs $\ge 48\text{ px}$, botón $\ge 56\text{ px}$).
  - `src/views/driver/components/DriverRouteOverview.tsx`: Lista de paradas con estados visuales y barra de progreso.
  - `src/views/driver/components/DriverStopExecutionView.tsx`: Pantalla de parada con semáforo térmico HACCP, botones 1-toque `tel:` y Waze/Maps, desglose de canastillas y cobranza.
  - `src/views/driver/components/DriverPartialReturnModal.tsx`: Modal para registrar rechazos parciales con destino `CUARENTENA_CALIDAD`.
  - `src/tests/driverDeliveryComponents.test.tsx`: Suite de integración de componentes UI.
- **Quality Gate:** Cero etiquetas `<img>`, Light Mode WCAG AA+, archivos $< 400$ líneas (SRP), `tsc --noEmit` en 0 errores.

---

### `TASK-023-05`: Vista Shell PWA Standalone y Enlace de Navegación [COMPLETADA]
- **Objetivo:** Orquestar la vista principal PWA móvil en pantalla completa, registrar la ruta central y conectar el acceso desde Despachos.
- **Entregables:**
  - `src/views/driver/DriverPortalView.tsx`: Shell PWA autónomo con badge reactivo de conectividad online/offline (`useNetworkHeartbeat`).
  - `src/routes/AppRoute.ts`: Registrar `AppRouteId.DRIVER_PORTAL = 'repartidor'` (`/repartidor`).
  - `src/App.tsx`: Enrutamiento para renderizar `DriverPortalView` en modo standalone (ocultando sidebar y topbar de escritorio).
  - Integración en `src/views/inventory/DispatchView.tsx`: Botón para abrir el portal del conductor.
  - `src/tests/driverPortalView.test.tsx`: Suite de pruebas de navegación y modo standalone.
- **Quality Gate:** Navegación tipada sin magic strings, `tsc --noEmit` en 0 errores.

---

### `TASK-023-06`: Suite Integral E2E, Auditoría Master Architect y Quality Gate Final [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Ejecutar la batería de pruebas global, validar límites arquitectónicos y verificar la app en vivo con DevTools.
- **Entregables:**
  - Ejecución de la batería Vitest completa de SPEC-023: **5 suites y 37/37 tests verdes (100% pasando)** (`driverDeliveryPwa.schema.test.ts`, `driverDeliveryPwaService.test.ts`, `driverSignaturePadCanvas.test.tsx`, `driverDeliveryComponents.test.tsx`, `driverPortalView.test.tsx`).
  - Verificación `tsc --noEmit`: **0 errores de TypeScript**.
  - Auditoría Master Architect SOLID con `scripts/architecture/audit-solid-boundaries.cjs`: **0 violaciones críticas** (378 archivos analizados en 236 ms).
  - Auditoría de 5 Diagramas Mermaid (`audit-diagrams-compliance.cjs`): **100% aprobado en los 5 diagramas obligatorios**.
  - Actualización de `MEMORY.md` y registro en el flujo continuo.
- **Quality Gate:** **ESPECIFICACIÓN SPEC-023 CULMINADA AL 100% Y CERTIFICADA.**

---

*Fin del desglose de tareas. Todas las tareas de SPEC-023 certificadas y completadas.*
