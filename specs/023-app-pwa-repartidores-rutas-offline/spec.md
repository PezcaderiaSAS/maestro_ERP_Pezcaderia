# SPEC-023: App PWA Móvil para Repartidores y Conductores (Rutas B2B, Entrega en Terreno, Firma Digital Táctil y Sincronización Offline)

**Código:** SPEC-023  
**Estado:** PROPUESTA (Fase 1: `/speckit.specify`)  
**Fecha:** 2026-10-19  
**Autor:** Antigravity AI & Equipo de Arquitectura La Pezcadería ERP  
**Gobernanza:** Spec Kit SDD v3.0 • Flujo Continuo Kanban (WIP = 1) • Regla del Niño de 12 Años • Master Architect SOLID • Bucle Chrome DevTools MCP  

---

## 1. Problema de Negocio y Justificación ("Por Qué")

En la distribución de pescados y mariscos perecederos a hoteles, restaurantes y distribuidores institucionales (B2B):
1. **Pérdida de Señal Móvil en Rutas:** Los repartidores descargan mercancía en sótanos de centros comerciales, cámaras frigoríficas de muelles y zonas costeras con nula conectividad celular. Una app que requiera conexión permanente bloquea la entrega y paraliza la flota.
2. **Disputas de Entrega y Fricción Legal:** Entregas sin firma digital ni captura de nombre/cédula generan reclamaciones de facturas ("yo no recibí ese pedido"). Se requiere acta de entrega digital con firma táctil en pantalla y georreferenciación.
3. **Pérdida de Cadena de Frío en Tránsito:** La inocuidad sanitaria exige registrar la temperatura del furgón o cava isotérmica al momento exacto de la descarga en el local del cliente.
4. **Devoluciones Parciales Descontroladas:** Cuando el cliente rechaza piezas por calibre o daño físico, el conductor no cuenta con un mecanismo para ajustar la remisión, causando descuadres en inventario y cartera.
5. **Ergonomía en Terreno ("Regla del Niño de 12 Años"):** El repartidor opera con guantes, humedad y luz solar directa. Los botones deben ser gigantes ($\ge 48\text{ px}$ y $\ge 56\text{ px}$), contrastes WCAG 2.2 AA+, cero imágenes pesadas y llamadas telefónicas/GPS a 1 toque.

---

## 2. Definición del Requerimiento en Notación EARS ("Qué")

### RN-PWA-01: Autenticación Rápida en Terreno (Ubiquitous & Event-Driven)
- El sistema **DEBERÁ** permitir el ingreso del conductor mediante selección táctil de su nombre de conductor registrado en `useDriverStore` y un PIN numérico de 4 dígitos, sin requerir contraseñas complejas.

### RN-PWA-02: Hoja de Ruta Secuencial del Día (State-Driven)
- **MIENTRAS** el conductor tenga un manifiesto de ruta activo asignado (`EN_RUTA`), la PWA **DEBERÁ** mostrar la lista ordenada de paradas con estados visuales unívocos:
  - `PENDIENTE` (Gris / Azul)
  - `EN_CAMINO` (Ámbar con botón Waze / Google Maps)
  - `ENTREGADO_TOTAL` (Verde Esmeralda)
  - `ENTREGADO_PARCIAL` (Amarillo Mostaza con detalle de devolución)
  - `NO_ENTREGADO_RECHAZADO` (Rojo con causal registrada)

### RN-PWA-03: Monitoreo Térmico HACCP en Descarga (Unwanted Behavior)
- **CUANDO** el conductor inicie la descarga en el local del cliente, la PWA **DEBERÁ** solicitar la temperatura de cava medida (°C).
- **SI** la temperatura es $> 7.0^\circ\text{C}$, el sistema **DEBERÁ** emitir una alerta crítica sanitaria tricolor en el componente semáforo, exigiendo confirmación del cliente o autorización de supervisor antes de liberar la mercancía.

### RN-PWA-04: Firma Táctil Digital en Pantalla (Event-Driven)
- **CUANDO** el cliente reciba el pedido, la PWA **DEBERÁ** desplegar un lienzo Canvas táctil (`SignaturePad`) de alta sensibilidad para firma con el dedo, capturando nombre completo y número de cédula del receptor.

### RN-PWA-05: Ajuste de Novedades y Devolución Parcial (Optional)
- **DONDE** el cliente rechace items o kilos por calibre, presentación o merma, el sistema **DEBERÁ** permitir registrar la cantidad rechazada y el motivo técnico, reingresando automáticamente el lote devuelto a inventario en estado `CUARENTENA_CALIDAD`.

### RN-PWA-06: Recaudo Contraentrega en Terreno (Event-Driven)
- **CUANDO** el pedido tenga condición de pago de contado o contraentrega, la PWA **DEBERÁ** registrar el monto recaudado en efectivo o el comprobante de transferencia digital, recalculando el saldo en tiempo real si hubo devolución parcial.

### RN-PWA-07: Resiliencia Offline-First Total (State-Driven)
- **MIENTRAS** el dispositivo no tenga conexión a internet, la PWA **DEBERÁ** operar de manera transparente guardando las entregas, firmas en Base64, temperaturas y novedades en la cola local IndexedDB (`caja_outbox_v2` / `entregas_outbox`).
- **CUANDO** el `NetworkHeartbeat` detecte restauración de conectividad (cada 15s), el worker en segundo plano **DEBERÁ** sincronizar automáticamente los registros pendientes con el backend sin intervención del usuario ni duplicidad de registros (idempotencia determinista).

---

## 3. MANDATORIO: Multi-Phase System Modeling (Mermaid.js)

### Diagrama 1: Flujo de Procesos y Ciclo de Vida de la Entrega (Process Flowchart)

```mermaid
flowchart TD
    A([Inicio: Chofer abre PWA Móvil]) --> B[Selección de Conductor & PIN 4 Dígitos]
    B --> C[Descarga Manifiesto Activo del Día en LocalDB]
    C --> D[Visualización de Hoja de Ruta: Paradas Ordenadas]
    D --> E[Selección de Próxima Parada B2B]
    E --> F[Botón 1-Toque: Llamar Cliente / Abrir Waze o Maps]
    F --> G[Llegada al Destino: Medición Temperatura Furgón]
    G --> H[Verificación Física de Canastillas & Lotes FEFO]
    H --> I{¿Entrega Conforme?}
    I -- Sí, Completa --> J[Registro Firma Táctil + Cédula Receptor]
    I -- Parcial / Rechazo --> K[Registro Kilos Devueltos & Motivo]
    K --> L[Reingreso a CUARENTENA_CALIDAD]
    L --> J
    J --> M{¿Forma de Pago?}
    M -- Crédito B2B --> N[Firma de Remisión Digital]
    M -- Contado / Transferencia --> O[Registro de Recaudo en Terreno]
    N --> P[Guardar Ejecución en IndexedDB Outbox]
    O --> P
    P --> Q{¿Hay Conexión a Internet?}
    Q -- Sí --> R[Sincronización Inmediata con Backend]
    Q -- No (Offline) --> S[Encolado Seguro Outbox + Heartbeat 15s]
    R --> T[Parada Marcada como COMPLETADA]
    S --> T
    T --> U{¿Quedan Paradas?}
    U -- Sí --> E
    U -- No --> V([Cierre de Ruta y Retorno a Planta])
```

---

### Diagrama 2: Rombos de Decisión y Edge Cases (Decision Logic Diagram)

```mermaid
flowchart TD
    subgraph Decisiones en Terreno
        D1{¿Conexión de Red Disponible?}
        D1 -- ONLINE --> D2[Transmitir Evento Inmediato]
        D1 -- OFFLINE --> D3[Almacenar en IndexedDB caja_outbox_v2]
        
        D4{¿Temperatura Cava en Descarga?}
        D4 -- <= 4.0°C --> D5[Verde: Cadena Frío Óptima]
        D4 -- 4.1°C a 7.0°C --> D6[Ámbar: Advertencia Sanitaria]
        D4 -- > 7.0°C --> D7[Rojo: Bloqueo Sanitario / Alerta Supervisor]
        
        D8{¿Aceptación de Mercancía?}
        D8 -- Aceptación Total (100%) --> D9[Entrega Total: Factura Íntegra]
        D8 -- Rechazo Parcial --> D10[Generar Nota Crédito / Ajuste Remisión]
        D8 -- Rechazo Total --> D11[Cancelar Entrega y Anular Recaudo]
        
        D12{¿Condición de Pago?}
        D12 -- CRÉDITO B2B --> D13[Causar CxC en Cartera según Plazo]
        D12 -- CONTADO EFECTIVO --> D14[Ingreso a Caja Menor Móvil Repartidor]
        D12 -- TRANSFERENCIA --> D15[Validar Número Comprobante Banco]
    end
```

---

### Diagrama 3: Modelo Entidad-Relación de Ruta y Entrega (Entity-Relationship)

```mermaid
erDiagram
    CONDUCTOR ||--o{ MANIFIESTO_RUTA : asignado
    VEHICULO ||--o{ MANIFIESTO_RUTA : transporta
    MANIFIESTO_RUTA ||--|{ PARADA_ENTREGA : contiene
    PARADA_ENTREGA ||--|| PEDIDO_B2B : asocia
    PARADA_ENTREGA ||--o| EVIDENCIA_ENTREGA : certifica
    EVIDENCIA_ENTREGA ||--o| FIRMA_DIGITAL : incluye
    PARADA_ENTREGA ||--o{ DEVOLUCION_ITEM : genera
    PARADA_ENTREGA ||--o| RECAUDO_TERRENO : cobra
    EVIDENCIA_ENTREGA ||--o| OUTBOX_SYNC_QUEUE : encola

    CONDUCTOR {
        string id PK
        string nombre
        string cedula
        string telefono
        string pinAcceso
        boolean activo
    }

    MANIFIESTO_RUTA {
        string id PK
        string consecutivo "RUT-YYYYMMDD-XXX"
        string conductorId FK
        string vehiculoPlaca
        string fechaRuta
        string estado "ASIGNADA|EN_RUTA|LIQUIDADA"
        int totalParadas
        int paradasCompletadas
    }

    PARADA_ENTREGA {
        string id PK
        string manifiestoId FK
        int ordenSecuencia
        string pedidoId FK
        string clienteNombre
        string clienteDireccion
        string clienteTelefono
        string coordenadasGps
        string estado "PENDIENTE|EN_CAMINO|ENTREGADO|RECHAZADO"
        float temperaturaLlegada
    }

    EVIDENCIA_ENTREGA {
        string id PK
        string paradaId FK
        string nombreReceptor
        string cedulaReceptor
        string timestampEntrega
        string firmaCanvasBase64
        string fotoGuiaUrl
    }

    DEVOLUCION_ITEM {
        string id PK
        string paradaId FK
        string productoSku
        float kilosDevueltos
        string motivoRechazo
        string destinoBodega "CUARENTENA_CALIDAD"
    }

    RECAUDO_TERRENO {
        string id PK
        string paradaId FK
        string formaPago "EFECTIVO|TRANSFERENCIA"
        int montoCobradoCOP
        string referenciaComprobante
    }

    OUTBOX_SYNC_QUEUE {
        string id PK
        string idempotencyKey
        string endpoint
        string payloadJson
        int intentosReintento
        string estado "PENDIENTE|EN_PROCESO|SINCRONIZADO|ERROR"
    }
```

---

### Diagrama 4: Diagrama de Secuencia Temporal (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Conductor (PWA Móvil)
    participant UI as PWA Driver View
    participant Sig as SignaturePad (Canvas)
    participant Outbox as outboxSyncService (IndexedDB)
    participant Worker as backgroundSyncWorker
    participant Net as networkConnectivityService
    participant API as Supabase / ERP Server

    Driver->>UI: Abre parada B2B y registra temp llegada (3.2°C)
    UI->>UI: Valida semáforo térmico (VERDE ÓPTIMO)
    Driver->>Sig: Solicita firma con el dedo al cliente receptor
    Sig-->>UI: Retorna firma en DataURL PNG Base64
    Driver->>UI: Ingresa nombre ("Juan Pérez") y cédula ("1098...")
    Driver->>UI: Toca botón gigante [CONFIRMAR ENTREGA] (56px)

    UI->>Outbox: encolarEntregaOutbox({ paradaId, firma, temp, recaudo })
    Outbox->>Outbox: Persiste en IndexedDB (caja_outbox_v2) con hash MD5
    UI-->>Driver: Muestra SweetAlert2: "✓ Entrega Registrada Exitosamente"

    Note over Worker, Net: Ciclo de Heartbeat reactivo (cada 15s)
    Net->>Worker: Notifica estado ONLINE
    Worker->>Outbox: Obtiene transacciones PENDIENTES
    Worker->>API: POST /api/v1/entregas/sincronizar (con Idempotency-Key)
    API->>API: Actualiza pedido a ENTREGADO y registra remisión legal
    API-->>Worker: Retorna HTTP 200 OK
    Worker->>Outbox: Marca item como SINCRONIZADO
    Worker-->>UI: Actualiza badge de conectividad en vivo
```

---

### Diagrama 5: Arquitectura de Componentes por Capas (Component Architecture)

```mermaid
graph TD
    subgraph Capa 1: Presentación PWA Móvil (Mobile Touch UI >= 48px)
        A[DriverAppShell.tsx: Layout Standalone Móvil]
        B[DriverLoginPinView.tsx: Teclado Numérico PIN]
        C[DriverRouteManifestView.tsx: Lista de Paradas del Día]
        D[DriverStopDetailView.tsx: Info Cliente, Waze y Teléfono]
        E[DriverDeliveryFormStep.tsx: Báscula, Temperatura y Devolución]
        F[DriverSignaturePadModal.tsx: Canvas Táctil de Firma]
        G[DriverNetworkBadge.tsx: Semáforo Offline/Online 15s]
    end

    subgraph Capa 2: Lógica de Aplicación & Hooks
        H[useDriverRouteStore.ts: Estado Reactivo de Ruta]
        I[useNetworkHeartbeat.ts: Detección Red 15s]
        J[useDeliveryOutbox.ts: Encolado de Entregas]
        K[deliveryRouteService.ts: Orquestador Transaccional]
    end

    subgraph Capa 3: Validación y Metrología
        L[deliveryRoute.schema.ts: Zod Schemas]
        M[dockPurchasesReceiving.schema.ts: Semáforo Térmico]
    end

    subgraph Capa 4: Persistencia Local & Sincronización
        N[IndexedDB: MaestroPescaderiaOfflineDB]
        O[caja_outbox_v2: Cola de Eventos Offline]
        P[backgroundSyncWorker.ts: Worker de Sincronización FIFO]
    end

    A --> B
    A --> C
    C --> D
    D --> E
    E --> F
    A --> G

    B & C & D & E --> H
    G --> I
    E --> J
    H & J --> K
    K --> L & M
    J --> N & O
    I --> P
    P --> O
```

---

## 4. Criterios de Aceptación y Quality Gate (DoD)

1. **Ergonomía Táctil Extrema:**
   - Targets táctiles secundarios $\ge 48\times 48\text{ px}$.
   - Botón principal de confirmación $\ge 56\text{ px}$ (`h-14`, fuente bold).
   - Acciones de llamada telefónica (`tel:`) y apertura de Waze/Google Maps a 1 solo toque.
2. **Cero Imágenes Externas:** 100% iconos Lucide React sin dependencias externas.
3. **Firma Digital Vectorial/Canvas:** Captura nítida de firma en pantalla táctil con botón de limpiar y guardar.
4. **Resiliencia Offline:** Permite completar 10 entregas consecutivas sin internet y sincronizarlas automáticamente al recuperar señal.
5. **Calidad de Código:**
   - Archivos modulares $< 400$ líneas (respetando SRP).
   - TypeScript estricto (`tsc --noEmit` en 0 errores).
   - Cobertura de pruebas unitarias $\ge 80\%$ en suites dedicadas.
   - Master Architect SOLID en 0 violaciones críticas.
   - Bucle Chrome DevTools MCP en vivo con 0 errores en consola y vista móvil 375 px validada.

---

*Fin de la Especificación Base. Prohibido generar código hasta aprobación del usuario.*
