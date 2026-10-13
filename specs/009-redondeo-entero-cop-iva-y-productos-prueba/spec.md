# Especificación Brownfield SDD 009: Redondeo Entero COP, Desglose IVA Incluido y Diferenciación Unidad vs Kilos

## 1. Contexto y Justificación de Negocio
En el sistema de facturación y Punto de Venta (POS) de La Pezcadería ERP, las transacciones se efectúan en Pesos Colombianos (COP), una moneda sin circulación de centavos ni fracciones decimales en el comercio al por menor. 
Para garantizar total transparencia fiscal y operativa, evitar descuadres de $1 peso y facilitar la operación ágil del cajero:
1. **Redondeo Exacto Entero en COP:** Todos los precios (unitario, subtotal, descuento, base gravable, IVA y total final) deben ser siempre números enteros exactos (`Math.round`), sin decimales.
2. **Cálculo Determinista de IVA Incluido:** Cuando un producto incluye IVA en su precio de venta final (sea precio de lista o precio modificado en mostrador, ej. $10.000 a $9.000):
   $$\text{Base Gravable} = \text{round}\left(\frac{\text{Total Línea}}{1 + \text{Tarifa IVA}/100}\right)$$
   $$\text{Cuota IVA} = \text{Total Línea} - \text{Base Gravable}$$
   Garantizando por definición que $\text{Base Gravable} + \text{Cuota IVA} \equiv \text{Total Línea}$ al 100% sin descuadres de centavos ni residuos.
3. **Diferenciación Visual y Operativa (Unidad vs Kilos):**
   - Productos vendidos por peso (`KG`): Insignia `⚖️ KILOS`, rotulación `$XX.XXX / kg`, botón de balanza y admisión de peso decimal en báscula.
   - Productos vendidos por conteo (`UNIDAD` / `UND`): Insignia `📦 UNIDAD`, rotulación `$XX.XXX / und`, conteo estrictamente entero (paso 1) y sin balanza.
4. **Productos de Prueba E2E:**
   - `Camarón Crudo 41-50` (Materia prima, se vende por peso en kilos, compra $28.500 COP, venta $38.000 COP, IVA 0%).
   - `Camarón Crudo 41-50 x 500 gr` (Producto final, se vende por unidades, costo derivado proporcional $28.500 * 0.5 = $14.250 COP, venta $22.000 COP, IVA 0%).

---

## 2. Requerimientos del Sistema (Notación EARS)

### EARS-U (Ubiquitous - Requerimientos Universales)
- **EARS-U-01:** El sistema DEBE redondear todo valor monetario (precios unitarios, subtotales, descuentos, bases e impuestos) a números enteros sin decimales (`Math.round`).
- **EARS-U-02:** El sistema DEBE garantizar que la suma de la base gravable y la cuota de IVA sea idéntica al total final cobrado cuando el IVA está incluido en el precio.
- **EARS-U-03:** El sistema DEBE clasificar unívocamente todo producto del catálogo como `KG` (peso) o `UNIDAD` (conteo), independientemente de si la unidad de medida está escrita como `kg`, `KG`, `und`, `UND` o `unidad`.

### EARS-E (Event-Driven - Requerimientos Disparados por Eventos)
- **EARS-E-01 (Modificación de Precio con IVA Incluido):** CUANDO el cajero modifique el precio de un producto con IVA incluido (ej. de $10.000 a $9.000), el sistema DEBE asumir el nuevo valor como precio final con IVA incluido y recalcular la base gravable y la cuota de IVA en enteros de forma reactiva.
- **EARS-E-02 (Cálculo de Costo Derivado de Materia Prima):** CUANDO se registre o actualice un producto fraccionado/empaquetado derivado de una materia prima, el sistema DEBE calcular el costo proporcional de compra según su gramaje o factor de conversión.
- **EARS-E-03 (Interacción por Unidad):** CUANDO el producto sea de tipo `UNIDAD`, el sistema DEBE limitar los incrementos y decrementos a pasos enteros de 1 en 1 y ocultar el botón de balanza física.
- **EARS-E-04 (Interacción por Kilo):** CUANDO el producto sea de tipo `KG`, el sistema DEBE habilitar el botón de balanza física y permitir ingreso de cantidades con decimales de peso.

### EARS-S (State-Driven - Requerimientos Basados en Estado)
- **EARS-S-01:** MIENTRAS el producto se visualice en el catálogo o carrito, el sistema DEBE renderizar insignias visuales de alto contraste (`⚖️ KILOS` o `📦 UNIDAD`) para evitar confusiones de digitación en mostrador.
- **EARS-S-02:** MIENTRAS existan productos gravados con IVA en el pedido, el sistema DEBE mostrar el desglose de Base Gravable e IVA en el resumen de totales de caja y en el ticket de impresión.

### EARS-W (Unwanted Behavior - Casos de Excepción)
- **EARS-W-01:** SI el cajero ingresa un precio con decimales o centavos en el diálogo modal, el sistema DEBE redondearlo automáticamente al entero COP más cercano sin lanzar errores de validación en HTML5.

---

## 3. Criterios de Aceptación
1. **Redondeo Entero Estricto:** Todos los precios en pantalla y en tickets son enteros sin fracciones (`Math.round`).
2. **Desglose IVA 100% Cuadrado:** Para un ítem de $9.000 COP con IVA 19% incluido, la base es $7.563 y el IVA es $1.437 ($7.563 + $1.437 = $9.000).
3. **Diferenciación Táctil:** Los productos por Kilo muestran botón de balanza y precio `/ kg`; los de Unidad muestran controles enteros y precio `/ und`.
4. **Catálogo de Pruebas:** Los productos `Camarón Crudo 41-50` y `Camarón Crudo 41-50 x 500 gr` están activos en el catálogo con sus costos ($28.500 y $14.250) y precios correspondientes.
5. **Calidad:** 100% pruebas pasando en Vitest y 0 errores en la consola JS del navegador con Chrome DevTools.
