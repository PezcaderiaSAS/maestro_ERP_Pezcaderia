# Technical Integration Plan: Dynamic Warehouse Configuration

We will integrate dynamic warehouse configuration using Odoo 18 architectural concepts (separation of domain model configs, state safety checks, and automatic initialization) adapted to our React application.

## 1. Database & Persistence Layer
- Modify [localDb.ts](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/services/localDb.ts):
  - Add `bodegas` key to `DB_KEYS` pointing to `'pezcaderia_bodegas'`.

## 2. Global State & Sincronización in App.tsx
- Modify [App.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/App.tsx):
  - Add `bodegas` state initialized with the 3 default warehouses.
  - Set up a `useEffect` to save `bodegas` to `localDb` when changed.
  - Refactor the existing stock synchronization `useEffect` (lines 1003-1045) to loop through the `bodegas` state instead of the hardcoded `const bodegas` array.
  - Pass `bodegas` and `setBodegas` props to `<InventoryView />`.

## 3. UI Integration in InventoryView.tsx
- Modify [InventoryView.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/InventoryView.tsx):
  - Update prop interfaces.
  - Add `'configuracion_bodegas'` to `viewMode` tabs.
  - Render a new button for `Configuración de Bodegas` (only for admin/administrativo roles).
  - Inject the dynamic lists into forms (`TransferForm`, `PurchaseOrderForm`).
  - Render `<WarehouseConfigManager />` under the new tab.

## 4. Forms Modification
- Modify [TransferForm.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/inventory/components/TransferForm.tsx):
  - Dynamic options from active `bodegas`.
- Modify [PurchaseOrderForm.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/inventory/components/PurchaseOrderForm.tsx):
  - Dynamic options from active `bodegas`.

## 5. Warehouse Management Component
- Create [WarehouseConfigManager.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/inventory/components/WarehouseConfigManager.tsx):
  - High fidelity UI matching MaestroPescadería styling.
  - CRUD operations: list, create, edit, toggle active state, delete.
  - Validation: prevent changing/deleting `Bodega Principal` (id `'b-1'`) and `Bodega Averías` (id `'b-3'`).
  - Validation: prevent deletion or deactivation of any warehouse that has `stock > 0` for any SKU in catalog.
