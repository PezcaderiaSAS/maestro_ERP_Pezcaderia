# Especificación Funcional & Técnica: SPEC-040
## Arquitectura Enterprise Cero-Latencia para Catálogos Masivos (IndexedDB Aislada, Web Worker Search & Virtualización 3X) con Precios Diferenciales y Cotizaciones B2B POS

- **Código:** SPEC-040
- **Fase:** Spec Kit SDD v3.0 — `/speckit.specify`
- **Estado:** Especificación Consolidada Post-Interrogatorio `/grill-me`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico.
- **Tenants Operativos:** `tenant-03` (Ferretería Josase S.A.S. - Catálogo real de 5.351 ítems y 9.550 clientes, dimensionado a **escala 3X: 16.000 ítems y 30.000 clientes**) y `tenant-01` (La Pezcadería S.A.S.).
- **Estándar Visual:** Dark Glassmorphism V8 (`#070A10`), retícula de 8px, composite GPU 120 FPS, WCAG 2.2 AA+.

---

### 1. El "Qué" y el "Por Qué" (Business Problem & Enterprise Architecture Solution)

#### 1.1. Contexto y Diagnóstico Crítico de Latencia
En la versión previa, la carga del catálogo de Ferretería Josase (5.351 productos y 9.550 clientes) presentaba cuellos de botella severos:
1. **Sobrecarga del Hilo Principal (Main UI Thread Jank):** La importación dinámica de JSONs (~9 MB en total) y la deserialización síncrona bloqueaban el bucle de eventos de V8 por más de 1.5 a 3.5 segundos, congelando la interfaz.
2. **Límite de `localStorage` Excedido (`QuotaExceededError`):** El almacenamiento web estándar de 5MB colapsaba al intentar persistir los 9.550 clientes y 5.351 productos, obligando a mantener los datasets únicamente en memoria volátil de Zustand.
3. **Escala 3X (16.000 ítems y 30.000 clientes):** Asumiendo la carga de una empresa de ferretería o distribución del triple de tamaño (~25-30 MB de datos), el filtrado reactivo con `.filter()` síncrono en cada pulsación del teclado (`search-as-you-type`) degrada los fotogramas por debajo de 20 FPS y arriesga crashes por memoria en laptops de mostrador.

#### 1.2. Solución Arquitectónica Enterprise de Cero Latencia
Basada en las investigaciones MCP (`context7`, `brave`), el diagnóstico del enjambre `Agency Swarm` (`SoftwareArchitect`) y los 5 acuerdos cerrados en el interrogatorio `/grill-me`:

1. **Persistencia Local Aislada por Tenant en IndexedDB:**  
   Bases de datos independientes por empresa: `PezcaderiaERP_{tenantId}` (ej. `PezcaderiaERP_tenant-03`). Aislamiento físico estricto, cuota de gigabytes, operaciones de lectura/escritura asíncronas no bloqueantes e inmunidad contra fugas de datos entre inquilinos (Zero Cross-Tenant Leakage).
2. **Motor de Búsqueda Off-Thread en Web Worker Dedicado:**  
   Un Web Worker desacoplado ejecuta la indexación de tokens y el algoritmo de búsqueda difusa (Fuzzy Search / Trigram Index) en un hilo secundario del navegador. Tiempo de respuesta de búsqueda **$\le 2\text{ ms}$** sin afectar los 120 FPS del hilo de renderizado de React.
3. **Virtualización Headless de la Grilla de Catálogo:**  
   Implementación de virtualización con ventana dinámica (`useVirtualGrid` / `@tanstack/react-virtual`). El DOM renderiza exclusivamente las 12-16 tarjetas visibles en el viewport actual, reciclando nodos DOM al scrollear. Consumo de memoria constante $\mathcal{O}(1)$.
4. **Ingesta Progresiva con Prioridad Pareto ABC (80/20):**  
   Al abrir la app o conmutar de empresa, el POS se vuelve interactivo en **$< 150\text{ ms}$** cargando el Top 100 de productos y clientes más frecuentes (principio Pareto 80/20 constitucional). En segundo plano, el Worker descarga e hidrata IndexedDB en lotes (*chunks*) de 1.000 registros, con un indicador de sincronización en la barra superior (`EnterpriseTopbar`).
5. **Sincronización Delta y Resiliencia Offline (Outbox Pattern):**  
   Mantenimiento de marcas de tiempo `updated_at > lastSync` para sincronizar únicamente novedades con Supabase. Descuento de stock instantáneo y optimista en IndexedDB local con cola de salida asíncrona.
6. **Motor de Precios Dual & Cotizaciones B2B con Conversión a Venta POS:**  
   Soporte nativo para `precioDetal`, `precioMayorista`, umbral `cantidadMinimaMayorista`, perfiles de cliente B2B y conversión atómica en 1-clic de Cotización a Preventa (`pos_prefacturas`) en el Kanban de Caja Central (SPEC-037).

---

### 2. Mandatory Multi-Phase System Modeling (5 Diagramas Mermaid)

#### 2.1. Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)

```mermaid
flowchart TD
    A["Apertura de App / Cambio de Tenant"] --> B["Verificación de Base de Datos IndexedDB (PezcaderiaERP_{tenantId})"]
    B --> C{"¿Existen datos locales en IndexedDB?"}
    
    C -- "Sí (Caché Lista)" --> D["Carga Instantánea Top 100 Pareto ABC (< 150ms)"]
    C -- "No (Primera Carga)" --> E["Carga Rápida de Semilla Pareto Top 100"]
    
    D --> F["POS Listo e Interactivo a 120 FPS"]
    E --> F
    
    F --> G["Lanzamiento de Background Search Worker"]
    G --> H["Hidratación Progresiva en Chunks de 1.000 registros"]
    H --> I["Indexación Off-Thread de 16.000 ítems y 30.000 clientes"]
    I --> J["Sincronización Delta con Supabase (updated_at > lastSync)"]
    
    F --> K["Usuario Teclea en Mostrador (Search-as-you-type)"]
    K --> L["postMessage al Web Worker (query)"]
    L --> M["Búsqueda Fuzzy Off-Thread (< 2ms)"]
    M --> N["Retorno de SKUs coincidentes a React"]
    N --> O["Grilla Virtualizada: Renderiza solo 12-16 tarjetas en Viewport"]
    O --> P["Selección de Producto y Aplicación de Tarifa (Detal / Mayorista)"]
    P --> Q["Emisión de Preventa / Cotización B2B con Conversión POS"]
```

---

#### 2.2. Diagrama 2: Lógica de Decisión y Edge Cases (`2_decision_logic_diagrams`)

```mermaid
flowchart TD
    QueryIn["Input de Búsqueda del Operador"] --> LenCheck{"¿Longitud de texto >= 1 carácter?"}
    
    LenCheck -- "No" --> ShowPareto["Mostrar Top 100 ítems más vendidos (Pareto ABC)"]
    LenCheck -- "Sí" --> SendWorker["Enviar mensaje al Web Worker Off-Thread"]
    
    SendWorker --> WorkerCache{"¿Está el índice en memoria en el Worker?"}
    WorkerCache -- "No" --> ReadIDB["Leer registros desde IndexedDB local"]
    ReadIDB --> BuildIndex["Construir índice invertido/fuzzy en Worker"]
    BuildIndex --> ExecuteSearch["Ejecutar búsqueda fuzzy multi-token"]
    WorkerCache -- "Sí" --> ExecuteSearch
    
    ExecuteSearch --> MatchCount{"¿Número de coincidencias?"}
    MatchCount -- "0 resultados" --> BarcodeCheck{"¿Es código de barras numérico?"}
    BarcodeCheck -- "Sí" --> ExactBarcodeLookup["Búsqueda directa por índice exacto 'barcode' en IndexedDB"]
    BarcodeCheck -- "No" --> NoResultsState["Estado: Sin resultados (Sugerir creación de ítem)"]
    
    ExactBarcodeLookup --> ReturnResults["Retornar resultados al hilo principal"]
    MatchCount -- "> 0 resultados" --> ReturnResults
    
    ReturnResults --> VirtualizerFeed["Alimentar Virtualizador Headless"]
    VirtualizerFeed --> RenderWindow["Renderizar exactamente filas visibles en DOM"]
```

---

#### 2.3. Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)

```mermaid
erDiagram
    TENANTS ||--o{ PRODUCTOS_INDEXED_DB : "almacena_en"
    TENANTS ||--o{ CLIENTES_INDEXED_DB : "almacena_en"
    TENANTS ||--o{ B2B_COTIZACIONES : "emite"
    TENANTS ||--o{ POS_PREFACTURAS : "recauda"

    PRODUCTOS_INDEXED_DB {
        string sku PK
        string tenant_id FK
        string nombre
        string codigo_barras
        string categoria
        decimal precio_detal
        decimal precio_mayorista
        int cantidad_min_mayorista
        decimal costo_base
        int stock_disponible
        string ubicacion_pasillo
        boolean activo
        timestamp updated_at
    }

    CLIENTES_INDEXED_DB {
        string id PK
        string tenant_id FK
        string razon_social_o_nombre
        string nit_o_cedula
        string perfil_precio
        decimal limite_credito
        string contacto_telefono
        string contacto_email
        timestamp updated_at
    }

    B2B_COTIZACIONES {
        string id PK
        string tenant_id FK
        string codigo_cotizacion UK
        string cliente_id FK
        string asesor_usuario_id FK
        string estado
        decimal total_general
        date fecha_vencimiento
        string convertida_prefactura_id FK
        timestamp created_at
    }

    B2B_COTIZACION_ITEMS {
        string id PK
        string cotizacion_id FK
        string producto_sku FK
        int cantidad
        decimal precio_unitario_pactado
        string tipo_precio_aplicado
        decimal subtotal_item
    }

    B2B_COTIZACIONES ||--|{ B2B_COTIZACION_ITEMS : "contiene"
    B2B_COTIZACIONES ||--o| POS_PREFACTURAS : "convierte_en"
```

---

#### 2.4. Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)

```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Vendedor Mostrador
    participant POS as ProductSearchPanel (UI)
    participant Virt as VirtualGridEngine
    participant Worker as CatalogSearchWorker (Hilo Secundario)
    participant IDB as IndexedDB (PezcaderiaERP_tenant-03)
    participant Sync as DeltaSyncService
    participant Supabase as Supabase Cloud API

    Note over POS, IDB: Fase de Inicio Rápido (< 150ms)
    POS->>IDB: getTopParetoProducts(limit: 100)
    IDB-->>POS: 100 productos clave inmediatos
    POS->>Virt: Renderizar vista inicial (16 tarjetas visibles)
    
    Note over Worker, IDB: Fase de Hidratación e Indexación en Background
    POS->>Worker: initWorker({ tenantId: "tenant-03" })
    Worker->>IDB: readAllProductsInBatches(chunkSize: 1000)
    IDB-->>Worker: Stream de 16.000 ítems
    Worker->>Worker: Construir índice Fuzzy / Trigramas en RAM del Worker
    Worker-->>POS: Evento "INDEX_READY" (Índice 100% optimizado)
    
    Note over Vendedor, Worker: Búsqueda Interactiva en Tiempo Real
    Vendedor->>POS: Teclea "CANDADO YALE"
    POS->>Worker: postMessage({ type: "SEARCH", query: "CANDADO YALE", limit: 80 })
    Worker->>Worker: Búsqueda Fuzzy Off-Thread (1.2 ms)
    Worker-->>POS: postMessage({ type: "RESULTS", items: [...] })
    POS->>Virt: Actualizar items virtuales
    Virt-->>POS: Actualiza coordenadas de viewport (0 saltos de frames, 120 FPS)
    
    Note over Sync, Supabase: Sincronización Delta Asíncrona
    Sync->>Supabase: GET /productos?updated_at=gt.lastSyncTimestamp
    Supabase-->>Sync: 3 productos modificados
    Sync->>IDB: bulkPut(deltas)
    Sync->>Worker: updateItemsInIndex(deltas)
```

---

#### 2.5. Diagrama 5: Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)

```mermaid
flowchart TD
    subgraph Presentation_Layer["Capa de Presentación React 18 (Dark Glassmorphism V8)"]
        UI1["ProductSearchPanel.tsx (Buscador POS)"]
        UI2["VirtualCatalogGrid.tsx (Grilla Virtualizada)"]
        UI3["ClientSearchModal.tsx (Búsqueda de 30k Clientes)"]
        UI4["B2BQuotationView.tsx (Cotizador con Tarifas Detal/Mayorista)"]
        UI5["SyncStatusPill.tsx (Indicador Sutil en Topbar)"]
    end

    subgraph Hook_Layer["Capa de Hooks Reactivos & Virtualización"]
        H1["useCatalogSearchWorker.ts (Bridge de postMessage y Web Worker)"]
        H2["useVirtualGrid.ts (Cálculo de Viewport y Reciclaje de Nodos)"]
        H3["useDifferentialPricing.ts (Lógica Detal / Mayorista / Umbral)"]
    end

    subgraph Worker_Layer["Capa Off-Thread (Web Worker)"]
        W1["catalogSearch.worker.ts (Hilo de Indexación & Búsqueda Difusa)"]
        W2["fuzzySearchEngine.ts (Algoritmo de similitud Levenshtein/Trigramas)"]
    end

    subgraph Storage_Layer["Capa de Persistencia Local (IndexedDB Multi-Tenant)"]
        DB1["TenantIndexedDbService.ts (PezcaderiaERP_{tenantId})"]
        DB2["Stores: 'productos', 'clientes', 'stock', 'sync_meta'"]
        DB3["OutboxStore (Cola de Transacciones Pendientes Offline)"]
    end

    subgraph Cloud_Layer["Capa Backend & Nube (Supabase PostgreSQL)"]
        C1["Supabase PostgreSQL con RLS"]
        C2["DeltaSyncService.ts (Sincronizador updated_at)"]
    end

    Presentation_Layer --> Hook_Layer
    Hook_Layer <--> Worker_Layer
    Hook_Layer --> Storage_Layer
    Worker_Layer --> Storage_Layer
    Storage_Layer <--> Cloud_Layer
```

---

### 3. Requerimientos Funcionales EARS

- **REQ-040-01 (Aislamiento Físico Multi-Tenant en IndexedDB):**  
  *CUANDO* se inicie sesión o se conmute de empresa, *EL SISTEMA DEBERÁ* conectarse exclusivamente a la base de datos IndexedDB `PezcaderiaERP_{tenantId}`, garantizando segregación física local y cero mezcla de datos entre empresas.

- **REQ-040-02 (Inicio Instantáneo Pareto ABC):**  
  *AL ABRIR* el POS o catálogo, *EL SISTEMA DEBERÁ* renderizar y habilitar la interacción del usuario en menos de **$150\text{ ms}$** utilizando los 100 ítems más comercializados de la bodega activa, sin esperar la carga del catálogo completo.

- **REQ-040-03 (Búsqueda Off-Thread en Web Worker con Tolerancia a Erratas):**  
  *MIENTRAS* el operador escribe en el buscador de productos o clientes, *EL SISTEMA DEBERÁ* delegar la consulta al `catalogSearch.worker`, ejecutando la búsqueda difusa en un hilo secundario y devolviendo resultados en menos de **$2\text{ ms}$** sin degradar los 120 FPS del hilo UI.

- **REQ-040-04 (Virtualización Headless de Grilla):**  
  *EN TODO MOMENTO*, la grilla de productos y la lista de clientes deberán renderizar en el DOM únicamente los elementos visibles en el viewport (12 a 16 tarjetas), reciclando elementos y manteniendo un consumo de memoria constante $\mathcal{O}(1)$.

- **REQ-040-05 (Tarificación Automática Mayorista / Detal):**  
  *CUANDO* la cantidad agregada al carrito o cotización alcance o supere `cantidadMinimaMayorista` (o el cliente posea perfil B2B `MAYORISTA`), *EL SISTEMA DEBERÁ* conmutar el precio al `precioMayorista`, notificando el ahorro obtenido.

- **REQ-040-06 (Conversión Atómica Cotización -> Preventa POS):**  
  *CUANDO* el asesor presione "Convertir a Venta POS" en una cotización aprobada, *EL SISTEMA DEBERÁ* generar una preventa inmutable en `pos_prefacturas`, aplicar la reserva de inventario en bodega (`Hard-Hold`), vincular ambas entidades y trasladar la orden al Kanban de Caja Central (SPEC-037).

- **REQ-040-07 (Sincronización Delta y Operatividad Offline):**  
  *CUANDO* la conexión a internet sea inestable o inexistente, *EL SISTEMA DEBERÁ* permitir la búsqueda completa y la emisión de preventas descontando stock localmente en IndexedDB y encolando las operaciones en el almacén Outbox para su sincronización automática al restablecerse la red.

---

### 4. Quality Gate & Criterios de Aceptación
1. **Rendimiento UI:** 120 FPS sostenidos en scroll continuo y $\le 2\text{ ms}$ de latencia en búsqueda off-thread con 16.000 ítems y 30.000 clientes cargados.
2. **Memoria DOM:** Menos de 50 nodos DOM activos en la grilla virtualizada en todo momento.
3. **TypeScript Estricto:** `npx tsc --noEmit` en 0 errores.
4. **TDD Coverage:** $\ge 80\%$ en servicios de base de datos local, worker de búsqueda y lógica de precios.
5. **Aislamiento Multi-Tenant:** Verificación de 0 fugas cruzadas en pruebas automatizadas y Chrome DevTools.
