# Reporte de Auditoría Cruzada: Spec → Plan → Tasks (v2.0)
## Control de Calidad 2 — Pre-Ejecución

---

## Estado General del Pipeline

| Artefacto | Archivo | Estado |
|---|---|---|
| Especificación | `DOCS/speckit/speckit_specification.md` | ✅ Completo |
| Plan de Implementación | `DOCS/speckit/implementation_plan.md` | ✅ Completo |
| Lista de Tareas | `DOCS/speckit/task.md` | ✅ Completo |
| Checklist de Calidad | `DOCS/speckit/speckit_checklist.md` | ✅ Completo |

---

## Hallazgos del Grafo de Dependencias

### Dependencias de `ARView.tsx` — **Hallazgo Crítico Confirmado**
El grafo revela que `ARView.tsx` no sólo usa la clase `.pos-layout`, sino que también es **importado directamente por `POSView.tsx`** (relación `imports_from`). La Tarea 2 cubre correctamente la corrección, pero debe ejecutarse **antes** que la Tarea 3 para evitar una ventana de incompatibilidad temporal durante el desarrollo.

> **Resolución:** Las tareas están numeradas en el orden correcto (Tarea 2 antes de Tarea 3). ✅

### Dependencias de `POSView()` — 8+ Conexiones a Stores de Zustand
El componente `POSView()` llama a 8+ stores de Zustand. Ninguno de estos stores gestiona estado visual de layout; son puramente de datos. Por lo tanto, la refactorización de las clases CSS en el JSX **no afectará** ningún store ni ninguna lógica de negocio.

> **Resolución:** Riesgo de regresión en lógica de negocio = **Nulo**. ✅

### `CartPanel.tsx` — Dependencia No Contemplada en el Plan
El grafo muestra que `CartPanel.tsx` tiene 14 relaciones (botones de acción, stores de datos, tipos de POS). El plan menciona modificar el contenedor `.pos-sidebar-cart` que **envuelve** a `CartPanel` en `POSView.tsx`, pero **no toca el interior** del componente `CartPanel.tsx`.

> **Resolución:** Cambio seguro y acotado. No se requiere modificar `CartPanel.tsx`. ✅

---

## Auditoría de Consistencia: Spec vs. Plan vs. Tasks

### ✅ ALINEADO: Causa Raíz y Estrategia de Solución
- **Spec** identifica correctamente el conflicto de especificidad CSS como causa raíz.
- **Plan** traduce esto en acciones concretas: limpiar `index.css` y migrar a Tailwind utilitario puro.
- **Tasks** descompone el Plan en pasos quirúrgicos y accionables con líneas de código específicas.

### ✅ ALINEADO: Archivo `.pos-catalog` (ProductSearchPanel.tsx L106)
- **Real en código:** `className="pos-catalog flex-1 lg:flex-none h-full lg:h-full flex flex-col overflow-hidden"`
- **Tarea 4 propone:** `className="pos-catalog flex-1 flex flex-col overflow-hidden min-h-0"`
- **Análisis:** La clase `lg:flex-none` y los `h-full` redundantes serán removidos. El cambio es correcto y mejora la contención.

### ✅ ALINEADO: Archivo `.pos-products-grid` (ProductSearchPanel.tsx L170)
- **Real en código:** `className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4"`
- **Tarea 4 propone:** agregar `min-h-0` al final.
- **Análisis:** Cambio mínimo y correcto. No se alteran clases de Tailwind responsivas existentes.

### ✅ ALINEADO: Archivo `.pos-sidebar-cart` (POSView.tsx L1340)
- **Real en código:** `className="pos-sidebar-cart flex-none h-[75vh] lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] flex flex-col ..."`
- **Tarea 3 propone:** `className="pos-sidebar-cart flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full min-h-0"`
- **Análisis:** Se elimina el `flex-none` que previene el crecimiento del carrito, los `lg:sticky` y el cálculo manual de altura. La propuesta es correcta.

### ⚠️ FISURA DETECTADA: Doble uso de `.pos-layout` en el JSX de `POSView.tsx`
El Plan y las Tareas asumen un solo contenedor con la clase `pos-layout`. Sin embargo, el código real tiene **dos contenedores** con esta clase en el mismo árbol de `POSView.tsx`:
1. **L1136** — El contenedor raíz: `className="pos-layout animate-fade-in relative"` (shell del POS).
2. **L1328** — El contenedor de la sub-vista `venta_pos`: `className="pos-layout min-h-... lg:grid ..."`.

El Plan y las Tareas solo mencionan modificar uno de los dos. Si se limpia `index.css` y se olvida el contenedor en L1328, la rejilla podría perder el `display` que hoy hereda de CSS y quedar sin estilos visibles.

> **Fisura Confirmada:** Tarea 3 debe ser dividida o ampliada para cubrir **ambos** contenedores.

---

## Recomendaciones Finales

| # | Tipo | Acción |
|---|---|---|
| 1 | 🔴 Corrección | **Ampliar Tarea 3** para incluir explícitamente la modificación del contenedor L1328 (`pos-layout min-h-...`), que es el contenedor de la sub-vista y el origen real del grid vertical/horizontal. |
| 2 | 🟡 Preventivo | Al limpiar `.pos-layout` en `index.css`, verificar que el contenedor raíz en L1136 no pierda su estructura de columna flexible; debe tener `flex flex-col` explícito como clases Tailwind. |
| 3 | 🟢 Confirmado | El orden de ejecución (ARView → CSS → POSView → ProductSearchPanel → Tests) es correcto y seguro. |

---

## Dictamen de Calidad

El pipeline Spec → Plan → Tasks está **técnicamente consistente** con una excepción de riesgo medio (la doble ocurrencia de `.pos-layout` en `POSView.tsx`). El plan actualizado cubriendo los dos contenedores está listo para ejecución.

**Estado: ✅ LISTO PARA EJECUCIÓN — con la ampliación de Tarea 3 incorporada.**
