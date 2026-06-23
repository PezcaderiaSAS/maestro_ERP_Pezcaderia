# Tasks - Dynamic Warehouse Configuration Integration

- [ ] **Database & Schema Configuration**
  - [ ] Add `'bodegas'` to `DB_KEYS` in `localDb.ts`

- [ ] **Global State & Synchronization (App.tsx)**
  - [ ] Define `bodegas` state with default values in `App.tsx`
  - [ ] Persist `bodegas` state to `localDb` on changes
  - [ ] Refactor stock auto-synchronization `useEffect` to map over dynamic `bodegas`
  - [ ] Pass `bodegas` and `setBodegas` props to `<InventoryView />` in view router

- [ ] **Sub-component Adaptations**
  - [ ] Update `<TransferForm />` to map active warehouses dynamically
  - [ ] Update `<PurchaseOrderForm />` to map active warehouses dynamically

- [ ] **WMS Module Tab Navigation**
  - [ ] Update `InventoryViewProps` interface in `InventoryView.tsx`
  - [ ] Add `'configuracion_bodegas'` tab button (visible to Admin/Administrativo)
  - [ ] Toggle active state rendering for the new tab
  - [ ] Bind dynamic `bodegas` configuration to all relevant view states

- [ ] **New Component (WarehouseConfigManager.tsx)**
  - [ ] Implement CRUD form (Nombre, Código, Descripción, Activa)
  - [ ] Implement active/inactive list table with premium design
  - [ ] Apply system-essential locks (`b-1` & `b-3` cannot be edited, deleted, or deactivated)
  - [ ] Implement stock existence validation before deactivation/deletion
  - [ ] Initialize new warehouses with zero stock entries across the catalog

- [ ] **Business Rules Documentation**
  - [ ] Append RN-53 to `DOCS/business_rules.md`

- [ ] **Verification**
  - [ ] Run `pnpm test:run` to verify test suite remains green
  - [ ] Manually test CRUD lifecycle, validations, and options synchronization
