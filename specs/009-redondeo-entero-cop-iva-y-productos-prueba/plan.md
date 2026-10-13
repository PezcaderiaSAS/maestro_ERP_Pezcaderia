# Plan Técnico de Implementación SDD 009: Redondeo Entero COP, Desglose IVA y Diferenciación Unidad vs Kilos

## 1. Arquitectura de Módulos Modificados

```
┌────────────────────────────────────────────────────────────────────────┐
│ src/services/posService.ts                                             │
│  - calcularTotalLinea: redondeo entero + desglose IVA determinista     │
│  - calcularTotalesPedido: suma de bases, IVA y total neto exacto       │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│ src/types/pos.types.ts & src/hooks/usePOSCart.ts                       │
│  - LineaVenta con iva, ivaIncluido, baseGravableLinea, cuotaIvaLinea   │
│  - Normalización unívoca de unidad: unidadMedida.toUpperCase() === 'KG'│
│  - Preservación de precios enteros tras updateItemPrice y descuentos   │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│ src/views/pos/components/ProductSearchPanel.tsx                        │
│  - Badge visual de alto contraste: [⚖️ KILOS] vs [📦 UNIDAD]           │
│  - Rotulación de precio: $XX.XXX / kg vs $XX.XXX / und                 │
│  - Stock expresado en kg vs und (no genérico 'uds')                   │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│ src/views/pos/components/LineaVentaRow.tsx                             │
│  - Badge [⚖️ KG] vs [📦 UND] en la línea                              │
│  - Controles táctiles contextuales: balanza solo en KG, +/- enteros en │
│    UNIDAD con step="1"                                                 │
│  - Input de precio con step="any" y min="0" sin restricciones HTML5    │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│ src/views/pos/components/CartPanel.tsx & TicketBuilder.tsx             │
│  - Desglose opcional de Base Gravable e IVA en totales de venta        │
│  - Formateo del ticket impreso con Base Gravable e IVA Incluido        │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│ src/App.tsx & Catálogo de Productos                                    │
│  - Inclusión de Camarón Crudo 41-50 (MP, kg, $28.500)                  │
│  - Inclusión de Camarón Crudo 41-50 x 500 gr (PF, und, $14.250)        │
│  - Helper calcularCostoProductoDerivado(costoMP, gramos = 500)         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fórmulas Matemáticas Deterministas de Redondeo COP

### 2.1. Desglose de Línea con IVA Incluido
$$\text{precioFinal} = \text{round}\left(\text{precioLista} \times \left(1 - \frac{\text{descuentoPct}}{100}\right)\right)$$
$$\text{totalLinea} = \text{round}\left(\text{cantidad} \times \text{precioFinal}\right)$$
$$\text{baseGravableLinea} = \begin{cases} 
\text{round}\left(\frac{\text{totalLinea}}{1 + \text{tarifaIva}/100}\right) & \text{si } \text{tarifaIva} > 0 \text{ e } \text{ivaIncluido} = \text{true} \\
\text{totalLinea} & \text{en otro caso}
\end{cases}$$
$$\text{cuotaIvaLinea} = \text{totalLinea} - \text{baseGravableLinea}$$

### 2.2. Costo Proporcional Derivado de Materia Prima
$$\text{costoProductoDerivado} = \text{round}\left(\text{costoKiloMP} \times \frac{\text{gramosContenido}}{1000}\right)$$
$$\text{costo}(28500, 500) = \text{round}\left(28500 \times 0.5\right) = 14250\text{ COP}$$

---

## 3. Estrategia de Pruebas TDD
1. `src/tests/posPricingAndTaxCop.test.ts`:
   - Redondeo entero estricto sin decimales en todas las operaciones.
   - Caso exacto del usuario: Producto con IVA 19% incluido vendido a $10.000 y modificado a $9.000 (Base $7.563 + IVA $1.437 = $9.000).
   - Diferenciación visual y operativa de Kilos vs Unidad.
   - Costo proporcional del Camarón Crudo 41-50 x 500 gr ($14.250).
