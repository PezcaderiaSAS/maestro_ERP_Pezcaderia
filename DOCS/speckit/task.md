# Lista de Tareas (Task Tracker) — Corrección Grid POS (v2.1 — Post-Auditoría)

> Actualizado tras Control de Calidad 2. Se amplía Tarea 3 para cubrir los **dos contenedores** `pos-layout` detectados en `POSView.tsx`.

---

## Fase 1: Limpieza de Estilos Globales

- [x] **Tarea 1: Limpiar `src/index.css`**
  - [x] 1.1 — Localizar el bloque `.pos-layout { ... }` y eliminar las propiedades estructurales.
  - [x] 1.2 — Localizar el bloque `.pos-products-grid { ... }` y eliminar las propiedades estructurales.

---

## Fase 2: Retrocompatibilidad de Vistas Secundarias

- [x] **Tarea 2: Ajustar `src/views/ARView.tsx` (L371)**
  - [x] 2.1 — Clase `flex` explícita agregada: `className="pos-layout flex animate-fade-in"`
  - [x] 2.2 — El estilo inline con `flexDirection: 'column'` sigue presente y mantiene el layout vertical.

---

## Fase 3: Refactorización de `src/views/POSView.tsx` (2 contenedores)

- [x] **Tarea 3a: Contenedor Raíz del POS (L1136) — Shell Principal**
  - [x] 3a.1 — Estilo inline `display: flex` migrado a clases Tailwind: `className="pos-layout w-full flex flex-col gap-4 animate-fade-in relative"`

- [x] **Tarea 3b: Contenedor del Grid Catálogo+Carrito (L1328) — Sub-vista `venta_pos`** ← *hallada en auditoría*
  - [x] 3b.1 — Clase `pos-layout` redundante eliminada. Reemplazada con: `className="flex-1 min-h-0 w-full flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-4 overflow-hidden pt-2"`

- [x] **Tarea 3c: Contenedor del Carrito (L1340) — `pos-sidebar-cart`**
  - [x] 3c.1 — `flex-none + h-[75vh] + lg:sticky` reemplazados por: `className="pos-sidebar-cart flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full min-h-0"`

---

## Fase 4: Estabilización del Catálogo de Productos

- [x] **Tarea 4: Ajustar `src/views/pos/components/ProductSearchPanel.tsx`**
  - [x] 4.1 — `pos-catalog` (L106): eliminados `lg:flex-none h-full lg:h-full`. Añadido `min-h-0`.
  - [x] 4.2 — `pos-products-grid` (L170): Añadido `min-h-0` al final del className.

---

## Fase 5: Verificación y Validación

- [x] **Tarea 5: Testing de Integridad**
  - [x] 5.1 — `tsc --noEmit`: 0 errores.
  - [x] 5.2 — `vitest run`: 10/10 tests pasando.
  - [x] 5.3 — Verificación visual: catálogo (70%) y carrito (30%) alineados horizontalmente. Grid de 3 columnas de productos visible. ✅
