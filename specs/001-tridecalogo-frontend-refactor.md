# Especificación Técnica SDD: Refactorización Integral Frontend
## Adopción del Tridecálogo Canónico del CSS Moderno & Arquitectura Visual
**ID:** SPEC-001-TRIDECALOGO-FRONTEND  
**Fecha:** 28 de Septiembre de 2026  
**Estatus:** APROBADA (Vía /grill-me)  
**Autor:** `@agency-ui-finish-gate-reviewer`, `@agency-software-architect`, `@agency-test-automation-engineer`  
**Objetivo:** Auditar, refactorizar y certificar todos los componentes y estilos del frontend de `maestro_ERP_Pezcaderia` contra las 13 reglas inmutables de CSS moderno.

---

## 1. Diagnóstico y Hallazgos del Codebase Actual

| Directiva del Tridecálogo | Estado Inicial | Hallazgo en Código | Acción de Refactorización |
| :--- | :--- | :--- | :--- |
| **1. `@layer` Specificity** | ⚠️ Parcial | Tailwind base/components/utilities presentes, pero sin capas declaradas explícitamente en `src/index.css`. | Añadir `@layer base, components, utilities;` para control determinista. |
| **2. `isolation: isolate` vs `z-index: 9999`** | ❌ Infracción | Modales con `z-[999]` (`CrearProveedorRapidoModal`, `CrearProductoRapidoModal`) y `.mobile-overlay` con `z-index: 999;`. Modales sin `isolate`. | Eliminar `z-[999]` -> Migrar a `isolate z-50` con stacking context limpio. |
| **3. Erradicación de Márgenes en Hijos** | ✅ Conforme | El proyecto utiliza predominantemente `gap` en contenedores flex y grid. | Mantener y blindar contra regresiones en componentes dinámicos. |
| **4. `height: 100%` vs `min-height: 100dvh`** | ⚠️ Parcial | `.sidebar` en `src/index.css` usaba `height: 100%` y algunos modales usaban `min-h-screen`. | Migrar a `min-h-dvh` en modales y `.sidebar` para adaptabilidad a viewport dinámico. |
| **5. Centrado Moderno de Una Línea** | ⚠️ Parcial | Iconos de búsqueda con `top-1/2 -translate-y-1/2`. Modales con estructura flex. | Estandarizar modales y contenedores a `grid place-items-center` o `flex items-center justify-center`. |
| **6. Tipografía Fluida con `clamp()`** | ❌ Ausente | Encabezados estáticos sin funciones `clamp()` de escalado continuo. | Inyectar tokens de tipografía fluida `clamp()` en títulos H1-H3. |
| **7. CSS Anchor Positioning** | ❌ Ausente | Tooltips y menús desplegables dependientes de JavaScript flotante. | Definir utilidades CSS para Anchor Positioning (`anchor-name`, `position-anchor`). |
| **8. Selector Padre `:has()`** | ❌ Ausente | Formularios y tarjetas sin estilado relacional declarativo. | Agregar soporte `form:has(:invalid)` y tarjetas condicionales `card:has(img)`. |
| **9. CSS View Transitions API** | ❌ Ausente | Navegación entre vistas sin animación nativa a nivel de plataforma. | Activar `@view-transition { navigation: auto; }` y `view-transition-name: hero`. |
| **10. Container Queries (`@container`)** | ❌ Ausente | `FluidResponsiveCard` dependía de media queries globales (`md:`). | Integrar `@container` en contenedores de tarjeta y `@md:` en layouts hijos. |
| **11. `text-wrap: balance` & `pretty`** | ❌ Ausente | Encabezados y modales con líneas huérfanas de una sola palabra (*widows*). | Aplicar `text-wrap: balance` a `h1, h2, h3` y `text-wrap: pretty` a `p` globalmente. |
| **12. CSS Nesting Nativo** | ⚠️ Parcial | Estilos SCSS-like dispersos en hojas secundarias. | Estandarizar CSS Nesting nativo en `src/index.css` sin preprocesadores. |
| **13. CSS Subgrid (`subgrid`)** | ❌ Ausente | Cuadrículas de productos con botones desfasados por títulos de varias líneas. | Implementar `grid-template-rows: subgrid` en tarjetas de catálogo y KPI. |

---

## 2. Plan de Refactorización por Fases

### Fase 1: Núcleo Global de Estilos (`src/index.css`)
1. Declarar al inicio:
   ```css
   @layer base, components, utilities;
   @view-transition { navigation: auto; }
   ```
2. Inyectar reglas tipográficas base:
   ```css
   @layer base {
     h1, h2, h3, h4, h5, h6 {
       text-wrap: balance;
       letter-spacing: -0.02em;
     }
     p {
       text-wrap: pretty;
     }
   }
   ```
3. Reemplazar `z-index: 999;` en `.mobile-overlay.open` por `isolation: isolate; z-index: 40; min-height: 100dvh;`.
4. Añadir utilidades de Anchor Positioning y Subgrid.

### Fase 2: Componentes Atómicos y Tarjetas
1. [`FluidResponsiveCard.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/components/ui/FluidResponsiveCard.tsx):
   - Envolver el contenedor con `@container`.
   - Reemplazar media queries rígidas de pantalla por container queries `@sm:` / `@md:`.
2. [`DenseTableRow.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/components/ui/DenseTableRow.tsx):
   - Garantizar altura quirúrgica de 28-32px (`h-7` / `h-8`).
   - Aplicar `font-mono` en cifras y códigos.

### Fase 3: Modales y Contexto de Apilamiento (*Stacking Context*)
1. Reemplazar `z-[999]` en:
   - `src/views/inventory/components/CrearProveedorRapidoModal.tsx`
   - `src/views/inventory/components/CrearProductoRapidoModal.tsx`
   Por: `isolate z-50`.
2. Añadir `isolate` y `min-h-dvh` en:
   - `src/components/ui/Modal.tsx`
   - `src/components/legal/ConsentGateModal.tsx`
   - `src/views/cash/components/ArqueoCajaModal.tsx`
   - `src/views/cash/components/CierreCajaModal.tsx`

### Fase 4: Suite Automatizada de Pruebas de Calidad Visual
- Crear `src/tests/tridecalogoCssAudit.test.ts` con Vitest para validar determinísticamente:
  - Presencia de `@layer` y `@view-transition` en `src/index.css`.
  - Ausencia total de `z-index: 999` o `z-[999]` en componentes modales.
  - Presencia de `isolate` en modales críticos.
  - Presencia de `@container` en componentes de tarjeta modular.

---

## 3. Criterios de Aceptación y Calidad (Gating)
- [ ] 0 errores en `npx vitest run`.
- [ ] 0 errores en `npx vite build`.
- [ ] Cero líneas huérfanas en modales gracias a `text-wrap: balance`.
- [ ] Cero interferencias de modales y tooltips gracias a `isolation: isolate`.
