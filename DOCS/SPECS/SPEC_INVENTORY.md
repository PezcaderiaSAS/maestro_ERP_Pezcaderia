# SPEC-02: Módulo Inventario / WMS

**Versión:** 1.0 | **Fecha:** 2026-06-19 | **Estado:** `APROBADO`
**Archivo actual:** `src/views/InventoryView.tsx` (142 KB — refactoring requerido)

---

## Resumen Ejecutivo

El módulo de Inventario gestiona el catálogo de productos, el stock por bodega, las compras y los traslados entre bodegas. Es la fuente de verdad de existencias para todos los demás módulos del ERP.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/inventory.types.ts

export interface Producto {
  id: string;
  sku: string;                           // ÚNICO en el catálogo
  nombre: string;
  categoriaId: string;
  unidadMedida: 'KG' | 'UNIDAD' | 'GRAMO';
  precioCompra: number;
  precioVentaPOS: number;
  precioVentaRestaurante: number;
  precioVentaMayorista: number;
  codigoBarras: string | null;
  imagenUrl: string | null;
  bufferSeguridad: number;               // Nivel mínimo para alerta de stock
  activo: boolean;
}

export interface Categoria {
  id: string;
  tipo: string;    // Nivel 1 (ej: "Pescados")
  linea: string;   // Nivel 2 (ej: "Frescos")
  clase: string;   // Nivel 3 (ej: "Entero")
}

export interface StockBodega {
  bodegaId: string;
  productoId: string;
  cantidad: number;
}

export interface Bodega {
  id: string;
  nombre: string;
  ubicacion: string;
  activa: boolean;
}

export interface OrdenCompra {
  id: string;
  numeroFacturaProveedor: string;
  proveedorId: string;
  bodegaId: string;
  fecha: string;
  total: number;
  formaPago: 'CREDITO' | 'CONTADO';
  estado: 'SOLICITADO' | 'RECIBIDO' | 'ANULADO';
  idempotencyKey: string;
  lineas: LineaCompra[];
}

export interface LineaCompra {
  id: string;
  productoId: string;
  loteProveedor: string;
  fechaVencimiento: string;
  cantidad: number;
  precioCompra: number;
  totalLinea: number;
}

export interface LineaTraslado {
  productoId: string;
  cantidad: number;
}

export interface ResultadoOperacion<T> {
  data: T | null;
  error: string | null;
}
```

### 1.2 Input / Output

| Dato | Dirección | Clave localDb |
|---|---|---|
| Catálogo productos | Lectura + Escritura | `productsCatalog` |
| Stock por bodega | Lectura + Escritura | `stock` |
| Categorías | Lectura + Escritura | `categorias` |
| Órdenes de compra | Lectura + Escritura | `ordenesCompra` |
| Movimientos | Solo Escritura | `movimientos` |

---

## 2. Reglas de Negocio

**Heredadas:** `RN-01` (stock no negativo), `RN-02` (traslado atómico), `RN-03` (FEFO)

**Específicas:**
```
DADO registro de compra confirmada
ENTONCES (atómico):
  stock[bodega][producto] += cantidad_por_linea
  movimiento tipo "ENTRADA_COMPRA" registrado
  precio_compra del producto actualizado al último precio pagado

DADO creación de producto nuevo
ENTONCES:
  SKU debe ser ÚNICO → si duplicado: BLOQUEADO, "SKU duplicado: {sku}"
  Los tres niveles de categoría (Tipo, Línea, Clase) son OBLIGATORIOS
  Si precioVenta < precioCompra → ADVERTENCIA (no bloqueo)

DADO consulta de stock de un producto
ENTONCES:
  Mostrar stock_total = SUM(stock de todas las bodegas)
  Si stock_total <= bufferSeguridad → alerta visual activa
```

---

## 3. Plan de Refactoring

### Archivo actual: `src/views/InventoryView.tsx` — 142 KB

### Estructura objetivo
```
src/views/inventory/
├── InventoryView.tsx             ← Orquestador (< 200 líneas)
├── components/
│   ├── ProductTable.tsx          ← Tabla de productos con stock
│   ├── ProductForm.tsx           ← CRUD de producto
│   ├── StockByWarehouse.tsx      ← Desglose por bodega
│   ├── PurchaseOrderForm.tsx     ← Formulario de compra
│   ├── TransferForm.tsx          ← Traslado entre bodegas
│   ├── LotesTable.tsx            ← Lotes y vencimientos
│   ├── CategoryManager.tsx       ← Gestión Tipo > Línea > Clase
│   └── StockAlertBadge.tsx       ← Indicador de stock bajo
└── hooks/
    ├── useInventory.ts           ← Estado general
    ├── usePurchaseOrder.ts       ← Lógica de compras
    └── useStockTransfer.ts       ← Lógica de traslados (RN-02)
src/services/
└── inventoryService.ts          ← Lógica de negocio pura
src/types/
└── inventory.types.ts
src/tests/
└── inventory.test.ts
```

### Orden de extracción
1. Tipos → `inventory.types.ts`
2. Lógica pura → `inventoryService.ts`
3. `StockAlertBadge.tsx` (más simple)
4. `CategoryManager.tsx` (autónomo)
5. `useStockTransfer.ts` + `TransferForm.tsx`
6. `usePurchaseOrder.ts` + formularios de compra
7. `ProductForm.tsx` + `ProductTable.tsx`
8. Simplificar `InventoryView.tsx`

---

## 4. Criterios de Validación (Tests)

### Éxito

| ID | Escenario | Resultado esperado |
|---|---|---|
| T-INV-01 | Registrar compra 100 kg | stock += 100, movimiento registrado |
| T-INV-02 | Traslado atómico 50 kg de A a B | A -= 50, B += 50 simultáneo |
| T-INV-03 | Crear producto SKU único | Producto creado en catálogo |
| T-INV-04 | Stock <= bufferSeguridad | Alerta visual activa |

### Error

| ID | Escenario | Resultado esperado |
|---|---|---|
| T-INV-E01 | Traslado con stock insuficiente | BLOQUEADO: "Stock insuficiente en bodega origen" |
| T-INV-E02 | SKU duplicado | BLOQUEADO: "SKU duplicado: {sku}" |
| T-INV-E03 | Línea de compra cantidad = 0 | BLOQUEADO en validación de formulario |

---

## 5. Notas de Implementación

- `inventoryService.registrarSalida()` y `registrarEntrada()` son las **únicas** funciones que escriben en `localDb('stock')`. Ningún otro módulo debe hacerlo directamente.
- El stock total se calcula en `inventoryService.getStockTotal(productoId)` sumando todos los `StockBodega` del producto. Nunca calcular en el componente.
- Los lotes FEFO (RN-03) son una sugerencia en la UI, no un bloqueo.
