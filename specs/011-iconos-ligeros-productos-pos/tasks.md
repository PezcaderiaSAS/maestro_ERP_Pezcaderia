# Lista de Tareas Brownfield SDD 011: Iconos Ligeros y Visualización Semántica POS

- [x] **Tarea 1: Enriquecimiento del Motor Visual Semántico (`productVisualGenerator.ts`)**
  - [x] **T-1.1:** Implementar la Taxonomía Marina de 6 Familias en `classifyProductVisualTheme` separando Camarón/Crustáceo de otros Mariscos/Moluscos y puliendo palabras clave.
  - [x] **T-1.2:** Agregar siluetas SVG vectoriales específicas para cada una de las 6 familias con gradientes suaves y alto contraste WCAG AA+.
  - [x] **T-1.3:** Implementar helper `isExternalPlaceholder(url?: string): boolean` para detectar URLs de Unsplash o cadenas vacías.
  - [x] *Criterio de Aceptación / QA Gate:* Tests unitarios en `productVisualGenerator.test.ts` pasando al 100%.

- [x] **Tarea 2: Creación del Componente Modular `ProductAvatar.tsx`**
  - [x] **T-2.1:** Crear `src/components/common/ProductAvatar.tsx` con manejo de estados de carga, prop `size` (`sm`, `md`, `lg`, `xl`, `full`) y fallback automático ante fallos de carga (`onError`).
  - [x] **T-2.2:** Integrar micro-animación sutil y estilo visual Light Mode con bordes y contraste nítido.
  - [x] *Criterio de Aceptación / QA Gate:* Componente tipado con TypeScript estricto, sin any y con accesibilidad `alt` / `aria-label`.

- [x] **Tarea 3: Integración en POS y Optimización de Densidad Táctil (`ProductSearchPanel.tsx`)**
  - [x] **T-3.1:** Sustituir la etiqueta `<img>` pesada por `<ProductAvatar />` en las tarjetas de producto de `ProductSearchPanel.tsx`.
  - [x] **T-3.2:** Ajustar las proporciones del contenedor `.product-image-container` en `src/index.css` para una visualización más compacta y mayor densidad táctil en pantallas de cajero.
  - [x] *Criterio de Aceptación / QA Gate:* Visualización ágil de productos en el catálogo de ventas sin peticiones de red hacia Unsplash.

- [x] **Tarea 4: Limpieza de Placeholders en Catálogo Semilla (`App.tsx` & Vistas Secundarias)**
  - [x] **T-4.1:** Limpiar URLs de Unsplash en `INITIAL_PRODUCTS` de `src/App.tsx`.
  - [x] **T-4.2:** Integrar `<ProductAvatar />` en `ProductTable.tsx` y `ProductDetailFinancialModal.tsx` para productos sin imagen.
  - [x] *Criterio de Aceptación / QA Gate:* Cero peticiones de red hacia Unsplash en la carga de la aplicación.

- [x] **Tarea 5: Suite de Pruebas Unitarias TDD y Auditoría DevTools en Vivo**
  - [x] **T-5.1:** Actualizar y expandir `src/tests/productVisualGenerator.test.ts` cubriendo las 6 familias, iniciales y detección de placeholders.
  - [x] **T-5.2:** Ejecutar Vitest y asegurar que el 100% de tests continúen verdes.
  - [x] **T-5.3:** Auditar en Chrome DevTools MCP en resolución de escritorio y móvil (375 px) verificando **0 errores y 0 warnings en consola JS**.
  - [x] **T-5.4:** Sincronizar `MEMORY.md` y documentar en `CHANGELOG_AGENTS.md`.
