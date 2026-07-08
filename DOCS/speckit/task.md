# Lista de Tareas (Task Tracker) — Corrección Grid POS (v2.1 — Post-Auditoría)

> Actualizado tras Control de Calidad 2. Se amplía Tarea 3 para cubrir los **dos contenedores** `pos-layout` detectados en `POSView.tsx`.

---

## Fase 1: Limpieza de Estilos Globales

- [ ] **Tarea 1: Limpiar `src/index.css`**
  - [ ] 1.1 — Localizar el bloque `.pos-layout { ... }` y eliminar las propiedades estructurales:
    - `display: flex;`
    - `flex: 1;`
    - `overflow: hidden;`
    - `height: calc(100vh - 64px);`
  - [ ] 1.2 — Localizar el bloque `.pos-products-grid { ... }` y eliminar las propiedades estructurales:
    - `display: grid;`
    - `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));`
    - `grid-auto-rows: max-content;`
    - `gap: 16px;`
    - `overflow-y: auto;`
    - `padding-bottom: 24px;`
    - (Mantener únicamente `flex: 1;` si algún selector lo requiere, o vaciar el bloque).

---

## Fase 2: Retrocompatibilidad de Vistas Secundarias

- [ ] **Tarea 2: Ajustar `src/views/ARView.tsx` (L371)**
  - [ ] 2.1 — En el `div` de la línea 371, agregar la clase utilitaria `flex` explícita de Tailwind:
    - **Antes:** `className="pos-layout animate-fade-in"`
    - **Después:** `className="pos-layout flex animate-fade-in"`
  - [ ] 2.2 — Verificar que el estilo inline `style={{ flexDirection: 'column', ... }}` siga presente y sea suficiente para mantener el layout vertical de esa vista.

---

## Fase 3: Refactorización de `src/views/POSView.tsx` (2 contenedores)

- [ ] **Tarea 3a: Contenedor Raíz del POS (L1136) — Shell Principal**
  - [ ] 3a.1 — Modificar el `div` raíz de retorno del componente:
    - **Antes:** `className="pos-layout animate-fade-in relative"` + `style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}`
    - **Después:** `className="pos-layout w-full h-full flex flex-col overflow-hidden gap-4 animate-fade-in relative"` — sin el atributo `style` de display.

- [ ] **Tarea 3b: Contenedor del Grid Catálogo+Carrito (L1328) — Sub-vista `venta_pos`**
  - [ ] 3b.1 — Modificar el `div` contenedor del grid responsivo:
    - **Antes:** `className="pos-layout min-h-[calc(100vh-130px)] lg:h-[calc(100vh-64px)] lg:overflow-hidden animate-fade-in flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-4 lg:gap-5 w-full m-0 p-0 bg-transparent shadow-none border-none pt-2"`
    - **Después:** `className="flex-1 min-h-0 w-full flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-4 overflow-hidden pt-2"` *(sin `pos-layout`, que ya está en el shell raíz)*

- [ ] **Tarea 3c: Contenedor del Carrito (L1340) — `pos-sidebar-cart`**
  - [ ] 3c.1 — Modificar el `div` del panel lateral del carrito:
    - **Antes:** `className="pos-sidebar-cart flex-none h-[75vh] lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"`
    - **Después:** `className="pos-sidebar-cart flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full min-h-0"`

---

## Fase 4: Estabilización del Catálogo de Productos

- [ ] **Tarea 4: Ajustar `src/views/pos/components/ProductSearchPanel.tsx`**
  - [ ] 4.1 — Modificar el contenedor `pos-catalog` (L106):
    - **Antes:** `className="pos-catalog flex-1 lg:flex-none h-full lg:h-full flex flex-col overflow-hidden"`
    - **Después:** `className="pos-catalog flex-1 flex flex-col overflow-hidden min-h-0"`
  - [ ] 4.2 — Modificar el contenedor `pos-products-grid` (L170):
    - **Antes:** `className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4"`
    - **Después:** `className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4 min-h-0"`

---

## Fase 5: Verificación y Validación

- [ ] **Tarea 5: Testing de Integridad**
  - [ ] 5.1 — Ejecutar compilación estática TypeScript sin errores: `npx.cmd tsc --noEmit`
  - [ ] 5.2 — Ejecutar suite de tests unitarios del POS: `npx.cmd vitest run src/tests/usePOSCart.test.ts`
  - [ ] 5.3 — Verificar visualmente en el navegador que:
    - En escritorio (1920px): catálogo 70% a la izquierda con 4 columnas de productos, carrito 30% a la derecha.
    - El scroll del catálogo es independiente y no desborda la pantalla principal.
    - Al reducir el viewport a < 1024px, los paneles se apilan verticalmente.
