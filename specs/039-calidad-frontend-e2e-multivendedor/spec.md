# Especificación Técnica — SPEC-039
**Calidad Frontend Enterprise, Accesibilidad WCAG 2.2 AA+ y Suite E2E Multivendedor - Caja Única**

---

## 1. Contexto & Objetivos del Negocio
- **Objetivo Primario:** Implementar y ejecutar una suite de pruebas End-to-End (E2E) con Playwright para blindar el flujo crítico operativo **Multivendedor - Caja Única (SPEC-037)**: desde la creación de una preventa en mostrador por parte del asesor comercial, su aparición reactiva en el tablero Kanban de Caja Central, hasta la toma de la orden, liquidación con recaudo F9, generación de tirilla y emisión de código QR de despacho.
- **Objetivo Secundario (Accesibilidad & Ergonomía Visual):**
  1. Corregir los problemas de contraste detectados en el Semáforo Operativo Ejecutivo (Tarjeta 3: "Stock en Cuarto Frío"), elevando la relación de contraste a $\ge 7:1$ (WCAG AAA) mediante superficies dark glassmorphism balanceadas y tipografía legible.
  2. Acotar el truncamiento de breadcrumbs en la barra superior (`EnterpriseTopbar.tsx`) evitando que los títulos largos empujen los controles de acción.
  3. Descongestionar el área derecha de la barra superior (padding/gap ergonómico) para prevenir toques accidentales en pantallas táctiles y laptops.
  4. Optimizar el layout base del Sidebar para evitar cualquier sensación de superposición sobre los controles de la ventana principal y garantizar aislamiento de scroll en el catálogo y liquidación del POS.

---

## 2. Requisitos del Sistema (Notación EARS)

### 2.1 Requisitos Ubicuos (Ubiquitous Requirements)
- **EARS-UBI-01:** El sistema DEBE mantener en todo momento el estándar estético **Dark Glassmorphism V8** con escala OKLCH, microbordes translúcidos `border-white/10` y retícula estricta de 8px.
- **EARS-UBI-02:** Todo texto informativo y numérico en tarjetas de estado DEBE cumplir con la norma de contraste WCAG 2.2 AA (mínimo 4.5:1 para texto normal, 3:1 para texto grande/bold).

### 2.2 Requisitos Guiados por Eventos (Event-Driven Requirements)
- **EARS-EVT-01:** CUANDO un Asesor Comercial presione el botón "Crear Preventa" en el POS, el sistema DEBE registrar la prefactura con estado `PENDIENTE_COBRO`, asignar un código único `PV-XXXX`, vincular el ID del vendedor y no solicitar cobro monetario en mostrador.
- **EARS-EVT-02:** CUANDO una preventa sea registrada, el tablero `CashierKanbanView` en la estación de Caja Única DEBE reflejar la tarjeta en la columna "En Espera de Cobro" dentro de un intervalo reactivo $\le 4$ segundos.
- **EARS-EVT-03:** CUANDO el cajero presione "Cobrar (F9)" o arrastre la tarjeta a "En Cobro", el modal de liquidación DEBE desplegarse con el saldo precalculado, permitiendo seleccionar el medio de pago e ingresar el efectivo recibido.
- **EARS-EVT-04:** CUANDO se confirme el recaudo exitoso, el sistema DEBE transicionar la prefactura a estado `PAGADA`, generar la tirilla de control interno y habilitar el token QR para verificación de salida en bodega.

### 2.3 Requisitos de Estado (State-Driven Requirements)
- **EARS-STA-01:** MIENTRAS el turno de caja se encuentre en estado `CERRADO`, el botón de liquidación DEBE alertar visiblemente y restringir la finalización del recaudo hasta que el cajero abra el turno correspondiente.
- **EARS-STA-02:** MIENTRAS la pantalla se visualice en laptops (`1366×768`), el breadcrumb de `EnterpriseTopbar` DEBE acotarse con `truncate max-w-[220px]` con atributo `title` accesible, garantizando que los botones de acción rápida permanezcan siempre alineados e interactivos.

### 2.4 Requisitos de Comportamiento No Deseado (Unwanted Behavior Requirements)
- **EARS-UNW-01:** SI el cajero ingresa un importe en efectivo inferior al total de la preventa, el sistema DEBE deshabilitar el botón de confirmación e indicar claramente el valor faltante sin procesar la venta.
- **EARS-UNW-02:** SI el usuario interactúa con la barra superior en pantallas táctiles, el sistema NO DEBE disparar clics accidentales entre el indicador de red "ONLINE" y el botón primario "Facturar POS", manteniendo una separación física mínima de 12px.

---

## 3. Mandatory Multi-Phase System Modeling (Mermaid.js)

### 3.1 Flujo de Procesos y Ciclo de Vida (`1_process_flowcharts`)
```mermaid
graph TD
    A([Inicio: Asesor en Mostrador POS]) --> B[Seleccionar Productos del Mar]
    B --> C[Ajustar Cantidades / Pesos en Báscula]
    C --> D[Hacer clic en 'Crear Preventa']
    D --> E[Generar Prefactura PV-XXXX con vendedor_id]
    E --> F[Cliente se traslada a Caja Central]
    F --> G[Cajero visualiza Kanban Caja Única]
    G --> H{¿Preventa visible en 'En Espera'?}
    H -- No --> I[Sondeo reactivo automático 4s]
    I --> G
    H -- Sí --> J[Arrastrar a 'En Cobro' o presionar F9]
    J --> K[Despliegue de Modal de Recaudo]
    K --> L[Seleccionar Medio de Pago: Efectivo / Datáfono]
    L --> M[Ingresar Efectivo Recibido]
    M --> N{¿Efectivo >= Total?}
    N -- No --> O[Alerta de Saldo Faltante]
    O --> M
    N -- Sí --> P[Calcular Cambio y Confirmar Cobro]
    P --> Q[Actualizar Estado a 'PAGADA']
    Q --> R[Imprimir Tirilla y Generar Token QR]
    R --> S([Fin: Cliente retira mercancía con QR verificado])
```

---

### 3.2 Diagrama de Lógica de Decisión (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    D1{Estado del Turno de Caja}
    D1 -- Cerrado --> D2[Bloquear Recaudo y Mostrar Alerta 'Caja Cerrada']
    D1 -- Abierto --> D3{Selección de Preventa en Kanban}
    
    D3 -- Sin Asignar --> D4[Esperar asignación o arrastre por cajero]
    D3 -- Asignada a Cajero --> D5{Validación de Medio de Pago}
    
    D5 -- Efectivo --> D6{Validar Efectivo Recibido}
    D6 -- Menor que Total --> D7[Deshabilitar Botón Confirmar: 'Faltan $X']
    D6 -- Mayor o Igual --> D8[Calcular Cambio exacto y Habilitar Recaudo]
    
    D5 -- Tarjeta / Datáfono --> D9[Validar Referencia Voucher Transaccional]
    D9 -- Voucher Válido --> D10[Habilitar Recaudo Inmediato]
    
    D8 --> D11[Ejecutar Transacción Atómica RPC Supabase]
    D10 --> D11
    
    D11 --> D12{¿Respuesta Exitosa?}
    D12 -- Error Red/DB --> D13[Encolar en Outbox Local IndexedDB]
    D12 -- Éxito --> D14[Mover a Columna 'Pagadas' + Emitir Tirilla Fiscal]
```

---

### 3.3 Diagrama de Entidad-Relación (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    TENANT ||--o{ PREFACTURA : "posee"
    USER ||--o{ PREFACTURA : "emite como vendedor"
    USER ||--o{ PREFACTURA : "cobra como cajero"
    PREFACTURA ||--|{ PREFACTURA_ITEM : "contiene"
    PREFACTURA ||--o| TURNO_CAJA : "imputa a"
    PRODUCTO ||--o{ PREFACTURA_ITEM : "referencia"

    PREFACTURA {
        uuid id PK
        string codigo_preventa UK
        uuid tenant_id FK
        uuid vendedor_id FK
        string vendedor_nombre
        uuid cajero_id FK
        string cliente_nombre
        string cliente_nit
        decimal subtotal
        decimal total
        string estado "PENDIENTE_COBRO | EN_COBRO | PAGADA | ANULADA"
        string metodo_pago
        decimal monto_recibido
        decimal cambio
        string qr_token
        timestamp created_at
        timestamp pagado_at
    }

    PREFACTURA_ITEM {
        uuid id PK
        uuid prefactura_id FK
        uuid producto_id FK
        string nombre_producto
        string sku
        decimal cantidad
        decimal peso_kg
        decimal precio_unitario
        decimal subtotal
    }

    TURNO_CAJA {
        uuid id PK
        uuid tenant_id FK
        uuid cajero_id FK
        string estado "ABIERTO | CERRADO"
        decimal base_inicial
        decimal total_efectivo
        timestamp fecha_apertura
    }
```

---

### 3.4 Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Asesor Comercial (Mostrador)
    participant POS as POSView (UI)
    participant PrefStore as useMultiVendorPosStore
    participant DB as Supabase / Mock Service
    actor Cajero as Cajero Principal (Caja Central)
    participant Kanban as CashierKanbanView (UI)
    participant Modal as ModalRecaudo
    actor Cliente as Consumidor Final

    Vendedor->>POS: Agrega productos y presiona "Crear Preventa"
    POS->>PrefStore: crearPreventa(tenantId, items, vendedor)
    PrefStore->>DB: INSERT into pos_prefacturas (PENDIENTE_COBRO)
    DB-->>PrefStore: Prefactura PV-101 creada
    PrefStore-->>POS: Ticket Preventa generado
    POS-->>Cliente: Entrega número de ticket PV-101

    Note over Cliente,Cajero: Cliente se desplaza a la Caja Central
    
    Kanban->>DB: Sondeo reactivo de prefacturas
    DB-->>Kanban: [PV-101 (PENDIENTE_COBRO)]
    Kanban-->>Cajero: Renderiza tarjeta PV-101 en 'En Espera'
    
    Cajero->>Kanban: Hace clic en 'Cobrar (F9)'
    Kanban->>Modal: abrirModalCobro(PV-101)
    Modal-->>Cajero: Presenta total ($150.000) e inputs de pago
    Cajero->>Modal: Ingresa Efectivo: $200.000 (Cambio: $50.000)
    Cajero->>Modal: Presiona "Confirmar Recaudo"
    
    Modal->>DB: procesarCobro(PV-101, 'PAGADA', 'EFECTIVO', cajeroId)
    DB-->>Modal: Transacción OK + QR Generado
    Modal-->>Kanban: Mueve tarjeta a 'PAGADA'
    Modal-->>Cajero: Dispara impresión de tirilla térmica con QR
    Cajero-->>Cliente: Entrega tirilla con QR y cambio
```

---

### 3.5 Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)
```mermaid
graph TB
    subgraph Presentacion ["Capa de Presentación (React 18 + Dark Glassmorphism V8)"]
        Sidebar[EnterpriseSidebar: Rail 64px / Expanded 256px]
        Topbar[EnterpriseTopbar: Breadcrumbs Acotados + Quick Actions]
        POS[POSView: Catálogo Productos + Dock Preventa]
        Kanban[CashierKanbanView: Tablero 3 Columnas + Filtro Asesores]
        ModalCobro[ModalRecaudo: Cálculo Cambio + Múltiples Medios]
        WidgetSemaforo[ExecutiveTrafficLightWidget: Alto Contraste WCAG AAA]
    end

    subgraph Estado ["Capa de Estado y Lógica Reactiva (Zustand)"]
        AuthStore[useAuthStore: Roles RBAC + Multi-Tenant ID]
        MultiVendorStore[useMultiVendorPosStore: Gestión de Preventas Mostrador]
        CashierStore[useCashierKanbanStore: Flujo Drag & Drop Caja Central]
        OrderStore[useOrderStore: Pedidos B2B & Despachos]
    end

    subgraph Servicios ["Capa de Servicios y Acceso a Datos (TypeScript)"]
        PrefService[prefacturaService: CRUD, RLS & Transición Estados]
        CashService[cashService: Turnos, Arqueos & Movimientos]
        ZodValidator[Zod Schemas: prefactura.schema.ts]
    end

    subgraph Persistencia ["Capa de Persistencia (Offline Outbox & Cloud)"]
        IndexedDB[(IndexedDB L2: Local Cache)]
        Supabase[(Supabase PostgreSQL: Multi-Tenant RLS)]
    end

    Sidebar --> Topbar
    POS --> MultiVendorStore
    Kanban --> CashierStore
    WidgetSemaforo --> CashService
    ModalCobro --> CashierStore

    MultiVendorStore --> PrefService
    CashierStore --> PrefService
    PrefService --> ZodValidator
    PrefService --> IndexedDB
    PrefService --> Supabase
```

---

## 4. Criterios de Aceptación (Garantía de Calidad)
1. **Suite Playwright E2E Verde:** Se creará el archivo `tests/e2e/multivendor-cashier-flow.spec.ts` que simulará exitosamente el ciclo completo de preventa mostrador $\rightarrow$ cobro caja única $\rightarrow$ tirilla con QR en modo headless y headed.
2. **Contraste WCAG 2.2 AA+ Verificado:** La tarjeta 3 del Semáforo Operativo no presentará fondos burdeos saturados con texto fucsia; utilizará `bg-slate-900/80` y `text-white font-mono` con badge `text-rose-300`, superando el ratio de contraste 7:1.
3. **Topbar Acotado:** El breadcrumb usará `truncate max-w-[220px]` y el gap entre elementos de la derecha será de mínimo `gap-3` para evitar toques accidentales.
4. **Layout Estable en Laptops:** El sidebar mantendrá su contenedor adyacente sin solapar controles y las columnas del POS tendrán scrollbars independientes sin romper el layout exterior.
