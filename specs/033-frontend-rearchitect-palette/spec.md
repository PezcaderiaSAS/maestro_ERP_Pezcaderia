# Especificación de Requerimiento: SPEC-033 — Reestructuración Integral del Frontend (Erradicación de Franjas Grises y Normalización Visual V8)

**Fase:** /speckit.specify (SDD v3.0)  
**Ticket:** FRONTEND-PALETTE-REARCHITECT-V8  
**Fecha:** 2026-10-26  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA  
**Política de Gobernanza:** Cero Código antes de Plan y Especificación Aprobados | Kanban WIP = 1  

---

## 1. Declaración del Problema & Propósito

### 1.1 El Problema ("Por Qué")
La evaluación especializada en vivo (mediante Chrome DevTools, extracción de DOM computado y el enjambre de arquitectura Agency Swarm + Google Harness²) confirmó la causa exacta de la insatisfacción visual manifestada por el usuario:
1. **Franjas Grises Rígidas y Disonantes (`rgb(229, 231, 235)`):**
   Múltiples contenedores, barras de control, inputs y tablas arrastran clases utilitarias heredadas de Tailwind pensadas para Light Mode (`border-slate-200`, `border-gray-200`, `divide-slate-200`, `bg-slate-100`, `bg-white`). Al renderizarse sobre el lienzo oscuro, estas clases generan bordes y franjas grises opacas de alto contraste que cortan la fluidez visual de la aplicación.
2. **Parches Cromáticos Amarillentos y Desentonados:**
   Banners de alerta o badges de estado aplican fondos claros (`bg-amber-50`, `rgb(255, 251, 235)`) con bordes amarillos opacos que parecen fallas de renderizado en lugar de componentes intencionales.
3. **Falta de Jerarquía Lumínica y Profundidad:**
   La convivencia de `bg-slate-900`, `bg-slate-800` y `bg-slate-950` genera un collage de grises sucios sin iluminación cenital ni profundidad óptica coherente.

### 1.2 La Solución ("Qué")
Reestructurar integralmente el frontend del ERP mediante:
1. **Lienzo Abisal Profundo:** Migrar el canvas base a `#070A10` / `#0B0F17` (negro azulado de ultra-baja luminancia), eliminando cualquier fondo gris plano.
2. **Erradicación Absoluta de Bordes Opacos:** Sustituir todo borde o franja gris por micro-membranas translúcidas (`border-white/10` y `border-white/12`) con specular highlight superior (`inset 0 1px 0 0 rgba(255, 255, 255, 0.12)`).
3. **Normalización Cromática de Marca (Rico UI Brands / Linear):**
   - **Superficies:** `bg-slate-900/85 backdrop-blur-2xl`.
   - **Primario / Acción:** Índigo Linear saturado (`#5E6AD2` / `bg-indigo-600 hover:bg-indigo-500`).
   - **Acento Oceánico:** Cian Neón (`#06B6D4` / `text-cyan-400 border-cyan-500/30`).
   - **Éxito / Valores Financieros:** Verde Esmeralda vibrante (`#10B981` / `text-emerald-400 font-mono`).
   - **Advertencias / Alertas:** Fondo ámbar oscuro translúcido (`bg-amber-500/10 border-amber-500/30 text-amber-300`).
4. **Preservación Incondicional de Lógica Operativa:** 0 cambios en Zustand stores, servicios, IndexedDB offline, redondeo COP sin decimales y suites de pruebas existentes.

---

## 2. Multi-Phase System Modeling (5 Diagramas Obligatorios Mermaid.js)

### Diagrama 1: Flujo de Procesos de Normalización de Tokens (`1_process_flowcharts`)
```mermaid
flowchart TD
    A[Inicio: Evaluación de Componentes UI] --> B{¿Contiene clases de franja gris?}
    B -- Sí: border-slate-200 / bg-white / bg-slate-100 --> C[Purgar clases utilitarias de Light Mode]
    B -- No --> D{¿Utiliza GlassCard V8?}
    C --> E[Inyectar Tokens Rico UI / Linear V8]
    D -- No --> F[Encapsular en GlassCard con specular highlight]
    D -- Sí --> G[Auditar consistencia de bordes y opacidades]
    E --> H[Aplicar elevación translúcida bg-slate-900/85]
    F --> H
    G --> H
    H --> I[Verificar micro-bordes border-white/10 y brillo cenital]
    I --> J[Validar contraste WCAG 2.2 AAA >= 7:1]
    J --> K[Fin: Renderizado de Superficie Pura sin Franjas Grises]
```

### Diagrama 2: Lógica de Decisión para Superficies y Estados (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    Start([Elemento Visual a Renderizar]) --> TypeCheck{Tipo de Elemento}
    
    TypeCheck -- Contenedor / Panel --> ContDecision{¿Es nivel raíz o flotante?}
    ContDecision -- Raíz de Página --> R1[Canvas Abisal #070A10 + Mesh Gradient]
    ContDecision -- Panel / Card --> R2[GlassCard: bg-slate-900/85 + border-white/12 + translateZ]
    
    TypeCheck -- Borde / Separador --> BorderDecision{¿Separador horizontal o marco?}
    BorderDecision -- Marco de Tarjeta --> B1[border-white/10 con specular highlight superior]
    BorderDecision -- Divisor de Lista --> B2[divide-white/5 o h-px bg-white/10]
    
    TypeCheck -- Alerta / Notificación --> AlertDecision{Estado del Sistema}
    AlertDecision -- Error Crítico --> A1[bg-rose-500/10 border-rose-500/30 text-rose-300]
    AlertDecision -- Advertencia Caja --> A2[bg-amber-500/10 border-amber-500/30 text-amber-300]
    AlertDecision -- Éxito / Sincronizado --> A3[bg-emerald-500/10 border-emerald-500/30 text-emerald-300]
    
    TypeCheck -- Acción Interactiva --> BtnDecision{Jerarquía del Botón}
    BtnDecision -- Primario Gigante --> BT1[bg-emerald-600 hover:bg-emerald-500 text-white min-h-56px]
    BtnDecision -- Secundario / Chip --> BT2[bg-slate-800/80 border-white/10 text-slate-200 min-h-48px]
    BtnDecision -- Control macOS --> BT3[MacWindowControls: #FF5F56, #FFBD2E, #27C93F]
```

### Diagrama 3: Modelo Entidad-Relación de Tokens Visuales (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    CANVAS_BASE ||--o{ GLASS_SURFACE : contiene
    GLASS_SURFACE ||--o{ ACCENT_TOKEN : utiliza
    GLASS_SURFACE ||--o{ TYPOGRAPHY_SCALE : aplica
    GLASS_SURFACE ||--o{ BORDER_SPECULAR : delimita

    CANVAS_BASE {
        string hex_code "#070A10"
        string hsl_value "hsl(222, 47%, 4%)"
        string mesh_gradients "radial-cyan-indigo"
    }

    GLASS_SURFACE {
        string background "bg-slate-900/85"
        string backdrop_filter "backdrop-blur-2xl"
        string border "border-white/12"
        string gpu_acceleration "translateZ(0)"
    }

    BORDER_SPECULAR {
        string top_highlight "inset 0 1px 0 0 rgba(255,255,255,0.15)"
        string divider_subtle "border-white/5"
        string hover_glow "0 0 25px rgba(6,182,212,0.15)"
    }

    ACCENT_TOKEN {
        string marine_indigo "#5E6AD2"
        string cyan_wave "#06B6D4"
        string emerald_finance "#10B981"
        string amber_caution "#F59E0B"
        string rose_danger "#EF4444"
    }

    TYPOGRAPHY_SCALE {
        string font_sans "Inter"
        string font_mono "JetBrains Mono"
        string contrast_ratio ">= 7:1 (WCAG AAA)"
    }
```

### Diagrama 4: Secuencia de Carga y Resolución Cromática (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    autonumber
    actor User as Cajero / Vendedor
    participant Browser as Chrome DevTools
    participant Root as App.tsx (Lienzo Abisal)
    participant Shell as POSView.tsx (Layout Flotante)
    participant Card as GlassCard.tsx (Superficie V8)
    participant Subviews as ProductSearch / CartPanel

    User->>Browser: Navega a / (POS)
    Browser->>Root: Carga lienzo base (#070A10)
    Root->>Shell: Inicializa layout flotante desacoplado
    Shell->>Card: Renderiza KPIs de Turno & Barra de Acciones
    Note over Card: Aplica bg-slate-900/85 + border-white/12<br/>(CERO bordes grises rgb(229,231,235))
    Shell->>Subviews: Despliega Catálogo y Carrito
    Subviews->>Card: Renderiza tarjetas de producto y filas de carrito
    Note over Subviews: Aplica hover:bg-white/5 + botones táctiles >= 48px
    Card-->>Browser: Frame computado con aceleración GPU translateZ(0)
    Browser-->>User: Vista inmersiva cristalina de alto contraste
```

### Diagrama 5: Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)
```mermaid
graph TD
    subgraph Capa_1_Lienzo_Base ["Capa 1: Lienzo Abisal (#070A10)"]
        Canvas[App.tsx Canvas + Mesh Gradients]
    end

    subgraph Capa_2_Contenedores_Maestros ["Capa 2: Contenedores Maestros Glassmorphism"]
        Sidebar[EnterpriseSidebar.tsx: Rail w-20 / Expandido]
        Topbar[EnterpriseTopbar.tsx: Header Flotante]
        POSShell[POSView.tsx: Shell Flotante Desacoplado]
    end

    subgraph Capa_3_Superficies_Atomicas ["Capa 3: Superficies Atómicas de Cristal (GlassCard)"]
        KPIBar[data-testid='pos-kpi-bar': 4 Tarjetas de Métrica]
        CatalogCard[data-testid='pos-catalog-glass-card']
        CartGlass[data-testid='cart-glass-panel']
        PaymentGlass[data-testid='payment-glass-panel']
    end

    subgraph Capa_4_Micro_Componentes ["Capa 4: Micro-Componentes Ergonómicos Táctiles"]
        MacCtrls[MacWindowControls: Rojo, Amarillo, Verde]
        TouchBills[Chips Billetes COP >= 48px]
        TouchKeypad[Keypad Numérico >= 56px]
        BigPayBtn[Botón Gigante COBRAR >= 56px]
    end

    Canvas --> Sidebar
    Canvas --> Topbar
    Canvas --> POSShell
    POSShell --> KPIBar
    POSShell --> CatalogCard
    POSShell --> CartGlass
    POSShell --> PaymentGlass
    CartGlass --> MacCtrls
    PaymentGlass --> TouchBills
    PaymentGlass --> TouchKeypad
    PaymentGlass --> BigPayBtn

    classDef canvas fill:#070A10,stroke:#5E6AD2,stroke-width:2px,color:#fff;
    classDef master fill:#0B0F17,stroke:#06B6D4,stroke-width:2px,color:#fff;
    classDef atomic fill:#111827,stroke:#10B981,stroke-width:2px,color:#fff;
    classDef micro fill:#1E293B,stroke:#F59E0B,stroke-width:2px,color:#fff;

    class Canvas canvas;
    class Sidebar,Topbar,POSShell master;
    class KPIBar,CatalogCard,CartGlass,PaymentGlass atomic;
    class MacCtrls,TouchBills,TouchKeypad,BigPayBtn micro;
```

---

## 3. Criterios de Aceptación (Definición de Terminado)
1. **0 Bordes Grises Opacos:** Ningún elemento del layout debe calcular `rgb(229, 231, 235)` ni clases `border-gray-200`/`border-slate-200` sobre fondos oscuros.
2. **0 Parches Claros en Alertas:** Banners y badges deben usar fondos oscuros translúcidos con acentos de color (`bg-amber-500/10 text-amber-300`, `bg-rose-500/10 text-rose-300`).
3. **Consistencia Cromática Rico UI / Linear:** Fondos de tarjeta unificados en `bg-slate-900/85 backdrop-blur-2xl border-white/12` con specular highlight superior.
4. **Ergonomía Táctil Intacta:** Botones $\ge 48\text{ px}$ y $\ge 56\text{ px}$, 0 etiquetas `<img>` (vectores puros), tipografía monoespaciada en totales COP.
5. **Quality Gate:** `tsc --noEmit` en 0 errores, 100% tests unitarios/regresión en verde, y bucle Chrome DevTools certificado en 1440 px y 375 px.

---

> [!IMPORTANT]
> **Check de Gobernanza SDD v3.0:**  
> Esta especificación técnica base se presenta formalmente al usuario con los 5 diagramas de ingeniería. **No se generará ninguna línea de código hasta contar con la aprobación explícita de este documento.**
