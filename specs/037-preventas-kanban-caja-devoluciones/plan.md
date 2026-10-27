# Plan Técnico de Implementación: SPEC-037
## Arquitectura de Preventa Multivendedor, Tablero Kanban en Caja Central, Despacho Híbrido y Sidebar Compacto Ergonómico

**Código:** SPEC-037  
**Fase:** Spec Kit SDD v3.0 — `/speckit.plan`  
**Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico. Zero Cross-Tenant Leakage.  
**Plataforma Objetivo:** Desktop y Laptop (1366x768 px hasta 1920x1080 px).  
**Fecha:** 2026-10-27  

---

## 1. Arquitectura por Capas y Estrategia de Implementación

```
+-----------------------------------------------------------------------------------+
|                           CAPA DE PRESENTACIÓN (UI / UX V8)                       |
|  - EnterpriseSidebar (Rail Compacto 64px, Miller <=7, Fitts 48px, Hick tooltips) |
|  - VendorPosPreSaleView (Asesor: Atajos F1-F4, Descuento <=10%, Ticket QR)        |
|  - CashierKanbanView (Caja: 3 Columnas Reactivas, Filtro Asesores, Cobro F9)      |
|  - DispatchScannerModal (Asesor: Escaneo QR Factura / Bandeja Pagados con 1-clic) |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        CAPA DE GESTIÓN DE ESTADO (ZUSTAND)                        |
|  - useMultiVendorPosStore: Preventa activa, Hard-Hold de stock, Validar descuento |
|  - useCashierKanbanStore: Sincronización Realtime (<80ms), Drag/Drop & Clics     |
|  - useSidebarStore: Estado compacto, persistencia de preferencias de interfaz    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                     CAPA DE DOMINIO, REGLAS Y CONTRATOS ZOD                       |
|  - prefactura.schema.ts: Validación estricta de items, precios y límite descuento |
|  - prefacturaService.ts: Transiciones de estado atómicas y aislamiento tenant_id  |
|  - multiVendorCashService.ts: Integración con apertura de caja y recaudo          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                         CAPA DE PERSISTENCIA (SUPABASE RLS)                       |
|  - Tablas: pos_prefacturas, items_prefactura (B-Tree en tenant_id, vendedor_id)   |
|  - Funciones Transaccionales: emitir_prefactura_hardhold, cobrar_prefactura_caja  |
|  - RLS Canónico: tenant_id IN (SELECT public.current_user_tenant_ids())           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Contratos de Datos y Esquemas Zod

### 2.1. Tipos Canónicos (`src/types/prefactura.types.ts`)
- `EstadoPrefactura`: `'PENDIENTE_COBRO' | 'EN_COBRO' | 'PAGADA' | 'DESPACHADA' | 'ANULADA'`
- `ItemPrefactura`: `{ id, productoId, nombre, cantidad, precioLista, descuentoPct, precioFinal, subtotal }`
- `Prefactura`: Datos de cabecera con `tenantId`, `codigoPreventa` (`PRE-YYYY-XXXX`), `vendedorId`, `vendedorNombre`, `terminalId`, `clienteDocumento`, `clienteNombre`, `total`, `estado`, `hardHoldActivo`, `facturaId`, `pagadoAt`, `despachadoAt`.
- `DespachoVerificacionInput`: `{ prefacturaId: string; metodoVerificacion: 'QR_SCAN' | 'BANDEJA_TACTIL'; asesorId: string }`

### 2.2. Validadores Zod (`src/schemas/prefactura.schema.ts`)
- `validarItemPrefactura`: Garantiza cantidad $> 0$, precio base $> 0$ y valida si el descuento excede el umbral máximo (10%).
- `validarEmitirPrefactura`: Valida cabecera, arreglo de items (mínimo 1), datos del vendedor y terminal autorizada.
- `validarCobroCaja`: Exige `prefacturaId`, `turnoId` activo de caja y métodos de pago válidos que cubran el 100% del total.
- `validarDespacho`: Valida que la preventa esté en estado `'PAGADA'` antes de permitir la entrega física.

---

## 3. Optimización para Pantallas Desktop y Laptop (1366x768 - 1080p)

1. **Diseño Visual sin Scroll Vertical en Laptop (1366x768):**
   - Altura máxima de la cuadrícula de productos y tabla de líneas calculada con `h-[calc(100vh-140px)]`.
   - Encabezado ultra-delgado (40px) y pie de resumen fijado en la parte inferior para visibilidad permanente del total.
2. **Kanban de 3 Columnas Proporcionales:**
   - Distribución horizontal en `grid-cols-3 gap-3` (ancho de columna $\approx 380$px en 1366px con sidebar de 64px).
   - Cada columna cuenta con su propio contenedor con `overflow-y-auto` y barra de scroll ultra-fina translúcida (`scrollbar-thin`).
3. **Ergonomía de Teclado Retail de Alta Velocidad:**
   - `F1`: Búsqueda instantánea de producto.
   - `F2`: Emisión de preventa e impresión de ticket térmico.
   - `F4`: Apertura rápida de descuento con validación visual inmediata.
   - `F9`: Procesamiento de pago en caja.
   - `Esc`: Cierre de modales.

---

## 4. Rediseño del Sidebar (EnterpriseSidebar) con Leyes de UX

1. **Ancho Rail de 64px:** Libera el espacio lateral para que el POS disponga de 1300px o más de ancho.
2. **4 Núcleos Cognitivos (Ley de Miller):**
   - **VENTAS:** POS / Preventa, Clientes.
   - **CAJA:** Kanban de Cobro, Turnos y Movimientos.
   - **LOGÍSTICA:** Despachos, WMS, Muelle.
   - **ADMINISTRACIÓN:** Métricas, Auditoría, Configuración.
3. **Interacciones Ergonómicas (Leyes de Fitts y Hick):**
   - Iconos táctiles de 48px centrados con hit-box amplio.
   - Tooltips flotantes (`z-50`) con animación suave en hover, mostrando título y rol sin saturar la barra.

---

## 5. Estrategia de Base de Datos y Supabase RLS

1. **Tabla `public.pos_prefacturas`:**
   - Columnas: `id UUID PK`, `tenant_id UUID FK`, `codigo_preventa TEXT UNIQUE`, `vendedor_id UUID`, `terminal_id TEXT`, `cliente_documento TEXT`, `cliente_nombre TEXT`, `subtotal NUMERIC`, `descuento_total NUMERIC`, `total NUMERIC`, `estado TEXT`, `hard_hold_activo BOOLEAN`, `supervisor_pin_id UUID`, `created_at TIMESTAMPTZ`, `pagado_at TIMESTAMPTZ`, `despachado_at TIMESTAMPTZ`.
2. **Tabla `public.items_prefactura`:**
   - Columnas: `id UUID PK`, `prefactura_id UUID FK`, `producto_id UUID`, `nombre TEXT`, `cantidad NUMERIC`, `precio_lista NUMERIC`, `descuento_pct NUMERIC`, `precio_final NUMERIC`, `subtotal NUMERIC`.
3. **Índices de Alto Rendimiento:**
   - `idx_prefacturas_tenant_estado`: B-Tree en `(tenant_id, estado)` para carga del Kanban en $<10$ms.
   - `idx_prefacturas_codigo`: B-Tree en `codigo_preventa` para escaneo instantáneo con lector QR.
4. **Seguridad RLS Zero-Leakage:**
   - Políticas con `USING (tenant_id IN (SELECT public.current_user_tenant_ids()))`.
