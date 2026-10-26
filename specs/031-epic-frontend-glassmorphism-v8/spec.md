# Especificación de Requerimiento: /speckit.specify (SPEC-031)

**Código:** SPEC-031  
**Fase:** /speckit.specify (SDD v3.0)  
**Ticket:** EPIC-FRONTEND-GLASSMORPHISM-V8  
**Título:** Transformación Global del Frontend: Sistema de Diseño Premium (Glassmorphism & Dark UI V8)  
**Emisor:** Director de Agencia / Tech Lead  
**Receptores:** Equipo de Arquitectura Frontend, Equipo de Diseño UI/UX, Agentes de IA  
**Prioridad:** Máxima / Épica  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-26  

---

## 1. El "Qué" y el "Por Qué" (Objetivo de la Épica)

### 1.1. Propósito de Negocio y Ergonómico
Escalar los conceptos de diseño del **Dashboard V8** (Glassmorphism, Dark UI, macOS Window Controls, Menú Flotante, Rail Navigation por defecto) aplicándolos de forma absoluta e innegociable a **TODO el frontend** de La Pezcadería ERP.
Se erradican los contenedores planos y los layouts pegados a los bordes de la pantalla. Todo el sistema se estructura sobre lienzos oscuros atmosféricos (`#0B0F19`), superficies flotantes translúcidas (`rgba(15, 23, 42, 0.85)` / `backdrop-blur-2xl`), controles de ventana macOS semánticos (`#FF5F56`, `#FFBD2E`, `#27C93F`), y estados activos en bloque de color sólido de altísimo contraste en **Rojo Vibrante Code XR (`bg-red-600` / `#EF4444`)**.

---

## 2. Multi-Phase System Modeling (5 Diagramas Mermaid Obligatorios)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (Process Flowchart)
```mermaid
flowchart TD
    A[Inicio: Carga del Frontend ERP] --> B[Inicialización del Layout Shell V8]
    B --> C[Renderizado de Fondo Atmosférico: Canvas #0B0F19 con Mesh Gradients]
    C --> D[Montaje de Barra Lateral Flotante: Rail Mode w-20 por Defecto]
    D --> E[Montaje de Topbar Flotante con Glassmorphism y Controles macOS]
    E --> F[Inyección de Vista Activa en Main Canvas Flotante]
    F --> G{Interacción del Operador}
    G -->|Clic en Control Amarillo macOS o Ctrl+B| H[Expandir/Colapsar Sidebar: Transición Fluida w-20 <-> w-64]
    G -->|Clic en Ítem de Navegación| I[Activar Bloque Sólido Rojo Code XR bg-red-600 y Cargar Vista]
    G -->|Apertura de Modal o Dropdown| J[Desplegar Contenedor Flotante Centrado con Controles macOS y Backdrop Blur]
    G -->|Clic en Control Rojo macOS| K[Disparar Diálogo SweetAlert2 Dark Glass para Confirmar Salida]
    G -->|Clic en Control Verde macOS| L[Alternar Pantalla Completa Document RequestFullscreen]
    H --> G
    I --> G
    J --> G
    K --> G
    L --> G
```

---

### Diagrama 2: Lógica de Decisiones y Casos Límite (Decision Logic Diagram)
```mermaid
flowchart TD
    D1[Evaluación de Renderizado de Contenedor V8] --> D2{¿Tipo de Dispositivo o Viewport?}
    D2 -->|Viewport Móvil < 768px| D3{¿Preservar Margen Flotante?}
    D3 -->|Aprobado por Grill-Me| D4[Aplicar Margen 8-12px y rounded-2xl Flotante en Móvil 375px]
    D2 -->|Viewport Desktop >= 768px| D5[Aplicar Layout Flotante Completo top-3 bottom-3 left-3 rounded-3xl]
    
    D4 --> D6{¿Estado del Sidebar?}
    D5 --> D6
    D6 -->|Rail por Defecto| D7[Ancho w-20: Solo Iconos Centrados con Tooltip Hover]
    D6 -->|Expandido Manualmente| D8[Ancho w-64: Iconos, Textos de Categoría y Contadores Dinámicos]

    D7 --> D9{¿Estado de Selección del Ítem?}
    D8 --> D9
    D9 -->|Ítem Activo| D10[Aplicar bg-red-600 text-white font-bold shadow-lg shadow-red-600/30]
    D9 -->|Ítem Inactivo| D11[Aplicar text-slate-400 hover:text-white hover:bg-white/10]

    D10 --> D12{¿Contenedor con Controles macOS?}
    D11 --> D12
    D12 -->|Modal o Ventana Principal| D13[Habilitar Semántica Canónica: Rojo=Cerrar, Amarillo=Minimizar, Verde=Fullscreen]
    D12 -->|Tarjeta de Datos Secundario| D14[Habilitar Indicador de Estado y Microinteracción Táctil]
```

---

### Diagrama 3: Modelo Entidad-Relación de Tokens y Componentes (ERD)
```mermaid
erDiagram
    DESIGN_SYSTEM_V8 {
        string version PK
        string theme_name
        string base_canvas_bg
        string active_state_color
        float default_surface_alpha
        int default_blur_radius
    }

    SURFACE_TOKEN {
        string token_id PK
        string system_version FK
        string background_rgba
        string border_rgba
        string specular_box_shadow
        string border_radius
        boolean gpu_accelerated
    }

    COMPONENT_SHELL {
        string component_name PK
        string token_id FK
        string positioning_type
        int z_index
        string default_state
    }

    MACOS_CONTROL {
        string control_color PK
        string component_name FK
        string action_handler
        string hex_code
        int diameter_px
    }

    DESIGN_SYSTEM_V8 ||--|{ SURFACE_TOKEN : defines
    SURFACE_TOKEN ||--|{ COMPONENT_SHELL : applies_to
    COMPONENT_SHELL ||--|{ MACOS_CONTROL : integrates
```

---

### Diagrama 4: Secuencia de Interacción Global (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor Operador as Operador / Usuario
    participant Shell as Layout Shell V8 (Floating Canvas)
    participant Sidebar as EnterpriseSidebar (Rail Mode)
    participant Topbar as EnterpriseTopbar (Glassmorphism)
    participant Content as Main Content (Glass Card)
    participant Modal as Modal Flotante (macOS Header)

    Operador->>Shell: Carga inicial de la aplicación
    Shell->>Sidebar: Monta barra flotante (w-20 Rail)
    Shell->>Topbar: Monta barra superior flotante
    Shell->>Content: Inyecta vista activa con tarjetas Glassmorphism
    
    Operador->>Sidebar: Clic en botón amarillo macOS (Minimizar/Expandir)
    Sidebar-->>Operador: Transiciona a w-64 mostrando categorías y tarjeta de usuario
    
    Operador->>Sidebar: Clic en ítem "Punto de Venta (POS)"
    Sidebar->>Content: Despacha evento de cambio de vista (pos)
    Content-->>Operador: Renderiza pantalla POS en Dark Glassmorphism con active state bg-red-600
    
    Operador->>Content: Clic en "Abrir Modal de Arqueo de Caja"
    Content->>Modal: Despliega modal flotante con cabecera macOS y backdrop blur
    Operador->>Modal: Clic en control rojo macOS
    Modal-->>Operador: Cierra modal retornando foco al canvas principal
```

---

### Diagrama 5: Arquitectura de Componentes por Capas (Component Architecture)
```mermaid
graph TD
    subgraph Presentation_Layer [Capa de Presentación: Floating Glassmorphism]
        Canvas[AppCanvas: Fondo Atmosférico #0B0F19 + Radial Mesh Gradients]
        SidebarV8[EnterpriseSidebar: Panel Flotante w-20/w-64 rounded-3xl]
        TopbarV8[EnterpriseTopbar: Barra Superior Flotante rounded-2xl]
        MainView[MainContentArea: Tarjetas Glass Cards + Tablas V8]
        ModalsV8[GlobalModals: Ventanas Flotantes con Cabeceras macOS]
    end

    subgraph Atomic_Controls [Capa de Controles Atómicos Reutilizables]
        MacControls[MacWindowControls: Rojo #FF5F56, Amarillo #FFBD2E, Verde #27C93F]
        GlassCard[GlassCardContainer: Surface 85% + Blur 24px + Top Highlight]
        ActivePill[ActiveStatePill: Bloque Sólido bg-red-600 + Glow]
        OverlineTag[OverlineCategoryTag: Text 10px uppercase tracking-widest]
    end

    subgraph Logic_and_State [Capa de Lógica y Estado Global]
        RouteStore[AppRouteStore: Vista Activa y Navegación]
        UIStateStore[UIPreferencesStore: Estado Rail, Pantalla Completa, Modales]
        HarnessPipeline[Google Harness2: Verificación de Invariantes y CI Visual]
    end

    Canvas --> SidebarV8
    Canvas --> TopbarV8
    Canvas --> MainView
    Canvas --> ModalsV8

    SidebarV8 --> MacControls
    SidebarV8 --> ActivePill
    SidebarV8 --> OverlineTag
    TopbarV8 --> MacControls
    MainView --> GlassCard
    ModalsV8 --> MacControls
    ModalsV8 --> GlassCard

    SidebarV8 -.-> RouteStore
    SidebarV8 -.-> UIStateStore
    MainView -.-> RouteStore
    Presentation_Layer -.-> HarnessPipeline
```

---

## 3. Criterios de Aceptación Innegociables
1. **Glassmorphism Global:** 100% de los contenedores principales desacoplados de los bordes con `top-3 bottom-3 left-3` o `p-3/p-4`, esquinas `rounded-3xl` y superficies `bg-slate-900/85 backdrop-blur-2xl border-white/12`.
2. **Controles macOS:** Integrados en la barra lateral, cabecera superior y modales con acciones canónicas (Rojo=Cerrar, Amarillo=Minimizar, Verde=Fullscreen).
3. **Active State:** Bloque de color sólido rojo vibrante `bg-red-600` con texto e icono en blanco puro `text-white font-bold`.
4. **Validación DevTools:** Cero errores de consola JS y comprobación visual en móvil (375 px) y desktop (1440 px).
5. **Calidad de Código:** `tsc --noEmit` en 0 errores y 100% tests unitarios pasando.
