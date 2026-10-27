# Especificación de Requerimiento: /speckit.specify (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.specify (SDD v3.0)  
**Ticket:** MULTIVENDOR-CASHIER-PROD-20261030  
**Título:** Arquitectura Multivendedor (Caja Única), Despliegue a Producción y Portal SuperAdmin Maestro  
**Emisor:** Director de Agencia / Tech Lead  
**Receptores:** Equipo de Arquitectura Backend, Equipo Frontend POS, Especialista en Seguridad Supabase  
**Prioridad:** Crítica / Despliegue Inmediato (Meta: 30 de Octubre de 2026)  
**Estado:** COMPLETADO_LISTO_PARA_PRODUCCION ✅  
**Fecha:** 2026-10-27  

---

## 1. El "Qué" y el "Por Qué" (Objetivo del Sistema)

### 1.1. Propósito de Negocio y Operativo
Habilitar la operación simultánea de hasta **8 terminales/vendedores concurrentes** que generan preventas y comandas en el Punto de Venta, centralizando el cobro y la gaveta física de efectivo en una **única Caja Centralizadora** atendida por un cajero principal.
Garantizar la trazabilidad estricta de cada venta asociada al empleado vendedor, implementar autorización con PIN de supervisor para excepciones, desplegar el portal maestro `/superadmin` para la gestión global multi-empresa, y dotar al WMS de importación masiva de ítems de ferretería. Todo listo para despliegue en Vercel + Supabase Cloud el 30 de octubre de 2026.

---

## 2. Multi-Phase System Modeling (5 Diagramas Mermaid Obligatorios)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (Process Flowchart)
```mermaid
flowchart TD
    A[Apertura de Turno Central: Cajero Principal en Caja 01] --> B[Habilitación de Terminales TERM-01 a TERM-08]
    B --> C[Vendedor inicia sesión en Terminal POS con su PIN/Rol]
    C --> D[Vendedor escanea productos y genera Preventa / Comanda]
    D --> E{¿Requiere Descuento o Anulación?}
    E -->|Sí| F[Desplegar Modal de PIN de Supervisor en Terminal]
    F -->|PIN Válido| G[Aplicar Excepción con Trazabilidad de Auditoría]
    F -->|PIN Inválido| D
    E -->|No| G
    G --> H[Registrar Preventa en Cola de Espera Central: Estado PENDIENTE_PAGO]
    H --> I[Cliente se acerca a Taquilla de Caja Central con Consecutivo o Ticket]
    I --> J[Cajero Principal llama Preventa en Pantalla de Caja Central]
    J --> K[Recepción de Efectivo / Datáfono y Ejecución de RPC Atómica]
    K --> L[Deducción Definitiva de Stock SELECT FOR UPDATE y Registro de Movimiento de Caja]
    L --> M[Impresión de Factura POS / DIAN y Emisión de Cambio]
    M --> N[Cierre de Turno Central: Arqueo Ciego y Liquidación Consolidada de los 8 Vendedores]
```

---

### Diagrama 2: Lógica de Decisiones y Casos Límite (Decision Logic Diagram)
```mermaid
flowchart TD
    D1[Intento de Registro / Cobro en Caja Central] --> D2{¿Turno de Caja Central Abierto?}
    D2 -->|No| D3[Rechazar Transacción: Error CAJA_CERRADA con Alerta SweetAlert2]
    D2 -->|Sí| D4{¿Stock Disponible tras Bloqueo Pesimista?}
    
    D4 -->|Insuficiente| D5[Rechazar Transacción: Error STOCK_INSUFICIENTE liberando Locks]
    D4 -->|Suficiente| D6{¿IdempotencyKey ya Procesada?}

    D6 -->|Duplicada| D7[Retornar Resultado Cacheado Idempotente sin Duplicar Efectivo ni Stock]
    D6 -->|Nueva| D8{¿Conflicto de Versión OCC en Saldo de Caja?}

    D8 -->|Conflicto Concurrente| D9[Reintentar Transacción Atómica con Backoff Exponencial hasta 3 veces]
    D8 -->|Sin Conflicto| D10[Insertar Movimiento en Ledger Inmutable y Actualizar Saldo Central]

    D10 --> D11{¿Método de Pago Incluye Efectivo?}
    D11 -->|Sí| D12[Sumar a Gaveta Física de Caja y totalVentasEfectivo]
    D11 -->|No| D13[Registrar en totalVentasElectronicas sin alterar Efectivo Gaveta]
```

---

### Diagrama 3: Modelo Entidad-Relación Multi-Vendor (ERD)
```mermaid
erDiagram
    EMPRESAS_TENANTS {
        string id PK
        string nombre
        string nit
        string rubro
        boolean activo
    }

    EMPLEADOS_USUARIOS {
        string id PK
        string tenant_id FK
        string nombre
        string rol
        string pin_hash
        boolean activo
    }

    CAJAS_CENTRALES {
        string id PK
        string tenant_id FK
        string nombre
        string sucursal_id
        decimal saldo_actual
        int version
    }

    TURNOS_CAJA {
        string id PK
        string caja_id FK
        string tenant_id FK
        string cajero_apertura_id FK
        decimal base_inicial
        string estado
        datetime fecha_apertura
        datetime fecha_cierre
    }

    PREVENTAS_COMANDAS {
        string id PK
        string turno_id FK
        string terminal_id
        string vendedor_id FK
        string estado
        decimal total
        datetime created_at
    }

    VENTAS_PAGOS {
        string id PK
        string preventa_id FK
        string turno_id FK
        string metodo_pago
        decimal monto
        string consecutivo_factura
        datetime fecha_pago
    }

    EMPRESAS_TENANTS ||--|{ EMPLEADOS_USUARIOS : employs
    EMPRESAS_TENANTS ||--|{ CAJAS_CENTRALES : owns
    CAJAS_CENTRALES ||--|{ TURNOS_CAJA : operates
    TURNOS_CAJA ||--|{ PREVENTAS_COMANDAS : contains
    EMPLEADOS_USUARIOS ||--|{ PREVENTAS_COMANDAS : sells
    PREVENTAS_COMANDAS ||--|| VENTAS_PAGOS : settles
```

---

### Diagrama 4: Secuencia de Concurrencia Multivendedor (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Vendedor 01 a 08 (Terminales)
    actor Cliente as Cliente Comprador
    participant Terminal as Terminal POS (Preventa)
    participant CentralQueue as Cola Central de Preventas
    actor Cajero as Cajero Principal (Caja Central)
    participant RPC as RPC Supabase (registrar_venta_concurrente)
    participant DB as PostgreSQL (OCC & SELECT FOR UPDATE)

    Vendedor->>Terminal: Digita SKU / Pesa producto y presiona "Emitir Comanda"
    Terminal->>CentralQueue: Publica Preventa en Estado PENDIENTE_PAGO
    CentralQueue-->>Terminal: Devuelve Ticket / Consecutivo PRE-0042
    Vendedor->>Cliente: Entrega Ticket de Preventa para pago en Caja
    Cliente->>Cajero: Presenta Ticket PRE-0042 en Taquilla
    Cajero->>CentralQueue: Escanea o selecciona PRE-0042
    CentralQueue-->>Cajero: Carga resumen de la venta y total $55.000
    Cajero->>RPC: Ejecuta Cobro Efectivo $55.000 (IdempotencyKey + TurnoCentral)
    RPC->>DB: Bloqueo pesimista stock, verificación OCC caja y registro movimiento
    DB-->>RPC: Transacción exitosa (FAC-000105)
    RPC-->>Cajero: Retorna OK y saldo de caja actualizado
    Cajero->>Cliente: Entrega Factura y Mercancía
```

---

### Diagrama 5: Arquitectura de Componentes por Capas (Component Architecture)
```mermaid
graph TD
    subgraph Client_Terminals [Capa de Clientes: 8 Terminales POS + 1 Caja Central]
        Term1[Terminal 01: Vendedor Mostrador]
        Term2[Terminal 02: Vendedor Muelle]
        Term3[Terminal 03..08: Vendedores Preventa]
        CashierDesk[Taquilla Caja Central: Cajero Principal con Gaveta]
        SuperAdminPortal[Portal SuperAdmin: /superadmin Multi-Tenant Master]
    end

    subgraph Service_Logic [Capa de Lógica de Negocio y Control Concurrente]
        MultiVendorService[MultiVendorCashService: Idempotencia y Orquestación]
        SupervisorPinAuth[SupervisorPinModal: Autorización Descuentos/Anulación]
        BulkHardwareImporter[BulkHardwareItemService: Carga Masiva Ferretería/FerreOn]
        OutboxQueue[Offline Outbox Sync: Resiliencia de Conexión]
    end

    subgraph Persistence_Supabase [Capa de Persistencia y Motor Transaccional]
        PostgresRPC[RPC registrar_venta_pos_concurrente: Locks + Ledger]
        OCCEngine[OCC Version Lock: caja_centralizadora.version]
        RLSPolicies[Políticas RLS Multi-Tenant: tenant_id isolation]
        AuditLedger[Ledger Inmutable de Movimientos de Caja]
    end

    Term1 --> MultiVendorService
    Term2 --> MultiVendorService
    Term3 --> MultiVendorService
    CashierDesk --> MultiVendorService
    SuperAdminPortal --> RLSPolicies

    MultiVendorService --> SupervisorPinAuth
    MultiVendorService --> OutboxQueue
    MultiVendorService --> PostgresRPC

    PostgresRPC --> OCCEngine
    PostgresRPC --> AuditLedger
    PostgresRPC --> RLSPolicies
```

---

## 3. Criterios de Aceptación Innegociables
1. **Concurrencia Validada:** 8 terminales simultáneas enviando preventas y cobros sin condiciones de carrera, doble contabilización ni deadlocks en PostgreSQL.
2. **Control de Caja Única:** Todo ingreso en efectivo impacta una sola caja física centralizadora por sucursal (`cajas_centrales`).
3. **Trazabilidad de Empleado:** Cada preventa y venta almacena `vendedor_id`, validando su rol y exigiendo PIN de supervisor para descuentos.
4. **Portal SuperAdmin:** Vista `/superadmin` con acceso maestro seguro para gestionar organizaciones y usuarios.
5. **Carga Masiva Ferretería:** Formato CSV/Excel compatible con el modelo `BulkItemHardwareRow`.
6. **Despliegue a Producción:** Vercel + Supabase Cloud verificado antes del 30 de octubre de 2026.
