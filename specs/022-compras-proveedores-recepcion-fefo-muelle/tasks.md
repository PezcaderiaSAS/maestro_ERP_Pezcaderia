# Matriz de Tareas de Implementación: SPEC-022 (Actualizada Post-Análisis)

- **Especificación:** SPEC-022: Compras, Proveedores y Recepción con Trazabilidad FEFO en Muelle
- **Versión:** 1.1.0
- **Fecha:** 2026-10-18
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO PARA INICIAR IMPLEMENTACIÓN TDD
- **Límite de Trabajo en Proceso:** WIP = 1 (Una sola tarea activa a la vez)

---

## Tareas Secuenciales de Implementación (WIP = 1)

### `TASK-022-01`: Contratos de Validación Zod y Lógica Metrológica de Pesaje Muelle [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Definir los esquemas de validación y funciones matemáticas puras para pesaje de furgón, tara de canastilla plástica, descuento de hielo y semáforo térmico, con redondeo entero en COP.
- **Entregables:**
  - `packages/validation-schemas/src/dockPurchasesReceiving.schema.ts`:
    - `DatosFurgonMuelleSchema` (placa, conductor, temperatura de cava $\le 4^\circ\text{C}$ óptimo, fecha faena).
    - `PesadaCanastillaMuelleSchema` (canastillas, tara fija $2.0\text{ kg}$, % hielo $0-15\%$, validación peso bruto $>$ tara).
    - `LiquidacionCompraMuelleSchema` (forma de pago, días de crédito, precio/kg, total COP con `Math.round()`).
    - `calcularPesajeMuelleNeto()` (función matemática determinista con tara fija $2.0\text{ kg/ud}$).
    - `evaluarSemaforoTermico()` y `calcularLiquidacionTotalMuelle()` (redondeo entero COP).
  - Exportado en `packages/validation-schemas/src/index.ts`.
  - `src/tests/dockPurchasesReceiving.schema.test.ts`: suite unitaria TDD completa con **12/12 tests verdes (100% pasando)**.
- **Quality Gate:** Tests unitarios pasando al 100%, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas.


---

### `TASK-022-02`: Módulo y Store Reactivo de Cuentas por Pagar (CxP)
- **Objetivo:** Proporcionar la infraestructura de datos para registrar y consultar deudas comerciales con proveedores pesqueros originadas en compras a crédito, con fallback en memoria.
- **Entregables:**
  - `src/types/accountsPayable.types.ts`: Tipos `CuentaPorPagar`, `EstadoCuentaPorPagar`, `AbonoCuentaPorPagar`.
  - `src/services/accountsPayableService.ts`: Almacenamiento local persistente (`cuentas_por_pagar`) con fallback en memoria, causación automática según fecha y días de crédito del proveedor.
  - `src/store/useAccountsPayableStore.ts`: Store Zustand para gestión reactiva de pasivos.
  - `src/tests/accountsPayableService.test.ts`: Pruebas de causación, cálculo de saldo pendiente y vencimiento.
- **Quality Gate:** Tests pasando al 100%, `tsc --noEmit` en 0 errores.

---

### `TASK-022-03`: Orquestador Transaccional de Recepción en Muelle & Trazabilidad FEFO
- **Objetivo:** Unificar la lógica de negocio para liquidar una recepción de furgón, generando los lotes FEFO en inventario y actualizando las finanzas (CxP o caja) de forma atómica e idempotente.
- **Entregables:**
  - `src/services/dockPurchasesReceivingService.ts`:
    - Generación de código canónico de lote `LOT-{YYYYMMDD}-{PROV_CORTO}-{CONSECUTIVO}`.
    - Llamada a `inventoryService.registrarLoteFEFO(...)` con fecha de faena y fecha de vencimiento.
    - Registro de movimiento de stock `ENTRADA_COMPRA_PROVEEDOR`.
    - Integración con `cashService` para débito de caja si es 'CONTADO', o `accountsPayableService` si es 'CRÉDITO'.
    - Guardado del acta de recepción en `recepciones_muelle`.
  - `src/tests/dockPurchasesReceivingService.test.ts`: Pruebas de integración transaccional completa.
- **Quality Gate:** Tests pasando al 100%, `tsc --noEmit` en 0 errores.

---

### `TASK-022-04`: Componentes Atómicos Táctiles de Muelle ("Regla del Niño de 12 Años")
- **Objetivo:** Crear los componentes visuales de alto contraste y ergonomía táctil $\ge 48\text{ px}$ requeridos por el Wizard.
- **Entregables:**
  - `src/views/purchases/components/ThermalTrafficLightBadge.tsx`: Semáforo térmico tricolor ($\le 4^\circ\text{C}$ Verde, $4.1-7^\circ\text{C}$ Ámbar, $> 7^\circ\text{C}$ Rojo).
  - `src/views/purchases/components/MuelleWeightScaleWidget.tsx`: Display gigante de báscula en monospace, botones táctiles de canastillas `+1`, `+5`, `-1` $\ge 48\text{ px}$, chips de hielo $\ge 48\text{ px}$, cero imágenes externas.
  - `src/views/purchases/components/QuickSupplierModal.tsx`: Creación rápida de proveedor con NIT, razón social y días de crédito sin interrumpir el pesaje.
- **Quality Gate:** 100% Light Mode WCAG 2.2 AA+, targets $\ge 48\text{ px}$, `tsc --noEmit` en 0 errores.

---

### `TASK-022-05`: Wizard Asistido Modular de Recepción en 3 Pasos (DockReceivingWizard.tsx)
- **Objetivo:** Desarrollar el flujo guiado en 3 pasos ergonómicos descomponiendo en sub-componentes atómicos para cumplir SRP ($< 400$ líneas por archivo).
- **Entregables:**
  - `src/views/purchases/components/Step1FurgonCadenaFrio.tsx`: Datos de furgón, conductor, temperatura de cava y semáforo.
  - `src/views/purchases/components/Step2BasculaCanastillas.tsx`: Pesaje en báscula, deducción de tara $2.0\text{ kg}$, hielo $0-15\%$ y partidas pesadas.
  - `src/views/purchases/components/Step3LiquidacionFrio.tsx`: Liquidación en COP enteros, forma de pago Contado/Crédito y botón gigante $\ge 56\text{ px}$ `btn-confirm-dock-receiving`.
  - `src/views/purchases/components/DockReceivingWizard.tsx`: Orquestador del stepper táctil con auto-avance y persistencia de borrador.
  - `src/tests/dockReceivingWizard12YearsRule.test.tsx`: Suite de integración de componentes UI, targets táctiles y accesibilidad.
- **Quality Gate:** Tests de integración pasando al 100%, cero etiquetas `<img>`, `tsc --noEmit` en 0 errores.

---

### `TASK-022-06`: Vista Principal de Compras y Recepción en Muelle & Enlace en Navegación
- **Objetivo:** Crear la pantalla principal de Compras en Muelle, enlazar en navegación global y sincronizar con Inventario.
- **Entregables:**
  - `src/views/purchases/PurchasesReceivingView.tsx`: Vista con tabs '1. Nueva Recepción en Muelle' y '2. Historial de Furgones Recibidos'.
  - `src/routes/AppRoute.ts` y `EnterpriseSidebar.tsx`: Enlace formal a `AppRouteId.DOCK_PURCHASES` ('compras_muelle') con icono Lucide `Anchor`.
  - Actualización de `BucaramangaReceivingWizard.tsx` en `src/views/inventory/components/` para delegar y reutilizar `DockReceivingWizard.tsx` sin duplicidad.
- **Quality Gate:** Navegación tipada sin magic strings, `tsc --noEmit` en 0 errores.

---

### `TASK-022-07`: Suite Integral E2E, Auditoría Master Architect y Quality Gate Final
- **Objetivo:** Ejecutar la batería de pruebas global, verificar límites arquitectónicos y validar la app en vivo.
- **Entregables:**
  - Ejecución de la suite Vitest completa (100% pasando).
  - Verificación `tsc --noEmit` (0 errores).
  - Auditoría Master Architect SOLID con `scripts/architecture/audit-solid-boundaries.cjs` (0 violaciones críticas).
  - Bucle en vivo con Chrome DevTools MCP: 0 errores JS en consola y validación táctil responsive móvil (375 px).
  - Actualización de `MEMORY.md` y commit convencional de cierre.
- **Quality Gate:** Certificación final y retención de hito en Hindsight.
