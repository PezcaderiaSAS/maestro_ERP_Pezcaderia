# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Light Mode WCAG AA+ & SDD 006 / 007 / 008 / 009 Completados)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) de alto contraste con tokens WCAG 2.2 AA+ (`.agents/skills/erp-pos-design-tokens/SKILL.md`).
- **Verificación Completa:**
  - 50+ suites de prueba ejecutadas al 100% (incluyendo unitarias y E2E de ciclo completo).
  - **Bucle DevTools MCP en Vivo:** Verificado en escritorio y móvil (375 px) con **0 errores en consola JS**.

## SDD 009: Redondeo Entero COP, IVA Incluido y Diferenciación Unidad vs Kilos
- **Redondeo Estricto a Enteros en COP:** Todos los precios, subtotales, descuentos, bases gravables e IVA son enteros exactos (`Math.round`), eliminando centavos y descuadres de $1 peso en balances contables.
- **Desglose Determinista de IVA Incluido:** Fórmula canónica ante descuentos y cambios de precio ($10.000 -> $9.000 con 19%):
  $\text{Base} = \text{round}(\text{Total} / (1 + \text{tarifa}/100)) = \$7.563$, $\text{IVA} = \text{Total} - \text{Base} = \$1.437$, garantizando que $\text{Base} + \text{IVA} \equiv \text{Total}$.
- **Diferenciación Visual & Operativa:**
  - `⚖️ KILOS`: Badge azul en catálogo y carrito, rotulado `$XX.XXX / kg`, botón de balanza activo, admisión de peso decimal.
  - `📦 UNIDAD`: Badge esmeralda, rotulado `$XX.XXX / und`, paso entero (`step="1"`), sin botón de balanza.
- **Productos de Prueba Sembrados en Catálogo:**
  1. `Camaron Crudo 41-50` (`CAM-CRU-41-50`): Materia Prima, venta por kilos, compra $28.500, venta POS $38.000.
  2. `Camaron Crudo 41-50 x 500 gr` (`CAM-CRU-41-50-500G`): Producto Final por unidades, compra $14.250 (derivado proporcionalmente: $28.500 * 0.5), venta POS $22.000.

## Módulo POS — Precios en Venta & Suite de 6 Flujos E2E (SDD 008)
- **Edición Ágil de Precios en Carrito:** Botón ✏️ en cada fila, confirmación de rentabilidad si precio < costo, badge `✏️ Modificado (Base: $X)`.
- **6 Pilares E2E Certificados:** Apertura de caja, venta multi-presentación, venta guardada/retomada con pago mixto, venta con precio modificado, venta a crédito, y solicitud de reabastecimiento POS a Bodega Principal.

## Gobernanza UI/UX
- Ergonomía táctil $\ge 44\text{ px}$, alto contraste WCAG AA+, tipografías claras, cero errores de consola.
