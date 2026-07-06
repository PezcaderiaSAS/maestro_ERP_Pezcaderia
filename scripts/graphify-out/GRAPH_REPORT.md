# Graph Report - scripts  (2026-06-23)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 12 nodes · 15 edges · 3 communities (2 shown, 1 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `migrarClientes()` - 4 edges
2. `parseCSV()` - 3 edges
3. `migrarProductos()` - 3 edges
4. `ejecutarMigracion()` - 3 edges
5. `normalizarIdentificacion()` - 2 edges
6. `supabase` - 1 edges
7. `ClienteRow` - 1 edges
8. `ProductoRow` - 1 edges
9. `testPrompt` - 1 edges
10. `req` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (3 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.50
Nodes (5): ejecutarMigracion(), migrarClientes(), migrarProductos(), normalizarIdentificacion(), parseCSV()

### Community 1 - "Community 1"
Cohesion: 0.50
Nodes (3): ClienteRow, ProductoRow, supabase

## Knowledge Gaps
- **5 isolated node(s):** `supabase`, `ClienteRow`, `ProductoRow`, `testPrompt`, `req`
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `migrarClientes()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `parseCSV()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `migrarProductos()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `supabase`, `ClienteRow`, `ProductoRow` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._