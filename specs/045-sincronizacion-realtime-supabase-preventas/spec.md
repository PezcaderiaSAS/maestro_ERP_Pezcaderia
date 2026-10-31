# Especificación — Sincronización en Tiempo Real Supabase (Realtime Channels)

- **ID:** SPEC-045
- **Título:** Sincronización en Tiempo Real con Supabase Realtime Channels para Preventas, Comandas y Taquilla Central (Caja Única)
- **Estado:** Propuesta Inicial SDD v3.0 — En espera de aprobación humana
- **Alcance:** Reemplazar el sondeo periódico por temporizador (`setInterval` de 4s / 3s) por una suscripción reactiva a canales WebSockets de Supabase (`realtime:preventas:${tenantId}`), con degradación elegante a sondeo heartbeat en caso de desconexión, actualización instantánea (<100ms) en el Tablero Kanban de Caja Única (`CashierKanbanView`) y en la barra lateral de tickets de vendedores (`VendorTicketSidebar`).

---

## 1. Problema y Objetivo

### Problema Actual
En la arquitectura multivendedor y caja única (implementada en SPEC-043 para ferreterías y puntos de venta de alto tráfico), los asesores de mostrador generan comandas y preventas desde múltiples terminales, mientras las cajeras recaudan en la taquilla central.
Actualmente, la sincronización entre terminales depende de un sondeo ciego por intervalos (`setInterval` cada 4000ms en `CashierKanbanView.tsx` y cada 3000ms en `DispatchScannerModal.tsx`), lo que ocasiona:
1. **Latencia perceptual de hasta 4 segundos:** Una comanda emitida por el asesor tarde hasta 4s en verse reflejada en la pantalla de la cajera, ralentizando la cola física de clientes.
2. **Desperdicio de recursos y cuota de red:** Decenas de peticiones HTTP repetitivas e innecesarias cuando no hay preventas nuevas, saturando potencialmente el rate limit de capa gratuita de Supabase/Vercel.
3. **Falta de feedback bidireccional instantáneo:** Cuando la cajera toma una preventa y la pasa a `EN_COBRO` o la liquida en `PAGADA`, el vendedor de mostrador no se entera de inmediato en su `VendorTicketSidebar`, pudiendo intentar modificar o reenviar la comanda.

### Objetivo
Diseñar e implementar un servicio de suscripción reactivo y resiliente basado en **Supabase Realtime Channels (`postgres_changes` + `broadcast`)** con:
1. **Notificación en sub-100ms** de eventos `INSERT`, `UPDATE`, `DELETE` en preventas y comandas.
2. **Aislamiento Multi-Tenant Estricto:** Canales nombrados `realtime:preventas:${tenantId}` y filtrados por `tenant_id=eq.${tenantId}`.
3. **Mecanismo Híbrido Resiliente (WebSocket + Polling Fallback):** Suscripción activa mientras la conexión WebSocket esté en estado `SUBSCRIBED`; si la conexión se degrada o cae a `CHANNEL_ERROR` / `CLOSED` / `OFFLINE`, se activa un sondeo degradado de respaldo (heartbeat cada 10s) hasta que el WebSocket se restablezca.
4. **Cero regresiones:** Compatibilidad transparente con el modo Mock/Test y cobertura 100% en pruebas automatizadas.

---

## 2. Requisitos en Notación EARS

- **REQ-01 (Suscripción al Canal):** CUANDO un usuario ingrese a `CashierKanbanView` o `VendorTicketSidebar`, EL SISTEMA DEBERÁ abrir una suscripción a Supabase Realtime en el canal `realtime:preventas:${tenantId}` con filtro `tenant_id=eq.${tenantId}`.
- **REQ-02 (Recepción Reactiva de Inserción):** CUANDO un vendedor emita una preventa desde el mostrador, EL SISTEMA DEBERÁ propagar el evento `INSERT` en sub-100ms y agregar automáticamente la tarjeta en la columna `PENDIENTE_COBRO` de la Taquilla Central sin requerir recarga manual ni esperar temporizadores.
- **REQ-03 (Transición de Estado Reactiva):** CUANDO una cajera arrastre una tarjeta a `EN_COBRO` o complete el recaudo mixto a `PAGADA`, EL SISTEMA DEBERÁ emitir un evento `UPDATE` y reflejar el cambio en vivo en todos los puestos de venta y monitores conectados en el mismo tenant.
- **REQ-04 (Silenciamiento del Sondeo Ciego):** MIENTRAS el canal de Supabase Realtime reporte estado `SUBSCRIBED`, EL SISTEMA DEBERÁ suspender completamente el sondeo periódico de 4 segundos, eliminando peticiones HTTP redundantes.
- **REQ-05 (Degradación Resiliente Offline/Fallback):** SI la conexión WebSocket pasa a `CLOSED`, `CHANNEL_ERROR` o el navegador entra en modo `offline`, ENTONCES EL SISTEMA DEBERÁ activar un temporizador de contingencia con sondeo exponencial/heartbeat (10s) hasta que el canal WebSocket confirme su reconexión.
- **REQ-06 (Limpieza de Suscripciones):** CUANDO los componentes que consumen preventas se desmonten, EL SISTEMA DEBERÁ desuscribirse y limpiar los canales en Supabase para evitar fugas de memoria o escuchas duplicadas.
- **REQ-07 (Modo Test & Offline Seguro):** EN entorno de pruebas Vitest o cuando `isMockMode=true`, EL SISTEMA DEBERÁ permitir la simulación determinista de eventos realtime mediante un emisor de eventos desacoplado sin requerir un servidor WebSocket real.

---

## 3. Criterios de Aceptación (DoD)

1. **Latencia de Propagación:** < 100ms entre la emisión de la comanda en terminal vendedor y su renderizado en la taquilla central en condiciones de red estándar.
2. **Ahorro de Tráfico:** 0 peticiones HTTP GET periódicas a la base de datos mientras el canal WebSocket esté saludable (`status === 'SUBSCRIBED'`).
3. **Recuperación Automática:** Reconexión transparente sin pérdida de estado tras desconexión transitoria de red.
4. **Aislamiento Multi-Tenant:** Ningún terminal de un `tenant_A` recibe eventos o prefacturas correspondientes a un `tenant_B`.
5. **Quality Gate:** TypeScript estricto con 0 errores (`tsc --noEmit`), Vitest 100% pasando (incluyendo suites E2E y unitarias con simulación realtime), y 0 errores en consola JS.

---

## 4. Mandatorio Multi-Phase System Modeling (5 Diagramas Mermaid.js)

### 4.1. Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)
```mermaid
flowchart TD
    A([Inicio: Usuario entra a POS / Taquilla]) --> B[Obtener tenantId activo del contexto]
    B --> C[Verificar conectividad de red e inicializar Store]
    C --> D[Carga inicial de preventas desde caché local / DB]
    D --> E[Suscribir a Supabase Realtime: realtime:preventas:tenantId]
    E --> F{¿Estado del WebSocket?}
    F -- SUBSCRIBED --> G[Desactivar temporizador de sondeo periódico]
    G --> H[Escuchar eventos INSERT / UPDATE / DELETE en vivo]
    F -- ERROR / CLOSED / TIMEOUT --> I[Activar Fallback: Sondeo Heartbeat cada 10s]
    I --> J[Reintentar suscripción WebSocket en segundo plano]
    J --> F
    H --> K{¿Evento recibido?}
    K -- INSERT --> L[Validar payload y añadir preventa al Store en vivo]
    K -- UPDATE --> M[Actualizar estado/totales de la preventa en memoria]
    K -- DELETE --> N[Remover preventa del Store]
    L --> O[Actualización reactiva de UI en 120 FPS]
    M --> O
    N --> O
    O --> H
    P([Desmontar componente]) --> Q[Ejecutar channel.unsubscribe]
    Q --> R([Fin de sesión del canal])
```

---

### 4.2. Rombos de Decisión y Edge Cases (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    A[Recepción de Evento Realtime o Fallback] --> B{¿El tenant_id coincide con el tenant activo?}
    B -- No --> C[Descartar evento silenciosamente por violación de tenant]
    B -- Sí --> D{¿El evento es un broadcast o postgres_changes?}
    D -- postgres_changes --> E{¿Tipo de operación?}
    D -- broadcast --> F[Procesar mensaje rápido de estado optimista]
    E -- INSERT --> G{¿La preventa ya existe en memoria?}
    G -- Sí --> H[Actualizar datos con los más recientes - Last-Write-Wins]
    G -- No --> I[Insertar preventa y notificar animación visual]
    E -- UPDATE --> J{¿Cambió el estado a PAGADA o ANULADA?}
    J -- Sí --> K[Mover a columna PAGADAS o archivar comanda]
    J -- No --> L[Actualizar ítems, totales o cajero asignado]
    E -- DELETE --> M[Remover preventa del tablero]
    F --> N{¿Conflicto con estado local?}
    N -- Conflicto detectado --> O[Solicitar resincronización delta con la DB]
    N -- Consistente --> P[Aplicar mutación en UI]
```

---

### 4.3. Modelo Entidad-Relación (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    TENANT ||--o{ PREVENTA : posee
    USUARIO ||--o{ PREVENTA : emite_como_vendedor
    USUARIO ||--o{ PREVENTA : recauda_como_cajero
    PREVENTA ||--|{ PREVENTA_DETALLE : contiene
    PREVENTA ||--o{ REALTIME_EVENT_LOG : genera

    TENANT {
        string id PK
        string nombre
        string slug
    }

    USUARIO {
        string id PK
        string tenant_id FK
        string nombre
        string rol
    }

    PREVENTA {
        string id PK
        string tenant_id FK
        string codigo_preventa
        string vendedor_id FK
        string cajero_id FK
        string cliente_documento
        string cliente_nombre
        string estado "PENDIENTE_COBRO | EN_COBRO | PAGADA | ANULADA"
        decimal subtotal
        decimal descuento_total
        decimal total
        boolean hard_hold_activo
        timestamp created_at
        timestamp updated_at
    }

    PREVENTA_DETALLE {
        string id PK
        string preventa_id FK
        string producto_id
        string sku
        string nombre
        decimal cantidad
        decimal precio_unitario
        decimal subtotal
        string notas_despacho
    }

    REALTIME_EVENT_LOG {
        string id PK
        string tenant_id FK
        string channel_name
        string event_type "INSERT | UPDATE | DELETE | BROADCAST"
        json payload
        timestamp emitted_at
    }
```

---

### 4.4. Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Terminal Vendedor (Diego Díaz)
    participant POSView as POS Cart & Vendedor Store
    participant PrefService as PrefacturaService
    participant Supabase as Supabase Realtime Server
    participant KanbanStore as useCashierKanbanStore
    actor Cajera as Terminal Cajera (Luisa Cajera)

    Note over Cajera,KanbanStore: Cajera abre Taquilla Central
    KanbanStore->>Supabase: supabase.channel('realtime:preventas:tenant-03').subscribe()
    Supabase-->>KanbanStore: Status: SUBSCRIBED (silencia polling)
    
    Note over Vendedor,POSView: Vendedor completa comanda y presiona F6 (Emitir)
    Vendedor->>POSView: handleEmitirPreventa()
    POSView->>PrefService: emitirPrefactura(input)
    PrefService->>Supabase: INSERT / Broadcast en preventas (tenant-03)
    
    Note over Supabase,KanbanStore: Propagación WebSockets <100ms
    Supabase-->>KanbanStore: Evento 'postgres_changes' (INSERT, PRE-2026-01002)
    KanbanStore->>KanbanStore: Agregar preventa en colEspera
    KanbanStore-->>Cajera: Nueva tarjeta renderizada en PENDIENTE_COBRO (Beep sonoro)
    
    Note over Cajera,KanbanStore: Cajera inicia cobro y abre QuickPaymentMixedModal
    Cajera->>KanbanStore: moverPreventaAColumna('EN_COBRO')
    KanbanStore->>PrefService: marcarEnCobro()
    PrefService->>Supabase: UPDATE preventas set estado='EN_COBRO'
    Supabase-->>POSView: Evento 'postgres_changes' (UPDATE, estado: 'EN_COBRO')
    POSView-->>Vendedor: VendorTicketSidebar actualiza badge a "EN VENTANILLA"
```

---

### 4.5. Arquitectura por Capas (`5_component_architecture_diagrams`)
```mermaid
flowchart LR
    subgraph Presentation_Layer["Capa de Presentación (React 18 + Tailwind V8)"]
        A[CashierKanbanView\nTaquilla Central]
        B[VendorTicketSidebar\nCola Vendedor]
        C[QuickPaymentMixedModal\nRecaudo Mixto]
        D[NetworkSyncStatusBadge\nIndicador WS]
    end

    subgraph State_Management["Capa de Estado y Lógica Reactiva (Zustand)"]
        E[useCashierKanbanStore]
        F[useVendorTicketStore]
        G[useRealtimePreventasSubscription]
    end

    subgraph Domain_Services["Capa de Dominio y Servicios"]
        H[prefacturaService]
        I[tenantIndexedDbService]
        J[supabaseRealtimeService]
    end

    subgraph Data_Source["Capa de Datos e Infraestructura Remota"]
        K[Supabase Realtime Engine\nWebSockets / postgres_changes]
        L[PostgreSQL Pooler & RLS]
        M[IndexedDB / Local Cache]
    end

    A --> E
    B --> F
    C --> E
    D --> G

    E --> G
    F --> G
    G --> J
    E --> H
    F --> H

    H --> I
    H --> J
    J --> K
    K --> L
    I --> M
```

---

## 5. Próximos Pasos (Flujo Spec Kit)
Con la especificación y los 5 diagramas de ingeniería Mermaid formulados:
1. **Control de Calidad 1:** Esperar la aprobación o ajustes del usuario para pasar a `/speckit.clarify` y `/speckit.checklist`.
2. **Plan Técnico:** Elaborar `/speckit.plan` con la descomposición de componentes y pruebas.
3. **Tareas:** Dividir en tareas atómicas con límite estricto `WIP = 1`.
4. **Implementación TDD:** Desarrollo guiado por pruebas paso a paso sin avanzar sin confirmación.
