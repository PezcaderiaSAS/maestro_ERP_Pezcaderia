# Tareas Atómicas de Implementación - SPEC-055

- [x] **TASK-055-01 (TDD Test Suite):** Crear suite `src/tests/posCatalogVendedorLegibility.test.tsx` cubriendo contraste tipográfico, eliminación de fondos deslumbrantes, altura táctil y visualización nítida del precio.
- [x] **TASK-055-02 (CSS Token Purge):** Modificar `src/index.css` eliminando `.product-card-name { color: #0f172a !important; }`, `.product-image-container { background-color: #F1F5F9; }` y actualizando estilos a Dark Glassmorphism.
- [x] **TASK-055-03 (Avatar Dark Optimization):** Actualizar `src/components/common/ProductAvatar.tsx` para incorporar clases abisales sin romper compatibilidad con tests previos.
- [x] **TASK-055-04 (Catalog Grid & Card Ergonomics):** Refactorizar `src/views/pos/components/ProductSearchPanel.tsx` para asegurar que el nombre del producto, precio y stock sean 100% legibles y el layout no se comprima, con `line-clamp-1`.
- [x] **TASK-055-05 (Quality Gate & Verification):** Ejecutar `tsc --noEmit`, correr todas las suites Vitest (100% verdes) y verificar blast radius con GitNexus.
