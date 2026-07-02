# Cross-Alignment Audit — Spec → Plan → Tasks

**Audit ID:** AUDIT-CONSOLE-LOGGER-001  
**Artefacts audited:**
- `console-logger-spec.md` (v1.0) — Spec
- `implementation-plan.md` (v1.0) — Plan
- `tasks-breakdown.md` (v1.0) — Tasks
- `quality-checklist.md` (v1.0) — Checklist

**Method:** Traceability matrix + gap analysis + consistency check.

---

## 1. Traceability Matrix

| CA | Spec | Plan | Tasks | Coverage |
|----|------|------|-------|----------|
| CA-01 | ✅ Stores middleware | ✅ 18 stores | ✅ T04–T10 | ✅ Completo |
| CA-02 | ✅ 7 servicios | ⚠️ Solo IDataService | ✅ T11 | ⚠️ Parcial (ver gap B) |
| CA-03 | ✅ User actions | ✅ useActionLogger | ⚠️ Creado en T03, **nunca aplicado** | ❌ Gap C |
| CA-04 | ✅ window.onerror | ❌ **No mencionado** | ❌ **No existe tarea** | ❌ Gap B |
| CA-05 | ✅ Colores+grupos | ✅ En consoleLogger | ✅ T01 | ✅ Completo |
| CA-06 | ✅ sessionId | ✅ En consoleLogger | ✅ T01 | ✅ Completo |
| CA-07 | ✅ <1ms + import.meta.env.DEV | ✅ isEnabled() guard | ✅ T01 | ✅ Completo |
| CA-08 | ✅ Error context | ✅ En consoleLogger | ✅ T01 | ✅ Completo |

**Score: 5/8 completos, 1/8 parcial, 2/8 faltantes.**

---

## 2. Gaps encontrados

### 🔴 Gap A — Cuenta incorrecta de stores en Spec

| Artefacto | Dice | Realidad |
|-----------|------|----------|
| Spec | "15 stores" | Hay **18 stores** + `usePOSCart` listado como store (es hook) |
| Plan | 18 stores | ✅ Correcto |
| Tasks | 18 stores | ✅ Correcto |

**Impacto:** Bajo. No afecta implementación, solo documento.

**Acción:** Corregir Spec: "15 stores" → "18 stores", y remover `usePOSCart` de la lista de stores.

---

### 🔴 Gap B — CA-04 (window.onerror + unhandledrejection) no implementado

| Artefacto | Estado |
|-----------|--------|
| Spec | ✅ Definido en sección "Puntos de inyección → 4. Errores globales" |
| Plan | ❌ **No aparece en ninguna sección del plan** |
| Tasks | ❌ **No hay tarea para agregar window.onerror** |

**Impacto:** Alto. Un requerimiento explícito de la especificación queda fuera.

**Acción:** Añadir en Plan (sección 3.4 App.tsx) y crear tarea `T15b` en Tasks.

```
// En App.tsx, al inicio del componente:
useEffect(() => {
  const handler = (event: ErrorEvent) => {
    log.error('window.onerror', {
      mensaje: event.message,
      archivo: event.filename,
      linea: event.lineno,
      columna: event.colno,
      error: event.error?.stack,
    })
  }
  const rejectionHandler = (event: PromiseRejectionEvent) => {
    log.error('unhandledrejection', {
      motivo: event.reason?.message ?? event.reason,
      stack: event.reason?.stack,
    })
  }
  window.addEventListener('error', handler)
  window.addEventListener('unhandledrejection', rejectionHandler)
  return () => {
    window.removeEventListener('error', handler)
    window.removeEventListener('unhandledrejection', rejectionHandler)
  }
}, [])
```

---

### 🔴 Gap C — useActionLogger creado pero nunca aplicado

| Artefacto | Estado |
|-----------|--------|
| Spec | ✅ "Hook `useActionLogger` que se usa en las vistas/envío de formularios" |
| Plan | ✅ Creado en sección 2.3 |
| Tasks | ⚠️ T03 lo crea, **pero ninguna tarea lo aplica en vistas** |

**Impacto:** Medio. El hook existe pero queda inerte. Las vistas (`POSView.tsx`, `CashFlowView.tsx`, `InventoryView.tsx`) no se modifican para usarlo.

**Acción:** Añadir tareas para aplicar `useActionLogger` en botones críticos:
- `POSView.tsx`: botón "Facturar" (handleCobrar)
- `CashFlowView.tsx`: botones "Abrir Turno", "Cerrar Turno"
- `AperturaCajaModal.tsx`, `CierreCajaModal.tsx`: submits

---

### 🟡 Gap D — Cadena de dependencias incorrecta en Tasks

| Artefacto | Dice | Realidad |
|-----------|------|----------|
| Tasks header | `T01 ← T02 ← T03 ← (T04–T13) ← T14 ← T15 ← T16` | T13 no existe como rango de stores (el último store task es T10). T12-T14 son hooks. |

**Cadena correcta:**
```
T01 ← T02 ← T03 ← (T04–T10 en paralelo) ← T11 ← (T12, T13, T14 en paralelo) ← T15 ← T16 ← (T17, T18 en paralelo)
```

**Impacto:** Bajo. Solo documentación.

**Acción:** Corregir cadena en Tasks header.

---

### 🟡 Gap E — Cobertura parcial de servicios

| Artefacto | Dice | Realidad |
|-----------|------|----------|
| Spec | "7 servicios: posService, cashService, inventoryService, b2bService, payrollService, warehouseService, localDb" | |
| Plan | Solo `LoggableDataService` (wraps IDataService) | |

**Análisis por servicio:**

| Servicio | Usa IDataService? | Cubierto por LoggableDataService? |
|----------|------------------|-----------------------------------|
| `posService` (PosService class) | ✅ Sí | ✅ Indirectamente |
| `posService` (pure functions: `calcularTotalLinea`, `calcularTotalesPedido`) | ❌ No | ❌ **No cubierto** |
| `cashService` (LegacyCashService) | ❌ Usa localDb directo | ❌ **No cubierto** |
| `cashService` (CashService new) | ✅ Sí | ✅ Indirectamente |
| `inventoryService` | ❓ | ❓ |
| `b2bService` | ❓ | ❓ |
| `payrollService` | ❓ | ❓ |
| `warehouseService` | ❓ | ❓ |
| `localDb` | ❌ API directa a localStorage | ❌ **No cubierto** |

**Impacto:** Medio-alto. Las funciones puras (`calcularTotalLinea`) y `localDb` son puntos ciegos.

**Acción:** Decidir si se envuelven manualmente:
- `posService.calcularTotalLinea` y `calcularTotalesPedido`: llamadas desde `usePOSCart`, ya cubiertas por el hook logger (T12)
- `localDb.load/save`: cubrir con wrapper manual dentro del logger (log de operación)

---

### 🟡 Gap F — Niveles por módulo sin mecanismo de asignación

| Artefacto | Estado |
|-----------|--------|
| Spec | ✅ "Niveles por módulo: localDb=DEBUG, stores UI=INFO, servicios=INFO" |
| Plan | ❌ **No define cómo el logger sabe qué nivel asignar a cada módulo** |
| Tasks | ❌ **No hay implementación del mapeo módulo→nivel** |

**Acción:** Añadir en `createLogger`:

```ts
const MODULE_LEVELS: Record<string, LogLevel> = {
  DataService: 'DEBUG',
  localDb: 'DEBUG',
  Store: 'DEBUG',
  POSCart: 'INFO',
  POSPrinter: 'INFO',
  Balanza: 'INFO',
  App: 'INFO',
  POS: 'INFO',
}

function createLogger(modulo: string) {
  const defaultLevel = MODULE_LEVELS[modulo] ?? 'INFO'
  // ...
}
```

---

### 🟢 Gap G — Checklist desactualizado

**Checklist** fue creado antes de Plan y Tasks. Sus items no referencian ni validan el plan o las tareas.

**Impacto:** Bajo. Los criterios de calidad (A-H) ya fueron resueltos.

**Acción:** Añadir sección de validación cruzada al checklist referenciando Plan y Tasks IDs.

---

## 3. Resumen de acciones correctivas

| Gap | Severidad | Acción | Archivo a modificar |
|-----|-----------|--------|---------------------|
| **A** | Bajo | Corregir "15 stores" → "18 stores", remover usePOSCart de lista | `console-logger-spec.md` |
| **B** | 🔴 Alto | Añadir window.onerror + unhandledrejection handlers | `implementation-plan.md` + `tasks-breakdown.md` |
| **C** | 🔴 Medio | Añadir tareas para aplicar useActionLogger en vistas | `tasks-breakdown.md` |
| **D** | Bajo | Corregir cadena de dependencias en header | `tasks-breakdown.md` |
| **E** | 🟡 Medio | Decidir cobertura de servicios no-IDataService | `implementation-plan.md` |
| **F** | 🟡 Medio | Añadir mapeo módulo→nivel en createLogger | `implementation-plan.md` + `tasks-breakdown.md` (T01) |
| **G** | Bajo | Actualizar checklist con referencias a Plan/Tasks | `quality-checklist.md` |

---

## 4. Veredicto final

| Dominio | Estado |
|---------|--------|
| **Trazabilidad** (Spec→Plan) | ⚠️ 2 desviaciones (CA-03, CA-04) |
| **Trazabilidad** (Plan→Tasks) | ⚠️ 1 omisión (error handlers) |
| **Consistencia numérica** | ⚠️ 3 discrepancias (stores count, task range, service coverage) |
| **Integridad funcional** | ⚠️ CA-04 no cubierto, useActionLogger no aplicado |

**Veredicto: NO APROBADO** — reparar Gaps A-F antes de implementar.

**Acción requerida:** ¿Procedemos a corregir los 7 gaps identificados?
