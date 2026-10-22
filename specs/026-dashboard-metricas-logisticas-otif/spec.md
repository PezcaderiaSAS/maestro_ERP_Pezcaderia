# Especificación de Requerimiento: SPEC-026

**Código:** SPEC-026  
**Título:** Dashboard de Métricas Logísticas y Tiempos de Entrega OTIF (On-Time In-Full) para Despachos B2B  
**Fase:** Spec Kit SDD v3.0 — `/speckit.specify`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Arquitectura Data-Driven.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 1)  

---

## 1. El "Por Qué" (Problema de Negocio y Justificación)

La Pezcadería S.A.S. despacha a diario productos del mar perecederos a hoteles, restaurantes, casinos y pescaderías aliadas (canal B2B / HORECA). La operación de despacho requiere dos condiciones críticas para evitar rechazos y pérdidas económicas:
1. **Puntualidad Crítica (On-Time):** Los restaurantes necesitan el pescado antes de su hora pico de cocina (almuerzo ~11:30 AM). Entregar con retraso causa cancelación del pedido o penalizaciones comerciales.
2. **Cumplimiento Íntegro (In-Full):** El cliente institucional exige recibir exactamente los kilos, calibres y referencias pactadas. Cualquier faltante o producto en mal estado rompe la cadena de valor y genera devoluciones a cuarentena.
3. **Preservación de Cadena de Frío:** Los productos frescos deben mantenerse entre $0^\circ\text{C}$ y $4^\circ\text{C}$, y los congelados a $\le -18^\circ\text{C}$. Una subida térmica en el vehículo compromete la inocuidad.

**Problema Actual:**
Aunque existen manifiestos de ruta y una app móvil para repartidores (`DriverPortalView`), la torre de control y la gerencia carecen de un panel ejecutivo centralizado que consolide en tiempo real:
- El indicador industrial **OTIF estricto** ($OTIF = On\text{-}Time \land In\text{-}Full$).
- El semáforo de tiempo de ciclo en ruta (tránsito, llegada y atención por parada).
- La auditoría de cadena de frío (temperatura de salida vs. temperatura registrada en entrega).
- La efectividad de recaudo en calle (Contado, Transferencia, Crédito B2B).
- El rendimiento comparativo de repartidores y rutas por zona geográfica.

---

## 2. El "Qué" (Alcance y Solución Propuesta)

Se construirá el **Dashboard Ejecutivo y Operativo de Métricas Logísticas OTIF B2B**, integrado en el ERP bajo la ruta de navegación dedicada y accesible en la vista de Despachos/Inventario:

1. **KPI Header Cards Semafóricos (Light Mode WCAG AA+):**
   - **Tasa Global OTIF (%):** Cumplimiento simultáneo de tiempo y completitud.
   - **Tasa On-Time (%):** Porcentaje de pedidos entregados dentro de la ventana SLA pactada.
   - **Tasa In-Full (%):** Porcentaje de pedidos entregados al 100% sin mermas ni devoluciones parciales.
   - **Cumplimiento Cadena de Frío (%):** Entregas con temperatura dentro del rango térmico permitido.
   - **Efectividad de Cobro en Calle (%):** Desglose total recaudado ($) vs. valor despachado.

2. **Panel de Filtros Analíticos Multidimensionales:**
   - Rango temporal: Hoy, Ayer, Últimos 7 Días, Mes en Curso, Personalizado.
   - Selector de Conductor / Repartidor activo.
   - Selector de Zona Logística (Bucaramanga Centro, Cabecera, Floridablanca, Girón, Piedecuesta, etc.).
   - Filtro semafórico de SLA: Todos, Cumple OTIF, Demorado, Incompleto / Devolución, Rechazado.

3. **Matriz de Rendimiento por Repartidor (Driver Scorecard):**
   - Nombre, vehículo, pedidos asignados, entregados, % OTIF individual, tiempo promedio de atención por cliente (min) y monto recaudado en calle.

4. **Monitor de Tiempos de Ciclo y Cadena de Frío (Timeline / Auditoría):**
   - Visualización de cada parada con semáforo térmico (azul $\le 4^\circ\text{C}$, ámbar $4.1^\circ\text{C} - 7^\circ\text{C}$, rojo $> 7^\circ\text{C}$).
   - Tiempo de tránsito en calle (bodega $\rightarrow$ cliente) y tiempo de descarga/atención en puerta.

5. **Exportador Corporativo Excel CSV (BOM UTF-8, delimitador `;`):**
   - Exportación nativa a un clic para auditorías de gerencia y análisis en Microsoft Excel.

6. **Diseño Ergonómico Táctil ("Regla del Niño de 12 Años"):**
   - Todo en Modo Claro (Light Mode) con contraste $\ge 4.5:1$ y $\ge 7:1$.
   - Controles interactivos con altura mínima $\ge 48\text{ px}$ y botones de acción principal $\ge 56\text{ px}$.
   - Cero imágenes bitmap externas (100% iconos Lucide React vectoriales a Costo $0$).

---

## 3. Mandatory Multi-Phase System Modeling (Mermaid.js)

### Diagrama 1: Flujo de Procesos (Process Flowchart)
```mermaid
flowchart TD
    A([Inicio: Pedidos Despachados en Manifiesto]) --> B[Repartidor ejecuta ruta en DriverPortalView]
    B --> C[Registro de Eventos: Salida, Llegada, Entrega y Cobro]
    C --> D[Captura de Temperatura y Firma Digital en Punto]
    D --> E{¿Cliente recibió completo?}
    E -- Sí --> F[Marcar IN-FULL = TRUE]
    E -- No (Rechazo / Devolución) --> G[Registrar Devolución en Cuarentena & IN-FULL = FALSE]
    F --> H{¿Entrega <= Ventana SLA?}
    G --> H
    H -- Sí --> I[Marcar ON-TIME = TRUE]
    H -- No --> J[Marcar ON-TIME = FALSE / DEMORADO]
    I --> K{¿ON-TIME && IN-FULL?}
    J --> L[Resultado OTIF = NO CUMPLE]
    K -- Sí --> M[Resultado OTIF = CUMPLE EXITOSO]
    K -- No --> L
    M --> N[Actualización del Motor de Métricas Logísticas]
    L --> N
    N --> O[Dashboard OTIF: KPIs en Vivo, Alertas y Exportación Excel]
```

---

### Diagrama 2: Rombos de Decisión y Lógica Condicional (Decision Logic Diagram)
```mermaid
flowchart TD
    subgraph Decision_OTIF ["Evaluación Determinista de OTIF"]
        P1{"¿Estado Entrega == ENTREGADO_TOTAL?"}
        P1 -- Sí --> P2{"¿Tiene Devoluciones o Faltantes?"}
        P1 -- No --> Fail_OTIF["OTIF = FALSE<br/>Causal: Pedido Incompleto o Cancelado"]
        
        P2 -- No --> InFull_True["IN_FULL = TRUE"]
        P2 -- Sí --> Fail_OTIF
        
        InFull_True --> P3{"¿Cumplimiento SLA?"}
        P3 -- "A_TIEMPO o ANTICIPADO" --> OnTime_True["ON_TIME = TRUE"]
        P3 -- "DEMORADO" --> Fail_OnTime["ON_TIME = FALSE<br/>Causal: Retraso en Ventana"]
        
        OnTime_True --> Pass_OTIF["OTIF = TRUE (100% Éxito)"]
        Fail_OnTime --> Fail_OTIF
    end

    subgraph Decision_ColdChain ["Evaluación de Cadena de Frío"]
        C1{"¿Tipo Producto?"}
        C1 -- Fresco --> C2{"¿Temperatura Entrega <= 4°C?"}
        C1 -- Congelado --> C3{"¿Temperatura Entrega <= -18°C?"}
        
        C2 -- Sí --> Cold_OK["Cadena Frío: CONFORME (Verde)"]
        C2 -- No, <= 7°C --> Cold_Warn["Cadena Frío: ALERTA TÉRMICA (Ámbar)"]
        C2 -- No, > 7°C --> Cold_Crit["Cadena Frío: CRÍTICO RUPTURA (Rojo)"]
        
        C3 -- Sí --> Cold_OK
        C3 -- No --> Cold_Crit
    end
```

---

### Diagrama 3: Modelo Entidad-Relación (Entity-Relationship Diagram)
```mermaid
erDiagram
    MANIFIESTO_RUTA ||--|{ PARADA_PEDIDO : contiene
    PARADA_PEDIDO ||--o{ DEVOLUCION_ITEM : genera
    PARADA_PEDIDO ||--o{ REGISTRO_TEMPERATURA : monitorea
    REPARTIDOR ||--o{ MANIFIESTO_RUTA : conduce
    CLIENTE_B2B ||--o{ PARADA_PEDIDO : recibe

    MANIFIESTO_RUTA {
        string id PK
        string numero_manifiesto UK
        string conductor_id FK
        string vehiculo_placa
        string zona_ruta
        timestamp salida_bodega
        timestamp retorno_bodega
        float temperatura_salida_celsius
        string estado_manifiesto
    }

    PARADA_PEDIDO {
        string id PK
        string manifiesto_id FK
        string pedido_id FK
        string cliente_id FK
        timestamp hora_llegada_puerta
        timestamp hora_entrega_efectiva
        int tiempo_transito_minutos
        int tiempo_atencion_minutos
        string cumplimiento_sla
        boolean on_time
        boolean in_full
        boolean otif_conforme
        string forma_pago
        float monto_cobrado
        string estado_entrega
        float temperatura_entrega_celsius
    }

    DEVOLUCION_ITEM {
        string id PK
        string parada_pedido_id FK
        string producto_id FK
        float cantidad_devuelta_kg
        string motivo_rechazo
        float monto_descontado
    }

    REGISTRO_TEMPERATURA {
        string id PK
        string parada_pedido_id FK
        float temperatura_celsius
        timestamp fecha_registro
        string estado_conformidad
    }

    REPARTIDOR {
        string id PK
        string nombre
        string documento
        string telefono
        boolean activo
    }

    CLIENTE_B2B {
        string id PK
        string razon_social
        string direccion
        string zona_geografica
        string jornada_preferente
    }
```

---

### Diagrama 4: Diagrama de Secuencia Temporal (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor JefeDespacho as Jefe de Despacho (Web)
    participant UI as OtifDashboardView
    participant Hook as useOtifMetrics
    participant Service as OtifAnalyticsService
    participant Store as DeliveryRouteStore
    participant Export as OtifCsvExporter

    JefeDespacho->>UI: Accede a /despachos/metricas-otif
    UI->>Hook: useOtifMetrics(filtros)
    Hook->>Service: calcularConsolidadoOtif(filtros)
    Service->>Store: obtenerManifiestosYParadas()
    Store-->>Service: Lista de Manifiestos con Paradas y Cobros
    Service->>Service: Computar Tasas OTIF, On-Time, In-Full, Frío y Recaudo
    Service-->>Hook: Objeto OtifMetricsConsolidated
    Hook-->>UI: Renderiza Tarjetas KPI, Gráficas y Tabla de Paradas
    JefeDespacho->>UI: Aplica Filtro (Zona: 'Cabecera', Conductor: 'Carlos')
    UI->>Hook: Recalcular con nuevos filtros
    Hook-->>UI: Vista actualizada en tiempo real (< 100ms)
    JefeDespacho->>UI: Clic en "Exportar Informe Gerencial CSV"
    UI->>Export: generarCsvOtif(registrosFiltrados)
    Export-->>JefeDespacho: Descarga de archivo .csv compatible con Excel
```

---

### Diagrama 5: Arquitectura de Componentes y Límites de Capas (Component Architecture)
```mermaid
flowchart TB
    subgraph Presentation_Layer ["Capa de Presentación (React 18 + Tailwind CSS)"]
        V[OtifDashboardView.tsx]
        C1[OtifKpiHeaderCards.tsx]
        C2[OtifFilterBar.tsx]
        C3[DriverPerformanceTable.tsx]
        C4[ColdChainAuditTimeline.tsx]
        C5[OtifAuditDetailTable.tsx]
    end

    subgraph Business_Logic_Layer ["Capa de Lógica de Negocio y Hooks"]
        H1[useOtifMetrics.ts]
        S1[otifAnalyticsService.ts]
        S2[deliveryRouteService.ts]
    end

    subgraph Data_Access_Layer ["Capa de Acceso a Datos y Persistencia"]
        Z1[deliveryRouteStore / LocalStorage]
        Z2[Supabase Client / Outbox Queue]
        EX[otifCsvExporter.ts]
    end

    V --> C1
    V --> C2
    V --> C3
    V --> C4
    V --> C5

    V --> H1
    H1 --> S1
    S1 --> S2
    S2 --> Z1
    S2 --> Z2
    V --> EX

    classDef ui fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef logic fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef data fill:#dcfce7,stroke:#16a34a,stroke-width:2px;

    class V,C1,C2,C3,C4,C5 ui;
    class H1,S1,S2 logic;
    class Z1,Z2,EX data;
```

---

## 4. Requisitos del Sistema y Criterios de Aceptación (EARS Notation)

### [REQ-OTIF-001] Cálculo Determinista de OTIF
* **Ubiquitous:** El sistema calculará el indicador OTIF para un pedido como `true` si y solo si `on_time == true` Y `in_full == true`.
* **Cálculo Global:** $\% OTIF = (\text{Entregas OTIF Conformes} / \text{Total Pedidos Entregados}) \times 100$.

### [REQ-OTIF-002] Monitoreo Térmico de Cadena de Frío
* **Event-Driven:** Cuando un repartidor registra una parada en `DriverPortalView`, el sistema registrará la temperatura en grados Celsius y la evaluará contra los límites de frescura ($\le 4^\circ\text{C}$ para frescos).
* **State-Driven:** Mientras la temperatura supere los $7^\circ\text{C}$, el panel mostrará un indicador visual de ALERTA CRÍTICA de cadena de frío.

### [REQ-OTIF-003] Rendimiento y Auditoría por Repartidor
* **Ubiquitous:** El sistema presentará para cada conductor el volumen de entregas, su porcentaje de puntualidad, tasa de devolución y tiempo promedio de descarga en el cliente.

### [REQ-OTIF-004] Filtros en Vivo sin Parpadeo
* **Event-Driven:** Cuando el usuario seleccione una fecha, conductor o zona geográfica, el panel recalculará las métricas instantáneamente en memoria sin recargar la página (< 100 ms).

### [REQ-OTIF-005] Ergonomía Táctil y Accesibilidad ("Regla del Niño de 12 Años")
* **Ubiquitous:** Todos los inputs, selectores y tarjetas interactivas tendrán un área de contacto mínima de $48\text{ px}$.
* **Ubiquitous:** El botón principal de exportación o refresco medirá al menos $56\text{ px}$ de altura.
* **Ubiquitous:** Todo el diseño operará en Modo Claro estricto con ratio de contraste WCAG AA+ ($\ge 4.5:1$ y $\ge 7:1$) sin imágenes externas tipo bitmap.

---

## 5. Checkpoint de Aprobación Humana

> **Directiva SDD v3.0:** La fase `/speckit.specify` concluye aquí. Queda formalmente prohibido escribir código de producción hasta recibir la aprobación expresa del usuario.
