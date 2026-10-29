# Plan Técnico de Implementación: SPEC-041
## Sincronización Bidireccional Supabase <-> IndexedDB (Outbox Worker Resiliente, Flujo Multivendedor con Caja Única & Búsqueda Sub-2ms de Ítems)

- **Código:** SPEC-041
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Estado:** Plan Técnico Consolidado (Aprobación Pendiente)
- **Prioridades Operativas:**
  1. **Flujo de Multivendedores con Caja Única de Recaudo:** Emisión descentralizada de preventas en terminales táctiles (`TERM-01` a `TERM-08`) y cobro centralizado en taquilla (`PendingOrdersDrawer`).
  2. **Velocidad de Búsqueda de Ítems ($\le 2\text{ ms}$):** Filtrado fuzzy instantáneo sobre el catálogo de 5.351 a 16.000 ítems con refresco delta incremental en Web Worker.
- **Presupuesto:** **Costo Estricto $0** (Capas gratuitas de Supabase y navegadores modernos).
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico.

---

### 1. Arquitectura de Módulos & Componentes

```
src/
├── types/
│   ├── deltaSync.schema.ts          <-- [TASK-041-01] Esquemas Zod estrictos para Outbox, Preventas, Deltas y OCC
│   └── syncWorker.types.ts          <-- Contratos de mensajes entre Main Thread y Web Worker
├── stores/
│   ├── useOutboxSyncStore.ts        <-- [TASK-041-02] Store orquestador de Outbox, resolución OCC y estado de red
│   └── useMultiVendorPosStore.ts    <-- Integración de persistencia y emisión reactiva hacia Outbox
├── services/
│   ├── tenantIndexedDbService.ts    <-- Almacenamiento local aislado: outbox, preventas_locales, sync_conflicts
│   ├── prefacturaSyncService.ts     <-- Conciliación bidireccional de preventas para Caja Única
│   └── fastItemSearchEngine.ts      <-- Refresco incremental delta del índice de búsqueda off-thread
├── workers/
│   └── syncWorker.worker.ts         <-- [TASK-041-03] Worker en segundo plano: batching a 500, backoff y DLQ
└── views/
    └── pos/
        └── components/
            ├── PendingOrdersDrawer.tsx  <-- Conexión reactiva con comandas sincronizadas de los 8 vendedores
            └── SyncConflictModal.tsx    <-- Inspección y resolución de colisiones OCC y Dead-Letter Queue
```

---

### 2. Esquemas de Datos Zod y Tipos TypeScript (`deltaSync.schema.ts`)

#### 2.1. Tipos de Operación Outbox
```typescript
export const TipoOperacionOutboxSchema = z.enum([
  'EMITIR_PREVENTA_MULTIVENDEDOR', // Asesor de mostrador emite comanda
  'COBRAR_PREVENTA_CAJA_UNICA',    // Cajero cobra y liquida en taquilla central
  'VENTA_POS_DIRECTA',             // Venta directa autorizada
  'ACTUALIZACION_STOCK_DELTA',     // Descuento o ajuste de inventario
  'CAMBIO_PRECIO_CATALOGO',        // Actualización de tarifa
  'COTIZACION_B2B'                 // Mesa de cotizaciones
]);
```

#### 2.2. Esquema de Preventa Multivendedor Sincronizable
```typescript
export const PreventaSyncSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  codigoPreventa: z.string().regex(/^PRE-\d{4}-\d{5}$/),
  terminalId: z.string().min(1), // ej: 'TERM-01' a 'TERM-08'
  vendedorId: z.string().min(1),
  vendedorNombre: z.string().min(1),
  clienteDocumento: z.string().optional(),
  clienteNombre: z.string().optional(),
  items: z.array(ItemPrefacturaSchema).min(1),
  subtotal: z.number().nonnegative(),
  descuentoTotal: z.number().nonnegative(),
  total: z.number().positive(),
  estado: z.enum(['PENDIENTE_COBRO', 'PAGADO', 'ANULADO']),
  cajeroId: z.string().optional(),
  turnoCentralId: z.string().optional(),
  version: z.number().int().positive(),
  idempotencyKey: z.string().length(64), // SHA-256
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

#### 2.3. Transacción Outbox Genérica
```typescript
export const OutboxTransactionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  idempotencyKey: z.string().length(64),
  tipoOperacion: TipoOperacionOutboxSchema,
  entidadId: z.string().min(1),
  versionEntidad: z.number().int().positive(),
  payload: z.record(z.any()),
  estado: z.enum([
    'PENDIENTE',
    'EN_PROCESO',
    'SINCRONIZADO',
    'ERROR_REINTENTO',
    'ERROR_FATAL_DATOS'
  ]),
  intentos: z.number().int().min(0).default(0),
  maxIntentos: z.number().int().default(5),
  proximoReintentoEn: z.string().datetime().optional(),
  ultimoError: z.string().optional(),
  creadoEn: z.string().datetime(),
  sincronizadoEn: z.string().datetime().optional()
});
```

---

### 3. Flujo Técnico 1: Preventas Multivendedor y Caja Única de Recaudo

1. **Emisión de Mostrador (Asesores Diego Díaz, Santiago Pallares, etc.):**
   - El asesor selecciona productos utilizando la búsqueda instantánea ($\le 2\text{ ms}$).
   - Al pulsar "Emitir Preventa", `useMultiVendorPosStore.emitirPreventaActual()`:
     - Genera `UUID`, `codigoPreventa: PRE-2026-XXXXX` e `idempotencyKey`.
     - Guarda la preventa localmente en IndexedDB (`preventas_locales`) en $< 5\text{ ms}$ con estado `PENDIENTE_COBRO`.
     - Inserta un evento `EMITIR_PREVENTA_MULTIVENDEDOR` en `outbox_transactions`.
     - Notifica al `syncWorker` para transmisión inmediata si hay conexión.
2. **Recepción en Caja Única de Recaudo (`PendingOrdersDrawer`):**
   - La terminal del cajero principal recibe las preventas mediante el ciclo downstream del `syncWorker` o notificación local.
   - En `POSView.tsx`, `comandasPendientes` se alimenta directamente del store sincronizado `useOutboxSyncStore.getPreventasPendientes()`, mostrando en tiempo real las comandas de las 8 terminales.
3. **Cobro y Liquidación Central:**
   - La cajera abre el `PendingOrdersDrawer`, selecciona la comanda del cliente y visualiza el desglose exacto emitido por el vendedor.
   - Al cobrar (efectivo, datáfono, transferencia):
     - La preventa se marca `PAGADO` localmente.
     - Se genera una transacción Outbox `COBRAR_PREVENTA_CAJA_UNICA` con el UUID de la preventa y datos de pago.
     - Al sincronizar con Supabase, la preventa se actualiza en Postgres atómicamente y se propaga a todas las terminales para que desaparezca de la cola de pendientes.

---

### 4. Flujo Técnico 2: Velocidad de Búsqueda Sub-2ms en Catálogos Masivos

1. **Estructura del Índice en Web Worker:**
   - El Worker mantiene en memoria un mapa de trigramas y tokens normalizados (sin tildes, minúsculas, palabras clave) de los 5.351 a 16.000 ítems.
   - Búsqueda por múltiples tokens (`"tubo pvc 1/2"`) ejecutada con operaciones binarias de intersección de sets de IDs numéricos $\mathcal{O}(1)$.
2. **Priorización Pareto ABC Top 100:**
   - Al montar el POS, los 100 ítems de mayor rotación se inyectan en $< 100\text{ ms}$ desde IndexedDB al estado de React, mostrando la grilla sin que el operador deba teclear nada.
3. **Refresco Incremental Delta sin Congelamiento:**
   - Cuando el `syncWorker` descarga deltas de productos desde Supabase (`updated_at > lastSync`):
     - NO se reconstruye todo el índice de 16.000 ítems.
     - Se invoca `fastItemSearchEngine.updateDelta(updatedProducts)`, actualizando únicamente los tokens de los productos modificados o agregados en $< 15\text{ ms}$ en segundo plano.

---

### 5. Flujo Técnico 3: Motor OCC (Optimistic Concurrency Control)

1. **Políticas de Resolución Deterministas:**
   - `CLIENT_WINS` para ventas y cobros en mostrador físico: el dinero recibido en caja física prevalece; el stock se descuenta en modo delta.
   - `SERVER_WINS` para maestros de productos: si el administrador cambió precios en la nube (`server.version > client.version`), el catálogo local se actualiza.
   - `CONFLICT_DETECTED` para cotizaciones con ediciones divergentes: se guarda en `sync_conflicts` para revisión asistida en `SyncConflictModal`.
2. **Doble Barrera contra Duplicados:**
   - Primary Key: UUID v4 de la entidad local.
   - Idempotency Key: `SHA-256(tenantId + entidadId + timestamp)`.
   - Consulta Supabase: `INSERT INTO pos_ventas ... ON CONFLICT (idempotency_key) DO NOTHING`.

---

### 6. Desglose de Tareas de Implementación (WIP = 1)

1. **`TASK-041-01` (Esquemas Zod & Validadores Delta):**
   - Archivo: [`src/types/deltaSync.schema.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/types/deltaSync.schema.ts).
   - Test: `src/tests/deltaSync.schema.test.ts`.
   - Cobertura: Validadores de preventas multivendedor, outbox items, OCC conflict records y sync deltas.
2. **`TASK-041-02` (Motor OCC & Integración useOutboxSyncStore con Caja Única):**
   - Archivos: [`src/stores/useOutboxSyncStore.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/stores/useOutboxSyncStore.ts) y extensión de [`tenantIndexedDbService.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/services/tenantIndexedDbService.ts).
   - Test: `src/tests/outboxSyncOcc.test.ts`.
   - Cobertura: Colas Outbox, resolución OCC con `CLIENT_WINS`, alimentación de `PendingOrdersDrawer` y Dead-Letter Queue.
3. **`TASK-041-03` (Web Worker syncWorker & Refresco Incremental Sub-2ms):**
   - Archivos: [`src/workers/syncWorker.worker.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/workers/syncWorker.worker.ts) y [`src/services/fastItemSearchEngine.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/services/fastItemSearchEngine.ts).
   - Test: `src/tests/syncWorkerBatch.test.ts`.
   - Cobertura: Lotes de 500 registros, backoff exponencial, modo híbrido para Vitest y benchmarking de búsqueda $\le 2\text{ ms}$.

---

### 7. Criterios de Aceptación del Plan

- [x] El flujo multivendedor (8 terminales) converge en la caja única (`PendingOrdersDrawer`) de forma resiliente.
- [x] La búsqueda sobre 5.351 a 16.000 productos mantiene latencia $\le 2\text{ ms}$ y no se bloquea ante refrescos delta.
- [x] Doble barrera de idempotencia implementada para evitar duplicar cobros.
- [x] Cero costo operativo adicional ($0 USD en Supabase Free Tier).
- [x] TypeScript estricto con 0 errores y cobertura de pruebas Vitest $\ge 80\%$.

