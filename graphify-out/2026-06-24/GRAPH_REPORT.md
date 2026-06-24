# Graph Report - MaestroPescaderia  (2026-06-24)

## Corpus Check
- 147 files · ~126,879 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 439 nodes · 755 edges · 39 communities (31 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f3c7180`
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
1. `compilerOptions` - 20 edges
2. `CashService` - 17 edges
3. `generateId()` - 12 edges
4. `TurnoCaja` - 12 edges
5. `ResultadoOperacion` - 11 edges
6. `load()` - 11 edges
7. `save()` - 10 edges
8. `scripts` - 9 edges
9. `Cliente` - 9 edges
10. `DevolucionPedido` - 9 edges

## Surprising Connections (you probably didn't know these)
- `System Design Architecture` --references--> `localDb Service`  [EXTRACTED]
  DOCS/system_design.md → src/services/localDb.ts
- `SuppliersViewProps` --references--> `Gasto`  [EXTRACTED]
  src/views/SuppliersView.tsx → src/App.tsx
- `OrderState` --references--> `Pedido`  [EXTRACTED]
  src/store/useOrderStore.ts → src/types/orders.types.ts
- `FulfillmentChecklistProps` --references--> `Pedido`  [EXTRACTED]
  src/views/inventory/components/FulfillmentChecklist.tsx → src/types/orders.types.ts
- `CierreCajaModalProps` --references--> `TurnoCaja`  [EXTRACTED]
  src/views/cash/components/CierreCajaModal.tsx → src/types/cash.types.ts

## Import Cycles
- 3-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 3-file cycle: `src/App.tsx -> src/views/OrderKanbanView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 3-file cycle: `src/App.tsx -> src/views/POSView.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/views/cash/components/CierreCajaModal.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/cash/CashFlowView.tsx -> src/views/cash/components/TrasladoDineroModal.tsx -> src/services/cashService.ts -> src/App.tsx`
- 4-file cycle: `src/App.tsx -> src/views/POSView.tsx -> src/views/OrderKanbanView.tsx -> src/services/cashService.ts -> src/App.tsx`

## Communities (39 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (38): FulfillmentChecklist(), FulfillmentChecklistProps, WeighingModal(), WeighingModalProps, AlistamientoBodegaView(), b2bService, App(), DomainEvent (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (34): TicketBuilder(), TicketBuilderProps, ClientePOS, usePOSCart(), ClientePrinter, usePOSPrinter(), MovimientoInventario, procesarProduccion() (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): dependencies, axios, jspdf, lucide-react, react, react-dom, @supabase/supabase-js, sweetalert2 (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (15): CashFlowViewProps, CierreCajaModal(), CierreCajaModalProps, TrasladoDineroModalProps, CashService, generateId(), Caja, EstadoTurno (+7 more)

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
Cohesion: 0.08
Nodes (34): CategoryManager(), ColdRoomPreparation(), DiscountPanel(), DiscountPanelProps, PaymentPanel(), PaymentPanelProps, ProductForm(), ProductionForm() (+26 more)

### Community 14 - "Community 14"
Cohesion: 0.43
Nodes (6): cajas, gastos_ruta, rutas, set_numero_ruta(), transacciones_caja, trg_set_numero_ruta

### Community 15 - "Community 15"
Cohesion: 0.53
Nodes (3): BalanzaButton(), BalanzaButtonProps, useBalanza()

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
- **164 isolated node(s):** `Contexto de Negocio: B2B y Ventas Externas`, `Contexto de Lógica: Inventario y Cuarto Frío`, `Máquina de Estados: Flujo Central de Pedidos (POS B2B)`, `🐟 Categoría A: Máxima Prioridad (Alta Rotación / Alto Valor)`, `🦐 Categoría B: Prioridad Media (Rotación Media)` (+159 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateId()` connect `Community 3` to `Community 0`, `Community 13`, `Community 7`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `CashService` connect `Community 3` to `Community 0`, `Community 13`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `ResultadoOperacion` connect `Community 3` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `Contexto de Negocio: B2B y Ventas Externas`, `Contexto de Lógica: Inventario y Cuarto Frío`, `Máquina de Estados: Flujo Central de Pedidos (POS B2B)` to the rest of the system?**
  _167 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06493506493506493 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09877551020408164 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._