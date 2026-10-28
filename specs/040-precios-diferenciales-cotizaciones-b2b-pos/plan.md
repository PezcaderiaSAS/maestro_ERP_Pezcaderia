# Plan Técnico de Implementación: SPEC-040
## Arquitectura Enterprise Cero-Latencia para Catálogos Masivos con Precios Diferenciales y Cotizaciones B2B

- **Código:** SPEC-040
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Fecha:** 2026-10-28
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico.

---

### 1. Desglose Arquitectónico y Estructura de Archivos

```
src/
├── workers/
│   ├── catalogSearch.worker.ts         # Web Worker ESM para indexación y búsqueda fuzzy off-thread
│   └── searchEngineCore.ts             # Motor matemático de búsqueda difusa, trigramas y tokenización
├── services/
│   ├── tenantIndexedDbService.ts       # Gestor asíncrono de IndexedDB por tenant (PezcaderiaERP_{tenantId})
│   ├── progressiveHydrationService.ts  # Ingesta en chunks con prioridad Pareto ABC (80/20)
│   ├── differentialPricingService.ts   # Motor de cálculo Detal / Mayorista / Umbral de volumen
│   └── b2bQuotationService.ts          # CRUD y ciclo de vida de cotizaciones B2B
├── hooks/
│   ├── useCatalogSearchWorker.ts       # Hook de integración reactiva con el Web Worker
│   ├── useVirtualGrid.ts               # Hook headless para virtualización de grillas y listas
│   └── useDifferentialPrice.ts         # Hook para resolución de precios en tiempo real
├── schemas/
│   ├── differentialPricing.schema.ts   # Esquemas Zod de precios duales y perfiles
│   └── b2bQuotation.schema.ts          # Esquemas Zod de cotización y conversión POS
├── types/
│   ├── indexedDb.types.ts              # Tipos TypeScript para esquemas locales
│   └── b2bQuotation.types.ts           # Tipos TypeScript de cotizaciones y tarifas
├── views/
│   ├── pos/components/
│   │   ├── VirtualProductGrid.tsx      # Grilla virtualizada ultra-fluida para ProductSearchPanel
│   │   └── PriceTierBadge.tsx          # Indicador visual de tarifa aplicada (Detal vs Mayorista)
│   └── quotations/
│       ├── B2BQuotationView.tsx        # Mesa de trabajo de cotizaciones B2B
│       └── ConvertToPosModal.tsx       # Modal de confirmación de conversión a Preventa POS
└── tests/
    ├── tenantIndexedDbService.test.ts  # Pruebas TDD de persistencia y aislamiento IndexedDB
    ├── searchEngineCore.test.ts        # Pruebas TDD del motor de búsqueda fuzzy off-thread
    ├── differentialPricing.test.ts     # Pruebas TDD de reglas de precios y umbrales
    ├── b2bQuotationService.test.ts     # Pruebas TDD de ciclo de vida de cotizaciones y conversión
    └── virtualGrid.test.tsx            # Pruebas TDD de virtualización y 120 FPS
```

---

### 2. Especificación Técnica de Componentes Clave

#### 2.1. `tenantIndexedDbService.ts` (Persistencia Aislada)
- Abre la base de datos `PezcaderiaERP_${tenantId}` versión `1`.
- Define almacenes de objetos (*Object Stores*):
  - `productos`: Clave primaria `sku`, índices en `nombre`, `codigo_barras`, `categoria`, `updated_at`.
  - `clientes`: Clave primaria `id`, índices en `nit_o_cedula`, `razon_social_o_nombre`, `perfil_precio`.
  - `stock`: Clave primaria `sku_bodega` (`${sku}__${bodegaKey}`).
  - `outbox_transactions`: Clave primaria `id` (cola de operaciones offline pendientes).
- Métodos clave:
  - `bulkUpsertProducts(items: Producto[]): Promise<number>`
  - `bulkUpsertClients(clientes: Cliente[]): Promise<number>`
  - `getTopParetoProducts(limit = 100): Promise<Producto[]>`
  - `searchByBarcode(barcode: string): Promise<Producto | null>`

#### 2.2. `catalogSearch.worker.ts` & `searchEngineCore.ts` (Búsqueda Off-Thread)
- Escucha mensajes del hilo principal:
  - `{ type: 'INDEX_DATASET', items: Producto[], clients: Cliente[] }`
  - `{ type: 'SEARCH_PRODUCTS', query: string, limit: number, category?: string }`
  - `{ type: 'SEARCH_CLIENTS', query: string, limit: number }`
- Estructura de índice en memoria RAM del Worker:
  - Mapa invertido por prefijos y trigramas.
  - Ponderación de relevancia: Coincidencia en SKU (peso 10), Coincidencia exacta en Nombre (peso 8), Coincidencia difusa (peso 4).
  - Tiempo de ejecución de consulta: **$\le 1.8\text{ ms}$** para 16.000 ítems.
- Retorna al hilo principal:
  - `{ type: 'SEARCH_PRODUCTS_RESULT', queryId, results: Producto[], durationMs }`

#### 2.3. `useVirtualGrid.ts` (Virtualización Headless)
- Parámetros: `totalItems: number`, `itemHeight: number`, `columnsCount: number`, `containerHeight: number`, `scrollTop: number`.
- Cálculos:
  - Rango de filas visibles: `startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)`.
  - Filas finales: `endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)`.
  - Nodos renderizados simultáneos: **Entre 12 y 24 tarjetas**, manteniendo el DOM ultra-ligero y scroll en 120 FPS.

#### 2.4. `differentialPricingService.ts` & Conversión POS
- Función de cálculo unificada:
  ```typescript
  export function resolverPrecioItem(
    producto: Producto,
    cantidad: number,
    perfilCliente: 'DETAL' | 'MAYORISTA' | 'CONTRATISTA' = 'DETAL'
  ): {
    precioUnitario: number;
    tarifaAplicada: 'DETAL' | 'MAYORISTA';
    descuentoAplicadoPct: number;
    ahorroTotal: number;
  }
  ```
- Conversión a Preventa POS:
  - Valida vigencia de cotización (`fecha_vencimiento >= hoy`).
  - Convierte cada ítem a formato `ItemPrefactura` con precio pactado.
  - Invoca `prefacturaService.crearPrefactura()` (de `SPEC-037`), reservando stock en bodega.
  - Actualiza estado de cotización a `'CONVERTIDA'`.

---

### 3. Estrategia de Pruebas TDD (Quality Gate Preceptivo)
1. **Fase RED:** Escribir pruebas unitarias que fallen para:
   - Ingesta en IndexedDB y aislamiento entre tenants.
   - Búsqueda fuzzy off-thread y velocidad sub-2ms.
   - Cálculo determinista de tarifas mayoristas y umbrales.
   - Conversión atómica de cotización a preventa POS.
2. **Fase GREEN:** Implementación mínima y modular de cada servicio y hook.
3. **Fase REFACTOR:** Optimización de memoria, verificación estricta de TypeScript y auditoría en Chrome DevTools.

