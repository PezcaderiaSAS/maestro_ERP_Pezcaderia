# Especificación Técnica: SPEC-048
## Reestructuración UI/UX Integral de Inventario & Bodega WMS (`InventoryView.tsx`)

- **Código:** SPEC-048
- **Fase:** Spec Kit SDD v3.0 — `/speckit.specify`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. El "Qué" y el "Por Qué"

### 1.1 Contexto del Negocio y Problema
El módulo actual de Inventario (`InventoryView.tsx`) concentra múltiples responsabilidades operativas (catálogo maestro, matriz de stock, recepción en muelle, rendimiento de despiece, transferencias y análisis ABC) en un diseño extenso que sufre de sobrecarga cognitiva (Ley de Miller) y dificultad de navegación rápida para operadores de planta y cuartos fríos.

### 1.2 Solución Propuesta (SPEC-048)
Transformar `InventoryView.tsx` en un **Centro de Control Operativo WMS** de nivel premium que implementa:
1. **Bento Grid de KPIs en Tiempo Real:** 4 tarjetas compactas de alta jerarquía visual que resumen:
   - Valor Total de Inventario en Bodegas (`font-mono text-2xl`).
   - Ocupación & Temperatura Promedio de Cuartos Fríos (°C).
   - Lotes en Riesgo FEFO (< 48 hrs / por vencer).
   - Eficiencia de Despiece & Pareto ABC (Clase A al 80/20).
2. **Barra de Pestañas Flotante (Floating Pills Header - Ley de Hick):**  
   Navegación fluida por pastillas táctiles ergonómicas ($\ge 44\text{px}$) agrupadas por dominios operativos:
   - `Pestaña 1`: Matriz de Stock & Catálogo Maestro (`StockMatrizTable` + `ProductTable`).
   - `Pestaña 2`: Cuartos Fríos & Control de Cámaras (`ColdRoomPreparation`).
   - `Pestaña 3`: Trazabilidad de Lotes & Caducidad FEFO.
   - `Pestaña 4`: Rendimiento de Despiece & Mermas (`FishYieldProductionTab`).
   - `Pestaña 5`: Análisis ABC Pareto 80/20 (`AnalisisAbcWidget`).
   - `Pestaña 6`: Recepción en Muelle & Traslados Internos (`DockReceivingTab` + `WarehouseTransferPanel`).
   - `Pestaña 7`: Kardex & Auditoría de Movimientos (`KardexTable`).
3. **Barra de Acciones Rápidas (Quick Actions Bar - Ley de Fitts):** Acceso instantáneo a creación de producto, recepción de muelle, traslado entre bodegas e importación masiva.
4. **Paleta Cromática Dark Glassmorphism 60-30-10:**
   - **60% Fondo:** `bg-[#0B0F19]` y tarjetas translúcidas `bg-[#131C2E]/60 backdrop-blur-xl`.
   - **30% Estructura:** Bordes sutiles `border-slate-800/85` y tipografías `text-slate-100` / `text-slate-400`.
   - **10% Acentos:** Cian `#00F2FE` (activo/entradas), Ámbar `#F59E0B` (FEFO advertencia), Crimson `#EF4444` (merma/crítico) y Esmeralda `#10B981` (Pareto Clase A).

---

## 2. Multi-Phase System Modeling (5 Diagramas Mermaid)

### 2.1 Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)

```mermaid
flowchart TD
    A([Operador accede a Inventario WMS]) --> B[Carga de Métricas en useInventoryStore]
    B --> C[Renderizado de Bento Grid KPIs de Stock]
    C --> D{Selección en Barra de Pills}
    D -->|Pill 1| E[Matriz de Stock por Bodega & Filtro ABC]
    D -->|Pill 2| F[Monitoreo de Cuartos Fríos & Cámaras]
    D -->|Pill 3| G[Inspección de Lotes Perecederos FEFO]
    D -->|Pill 4| H[Registro de Despiece & Cálculo de Merma]
    D -->|Pill 5| I[Clasificación Pareto 80/20]
    D -->|Pill 6| J[Recepción Muelle / Traslado Bodegas]
    D -->|Pill 7| K[Auditoría Histórica de Kardex]
    E --> L[Actualización Reactiva de Stock en Tiempo Real]
    F --> L
    G --> L
    H --> L
    J --> L
```

---

### 2.2 Rombos de Decisión y Lógica de Edge Cases (`2_decision_logic_diagrams`)

```mermaid
flowchart TD
    A([Operación de Entrada / Despiece / Traslado]) --> B{¿Lote tiene fecha de caducidad?}
    B -->|Sí| C[Calcular Horas Restantes FEFO]
    B -->|No| D[Asignar Lote Estándar FIFO]
    C --> E{¿Horas restantes < 48h?}
    E -->|Sí| F[Marcar Badge Alerta Crítica FEFO Rojo/Ámbar]
    E -->|No| G[Marcar Estado FEFO Normal Verde]
    F --> H{¿Operación es Despiece?}
    G --> H
    D --> H
    H -->|Sí| I[Calcular Merma: Peso Entrada - Filete - Subproductos]
    H -->|No| J[Actualizar Saldo Kardex Directo]
    I --> K{¿Merma > Umbral Permitido 35%?}
    K -->|Sí| L[Generar Alerta de Desviación de Rendimiento]
    K -->|No| M[Asentar Rendimiento Óptimo]
    L --> N([Confirmación en Base de Datos & Broadcast])
    M --> N
    J --> N
```

---

### 2.3 Modelo Entidad-Relación (`3_entity_relationship_diagrams`)

```mermaid
erDiagram
    PRODUCTO ||--o{ LOTE_FEFO : contiene
    PRODUCTO ||--o{ MOVIMIENTO_KARDEX : genera
    BODEGA ||--o{ CUARTO_FRIO : alberga
    BODEGA ||--o{ STOCK_MATRIZ : ubica
    CUARTO_FRIO ||--o{ LOTE_FEFO : almacena
    ORDEN_PRODUCCION_DESPIECE ||--o{ MERMA_DESPIECE : registra
    PRODUCTO ||--o{ ORDEN_PRODUCCION_DESPIECE : procesa

    PRODUCTO {
        string id PK
        string sku
        string nombre
        string categoria
        float costoPromedio
        float precioVenta
        string clasificacionAbc
        boolean activo
    }

    CUARTO_FRIO {
        string id PK
        string bodegaId FK
        string nombre
        float temperaturaActual
        float capacidadKg
        float ocupacionActualKg
        string estado
    }

    LOTE_FEFO {
        string id PK
        string productoId FK
        string cuartoFrioId FK
        string codigoLote
        float cantidadKg
        datetime fechaIngreso
        datetime fechaVencimiento
        string estadoFefo
    }

    MERMA_DESPIECE {
        string id PK
        string ordenId FK
        float pesoIngresadoKg
        float pesoAprovechableKg
        float pesoMermaKg
        float porcentajeMerma
        string supervisorId
    }
```

---

### 2.4 Diagrama de Secuencia Temporal (`4_sequence_diagrams`)

```mermaid
sequenceDiagram
    autonumber
    actor Operador as Operador WMS
    participant UI as InventoryView (7-Pills)
    participant Store as useInventoryStore
    participant WmsService as WarehouseService
    participant Realtime as SupabaseRealtimeService

    Operador->>UI: Clic en Pill 'Lotes FEFO' o 'Despiece'
    UI->>Store: obtenerLotesFefoYCuartosFrios(tenantId)
    Store->>WmsService: cargarEstadoWms(tenantId)
    WmsService-->>Store: Lotes, mermas y capacidades calculadas
    Store-->>UI: Estado actualizado en memoria reactiva
    UI->>Operador: Renderiza tabla ergonómica con badges FEFO y Bento KPIs

    Operador->>UI: Registra pesaje de despiece (Kilos Entrada vs Salida)
    UI->>Store: registrarMermaDespiece(datosDespiece)
    Store->>WmsService: persistirMovimientoStock(datos)
    WmsService-->>Store: Confirmación de salida e ingreso de derivados
    Store->>Realtime: broadcastPulse('STOCK_UPDATED')
    UI->>Operador: SweetAlert2 Toast Éxito + Alerta si merma excede 35%
```

---

### 2.5 Arquitectura por Capas (`5_component_architecture_diagrams`)

```mermaid
graph TD
    subgraph CapaPresentacion [1. Capa de Presentación UI/UX]
        A[InventoryView.tsx - Contenedor Principal]
        B[InventoryHeroHeader.tsx - Título & Selector de Bodega]
        C[InventoryBentoKpis.tsx - 4 Tarjetas de Métricas]
        D[InventoryQuickActionBar.tsx - Botones Ergonómicos Fitts]
        E[InventoryFloatingPills.tsx - Barra Flotante Sticky 7-Tabs]
        F[Vistas Hijas: StockMatriz, ColdRooms, FEFO, Mermas, ABC, Muelle, Kardex]
    end

    subgraph CapaLogica [2. Capa de Lógica & Estado]
        G[useInventoryStore - Gestión de Stock y Catálogo]
        H[useWarehouseStore - Bodegas y Cuartos Fríos]
        I[useMovementStore - Kardex y Mermas de Despiece]
        J[useScientificAnalytics - Pareto ABC 80/20 & Mermas]
    end

    subgraph CapaDatos [3. Capa de Acceso a Datos & Servicios]
        K[localDb / IndexedDB - Persistencia Offline-First]
        L[warehouseService - Supabase Postgres WMS]
        M[supabaseRealtimeService - Sincronización en Tiempo Real]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    G --> K
    H --> L
    I --> L
    H --> M
```

---

## 3. Scorecard de Cumplimiento de Leyes de UI

| Ley de UI | Aplicación Concreta en SPEC-048 |
| :--- | :--- |
| **Ley de Fitts** | Botones de acción rápida con altura mínima de $48\text{px}$, padding táctil amplio y botones principales anclados en zonas de fácil alcance visual. |
| **Ley de Hick** | Reducción de la carga cognitiva agrupando las 18 herramientas en **7 Pills principales** con íconos descriptivos y micro-conteos. |
| **Ley de Miller** | Cabecera ejecutiva limitada a exactamente **4 tarjetas Bento** (Stock, Frío, FEFO, Mermas) para no saturar la memoria de trabajo. |
| **Ley de Proximidad** | Agrupación visual de métricas de temperatura junto a la capacidad del cuarto frío, y porcentaje de merma junto a los kilos netos fileteados. |
| **Ley de Jakob** | Patrones de tablas de datos empresariales con cabeceras fijas (`sticky`), ordenamiento por columnas, badges semafóricos estándar y búsqueda instantánea. |
| **Contraste WCAG AAA** | Textos en `text-slate-100` sobre fondos `#0B0F19` y `#131C2E`, con ratio de contraste superior a $7:1$ y elementos interactivos en cian `#00F2FE` y esmeralda `#10B981`. |

---

## 4. Requerimientos de Calidad y Pruebas
1. **TDD:** Cobertura de pruebas unitarias $\ge 85\%$ en `src/tests/inventoryView7Tabs.test.tsx` y nuevas suites.
2. **TypeScript:** Cero errores en `tsc --noEmit` y cero uso de `any`.
3. **Bucle DevTools:** 0 errores/warnings en consola JS a 1280px y 375px móvil.
4. **Retrocompatibilidad:** Preservar la funcionalidad de las 7 pestañas existentes sin romper la persistencia de datos.

---

> [!IMPORTANT]
> **Check de Gobernanza SDD:** Por mandato constitucional, no se genera código hasta que el usuario apruebe esta especificación `/speckit.specify`.
