# SPEC-038: Optimización Ergonómica y Leyes de UX en Frontend para Pantallas de Laptop (1366×768 / 1080p)

## 1. Requerimientos en Notación EARS (Easy Approach to Requirements Syntax)

- **[UBIQUITOUS]** El sistema **SIEMPRE DEBE** proveer interfaces conformes con el Estándar Dark Glassmorphism V8 (`bg-[#070A10]`, bordes `border-white/10`, texto accesible WCAG 2.2 AA ratio $\ge 4.5:1$).
- **[STATE-DRIVEN]** Mientras una vista pertenezca al conjunto de vistas transaccionales fijas (`TRANSACTIONAL_FIXED_VIEWS`: `pos`, `order-kanban`, `dashboard`, `cash-flow`, `alistamiento`), el contenedor principal de la aplicación **DEBE** aplicar altura rígida `h-[calc(100vh-theme(spacing.12)-theme(spacing.3))]` con `overflow-hidden`, evitando que la ventana del navegador genere scroll vertical global.
- **[STATE-DRIVEN]** Mientras una vista pertenezca al conjunto de vistas administrativas o de reportes largos (`clients`, `suppliers`, `payroll`, `accounting`, `crm`), el contenedor principal **DEBE** permitir scroll vertical fluido (`overflow-y-auto`).
- **[EVENT-DRIVEN]** Cuando la resolución del viewport sea inferior o igual a 1366×768 px, los paddings envolventes del contenedor de contenido **DEBEN** fijarse en `px-2.5 pb-2 pt-0` para maximizar el área de datos útil.
- **[UBIQUITOUS]** Todos los elementos interactivos primarios y secundarios **DEBEN** tener un área táctil/cliqueable mínima de $36 \times 36\text{px}$ conforme a la Ley de Fitts.

---

## 2. Multi-Phase System Modeling (5 Diagramas Obligatorios Mermaid.js)

### Diagrama 1: Process Flowcharts (Flujo de Decisión de Layout por Vista)
```mermaid
graph TD
    Start([Usuario Navega a Vista ERP]) --> CheckType{¿Es Vista Transaccional?}
    CheckType -- Sí: POS / Kanban / Dashboard / Caja --> SetFixed[Aplicar Layout Híbrido Fijo: 100vh & overflow-hidden]
    CheckType -- No: Reportes / Clientes / Nómina --> SetFluid[Aplicar Layout Scrollable: overflow-y-auto]
    SetFixed --> RenderInternalPanels[Renderizar Subpaneles con Scroll Interno Encapsulado]
    SetFluid --> RenderFluidPage[Renderizar Flujo Documental Completo]
    RenderInternalPanels --> ErgonomicViewport[Viewport 1366x768 sin scroll de ventana exterior]
    RenderFluidPage --> ScrollableReport[Página con scroll convencional]
```

### Diagrama 2: Decision Logic Diagrams (Lógica de Contenedor y Densidad)
```mermaid
flowchart TD
    Init[Cálculo de Viewport Activo] --> ViewportCheck{"¿Resolución < 1536px (Laptop)?"}
    ViewportCheck -- Sí --> SetCompactPadding["px-2.5 pb-2 pt-0 | Topbar mt-1.5 mb-1"]
    ViewportCheck -- No --> SetComfortPadding["px-4 pb-4 pt-1 | Topbar mt-2 mb-2"]
    SetCompactPadding --> TransCheck{"¿Pertenece a TRANSACTIONAL_FIXED_VIEWS?"}
    SetComfortPadding --> TransCheck
    TransCheck -- Sí --> LockMainScroll["Contenedor main: h-calc overflow-hidden flex flex-col"]
    TransCheck -- No --> UnlockMainScroll["Contenedor main: min-h-screen overflow-y-auto"]
```

### Diagrama 3: Entity Relationship Diagrams (Configuración de Layout y Vistas)
```mermaid
erDiagram
    ERP_VIEW_REGISTRY ||--o{ VIEW_METADATA : contains
    VIEW_METADATA {
        string viewKey PK
        string title
        string category
        boolean isTransactionalFixed
        string defaultDock
    }
    VIEW_METADATA ||--o{ VIEW_CONSTRAINTS : enforces
    VIEW_CONSTRAINTS {
        int minHitTargetPx
        string overflowBehavior
        string contrastStandard
    }
```

### Diagrama 4: Sequence Diagrams (Ciclo de Renderizado del Shell Híbrido)
```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Sidebar as EnterpriseSidebar
    participant App as App.tsx (Root Shell)
    participant Layout as EnterpriseLayout
    participant View as ActiveViewComponent

    Usuario->>Sidebar: Clic en Icono (ej. POS o Dashboard)
    Sidebar->>App: setView('pos')
    App->>App: Evaluar TRANSACTIONAL_FIXED_VIEWS.includes('pos')
    Note over App: Determina: isFixed = true
    App->>Layout: Renderizar <main className="overflow-hidden h-calc flex flex-col">
    Layout->>View: Montar <POSView />
    View->>View: Inicializar 2 columnas (Catálogo / Carrito Dock)
    View-->>Usuario: Despliegue en 1366x768 sin scroll de ventana
```

### Diagrama 5: Component Architecture Diagrams (Arquitectura por Capas)
```mermaid
graph BT
    subgraph PresentationLayer["Capa de Presentación"]
        TopbarComp["EnterpriseTopbar (48px fijo)"]
        SidebarComp["EnterpriseSidebar (64px rail)"]
        MainContainer["Main Content Container (Híbrido)"]
        ActiveView["ActiveView (POS / Kanban / Dashboard)"]
    end

    subgraph LogicLayer["Capa de Lógica y Control"]
        ViewRegistry["TRANSACTIONAL_FIXED_VIEWS Registry"]
        ViewportController["Laptop Ergonomics Controller"]
        ThemeTokens["Dark Glassmorphism V8 Design Tokens"]
    end

    subgraph DataStoreLayer["Capa de Estado y Persistencia"]
        AppStore["useAppStore (currentView)"]
        PosStore["useMultiVendorPosStore"]
        KanbanStore["useCashierKanbanStore"]
    end

    TopbarComp --> MainContainer
    SidebarComp --> MainContainer
    MainContainer --> ActiveView
    ActiveView --> ViewRegistry
    ViewRegistry --> AppStore
    ActiveView --> PosStore
    ActiveView --> KanbanStore
```
