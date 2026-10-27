# Especificación de Requerimiento: /speckit.specify (SPEC-036)

**Código:** SPEC-036  
**Fase:** /speckit.specify (SDD v3.0)  
**Ticket:** AUTH-ONBOARDING-USER-MGMT-V8  
**Título:** Sistema Profesional de Inicio de Sesión, Registro Multi-Tenant en 2 Pasos y Creación de Usuarios con Matriz Granular de Permisos  
**Emisor:** Director de Agencia / Tech Lead  
**Receptores:** Equipo de Arquitectura de Seguridad, Frontend UI/UX, Backend Supabase  
**Prioridad:** Alta / Constitucional  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-27  

---

## 1. El "Qué" y el "Por Qué" (Objetivo del Sistema)

### 1.1. Propósito de Negocio y Operativo
Proveer a **La Pezcadería ERP** y sus empresas inquilinas (tenants) de un sistema de acceso, registro y control de identidades de estándar SaaS empresarial:
1. **Inicio de Sesión Profesional & Seguro:** Vista corporativa bajo la estética oficial **Dark Glassmorphism V8** (`#070A10`), con pestañas alternables entre *Iniciar Sesión* y *Registrar Empresa*, soportando autenticación por Correo + Contraseña y Google OAuth.
2. **Onboarding Guiado de Empresa en 2 Pasos:**
   - **Paso 1 (Empresa):** Razón Social, NIT/RUT, Ciudad, Teléfono y Dirección.
   - **Paso 2 (Admin Fundador):** Nombre completo, Cédula de ciudadanía, Correo corporativo y Celular. Se genera automáticamente la membresía de Propietario/Administrador, provisionando de forma atómica su primera Bodega y Caja.
3. **Gestión de Usuarios con Matriz Granular de Permisos:**
   - Creación rápida de usuarios con campos obligatorios completos (Nombre, Cédula, Correo, Celular y Rol base).
   - Asignación de contraseña predeterminada igual a su número de identificación (cédula).
   - **Política Estricta OWASP/NIST:** En su primer inicio de sesión, el sistema detecta `mustChangePassword = true` y bloquea el acceso hasta que el empleado defina una contraseña personal robusta.
   - **Matriz de Permisos por Checkboxes:** El administrador puede encender o apagar individualmente cada vista y acción de permiso para el usuario de forma 100% personalizada.
4. **Selector Inteligente Multi-Empresa:** Conduce directamente al ERP si el usuario pertenece a 1 empresa, o despliega un modal elegante de selección si gestiona varias organizaciones.

---

## 2. Multi-Phase System Modeling (5 Diagramas Mermaid Obligatorios)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (Process Flowchart)
```mermaid
flowchart TD
    A[Usuario llega a la pantalla principal de Login V8] --> B{¿Tiene cuenta registrada?}
    B -- No / Nueva Empresa --> C[Clic en pestaña 'Registrar Empresa']
    C --> D[Paso 1: Captura de Datos de Empresa - NIT, Razón Social, Ciudad, Teléfono]
    D --> E[Paso 2: Captura de Datos del Administrador - Nombre, Cédula, Correo, Celular]
    E --> F[Creación atómica de Tenant, Bodega 1, Caja 01 y Usuario Admin]
    F --> G[Sesión iniciada como Administrador de la Empresa]

    B -- Sí / Empleado Existente --> H[Ingresa Correo Electrónico y Contraseña]
    H --> I{¿Credenciales válidas?}
    I -- No --> J[Muestra alerta de error SweetAlert2 y reintento]
    I -- Sí --> K{¿Primer inicio de sesión? - mustChangePassword == true}
    K -- Sí --> L[Despliega Modal Forzoso: 'Establecer Nueva Contraseña Segura']
    L --> M[Usuario digita y confirma nueva contraseña - Actualiza Hash]
    M --> N{¿A cuántas empresas pertenece?}
    K -- No --> N
    N -- Una sola empresa --> O[Carga contexto activo de Tenant y abre ERP]
    N -- Múltiples empresas --> P[Despliega Selector Visual de Empresa]
    P --> Q[Usuario selecciona empresa de trabajo] --> O
```

---

### Diagrama 2: Lógica de Decisión y Edge Cases (Decision Logic Diagrams)
```mermaid
flowchart TD
    subgraph CreacionUsuarioAdmin ["Lógica: Creación de Usuario por Administrador"]
        U1[Admin abre modal 'Nuevo Usuario' en ERP] --> U2[Ingresa Nombre, Cédula, Correo, Celular, Rol]
        U2 --> U3{¿Campos completos y válidos?}
        U3 -- Faltan campos --> U4[Error de validación Zod en tiempo real]
        U3 -- Válidos --> U5{¿Correo o Cédula ya existen en el Tenant?}
        U5 -- Duplicado --> U6[Alerta: 'Usuario ya registrado con este Correo/Cédula']
        U5 -- Único --> U7[Admin marca matriz de checkboxes de permisos]
        U7 --> U8[Guarda usuario con password = Cédula y mustChangePassword = true]
        U8 --> U9[Usuario listo en lista con badge 'Pendiente de Primer Acceso']
    end

    subgraph EvaluacionPermisos ["Lógica: Evaluación de Permisos en Navegación"]
        E1[Usuario navega o interactúa en ERP] --> E2{¿Permiso individual en matriz de checkboxes?}
        E2 -- 'true' explícito --> E3[Renderiza vista o habilita acción]
        E2 -- 'false' explícito --> E4[Oculta botón / Bloquea ruta con alerta 403 Forbidden]
        E2 -- No definido / Heredado --> E5{¿Permitido por Rol Base?}
        E5 -- Sí --> E3
        E5 -- No --> E4
    end
```

---

### Diagrama 3: Modelo Entidad-Relación (Entity Relationship Diagram)
```mermaid
erDiagram
    TENANT ||--o{ TENANT_MEMBERSHIP : "tiene miembros"
    TENANT ||--o{ BODEGA : "posee"
    TENANT ||--o{ CAJA : "opera"
    USER_PROFILE ||--o{ TENANT_MEMBERSHIP : "pertenece a"
    TENANT_MEMBERSHIP ||--o{ USER_PERMISSION : "tiene permisos granulares"

    TENANT {
        string id PK "UUID / Slug"
        string razonSocial "Nombre comercial"
        string nit "Identificación tributaria única"
        string ciudad "Ubicación"
        string direccion "Sede principal"
        string telefono "Línea de contacto"
        boolean activo "Estado del tenant"
        string createdAt "Fecha registro"
    }

    USER_PROFILE {
        string id PK "UUID del usuario"
        string email UK "Correo de acceso"
        string nombre "Nombres y apellidos"
        string identificacion "Cédula / Documento"
        string telefono "Celular"
        string passwordHash "Hash seguro de contraseña"
        boolean mustChangePassword "Flag primer login"
        string lastLoginAt "Último acceso"
        string createdAt "Fecha creación"
    }

    TENANT_MEMBERSHIP {
        string id PK "UUID membresía"
        string tenantId FK "Referencia a Tenant"
        string userId FK "Referencia a UserProfile"
        string role "ADMINISTRADOR | VENDEDOR | CAJERO | BODEGUERO | SUPERVISOR | CONTADOR"
        boolean isOwner "Propietario fundador"
        string status "ACTIVE | SUSPENDED"
        string createdAt "Fecha asignación"
    }

    USER_PERMISSION {
        string id PK "UUID permiso"
        string membershipId FK "Referencia a TenantMembership"
        string permissionKey "Identificador clave (ej. pos.discounts, inventory.costs)"
        boolean granted "Estado activado por checkbox"
    }
```

---

### Diagrama 4: Diagrama de Secuencia Temporal (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor Empleado as Empleado / Usuario
    participant LoginUI as LoginView (Dark Glassmorphism V8)
    participant AuthStore as useAuthStore (Zustand)
    participant AuthService as authService
    participant LocalDB as Persistencia Local / Supabase

    Empleado->>LoginUI: Digita Correo y Contraseña inicial (su Cédula)
    LoginUI->>AuthService: loginWithCredentials(email, password)
    AuthService->>LocalDB: Valida credenciales contra usuarios del Tenant
    LocalDB-->>AuthService: Usuario válido (mustChangePassword == true)
    AuthService-->>AuthStore: Retorna perfil con estado 'MUST_CHANGE_PASSWORD'
    AuthStore-->>LoginUI: Dispara evento de cambio obligatorio
    LoginUI->>Empleado: Despliega Modal 'Bienvenido: Define tu nueva Contraseña'
    Empleado->>LoginUI: Digita Nueva Contraseña y Confirmación
    LoginUI->>AuthService: updatePasswordOnFirstLogin(userId, newPassword)
    AuthService->>LocalDB: Actualiza hash y setea mustChangePassword = false
    LocalDB-->>AuthService: Actualización confirmada
    AuthService-->>AuthStore: setSession(user, activeTenant, status='AUTHENTICATED')
    AuthStore-->>LoginUI: Redirige a ruta principal del ERP
    LoginUI->>Empleado: Dashboard operativo cargado exitosamente
```

---

### Diagrama 5: Arquitectura por Capas de Componentes (Component Architecture)
```mermaid
graph TD
    subgraph CapaPresentacion ["Capa de Presentación (UI / Dark Glassmorphism V8)"]
        LV[LoginView.tsx - Pantalla Dual Login/Registro]
        TOM[TenantOnboardingModal.tsx - Wizard 2 Pasos]
        UCM[UserCreationModal.tsx - Formulario Compacto + Matriz Checkboxes]
        CPW[ChangePasswordModal.tsx - Forzar cambio primer login]
        TSM[TenantSelectorModal.tsx - Selección Multi-Empresa]
    end

    subgraph CapaEstado ["Capa de Estado & Lógica de Negocio"]
        UAS[useAuthStore.ts - Sesión, Tenant Activo, Rol]
        UES[useEmployeeStore.ts - Catálogo de Usuarios/Empleados]
        UPS[usePermissionsStore.ts - Matriz reactiva de checkboxes]
    end

    subgraph CapaServicios ["Capa de Servicios & Validadores Zod"]
        AS[authService.ts - Autenticación, Hashes, OAuth]
        TOS[tenantOnboardingService.ts - Aprovisionamiento atómico]
        US[userService.ts - CRUD de usuarios y contraseñas]
        SCH[auth.schema.ts & user.schema.ts - Contratos Zod estrictos]
    end

    subgraph CapaDatos ["Capa de Persistencia & Infraestructura"]
        LDB[(LocalDb / Offline IndexedDB)]
        SUPA[(Supabase PostgreSQL / Auth Engine)]
    end

    LV --> UAS
    TOM --> TOS
    UCM --> US
    CPW --> AS
    TSM --> UAS

    UAS --> AS
    UES --> US
    UPS --> US

    AS --> SCH
    TOS --> SCH
    US --> SCH

    AS --> LDB
    AS --> SUPA
    TOS --> LDB
    TOS --> SUPA
    US --> LDB
    US --> SUPA
```

---

## 3. Matriz de Roles y Checkboxes de Permisos Granulares

| Módulo del ERP | Clave de Permiso (`permissionKey`) | Descripción de la Acción / Vista | Marcado Predeterminado por Rol |
| :--- | :--- | :--- | :--- |
| **Punto de Venta** | `pos.access` | Acceso a pantalla y terminales de POS | Admin, Supervisor, Cajero, Vendedor |
| **Punto de Venta** | `pos.apply_discounts` | Aplicar descuentos discrecionales > 10% | Admin, Supervisor |
| **Punto de Venta** | `pos.cancel_tickets` | Cancelar o anular tickets y preventas | Admin, Supervisor |
| **Caja & Tesorería**| `cash.access` | Ver arqueo y movimientos de caja central | Admin, Supervisor, Cajero |
| **Caja & Tesorería**| `cash.register_expenses` | Registrar egresos operativos de caja menor | Admin, Supervisor, Cajero |
| **Inventario & WMS**| `inventory.view` | Ver existencias multibodega y Kardex | Admin, Supervisor, Bodeguero |
| **Inventario & WMS**| `inventory.view_costs`| Ver costos de compra y márgenes de utilidad | Admin, Supervisor, Contador |
| **Inventario & WMS**| `inventory.adjust` | Realizar ajustes manuales de stock o mermas | Admin, Supervisor |
| **Compras & Muelle**| `purchases.reception` | Recibir furgones de muelle y registrar lotes| Admin, Supervisor, Bodeguero |
| **Configuración**   | `admin.users_manage` | Crear usuarios y modificar matriz de permisos | Admin |
| **Configuración**   | `admin.tenant_edit` | Editar datos fiscales y bodegas de la empresa| Admin |

---

## 4. Requerimientos No Funcionales y Criterios de Aceptación
1. **Ergonomía y Estética:** Sistema 100% bajo estética **Dark Glassmorphism V8** (`#070A10`), con micro-animaciones fluidas y controles táctiles mínimos de 48 px.
2. **Seguridad y Validación:** Tipado estricto con TypeScript (`tsc --noEmit` 0 errores), validación Zod en fronteras y cifrado/hashing de contraseñas.
3. **Calidad TDD:** 100% de pruebas unitarias e integración en verde con Vitest antes de cada entrega.
4. **DevTools MCP:** 0 errores/warnings en consola JS y renderizado móvil verificado en 375 px.

---

> [!IMPORTANT]
> **PROHIBIDO GENERAR CÓDIGO DE PRODUCCIÓN TODAVÍA.**  
> Esta especificación requiere la aprobación formal del usuario antes de proceder a la fase `/speckit.clarify` y `/speckit.plan`.
