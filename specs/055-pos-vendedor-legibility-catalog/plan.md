# Plan de Implementación Técnica - SPEC-055

## 1. Alcance y Arquitectura de la Solución

El objetivo es corregir el problema de ilegibilidad en el catálogo de productos de la vista del vendedor POS, restaurando el contraste de los textos, purgando las reglas destructivas de `src/index.css`, y garantizando un layout Dark Glassmorphism elegante, ergonómico y con contraste WCAG AAA.

### Archivos Afectados
1. `src/index.css`:
   - Corregir `.product-card-name`: eliminar `color: #0f172a !important;` y definir color blanco `#FFFFFF` / `var(--text-primary)` con alta especificidad o soporte dark mode.
   - Corregir `.product-image-container`: eliminar `background-color: #F1F5F9;` y reemplazar por fondo oscuro translúcido `rgba(2, 6, 23, 0.4)` / `var(--bg-card-dark)`.
   - Corregir `.product-card-price-tag`: eliminar `background-color: #0f172a !important;` para permitir que el precio sea vibrante y legible.
2. `src/components/common/ProductAvatar.tsx`:
   - Enriquecer `ProductAvatar` para que en modo vectorOnly aplique fondos sutiles con soporte dark mode (`bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30`) manteniendo 100% de compatibilidad con las aserciones de pruebas existentes (`expect(...).toContain('bg-emerald-50')`).
3. `src/views/pos/components/ProductSearchPanel.tsx`:
   - Asegurar que `.product-card` tenga dimensiones balanceadas (`min-h-[110px]` o `min-h-[120px]`), evitando que el contenedor de imagen asfixie el panel de información.
   - Reforzar clases de texto en `product-card-name` (`text-white font-bold text-xs sm:text-sm line-clamp-2` para nombres largos).
   - Asegurar que el precio destaque en verde esmeralda (`text-emerald-400 font-extrabold`) y el stock sea legible en gris claro / verde según estado.
4. `src/tests/posCatalogVendedorLegibility.test.tsx`:
   - Nueva suite de pruebas unitarias y de integración que verifique:
     - Nombre de producto visible con clase `text-white` o color blanco.
     - Contenedor de imagen no blanco `#F1F5F9`.
     - Precio en verde esmeralda / blanco con alto contraste.
     - Altura mínima ergonómica $\ge 110\text{px}$.
     - 0 etiquetas `<img>` (regla 12 años).

---

## 2. Fases de Implementación (WIP = 1)

1. **Fase 1 (Pruebas TDD - RED):** Crear `src/tests/posCatalogVendedorLegibility.test.tsx` con pruebas que reproduzcan y capturen los requerimientos de legibilidad de SPEC-055.
2. **Fase 2 (Corrección de Tokens en index.css):** Purgar `#0f172a !important` en `.product-card-name` y `background-color: #F1F5F9` en `.product-image-container`.
3. **Fase 3 (Armonización en ProductAvatar.tsx):** Sintonizar variantes dark/abisal en `ProductAvatar` preservando clases de compatibilidad de tests.
4. **Fase 4 (Ajuste Ergonómico en ProductSearchPanel.tsx):** Configurar layout de tarjeta, altura mínima, jerarquía tipográfica y legibilidad de stock.
5. **Fase 5 (Quality Gate y Verificación):** Ejecutar `tsc --noEmit`, suite completa Vitest (231+ suites pasando) y comprobación de blast radius con GitNexus.

