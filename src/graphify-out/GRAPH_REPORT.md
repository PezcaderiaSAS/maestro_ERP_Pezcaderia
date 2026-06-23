# Graph Report - src  (2026-06-23)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 226 nodes · 520 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72e849ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `CashService` - 17 edges
2. `save()` - 15 edges
3. `load()` - 13 edges
4. `generateId()` - 12 edges
5. `TurnoCaja` - 12 edges
6. `InventoryViewProps` - 10 edges
7. `Cliente` - 9 edges
8. `DevolucionPedido` - 9 edges
9. `Product` - 9 edges
10. `ResultadoOperacion` - 9 edges

## Surprising Connections (you probably didn't know these)
- `PayrollViewProps` --references--> `Gasto`  [EXTRACTED]
  views/PayrollView.tsx → App.tsx
- `InventoryViewProps` --references--> `CategoriaConfig`  [EXTRACTED]
  views/InventoryView.tsx → App.tsx
- `CartItem` --references--> `Product`  [EXTRACTED]
  views/POSView.tsx → App.tsx
- `InventoryViewProps` --references--> `Bodega`  [EXTRACTED]
  views/InventoryView.tsx → services/warehouseService.ts
- `CierreCajaModalProps` --references--> `TurnoCaja`  [EXTRACTED]
  views/cash/components/CierreCajaModal.tsx → types/cash.types.ts

## Import Cycles
- 3-file cycle: `App.tsx -> views/cash/CashFlowView.tsx -> services/cashService.ts -> App.tsx`
- 3-file cycle: `App.tsx -> views/OrderKanbanView.tsx -> services/cashService.ts -> App.tsx`
- 3-file cycle: `App.tsx -> views/POSView.tsx -> services/cashService.ts -> App.tsx`
- 4-file cycle: `App.tsx -> views/cash/CashFlowView.tsx -> views/cash/components/CierreCajaModal.tsx -> services/cashService.ts -> App.tsx`
- 4-file cycle: `App.tsx -> views/cash/CashFlowView.tsx -> views/cash/components/TrasladoDineroModal.tsx -> services/cashService.ts -> App.tsx`
- 4-file cycle: `App.tsx -> views/POSView.tsx -> views/OrderKanbanView.tsx -> services/cashService.ts -> App.tsx`

## Communities (13 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (37): App(), Cliente, Conductor, DevolucionPedido, DomainEvent, DynamicField, Gasto, INITIAL_CLIENTS (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (15): generateId(), CashFlowViewProps, CierreCajaModal(), CierreCajaModalProps, TrasladoDineroModalProps, CashService, Caja, EstadoTurno (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (22): MovimientoInventario, procesarProduccion(), registrarEntrada(), registrarSalida(), registrarTraslado(), StockItem, validarStock(), DB_KEYS (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (20): TicketBuilder(), TicketBuilderProps, ClientePOS, usePOSCart(), ClientePrinter, usePOSPrinter(), Bodega, Categoria (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (16): CategoriaConfig, CategoryManager(), ColdRoomPreparation(), ProductForm(), ProductionForm(), ProductTable(), PurchaseOrderForm(), PurchasesReport() (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (7): Empleado, NominaRegistro, WizardType, HRViewProps, calcDiasComerciales(), PayrollView(), PayrollViewProps

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (6): hasTwentyApiKey(), twentyCompanies, twentyContacts, twentyOpportunities, CRMViewProps, TabType

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): b2bService, EstadoPedido, LineaPedido, Pedido, ColumnId, OrderKanbanViewProps

### Community 8 - "Community 8"
Cohesion: 0.53
Nodes (3): BalanzaButton(), BalanzaButtonProps, useBalanza()

## Knowledge Gaps
- **41 isolated node(s):** `INITIAL_CLIENTS`, `INITIAL_PROVEEDORES`, `INITIAL_CONDUCTORES`, `INITIAL_PRODUCTS`, `DomainEvent` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateId()` connect `Community 1` to `Community 0`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `CashService` connect `Community 1` to `Community 0`, `Community 7`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `save()` connect `Community 2` to `Community 7`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `INITIAL_CLIENTS`, `INITIAL_PROVEEDORES`, `INITIAL_CONDUCTORES` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0803633822501747 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._