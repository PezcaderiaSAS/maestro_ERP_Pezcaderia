# Graph Report - MaestroPescaderia  (2026-06-24)

## Corpus Check
- 152 files · ~129,554 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 457 nodes · 813 edges · 39 communities (31 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b04dd64`
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]

## God Nodes (most connected - your core abstractions)
1. `CashService` - 21 edges
2. `compilerOptions` - 20 edges
3. `TurnoCaja` - 14 edges
4. `generateId()` - 12 edges
5. `ResultadoOperacion` - 11 edges
6. `load()` - 11 edges
7. `save()` - 10 edges
8. `scripts` - 9 edges
9. `Cliente` - 9 edges
10. `DevolucionPedido` - 9 edges

## Surprising Connections (you probably didn't know these)
- `System Design Architecture` --references--> `localDb Service`  [EXTRACTED]
  DOCS/system_design.md → src/services/localDb.ts
- `CartPanelProps` --references--> `ClientePOS`  [EXTRACTED]
  src/views/pos/components/CartPanel.tsx → src/hooks/usePOSCart.ts
- `PaymentPanelProps` --references--> `ClientePOS`  [EXTRACTED]
  src/views/pos/components/PaymentPanel.tsx → src/hooks/usePOSCart.ts
- `App()` --calls--> `useWarehouseStore`  [EXTRACTED]
  src/App.tsx → src/store/useWarehouseStore.ts
- `ArqueoCajaModalProps` --references--> `TurnoCaja`  [EXTRACTED]
  src/views/cash/components/ArqueoCajaModal.tsx → src/types/cash.types.ts

## Import Cycles
- 3-file cycle: `src/App.tsx -> src/views/POSView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 3-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 3-file cycle: `src/App.tsx -> src/views/OrderKanbanView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/POSView.tsx -> src/views/pos/components/AperturaCajaModal.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/POSView.tsx -> src/views/cash/components/ArqueoCajaModal.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/POSView.tsx -> src/views/OrderKanbanView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/views/cash/components/ArqueoCajaModal.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/views/cash/components/CierreCajaModal.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/views/cash/components/TrasladoDineroModal.tsx -> src/services/cashService.ts -> src/App.tsx`

## Communities (39 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (29): FulfillmentChecklist(), FulfillmentChecklistProps, WeighingModal(), WeighingModalProps, AlistamientoBodegaView(), b2bService, App(), Cliente (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (17): MovimientoInventario, procesarProduccion(), registrarEntrada(), registrarSalida(), registrarTraslado(), StockItem, validarStock(), DB_KEYS (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): dependencies, axios, jspdf, lucide-react, react, react-dom, @supabase/supabase-js, sweetalert2 (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (19): CashFlowViewProps, AperturaCajaModalProps, ArqueoCajaModal(), ArqueoCajaModalProps, CierreCajaModal(), CierreCajaModalProps, TrasladoDineroModalProps, CashService (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, esModuleInterop, isolatedModules, jsx, jsxImportSource, lib (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (18): bodegas, cajas, clientes, conductores, configuracion_sistema, detalle_pedidos, gastos_ruta, get_current_user_role() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): cateEnd, catEnd, cateStart, catStart, content, crEnd, crStart, filePath (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.20
Nodes (8): WizardType, Empleado, Gasto, NominaRegistro, HRViewProps, calcDiasComerciales(), PayrollView(), PayrollViewProps

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (21): bodegas, clientes, conductores, configuracion_sistema, productos, proveedores, stock_bodegas, terceros (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (6): PurchasesReport(), PurchasesReportProps, MOCK_CATEGORIAS, MOCK_ORDENES, MOCK_PRODUCTS, MOCK_PROVEEDORES

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (10): calcular_valores_linea_pedido(), detalle_pedidos, pedidos, recalcular_cabecera_pedido(), recalcular_pedido_por_descuento_global(), set_numero_pedido(), trg_calcular_valores_linea, trg_recalcular_cabecera (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (6): hasTwentyApiKey(), twentyCompanies, twentyContacts, twentyOpportunities, CRMViewProps, TabType

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): 🐟 Categoría A: Máxima Prioridad (Alta Rotación / Alto Valor), 🦐 Categoría B: Prioridad Media (Rotación Media), 🦑 Categoría C: Baja Prioridad (Baja Rotación), Categorías, Cómo aplicar la Clasificación ABC en el ERP MaestroPescadería, Impacto en el Alistamiento de Bodega (Fulfillment), Manual de Clasificación ABC para Inventario

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (46): CategoryManager(), ColdRoomPreparation(), ProductForm(), ProductionForm(), ProductTable(), PurchaseOrderForm(), ReturnsReceiver(), TransferForm() (+38 more)

### Community 14 - "Community 14"
Cohesion: 0.43
Nodes (6): cajas, gastos_ruta, rutas, set_numero_ruta(), transacciones_caja, trg_set_numero_ruta

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (24): AperturaCajaModal(), BalanzaButton(), BalanzaButtonProps, CartPanel(), CartPanelProps, DiscountPanel(), DiscountPanelProps, LineaVentaRow() (+16 more)

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (5): actualizar_stock_bodegas_por_lote(), lotes_inventario, ordenes_produccion, trg_actualizar_stock_lote, RN-09: Tolerancia de merma

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (4): detalle_devoluciones, detalle_pedidos, devoluciones_pedidos, logistica_despacho

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (4): args, https, LIBRARIES, req

### Community 19 - "Community 19"
Cohesion: 0.50
Nodes (4): desactivar_acceso_usuario_por_desvinculacion(), empleados, trg_desactivar_acceso_empleado, RN-15: Egreso de empleado desactiva acceso

## Knowledge Gaps
- **166 isolated node(s):** `Bodega`, `WarehouseState`, `EstadoTurno`, `CashFlowViewProps`, `AperturaCajaModalProps` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CashService` connect `Community 3` to `Community 0`, `Community 15`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `generateId()` connect `Community 3` to `Community 15`, `Community 13`, `Community 7`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `ResultadoOperacion` connect `Community 3` to `Community 0`, `Community 1`, `Community 15`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `Bodega`, `WarehouseState`, `EstadoTurno` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09102564102564102 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13704994192799072 - nodes in this community are weakly interconnected._