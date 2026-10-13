# Lista de Tareas Brownfield SDD 009: Redondeo Entero COP, Desglose IVA y Diferenciación Unidad vs Kilos

- [x] **Tarea 1: Algoritmos de Precios Enteros y Desglose Determinista de IVA (`posService.ts`)**
  - [x] **T-1.1:** Actualizar `calcularTotalLinea` para aceptar `tarifaIva` e `ivaIncluido` y retornar `baseGravableLinea` y `cuotaIvaLinea` redondeados a enteros.
  - [x] **T-1.2:** Actualizar `calcularTotalesPedido` para acumular `subtotalBaseGravable` y `totalIva` de forma exacta asegurando `base + iva = totalFinal`.
  - [x] **T-1.3:** Crear función auxiliar `calcularCostoProductoDerivado(costoKiloMP: number, gramos: number = 500): number`.
  - [x] *Criterio de Aceptación / QA Gate:* Suite unitaria Vitest con validación del caso $10.000 -> $9.000 con 19% de IVA ($7.563 + $1.437).

- [x] **Tarea 2: Tipos y Normalización en Hook de Carrito (`pos.types.ts` & `usePOSCart.ts`)**
  - [x] **T-2.1:** Extender `LineaVenta` en `src/types/pos.types.ts` con `iva`, `ivaIncluido`, `baseGravableLinea`, `cuotaIvaLinea`.
  - [x] **T-2.2:** En `usePOSCart.ts`, normalizar detección de unidad (`unidadMedida?.toUpperCase() === 'KG' || unidadMedida === 'kg' ? 'KG' : 'UNIDAD'`).
  - [x] **T-2.3:** Integrar `iva` e `ivaIncluido` del catálogo al agregar productos y propagar base e IVA en `actualizarCantidad` y `updateItemPrice`.

- [x] **Tarea 3: Diferenciación Visual en Catálogo (`ProductSearchPanel.tsx`)**
  - [x] **T-3.1:** Renderizar badge de alto contraste: `⚖️ KILOS` (azul) o `📦 UNIDAD` (esmeralda) en cada tarjeta.
  - [x] **T-3.2:** Mostrar precio con unidad explícita: `$XX.XXX / kg` vs `$XX.XXX / und`.
  - [x] **T-3.3:** Rotular el stock en la tarjeta según la unidad (`kg` vs `und` en lugar de `uds` genérico).

- [x] **Tarea 4: Controles Contextuales y Desglose en Carrito (`LineaVentaRow.tsx` & `CartPanel.tsx`)**
  - [x] **T-4.1:** En `LineaVentaRow.tsx`, mostrar badge de unidad `⚖️ KG` o `📦 UND` junto al nombre.
  - [x] **T-4.2:** Ocultar botón de balanza para productos por `UNIDAD` y restringir input de cantidad a pasos enteros (`step="1"`).
  - [x] **T-4.3:** En `CartPanel.tsx` y `DiscountPanel.tsx`, si hay productos con IVA, mostrar el desglose de Base Gravable e IVA en el bloque de totales.

- [x] **Tarea 5: Incorporación de Productos de Prueba (`App.tsx`) y Formato Ticket (`usePOSPrinter.ts`)**
  - [x] **T-5.1:** Agregar en `INITIAL_PRODUCTS` de `src/App.tsx`:
    - `Camarón Crudo 41-50` (Materia Prima, kg, costo $28.500 COP, venta $38.000 COP).
    - `Camarón Crudo 41-50 x 500 gr` (Producto Final, und, costo $14.250 COP derivado de MP, venta $22.000 COP).
  - [x] **T-5.2:** En `usePOSPrinter.ts`, imprimir línea de Base Gravable e IVA Incluido si el pedido tiene impuestos.

- [x] **Tarea 6: Suite de Pruebas Automatizadas TDD y Verificación DevTools**
  - [x] **T-6.1:** Crear `src/tests/posPricingAndTaxCop.test.ts` con todos los casos de prueba de negocio solicitados.
  - [x] **T-6.2:** Ejecutar Vitest y certificar 100% de tests verdes (10/10 en pricing + 6/6 en e2e).
  - [x] **T-6.3:** Auditar en Chrome DevTools MCP (0 errores y 0 warnings en consola JS, comprobación interactiva en vivo).
  - [x] **T-6.4:** Sincronizar `MEMORY.md` y `CHANGELOG_AGENTS.md`.
