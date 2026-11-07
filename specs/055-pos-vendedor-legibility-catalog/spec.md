# SPEC-055: Rediseño de Legibilidad, Contraste y Ergonomía Visual de la Pantalla del Vendedor POS

## 1. Contexto y Problema Crítico (Auditoría UX Vendedor)

A partir de la auditoría en vivo y la captura real de pantalla proporcionada por el usuario (`media_1794055452358_c2992842.jpg`), se detectó un fallo crítico de legibilidad y contraste en la pantalla del vendedor (catálogo de productos del POS):

1. **Nombre del Producto Invisible (Blackout Text):**
   - En `src/index.css` (línea 846), la regla `.product-card-name { color: #0f172a !important; }` impone color pizarra oscuro (`#0f172a`) con `!important`.
   - Dado que el POS opera bajo estética Dark Glassmorphism abisal (`--card-bg: rgba(17, 24, 39, 0.85)` / `bg-slate-900/80`), el texto del nombre del producto tiene un ratio de contraste de **1.05:1** contra el fondo. Esto viola gravemente WCAG 2.2 AA (mínimo 4.5:1) y AAA (mínimo 7:1), haciendo que los nombres de los productos sean 100% invisibles para el ojo humano.

2. **Cajas Blancas Estridentes (Deslumbramiento Visual):**
   - En `src/index.css` (línea 810), `.product-image-container` impone `background-color: #F1F5F9;` (blanco/gris claro).
   - En `ProductAvatar.tsx`, los avatares vectoriales utilizan fondos claros de tono pastel (`bg-emerald-50`, `bg-orange-50`, `bg-sky-50`).
   - El resultado visual en pantalla es una cuadrícula de 12 tarjetas donde la mitad superior es un rectángulo blanco deslumbrante con un ícono diminuto y la mitad inferior es un bloque oscuro donde el texto no se puede leer, dando la impresión de tarjetas vacías y rotas.

3. **Etiqueta de Precio y Semáforo de Stock:**
   - `.product-card-price-tag` en `src/index.css` tiene `background-color: #0f172a !important;`, camuflándose con la superficie de la tarjeta.
   - El precio unitario y el stock total requieren jerarquía tipográfica inmediata: el vendedor en mostrador necesita ver a golpe de vista (menos de 200 ms) el nombre completo del producto, el precio actual (`$XX.XXX / kg` o `/ und`) y la disponibilidad inmediata.

4. **Ergonomía de Tarjeta de Producto (Target Táctil Fitts):**
   - Dimensiones equilibradas con altura mínima $\ge 110\text{px}$ y padding adecuado para evitar solapamientos y permitir visualización clara tanto en monitores desktop (1280px–1920px) como en tablets táctiles de mostrador (1024px) y móviles (375px).

---

## 2. Requerimientos de la Especificación (Notación EARS)

### [EARS-U01] Legibilidad Tipográfica y Contraste WCAG AAA en Nombres de Producto
- **Cuando** el catálogo de productos sea renderizado en la vista del vendedor POS,
- **el sistema deberá** mostrar el nombre del producto (`.product-card-name`) con color blanco luminoso (`#FFFFFF` o `text-white` / `text-slate-100`) con un ratio de contraste mínimo de **12:1** sobre el fondo de la tarjeta, anulando la regla `#0f172a !important`.

### [EARS-U02] Armonización Visual Dark Glassmorphism de Contenedor de Imagen y Avatar
- **Cuando** se renderice el contenedor visual del producto (`.product-image-container` y `ProductAvatar`),
- **el sistema deberá** utilizar fondos armónicos abisales (`bg-slate-950/60` o `bg-slate-900/60` con micro-bordes translúcidos `border-white/10`), eliminando el fondo blanco `#F1F5F9` que deslumbraba al cajero/vendedor, manteniendo compatibilidad con las clases de prueba de `ProductAvatar`.

### [EARS-U03] Jerarquía Visual del Precio y Unidad de Venta
- **Cuando** se visualice el precio en la tarjeta,
- **el sistema deberá** renderizar el precio con tipografía numérica tabular destacada en esmeralda/blanco (`text-emerald-400 font-black text-sm sm:text-base`) acompañado de la unidad de medida (`/ kg` en cyan `#38BDF8` o `/ und` en esmeralda `#34D399`) con badge distintivo.

### [EARS-U04] Semáforo de Stock y Miller Chunking
- **Cuando** se consulte el stock en la tarjeta,
- **el sistema deberá** mostrar de forma concisa y legible el Stock Total consolidado con indicador cromático (Verde: disponible, Amarillo: en buffer de seguridad, Rojo: agotado), permitiendo desplegar bodegas bajo demanda sin saturar la tarjeta.

### [EARS-U05] Cero Regresiones y Preservación de Suites de Pruebas
- **Mientras** se ejecuten las suites de tests unitarios y de integración (`posAndCash12YearsRule.test.tsx`, `frontendAbyssalThemeV8.test.tsx`, `m2POSMultivendor.test.tsx`, `productAvatarComponent.test.tsx`),
- **el sistema deberá** mantener el 100% de los tests en verde (0 fallos) y cero errores TypeScript (`tsc --noEmit`).

---

## 3. Mandatory Multi-Phase System Modeling (5 Diagramas Mermaid.js)

### Diagrama 1: Process Flowchart (Flujo de Proceso de Selección y Catálogo)
```mermaid
flowchart TD
    A["Vendedor abre POS (Mostrador)"] --> B["Carga de Catálogo de Productos"]
    B --> C["Filtro por Categoría / Búsqueda Texto / Scan Barcode"]
    C --> D["Renderizado de Tarjetas de Producto"]
    D --> E["¿Tarjeta Legible Dark Glassmorphism?"]
    E -->|Nombre Blanco + Precio Verde + Avatar Nítido| F["Identificación Instantánea < 200ms"]
    F --> G["Clic / Tap en Tarjeta"]
    G --> H{"¿Vendido por Peso (KG)?"}
    H -->|Sí (Balanza)| I["Apertura Modal Peso / Lectura Serial Balanza"]
    H -->|No (Unidad)| J["Incremento Directo en Carrito"]
    I --> K["Línea Agregada a Carrito de Ventas"]
    J --> K
    K --> L["Actualización Subtotal e Ítems en Tiempo Real"]
```

### Diagrama 2: Decision Logic Diagram (Lógica de Decisión de Renderizado de Tarjeta)
```mermaid
flowchart TD
    Start["Evaluar Producto para Renderizado en Grid"] --> CheckStock{"¿Stock Total > 0?"}
    CheckStock -->|No y Ocultar Agotados Activo| Hide["Ocultar del Grid"]
    CheckStock -->|No y Ver Agotados Activo| DisabledCard["Renderizar con Opacidad 50% + Grayscale"]
    CheckStock -->|Sí| ActiveCard["Renderizar Tarjeta Interactiva Activa"]
    
    ActiveCard --> EvalUnit{"Unidad de Medida"}
    EvalUnit -->|KG / KILOS| BadgeKg["Badge ⚖️ KILOS (Azul Sky)"]
    EvalUnit -->|UND / PIEZA| BadgeUnd["Badge 📦 UNIDAD (Verde Esmeralda)"]
    
    ActiveCard --> EvalAvatar{"Tipo de Avatar"}
    EvalAvatar -->|vectorOnly=true| RenderLucide["Renderizar Ícono Lucide Vectorial con Tint Abisal"]
    EvalAvatar -->|URL / WebP Propia| RenderImg["Renderizar Img con Fallback Resiliente"]
    
    ActiveCard --> EvalTextTheme{"Tema y Contraste de Texto"}
    EvalTextTheme --> ApplyContrast["Nombre: text-white / font-bold / line-clamp-1<br/>Precio: text-emerald-400 / font-black<br/>Stock: color dinámico según buffer"]
```

### Diagrama 3: Entity-Relationship Diagram (ERD del Catálogo POS)
```mermaid
erDiagram
    PRODUCTO ||--o{ STOCK_BODEGA : "reside_en"
    PRODUCTO ||--o{ LINEA_VENTA : "se_agrega_a"
    CLIENTE ||--o{ PRECIO_ESPECIAL : "tiene_acuerdo"
    PRODUCTO ||--o{ PRECIO_ESPECIAL : "aplica_a"
    VENTA_POS ||--|{ LINEA_VENTA : "contiene"
    ASESOR_MOSTRADOR ||--o{ VENTA_POS : "atiende"

    PRODUCTO {
        string id PK
        string sku UK
        string nombre
        string categoria
        string unidadMedida
        float precioVenta
        float buffer_seguridad
        string imagen
        boolean activo
    }

    STOCK_BODEGA {
        string id PK
        string productoSku FK
        string bodegaNombre
        float cantidadDisponible
    }

    LINEA_VENTA {
        string id PK
        string ventaId FK
        string productoId FK
        float cantidad
        float precioUnitario
        float subtotal
    }
```

### Diagrama 4: Sequence Diagram (Secuencia Temporal de Renderizado e Interacción)
```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Vendedor (Mostrador)
    participant POSView as POSView.tsx
    participant Panel as ProductSearchPanel.tsx
    participant Avatar as ProductAvatar.tsx
    participant CSS as index.css (Dark Tokens)
    participant Store as usePosStore / useInventoryStore

    Vendedor->>POSView: Ingresa al módulo POS
    POSView->>Store: Obtiene activeProducts y stock
    POSView->>Panel: Renderiza ProductSearchPanel(activeProducts, stock)
    loop Por cada producto visible
        Panel->>Avatar: Renderiza ProductAvatar(nombre, categoria, vectorOnly=true)
        Avatar->>CSS: Consulta variables de fondo y contraste
        CSS-->>Avatar: Retorna fondo translúcido abisal (sin caja blanca)
        Panel->>CSS: Aplica .product-card-name y .product-card-price-tag
        CSS-->>Panel: Aplica text-white (12:1 contraste) y acento esmeralda
    end
    Panel-->>Vendedor: Despliega catálogo de alta legibilidad
    Vendedor->>Panel: Clic en "Salmón Noruego Fresco"
    Panel->>POSView: onAddProduct(prod)
    POSView->>Store: agregarProducto(prod)
    Store-->>POSView: Carrito actualizado
```

### Diagrama 5: Component Architecture Diagram (Arquitectura de Componentes por Capas)
```mermaid
flowchart TD
    subgraph UI_Layer["Capa de Presentación UI (Vendedor POS)"]
        A["POSView.tsx"] --> B["pos-catalog-glass-card"]
        B --> C["ProductSearchPanel.tsx"]
        C --> D1["Barra de Búsqueda y Filtros F8"]
        C --> D2["Barra de Categorías Desplazable"]
        C --> D3["Grid de Productos (pos-products-grid)"]
        D3 --> E1["Card (GlassCard / Glass-Panel)"]
        E1 --> F1["product-image-container (Abisal Translúcido)"]
        F1 --> G1["ProductAvatar.tsx (Lucide SVG sin Deslumbramiento)"]
        F1 --> G2["Modalidad Badge (KILOS / UNIDAD)"]
        F1 --> G3["Semáforo Stock Dot"]
        E1 --> F2["product-info-panel"]
        F2 --> H1["product-card-name (text-white WCAG AAA)"]
        F2 --> H2["product-card-price-tag (Esmeralda Luminoso)"]
        F2 --> H3["Stock Total Consolidado (Miller Chunking)"]
    end

    subgraph Design_Tokens["Capa de Tokens de Diseño (Rico UI / Stitch / Dark Glassmorphism)"]
        I1["src/index.css"]
        I1 --> J1[".product-card-name: text-white, no #0f172a override"]
        I1 --> J2[".product-image-container: bg-slate-950/60, no #F1F5F9"]
        I1 --> J3[".product-card-price-tag: high-contrast emerald & white"]
    end

    subgraph State_Layer["Capa de Estado y Dominio"]
        K1["useInventoryStore"]
        K2["usePosStore"]
        K3["supabaseRealtimePreventasService"]
    end

    UI_Layer --> Design_Tokens
    UI_Layer --> State_Layer
```

