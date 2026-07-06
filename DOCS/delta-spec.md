# Delta Specification: Dynamic Warehouse Configuration

This specification details the transition from hardcoded warehouses to a dynamic, database-backed configuration inspired by Odoo's warehouse management system (WMS), adapted for our React + localStorage stack.

## Comportamiento Actual
- **Hardcoding de Almacenes**: Las bodegas (`Bodega Principal`, `Bodega Secundaria`, y `Bodega Averías`) están definidas estáticamente en código dentro del `useEffect` de sincronización en `App.tsx` y en los elementos `<option>` de formularios (`TransferForm.tsx`, `PurchaseOrderForm.tsx`).
- **Persistencia**: La clave `pezcaderia_stock` almacena cantidades agrupadas por nombres de bodegas que asumen la existencia de estas tres bodegas fijas.
- **Validaciones POS e Inventario**: El POS realiza validaciones de inventario directamente contra la clave fija `'Bodega Principal'` (RN-07). Las devoluciones incrementan `'Bodega Principal'` o `'Bodega Averías'` según el estado del producto devuelto (RN-16).

## Comportamiento Objetivo
Inspirado por el modelo `stock.warehouse` de Odoo 18, introducimos una gestión dinámica de bodegas con las siguientes reglas:
1. **Configuración Dinámica (CRUD)**: Los administradores y administrativos podrán crear, editar y archivar/eliminar bodegas desde una nueva pestaña en el módulo de Inventario. Cada bodega tendrá: `id`, `nombre`, `codigo`, `activa` y `descripcion`.
2. **Protección de Almacenes Esenciales**:
   - `'Bodega Principal'` (ventas/POS) y `'Bodega Averías'` (mermas/devoluciones) son requeridas para la operación del sistema. No se permite su edición de código/nombre, desactivación o eliminación.
3. **Validación de Ciclo de Vida**:
   - No se permite desactivar ni eliminar una bodega que tenga existencias mayores a `0` para cualquier producto. El usuario debe trasladar el stock antes.
4. **Sincronización Automática de Stock**:
   - Al crear una nueva bodega, el catálogo completo de productos se sincroniza inicializando su stock en `0` para dicha bodega, evitando errores de referencias nulas al consultar el inventario.

## Invariantes del Sistema
- **Esquema de Stock**: La firma de estado `Record<string, StockItem[]>` (donde la clave es el nombre de la bodega) debe mantenerse para evitar cambios destructivos en POS, Reportes y Pricing.
- **Validación POS**: Las ventas en el POS se seguirán descontando y validando únicamente contra la bodega principal (`'Bodega Principal'`) para cumplir con RN-07.
- **Ruta de Devoluciones**: Las devoluciones seguirán ingresando físicamente a `'Bodega Principal'` o `'Bodega Averías'` según las inspecciones físicas (RN-16).

## Límites de Ámbito
Los cambios e integraciones se limitarán exclusivamente a los siguientes archivos:
- `src/services/localDb.ts` (Definición de claves de base de datos)
- `src/App.tsx` (Inicialización del estado de bodegas, persistencia y efecto de sincronización)
- `src/views/InventoryView.tsx` (Panel de WMS, navegación y paso de props)
- `src/views/inventory/components/TransferForm.tsx` (Consumo dinámico de bodegas origen/destino)
- `src/views/inventory/components/PurchaseOrderForm.tsx` (Consumo dinámico de bodegas destino)
- `src/views/inventory/components/WarehouseConfigManager.tsx` [NUEVO] (Interfaz de administración de bodegas)
- `DOCS/business_rules.md` (Documentación formal de reglas de negocio)
