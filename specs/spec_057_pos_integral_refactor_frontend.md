# Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS — La Pezcadería S.A.S. (SPEC-057)

**Fecha:** 2026-11-08  
**Versión:** 1.0.0 (SDD v3.0 / Spec Kit)  
**Autor:** Antigravity Architect & Agency Swarm (Co-ejecución Harness²)  
**Estado:** PROPUESTO — En espera de interrogatorio /grill-me y aprobación de usuario  

---

## 1. Visión y Objetivos del Documento

Proveer a la fábrica de software y agencias de desarrollo los lineamientos arquitectónicos deterministas, correcciones ergonómicas de interfaz (UI/UX), optimización de hardware periférico y lógicas financieras requeridas para llevar el Punto de Venta (POS) web a un estándar de grado industrial (60 FPS, operaciones sub-50ms, tolerancia a fallos offline y ergonomía táctil Fitts $\ge 48$px).

---

## 2. Modelado de Ingeniería del Sistema (5 Diagramas Mermaid Mandatorios)

### 2.1. Diagrama de Flujo de Procesos (`1_process_flowcharts`)
Ciclo de vida secuencial desde la captura de producto (escáner o balanza) hasta la emisión de comanda o cobro.

```mermaid
flowchart TD
    A["Inicio: Operador en Terminal POS"] --> B{"Entrada de Producto"}
    B -->|"Lector Código de Barras (Atajo Global)"| C["Búsqueda O(1) en Catálogo Indexado"]
    B -->|"Selección Táctil / Teclado (F8)"| D["Filtro Reactivo con Debounce 150ms"]
    B -->|"Producto a Granel (KG Balanza)"| E["Lectura Web Serial API / Manual"]
    
    C --> F["Agregar Línea a Zustand Cart Store"]
    D --> F
    E --> F
    
    F --> G{"¿Modificación de Precio o Descuento?"}
    G -->|"Precio Base Catálogo"| H["Recalcular Subtotal, IVA y Total (<10ms)"]
    G -->|"Edición de Precio Unitario"| I{"¿Supera Margen Mínimo permitido?"}
    G -->|"Descuento por Ítem / Global"| J{"¿Descuento > Umbral Autorizado?"}
    
    I -->|"Sí (Dentro de margen)"| H
    I -->|"No (Riesgo de Margen)"| K["Solicitar PIN Supervisor (SupervisorPinModal)"]
    J -->|"Dentro de rango"| H
    J -->|"Excede rango"| K
    
    K -->|"PIN Válido"| H
    K -->|"Cancelado / PIN Inválido"| L["Revertir a Precio/Descuento Anterior"]
    L --> H
    
    H --> M{"Acción Final Operativa"}
    M -->|"F6: Emitir Comanda Mostrador"| N["Guardar Preventa en Outbox/Supabase -> Cola Caja"]
    M -->|"F2: Cobro Directo en Terminal"| O["Abrir Drawer / Modal de Liquidación"]
    N --> P["Limpiar Carrito y Devolver Foco a Escáner"]
    O --> P
```

---

### 2.2. Diagrama de Lógica de Decisiones (`2_decision_logic_diagrams`)
Rombos de decisión `{...}` para el motor de precios dinámicos, descuentos y contingencia de conectividad.

```mermaid
flowchart TD
    D1{"Evento: Modificación de Precio Unitario"} --> D2{"¿Rol del usuario es Administrador?"}
    D2 -->|"Sí"| D3["Aplicar nuevo precio unitario directamente"]
    D2 -->|"No (Asesor Mostrador / Cajero)"| D4{"¿Precio Propuesto >= Costo Base * (1 + MargenMin)?"}
    
    D4 -->|"Sí"| D3
    D4 -->|"No"| D5{"¿PIN de Supervisor autenticado en sesión activa?"}
    D5 -->|"Sí (Token vigente)"| D3
    D5 -->|"No"| D6["Desplegar Modal PIN Supervisor (4 dígitos)"]
    D6 --> D7{"¿PIN verificado con éxito?"}
    D7 -->|"Aprobado"| D3
    D7 -->|"Rechazado"| D8["Restablecer Precio Lista y emitir Toast Alerta"]
    
    D3 --> D9{"¿Existe Descuento en Línea o Global?"}
    D9 -->|"Descuento Línea %"| D10["subtotalLinea = (precioUnitario * cant) * (1 - descPct/100)"]
    D9 -->|"Descuento Línea Valor"| D11["subtotalLinea = (precioUnitario * cant) - descMonto"]
    D9 -->|"Sin Descuento Línea"| D12["subtotalLinea = precioUnitario * cant"]
    
    D10 --> D13{"¿Existe Descuento Global Comanda?"}
    D11 --> D13
    D12 --> D13
    
    D13 -->|"Sí"| D14["totalFinal = SUM(subtotalLinea) * (1 - descGlobalPct/100)"]
    D13 -->|"No"| D15["totalFinal = SUM(subtotalLinea)"]
    
    D14 --> D16{"Estado de Conectividad de Red"}
    D15 --> D16
    D16 -->|"ONLINE"| D17["Persistir en Supabase Realtime + IndexedDB Cache"]
    D16 -->|"OFFLINE"| D18["Encolar en Dexie.js Outbox Queue con Marca Idempotente"]
```

---

### 2.3. Diagrama Entidad-Relación (`3_entity_relationship_diagrams`)
Estructura relacional de datos para comanda, líneas, descuentos, auditoría de precios y balance de balanza.

```mermaid
erDiagram
    TERMINAL_SESION ||--o{ COMANDA_VENTA : "emite"
    USUARIO_ASESOR ||--o{ COMANDA_VENTA : "atiende"
    CLIENTE ||--o{ COMANDA_VENTA : "asociado_a"
    COMANDA_VENTA ||--|{ LINEA_COMANDA : "contiene"
    PRODUCTO ||--o{ LINEA_COMANDA : "referencia"
    SUPERVISOR_AUTH ||--o{ AUDITORIA_PRECIO : "autoriza"
    LINEA_COMANDA ||--o| AUDITORIA_PRECIO : "registra_override"
    
    TERMINAL_SESION {
        string id PK
        string terminalCodigo
        string estadoConexion "ONLINE | OFFLINE"
        datetime fechaInicio
        string ipHost
    }

    USUARIO_ASESOR {
        string id PK
        string nombre
        string rol "VENDEDOR | CAJERO | ADMIN"
        string pinHash
    }

    COMANDA_VENTA {
        string id PK
        string alias "PRE-102"
        string terminalId FK
        string vendedorId FK
        string clienteId FK
        decimal subtotalBruto
        decimal descuentoGlobalMonto
        decimal descuentoGlobalPct
        decimal totalFinal
        string estado "PENDIENTE_PAGO | COBRADO | CANCELADO"
        string origenVenta "MOSTRADOR | BALANZA | RUTA"
        datetime createdAt
        datetime syncAt
    }

    LINEA_COMANDA {
        string id PK
        string comandaId FK
        string productoId FK
        decimal cantidad
        string unidadMedida "KG | UND | BANDEJA"
        decimal precioBaseCatalogo
        decimal precioUnitarioAplicado
        decimal descuentoLineaPct
        decimal descuentoLineaMonto
        decimal subtotalLinea
        boolean pesoCapturadoBalanza
        string notasCorte
    }

    AUDITORIA_PRECIO {
        string id PK
        string lineaComandaId FK
        string supervisorId FK
        decimal precioOriginal
        decimal precioModificado
        decimal margenResultantePct
        string motivoOverride
        datetime timestamp
    }
```

---

### 2.4. Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
Flujo de eventos interactivos para la captura automática de balanza y autorización de descuento.

```mermaid
sequenceDiagram
    autonumber
    actor Asesor as Asesor Mostrador
    participant UI as POSMultivendorView
    participant Serial as Web Serial API (Balanza)
    participant Store as Zustand (usePOSCartStore)
    participant Modal as SupervisorPinModal
    participant DB as Dexie.js / Outbox Cache

    Asesor->>UI: Coloca producto granel (Salmón) y presiona "Balanza"
    UI->>Serial: leerPeso(baudRate: 9600)
    alt Balanza Conectada (Respuesta < 3000ms)
        Serial-->>UI: Peso detectado = 2.450 kg
    else Timeout o Sin Puerto Serie
        Serial-->>UI: Error / Fallback Manual
        UI->>Asesor: Solicitar ingreso manual de peso (kg)
        Asesor-->>UI: Ingresa 2.450 kg
    end

    UI->>Store: addItem(producto, peso: 2.450)
    Store-->>UI: Carrito actualizado, subtotal recalculado (<10ms)

    Asesor->>UI: Edita precio unitario (Descuento agresivo por merma)
    UI->>Store: validatePriceOverride(productoId, nuevoPrecio)
    Store-->>UI: Margen inferior al 15% -> Requiere autorización
    UI->>Modal: open(accion: "OVERRIDE_PRECIO", margen: "8.5%")
    
    actor Supervisor as Supervisor de Turno
    Supervisor->>Modal: Ingresa PIN (4 dígitos)
    Modal->>Modal: Valida Hash PIN supervisor
    Modal-->>UI: Autorización Exitosa (Token firmado)
    
    UI->>Store: applyPriceOverride(lineaId, nuevoPrecio, supervisorId)
    Store->>DB: Registrar en outbox de auditoría
    Store-->>UI: UI re-renderizada a 60 FPS con total actualizado
    
    Asesor->>UI: Presiona F6 (Emitir Comanda)
    UI->>Store: emitirComandaPreventa()
    Store->>DB: Encolar Comanda en Dexie/IndexedDB
    Store-->>UI: Ticket generado, limpiar carrito para siguiente cliente
```

---

### 2.5. Diagrama de Arquitectura de Componentes (`5_component_architecture_diagrams`)
Estructura desacoplada en capas (Presentación, Estado Reactivo, Servicios y Hardware).

```mermaid
flowchart TD
    subgraph CapaPresentacion["1. Capa de Presentación (React 18 + Tailwind)"]
        H["POSMultivendorLightHeader (56px Barra Única)"]
        Cat["POSMultivendorCatalog (TanStack Virtual Grid 6x3)"]
        Cart["POSMultivendorCart (Flexbox Vertical Estricto 85% Alto)"]
        PinModal["SupervisorPinModal (Autenticación PIN)"]
        WeightModal["ManualWeightModal (Captura de Peso)"]
    end

    subgraph CapaEstado["2. Capa de Gestión de Estado Reactivo (Zustand L1)"]
        S1["usePOSCartStore (Ítems, Descuentos, Totales en <10ms)"]
        S2["useMultiVendorPosStore (Asesor Activo, Terminal, Sesión)"]
        S3["useNetworkStatusStore (Online / Offline Heartbeat)"]
    end

    subgraph CapaPerifericos["3. Capa de Integración Periféricos (Hardware Bridge)"]
        SerialAPI["useBalanza (Web Serial API & Parser Regex)"]
        Hotkeys["usePOSHotkeys (F1, F2, F4, F6, F7, F8, F9, Ctrl+K)"]
        BarcodeScanner["useBarcodeListener (Global Keydown Buffer)"]
    end

    subgraph CapaPersistencia["4. Capa de Persistencia & Resiliencia (Multi-Tier)"]
        L2["Dexie.js / IndexedDB (Catálogo Local & Outbox FIFO)"]
        L3["Supabase Realtime (Broadcast Comandas & Sync Cloud)"]
    end

    H --> S2
    H --> S3
    Cat --> S1
    Cart --> S1
    PinModal --> S1
    WeightModal --> SerialAPI

    BarcodeScanner --> S1
    SerialAPI --> S1
    Hotkeys --> H
    Hotkeys --> Cart

    S1 --> L2
    S1 --> L3
    S3 --> L2
```

---

## 3. Decisiones de Negocio y Arquitectura Acordadas (/grill-me)

Tras el interrogatorio interactivo (/grill-me), se establecieron las siguientes definiciones vinculantes:

1. **Validación Comercial y PIN de Supervisor:**
   - La edición de precio unitario o aplicación de descuentos se realiza sin fricción si está dentro del margen permitido.
   - **Disparo de PIN:** Se exige autenticación con PIN de 4 dígitos (mediante `SupervisorPinModal`) si el **Descuento > 10%** o si el **Precio Propuesto < Costo Base + 15%**.

2. **Pesaje de Productos a Granel (KG Balanza):**
   - Al escanear o seleccionar un producto granel, el sistema despliega inmediatamente el **teclado numérico táctil en pantalla** para digitación manual ultrarrápida del peso en kilogramos, evitando bloqueos por peticiones automáticas de Web Serial API.

3. **Catálogo y Virtualización de Rendimiento:**
   - Se mantiene la paginación ergonómica de **18 tarjetas (6×3)** con la botonera inferior `< Anterior 1 2 3 ... Siguiente >`, virtualizando el conjunto de datos en memoria para garantizar transiciones de filtrado y cambio de categoría por debajo de **16ms (60 FPS)**.

4. **Interacción en Línea del Carrito de Ventas:**
   - Cada fila del carrito presenta **inputs numéricos editables continuos tanto para Cantidad como para Precio Unitario**, permitiendo alternar entre ellos fluidamente mediante la tecla <kbd>Tab</kbd> para velocidad operativa sin mouse.
   - Botón micro `[+ Desc]` en la fila para asignar descuento específico por ítem.

5. **Motor de Descuento Global de Comanda:**
   - Botón anclado **`+ Descuento (F4)`** en el bloque de totales que abre un popover reactivo para alternar entre Porcentaje (%) o Valor Monetario ($), recalculando el Total a Pagar en **menos de 10ms** en el store de Zustand.

---

## 4. Plan de Acción y Desglose por Fases de Desarrollo

### Fase 1: Ergonomía Crítica del Carrito y Control de Textos (UI/UX)
1. **Estructura Flexbox Vertical Estricta:**
   - Contenedor con `h-full min-h-0 flex flex-col`.
   - Área de ítems con `flex-1 min-h-0 overflow-y-auto` que garantiza el 85% del espacio visual útil.
   - Bloque inferior anclado (`shrink-0 mt-auto bg-white border-t border-slate-200`) con Subtotal, Descuentos, Total y Botones de Acción (<kbd>F6</kbd> y <kbd>F2</kbd>).
2. **Text Overflow y Truncamiento Seguro:**
   - Tarjetas de producto y filas del carrito con `line-clamp-2` y `min-w-0` en todos los contenedores flexibles.
   - Tooltips accesibles en hover / long-press para inspección de especificaciones y notas de corte.

### Fase 2: Motor Financiero de Precios Dinámicos y Descuentos Jerárquicos
1. **Edición Dinámica de Precios en Línea:**
   - Input táctil interactivo en la celda de precio unitario del carrito.
   - Detección de desviación de margen ($< 15\%$ sobre costo base).
   - Integración con `SupervisorPinModal` para autorización instantánea con PIN de 4 dígitos.
2. **Descuento por Ítem y Descuento Global:**
   - Selector porcentual (%) o monetario ($) en cada línea del carrito.
   - Botón de descuento global de comanda en el resumen de totales.
   - Recálculo reactivo garantizado en $< 10$ms en Zustand.

### Fase 3: Rendimiento y Virtualización de Catálogo
1. **Integración con TanStack Virtual (`@tanstack/react-virtual`):**
   - Renderizado en viewport de las 18 tarjetas activas de la grilla 6×3 sin saturación del DOM al manejar más de 1,000 SKUs.
2. **Indicadores de Stock y Agotados:**
   - Opacidad reducida (`opacity-60`), badge de advertencia ("AGOTADO") e inhabilitación de clic si el stock es 0 (salvo configuración expresa de preventa en negativo).

### Fase 4: Integración Periférica (Balanza Digital y Atajos de Teclado)
1. **Lector de Código de Barras Global:**
   - Interceptor de buffer de teclado en window para capturar pistolas escáner USB sin requerir foco en el input.
2. **Web Serial API para Balanza Electrónica:**
   - Conexión serial directa (9600 baudios) mediante `useBalanza.ts`. Captura automática de peso en productos tipo `KG`.
3. **Mapeo Estricto de Atajos de Teclado:**
   - <kbd>F8</kbd>: Enfocar buscador de catálogo.
   - <kbd>Ctrl+K</kbd>: Búsqueda rápida multi-criterio.
   - <kbd>F6</kbd>: Emitir Preventa / Comanda de Mostrador.
   - <kbd>F2</kbd>: Cobro Directo en Terminal (Apertura de Drawer).
   - <kbd>F9</kbd>: Alternar a Modo Caja Única (Cola en Vivo).
   - <kbd>Esc</kbd>: Cerrar modales o limpiar selección.

### Fase 5: Persistencia Offline-First y Resiliencia (Dexie.js)
1. **IndexedDB Local Storage:**
   - Caché local de catálogo y clientes para respuesta $< 2$ms.
   - Outbox transaccional FIFO para encolar comandas emitidas sin red y sincronización automática idempotente al recuperar conexión.
