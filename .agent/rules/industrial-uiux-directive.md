# Directiva Técnica Vinculante Universal: Auditoría y Rediseño UI/UX Industrial Enterprise
**Documento:** DTV-UIUX-2026-001-UNIVERSAL  
**Sistema:** La Pezcadería ERP / Maestro Pezcadería (SPA/PWA Industrial Híbrida B2B/B2C)  
**Alcance:** Universal y Obligatorio para **TODOS** los módulos: Ventas POS, Cotizaciones & Precios, Ventas B2B, Alistamiento & Despachos (OTIF), Alquiler de Cuarto Frío, Compras & Muelle, y Módulo Contable/Fiscal (SIIGO/DIAN/NIIF).  
**Autoridad:** Dirección de Agencia de Desarrollo de Software & Consultoría UI/UX Enterprise  
**Fecha de Ratificación:** 2026-10-25  
**Gobernanza:** Regla Preceptiva de Arquitectura Frontend para Agentes de IA, Diseñadores y Desarrolladores  

---

## 1. Declaración de Misión y Filosofía de Diseño

En **La Pezcadería ERP**, la interfaz de usuario es un instrumento de precisión operativo, fiscal y de rentabilidad biológica. No se tolera la saturación cognitiva, la redundancia de rutas, el desorden cromático ni las inconsistencias entre la realidad física y los datos en pantalla.

Esta directiva erradica de raíz:
1. **Saturación Cognitiva:** Interfaces abarrotadas de botones, menús de más de 18 ítems y tablas infinitas sin jerarquía.
2. **Redundancia Estructural:** Módulos duplicados en el menú (ej. `POS` vs `POS Offline V2`; `Bodegas & WMS` vs `Gestión de Bodegas`), y navegación a ciegas sin tooltips.
3. **Inconsistencia de Datos:** Badges que contradicen la existencia real de inventario (ej. marcar "Sin stock" a un producto con 500 kg en bodega), y fuentes tipográficas estilo arcade que dañan la seriedad del sistema.
4. **Ruido Visual ("Efecto Arcoíris"):** Botoneras con 8 colores pastel dispares, tarjetas KPI sobre fondos grises oscuros de bajo contraste y artefactos de depuración visibles en producción (`Break the world`).

---

## 2. Los 7 Estándares Universales de la Arquitectura UI/UX

Las siguientes especificaciones son de implementación obligatoria y uniforme en cada pantalla del ERP:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LAYOUT SHELL CANÓNICO UNIVERSAL                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Zona de Encabezado: Breadcrumb limpio + Título + Máx. 1 badge       │
│ 2. Barra de Control: Máx. 3 Acciones Primarias + Menú "Más Opciones"  │
│ 3. Barra de Rendimiento: 3 a 4 Tarjetas KPI (Modo Bimodal Contrastado) │
│ 4. Zona de Trabajo: Máx. 5 Pestañas de Flujo o Acordeones Temáticos    │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Estándar 1: Layout Shell Canónico Universal (Standard View Shell)
Toda vista de primer nivel (`POSView`, `InventoryView`, `PricingView`, `ColdStorageRentalView`, `AccountingView`, `PurchasesView`, `OrderKanbanView`) debe estructurarse obligatoriamente bajo 4 zonas verticales fijas:
* **Zona 1 (Título y Breadcrumb Limpio):** Ruta jerárquica clara (`ERP > Dominio > Módulo`). Quedan **prohibidos badges decorativos estáticos** (como "ERP DATA-DRIVEN" o "NIIF / NIC 2"). Se permite únicamente un badge semántico dinámico cuando la entidad lo amerite (ej. `Estado: En Arqueo` o `Lote Activo`).
* **Zona 2 (Barra de Control de Acciones - Regla de Máximo 3):** Se prohíben las filas masivas de botones. La vista expondrá hasta **3 botones de acción primaria** claramente jerarquizados con la paleta oficial (Primario sólido, Secundario neutro, Acción Especial cian). Todas las demás acciones secundarias o utilitarias (`Importar CSV`, `Exportar Excel`, `Traslados`, `Configuración`) se agrupan en un menú desplegable accesible: **"Más Acciones..."**.
* **Zona 3 (Tablero de 3 a 4 Tarjetas KPI):** Métricas clave de la pantalla estructuradas con cifras monoespaciadas legibles (`<DataNumber>`).
* **Zona 4 (Pestañas de Flujo Secuencial):** Máximo **5 pestañas** con nombres claros y descriptivos sin numeraciones inconsistentes.

### 2.2. Estándar 2: DataTable Canónico de Alta Densidad con Drawer Lateral
Para todas las listas de datos (Inventario, Clientes, Ventas B2B, Despachos, Compras, Contratos de Frío, Asientos Contables):
* **Columnas Principales Fijas:** Máximo **6 a 7 columnas visibles** en pantalla de escritorio para erradicar el scroll horizontal infinito.
* **Drawer Lateral de Detalle:** El clic sobre cualquier fila abre un panel lateral deslizante (`Drawer` con `isolation: isolate; z-50`) que despliega la ficha 360°, auditoría, historial y acciones avanzadas del registro.
* **Barra de Filtros Depurada:** Input de búsqueda con debounce de 300 ms + máximo 2 selectores semánticos (`Estado`, `Categoría`) + botón de limpiar. Quedan prohibidos los botones de filtro tipo pill con colores dispares.
* **Semántica Unificada de 4 Estados:**
  * 🟢 **Verde (`Stock OK` / `Pagado` / `Vigente` / `Completado`):** `text-emerald-700 bg-emerald-50 border-emerald-200`.
  * 🟡 **Ámbar (`Stock Bajo` / `Pendiente` / `Próximo a Vencer` / `En Proceso`):** `text-amber-800 bg-amber-50 border-amber-200`.
  * 🔴 **Rojo (`Sin Stock` / `Vencido` / `Rechazado` / `En Mora`):** `text-rose-700 bg-rose-50 border-rose-200`.
  * ⚪ **Gris (`Inactivo` / `Anulado` / `Borrador`):** `text-slate-600 bg-slate-100 border-slate-200`.
* **Identificadores Legibles:** Todo SKU, NIT, número de factura, lote o remisión debe formatearse con `font-mono text-slate-700 font-semibold tracking-wider`. Prohibido el uso de fuentes tipo pantalla LCD o arcade retro.

### 2.3. Estándar 3: Reorganización y Fusión Estructural del Sidebar (`EnterpriseSidebar.tsx`)
Se refactoriza la navegación lateral consolidándola en **5 dominios maestros sin duplicidades**, con filtrado por rol RBAC:
1. **`VENTAS & POS`:** Punto de Venta (unificado e intrínsecamente offline-first, eliminando la ruta redundante "POS Offline V2"), Ventas B2B / Pedidos, Cotizaciones & Precios Dinámicos, Directorio de Clientes.
2. **`LOGÍSTICA & WMS`:** Inventario Multibodega (incluye sub-pestaña de gestión de depósitos, eliminando la ruta duplicada "Gestión de Bodegas"), Alistamiento B2B, Despachos & Rutas (incluye Métricas OTIF/SLA).
3. **`PLANTA & ALMACENAMIENTO`:** Compras & Recepción en Muelle, Producción & Despiece (Yield biológico), Alquiler de Cuarto Frío.
4. **`FINANZAS & CONTABILIDAD`:** Tesorería & Arqueos de Caja, Cuentas por Cobrar (Cartera), Facturación DIAN / SIIGO Nube, Kardex Contable NIIF.
5. **`CONFIGURACIÓN & SISTEMA`:** Mermas y Márgenes Globales (Admin), Parámetros Fiscales DIAN, Usuarios & Permisos.
* **Depuración de Badges:** Eliminación total de badges de texto estático decorativo (`FEFO`, `Caja`, `Nuevo`, `B2B`, `HORECA`). Los badges se reservan **exclusivamente para contadores dinámicos accionables** (`pendingPrepCount > 0`).
* **Tooltips en Estado Colapsado:** Cuando el sidebar se colapse a iconos, cada botón debe renderizar un tooltip flotante instantáneo (`z-50`) con el nombre del módulo para erradicar la navegación a ciegas ("Mystery Meat Navigation").

### 2.4. Estándar 4: Formularios de Página Completa con Acordeones Temáticos
Para flujos de captura extensos (Alquiler de Cuarto Frío, Recepción de Muelle, Órdenes de Despiece, Cotizaciones B2B, Facturación y Resoluciones Contables):
* **Prohibición de Modales Apilados:** Queda prohibido abrir modales sobre modales.
* **Vista Dedicada con Acordeones:** La captura se realiza en vistas de página completa organizadas en secciones colapsables temáticas:
  1. *Acordeón 1: Datos Generales & Tercero (Cliente / Proveedor / Conductor).*
  2. *Acordeón 2: Detalle de Ítems, Pesaje, Calibres y Mermas.*
  3. *Acordeón 3: Liquidación Financiera, Impuestos (IVA/Retenciones) y Condiciones de Pago.*
* **Auto-Guardado en Borrador (Draft State):** Toda modificación en los acordeones se guarda automáticamente en memoria/IndexedDB local para impedir pérdidas de datos ante cierres imprevistos de pestaña o navegación accidental.

### 2.5. Estándar 5: Theming Bimodal Adaptativo por Rol y Entorno
* **Modo Claro de Alto Contraste (WCAG 2.2 AA+ / AAA):**
  * Obligatorio por defecto para estaciones de campo y pantallas táctiles operativas: Punto de Venta (POS), Pesaje en Cuarto Frío, Muelle, Despachos y Bodega.
  * Tarjetas KPI sobre fondo blanco (`bg-white border-slate-200`), títulos en gris neutro (`text-slate-500 font-semibold`) y cifras numéricas en negro/marino puro (`text-slate-900 font-bold font-mono text-2xl`) con ratio $\ge 12:1$.
* **Modo Oscuro Translúcido (Dark Glassmorphism):**
  * Asignado a dashboards gerenciales, Pricing Engine, auditoría NIIF y analítica ejecutiva.

### 2.6. Estándar 6: Ergonomía Táctil Industrial y Resiliencia Offline
* **Custom On-Screen Keypad ($\ge 56\text{ px}$):** En estaciones de pesaje a 0 °C con guantes, se bloquea el teclado virtual nativo del sistema operativo (`inputMode="none"`) y se renderiza un teclado numérico táctil embebido propio del ERP con teclas gigantes, botones directos de Tara, Gramos y Kilos, y lectura de balanza por Web Serial API / USB.
* **Stock Flotante en Jaula de Faraday:** Ante pérdida de conexión en cámaras frigoríficas o mostrador, la UI no frena la venta de producto físico perecedero aunque figure con saldo cero en IndexedDB; emite alerta ámbar, encola en el Outbox y concilia en background al reconectar.

### 2.7. Estándar 7: Desacoplamiento Fiscal y Erradicación de Artefactos Debug
* **Remisión de Contingencia SIIGO/DIAN a los 3000 ms:** Si la API fiscal no responde en 3 segundos, la UI genera inmediatamente una Remisión de Despacho física con código de barras/QR local e identificador temporal, encolando el XML/CUFE para sincronización en background sin bloquear la salida de camiones ni la fila de clientes.
* **Eliminación del Botón "Break the world":** El botón flotante de prueba de Sentry/ErrorBoundary en `src/main.tsx` queda estrictamente condicionado a variables de entorno de desarrollo y confinado fuera de las pantallas operativas del ERP.

---

## 3. Matriz Universal de Usabilidad y Diagnóstico por Módulo

| Módulo del ERP | Dolor / Contexto Operativo | Heurística / Ley Violada | Impacto | Directiva Técnica de Solución Universal |
| :--- | :--- | :--- | :--- | :--- |
| **Navegación Global (`EnterpriseSidebar.tsx`)** | Menú con 18+ rutas, duplicidad (`POS` vs `POS Offline V2`; `Bodegas` vs `Gestión Bodegas`) y badges de texto estático. | **Ley de Miller** ($7 \pm 2$), **Ley de Hick** & **Nielsen #8**. | **ALTO** | Consolidar a 5 dominios maestros, eliminar rutas duplicadas, quitar badges estáticos y activar tooltips en colapsado. |
| **Inventario & Bodegas (`InventoryView.tsx`)** | Fila de 8 botones pastel arcoíris, 4 KPIs grises ilegibles y productos con 500 kg marcados como "Sin stock". | **Efecto Estética-Usabilidad**, **WCAG Contraste** & **Nielsen #1, #2**. | **CRÍTICO** | Máximo 3 botones primarios + dropdown "Más Acciones..."; corregir lógica del badge de stock y tarjetas KPI blancas con ratio $\ge 12:1$. |
| **Ventas POS & Caja (`POSView.tsx`)** | Dos accesos al POS, lentitud ante cortes de red y digitación con manos húmedas. | **Umbral de Doherty** (<400 ms), **Ley de Fitts** & **Nielsen #1**. | **CRÍTICO** | Unificar en `/pos` offline-first, mutaciones optimistas en Zustand (<50 ms), stock flotante en Outbox y teclado táctil $\ge 56\text{ px}$. |
| **Cotizaciones & Pricing (`PricingView.tsx`)** | Tablas de 12 columnas sin semáforos de margen real y riesgo de venta bajo costo de merma. | **Nielsen #5** (Prevención de Errores) & **Nielsen #8**. | **ALTO** | Semáforos en tiempo real (verde $\ge 20\%$, ámbar $10-19\%$, rojo $<10\%$) y bloqueo físico con override por PIN de Admin. |
| **Alistamiento & Despachos (`OrderKanbanView.tsx`)** | Tarjetas de pedidos saturadas de metadatos no críticos y falta de visibilidad OTIF. | **Ley de Miller** & **Nielsen #6** (Reconocer vs Recordar). | **ALTO** | Tarjetas Kanban limpias con 4 datos esenciales (Cliente, Hora Límite, Kilos, Estado) y acceso a detalles por Drawer. |
| **Alquiler de Cuarto Frío (`ColdStorageRentalView.tsx`)** | Archivo de 3200+ líneas con formularios fragmentados y modales apilados. | **Nielsen #5** & **Ley de Fitts**. | **CRÍTICO** | Formulario de página completa con 3 acordeones temáticos (Cliente, Espacio Asignado, Facturación) y auto-guardado en borrador. |
| **Compras & Muelle (`PurchasesView` / Muelle)** | Captura de peso en muelle a la intemperie con teclado virtual invasivo del sistema operativo. | **Ley de Fitts** & **Nielsen #5**. | **CRÍTICO** | Custom Keypad $\ge 56\text{ px}$ con `inputMode="none"`, teclas de Tara y captura directa por Web Serial. |
| **Módulo Contable, DIAN & SIIGO (`AccountingView.tsx`)** | Camiones retenidos por latencia de CUFE y tablas de asientos contables con scroll infinito. | **Nielsen #9** (Recuperación) & **Nielsen #3** (Libertad). | **CRÍTICO** | Desacoplamiento a los 3s con Remisión de Contingencia física y DataTable de alta densidad con Drawer lateral. |

---

## 4. Plan de Ejecución Vertical por Dominio Crítico (Límite Kanban WIP = 1)

El rediseño se implementará modularmente bajo el ciclo TDD estricto, certificando cada módulo con Vitest y Chrome DevTools antes de avanzar al siguiente:

```
[SPRINT 1: Navegación & Shell Global] ──► [SPRINT 2: Inventario & WMS] ──► [SPRINT 3: Ventas POS] ──► [SPRINT 4: B2B & Pricing] ──► [SPRINT 5: Cuarto Frío & Contabilidad]
```

* **Sprint 1: Navegación Global, Layout Shell y Limpieza de Debug:**
  * Refactorizar `EnterpriseSidebar.tsx` a los 5 dominios maestros, eliminar rutas duplicadas (`pos_offline`, `configuracion_bodegas`), suprimir badges estáticos y habilitar tooltips en estado colapsado.
  * Ocultar el botón `Break the world` en `src/main.tsx`.
* **Sprint 2: Inventario, WMS y Bodegas (`InventoryView.tsx`):**
  * Reducir la botonera a 3 acciones primarias (`+ Nuevo Producto`, `+ Recibir Compra`, `+ Nuevo Despiece`) y mover el resto a dropdown "Más Acciones...".
  * Corregir el bug reactivo del badge de stock ("Sin stock" con 500 kg).
  * Sustituir fuentes arcade de SKU por `font-mono text-slate-700` y sanear las tarjetas KPI con contraste WCAG 2.2 AAA.
* **Sprint 3: Punto de Venta (POS) y Caja (`POSView.tsx`):**
  * Consolidar el POS unificado offline-first, implementar mutaciones optimistas en Zustand (<50 ms), teclado táctil $\ge 56\text{ px}$ y stock flotante en Outbox.
* **Sprint 4: Comercial, Cotizaciones & B2B (`PricingView.tsx`, `OrderKanbanView.tsx`):**
  * Integrar el Standard Layout Shell, semáforos de rentabilidad y tarjetas Kanban limpias con Drawer lateral de detalle.
* **Sprint 5: Cuarto Frío y Contabilidad (`ColdStorageRentalView.tsx`, `AccountingView.tsx`):**
  * Descomponer `ColdStorageRentalView` en vista con 3 acordeones temáticos con auto-guardado en borrador y aplicar DataTable canónico en asientos contables y Kardex NIIF.
