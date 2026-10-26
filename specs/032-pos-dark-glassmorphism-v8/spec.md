# Especificación de Requerimiento: /speckit.specify (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.specify (SDD v3.0)  
**Ticket:** POS-DARK-GLASSMORPHISM-V8  
**Título:** Migración del Módulo POS (Punto de Venta y Facturación) al Estándar Dark Glassmorphism V8  
**Emisor:** Tech Lead & Software Architect (Agency Swarm + Google Harness²)  
**Receptores:** Implementadores Frontend, Especialistas UI/UX, QA & Automation Engineers  
**Prioridad:** Alta (Core Operativo de Facturación de Mostrador)  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-26  

---

## 1. El "Qué" y el "Por Qué"

### 1.1. Contexto y Justificación Operativa
Tras la culminación exitosa de la transformación del shell global del ERP bajo el estándar **Dark Glassmorphism V8** (SPEC-031), el canvas principal del sistema reside en un lienzo atmosférico oscuro (`#0B0F19`), con topbar flotante desacoplada y menú lateral en Rail Mode. 

Sin embargo, el módulo crítico de Punto de Venta (`POSView.tsx`) y sus submódulos (`CartPanel.tsx`, `PaymentPanel.tsx`, Keypad táctil, selector de báscula) utilizaban anteriormente contenedores de fondo plano claro o bordes rectos pegados a las márgenes, generando una disonancia visual y privando al cajero de la aceleración por hardware en GPU (`translateZ(0)`), el desenfoque gaussiano de alta fidelidad (`backdrop-blur-2xl`) y los controles de ventana estilo escritorio macOS (`#FF5F56`, `#FFBD2E`, `#27C93F`).

### 1.2. Alcance del Requerimiento
1. **Contenedor Principal `POSView`:** Reestructurar la vista en un ecosistema de paneles flotantes independientes `GlassCard` montados sobre el canvas `#0B0F19`.
2. **Panel de Búsqueda y Catálogo de Mostrador (`ProductSearchPanel` / Grid):** Encapsular la búsqueda y chips de categorías rápidas en paneles translúcidos con reflejo especular (`inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`), manteniendo áreas táctiles $\ge 48\text{ px}$.
3. **Panel de Carrito y Líneas de Venta (`CartPanel`):** Integrar `GlassCard` con controles macOS semánticos (minimizar/expandir panel, badge dinámico de cantidad de ítems, tabla fluida con filas en `hover:bg-white/5` y tipografía financiera monoespaciada).
4. **Panel de Liquidación y Medios de Cobro (`PaymentPanel`):** Transformar el cuadrante de cobro, selector de método (Efectivo, Tarjeta, Transferencia, Crédito), botones de denominaciones rápidas COP ($10k, $20k, $50k, $100k) y botón gigante de cobro ($\ge 56\text{ px}$) al estándar V8.
5. **Keypad Numérico Táctil y Báscula:** Diseñar teclas táctiles de vidrio oscuro con estados activos de micro-animación física (`active:scale-95`), alto contraste WCAG AAA ($> 12:1$) y retorno automático de foco.
6. **Invariantes Funcionales Intactas:** 0 regresiones en `usePOSCart`, almacenamiento offline en IndexedDB / `localDb`, cálculos de redondeo COP a enteros, emisión de tirilla térmica 40 columnas y sincronización DIAN/Siigo.

---

## 2. Multi-Phase System Modeling (5 Diagramas Mermaid de Ingeniería)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (Process Flowchart)
```mermaid
flowchart TD
    A[Inicio: Navegación a Ruta POS /pos] --> B[Inicialización del Layout Shell V8 con Fondo #0B0F19]
    B --> C[Montaje de Paneles Flotantes GlassCard: Catálogo, Carrito y Cobro]
    C --> D[Carga de Estado Local: Turno de Caja, Consecutivos y Carrito Activo]
    D --> E[Auto-Foco en Buscador #pos-product-search-input]
    
    E --> F{Interacción del Cajero}
    F -->|Lectura Código de Barras o Búsqueda| G[Filtrado Instantáneo en Catálogo Glass]
    F -->|Pesaje en Balanza de Mostrador| H[Apertura de Modal Táctil de Pesaje V8]
    F -->|Modificación de Cantidad en Carrito| I[Actualización Reactiva de Totales y Subtotales]
    F -->|Presionar Tecla Rápida o Botón COBRAR >= 56px| J[Apertura de PaymentPanel Flotante]
    
    G --> K[Agregar Producto a Carrito con Animación Suave]
    H --> K
    I --> E
    K --> E
    
    J --> L{Selección de Medio de Pago}
    L -->|Efectivo| M[Keypad Numérico V8 o Chips Billetes COP]
    L -->|Tarjeta / Datafono| N[Confirmar Voucher / Código Transacción]
    L -->|Transferencia Bancaria| O[Confirmar Comprobante Digital]
    
    M --> P[Cálculo Automático de Cambio / Vuelto]
    N --> Q[Liquidación de Venta]
    O --> Q
    P --> Q
    
    Q --> R[Generación de Tirilla Térmica y Persistencia en LocalDb]
    R --> S[SweetAlert2 Dark Glass: Confirmación de Venta Exitosa]
    S --> T[Retorno Inmediato de Foco a Buscador #pos-product-search-input]
    T --> E
```

---

### Diagrama 2: Lógica de Decisiones y Casos Límite (Decision Logic Diagram)
```mermaid
flowchart TD
    D1[Evento de Renderizado o Interacción en POS V8] --> D2{¿Tipo de Viewport / Dispositivo?}
    D2 -->|Viewport Desktop >= 1024px| D3[Layout Split-Screen 2 Columnas con GlassCards Flotantes]
    D2 -->|Viewport Tablet / Laptop 768px - 1023px| D4[Layout Adaptativo con Carrito Colapsable en Drawer Glass]
    D2 -->|Viewport Móvil <= 767px / 375px| D5[Layout Vertical Unificado con Tabs de Navegación Rápida]

    D3 --> D6{¿Estado de Apertura de Caja?}
    D4 --> D6
    D5 --> D6
    
    D6 -->|Caja Cerrada| D7[Bloquear Venta y Desplegar AperturaCajaModal en GlassCard]
    D6 -->|Caja Abierta| D8{¿Existen Borradores en Espera?}
    
    D8 -->|Sí| D9[Mostrar Badge Ámbar en Botón de Espera con Contador]
    D8 -->|No| D10[Badge Neutro en Botón de Espera]
    
    D9 --> D11{¿Acción en Carrito?}
    D10 --> D11
    
    D11 -->|Ítem Pesable sin Peso| D12[Disparar Pesaje Asistido / Keypad Manual Obligatorio]
    D11 -->|Ítem Estándar Unidad| D13[Incrementar Cantidad Directa]
    
    D12 --> D14{¿Monto Recibido < Total a Pagar?}
    D13 --> D14
    
    D14 -->|Sí| D15[Deshabilitar Botón Liquidar y Mostrar Alerta en Rojo Code XR]
    D14 -->|No| D16[Habilitar Botón Verde Esmeralda con Cálculo de Cambio]
```

---

### Diagrama 3: Modelo Entidad-Relación y Persistencia (ERD)
```mermaid
erDiagram
    POS_SESSION ||--o{ POS_SALE : registers
    POS_SALE ||--|{ POS_SALE_ITEM : contains
    POS_SALE ||--o| POS_PAYMENT : settles
    POS_SALE ||--o| DIAN_ELECTRONIC_INVOICE : generates
    PRODUCT ||--o{ POS_SALE_ITEM : references
    
    POS_SESSION {
        string id PK "UUID sesión de caja"
        string cajeroId FK "Usuario autenticado"
        datetime fechaApertura "Timestamp apertura"
        number baseInicialCop "Monto base en efectivo"
        string estado "ABIERTA | CERRADA"
        string sucursalId "Sede operativa"
    }

    POS_SALE {
        string id PK "UUID de venta"
        string consecutivo "CTL-00123 / Factura"
        string sessionId FK "ID sesión de turno"
        string clienteId FK "Consumidor final o NIT"
        number subtotalCop "Subtotal antes de impuestos"
        number ivaCop "Total IVA calculado"
        number totalCop "Total liquidado en COP entero"
        string estado "COMPLETADA | BORRADOR | ANULADA"
        datetime timestamp "Fecha y hora exacta"
    }

    POS_SALE_ITEM {
        string id PK "UUID línea de venta"
        string saleId FK "Venta asociada"
        string productId FK "Producto vendido"
        string sku "Código de producto"
        string nombre "Descripción del producto"
        number cantidad "Unidades o Kilogramos"
        number precioUnitarioCop "Precio pactado / tarifa"
        number subtotalCop "Cantidad x Precio"
        string modalidad "UNIDAD | PESABLE"
    }

    POS_PAYMENT {
        string id PK "UUID del pago"
        string saleId FK "Venta asociada"
        string metodo "EFECTIVO | TARJETA | TRANSFERENCIA | CREDITO"
        number montoRecibidoCop "Monto entregado por cliente"
        number cambioDevueltoCop "Vuelto entregado"
        string referenciaVoucher "Código voucher o transacción"
    }

    DIAN_ELECTRONIC_INVOICE {
        string id PK "UUID factura electrónica"
        string saleId FK "Venta asociada"
        string cufe "Código Único de Factura Electrónica"
        string qrData "Cadena para código QR"
        string estado "PENDIENTE_ENVIO | ENVIADA | RECHAZADA"
    }
```

---

### Diagrama 4: Diagrama de Secuencia Temporal (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor Cajero
    participant UI as POSView (GlassCard V8)
    participant Cart as usePOSCart
    participant Balanza as useBalanza Service
    participant Pay as PaymentPanel (V8 Glass)
    participant DB as localDb / IndexedDB
    participant Print as TicketBuilder (Tirilla)

    Cajero->>UI: Ingresa código o busca producto marítimo
    UI->>Cart: addItem(product, cantidad)
    alt Producto Pesable
        Cart->>Balanza: Solicitar lectura de peso
        Balanza-->>Cart: Retorna peso estable (ej. 2.450 kg)
    end
    Cart-->>UI: Actualiza estado reactivo de líneas y totales
    UI->>UI: Refresca CartPanel en GlassCard con Specular Highlight

    Cajero->>UI: Clic en Botón COBRAR (>= 56px) o Atajo F12
    UI->>Pay: Abre PaymentPanel modal en GlassCard
    Cajero->>Pay: Selecciona EFECTIVO y digita $50.000 con Keypad V8
    Pay->>Pay: Calcula cambio automático ($50.000 - $34.500 = $15.500)
    
    Cajero->>Pay: Clic en Liquidar Transacción
    Pay->>DB: Persistir venta y registrar egreso en arqueo de caja
    DB-->>Pay: Venta persistida con ID local y consecutivo
    
    Pay->>Print: Renderizar tirilla 40 columnas y enviar a impresora
    Print-->>UI: Impresión finalizada / Simulación OK
    Pay-->>UI: Cierra modal de pago
    UI->>UI: Limpia carrito y retorna foco a #pos-product-search-input
    UI-->>Cajero: Muestra SweetAlert2 Dark Glass de éxito
```

---

### Diagrama 5: Arquitectura de Componentes y Límites de Capas (Component Architecture)
```mermaid
flowchart TD
    subgraph CapaPresentacion [1. Capa de Presentación: Dark Glassmorphism V8]
        PV[POSView.tsx - Orquestador Principal]
        GC[GlassCard.tsx - Contenedor Atómico Flotante]
        MC[MacWindowControls.tsx - Semántica de Ventana]
        CP[CartPanel.tsx - Carrito y Líneas de Venta]
        PP[PaymentPanel.tsx - Pasarela de Cobro y Denominaciones]
        KP[TactileKeypad.tsx - Teclado Táctil >= 56px]
        PSP[ProductSearchPanel.tsx - Catálogo y Chips de Categoría]
    end

    subgraph CapaLogica [2. Capa de Lógica de Negocio y Hooks]
        UPC[usePOSCart.ts - Carrito Reactivo]
        UB[useBalanza.ts - Interfaz de Báscula Serial/WebUSB]
        UCS[useCashStore.ts - Estado de Sesión y Turno]
        UDS[posDraftService.ts - Gestión de Carritos en Espera]
        URS[useResolucionStore.ts - Control DIAN/Siigo]
    end

    subgraph CapaAccesoDatos [3. Capa de Persistencia y Hardware]
        LDB[localDb.ts - IndexedDB / LocalStorage Cache]
        SUP[Supabase Client - Sincronización Remota]
        PRN[Web Thermal Printer / EscPOS - Impresión de Tickets]
        OUT[Outbox Queue - Cola Resiliente Offline]
    end

    PV --> GC
    GC --> MC
    PV --> PSP
    PV --> CP
    PV --> PP
    PP --> KP

    PV --> UPC
    PV --> UB
    PV --> UCS
    PV --> UDS
    PV --> URS

    UPC --> LDB
    UCS --> LDB
    UDS --> LDB
    PV --> PRN
    LDB --> OUT
    OUT --> SUP
```

---

## 3. Criterios de Aceptación Innegociables (DoD)
1. **Estándar Visual V8:** El 100% de los contenedores de `POSView`, `CartPanel` y `PaymentPanel` deben utilizar `GlassCard` con `bg-slate-900/85`, `backdrop-blur-2xl`, borde `border-white/12` y aceleración `translateZ(0)`.
2. **Controles macOS Semánticos:** Cabeceras con botones de ventana funcionales (`#FF5F56` cerrar/salir con SweetAlert2, `#FFBD2E` colapsar/minimizar, `#27C93F` alternar fullscreen).
3. **Ergonomía Táctil del Niño de 12 Años:** Botones de acción principal $\ge 52\text{ px}$, teclas numéricas $\ge 56\text{ px}$, chips de categoría $\ge 48\text{ px}$, y retorno inmediato de foco a `#pos-product-search-input`.
4. **Cero Regresiones de Negocio:** 100% de la suite de pruebas unitarias y de integración de POS pasando en verde (122/122 archivos de test, 0 errores `tsc --noEmit`).
5. **Calidad de Código y SOLID:** Respeto estricto a las capas de arquitectura, sin lógica pesada dentro de JSX y separación limpia de subcomponentes.

---

**NOTA:** Esta especificación se entrega formalmente para la revisión y aprobación explícita del usuario antes de proceder a la siguiente fase (`/speckit.clarify`).
