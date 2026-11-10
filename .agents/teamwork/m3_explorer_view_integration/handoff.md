# Handoff Report: Exploración de Integración de Vista y Catálogo para Hito M3 (Trigger Táctil de Pesaje Manual `ManualWeightModal`)

**Autor:** Explorer de Integración de Vista y Catálogo (`m3_explorer_view_integration`)  
**Fecha:** 2026-11-09T11:47:30Z  
**Hito:** M3 — Tarea 3: Trigger Táctil de Pesaje Manual `ManualWeightModal` para Ítems a Granel / KG Balanza  
**Directorio de Trabajo:** `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia`  
**Destinatario:** Orquestador Padre (`214a0168-c4c8-4555-84a8-e65c4fad7287`) y Worker de Implementación M3  

---

## 1. Observation

A través de la inspección estricta de solo-lectura sobre el código fuente y las pruebas existentes, se han obtenido las siguientes observaciones exactas:

### 1.1 `src/views/pos/components/POSMultivendorView.tsx`
- **Líneas 14-41 (`POSMultivendorViewProps`)**:
  ```tsx
  export interface POSMultivendorViewProps {
    products: Product[];
    stockMap: Record<string, number>;
    cartItems: MultivendorCartItem[];
    onAddToCart: (product: Product, cantidad?: number) => void;
    ...
    onOpenScaleModal?: (product: Product) => void;
    ...
  }
  ```
  `onAddToCart` ya soporta opcionalmente el parámetro `cantidad?: number`.
- **Líneas 80-97 (`handleBarcodeSubmit`)**:
  ```tsx
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    const cleanCode = barcodeInput.trim().toLowerCase();
    const found = products.find((p) => {
      const code = (p.codigo_barras || (p as any).barcode || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return code === cleanCode || sku === cleanCode;
    });

    if (found) {
      onAddToCart(found, 1);
      setBarcodeInput('');
    } else {
      // Si no es coincidencia exacta, pasar al filtro de búsqueda
      setSearchQuery(barcodeInput.trim());
      setBarcodeInput('');
    }
  };
  ```
  **Observación crítica:** Al escanear un código de barras o SKU coincidente, se invoca incondicionalmente `onAddToCart(found, 1)`. No existe verificación de si el ítem es pesable (`KG Balanza`), agregándolo como 1 unidad entera y omitiendo el flujo de balanza.
- **Líneas 163-206 (Renderizado principal)**:
  `ManualWeightModal` **no está importado ni renderizado** en `POSMultivendorView.tsx`.
- **Líneas 171-177 (Invocación de `POSMultivendorCatalog`)**:
  ```tsx
  <POSMultivendorCatalog
    products={products}
    stockMap={stockMap}
    onAddToCart={onAddToCart}
    onOpenScaleModal={onOpenScaleModal}
    searchFilter={searchQuery}
  />
  ```
  `onOpenScaleModal` simplemente se propaga desde las props externas. Si la vista se monta de forma autocontenida sin que el padre pase `onOpenScaleModal`, el catálogo pierde la capacidad de abrir la balanza.

---

### 1.2 `src/views/pos/components/POSMultivendorCatalog.tsx`
- **Líneas 91-98 (`getProductUnit` e `isProductPesable`)**:
  ```tsx
  const getProductUnit = (p: Product) => {
    return p.unidadMedida || (p as any).unidad || 'kg';
  };

  const isProductPesable = (p: Product) => {
    const u = getProductUnit(p).toUpperCase();
    return u === 'KG' || u === 'KILO' || u === 'KILOS' || u === 'GR' || u === 'GRAMOS';
  };
  ```
  **Observación de riesgo:**
  1. Si un producto carece de `unidadMedida`, la función hace fallback por defecto a `'kg'`, categorizando erróneamente cualquier ítem sin unidad como pesable.
  2. No evalúa `unidad_medida` (formato snake_case proveniente de Supabase/PostgreSQL).
  3. No evalúa banderas booleanas como `(p as any).es_pesable` o `(p as any).esPesable`.
  4. No evalúa el campo de negocio `tipo_venta` (`'granel'`, `'balanza'`, `'peso'`).
  5. No contempla unidades de peso colombianas comunes en pescadería como `'lb'`, `'libra'`, `'libras'`.
  6. La función no está exportada para su reutilización en la vista contenedora.
- **Líneas 152-158 (Interacción de clic en tarjeta de producto)**:
  ```tsx
  onClick={() => {
    if (pesable && onOpenScaleModal) {
      onOpenScaleModal(product);
    } else {
      onAddToCart(product, 1);
    }
  }}
  ```
  Si `pesable` es verdadero pero `onOpenScaleModal` no está definido, se agrega directamente con cantidad 1 (`onAddToCart(product, 1)`).

---

### 1.3 `src/views/pos/components/ManualWeightModal.tsx`
- **Líneas 5-13 (`ManualWeightModalProps`)**:
  ```tsx
  export interface ManualWeightModalProps {
    isOpen: boolean;
    producto: any;
    pesoInicial?: number;
    precioUnitario?: number;
    onConfirm?: (producto: any, pesoKg: number) => void;
    onConfirmWeight?: (pesoKg: number) => void;
    onClose: () => void;
  }
  ```
- **Líneas 100-115 (`handleConfirm`)**:
  ```tsx
  const handleConfirm = () => {
    if (pesoNumerico <= 0) {
      setErrorMsg('Por favor ingresa un peso mayor a 0 kg');
      return;
    }
    if (onConfirm) {
      onConfirm(producto, pesoNumerico);
      if (onConfirm.length === 1) {
        (onConfirm as any)(pesoNumerico);
      }
    }
    if (onConfirmWeight) {
      onConfirmWeight(pesoNumerico);
    }
    onClose();
  };
  ```
  **Observación de concurrencia de callbacks:** Si un llamador proporciona tanto `onConfirm` como `onConfirmWeight`, ambos se ejecutan secuencialmente. En consecuencia, si ambos invocaran `onAddToCart`, el producto se agregaría dos veces. Debe suministrarse uno solo o blindar la condición con `else if`.

---

### 1.4 `src/stores/useMultiVendorPosStore.ts`
- **Líneas 154-168 (`agregarItem`)**:
  ```tsx
  agregarItem: (item: ItemPrefacturaInput) => {
    const { cartItems } = get();
    const index = cartItems.findIndex((it) => it.productoId === item.productoId);

    if (index >= 0) {
      const nuevos = [...cartItems];
      nuevos[index] = {
        ...nuevos[index],
        cantidad: nuevos[index].cantidad + item.cantidad,
      };
      set({ cartItems: nuevos });
    } else {
      set({ cartItems: [...cartItems, { ...item, descuentoPct: item.descuentoPct || 0 }] });
    }
  },
  ```
- **Esquema Zod (`src/schemas/prefactura.schema.ts` línea 21)**:
  `cantidad: z.number().positive('La cantidad debe ser mayor a cero')`.
  `subtotal = Math.round(precioFinal * cantidad)`.
  **Observación:** El store y el validador manejan perfectamente números flotantes positivos (cantidades en kg con decimales como 0.25, 0.5, 1.25, 2.75).

---

### 1.5 Pruebas Existentes y Baseline
- `npm test -- src/tests/posManualWeightModal.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`: **14/14 pasando**.
- `npm test -- src/tests/posCartEditableRow.test.tsx src/tests/m2POSMultivendor.test.tsx`: **21/21 pasando**.
- `npx tsc --noEmit`: **0 errores de compilación**.

---

## 2. Logic Chain

1. **Premisa del Negocio**: En un negocio de pescadería ("La Pezcadería"), los productos a granel (ej. Róbalo, Salmón, Mojarra entera, Camarón) tienen peso variable. Venderlos con cantidad fija de 1 unidad al hacer clic o escanear distorsiona el inventario y la facturación.
2. **Definición de Pesable**: Para no clasificar productos unitarios (como Atún en Lata, salsas o bebidas) como pesables, la detección debe verificar explícitamente:
   - Indicadores booleanos: `es_pesable === true` o `esPesable === true`.
   - Tipo de venta: `tipo_venta === 'granel' | 'balanza' | 'peso'`.
   - Unidades de medida métricas y locales: `kg`, `kilo`, `kilos`, `kilogramo`, `gr`, `gramo`, `lb`, `libra`.
   - Si la unidad está explícitamente marcada como `und`, `unidad`, `paquete`, `lata`, debe clasificarse como NO pesable.
3. **Punto de Intercepción Unificado en `POSMultivendorView`**:
   - `POSMultivendorView` es la vista orquestadora del mostrador POS. Debe ser completamente autónoma y no depender de que una vista superior monte el modal de balanza.
   - Debe declarar un estado local:
     ```tsx
     const [productoAPesar, setProductoAPesar] = useState<Product | null>(null);
     ```
   - Al escanear un producto por código de barras o SKU:
     - Si `isProductPesable(found)` es verdadero $\rightarrow$ abrir el modal reteniendo el producto: `handleOpenScale(found)`.
     - Si es falso $\rightarrow$ agregar directamente con cantidad 1: `onAddToCart(found, 1)`.
   - Al hacer clic en una tarjeta del catálogo:
     - `POSMultivendorView` pasa a `POSMultivendorCatalog` el callback `onOpenScaleModal={handleOpenScale}`.
     - Cuando el catálogo detecta un ítem pesable, invoca `handleOpenScale(product)`.
     - Si un componente padre requiere enterarse de la apertura de balanza, `handleOpenScale` ejecuta también `onOpenScaleModal?.(product)`.
4. **Ciclo de Confirmación y Cancelación**:
   - Confirmación: Al presionar el botón gigante táctil "AGREGAR AL CARRITO" o presionar `Enter` en `ManualWeightModal`:
     - Invoca `onConfirm(prod, peso)` $\rightarrow$ llama a `onAddToCart(prod, peso)`.
     - Resetea `setProductoAPesar(null)`, cerrando el modal.
     - El carrito recibe la línea con la cantidad decimal exacta y recalcula subtotales y totales.
   - Cancelación: Al presionar la `X`, el botón cerrar o la tecla `Escape`:
     - Invoca `onClose()` $\rightarrow$ resetea `setProductoAPesar(null)`.
     - El carrito permanece completamente intacto.
5. **No Regresión**: La firma de `onAddToCart(product: Product, cantidad?: number)` se preserva al 100%, manteniendo compatibilidad con las suites de M1, M2 y tests E2E.

---

## 3. Caveats

1. **Riesgo de Doble Despacho en `ManualWeightModal.tsx`**:
   - Como se observó en la línea 105-113 de `ManualWeightModal.tsx`, si se suministran simultáneamente `onConfirm` y `onConfirmWeight`, ambos se ejecutarían.
   - **Mitigación obligatoria**: En `POSMultivendorView.tsx`, suministrar únicamente `onConfirm={(prod, peso) => { onAddToCart(prod, peso); setProductoAPesar(null); }}` y omitir `onConfirmWeight`, O parchear defensivamente `ManualWeightModal.tsx` con `else if (onConfirmWeight)` para evitar ejecución duplicada.
2. **Coexistencia con `POSView.tsx` Monolítico**:
   - En `src/views/POSView.tsx` (líneas 2394-2420), existe un estado externo `productForWeight` y un `<ManualWeightModal />` montado en el padre.
   - Para no abrir dos modales simultáneos cuando se usa `POSView.tsx`, si `POSMultivendorView` gestiona el modal internamente, `onOpenScaleModal` en `POSView.tsx` no debe duplicar la apertura si `POSMultivendorView` ya es responsable del ciclo de vida visual de pesaje.
3. **Escaneo Rápido de Balanza Serial vs Manual**:
   - La Tarea 3 cubre el ingreso manual táctil (`ManualWeightModal`). La integración Web Serial API (lectura automática por puerto COM a 9600 baudios) pertenece a la Fase 4 (Tarea 4). No debe mezclarse lógica de `navigator.serial` en la Tarea 3.

---

## 4. Conclusion & Plan Quirúrgico de Implementación

Para completar con éxito la Tarea 3 (Hito M3), el Worker de Implementación debe aplicar los siguientes cambios exactos:

### Cambio 1: `src/views/pos/components/POSMultivendorCatalog.tsx`
Exportar la función unificada `isProductPesable`:

```tsx
// Exportar función canónica de detección de producto pesable / balanza
export const isProductPesable = (p: Product): boolean => {
  if (!p) return false;
  if ((p as any).es_pesable === true || (p as any).esPesable === true) return true;
  if ((p as any).es_pesable === false || (p as any).esPesable === false) return false;
  if ((p as any).tipo_venta === 'granel' || (p as any).tipo_venta === 'balanza' || (p as any).tipo_venta === 'peso') return true;
  if ((p as any).tipo_venta === 'unidad' || (p as any).tipo_venta === 'empaque') return false;

  const rawUnit = (p.unidadMedida || (p as any).unidad_medida || (p as any).unidad || '').toString().toLowerCase().trim();
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'gr', 'g', 'gramo', 'gramos', 'lb', 'libra', 'libras'].includes(rawUnit)) {
    return true;
  }
  if (['und', 'unidad', 'unidades', 'pz', 'pieza', 'piezas', 'pq', 'paquete', 'paquetes', 'lata', 'latas', 'caja', 'cajas'].includes(rawUnit)) {
    return false;
  }
  return false;
};
```

Y en el componente `POSMultivendorCatalog`:
- Reutilizar `isProductPesable(product)` dentro del mapa de productos.
- Si se desea dar soporte opcional a `onSelectProduct`, añadir a `POSMultivendorCatalogProps`:
  `onSelectProduct?: (product: Product) => void;`
  con fallback retrocompatible:
  ```tsx
  onClick={() => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else if (pesable && onOpenScaleModal) {
      onOpenScaleModal(product);
    } else {
      onAddToCart(product, 1);
    }
  }}
  ```

---

### Cambio 2: `src/views/pos/components/POSMultivendorView.tsx`
1. **Importar `ManualWeightModal` e `isProductPesable`**:
   ```tsx
   import { ManualWeightModal } from './ManualWeightModal';
   import { POSMultivendorCatalog, isProductPesable } from './POSMultivendorCatalog';
   ```
2. **Declarar estado local de pesaje**:
   ```tsx
   const [productoAPesar, setProductoAPesar] = useState<Product | null>(null);

   const handleOpenScale = (product: Product) => {
     setProductoAPesar(product);
     onOpenScaleModal?.(product);
   };
   ```
3. **Actualizar `handleBarcodeSubmit`**:
   ```tsx
   const handleBarcodeSubmit = () => {
     if (!barcodeInput.trim()) return;
     const cleanCode = barcodeInput.trim().toLowerCase();
     const found = products.find((p) => {
       const code = (p.codigo_barras || (p as any).barcode || '').toLowerCase();
       const sku = (p.sku || '').toLowerCase();
       return code === cleanCode || sku === cleanCode;
     });

     if (found) {
       if (isProductPesable(found)) {
         handleOpenScale(found);
       } else {
         onAddToCart(found, 1);
       }
       setBarcodeInput('');
     } else {
       setSearchQuery(barcodeInput.trim());
       setBarcodeInput('');
     }
   };
   ```
4. **Pasar `handleOpenScale` al catálogo**:
   ```tsx
   <POSMultivendorCatalog
     products={products}
     stockMap={stockMap}
     onAddToCart={onAddToCart}
     onOpenScaleModal={handleOpenScale}
     searchFilter={searchQuery}
   />
   ```
5. **Renderizar `ManualWeightModal` al final del componente**:
   ```tsx
   {/* 4. MODAL TÁCTIL DE PESAJE MANUAL (M3: Trigger Balanza KG) */}
   <ManualWeightModal
     isOpen={Boolean(productoAPesar)}
     producto={productoAPesar}
     precioUnitario={
       productoAPesar
         ? Number(productoAPesar.precio_venta_pos || (productoAPesar as any).precioVenta || (productoAPesar as any).precio || 0)
         : 0
     }
     pesoInicial={1.0}
     onConfirm={(prod, pesoKg) => {
       onAddToCart(prod, pesoKg);
       setProductoAPesar(null);
     }}
     onClose={() => setProductoAPesar(null)}
   />
   ```

---

### Cambio 3: Parche Defensivo en `src/views/pos/components/ManualWeightModal.tsx`
Evitar el doble disparo en `handleConfirm` (líneas 105-114):
```tsx
    if (onConfirm) {
      onConfirm(producto, pesoNumerico);
      if (onConfirm.length === 1) {
        (onConfirm as any)(pesoNumerico);
      }
    } else if (onConfirmWeight) {
      onConfirmWeight(pesoNumerico);
    }
    onClose();
```

---

## 5. Verification Method

Para verificar independientemente la solución tras la implementación:

1. **Pruebas de Componente Existentes**:
   ```powershell
   npm test -- src/tests/posManualWeightModal.test.tsx --run
   ```
   *Criterio de éxito*: Los 6 tests existentes pasan al 100%.

2. **Nueva Suite TDD de Integración M3** (`src/tests/posManualWeightModal.test.tsx` o `src/tests/m3POSManualWeightTrigger.test.tsx`):
   Debe validar los siguientes 5 casos críticos:
   - **Caso 1**: Clic en tarjeta de producto KG en el catálogo despliega `ManualWeightModal` con los datos del ítem (`nombre`, `precioUnitario`, `data-testid="manual-weight-input"` con valor inicial 1).
   - **Caso 2**: Clic en tarjeta de producto unitario (`und`) agrega directamente al carrito con cantidad 1 sin desplegar el modal.
   - **Caso 3**: Escaneo de código de barras de ítem KG en `pos-light-barcode-input` despliega inmediatamente `ManualWeightModal` y limpia el input del escáner.
   - **Caso 4**: Confirmación de peso en el modal (ej. 2.5 kg) invoca `onAddToCart` con `(producto, 2.5)` y cierra el modal (`productoAPesar === null`).
   - **Caso 5**: Cancelación del modal (vía `onClose` o tecla `Escape`) cierra el modal sin alterar el carrito ni invocar `onAddToCart`.

3. **Verificación de No-Regresión**:
   ```powershell
   npm test -- src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx src/tests/m2POSMultivendor.test.tsx --run
   ```
   *Criterio de éxito*: Todos los tests pasan en verde (0 fallos).

4. **Verificación Estricta de Tipos TypeScript**:
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de éxito*: 0 errores de compilación TypeScript.
