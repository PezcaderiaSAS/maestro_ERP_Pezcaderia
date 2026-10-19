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

### `TASK-022-02`: Módulo y Store Reactivo de Cuentas por Pagar (CxP) [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Proporcionar la infraestructura de datos para registrar y consultar deudas comerciales con proveedores pesqueros originadas en compras a crédito, con fallback en memoria.
- **Entregables:**
  - `src/types/accountsPayable.types.ts`: Tipos `CuentaPorPagar`, `EstadoCuentaPorPagar`, `AbonoCuentaPorPagar`, `RegistrarCuentaPorPagarInput`, `RegistrarAbonoInput`.
  - `src/services/accountsPayableService.ts`: Almacenamiento local persistente (`cuentas_por_pagar`), causación automática de fecha de vencimiento en tiempo local (`calcularFechaVencimiento`), cálculo de saldo pendiente, abonos parciales/totales y fallback seguro en memoria para testing y SSR.
  - `src/store/useAccountsPayableStore.ts`: Store Zustand reactivo con cálculo dinámico de `totalSaldoPendiente` y `totalCuentasVencidas`.
  - `src/tests/accountsPayableService.test.ts`: Suite TDD completa con **9/9 tests verdes (100% pasando)**.
- **Quality Gate:** Tests pasando al 100%, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (350 archivos analizados).


---

### `TASK-022-03`: Orquestador Transaccional de Recepción en Muelle & Trazabilidad FEFO [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Unificar la lógica de negocio para liquidar una recepción de furgón, generando los lotes FEFO en inventario y actualizando las finanzas (CxP o caja) de forma atómica e idempotente.
- **Entregables:**
  - `src/services/dockPurchasesReceivingService.ts`:
    - Generación de código canónico de lote `LOT-{YYYYMMDD}-{PROV_CORTO}-{CONSECUTIVO}`.
    - Llamada a `inventoryService.registrarLoteFEFO(...)` con fecha de faena y fecha de vencimiento (+8 días fresco, +180 días congelado).
    - Registro de movimiento y persistencia en almacén local `dock_purchases`.
    - Integración con `cashService` para débito de caja activa si es 'CONTADO', o `accountsPayableService` si es 'CRÉDITO'.
    - Validación metrológica atómica (rechazo si peso bruto $\le$ tara canastillas).
  - `src/tests/dockPurchasesReceivingService.test.ts`: Pruebas de integración transaccional completa con **4/4 tests verdes (100% pasando)**.
- **Quality Gate:** Tests pasando al 100%, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (352 archivos analizados).


---

### `TASK-022-04`: Componentes Atómicos Táctiles de Muelle ("Regla del Niño de 12 Años") [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Crear los componentes visuales de alto contraste y ergonomía táctil $\ge 48\text{ px}$ requeridos por el Wizard.
- **Entregables:**
  - `src/views/purchases/components/ThermalTrafficLightBadge.tsx`: Semáforo térmico tricolor ($\le 4^\circ\text{C}$ Verde Esmeralda, $4.1-7^\circ\text{C}$ Ámbar, $> 7^\circ\text{C}$ Rojo) con badges WCAG AA+ y micro-copys de inocuidad.
  - `src/views/purchases/components/MuelleWeightScaleWidget.tsx`: Display gigante de báscula en monospace, botones táctiles de canastillas `+1`, `+5`, `-1` $\ge 48\text{ px}$, chips de hielo $\ge 48\text{ px}$, desglose metrológico y cero imágenes externas.
  - `src/views/purchases/components/QuickSupplierModal.tsx`: Creación rápida de proveedor con NIT, razón social y presets de crédito (`Contado`, `8 días`, `15 días`, `30 días`), botón gigante $\ge 56\text{ px}$ e inputs $\ge 48\text{ px}$.
  - `src/tests/dockAtomicComponents.test.tsx`: Suite unitaria con **7/7 tests verdes (100% pasando)**.
- **Quality Gate:** 100% Light Mode WCAG 2.2 AA+, targets $\ge 48\text{ px}$, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (356 archivos analizados).


---

### `TASK-022-05`: Wizard Asistido Modular de Recepción en 3 Pasos (DockReceivingWizard.tsx) [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Desarrollar el flujo guiado en 3 pasos ergonómicos descomponiendo en sub-componentes atómicos para cumplir SRP ($< 400$ líneas por archivo).
- **Entregables:**
  - `src/views/purchases/components/Step1FurgonCadenaFrio.tsx`: Datos de furgón, conductor, temperatura de cava y semáforo HACCP con botón $\ge 56\text{ px}$.
  - `src/views/purchases/components/Step2BasculaCanastillas.tsx`: Pesaje en báscula, deducción de tara $2.0\text{ kg}$, hielo $0-15\%$ y partidas pesadas con botón eliminar $\ge 48\text{ px}$.
  - `src/views/purchases/components/Step3LiquidacionFrio.tsx`: Liquidación en COP enteros, forma de pago Contado/Crédito/Transferencia y botón gigante $\ge 56\text{ px}$ `btn-confirm-dock-receiving`.
  - `src/views/purchases/components/DockReceivingWizard.tsx`: Orquestador del stepper táctil con auto-avance, integración transaccional, modal SweetAlert2 y botón de impresión de acta.
  - `src/tests/dockReceivingWizard12YearsRule.test.tsx`: Suite de integración de componentes UI, targets táctiles $\ge 48\text{ px}$, botón $\ge 56\text{ px}$ y cero etiquetas `<img>` con **5/5 tests verdes (100% pasando)**.
- **Quality Gate:** Batería acumulada de SPEC-022 con **37/37 tests verdes (5 suites pasando)**, cero etiquetas `<img>`, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (361 archivos analizados).

---

### `TASK-022-06`: Vista Principal de Compras y Recepción en Muelle & Enlace en Navegación [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Crear la pantalla principal de Compras en Muelle, enlazar en navegación global y sincronizar con Inventario.
- **Entregables:**
  - `src/views/purchases/PurchasesReceivingView.tsx`: Vista con tabs '1. Nueva Recepción en Muelle' y '2. Historial de Furgones Recibidos', tarjetas de métricas consolidables y modal de acta.
  - `src/routes/AppRoute.ts`: `AppRouteId.DOCK_PURCHASES` con `isPrimaryNav: true`, icono `Anchor` y roles `admin`, `bodega` y `administrativo`.
  - `src/components/layout/EnterpriseSidebar.tsx`: Acceso directo con icono `Anchor` y badge `FEFO` en dominio Abastecimiento & Planta.
  - `src/App.tsx`: Enrutamiento declarativo para `compras_muelle` montando `PurchasesReceivingView`.
  - `src/tests/purchasesReceivingView.test.tsx`: Suite unitaria y de integración con **4/4 tests verdes (100% pasando)**.
- **Quality Gate:** Batería acumulada de SPEC-022 con **41/41 tests verdes (6 suites pasando)**, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (363 archivos analizados).

---

### `TASK-022-07`: Suite Integral E2E, Auditoría Master Architect y Quality Gate Final [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Ejecutar la batería de pruebas global, verificar límites arquitectónicos y validar la app en vivo.
- **Entregables:**
  - Ejecución de la suite Vitest dedicada de SPEC-022: **6 suites y 41/41 tests verdes (100% pasando)**.
  - Verificación `tsc --noEmit`: **0 errores de TypeScript**.
  - Auditoría Master Architect SOLID con `scripts/architecture/audit-solid-boundaries.cjs`: **0 violaciones críticas** (363 archivos analizados).
  - Bucle en vivo con Chrome DevTools MCP: **0 errores JS en consola**, validación de responsive móvil a 375 px y captura de pantalla certificada.
  - Actualización de `MEMORY.md` y cierre formal del ciclo SDD v3.0.
- **Quality Gate:** ESPECIFICACIÓN SPEC-022 CULMINADA AL 100% Y CERTIFICADA.
