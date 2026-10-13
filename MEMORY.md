# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Light Mode WCAG AA+ & SDD 006 a 011 Completados)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) de alto contraste con tokens WCAG 2.2 AA+ (`.agents/skills/erp-pos-design-tokens/SKILL.md`).
- **Verificación Completa:**
  - 54 suites de prueba ejecutadas al 100% (**364/364 tests verdes en Vitest**).
  - TypeScript estricto con **0 errores (`tsc --noEmit`)**.
  - **Bucle DevTools MCP en Vivo:** Verificado en escritorio y móvil (375 px) con **0 errores en consola JS**.

## SDD 011: Iconos Ligeros y Visualización Semántica POS (Completado)
- **Modo Híbrido Inteligente (0ms & 100% Offline):**
  - Componente universal `ProductAvatar.tsx` (`sm`, `md`, `lg`, `xl`, `full`) con fallback resiliente ante errores de carga (`onError`).
  - Detección activa y sustitución inmediata de placeholders de Unsplash vía `isExternalPlaceholder`.
- **Taxonomía Marina de 6 Familias (`productVisualGenerator.ts`):**
  - Camarones/Crustáceos (coral/naranja), Mariscos/Moluscos (púrpura/ámbar), Pescados Enteros (cyan/azul océano), Filetes/Cortes (esmeralda/teal), Congelados/IQF (azul hielo), Insumos/Empaques (slate neutro).
  - Siluetas vectoriales SVG dedicadas + extracción determinista de iniciales (2-3 letras) omitiendo conectores y calibres numéricos.
- **Optimización de Densidad Táctil:**
  - `ProductSearchPanel.tsx`: Aspect-ratio 1.35 (max-height 110px) en `.product-image-container` para ver más filas de productos en pantallas táctiles de mostrador.
  - Integración en catálogo POS, tabla de inventario (`ProductTable.tsx`) y modal financiero (`ProductDetailFinancialModal.tsx`).

## SDD 010: Inventario Multi-Sucursal, Abastecimiento y Reportes POS (Completado)
- **Flujo Dual & Control de Stock:** Traslado rápido en `BucaramangaReceivingWizard.tsx`, reporte en `InventoryView.tsx`, bypass guiado en POS.
- **Servicios Transaccionales:** `branchInventoryService.ts`, `branchReportsService.ts` con redondeo entero COP (`Math.round`).

## Automatización de Ciclo de Vida Git (Hooks & Token-Saving Triad)
- **Pipeline de Activación:**
  - `git pull` / `.husky/post-merge` (`session:pull`): Graphify, GitNexus, `tsc`, Vite (3000).
  - `git push` / `.husky/pre-push` (`session:push`): Quality Gate con `tsc --noEmit`, Vitest (364 tests) y GitNexus.
- **Tríada Canónica de Ahorro de Tokens:** Graphify (`graphify query`), GitNexus (`gitnexus impact / detect-changes`), Agency Swarm (`/swarm`).
