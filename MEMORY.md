# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Sesión Activa 2026-10-14 - Entorno 100% Sincronizado)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados.
- **Git & Lifecycle Post-Pull:** Sincronizado con `origin/main` (222 archivos actualizados, árbol limpio).
- **Herramientas & Agentes en Marcha:**
  - Agency Swarm en Python 3.12 (`tools/agency-swarm/`) con 4 agentes especializados (architect, data, ui, quality) operativos.
  - Impeccable UI Engine v0.1.14 y agentes integrados en `.agents/`.
  - GitNexus AST Index actualizado (152.678 nodos, 282.373 relaciones, 300 flujos).
  - Dev Server Vite activo en `http://127.0.0.1:3000/`.
- **Verificación Completa:**
  - TypeScript estricto con **0 errores (`tsc --noEmit`)**.
  - Suites de prueba Vitest pasando al 100% (POS precios, redondeo entero COP, IVA, ciclo E2E y stock multisucursal).
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

## SDD 012: Despachos B2B, Rutas de Entrega & Continuous-Kanban-Flow (En Progreso)
- **Flujo Operativo Mandatorio Integrado:** `Continuous-Kanban-Flow` + `/grill-me` permanente.
  - Modelo: Flujo continuo sin sprints fijos, sin roles tradicionales, con **Límite WIP = 1**.
  - Tríada de Gobernanza: 6 Documentos Base $\rightarrow$ Interrogatorio Permanente `/grill-me` $\rightarrow$ Flujo Kanban Visual con Límite WIP.
- **Cola Priorizada:** 8 tarjetas atómicas (`CARD-012-01` a `08`). `CARD-012-01` a `05` (Done: 50 tests verdes, `tsc --noEmit` 0 errores, DevTools 375px verificado).
- **Tareas Pendientes (Próxima Sesión post `git pull`):**
  1. `CARD-012-06:` Modal de Liquidación de Tesorería (`RouteSettlementModal`) e integración con `cashService` (WIP = 1).
  2. `CARD-012-07:` Tablero de Gobernanza y Métricas OTIF (`DeliveryGovernanceTab`) con exportación Excel/PDF.
  3. `CARD-012-08:` Bucle DevTools MCP en Vivo, E2E Final y Quality Gate Pre-Push (`npm run session:push`).

## Protocolo Constitucional Mandatorio: Spec Kit (SDD v3.0) & Kanban
- **Regla Innegociable:** Cero código sin los 6 documentos validados $\rightarrow$ 1 sola tarea a la vez en `In Progress` $\rightarrow$ Validación DevTools (0 errores, 375 px) $\rightarrow$ Esperar aprobación antes de pasar a `Done`.

## Pipeline de Ciclo de Vida Git (Hooks & Token-Saving Triad)
- **Sincronización:** `npm run session:pull` (Post-Pull) y `npm run session:push` (Pre-Push Quality Gate).
- **Tríada Canónica:** Graphify (`query`), GitNexus (`impact/detect-changes`), Agency Swarm (`/swarm`).
- **Estado de Cierre:** Entorno 100% verificado, TypeScript 0 errores, Vitest 100% verde y Dev Server activo.

