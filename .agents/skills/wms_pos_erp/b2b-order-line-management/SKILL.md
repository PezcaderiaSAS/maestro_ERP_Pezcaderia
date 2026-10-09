---
name: b2b-order-line-management
description: >
  Gestión, consolidación inteligente y diferenciación por especificación de líneas de pedido B2B en MaestroPescaderia ERP.
  Úsala cuando implementes, refacciones o depures lógica de cotizaciones, pedidos, alistamiento en cuarto frío o despiece,
  donde productos con la misma referencia (SKU) puedan convivir con diferentes detalles de empaque/gramaje o consolidarse si son idénticos.
version: 1.0.0
source: b2b-fulfillment-refactor
---

# B2B Order Line Management — MaestroPescaderia ERP

## Contexto y Dominio de Negocio

En la comercialización de productos marinos e insumos perecederos B2B (restaurantes, hoteles, distribuidores), un mismo producto (ejemplo: *Trucha Arcoíris Entropada* - SKU: `PROD-TRUCHA-001`) puede ser solicitado en un solo pedido bajo diferentes especificaciones de corte, gramaje o alistamiento:

- **Línea 1**: 5 unidades de Trucha (Detalle / Especificación: *"400 a 500 gr"*).
- **Línea 2**: 5 unidades de Trucha (Detalle / Especificación: *"550 a 600 gr"*).

Aunque ambas líneas comparten el mismo código SKU de catálogo, representan **entidades operativas independientes** en la bodega/cuarto frío, pues requieren selección, pesado y empaque diferenciado por los operarios de alistamiento.

Por el contrario, si el usuario agrega una tercera orden del mismo producto con la misma especificación (*"400 a 500 gr"*), el sistema debe **consolidar** las cantidades en la Línea 1 (sumando a 10 unidades) para evitar la proliferación de filas idénticas redundantes.

---

## Reglas de Negocio e Invariantes (Inmutables)

1. **Diferenciación por `detalle` (Especificación)**:
   Dos ítems dentro de una cotización o pedido B2B se consideran la **misma línea** si y solo si:
   - Coinciden exactamente en `sku` (código de producto).
   - Coinciden en el atributo `detalle` (normalizado en minúsculas y sin espacios laterales: `(item.detalle || '').trim().toLowerCase()`).
   - Coinciden en el indicador de devolución (`esDevolucion`).

2. **Consolidación Inteligente**:
   - Al agregar/editar una línea desde el selector de productos (`saveProductLine` en `usePricing`), si existe una línea previa coincidente bajo la regla (1), sus cantidades se suman.
   - Si el `detalle` difiere (ej. *"400-500g"* vs *"550-600g"*), debe crearse y mantenerse una **línea independiente** en el arreglo de ítems.

3. **Clave Única de Línea (`lineKey`)**:
   - Las vistas de React (tablas de alistamiento, liquidación, Kanban) **NUNCA** deben usar `item.sku` como la `key` de React ni como clave en diccionarios de estado de edición (ej. `tempRealQuantities`).
   - Siempre debe calcularse una clave compuesta unívoca mediante la función helper:
     ```ts
     export const getLineKey = (item: { id?: string; lineId?: string; sku: string }, index: number): string => {
       return item.id || item.lineId || `${item.sku}_${index}`;
     };
     ```

4. **Operaciones por Índice de Fila**:
   - Acciones destructivas como eliminar un producto de una cotización/pedido (`handleRemoveQuoteItem`) deben ejecutarse pasando el **índice de posición en el arreglo** (`lineIndex: number`), no el SKU, asegurando la eliminación quirúrgica únicamente del ítem seleccionado.

5. **Visibilidad en Alistamiento y Despacho**:
   - Los formularios y modales de alistamiento en cuarto frío (`POSView`, `OrderKanbanView`) deben mostrar de forma prominente la especificación (`item.detalle`) debajo o junto al nombre comercial del producto para guiar la selección física correcta del inventario.

---

## Estructura de Datos (Contrato TypeScript)

```ts
export interface QuoteItemB2B {
  id?: string;
  lineId?: string;
  sku: string;
  nombre: string;
  cantidad: number;
  cantidad_real?: number; // Peso/cantidad empacada en alistamiento
  precioUnitario: number;
  subtotal: number;
  detalle?: string;        // Especificación (ej. "400-500g", "Filete sin piel")
  esDevolucion?: boolean;
  observaciones?: string;
}
```

---

## Patrones de Implementación Recomendados

### 1. Consolidación en Hook de Precios (`usePricing.ts`)

```ts
const saveProductLine = (newLineItem: QuoteItemB2B, editingIndex: number | null) => {
  setQuoteItems((prevItems) => {
    // Si estamos editando una línea existente específica por su índice
    if (editingIndex !== null && editingIndex >= 0) {
      const updated = [...prevItems];
      updated[editingIndex] = newLineItem;
      return updated;
    }

    // Si estamos agregando una línea nueva, buscamos si ya existe una coincidente
    const normDetalle = (newLineItem.detalle || '').trim().toLowerCase();
    const existingIdx = prevItems.findIndex(
      (item) =>
        item.sku === newLineItem.sku &&
        (item.detalle || '').trim().toLowerCase() === normDetalle &&
        Boolean(item.esDevolucion) === Boolean(newLineItem.esDevolucion)
    );

    if (existingIdx >= 0) {
      // Consolidar/sumar cantidad
      const updated = [...prevItems];
      const existing = updated[existingIdx];
      const newCant = existing.cantidad + newLineItem.cantidad;
      updated[existingIdx] = {
        ...existing,
        cantidad: newCant,
        subtotal: newCant * existing.precioUnitario,
      };
      return updated;
    }

    // Si no existe coincidencia exacta, se inserta como nueva línea independiente
    return [...prevItems, newLineItem];
  });
};
```

### 2. Manejo de Estado en Modal de Alistamiento B2B (`POSView.tsx`)

```tsx
// 1. Inicialización de estado temporal de pesos/cantidades reales usando getLineKey
useEffect(() => {
  if (selectedQuoteForAlistamiento) {
    const initialReal: Record<string, number> = {};
    selectedQuoteForAlistamiento.items.forEach((item, index) => {
      const key = getLineKey(item, index);
      initialReal[key] = item.cantidad_real ?? item.cantidad;
    });
    setTempRealQuantities(initialReal);
  }
}, [selectedQuoteForAlistamiento]);

// 2. Renderizado de filas con clave unívoca y visualización de detalle
{quote.items.map((item, index) => {
  const lineKey = getLineKey(item, index);
  const currentReal = tempRealQuantities[lineKey] ?? item.cantidad;

  return (
    <tr key={lineKey}>
      <td>
        <div className="font-semibold text-slate-800">{item.nombre}</div>
        {item.detalle && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            {item.detalle}
          </span>
        )}
      </td>
      <td>{item.cantidad}</td>
      <td>
        <input
          type="number"
          value={currentReal}
          onChange={(e) =>
            setTempRealQuantities((prev) => ({
              ...prev,
              [lineKey]: parseFloat(e.target.value) || 0,
            }))
          }
        />
      </td>
      <td>
        <button onClick={() => handleRemoveQuoteItem(quote.id, index)}>
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
})}
### 3. Adición Dinámica y Edición de Especificación en Alistamiento (`POSView.tsx`)

```tsx
// 1. Adición dinámica de productos con consolidación de par (sku, detalle)
const handleAddQuoteItem = async (quoteId: string) => {
  // Modal interactivo (Swal) para elegir producto, cantidad solicitada, peso real y detalle
  // Si (sku, detalle) coincide con una línea existente -> Consolidar (sumar cantidades)
  // Si difiere -> Insertar nueva línea con ID único ('line_timestamp_rand')
  // Sincronizar tempRealQuantities, subtotal, total y persistir en localDb.save('quotations', ...)
};

// 2. Edición o incorporación de especificación (detalle) por línea
const handleEditQuoteItemDetail = async (quoteId: string, lineIndex: number) => {
  // Modal interactivo (Swal) para actualizar/ingresar 'detalle' (ej. "Calibre 500-600g")
  // Actualizar ítem en el índice especificado del arreglo 'items' / 'lineas'
  // Persistir cambios en localDb y emitir evento QUOTE_UPDATED
};
```

---

## Lista de Comprobación y Verificación (QA)

- [x] **Consolidación Mismo Detalle**: Agregar 2 unds de SKU `X` con detalle `"Corte A"`, luego agregar 3 unds del mismo SKU `X` con detalle `"Corte A"`. Resultado: 1 sola fila con 5 unds.
- [x] **Diferenciación Diferente Detalle**: Agregar 2 unds de SKU `X` con detalle `"Corte A"`, luego agregar 3 unds del mismo SKU `X` con detalle `"Corte B"`. Resultado: 2 filas independientes.
- [x] **Alistamiento Independiente**: Al modificar el peso real de la fila 1 en el modal de alistamiento, la fila 2 no debe sufrir ningún cambio.
- [x] **Eliminación Quirúrgica**: Presionar eliminar en la fila 2 debe remover únicamente esa fila, preservando la fila 1 intacta.
- [x] **Adición de Ítems en Alistamiento**: Utilizar el botón `+ Agregar Producto` en el modal de alistamiento para sumar ítems nuevos al pedido antes de finalizar.
- [x] **Edición de Especificación**: Hacer clic en el ícono `<Edit2 />` sobre la columna Producto para actualizar la especificación técnica en tiempo real.

