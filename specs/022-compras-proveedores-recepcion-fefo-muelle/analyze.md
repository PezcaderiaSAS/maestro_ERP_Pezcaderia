# Reporte de Consistencia y Alineación Cruzada: SPEC-022 (/speckit.analyze - Control de Calidad 2)

- **Especificación:** SPEC-022: Compras, Proveedores y Recepción con Trazabilidad FEFO en Muelle
- **Versión:** 1.0.0
- **Fecha:** 2026-10-18
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Matriz de Trazabilidad y Alineación Cruzada (Spec $\rightarrow$ Plan $\rightarrow$ Tasks)

| Requerimiento (Spec) | Plan Técnico (Plan) | Tarea Asignada (Tasks) | Cobertura | Estado |
| :--- | :--- | :--- | :---: | :---: |
| **EARS-UBI-01 & 02:** Catálogo Proveedores, Light Mode WCAG 2.2 AA+, cero `<img>` | `useSupplierStore`, tokens de diseño slate, iconos Lucide React | `TASK-022-04`, `TASK-022-05` | 100% | ✅ Alineado |
| **EARS-UBI-03:** Targets $\ge 48\text{ px}$, botón principal $\ge 56\text{ px}$ | Componentes táctiles `min-h-[48px]`, botón gigante `h-14` | `TASK-022-04`, `TASK-022-05` | 100% | ✅ Alineado |
| **EARS-EVT-01:** Datos furgón, conductor, temperatura cava | `DatosFurgonMuelleSchema`, `ThermalTrafficLightBadge` | `TASK-022-01`, `TASK-022-04` | 100% | ✅ Alineado |
| **EARS-EVT-02:** Pesaje canastillas, tara $2.0\text{ kg}$, % hielo $0-15\%$ | `PesadaCanastillaMuelleSchema`, `calcularPesajeMuelleNeto()` | `TASK-022-01` | 100% | ✅ Alineado |
| **EARS-EVT-03:** Lote FEFO canónico, stock WMS, CxP / Caja | `dockPurchasesReceivingService`, `accountsPayableService` | `TASK-022-02`, `TASK-022-03` | 100% | ✅ Alineado |
| **EARS-STA-01 a 03:** Semáforo térmico ($\le 4^\circ\text{C}$, $4.1-7^\circ\text{C}$, $> 7^\circ\text{C}$) | `ThermalTrafficLightBadge`, bloqueo preventivo | `TASK-022-01`, `TASK-022-04` | 100% | ✅ Alineado |
| **EARS-UNW-01 a 03:** Protección peso $<$ tara, caja cerrada contado, NIT duplicado | Refinamiento Zod, alertas SweetAlert2, validación en store | `TASK-022-01`, `TASK-022-03` | 100% | ✅ Alineado |
| **RN-COMP-01 a 08:** Reglas de dominio pesaje, hielo, FEFO y CxP | Orquestación transaccional e idempotencia en localDb | `TASK-022-01`, `TASK-022-03` | 100% | ✅ Alineado |

---

## 2. Hallazgos de Auditoría y Ajustes de Precisión (Refinamiento Previo a Código)

### Hallazgo 1: Redondeo Entero COP (Regla SPEC-009)
- **Observación:** En compras de pescado fresco en muelle, el peso en kilogramos se maneja con 2 decimales (ej. $124.75\text{ kg}$), pero el total monetario en pesos colombianos debe redondearse a número entero (`Math.round(...)`), evitando centavos inexistentes en la moneda nacional.
- **Acción:** Incluir formalmente el redondeo entero `Math.round(pesoNetoKg * precioKg)` en la función de liquidación de `dockPurchasesReceiving.schema.ts`.

### Hallazgo 2: Aislamiento y Fallback en Memoria para `accountsPayableService`
- **Observación:** Las suites de prueba en Vitest y entornos CI no siempre cuentan con almacenamiento IndexedDB nativo de navegador disponible.
- **Acción:** `accountsPayableService.ts` debe incorporar fallback automático en memoria siguiendo el patrón canónico ya establecido en `localDb.ts` y `outboxSyncService.ts`.

### Hallazgo 3: Modularización Estricta (Límite SRP $< 600$ Líneas)
- **Observación:** El Wizard de muelle contiene múltiples sub-vistas (Furgón, Báscula, Liquidación). Si se implementara en un solo archivo monolítico, superaría el límite de 600 líneas de `audit-solid-boundaries.cjs`.
- **Acción:** Descomponer el Wizard en sub-componentes atómicos:
  - `Step1FurgonCadenaFrio.tsx`
  - `Step2BasculaCanastillas.tsx`
  - `Step3LiquidacionFrio.tsx`
  - Orquestados por `DockReceivingWizard.tsx` ($< 350$ líneas útiles).

---

## 3. Conclusión de Calidad
La especificación, plan técnico y matriz de tareas presentan **100% de consistencia cruzada**, sin fisuras lógicas ni riesgos de regresión sobre los módulos previos (POS, WMS, B2B y Caja). Se procede a actualizar la matriz de tareas para incorporar los hallazgos refinados.
