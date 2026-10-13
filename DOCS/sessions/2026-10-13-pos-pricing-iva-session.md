# Session: 2026-10-13

**Started:** 2026-10-13 06:45:00
**Last Updated:** 2026-10-13 08:45:00
**Project:** La Pezcadería ERP (`Maestro_Pezcaderia_ERP`)
**Topic:** Módulo POS: Modificación de Precios, Redondeo Entero COP, Tratamiento Determinista de IVA Incluido, Diferenciación Kilos vs Unidades y 6 Flujos E2E

---

## What We Are Building

Implementación integral de la gestión de precios y cálculo tributario en el Punto de Venta (POS) de La Pezcadería ERP:
1. **Edición Ágil de Precios en Venta (SDD 008):** Permitir a cajeros y vendedores modificar el precio de venta unitario directamente desde la fila del carrito con diálogo ergonómico, validación de margen contra costo de compra, badges visuales de precio modificado, botón de restablecimiento y actualización de precios históricos para clientes identificados.
2. **Redondeo Estricto a Enteros en Moneda COP (SDD 009):** Eliminación de fracciones y centavos en todos los cálculos monetarios (precios unitarios, totales de línea por peso fraccionario, subtotales, descuentos, bases gravables e IVA) utilizando `Math.round`, evitando descuadres contables de $1 peso.
3. **Tratamiento Determinista de IVA Incluido (SDD 009):** Cuando un producto tiene IVA incluido en su precio lista ($10.000) y se modifica su precio a $9.000, ese precio final ya incluye el IVA. La base gravable se calcula como $\text{round}(9.000 / 1.19) = 7.563$ y la cuota de IVA como $9.000 - 7.563 = 1.437$, garantizando que $\text{Base} + \text{IVA} \equiv \text{Total Línea}$ al 100%.
4. **Diferenciación Visual y Operativa de Unidades (SDD 009):**
   - Productos vendidos por peso en kilos (`KG`): Insignia `⚖️ KILOS` (azul), precio rotulado `$XX.XXX / kg`, stock en `kg`, botón de balanza integrado y aceptación de peso decimal.
   - Productos vendidos por unidades (`UNIDAD`): Insignia `📦 UNIDAD` (esmeralda), precio rotulado `$XX.XXX / und`, stock en `und`, sin balanza y paso entero en el input (`step="1"`).
5. **Productos de Prueba Sembrados:**
   - `Camaron Crudo 41-50` (`CAM-CRU-41-50`): Materia Prima, venta por kilos, costo de compra $28.500, venta POS $38.000, IVA 0%.
   - `Camaron Crudo 41-50 x 500 gr` (`CAM-CRU-41-50-500G`): Producto Final, venta por unidades, costo de compra $14.250 derivado proporcionalmente ($28.500 * 0.5), venta POS $22.000, IVA 0%.
6. **Suite E2E de 6 Pilares:** Apertura de caja, venta multi-presentación, venta guardada/retomada con pago mixto, venta con precios modificados, venta a crédito, y solicitud de reabastecimiento POS a Bodega Principal.

---

## What WORKED (with evidence)

- **Redondeo Entero y Tratamiento de IVA Incluido:**
  - Confirmado por la suite de pruebas unitarias `src/tests/posPricingAndTaxCop.test.ts` (10/10 pruebas pasando al 100%).
  - Caso $10.000 -> $9.000 con 19%: Base $7.563 + IVA $1.437 = $9.000 verificado matemáticamente y en código.
- **Cálculo de Costo de Producto Derivado:**
  - Confirmado por test: Camarón MP $28.500/kg x 500 gr = $14.250 COP exactos.
- **Suite Completa de 6 Flujos E2E de POS:**
  - Confirmado por `src/tests/posComprehensiveLifecycleE2E.test.ts` (6/6 pruebas aprobadas al 100%).
- **Bucle DevTools MCP en Vivo:**
  - Confirmado mediante sesión en `http://127.0.0.1:3000/`:
    - 0 errores y 0 warnings en la consola JS del navegador tras navegar, agregar productos y editar precios.
    - Renderizado responsivo móvil verificado a 375 px (viewport iPhone).
    - Agregado interactivo de `Camaron Crudo 41-50` (1.5 kg con balanza) y `Camaron Crudo 41-50 x 500 gr` (1 und).
    - Modificación en vivo del precio de $22.000 a $19.000 reflejado con badge `✏️ Modificado (Base: $22.000)` y total recalculado de forma instantánea a $76.000 COP sin centavos.
- **Desglose de IVA en Impresión de Tickets:**
  - `usePOSPrinter.ts` imprime `BASE GRAVABLE` e `IVA INCLUIDO` en números enteros cuando la venta contiene IVA.

---

## What Did NOT Work (and why)

- **Firma de argumentos en test unitario inicial:**
  - Falló porque `calcularTotalLinea` recibe `(precioLista, descuentoPct, cantidad, tarifaIva, ivaIncluido)` y el test inicial invirtió el orden de `descuentoPct` y `cantidad`. Corregido de inmediato.
- **ReferenceError `isOutOfStock` en `ProductSearchPanel.tsx`:**
  - Detectado de forma inmediata por el bucle de DevTools en vivo (`Uncaught ReferenceError: isOutOfStock is not defined`). Corregido definiendo `const isOutOfStock = totalStock <= 0;`.
- **Doble declaración de `getProductStock` en `POSView.tsx`:**
  - Detectado por el compilador de Vite al recargar (`Identifier 'getProductStock' has already been declared`). Se eliminó la copia redundante de la cabecera y se mantuvo la implementación original de la línea 593.
- **Permiso de escritura en `$HOME\.claude\session-data` dentro del sandbox:**
  - El sandbox estándar bloqueó la creación fuera del workspace; resuelto almacenando la documentación de sesión dentro de `docs/sessions/` en el árbol del repositorio para que persista en el control de versiones.

---

## What Has NOT Been Tried Yet

- Conexión a balanza física real mediante Web Serial API (actualmente probado y funcional en emulación y fallback automático).
- Impresión en hardware físico de ticket térmico USB/Bluetooth (funcional en consola de emulación e iframe nativo).

---

## Current State of Files

| File | Status | Notes |
| :--- | :---: | :--- |
| `src/services/posService.ts` | PASS: Complete | Algoritmos `calcularTotalLinea`, `calcularTotalesPedido` (redondeo entero COP, IVA incluido) y `calcularCostoProductoDerivado`. |
| `src/types/pos.types.ts` | PASS: Complete | Tipos `LineaVenta` y `VentaPOS` extendidos con desglose de IVA y base gravable. |
| `src/hooks/usePOSCart.ts` | PASS: Complete | Inmutabilidad en carrito, normalización `'KG'` vs `'UNIDAD'`, y propagación reactiva de IVA. |
| `src/hooks/usePOSPrinter.ts` | PASS: Complete | Formato de ticket térmico con desglose reglamentario de Base e IVA. |
| `src/views/pos/components/ProductSearchPanel.tsx` | PASS: Complete | Badges `⚖️ KILOS` / `📦 UNIDAD`, precio unitario por kg/und, stock diferenciado. |
| `src/views/pos/components/LineaVentaRow.tsx` | PASS: Complete | Badges de unidad, edición de precio táctil, input entero para unidades y balanza para kilos. |
| `src/views/pos/components/CartPanel.tsx` | PASS: Complete | Desglose dinámico de IVA y Base Gravable en resumen de totales. |
| `src/views/pos/components/DiscountPanel.tsx` | PASS: Complete | Muestra IVA incluido dinámico en lugar de impuestos en cero quemados. |
| `src/views/POSView.tsx` | PASS: Complete | Integración general limpia, conmutación fluida y catálogo reactivo. |
| `src/App.tsx` | PASS: Complete | Sembrado y sincronización de `Camaron Crudo 41-50` y `Camaron Crudo 41-50 x 500 gr`. |
| `src/tests/posPricingAndTaxCop.test.ts` | PASS: Complete | 10 pruebas unitarias de redondeo entero, IVA incluido y productos derivados. |
| `src/tests/posComprehensiveLifecycleE2E.test.ts` | PASS: Complete | 6 pruebas E2E de ciclo operativo completo del POS. |
| `specs/008-pos-edicion-precios-y-flujos-e2e/` | PASS: Complete | Especificación SDD 008 (spec.md, plan.md, tasks.md completadas al 100%). |
| `specs/009-redondeo-entero-cop-iva-y-productos-prueba/` | PASS: Complete | Especificación SDD 009 (spec.md, plan.md, tasks.md completadas al 100%). |
| `MEMORY.md` | PASS: Complete | Memoria del agente sincronizada respetando el límite de 50 líneas. |
| `CHANGELOG_AGENTS.md` | PASS: Complete | Bitácora cronológica con registro detallado de las intervenciones. |

---

## Decisions Made

- **Redondeo sin centavos:** Todo valor monetario en el POS opera como entero (`Math.round`), alineado a las prácticas de facturación en Colombia (COP) y normatividad DIAN.
- **Cálculo de Base Gravable desde Total con IVA Incluido:** Se calcula primero la base gravable redondeada y la cuota de IVA por sustracción ($\text{IVA} = \text{Total} - \text{Base}$), erradicando inconsistencias aritméticas.
- **Diferenciación Operativa Estricta:** Los productos por unidad no muestran el botón de balanza ni admiten fracciones para evitar errores humanos de cajeros en el mostrador.
- **Persistencia de Sesión en el Repositorio:** Guardar las sesiones en `docs/sessions/` para asegurar trazabilidad entre sesiones y sincronización con GitHub.

---

## Blockers & Open Questions

- No active blockers. Todos los requerimientos fueron desarrollados, testeados, auditados en DevTools y documentados.
