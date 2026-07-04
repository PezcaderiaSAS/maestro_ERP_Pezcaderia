# ADR-013: Inventory Storage Abstraction and Migration Strategy

## Status
Accepted

## Date
2026-07-04

## Context
The inventory state in the Point of Sale (POS) system requires extremely fast, O(1) lookups to validate stock availability during the checkout process. Historically, the `stock` data was structured as a nested dictionary in `localDb` (e.g., `stock[bodegaId][sku] = quantity`) and the `useInventoryStore.ts` store interacted directly with `localDb.save()` and `localDb.load()` to persist this structure. 

However, the architecture requires all stores to use a generic `IDataService` interface (abstracting `LocalDataService` vs `SupabaseDataService`) to allow a seamless transition to a remote backend (Supabase) in the future. The generic `IDataService` interface inherently assumes table-like structures (arrays of records) rather than raw dictionary objects. This created a mismatch where the new data service layer expected collections, but the legacy `stock` data was a single large dictionary object.

## Decision
1. **Abstract Persistence via `IDataService`**: We updated `useInventoryStore` to strictly use the injected `dataService` instance instead of directly coupling to `localDb`.
2. **Singleton Pattern for Config/Dictionary Tables**: For entities that represent a single global state rather than a collection (like the `stock` dictionary or global `parametros`), we adopted a "singleton" pattern. The state is wrapped in an object with `id: 'singleton'` so the `dataService` can treat it as a standard record in a collection of size 1.
3. **On-the-Fly Migration**: In `useInventoryStore.loadStock()`, we implemented a migration logic that intercepts legacy array-based or raw dictionary-based stock structures and normalizes them into the expected O(1) dictionary format. If a migration occurs, the store automatically persists the normalized structure back via `dataService.update('stock', 'singleton', payload)`.
4. **Internal Zustand State**: The internal Zustand state `state.stock` remains a pure dictionary without the `id` field. The "singleton" wrapper is only applied at the persistence layer boundary before calling `dataService`.

## Alternatives Considered

### Direct Supabase JSONB Column
- **Pros**: Easy to store a massive dictionary without relation mapping.
- **Cons**: Still requires mapping a dictionary to a row in Supabase. We would eventually need a robust relational schema for `stock`. 
- **Rejected**: While feasible, it requires larger backend changes now. The singleton pattern allows us to progress locally without changing the fundamental contract of `IDataService`.

### Refactoring Stock into a Relational Array (Store Side)
- **Pros**: Matches traditional SQL table structure perfectly (e.g., `[{ sku: '123', bodegaId: 'B1', quantity: 10 }]`).
- **Cons**: Degrades performance in POS validations from O(1) to O(N). Every product scan would require an array lookup/filter.
- **Rejected**: Performance in the POS screen is mission-critical. The O(1) dictionary structure must be preserved in memory.

## Consequences
- **Positive**: The inventory store is now decoupled from `localDb` and fully compatible with any `IDataService` implementation.
- **Positive**: The system automatically heals and normalizes legacy data structures during the load phase without requiring manual migration scripts.
- **Neutral**: The generic `LocalDataService` had to be updated to gracefully handle single objects (dictionaries) during `getAll`, `create`, and `update` by wrapping them into an array or extracting them appropriately.
- **Negative**: When moving to Supabase, the "singleton" JSON approach for stock might need to be refactored into a proper relational `stock` table, and the `SupabaseDataService` will need to transform that relational data back into the O(1) dictionary expected by the frontend.
