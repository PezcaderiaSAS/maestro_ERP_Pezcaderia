# Especificación de Requerimientos: SPEC-037
## Flujo de Preventa Multivendedor sin Recaudo, Kanban en Caja Única, Despacho Verificado y Sidebar Compacto con Leyes de UX

**Código:** SPEC-037  
**Versión:** 1.0.0  
**Fecha:** 2026-10-27  
**Fecha Límite de Entrega:** 2026-10-30  
**Fase:** Spec Kit SDD v3.0 — `/speckit.specify`  
**Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico. Zero Cross-Tenant Leakage.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 1)  

---

## 1. Resumen Ejecutivo & Contexto de Negocio (PRD)

En una empresa comercial de alta rotación (ferretería, marisquería, retail de mostrador técnico), la dispersión del manejo de dinero en múltiples vendedores genera descuadres de caja, lentitud en la atención y riesgos de fuga de inventario.

Este módulo implementa el desacoplamiento operativo en 3 fases:
1. **Piso de Venta / Asesor Comercial (Preventa sin Recaudo):**
   - Los asesores seleccionan productos, modifican cantidades y aplican descuentos comerciales controlados (hasta un umbral máximo porcentual configurable en el tenant, por defecto **10%**).
   - Descuentos superiores o alteraciones de precio mayores exigen autorización con PIN de Supervisor (`SupervisorPinModal`).
   - El asesor **NO** cobra ni recibe dinero, ni genera movimientos de caja. Genera una **Preventa / Prefactura** con reserva inmediata de stock (**Hard-Hold**) y entrega al cliente un ticket térmico con código QR único.
2. **Caja Central Única (Recaudo & Facturación en Kanban):**
   - El cajero dispone de un tablero Kanban reactivo (<80ms) con 3 columnas operativas:
     - `1. En Espera de Cobro`: Preventas emitidas pendientes de pago, con filtros táctiles por asesor.
     - `2. En Cobro Activo`: Preventa cargada en la terminal del cajero para cobro (efectivo, datáfono, transferencia, crédito).
     - `3. Pagado / Listo para Despacho`: Cobro completado, factura electrónica/POS emitida y stock confirmado.
3. **Despacho y Entrega por el Asesor:**
   - El cliente regresa con su asesor comercial.
   - El asesor verifica el pago de forma híbrida: a través de su bandeja sincronizada en tiempo real de preventas pagadas o escaneando con pistola/cámara el código QR del ticket de factura.
   - Al validar el pago, el asesor ejecuta la entrega física y el sistema registra el estado `ENTREGADO / DESPACHADO`.
4. **Menú Lateral (EnterpriseSidebar) Ultra-Compacto con Leyes de UX:**
   - Rediseño ergonómico a **64px** de ancho en modo rail dock.
   - **Ley de Miller:** Agrupación en 4 núcleos cognitivos principales ($\le 7$ ítems directos por rol).
   - **Ley de Hick:** Eliminación de saturación visual, insignias redundantes y textos largos innecesarios.
   - **Ley de Fitts:** Hit-boxes táctiles de 48px con espaciado generoso.
   - **Progressive Disclosure:** Tooltips translúcidos y flyouts flotantes contextuales.

---

## 2. Decisiones de Arquitectura y Acuerdos de `/grill-me`

| Frontera de Decisión | Resolución Acordada en `/grill-me` | Justificación Técnica |
| :--- | :--- | :--- |
| **Límite de Descuento Vendedor** | Configurable por tenant en `TenantConfig` (default: **10%**). Superar el límite exige PIN de Supervisor. | Protege el margen bruto sin quitar flexibilidad comercial rápida en mostrador. |
| **Reserva de Stock (Hard-Hold)** | Hard-Hold sin expiración automática hasta cobro o cancelación manual por supervisor. | Evita ventas duplicadas en inventarios de mostrador y piezas únicas. |
| **Verificación de Despacho** | Modalidad Híbrida: Bandeja reactiva en pantalla del asesor + Escáner de QR del ticket. | Máxima agilidad: el asesor puede entregar al ver la alerta o escanear en horas pico. |
| **Columnas Kanban Caja** | 3 Columnas: `En Espera`, `En Cobro Activo`, `Pagado / Listo Despacho` con filtro por asesor. | Minimiza sobrecarga cognitiva del cajero según la Ley de Hick. |
| **Aislamiento Multi-Tenant** | Clave foránea `tenant_id` en todas las tablas, índices B-Tree y RLS `current_user_tenant_ids()`. | Zero-leakage: los datos de una empresa jamás son visibles para otra. |
| **Sidebar UX** | Rail de 64px, 4 grupos Miller, badges prioritarios, tooltips translúcidos Dark Glassmorphism. | Libera el 100% del área de trabajo para la cuadrícula POS y el Kanban. |

---

## 3. Modelado de Sistema Multifase (MANDATORY MERMAID.JS)

### 3.1. Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)

```mermaid
flowchart TD
    A([Inicio: Cliente solicita compra en Mostrador]) --> B[Asesor comercial selecciona items y cantidades]
    B --> C{¿Aplica descuento o rebaja de precio?}
    C -- No --> E[Generar Orden de Preventa]
    C -- Sí --> D{¿Descuento <= 10% permitido?}
    D -- Sí --> E
    D -- No --> D1[Solicitar PIN de Supervisor]
    D1 --> D2{¿PIN Válido?}
    D2 -- No --> D3[Rechazar descuento / Mantener precio base] --> E
    D2 -- Sí --> E
    E --> F[Hard-Hold de Stock en Inventario]
    F --> G[Emisión de Ticket Preventa con QR y Asignación de ID]
    G --> H([Cliente se desplaza a Caja Única con su Ticket])
    H --> I[Cajero visualiza Preventa en Columna 'En Espera']
    I --> J[Cajero toma ticket o escanea QR -> Pasa a 'En Cobro']
    J --> K[Procesamiento de Pago: Efectivo, Tarjeta, Transferencia]
    K --> L[Generación de Factura Oficial y Movimiento de Caja]
    L --> M[Kanban actualiza estado a 'Pagado / Para Despacho']
    M --> N([Cliente regresa al mostrador con su asesor])
    N --> O{¿Asesor verifica pago?}
    O -- Escaneo QR Factura o Alerta Pantalla --> P[Asesor entrega mercancia fisicamente]
    P --> Q[Marcado definitivo: DESPACHADO / ENTREGADO]
    Q --> R([Fin de Transaccion Exitosa])
```

---

### 3.2. Diagrama 2: Lógica de Decisión y Edge Cases (`2_decision_logic_diagrams`)

```mermaid
flowchart TD
    subgraph Decisiones_Piso_Venta [Reglas del Asesor Comercial]
        A1[Intento de Descuento por Item] --> B1{Descuento <= max_descuento_pct?}
        B1 -- Verdadero --> C1[Aplicar descuento en linea de venta]
        B1 -- Falso --> D1{Supervisor presente?}
        D1 -- Autoriza PIN --> C1
        D1 -- Rechaza --> E1[Revertir al precio lista]
        
        A2[Intento de Recaudo por Asesor] --> B2{Rol del Usuario?}
        B2 -- Vendedor --> C2[ACCESO DENEGADO: Solo consulta y preventa]
        B2 -- Cajero/Admin --> D2[Permitir cobro]
    end

    subgraph Decisiones_Caja_Central [Reglas de Caja y Kanban]
        A3[Cliente llega a Caja] --> B3{Preventa existe y activa?}
        B3 -- No encontrada --> C3[Error: Ticket invalido o cancelado]
        B3 -- Encontrada --> D3{Estado Preventa?}
        D3 -- PENDIENTE_COBRO --> E3[Pasar a EN_COBRO_ACTIVO]
        D3 -- YA_PAGADA --> F3[Informar: Preventa ya pagada. Dirigir a despacho]
        D3 -- ANULADA --> G3[Informar: Preventa anulada por supervisor]
        
        E3 --> H3{Monto Recaudado == Total Factura?}
        H3 -- Pago Completo --> I3[Emitir Factura y Actualizar a PAGADA]
        H3 -- Pago Parcial / Cancelacion --> J3{¿Cancela cliente?}
        J3 -- Sí --> K3[Supervisor autoriza liberacion de Hard-Hold stock]
        J3 -- No --> E3
    end

    subgraph Decisiones_Despacho [Reglas de Entrega]
        A4[Cliente solicita mercancia a Asesor] --> B4{Verificacion de Factura}
        B4 -- Estado == PAGADA --> C4[Entregar articulos y registrar despacho]
        B4 -- Estado != PAGADA --> D4[BLOQUEO: Exigir comprobante de pago en caja]
    end
```

---

### 3.3. Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)

```mermaid
erDiagram
    TENANTS ||--o{ POS_PREFACTURAS : "pertenece_a"
    TENANTS ||--o{ MOVIMIENTOS_CAJA : "registra_en"
    TENANTS ||--o{ FACTURAS : "emite"
    
    USUARIOS ||--o{ POS_PREFACTURAS : "creada_por_vendedor"
    USUARIOS ||--o{ POS_PREFACTURAS : "autorizada_supervisor"
    USUARIOS ||--o{ FACTURAS : "cobrada_por_cajero"
    
    POS_PREFACTURAS ||--|{ ITEMS_PREFACTURA : "contiene"
    POS_PREFACTURAS ||--o| FACTURAS : "origina"
    
    TENANTS {
        uuid id PK
        string razon_social
        string nit UK
        float max_descuento_vendedor_pct
        boolean activo
    }
    
    POS_PREFACTURAS {
        uuid id PK
        uuid tenant_id FK
        string codigo_preventa UK
        uuid vendedor_id FK
        string terminal_id
        string cliente_documento
        string cliente_nombre
        float subtotal
        float descuento_total
        float total
        string estado "PENDIENTE_COBRO | EN_COBRO | PAGADA | DESPACHADA | ANULADA"
        boolean hard_hold_activo
        uuid supervisor_autoriza_id FK
        timestamp created_at
        timestamp pagado_at
        timestamp despachado_at
    }
    
    ITEMS_PREFACTURA {
        uuid id PK
        uuid prefactura_id FK
        uuid producto_id
        string nombre_producto
        float cantidad
        float precio_lista
        float descuento_pct
        float precio_final
        float subtotal
    }
    
    FACTURAS {
        uuid id PK
        uuid tenant_id FK
        uuid prefactura_id FK
        string numero_factura UK
        uuid cajero_id FK
        string turno_caja_id
        float total_pagado
        string metodo_pago "EFECTIVO | DATAFONO | TRANSFERENCIA | MIXTO"
        timestamp fecha_pago
    }
```

---

### 3.4. Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    actor Vendedor as Asesor Comercial
    participant AppVendedor as Terminal Vendedor (POS)
    participant StorePrefactura as useMultiVendorPosStore
    participant BD as Supabase (PostgreSQL + RLS)
    participant CajeroKanban as Terminal Caja (Kanban)
    actor Cajero as Cajero Central

    Cliente->>Vendedor: Solicita productos y cantidades
    Vendedor->>AppVendedor: Agrega items y aplica descuento (<=10%)
    Vendedor->>AppVendedor: Confirma Preventa
    AppVendedor->>StorePrefactura: emitirPrefactura(payload)
    StorePrefactura->>BD: INSERT INTO pos_prefacturas (Hard-Hold stock)
    BD-->>StorePrefactura: OK (codigo_preventa: 'PRE-2026-0042')
    AppVendedor-->>Cliente: Imprime Ticket Preventa con QR
    
    par Notificación en Tiempo Real
        BD-->>CajeroKanban: Evento Realtime (INSERT / UPDATE)
        CajeroKanban->>CajeroKanban: Renderiza tarjeta en 'En Espera'
    end
    
    Cliente->>Cajero: Entrega Ticket de Preventa
    Cajero->>CajeroKanban: Escanea QR / Toma tarjeta -> 'En Cobro'
    Cajero->>CajeroKanban: Recauda dinero y confirma pago
    CajeroKanban->>BD: Registrar Factura + Update prefactura 'PAGADA'
    BD-->>CajeroKanban: Factura Oficial Generada
    CajeroKanban-->>Cliente: Entrega Factura y Comprobante
    
    par Sincronización hacia Asesor
        BD-->>AppVendedor: Alerta 'PRE-2026-0042 PAGADA'
    end
    
    Cliente->>Vendedor: Regresa a mostrador y presenta Factura
    Vendedor->>AppVendedor: Escanea Factura / Clic 'Entregar Mercancía'
    AppVendedor->>BD: UPDATE pos_prefacturas SET estado = 'DESPACHADA'
    AppVendedor-->>Vendedor: Confirmación de Entrega Registrada
    Vendedor-->>Cliente: Entrega física de los productos
```

---

### 3.5. Diagrama 5: Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)

```mermaid
graph TD
    subgraph Presentacion [Capa 1: Interfaz de Usuario y Vistas V8]
        A1[EnterpriseSidebar Compacto 64px]
        A2[VendorPosPreSaleView: Terminal Asesor]
        A3[CashierKanbanView: Tablero Caja Unica]
        A4[DispatchScannerModal / DeliveryTray: Despacho Asesor]
        A5[SupervisorPinModal: Autorizaciones de Precio]
    end

    subgraph LogicaEstado [Capa 2: Stores Reactivos y Control de Negocio]
        B1[useAuthStore: Tenant Activo & Rol RBAC]
        B2[useMultiVendorPosStore: Preventas & Terminales]
        B3[useCashierKanbanStore: Sincronizacion Realtime <80ms]
        B4[useSidebarStore: Modo Ultra-Compacto & Mini-Rail]
    end

    subgraph ServiciosValidacion [Capa 3: Contratos Zod y Servicios de Dominio]
        C1[prefacturaSchema: Validacion Zod de Items y Descuentos]
        C2[prefacturaService: CRUD Preventas, Hard-Hold y Despacho]
        C3[multiVendorCashService: Recaudo Concurrente de Caja]
        C4[tenantIsolationInterceptor: Inyeccion estricta de tenant_id]
    end

    subgraph PersistenciaSeguridad [Capa 4: Supabase PostgreSQL & Redis Cache]
        D1[(pos_prefacturas & items)]
        D2[(facturas & movimientos_pos_caja)]
        D3[RLS: current_user_tenant_ids - Zero Leakage]
        D4[Redis Upstash: Cache L3 y Locks Concurrentes]
    end

    A1 --> B4
    A2 --> B2
    A2 --> A5
    A3 --> B3
    A4 --> B2
    
    B1 --> C4
    B2 --> C1
    B2 --> C2
    B3 --> C3
    
    C2 --> D1
    C3 --> D2
    C4 --> D3
    C3 --> D4
```

---

## 4. Rediseño del Sidebar con Leyes de UX

1. **Ley de Miller ($7 \pm 2$ chunks):**
   - Agrupación en 4 bloques operativos principales:
     - `1. VENTAS & POS` (Punto de Venta / Preventa, Clientes)
     - `2. CAJA & RECAUDO` (Kanban de Caja, Movimientos)
     - `3. BODEGA & DESPACHO` (Despachos, WMS, Muelle)
     - `4. CONTROL & REPORTES` (Métricas, Auditoría)
2. **Ley de Fitts:**
   - Botones táctiles con altura mínima de **48px**, padding generoso y centrado vertical en modo rail de **64px**.
3. **Ley de Hick & Progressive Disclosure:**
   - Supresión de badges innecesarios (solo 1 badge crítico de preventas pendientes en caja).
   - Ocultamiento de textos largos; tooltips flotantes translúcidos estilo macOS Abisal V8 (`#070A10`).
   - Atajo `Ctrl+B` conservado para expandir/colapsar temporalmente.

---

## 5. Criterios de Aceptación (EARS)

- **Ubiquitous:** El sistema **siempre** filtrará todas las consultas a `pos_prefacturas` y `facturas` por el `tenant_id` del usuario autenticado.
- **Event-driven:** Cuando un asesor comercial aplique un descuento $> 10\%$, el sistema **deberá** desplegar de forma obligatoria el `SupervisorPinModal` y bloquear la emisión hasta recibir un PIN válido de rol supervisor/admin.
- **Event-driven:** Cuando un asesor confirme la preventa, el sistema **deberá** reservar inmediatamente el stock (`hard_hold_activo = true`) y generar un código QR único para el ticket.
- **State-driven:** Mientras el estado de la preventa sea `PENDIENTE_COBRO`, el asesor **no deberá** tener habilitado el botón de despacho.
- **Event-driven:** Cuando el cajero procese el recaudo exitoso en caja, el sistema **deberá** actualizar el estado a `PAGADA` en menos de 80ms y notificar a la terminal del asesor.
- **Event-driven:** Cuando el cliente regrese con su factura y el asesor confirme la entrega, el sistema **deberá** actualizar el estado a `DESPACHADA` y liberar la tarjeta del flujo activo.
