# Especificación Funcional & Técnica: SPEC-043
# Flujo Integral Multivendedor - Caja Única Kanban con Cero-Latencia para Ferretería Josase

- **Código:** SPEC-043
- **Fase:** Spec Kit SDD v3.0 — `/speckit.specify`
- **Tenant Primario:** `tenant-03` ("Ferretería Josase")
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO (Checkpoints SDD)
- **Autoría:** Ecosistema Multi-Agente (Agency Swarm + Google Harness² + Master Architect)

---

## 1. Declaración del Problema & Justificación del "Por Qué"

### 1.1 Diagnóstico en Producción
Durante las pruebas operativas en vivo en `https://maestro-erp-pezcaderia.vercel.app/` bajo el tenant `tenant-03` (Ferretería Josase), se identificaron cinco (5) cuellos de botella críticos:
1. **Fallo de Carga de Catálogo y Clientes:** El dataset real de Ferretería Josase (9.550 clientes y 5.351 productos) pesa más de 8.5 MB en JSON. Al intentar cargarlo en `localStorage` a través de `localDb`, los navegadores lanzan la excepción `QuotaExceededError` (límite de 5 MB a 10 MB), dejando los stores vacíos o con datos truncados.
2. **Latencia Severa & Congelamiento del Hilo Principal (Main Thread):** La búsqueda de clientes en modales itera de forma síncrona sobre 9.550 registros y crea miles de nodos DOM directos con `document.createElement('div')` sin límite (`limit`) ni virtualización, degradando la tasa de cuadros por segundo de 120 FPS a 5 FPS y bloqueando la interfaz por más de 3 segundos por pulsación.
3. **Ausencia de Trazabilidad para el Asesor de Mostrador:** Los vendedores de mostrador emiten preventas, pero no disponen de una barra lateral persistente donde monitorear el estado en tiempo real de sus propios tickets emitidos (`EN ESPERA DE COBRO`, `COBRADO`, `CANCELADO`), generando incertidumbre sobre si el cliente ya fue atendido en caja.
4. **Taquilla de Caja Única Inflexible:** La cajera central no dispone de un modal ergonómico de recaudo rápido que permita:
   - Inspeccionar y validar ítems, cantidades y precios de la preventa antes de cobrar.
   - Procesar **pagos mixtos** divididos en tiempo real (ejemplo: $100.000 = $50.000 Efectivo + $30.000 Transferencia Nequi + $20.000 Crédito a 30 días).
   - Calcular automáticamente vueltas / cambio sobre la porción pagada en efectivo.
   - Validar cupo de crédito y generar automáticamente la cuenta por cobrar en `useARStore`.
5. **Carencia de Notas de Despacho en Preventa:** Los vendedores no pueden registrar anotaciones contextuales ("Empacar para finca", "Reclama don Pedro con cédula", "Tornillos galvanizados 1 pulgada"), perdiendo instrucciones operativas clave al llegar el cliente a la taquilla.

---

## 2. Requerimientos Funcionales (EARS Notation)

- **REQ-043-01 (Carga IndexedDB Zero-LocalStorage):** Cuando el tenant activo sea `tenant-03`, el sistema **DEBE** persistir y sincronizar los 9.550 clientes y 5.351 productos en `TenantIndexedDbService` (`PezcaderiaERP_tenant-03`), sin tocar `localStorage` para evitar `QuotaExceededError`. La carga es progresiva en segundo plano con indicador discreto, iniciando por defecto con 'Consumidor Final (Josase)'.
- **REQ-043-02 (Búsqueda Sub-2ms con Paginación Segura):** Cuando el usuario busque un cliente o producto, el motor **DEBE** consultar `searchEngineCore` (off-thread en Web Worker) y retornar como máximo 20 resultados en menos de 2 milisegundos, renderizando un DOM ligero.
- **REQ-043-03 (Segregación de Roles y Conmutación Topbar):** El sistema **DEBE** conmutar la vista por rol y selector rápido: Asesores Mostrador acceden al POS sin permisos de recaudo (solo `EMITIR PREVENTA F6`), mientras que Cajeras y Admins acceden a la Taquilla Central Kanban con recaudo rápido.
- **REQ-043-04 (Barra Lateral de Tickets del Vendedor):** El sistema **DEBE** presentar en el mostrador una barra lateral (`VendorTicketSidebar`) que filtre reactivamente las preventas del día asociadas al `vendedorId` activo, permitiendo 'Recuperar y Editar' o 'Cancelar' tickets en `EN_COLA` y mostrando el cambio reactivo a verde `COBRADO` con número de factura.
- **REQ-043-05 (Anotaciones en Doble Nivel):** La preventa **DEBE** admitir observaciones generales de despacho/entrega a nivel de comanda, más notas específicas opcionales por ítem (medidas de corte, calibres), visibles en el Kanban y en la tirilla.
- **REQ-043-06 (Módulo de Recaudo Mixto en Taquilla Única):** Cuando la cajera seleccione una preventa del Kanban, el sistema **DEBE** abrir el modal de recaudo rápido permitiendo editar cantidades/precios libremente, seleccionar métodos de pago múltiples (Efectivo, Tarjeta, Transferencia, Crédito con plazo incluso a Consumidor Final bajo responsabilidad de caja), con cálculo automático de vueltas para el efectivo.

---

## 3. Mandatory Multi-Phase System Modeling (5 Diagramas Mermaid)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)

```mermaid
flowchart TD
    A([Inicio: Asesor Mostrador en POS]) --> B[Selecciona Cliente mediante Búsqueda Sub-2ms IndexedDB]
    B --> C[Agrega Productos al Carrito con Precios Diferenciales]
    C --> D[Ingresa Anotaciones / Instrucciones de Despacho]
    D --> E[Presiona EMITIR PREVENTA - Tecla F6]
    E --> F[(Guarda Preventa en IndexedDB 'preventas_locales')]
    F --> G[Actualiza Barra Lateral del Vendedor: Estado EN_COLA]
    G --> H[Notifica a Taquilla Central de Caja Única]
    H --> I[Cajera visualiza Tarjeta en Columna 'POR COBRAR' del Kanban]
    I --> J[Cajera abre Modal de Recaudo Rápido e Inspecciona Ítems y Notas]
    J --> K[Define Métodos de Pago: Efectivo / Transferencia / Crédito]
    K --> L[Sistema calcula Vueltas de Efectivo y Valida Cupo de Crédito]
    L --> M[Cajera confirma Recaudo]
    M --> N[(Actualiza Estado a COBRADO en IndexedDB & Supabase)]
    N --> O[Genera Factura / Tirilla & Descuenta Stock]
    O --> P[Barra Lateral del Vendedor cambia a COBRADO con feedback visual]
    P --> Q([Fin del Proceso])
```

---

### Diagrama 2: Lógica de Decisión y Edge Cases (`2_decision_logic_diagrams`)

```mermaid
flowchart TD
    D1{¿Tenant es Ferretería Josase tenant-03?}
    D1 -- Sí --> D2[Usar TenantIndexedDbService PezcaderiaERP_tenant-03]
    D1 -- No --> D3[Usar Store Estándar Local/Supabase]
    
    D2 --> D4{¿Existen clientes e ítems en IndexedDB?}
    D4 -- No --> D5[Carga asíncrona por lotes 'bulkUpsert' desde JSON real]
    D4 -- Sí --> D6[Inicializar searchEngineCore en Worker]
    
    D6 --> D7{¿Rol del Usuario en POS?}
    D7 -- Asesor Mostrador --> D8[Bloquear Recaudo - Modo Solo Preventa F6]
    D7 -- Cajera Central --> D9[Habilitar Kanban de Recaudo y Caja Única]
    
    D9 --> D10{¿Tipo de Pago Seleccionado?}
    D10 -- Efectivo Puro --> D11[Calcular Vueltas = Efectivo Recibido - Total]
    D10 -- Mixto --> D12{¿Suma de Pagos == Total Preventa?}
    D12 -- No --> D13[Alerta: Saldo pendiente por cubrir. Bloquear confirmación]
    D12 -- Sí --> D14[Validar porción crédito y vueltas de efectivo]
    
    D14 --> D15{¿Hay porción a Crédito?}
    D15 -- Sí --> D16{¿Cliente tiene Cupo >= Porción Crédito?}
    D16 -- No --> D17[SweetAlert2: Cupo insuficiente. Solicitar autorización]
    D16 -- Sí --> D18[Generar CXC en useARStore y Liquidar Venta]
    D15 -- No --> D18
```

---

### Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)

```mermaid
erDiagram
    TENANT ||--o{ CLIENTE : "posee"
    TENANT ||--o{ PRODUCTO : "cataloga"
    TENANT ||--o{ PREVENTA : "emite"
    
    CLIENTE ||--o{ PREVENTA : "recibe"
    CLIENTE ||--o{ CUENTA_POR_COBRAR : "adeuda"
    
    PREVENTA ||--|{ PREVENTA_ITEM : "contiene"
    PREVENTA ||--o{ PAGO_DETALLE : "liquida_con"
    PREVENTA ||--o| FACTURA_VENTA : "origina"
    
    PRODUCTO ||--o{ PREVENTA_ITEM : "referencia"
    
    TENANT {
        string id PK "tenant-03"
        string razonSocial "Ferretería Josase"
        string nit "900.123.456-7"
    }

    CLIENTE {
        string id PK
        string tenantId FK
        string identificacion "NIT o Cédula"
        string nombre "Razón Social"
        string telefono
        string direccion
        float cupoCredito
        int plazoDiasCredito
        boolean activo
    }

    PRODUCTO {
        string sku PK
        string tenantId FK
        string codigoBarras
        string nombre
        string categoria
        float precioVentaPos
        float precioMayorista
        float stockActual
        boolean activo
    }

    PREVENTA {
        string id PK "PRE-XXXX"
        string tenantId FK
        string vendedorId FK "user-josase-0X"
        string vendedorNombre
        string clienteId FK
        string clienteNombre
        string estado "EN_COLA | EN_PROCESO | COBRADO | CANCELADO"
        string notas "Instrucciones de despacho y caja"
        float subtotal
        float total
        datetime creadoEn
        datetime cobradoEn
    }

    PREVENTA_ITEM {
        string id PK
        string preventaId FK
        string sku FK
        string nombre
        float cantidad
        float precioUnitario
        float totalLinea
    }

    PAGO_DETALLE {
        string id PK
        string preventaId FK
        string metodoPago "EFECTIVO | TRANSFERENCIA | TARJETA | CREDITO"
        string referenciaTransferencia
        float monto
        float efectivoRecibido
        float vueltas
        int plazoCreditoDias
    }
```

---

### Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)

```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Asesor Mostrador (Diego)
    participant POS as POS Mostrador View
    actor Cliente as Cliente (Ferretería)
    participant IDB as TenantIndexedDbService
    participant EventBus as EventBus / SyncStore
    participant Kanban as Kanban Caja Única
    actor Cajera as Cajera Central (Lady)

    Vendedor->>POS: Busca Cliente por NIT (Worker Sub-2ms)
    POS->>Vendedor: Despliega coincidencias (máx 20)
    Vendedor->>POS: Añade Varillas, Cemento y Pintura
    Vendedor->>POS: Escribe Nota: "Despachar por portón 2 con remisión"
    Vendedor->>POS: Presiona 'EMITIR PREVENTA (F6)'
    POS->>IDB: Guarda Preventa con estado 'EN_COLA'
    POS->>EventBus: Publica evento 'PREVENTA_EMITIDA'
    EventBus->>Kanban: Notifica nueva tarjeta reactiva en tiempo real
    POS->>Vendedor: Actualiza Barra Lateral: Ticket PRE-103 en EN_COLA

    Cliente->>Cajera: Se acerca a taquilla para pagar PRE-103
    Cajera->>Kanban: Hace clic en tarjeta PRE-103
    Kanban->>Cajera: Abre Modal de Recaudo Rápido con ítems y Nota
    Cajera->>Kanban: Selecciona Pago Mixto: $80.000 Transf. + $45.000 Efectivo
    Kanban->>Cajera: Muestra Vueltas: $5.000 (Recibió $50.000 billete)
    Cajera->>Kanban: Presiona 'Confirmar Cobro & Facturar'
    Kanban->>IDB: Actualiza estado a 'COBRADO' y crea transacción Outbox
    Kanban->>EventBus: Publica 'PREVENTA_COBRADA'
    EventBus->>POS: Notifica a Mostrador
    POS->>Vendedor: Barra Lateral marca Ticket PRE-103 en VERDE (COBRADO)
    Kanban->>Cajera: Imprime Tirilla y Libera Taquilla
```

---

### Diagrama 5: Arquitectura por Capas (`5_component_architecture_diagrams`)

```mermaid
graph TD
    subgraph PRESENTACION ["Capa 1: Presentación & UI Ergonomía (Dark Glassmorphism)"]
        UI_POS["POSView.tsx (Modo Mostrador)"]
        UI_SIDEBAR["VendorTicketSidebar.tsx (Barra Lateral Tickets Vendedor)"]
        UI_CART["CartPanel.tsx (Notas de Despacho & Botón F6)"]
        UI_KANBAN["CashierKanbanView.tsx (Módulo Taquilla Central)"]
        UI_MODAL["QuickPaymentMixedModal.tsx (Recaudo Mixto & Vueltas)"]
    end

    subgraph LOGICA ["Capa 2: Lógica de Dominio, Estado & Workers"]
        STORE_POS["useMultiVendorPosStore.ts"]
        STORE_KANBAN["useCashierKanbanStore.ts"]
        STORE_OUTBOX["useOutboxSyncStore.ts"]
        WORKER_SEARCH["catalogSearch.worker.ts (Off-Thread Sub-2ms)"]
        ZOD_VALIDATION["deltaSync.schema.ts & mixedPayment.schema.ts"]
    end

    subgraph ACCESO_DATOS ["Capa 3: Acceso a Datos & Persistencia Resiliente"]
        SVC_IDB["TenantIndexedDbService (PezcaderiaERP_tenant-03)"]
        SVC_FERRETERIA["ferreteriaJosaseService.ts (Bulk Load a IDB)"]
        SVC_SUPABASE["Supabase Client (Delta Sync & RLS PostgreSQL)"]
    end

    UI_POS --> STORE_POS
    UI_SIDEBAR --> STORE_POS
    UI_CART --> STORE_POS
    UI_KANBAN --> STORE_KANBAN
    UI_MODAL --> STORE_KANBAN

    STORE_POS --> WORKER_SEARCH
    STORE_POS --> ZOD_VALIDATION
    STORE_KANBAN --> ZOD_VALIDATION
    STORE_KANBAN --> STORE_OUTBOX

    WORKER_SEARCH --> SVC_IDB
    STORE_OUTBOX --> SVC_IDB
    STORE_OUTBOX --> SVC_SUPABASE
    SVC_FERRETERIA --> SVC_IDB
```

---

## 4. Estrategia de Mitigación de Riesgos y Control de Calidad

1. **Riesgo de Quota Exceeded:** `localStorage` queda 100% excluido del almacenamiento masivo de clientes y productos. Todo se canaliza a `TenantIndexedDbService`.
2. **Riesgo de Bloqueo del Hilo Principal (Jank):** Ningún componente podrá iterar sobre más de 20 elementos para renderizado de búsqueda. Se aplicará debounce estricto de 150 ms y paginación headless.
3. **Riesgo de Descuadre en Pagos Mixtos:** Zod validará en el cliente que `sum(pagos.monto) === totalPreventa`. No se permitirá confirmar si la diferencia es mayor a $0.
4. **Riesgo de Doble Cobro Concurrente:** Una preventa seleccionada por la cajera entra en estado `EN_PROCESO` con OCC (`updatedAt`), bloqueando que otra terminal de caja intente recaudarla simultáneamente.

---

## 5. Próximo Paso Preceptivo
Esperar la confirmación y retroalimentación explícita del usuario sobre esta especificación (`/speckit.specify`) para proceder al paso de preguntas de refinamiento y clarificación (`/speckit.clarify`).
