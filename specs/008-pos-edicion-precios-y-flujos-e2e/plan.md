# Plan de Implementación Brownfield SDD 008: POS — Modificación de Precios en Venta & Suite Exhaustiva de Flujos E2E

## 1. Resumen Ejecutivo
Este plan de implementación formaliza las modificaciones arquitectónicas y de componentes necesarias para dotar al POS de edición ágil de precios de venta por línea con validación de rentabilidad, junto a la implementación de una suite completa de pruebas automatizadas y E2E que valide los 6 pilares operativos del módulo.

---

## 2. Arquitectura de Módulos Modificados

```
┌────────────────────────────────────────────────────────┐
│ src/hooks/usePOSCart.ts                                │
│  - updateItemPrice(productoId, newPrice)               │
│  - resetItemPrice(productoId)                          │
│  - Mantiene precioModificadoOriginal y recalcula       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/views/pos/components/LineaVentaRow.tsx             │
│  - Precio unitario táctil interactivo con icono ✏️     │
│  - Diálogo modal con input numérico rápido             │
│  - Alerta SweetAlert2 si precio < precioCompra         │
│  - Badge [✏️ Modificado (Base: $X)] + Enlace Restablecer│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/views/pos/components/CartPanel.tsx                 │
│  - Recibe y propaga onUpdatePrecio y onResetPrecio     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/views/POSView.tsx                                  │
│  - Extrae updateItemPrice de usePOSCart                │
│  - Conecta callbacks a CartPanel                       │
│  - Corrige mapeo de compatibilidad cart & newVenta     │
│  - Actualiza lastClientPrices para clientes guardados  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/tests/posComprehensiveLifecycleE2E.test.ts         │
│  - 1. Apertura de caja con base                        │
│  - 2. Venta multi-presentación (KG/UNIDAD) Consumidor  │
│  - 3. Venta guardada -> retomada -> pago mixto         │
│  - 4. Venta con precios modificados                    │
│  - 5. Venta a crédito con cartera AR                   │
│  - 6. Solicitud de reabastecimiento POS                │
└────────────────────────────────────────────────────────┘
```

---

## 3. Especificación Técnica de Algoritmos y Reglas de Negocio

### 3.1. Recálculo Reactivo tras Edición de Precio
$$\text{precioFinal} = \text{newPrice} \times \left(1 - \frac{\text{descuentoPct}}{100}\right)$$
$$\text{totalLinea} = \text{cantidad} \times \text{precioFinal}$$
$$\text{subtotalPedido} = \sum_{i=1}^{N} \text{totalLinea}_i$$
$$\text{totalFinal} = \max\left(0, \text{subtotalPedido} - \text{descuentoGlobal}\right)$$

### 3.2. Preservación del Precio Original
Al modificar el precio por primera vez en una línea:
- Si `precioModificadoOriginal` no estaba definido, se establece en `linea.precioLista`.
- Si el usuario presiona `Restablecer`, `precioLista` vuelve al valor de `precioModificadoOriginal`, `precioModificadoOriginal` se borra y se recalculan los totales.

### 3.3. Control de Margen y Advertencia de Costo
Si $\text{newPrice} < \text{linea.precioCompra}$, se activa la alerta:
> "El precio ingresado (\$X) es inferior al costo de compra (\$linea.precioCompra). ¿Desea aplicar este precio con margen negativo?"
El cajero puede confirmar o cancelar.

---

## 4. Estrategia de Pruebas TDD y Validación
1. **Pruebas de Componente e Integración (`usePOSCart.test.ts` / `LineaVentaRow.test.tsx`):**
   - Modificación de precio hacia arriba y hacia abajo.
   - Restablecimiento de precio original.
2. **Suite E2E de Ciclo Completo (`posComprehensiveLifecycleE2E.test.ts`):**
   - Ejecución de los 6 flujos de negocio secuencialmente.
3. **Auditoría en Vivo con Chrome DevTools:**
   - 0 excepciones no controladas en consola JS.
   - Ergonomía táctil para botones $\ge 44\text{ px}$.
