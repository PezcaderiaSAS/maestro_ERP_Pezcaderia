# SPEC-065: Flujo Diario de Cajero Principal, Separación Estricta de Roles y Rediseño Ergonómico de Conmutación Multi-Tenant

**Módulo:** Gestión de Caja, Terminales POS y Conmutación Multi-Tenant  
**Fecha:** 18 de Noviembre de 2026  
**Estado:** PROPUESTA / REVISIÓN SDD (Requiere Aprobación)  
**Autor:** Antigravity Architect & SDD Team  
**Políticas:** Spec-Driven Development (SDD), Lean Kanban (WIP = 1), WCAG 2.2 AA+, Dark Glassmorphism / Light Mode POS  

---

## 1. Resumen Ejecutivo y Diagnóstico

### 1.1. Diagnóstico del Problema Actual
1. **Conmutación Multi-Empresa Invasiva y Poco Clara:**
   - Actualmente, al pulsar el selector de empresa en el encabezado, se abre un modal pesado en pantalla completa (`TenantSelectorModal`) con un fondo oscuro opaco (`bg-slate-950/80 backdrop-blur-md`) que tapa el centro de la pantalla, oscurece la vista de trabajo y obliga al usuario a buscar un botón "Cerrar" en el pie para volver al catálogo.
   - **Solución Propuesta:** Reemplazar el modal bloqueante por un **Popover Dropdown Ergonómico Flotante** anclado al badge del tenant en el Topbar/Header. Con 1 clic conmuta la empresa, re-sincroniza el catálogo en milisegundos y se auto-cierra sin tapar el POS.

2. **Flujo Real Diario de Caja y Apertura Obligatoria:**
   - En una operación comercial real (tanto en ferretería como en pescadería), un cajero no puede registrar pagos, comandas, egresos o sangrías sin antes declarar la **Base Inicial de Efectivo (Apertura de Turno)** en su gaveta.
   - **Solución Propuesta:** Implementar un **Gatekeeper Estricto**:
     - Si el usuario está en rol de Cajero (`CAJERO_PRINCIPAL` o modo cobro central) y la caja está en estado `CERRADA`:
       - Toda acción de cobro o egreso queda bloqueada.
       - Se despliega de forma prioritaria el asistente de **Apertura de Turno** solicitando: Caja física asignada, Saldo sugerido de arrastre (fondo fijo, ej. $100.000 COP) y conteo físico inicial.
       - Al confirmar, el turno pasa a `ABIERTO` y se habilitan los cobros y egresos.

3. **Separación Estricta de Roles Operativos:**
   - **Vendedor / Asesor de Mostrador:** Solo emite comandas/preventas (F6) y consulta catálogo/stock. Tiene prohibido cobrar en efectivo, abrir turnos o cerrar cajas.
   - **Cajero Principal:** Opera la caja central, cobra comandas despachadas (F9/F2), registra egresos operativos menores (hasta el tope autorizado) y ejecuta el **Arqueo Ciego** al final del día.
   - **Supervisor / Administrador:** Autoriza descuentos > 10%, valida excesos de egresos, revisa descuadres de arqueo y conmuta empresas.

---

## 2. Modelado de Ingeniería Multi-Fase (5 Diagramas Mermaid Canónicos)

### 2.1. Diagrama 1: Flujo de Procesos y Ciclo de Vida del Turno (`1_process_flowcharts`)
```mermaid
flowchart TD
    Inicio([Inicio de Jornada: Cajero Llega al Terminal]) --> Auth[Autenticación PIN / Credenciales]
    Auth --> CheckTurno{¿Existe Turno Activo Abierto en esta Caja?}
    
    CheckTurno -- Sí --> Operando[Estado: TURNO ABIERTO\nSemáforo Verde]
    CheckTurno -- No --> Bloqueo[Estado: CAJA CERRADA\nGatekeeper Activo: Cobros y Egresos Bloqueados]
    
    Bloqueo --> SolicitarApertura[Desplegar Modal Apertura de Caja]
    SolicitarApertura --> IngresoBase[Cajero cuenta e ingresa Base Inicial de Efectivo]
    IngresoBase --> ValidarBase{¿Base coincide con Fondo Fijo?}
    ValidarBase -- No --> JustificarBase[Registrar Novedad / Justificación de Base] --> ConfirmarApertura
    ValidarBase -- Sí --> ConfirmarApertura[Crear Registro turnos_caja: ABIERTO]
    
    ConfirmarApertura --> MovInicial[Generar Movimiento INGRESO_BASE_INICIAL]
    MovInicial --> Operando
    
    subgraph OperacionDiaria [Operación Durante la Jornada]
        Operando --> CobrarComanda[Cobrar Preventas/Comandas de Vendedores F9/F2]
        Operando --> EgresoGasto[Registrar Egreso Operativo Menor]
        Operando --> SangriaCaja[Retiro Parcial / Traslado a Caja Mayor]
    end
    
    CobrarComanda --> FinJornada{¿Fin de Turno o Jornada?}
    EgresoGasto --> FinJornada
    SangriaCaja --> FinJornada
    
    FinJornada -- No --> Operando
    FinJornada -- Sí --> ArqueoCiego[Iniciar Cierre: Arqueo Ciego de Gaveta]
    ArqueoCiego --> ConteoFisico[Cajero digita billetes/monedas SIN ver teórico]
    ConteoFisico --> Comparar{¿Cuadre Exacto con Sistema?}
    Comparar -- No --> JustificarDescuadre[Exigir Justificación Escrita y PIN Supervisor] --> CerrarTurno
    Comparar -- Sí --> CerrarTurno[Estado: CERRADO\nImprimir Tirilla Z\nBloquear Terminal]
    CerrarTurno --> Fin([Fin del Ciclo])
```

---

### 2.2. Diagrama 2: Rombos de Decisión y Guardias de Seguridad (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    IntentoAccion[Usuario intenta realizar Acción en POS] --> CheckRol{¿Cuál es el Rol del Usuario Activo?}
    
    CheckRol -- Vendedor Mostrador --> IntentoCobro{¿Intenta cobrar o abrir caja?}
    IntentoCobro -- Sí --> DenegarVendedor[Acción Denegada: Los vendedores solo emiten comandas F6]
    IntentoCobro -- No --> PermitirComanda[Permitir emitir preventa / comanda]
    
    CheckRol -- Cajero Principal --> ValidaTurno{¿Turno de Caja está ABIERTO?}
    ValidaTurno -- No --> BloquearOperacion[Bloquear: Exige Apertura de Caja con Base Inicial]
    ValidaTurno -- Sí --> TipoAccion{¿Tipo de Acción?}
    
    TipoAccion -- Cobro Venta --> EjecutarCobro[Validar Carrito -> Registrar Venta -> Sumar a Turno]
    TipoAccion -- Egreso Menor --> CheckTope{¿Monto > Límite Máx. Autorizado ej. $50.000?}
    CheckTope -- Sí --> SolicitarPINSupervisor[Exigir PIN de Supervisor para Autorizar]
    CheckTope -- No --> RegistrarEgresoDirecto[Registrar Egreso y Descontar Saldo]
    SolicitarPINSupervisor --> RegistrarEgresoDirecto
    
    TipoAccion -- Cierre de Turno --> IniciarArqueo[Presentar Pantalla de Arqueo Ciego]
    
    CheckRol -- Administrador --> AdminPermitir[Permitir con Privilegios Globales + Auditoría]
```

---

### 2.3. Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    TENANTS ||--o{ CAJAS : posee
    TENANTS ||--o{ USUARIOS : emplea
    CAJAS ||--o{ TURNOS_CAJA : registra
    USUARIOS ||--o{ TURNOS_CAJA : abre_y_cierra
    TURNOS_CAJA ||--o{ MOVIMIENTOS_CAJA : contiene
    TURNOS_CAJA ||--o{ VENTAS : liquida
    USUARIOS ||--o{ PREVENTAS_COMANDAS : emite
    PREVENTAS_COMANDAS ||--o| VENTAS : cobrada_en

    TENANTS {
        string id PK
        string razon_social
        string nit
        string rubro
        boolean activo
    }

    CAJAS {
        string id PK
        string tenant_id FK
        string nombre
        string tipo
        boolean activa
    }

    USUARIOS {
        string id PK
        string tenant_id FK
        string nombre
        string rol
        string pin_hash
        boolean activo
    }

    TURNOS_CAJA {
        string id PK
        string tenant_id FK
        string caja_id FK
        string cajero_id FK
        string estado
        timestamp fecha_apertura
        timestamp fecha_cierre
        number base_inicial_efectivo
        number total_ventas_efectivo
        number total_ventas_electronico
        number total_egresos_operativos
        number saldo_esperado_efectivo
        number saldo_fisico_declarado
        number diferencia_descuadre
        string justificacion_cierre
        string supervisor_autoriza_id FK
    }

    MOVIMIENTOS_CAJA {
        string id PK
        string turno_id FK
        string tenant_id FK
        string tipo
        string metodo_pago
        number monto
        string concepto
        string comprobante_ref
        timestamp creado_en
    }
```

---

### 2.4. Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    autonumber
    actor Cajero as Cajero Principal
    participant POS as Vista POS (UI)
    participant CashStore as useCashStore (Zustand L1)
    participant CashService as posCashEngineService
    participant DB as IndexedDB / Supabase

    Cajero->>POS: Ingresa a módulo de Facturación / POS
    POS->>CashStore: loadTurnoActivo(cajaId, cajeroId)
    CashStore->>DB: Consultar turno WHERE estado = 'ABIERTO'
    DB-->>CashStore: null (No hay turno abierto)
    CashStore-->>POS: turnoActivo = null (isTurnoAbierto = false)
    
    POS->>POS: Activar Gatekeeper: Deshabilitar botones de cobro
    POS->>Cajero: Desplegar Modal AperturaCajaModal (Obligatorio)
    
    Cajero->>POS: Ingresa conteo de Base Inicial ($100.000 COP) y confirma
    POS->>CashService: abrirTurno(cajaId, cajeroId, baseInicial, desgloseBilletes)
    CashService->>DB: INSERT turnos_caja (estado='ABIERTO', base=100000)
    CashService->>DB: INSERT movimientos_caja (tipo='INGRESO_BASE_INICIAL')
    DB-->>CashService: Turno Creado OK (ID: turno-20261118-01)
    CashService->>CashStore: setTurnoActivo(nuevoTurno)
    CashStore-->>POS: Reactividad: isTurnoAbierto = true
    POS->>Cajero: Alerta Toast: "Caja Abierta con Éxito. Terminal listo para operar."
    POS->>POS: Desbloquear Carrito, Cobros y F9/F2
```

---

### 2.5. Diagrama 5: Arquitectura de Componentes (`5_component_architecture_diagrams`)
```mermaid
flowchart LR
    subgraph UI_Layer [Capa de Presentación UI/UX]
        Topbar[EnterpriseTopbar / POSHeader]
        TenantPopover[TenantDropdownPopover\nErgonómico & Compacto]
        Gatekeeper[CashShiftGatekeeper\nBloqueo reactivo sin turno]
        AperturaModal[AperturaCajaModal\nDesglose de billetes y base]
        ArqueoModal[ArqueoCajaCiegaModal\nConteo a ciegas]
        POSView[POSView\nCatálogo y Carrito]
    end

    subgraph State_Layer [Capa de Estado Zustand L1]
        useAuthStore[useAuthStore\nTenant & Rol Activo]
        useCashStore[useCashStore\nTurno Activo & Movimientos]
        useCartStore[useCartStore\nLíneas de Venta]
    end

    subgraph Service_Layer [Capa de Servicios y Motores de Negocio]
        TenantService[superAdminService / ferreteriaJosaseService]
        CashEngine[cashService / posCashEngineService]
        SyncEngine[outboxQueueService / syncEngine]
    end

    subgraph Storage_Layer [Capa de Persistencia L2/L4]
        IndexedDB[(IndexedDB Local\nOffline-First)]
        Supabase[(PostgreSQL Supabase\nRLS Multi-Tenant)]
    end

    Topbar --> TenantPopover
    TenantPopover --> useAuthStore
    useAuthStore --> TenantService

    POSView --> Gatekeeper
    Gatekeeper --> AperturaModal
    Gatekeeper --> useCashStore
    AperturaModal --> CashEngine
    ArqueoModal --> CashEngine

    CashEngine --> useCashStore
    CashEngine --> IndexedDB
    IndexedDB --> SyncEngine
    SyncEngine --> Supabase
```

---

## 3. Matriz de Roles y Reglas de Negocio (RBAC Estricto)

| Acción / Privilegio | Vendedor Mostrador | Cajero Principal | Supervisor | Administrador |
| :--- | :---: | :---: | :---: | :---: |
| **Consultar Catálogo y Precios** | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Generar Comanda / Preventa (F6)** | ✅ Función Principal | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Apertura de Turno de Caja** | 🚫 Prohibido | ✅ Obligatorio | ✅ Permitido | ✅ Permitido |
| **Cobro de Preventas / Facturación (F2/F9)** | 🚫 Prohibido | ✅ Requiere Turno Abierto | ✅ Permitido | ✅ Permitido |
| **Egresos de Caja Menor (≤ $50.000)** | 🚫 Prohibido | ✅ Con Soporte | ✅ Con Soporte | ✅ Con Soporte |
| **Egresos Mayores (> $50.000)** | 🚫 Prohibido | 🔒 Requiere PIN Supervisor | ✅ Autoriza | ✅ Autoriza |
| **Sangría / Traslado a Caja Fuerte** | 🚫 Prohibido | ✅ Con Comprobante | ✅ Con Comprobante | ✅ Con Comprobante |
| **Arqueo Ciego y Cierre de Turno** | 🚫 Prohibido | ✅ Obligatorio al Fin de Día | ✅ Audita / Aprueba | ✅ Audita / Aprueba |
| **Conmutar Entre Empresas (Multi-Tenant)** | 🚫 Fijo a su Empresa | 🚫 Fijo a su Empresa | 🚫 Fijo a su Empresa | 👑 Global (GOD_MODE) |

---

## 4. Rediseño UI/UX del Conmutador de Empresas (Tenant Switcher)

Para resolver definitivamente la molestia expresada por el usuario respecto a que el modal oscuro tapa la pantalla:

1. **Reemplazo por Popover Flotante Ergonómico:**
   - En lugar de oscurecer toda la pantalla con un modal centrado, el botón de empresa en `EnterpriseTopbar` o `POSMultivendorLightHeader` abre un **menú desplegable (popover)** justo debajo del botón.
   - Dimensiones compactas (`w-80` a `w-96`), estilizado con bordes sutiles y fondo glassmorphism de alto contraste WCAG.
   - Cada empresa muestra:
     - Avatar con icono temático (🐟 Pezcadería / 🔨 Ferretería).
     - Razón Social, NIT y badge del rubro.
     - Indicador claro de "Activa" con check verde.
   - **Acción Inmediata a 1 Clic:** Al hacer clic en otra empresa:
     - Se cambia el tenant en `useAuthStore`.
     - Se invoca reactivamente la carga de catálogo correspondiente (`ferreteriaJosaseService.applyToStores()` o `restorePezcaderiaStores()`).
     - Se cierra inmediatamente el popover.
     - Se emite un Toast breve en la esquina superior derecha (`2 segundos`, no bloqueante).
     - La vista del POS se mantiene 100% visible sin ningún parpadeo ni overlay oscuro.

---

## 5. Plan de Implementación por Fases (SDD)

1. **Fase 1: Componente TenantDropdownPopover (UI/UX Ergonomía)**
   - Crear `TenantDropdownPopover.tsx` para reemplazar el uso de `TenantSelectorModal` en los encabezados operativos.
   - Mantener `TenantSelectorModal` disponible únicamente en el módulo de SuperAdmin de configuración avanzada.

2. **Fase 2: Motor de Turno de Caja y Bloqueo Reactivo (Cash Gatekeeper)**
   - Fortalecer el store `useCashStore` y el hook `useCashShiftGatekeeper` para asegurar que ningún endpoint o función de cobro procese transacciones si `turnoActivo === null`.
   - Si un cajero intenta cobrar o emitir factura sin turno, desplegar inmediatamente el modal de apertura con foco automático en el campo de base.

3. **Fase 3: Separación Estricta de Vistas por Rol en POSView**
   - Si el rol es `VENDEDOR_MOSTRADOR`, ocultar o inhabilitar completamente la pestaña de arqueo, movimientos de caja y cobro directo, forzando el botón principal como "Emitir Comanda (F6)".
   - Si el rol es `CAJERO_PRINCIPAL`, presentar la barra de turno activo, el botón de arqueo/cierre y la cola de comandas por cobrar (F9).

4. **Fase 4: Suite de Pruebas Automatizadas TDD & Quality Gate**
   - Pruebas unitarias para el popover de conmutación de tenant (`tenantDropdownPopover.test.tsx`).
   - Pruebas de integración del bloqueo de caja (`cashierShiftGatekeeper.test.tsx`).
   - Verificación `tsc --noEmit` y suite Vitest al 100%.

