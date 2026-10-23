# Especificación Técnica: SPEC-027 — Portal de Clientes B2B Auto-Servicio HORECA

**Estado:** EN ESPECIFICACIÓN (Fase 1: /speckit.specify)  
**Fecha:** 2026-10-23  
**Autores:** Equipo de Arquitectura La Pezcadería ERP & Agency Swarm + Google Harness²  
**Gobernanza:** SDD v3.0 | Protocolo Brownfield v2.2 | WCAG 2.2 AA+ Light Mode & Ergonomía Táctil  

---

## 1. El "Por Qué" (Objetivo de Negocio y Justificación)
Actualmente, los clientes del canal HORECA (Hoteles, Restaurantes, Casinos y Catering) tramitan sus pedidos de pescados y mariscos de forma telefónica o por mensajes de chat informal. Esto genera:
1. **Ineficiencias operativas:** Errores en digitación de calibres, cortes (filete, rodaja, eviscerado, entero) y modalidades de empaque.
2. **Incertidumbre en tiempos de entrega:** Los jefes de cocina desconocen si su pedido ya está en alistamiento, empaque con hielo o en ruta de frío.
3. **Fricción en cartera:** Falta de visibilidad de facturas pendientes, notas crédito por devoluciones y cupo de crédito disponible en tiempo real.

**Solución:** Un Portal B2B Web/Móvil Auto-Servicio optimizado para chefs, jefes de compras y administradores de cocina, con catálogo de precios preferenciales según contrato, pedidos recurrentes programables, trazabilidad en vivo de remisiones y balance financiero de cuenta corriente.

---

## 2. El "Qué" (Alcance Funcional y Reglas de Negocio)
1. **Autenticación y Aislamiento Multi-Tenant / Multi-Cliente:**
   - Selección o autenticación por NIT/Código de Cliente HORECA.
   - Aislamiento estricto de catálogo y precios preferenciales pactados (`tipoPrecio`: RESTAURANTE, MAYORISTA, ESPECIAL).
2. **Catálogo de Pescados & Mariscos B2B con Calibres y Cortes:**
   - Visualización de disponibilidad física y comprometida.
   - Selector táctil de corte: *Entero Eviscerado*, *Filete con Piel*, *Filete sin Piel*, *Rodajas*, *Porciones Catch-Weight*.
   - Selector de empaque: *Caja Térmica con Hielo*, *Bolsa al Vacío*, *Canastilla Plástica Retornable*.
3. **Motor de Pedidos Recurrentes (Plantillas HORECA):**
   - Configuración de compras fijas programadas (ej: "Lunes y Jueves - 30 kg Trucha + 20 kg Salmón").
   - Activación, pausa y edición táctil con 1 clic.
4. **Trazabilidad de Remisiones WMS y Cadena de Frío:**
   - Visualización del estado del pedido en tiempo real: `CREADO` $\rightarrow$ `EN_ALISTAMIENTO` $\rightarrow$ `EN_BASCULA_PACKING` $\rightarrow$ `EN_RUTA_FRIO` $\rightarrow$ `ENTREGADO`.
   - Consulta de temperatura de despacho y firma de remisión digital.
5. **Estado de Cuenta & Cartera B2B:**
   - Cupo de crédito total, saldo consumido y disponible.
   - Descarga de facturas electrónicas y actas de remisión en PDF.

---

## 3. Mandatorio Multi-Phase System Modeling (Mermaid.js)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)
```mermaid
flowchart TD
    A[Inicio: Acceso Chef / Jefe de Compras HORECA] --> B[Identificación / Autenticación Cliente B2B]
    B --> C[Carga de Catálogo B2B con Precios Preferenciales & Cupo Cartera]
    C --> D{¿Tipo de Operación?}
    
    D -->|Pedido Puntual| E[Explorar Productos del Mar & Seleccionar Cortes]
    D -->|Plantilla Recurrente| F[Seleccionar o Activar Pedido Programado]
    D -->|Historial / Cartera| G[Consultar Remisiones, SLAs y Facturas Pendientes]
    
    E --> H[Configurar Líneas: Peso Estimado, Piezas, Calibre y Empaque]
    F --> H
    H --> I[Revisión en Carrito B2B & Simulación de Cupo de Crédito]
    I --> J[Confirmación y Envío de Pedido a Bodega]
    J --> K[Integración Automática con Tablero Kanban Alistamiento WMS]
    K --> L[Seguimiento en Vivo: Picking -> Báscula -> Despacho en Ruta]
    L --> M[Recepción en Restaurante & Firma Digital de Remisión]
    M --> N[Actualización de Cartera & Generación de Factura/Acta]
    N --> O[Fin del Ciclo]
```

### Diagrama 2: Lógica de Decisión con Rombos y Edge Cases (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    A[Intento de Confirmación de Pedido B2B] --> B{¿Cliente Activo en Directorio?}
    B -->|No| C[Bloqueo: Cliente Inactivo o Bloqueado Administrativamente]
    B -->|Sí| D{¿Forma de Pago Solicitada?}
    
    D -->|Crédito B2B| E{¿Monto Pedido <= Cupo Crédito Disponible?}
    D -->|Contado / Transferencia Anticipada| F[Permitir Pedido: Adjuntar Soporte o Link Pago]
    
    E -->|No| G{¿Existe Excepción Gerencial Autorizada?}
    E -->|Sí| H[Validación Crediticia Exitosa]
    
    G -->|No| I[Rechazo: Cupo Excedido - Solicitar Pago de Facturas Vencidas]
    G -->|Sí| H
    
    H --> J{¿Disponibilidad de Inventario en Bodega?}
    F --> J
    
    J -->|Stock Completo| K[Crear Orden Estado: CREADO -> Alistamiento Inmediato]
    J -->|Stock Parcial / Bajo Pedido Muelle| L{¿Cliente Acepta Despacho Parcial?}
    
    L -->|Sí| M[Dividir Pedido: Backorder Muelle + Despacho Inmediato]
    L -->|No| N[Esperar Consolidación de Arribo en Muelle]
    
    K --> O{¿Producto Requiere Fileteo / Despiece?}
    M --> O
    
    O -->|Sí| P[Generar Orden de Producción / Comanda de Fileteo con Mermas]
    O -->|No| Q[Enviar Directo a Báscula Catch-Weight & Packing Hielo]
```

### Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    CLIENTE ||--o{ B2B_CUSTOMER_CATALOG : "tiene precios pactados"
    CLIENTE ||--o{ B2B_RECURRING_ORDER : "programa compras"
    CLIENTE ||--o{ B2B_CUSTOMER_LEDGER_PROFILE : "mantiene estado cartera"
    CLIENTE ||--o{ PEDIDO_B2B : "emite órdenes"
    
    B2B_RECURRING_ORDER ||--|{ B2B_RECURRING_ORDER_ITEM : "contiene productos fijos"
    
    PEDIDO_B2B ||--|{ PEDIDO_B2B_ITEM : "desglosa líneas"
    PEDIDO_B2B ||--o| B2B_DISPATCH_REMISSION : "genera remisión WMS"
    
    B2B_DISPATCH_REMISSION ||--|{ B2B_REMISSION_ITEM : "pesaje báscula real"
    
    PRODUCTO ||--o{ B2B_CUSTOMER_CATALOG : "asignado con descuento"
    PRODUCTO ||--o{ PEDIDO_B2B_ITEM : "solicitado"
    PRODUCTO ||--o{ B2B_RECURRING_ORDER_ITEM : "programado"

    CLIENTE {
        string id PK
        string razonSocial
        string nit
        string tipoPrecio
        number cupoCreditoCop
        number saldoCarteraPendienteCop
        boolean activo
    }

    PRODUCTO {
        string id PK
        string sku
        string nombre
        string especie
        number precioBase
        string modalidadVenta
    }

    B2B_CUSTOMER_CATALOG {
        string id PK
        string clienteId FK
        string productoId FK
        number precioPactadoCop
        number descuentoPorcentaje
        boolean activo
    }

    B2B_RECURRING_ORDER {
        string id PK
        string clienteId FK
        string nombrePlantilla
        string diasSemana
        string jornadaEntrega
        boolean activo
    }

    PEDIDO_B2B {
        string id PK
        string numeroPedido
        string clienteId FK
        string estado
        string formaPago
        number totalEstimadoCop
        number totalFinalRealCop
        string fechaRequeridaEntrega
        string jornadaRequerida
    }

    PEDIDO_B2B_ITEM {
        string id PK
        string pedidoId FK
        string productoId FK
        string tipoCorte
        string tipoEmpaque
        number piezasSolicitadas
        number pesoEstimadoKg
        number pesoRealBasculaKg
        number precioUnitarioCop
        number subtotalCop
    }

    B2B_DISPATCH_REMISSION {
        string id PK
        string numeroRemision
        string pedidoId FK
        string manifiestoId FK
        number temperaturaDespachoCelsius
        string firmaReceptorUrl
        string horaEntregaReal
    }
```

### Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    autonumber
    actor Chef as Chef / Jefe de Compras HORECA
    participant Portal as Portal B2B (React + Tailwind)
    participant Hook as Hook useB2BCustomerPortal
    participant Store as LocalCache / Outbox Sync
    participant WMS as Motor WMS & Kanban Bodega
    participant Ledger as Servicio de Cartera & Crédito

    Chef->>Portal: Accede con credenciales / Token de Cliente
    Portal->>Hook: inicializarPortal(clienteId)
    Hook->>Ledger: verificarCupoCredito(clienteId)
    Ledger-->>Hook: { cupoDisponible: $4.500.000, estado: AL_DIA }
    Hook->>Portal: Renderiza Catálogo Personalizado & Widget Cartera
    
    Chef->>Portal: Selecciona 15 kg Salmón (Filete c/piel, Empaque Hielo)
    Chef->>Portal: Clic en "Confirmar Pedido HORECA"
    Portal->>Hook: enviarPedidoB2B(lineas, fechaEntrega, 'CREDITO_B2B')
    
    Hook->>Ledger: validarReservaCredito($1.200.000)
    Ledger-->>Hook: Aprobado (Cupo Restante: $3.300.000)
    
    Hook->>Store: Guardar Pedido en Outbox & LocalStorage
    Hook->>WMS: Inyectar orden en Tablero Kanban WMS (Estado: CREADO)
    WMS-->>Hook: Pedido Registrado (PED-2026-HORECA-001)
    
    Hook-->>Portal: Notificación Confirmada con SweetAlert2
    Portal-->>Chef: Despliega Timeline de Seguimiento & N° Pedido WMS
```

### Diagrama 5: Arquitectura por Capas (`5_component_architecture_diagrams`)
```mermaid
flowchart TD
    subgraph CapaPresentacion["Capa de Presentación UI (React 18 + Tailwind WCAG AA+)"]
        V1[B2BCustomerPortalView.tsx]
        C1[B2BCatalogGrid.tsx]
        C2[B2BOrderItemConfigurator.tsx]
        C3[B2BRecurringOrderModal.tsx]
        C4[B2BOrderTrackingTimeline.tsx]
        C5[B2BCreditLedgerWidget.tsx]
    end

    subgraph CapaLogica["Capa de Lógica de Negocio & Estado Reactivo"]
        H1[useB2BCustomerPortal.ts]
        H2[useB2BCart.ts]
        S1[b2bPortalService.ts]
        S2[b2bCreditLimitValidator.ts]
        S3[b2bRecurringOrderEngine.ts]
    end

    subgraph CapaValidacion["Capa de Gobernanza de Tipos & Validación"]
        Z1[b2bCustomerPortal.schema.ts - Zod]
        T1[b2bCustomerPortal.types.ts - TypeScript]
    end

    subgraph CapaPersistencia["Capa de Datos, Caché & Sincronización"]
        DB1[(Supabase PostgreSQL - Multi-Tenant RLS)]
        DB2[(IndexedDB / LocalStorage - Offline Outbox)]
        WMS_INT[WMS Dispatcher & Integration Service]
    end

    V1 --> C1 & C2 & C3 & C4 & C5
    C1 & C2 & C3 & C4 & C5 --> H1 & H2
    H1 & H2 --> S1 & S2 & S3
    S1 & S2 & S3 --> Z1 & T1
    S1 & S2 & S3 --> DB1 & DB2 & WMS_INT
```

---

## 4. Criterios de Aceptación Preceptivos
1. **Multi-Tenant y Precios:** Ningún cliente puede ver precios de otros clientes.
2. **Corte y Empaque:** Cada ítem del pedido debe especificar el tipo de corte y empaque.
3. **Control de Crédito:** No se permite tramitar pedidos que superen el cupo de crédito sin autorización previa.
4. **Ergonomía:** Interfaces táctiles ergonómicas ($\ge 48\text{ px}$) operables en tabletas de cocina.
5. **Calidad:** 100% tipado estricto TypeScript, 0 errores `tsc --noEmit` y cobertura unitaria $\ge 80\%$.
