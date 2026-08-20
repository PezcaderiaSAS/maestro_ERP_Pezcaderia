# Loop Runbook: Dispatch Module & Inventory Link

## 1. Loop Meta
- **Pattern:** `sequential` (Task-driven execution)
- **Mode:** `safe` (Strict verification after each task)
- **Model Tier:** High capability (DeepSeek-R1 / Qwen-Coder via MCP or Claude) due to complex business logic around inventory state.
- **Stop Condition:** When all tasks in `task.md` regarding the Dispatch Module are completed and manually tested successfully.

## 2. Execution Steps

### Iteration 1: Create DispatchView UI Foundation
- **Goal:** Scaffold `src/views/inventory/DispatchView.tsx` and implement the basic UI for orders in `LISTO` state.
- **Actions:**
  - Create the new TSX file.
  - Integrate Zustand `useOrderStore` to filter orders by `estado === 'LISTO'`.
- **Validation:** Code compiles, `tsc --noEmit` passes.

### Iteration 2: Implement Dispatch Logic (Inventory Deduction)
- **Goal:** Implement the logic for assigning a vehicle/driver, registering inventory exits, and transitioning the order to `EN_DESPACHO`.
- **Actions:**
  - Integrate `useMovementStore` / `inventoryService.registrarSalida`.
  - Add SweetAlert2 confirmation before dispatching.
  - Update the order state and flag `inventarioDescontado: true`.
- **Validation:** Mock state change and verify the store gets updated properly.

### Iteration 3: Navigation & Integration (App.tsx)
- **Goal:** Make the new Dispatch module accessible to users.
- **Actions:**
  - Register the route `/dispatch` in `src/App.tsx`.
  - Add the corresponding link to the Sidebar in `src/App.tsx`.
- **Validation:** Ensure the app boots and the Sidebar shows the correct link. E2E verification is ready.

## 3. Safety Gates
- Before modifying `App.tsx`, run `graphify query "App.tsx structure"` to ensure no conflicts with existing routing.
- Before committing logic that affects stock, ensure the logic adheres strictly to `Bodega Principal` deduction as per RN-07.
