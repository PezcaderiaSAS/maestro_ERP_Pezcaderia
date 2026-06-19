# System Design: MaestroPescadería ERP

**Versión:** 1.0 | **Fecha:** 2026-06-19 | **Estado:** APROBADO

---

## 1. Visión General de la Arquitectura

El ERP MaestroPescadería es una **Single Page Application (SPA)** construida con React + TypeScript + Vite. La arquitectura se organiza en módulos independientes con responsabilidades claras y contratos de datos explícitos.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                      │
│                                                             │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   POS   │ │ Inventario│ │ Pedidos  │ │  Producción  │  │
│  │  View   │ │   View    │ │/Logística│ │    View      │  │
│  └────┬────┘ └─────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │            │            │               │           │
│  ┌────▼────┐ ┌─────▼─────┐ ┌────▼─────┐ ┌──────▼───────┐  │
│  │  POS    │ │ Inventory │ │ Orders   │ │  Production  │  │
│  │ Service │ │  Service  │ │ Service  │ │   Service    │  │
│  └────┬────┘ └─────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │            │            │               │           │
│       └────────────┴────────────┴───────────────┘          │
│                            │                               │
│                    ┌───────▼────────┐                      │
│                    │   localDb.ts   │  ← Capa de datos     │
│                    │ (localStorage) │    actual            │
│                    └───────┬────────┘                      │
└────────────────────────────┼────────────────────────────────┘
                             │ (Fase futura: migración)
                    ┌────────▼────────┐
                    │    SUPABASE     │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

---

## 2. Catálogo de Módulos

### Módulo 1: POS (Punto de Venta)
**Archivo actual:** `src/views/POSView.tsx` (132 KB — refactoring requerido)
**SPEC:** `DOCS/SPECS/SPEC_POS.md`

**Responsabilidades:**
- Gestionar el flujo completo de venta en mostrador
- Leer peso desde balanza (Web Serial API)
- Calcular totales con descuentos por línea y globales
- Registrar pago (efectivo/transferencia)
- Imprimir recibo y abrir gaveta (ESC/POS via Web Serial)
- Descontar inventario al confirmar venta

**NO es responsabilidad del POS:**
- Crear clientes nuevos (→ Módulo Clientes)
- Gestionar devoluciones complejas (→ Módulo Logística)
- Generar facturas electrónicas Siigo (→ Módulo Facturación)

**Datos que consume:** `productsCatalog`, `stock`, `clientes`, `parametros`, `ventas`
**Datos que produce:** `ventas`, `movimientos` (egreso de stock), `cartera` (si es crédito)

---

### Módulo 2: Inventario / WMS
**Archivo actual:** `src/views/InventoryView.tsx` (142 KB — refactoring requerido)
**SPEC:** `DOCS/SPECS/SPEC_INVENTORY.md`

**Responsabilidades:**
- Catálogo de productos (CRUD)
- Control de stock por bodega
- Registro de compras / entradas de inventario
- Traslados entre bodegas
- Consulta de lotes y fechas de vencimiento
- Gestión de categorías jerárquicas (Tipo > Línea > Clase)

**NO es responsabilidad del Inventario:**
- Transformación/producción de materia prima (→ Módulo Producción)
- Asignación de precios de venta diferenciados (→ Módulo Precios)

**Datos que consume:** `productsCatalog`, `stock`, `categorias`, `proveedores`, `ordenesCompra`
**Datos que produce:** `productsCatalog`, `stock`, `movimientos`, `ordenesCompra`

---

### Módulo 3: Pedidos / Logística
**Archivos actuales:** `src/views/OrderKanbanView.tsx` + `src/views/ARView.tsx`
**SPEC:** `DOCS/SPECS/SPEC_ORDERS.md`

**Responsabilidades:**
- Creación de cotizaciones (pedido con peso estimado)
- Flujo de estados: `CREADO → ALISTADO → FACTURADO → EN_RUTA → ENTREGADO`
- Asignación de pedidos a rutas y conductores
- Recaudo de dinero en ruta
- Liquidación y cierre de ruta
- Gestión de devoluciones y averías en ruta

**NO es responsabilidad de Pedidos/Logística:**
- Cobro en mostrador (→ Módulo POS)
- Emisión de factura electrónica (→ Módulo Facturación)

**Datos que consume:** `quotations`, `clientes`, `conductores`, `stock`, `cartera`
**Datos que produce:** `quotations`, `ventas`, `cartera`, `movimientos`, `devoluciones`

---

### Módulo 4: Producción
**Archivo actual:** No existe aún (por crear)
**SPEC:** Pendiente

**Responsabilidades:**
- Órdenes de producción/transformación (materia prima → producto terminado)
- Registro de merma con justificación y PIN de autorización
- Cálculo automático de rendimiento por lote
- Validación de tolerancia de merma (límite: 35%)

**Datos que consume:** `stock`, `productsCatalog`, `movimientos`
**Datos que produce:** `stock` (resta MP, suma PT), `movimientos`

---

### Módulo 5: Facturación
**Archivo actual:** Integrado en POSView y OrderKanbanView (extraer)
**SPEC:** Pendiente

**Responsabilidades:**
- Generación de factura electrónica via API Siigo
- Manejo de estados DIAN: `PENDIENTE → ENVIADO → VALIDADO → FALLIDO`
- Generación de facturas de contingencia internas

**Datos que consume:** `ventas`, `quotations`, `clientes`
**Datos que produce:** Log de integración `logIntegracion`

---

### Módulo 6: RRHH / Nómina
**Archivos actuales:** `src/views/HRView.tsx` + `src/views/PayrollView.tsx`
**SPEC:** Pendiente

**Responsabilidades:**
- Gestión de empleados (CRUD con soft delete)
- Gestión de nómina mensual
- Control de asistencia y novedades

**Datos que consume:** `empleados`, `nominas`
**Datos que produce:** `empleados`, `nominas`, `gastos`

---

### Módulo 7: CRM
**Archivo actual:** `src/views/CRMView.tsx`
**SPEC:** Pendiente

**Responsabilidades:**
- Integración bidireccional con Twenty CRM
- Gestión de empresas, contactos y oportunidades B2B

**Datos que consume:** API Twenty CRM (externa)
**Datos que produce:** API Twenty CRM (externa)

---

### Módulo 8: Clientes / Cartera
**Archivo actual:** `src/views/ClientsView.tsx`
**SPEC:** Pendiente

**Responsabilidades:**
- CRUD de clientes
- Gestión de cartera (cuentas por cobrar)
- Registro de abonos y saldos

**Datos que consume:** `clientes`, `cartera`, `ventas`
**Datos que produce:** `clientes`, `cartera`

---

## 3. Contratos entre Módulos

Las siguientes son las únicas vías de comunicación permitidas entre módulos:

| Módulo Origen | Módulo Destino | Contrato |
|---|---|---|
| POS | Inventario | Lee `stock`; escribe `movimientos` vía `inventoryService.registrarSalida()` |
| POS | Clientes | Lee `clientes` vía `clientService.buscarCliente()` |
| Pedidos | Inventario | Lee `stock`; reserva vía `inventoryService.reservarStock()` |
| Pedidos | Clientes | Lee y actualiza `cartera` vía `clientService.actualizarCartera()` |
| Producción | Inventario | Lee `stock`; escribe doble movimiento vía `inventoryService.procesarProduccion()` |
| Facturación | Pedidos | Lee datos del pedido; actualiza estado vía `ordersService.marcarFacturado()` |

> **Regla de arquitectura**: Los módulos no deben leer directamente de `localDb.ts` cruzando dominios. Deben usar las funciones de servicio del módulo dueño del dato.

---

## 4. Estructura de Servicios (Target)

```
src/
├── services/
│   ├── localDb.ts              ← Capa de persistencia (no modificar)
│   ├── posService.ts           ← Lógica de negocio del POS [CREAR]
│   ├── inventoryService.ts     ← Lógica de negocio del Inventario [CREAR]
│   ├── ordersService.ts        ← Lógica de negocio de Pedidos [CREAR]
│   ├── productionService.ts    ← Lógica de producción [CREAR]
│   ├── billingService.ts       ← Integración Siigo [CREAR]
│   ├── clientService.ts        ← CRUD de Clientes/Cartera [CREAR]
│   ├── hrService.ts            ← RRHH/Nómina [CREAR]
│   └── twentyClient.ts         ← Integración Twenty CRM [EXISTE]
├── views/
│   ├── pos/                    ← Componentes del POS (refactoring)
│   ├── inventory/              ← Componentes del Inventario (refactoring)
│   ├── orders/                 ← Componentes de Pedidos (refactoring)
│   └── [ModuloView.tsx]        ← Views existentes (orquestar, no lógica)
├── types/
│   ├── pos.types.ts            ← Tipos del módulo POS [CREAR]
│   ├── inventory.types.ts      ← Tipos del módulo Inventario [CREAR]
│   ├── orders.types.ts         ← Tipos del módulo Pedidos [CREAR]
│   └── common.types.ts         ← Tipos compartidos [CREAR]
└── tests/
    ├── pos.test.ts             ← Tests del POS [CREAR]
    ├── inventory.test.ts       ← Tests del Inventario [CREAR]
    └── orders.test.ts          ← Tests de Pedidos [CREAR]
```

---

## 5. Fases de Migración a Supabase (Referencia Futura)

Esta fase NO es parte del desarrollo actual. Se documenta aquí únicamente como referencia.

| Fase | Acción |
|---|---|
| Fase Local (ACTUAL) | `localStorage` via `localDb.ts` |
| Fase Migración | Crear tabla Supabase → migrar función de servicio correspondiente → mantener `localDb.ts` como fallback |
| Fase Supabase Completo | Eliminar dependencia de `localStorage`; activar RLS y Realtime |
