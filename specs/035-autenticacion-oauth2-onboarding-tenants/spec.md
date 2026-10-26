# Especificación Funcional: SPEC-035

**Código:** SPEC-035  
**Título:** Autenticación OAuth 2.0 PKCE, Onboarding Automático de Primer Tenant (Admin Empresa) y Gestión de Invitaciones de Empleados RBAC  
**Fase:** Spec Kit SDD v3.0 — `/speckit.specify` & `/grill-me` (Acuerdos Consolidados)  
**Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). Arquitectura Data-Driven.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 1)  
**Fecha:** 2026-10-26  

---

## 1. Declaración del Problema & Acuerdos de Interrogatorio `/grill-me`

A través del protocolo de interrogatorio activo `/grill-me`, se acordaron las siguientes directivas fundamentales de producto y arquitectura:

1. **Pantalla de Bienvenida V8 (`LoginView.tsx`):**
   - Estética Dark Glassmorphism V8 oficial (`#070A10`, bordes translúcidos `border-white/10`, efectos de halo cian/esmeralda).
   - Botón principal de alta prominencia: **"Continuar con Google"** (OAuth 2.0 PKCE con Supabase Auth).
   - Acceso alternativo por correo (Magic Link o credenciales).
   - **Acceso Rápido de Desarrollo:** Selector colapsable visible exclusivamente en entorno local (`import.meta.env.DEV`) para alternar con 1 clic entre roles de prueba (`admin`, `vendedor`, `cajero`, `bodeguero`) sin bloquear el ciclo de desarrollo ni pruebas automatizadas.

2. **Onboarding de Primer Tenant (Creador / Admin en 2 Pasos):**
   - Cuando un usuario inicia sesión vía OAuth 2.0 por primera vez y el sistema verifica que no tiene empresas asociadas ni invitaciones pendientes:
     - **Paso 1:** Solicita Razón Social / Nombre Comercial, NIT/RUT, Ciudad y Teléfono.
     - **Paso 2:** Provisiona automáticamente la `Bodega Principal ('1')` y la `Caja General ('CAJA-01')`, asignando al usuario como `ADMIN` con `is_owner = TRUE` en `tenant_memberships`, permitiendo facturar en menos de 30 segundos.

3. **Mecanismo de Invitación de Empleados:**
   - El Administrador genera invitaciones desde el ERP ingresando Nombre, Correo y Rol.
   - El sistema genera un **Enlace Seguro Copiable** (`https://.../login?invite=TOKEN`) con validez de 7 días, permitiendo compartirlo directamente por WhatsApp o correo.
   - Cuando el empleado abre el enlace y se autentica con Google OAuth, el sistema canjea el token y lo vincula inmediatamente a la empresa con el rol asignado.

4. **Filtrado Estricto de Navegación por Roles (RBAC):**
   - El usuario accede **solamente a los módulos necesarios según sus roles y permisos**:
     - `ADMIN`: Acceso total (Dashboard, POS, WMS, Cajas, Cartera, NIIF, Personal, Ajustes).
     - `VENDEDOR`: Únicamente POS, Cotizaciones, Clientes y Pedidos Mostrador.
     - `CAJERO`: POS y Control de Cajas (Aperturas, Cobros, Arqueo Ciego).
     - `BODEGUERO`: Compras en Muelle, Bodegas & WMS, Despachos, Alistamiento y Cuartos Fríos.
     - `SUPERVISOR`: POS, Cajas, Métricas OTIF y Bodegas.

---

## 2. Multi-Phase System Modeling (5 Diagramas Mermaid Canónicos)

### 2.1. `1_process_flowcharts`: Flujo de Procesos y Ciclo de Vida Secuencial

```mermaid
flowchart TD
    A[Usuario navega al ERP] --> B{¿Existe sesión activa en Supabase?}
    B -- No --> C[Renderizar LoginView V8 con OAuth 2.0 Google]
    B -- Sí --> D[Verificar tenant_memberships en BD]
    
    C --> E[Usuario hace clic en 'Continuar con Google']
    E --> F[Flujo Supabase Auth PKCE y Redirección]
    F --> G[Obtención de JWT y Perfil de Usuario]
    
    G --> H{¿Tiene membresía en alguna empresa?}
    H -- No tiene empresa --> I{¿Existe parámetro ?invite=TOKEN en URL?}
    I -- Sí tiene invite --> J[Canjear Token: Asignar al Tenant con el Rol Invitado]
    I -- No tiene invite --> K[Mostrar Asistente Onboarding 2 Pasos]
    
    K --> L[Crear Tenant, Bodega Principal y Caja 01]
    L --> M[Asignar rol ADMIN y is_owner = true]
    J --> N[Cargar módulos filtrados por rol RBAC]
    M --> N
    
    H -- Ya tiene empresa --> O[Cargar tenant activo]
    O --> N
    N --> P[Renderizar Sidebar filtrado y Dashboard]
```

---

### 2.2. `2_decision_logic_diagrams`: Rombos de Decisión y Control de Fronteras

```mermaid
flowchart TD
    subgraph Decisiones_Autenticacion_y_Tenant
        A[Solicitud de Acceso a Módulo ERP] --> B{¿Usuario Autenticado?}
        B -- No --> C[Redirigir a /login]
        B -- Sí --> D{¿Tiene Empresa/Tenant Activo?}
        
        D -- No --> E{¿Tiene invitación pendiente?}
        E -- Sí --> F[Vincular a la empresa y activar rol]
        E -- No --> G[Mostrar Modal Obligatorio de Creación de Empresa]
        
        D -- Sí --> H{¿El rol del usuario tiene permiso para este módulo?}
        H -- Sí --> I[Permitir acceso al módulo]
        H -- No --> J[Ocultar del Sidebar y Denegar Acceso HTTP 403]
    end
```

---

### 2.3. `3_entity_relationship_diagrams`: Modelo ERD Relacional

```mermaid
erDiagram
    AUTH_USERS ||--o{ TENANT_MEMBERSHIPS : "pertenece_a"
    TENANTS ||--o{ TENANT_MEMBERSHIPS : "tiene_miembros"
    TENANTS ||--o{ TENANT_INVITATIONS : "emite_invitaciones"
    AUTH_USERS ||--o{ TENANT_INVITATIONS : "creada_por"

    AUTH_USERS {
        uuid id PK
        string email UK
        jsonb raw_user_meta_data
        timestamp created_at
    }

    TENANTS {
        uuid id PK
        string razon_social
        string nit_rut UK
        string direccion
        string telefono
        string regimen_tributario
        boolean activo
        timestamp created_at
    }

    TENANT_MEMBERSHIPS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string role "admin | vendedor | cajero | bodeguero | supervisor | contador"
        string status "active | suspended | invited"
        boolean is_owner
        timestamp created_at
    }

    TENANT_INVITATIONS {
        uuid id PK
        uuid tenant_id FK
        string email
        string role
        string token UK
        timestamp expires_at
        string status "pending | accepted | expired | revoked"
        uuid invited_by FK
        timestamp created_at
    }
```

---

### 2.4. `4_sequence_diagrams`: Diagrama de Secuencia Temporal (Invitación y Activación)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador Empresa
    participant POS as Frontend ERP (V8)
    participant API as Supabase Auth & Edge API
    participant DB as PostgreSQL (RLS)
    actor Empleado as Nuevo Empleado (Vendedor)

    Admin->>POS: Invitar Empleado (nombre, email, rol: VENDEDOR)
    POS->>API: POST /rpc/crear_invitacion_empleado (tenant_id, email, rol)
    API->>DB: INSERT into tenant_invitations (token seguro, expira en 7d)
    DB-->>API: Confirmación de invitación creada
    API-->>POS: Enlace de invitación generado (/login?invite_token=XYZ)
    POS-->>Admin: Muestra link para copiar o enviar por correo

    Empleado->>POS: Abre enlace /login?invite_token=XYZ
    POS->>API: Iniciar sesión con Google OAuth 2.0 (PKCE)
    API-->>POS: Callback con JWT y auth.user
    POS->>API: POST /rpc/aceptar_invitacion_empleado (token, user_id)
    API->>DB: UPDATE invitations status='accepted', INSERT into tenant_memberships
    DB-->>API: Membresía activada como VENDEDOR
    API-->>POS: Redirigir a módulo POS con permisos de Vendedor
```

---

### 2.5. `5_component_architecture_diagrams`: Arquitectura por Capas

```mermaid
graph TB
    subgraph Capa_Presentacion_UI
        L1[LoginView.tsx - V8 Dark Glassmorphism]
        L2[TenantOnboardingModal.tsx - Asistente 1ra Empresa]
        L3[EmployeeInviteModal.tsx - Panel Administrador]
        L4[EnterpriseSidebar.tsx - Filtrado de Módulos por Rol]
    end

    subgraph Capa_Logica_y_Estado
        S1[useAuthStore.ts - Estado de sesión, tenant y roles]
        S2[authService.ts - Orquestador Supabase OAuth & Mock Mode]
        S3[tenantService.ts - Creación de empresa e invitaciones]
        V1[auth.schema.ts - Contratos Zod de Login, Onboarding e Invitaciones]
    end

    subgraph Capa_Acceso_a_Datos_Supabase
        D1[Supabase Auth GoTrue PKCE]
        D2[RPC public.crear_empresa_con_admin]
        D3[RPC public.procesar_invitacion_empleado]
        D4[Políticas RLS Multi-Tenant en tenants y memberships]
    end

    L1 --> S2
    L2 --> S3
    L3 --> S3
    L4 --> S1
    S1 --> S2
    S2 --> D1
    S3 --> D2
    S3 --> D3
    S2 --> V1
    S3 --> V1
    D2 --> D4
    D3 --> D4
```

---

## 3. Criterios de Aceptación (EARS)

- **[EARS-01]** *Cuando* un usuario no autenticado navega a la aplicación, *el sistema* deberá presentar la pantalla oficial `LoginView` en Dark Glassmorphism V8 con el botón "Continuar con Google".
- **[EARS-02]** *Cuando* un usuario autenticado por primera vez no posea empresas vinculadas, *el sistema* deberá abrir el modal de Onboarding solicitando Razón Social, NIT, Ciudad y Teléfono.
- **[EARS-03]** *Tras* completar el onboarding, *el sistema* deberá aprovisionar el tenant, la Bodega Principal, la Caja 01 y asignar al usuario el rol `ADMIN` con `is_owner = true`.
- **[EARS-04]** *Cuando* un Administrador invite a un colaborador, *el sistema* deberá generar un enlace copiable con token seguro único con vigencia de 7 días.
- **[EARS-05]** *Cuando* un usuario ingrese con un token de invitación y se autentique, *el sistema* deberá vincularlo automáticamente a la empresa del remitente con su rol específico.
- **[EARS-06]** *Mientras* un usuario con rol operativo navegue por el ERP, *el sistema* deberá mostrar en el Sidebar únicamente los módulos para los cuales tiene permisos explícitos.
- **[EARS-07]** *Mientras* se ejecuten pruebas unitarias o desarrollo offline, *el sistema* deberá ofrecer el selector de acceso rápido de desarrollo para pruebas ágiles.
