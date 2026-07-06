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

El sistema se organiza en 13 módulos claramente delimitados para garantizar la modularidad y escalabilidad:

### Módulo 1: POS (Punto de Venta - Ventas Rápidas)
**Archivo/Ruta target:** `src/views/POSView.tsx` | `src/views/pos/`
**SPEC:** `DOCS/SPECS/SPEC_POS.md`

**Responsabilidades:**
- Gestionar la venta rápida en mostrador.
- Conexión directa a inventario y caja del punto de venta.
- Visualización de stock de cada producto en todas las bodegas disponibles.
- Leer pesos desde balanza (Web Serial API) y fallback manual.
- Apertura de cajón de dinero física con pago en efectivo o PIN de supervisor.
- Aplicar redondeo a $100 COP para efectivo.

**Datos que consume:** `productsCatalog`, `stock`, `clientes`, `cajas`, `ventas`
**Datos que produce:** `ventas`, `movimientos` (descuento de stock), `cajas` (ingresos)

---

### Módulo 2: Ventas B2B
**Archivo/Ruta target:** `src/views/OrderKanbanView.tsx` | `src/views/orders/`
**SPEC:** `DOCS/SPECS/SPEC_B2B.md`

**Responsabilidades:**
- Creación de pedidos B2B por parte de vendedores externos.
- Flujo de estados: `CREADO` → `LISTO` (Alistamiento de Bodega) → `EN_DESPACHO` (Despacho verificado/impreso) → `ENTREGADO` (Entregas y recaudos) → `FACTURADO` (Validación administrativa) → `PAGADO` (Seguimiento de cartera).
- Validación de límite de cupo de crédito (bifurcación a `PAUSADO_POR_CREDITO`).
- Validación de umbral de peso superior al 5% en alistamiento (bifurcación a `PAUSADO`).

**Datos que consume:** `clientes`, `stock`, `pedidos`
**Datos que produce:** `pedidos`, `cartera`

---

### Módulo 3: Inventario y WMS
**Archivo/Ruta target:** `src/views/InventoryView.tsx` | `src/views/inventory/`
**SPEC:** `DOCS/SPECS/SPEC_INVENTORY.md`

**Responsabilidades:**
- Catálogo maestro de productos (CRUD).
- Control de stock multi-bodega en tiempo real.
- Traslados atómicos entre bodegas con validación.
- Gestión de lotes FEFO (First Expired, First Out).
- Gestión de categorías jerárquicas en 3 niveles (Tipo > Línea > Clase).

**Datos que consume:** `productsCatalog`, `stock`, `categorias`
**Datos que produce:** `productsCatalog`, `stock`, `movimientos` (Kardex)

---

### Módulo 4: Compras
**Archivo/Ruta target:** `src/views/PurchasesView.tsx` | `src/views/purchases/`
**SPEC:** `DOCS/SPECS/SPEC_PURCHASES.md`

**Responsabilidades:**
- Gestión de órdenes de compra con proveedores.
- Recepción de mercancía física (incremento de stock y registro de lotes FEFO).
- Integración de costos (actualización del Costo Promedio Ponderado en base a precio de compra + flete prorrateado).

**Datos que consume:** `proveedores`, `productsCatalog`
**Datos que produce:** `ordenesCompra`, `stock`, `movimientos`

---

### Módulo 5: Gastos
**Archivo/Ruta target:** `src/views/ExpensesView.tsx` | `src/views/expenses/`
**SPEC:** `DOCS/SPECS/SPEC_EXPENSES.md`

**Responsabilidades:**
- Registro de gastos de operación (Fijos, Variables, Impuestos y Tasas).
- Soporte digital y clasificación contable.
- Integración con el flujo de caja del POS (si el pago es en efectivo de caja).

**Datos que consume:** `categoriasGastos`
**Datos que produce:** `gastos`, `cajas` (salidas de caja)

---

### Módulo 6: Producción (Transformación)
**Archivo/Ruta target:** `src/views/ProductionView.tsx` | `src/views/production/`
**SPEC:** `DOCS/SPECS/SPEC_PRODUCTION.md`

**Responsabilidades:**
- Transformación (crafting) de materia prima a producto terminado basado en recetas.
- Soporte a recetas con ingredientes recursivos (sub-recetas).
- Validación de conservación de masa (PT <= MP).
- Control de mermas (alerta y PIN de autorización si supera el 35%).

**Datos que consume:** `stock`, `productsCatalog`, `recetas`
**Datos que produce:** `stock` (consumo de MP y entrada de PT), `movimientos` (Kardex)

---

### Módulo 7: Facturación (Historial de Documentos)
**Archivo/Ruta target:** `src/views/InvoicesView.tsx` | `src/views/invoices/`
**SPEC:** `DOCS/SPECS/SPEC_BILLING.md`

**Responsabilidades:**
- Emisión de facturas electrónicas y tiquetes de venta.
- Integración con la API de Siigo (automática por cliente o mediante botón manual).
- Historial completo de documentos (Cotizaciones, Remisiones, Facturas, Notas Crédito) con visualización de lotes y cambios de estado.
- Emisión de notas de crédito y devoluciones asociadas.

**Datos que consume:** `ventas`, `pedidos`, `clientes`
**Datos que produce:** `ventas` (estado de facturación), `logsSiigo`, `notasCredito`

---

### Módulo 8: Recursos Humanos y Nómina
**Archivo/Ruta target:** `src/views/PayrollView.tsx` | `src/views/payroll/`
**SPEC:** `DOCS/SPECS/SPEC_PAYROLL.md`

**Responsabilidades:**
- Gestión de empleados (CRUD con soft delete y atómica desactivación de acceso al ERP al egreso).
- Liquidación de nómina colombiana (meses de 30 días, auxilio de transporte a 2 SMMLV, aportes y retenciones).
- Registro de novedades (inasistencias, deducciones, horas extras y recargos).
- Liquidación definitiva de prestaciones sociales (Cesantías, Intereses, Prima, Vacaciones).

**Datos que consume:** `empleados`
**Datos que produce:** `empleados` (estado/acceso), `nominas`, `gastos`

---

### Módulo 9: Logística (Rutas)
**Archivo/Ruta target:** `src/views/LogisticsView.tsx` | `src/views/logistics/`
**SPEC:** `DOCS/SPECS/SPEC_LOGISTICS.md`

**Responsabilidades:**
- Generación de Planillas de Ruta asignadas a transportadores/conductores.
- Gestión de entregas y control de devoluciones físicas (Bodega Principal / Bodega de Averías).
- Cierre y liquidación de ruta con cuadre de caja obligatorio (PIN si hay descuadres).

**Datos que consume:** `pedidos`, `conductores`, `stock`
**Datos que produce:** `pedidos` (despachado/entregado), `devoluciones`, `cajas` (recaudos de ruta)

---

### Módulo 10: Informes (Reportes)
**Archivo/Ruta target:** `src/views/ReportsView.tsx` | `src/views/reports/`
**SPEC:** `DOCS/SPECS/SPEC_REPORTS.md`

**Responsabilidades:**
- Consolidación de reportes de ventas, compras por proveedor, costos, producción y nómina.
- Restricción de acceso a información financiera confidencial según roles.
- Exportación de datos a CSV delimitado por punto y coma.

**Datos que consume:** `ventas`, `compras`, `produccion`, `gastos`, `nominas`
**Datos que produce:** Exportaciones CSV

---

### Módulo 11: Cajas y Flujo de Caja
**Archivo/Ruta target:** `src/views/CashFlowView.tsx` | `src/views/cashflow/`
**SPEC:** `DOCS/SPECS/SPEC_CASHFLOW.md`

**Responsabilidades:**
- Apertura, cierre y arqueo de turnos de caja en el POS.
- Control de la Caja General y traslados de fondos (entre cajas y bancos).
- Aislamiento de pasarelas y ventas digitales para no afectar el efectivo físico.
- Registro de ingresos, egresos y conciliación bancaria.

**Datos que consume:** `cajas`, `gastos`, `ventas`
**Datos que produce:** `cajas`, `movimientosCaja`

---

### Módulo 12: Clientes y Cartera
**Archivo/Ruta target:** `src/views/ClientsView.tsx` | `src/views/clients/`
**SPEC:** `DOCS/SPECS/SPEC_CLIENTS.md`

**Responsabilidades:**
- CRUD de clientes con segmentación POS / B2B.
- Control de cartera (cuentas por cobrar), abonos y saldos a favor.
- Gestión de cupos de crédito, plazos de pago y vendedor asignado.
- Cruce contable automático de saldos a favor (Notas de Crédito) contra nuevas facturas.

**Datos que consume:** `clientes`, `cartera`
**Datos que produce:** `clientes`, `cartera`, `movimientosCartera`

---

### Módulo 13: CRM (Twenty CRM)
**Archivo/Ruta target:** `src/views/CRMView.tsx`
**SPEC:** `DOCS/SPECS/SPEC_CRM.md`

**Responsabilidades:**
- Sincronización bidireccional con Twenty CRM.
- Gestión de empresas, contactos y oportunidades comerciales B2B.

**Datos que consume:** API Twenty CRM
**Datos que produce:** API Twenty CRM

---

## 3. Contratos entre Módulos

Las siguientes son las vías de comunicación permitidas entre módulos:

| Módulo Origen | Módulo Destino | Contrato / Servicio |
|---|---|---|
| POS | Inventario y WMS | Lee `stock` y descarga existencias vía `inventoryService.registrarSalida()` |
| POS | Cajas y Flujo de Caja | Registra ingresos de venta y arqueos vía `cashService.registrarIngreso()` |
| Ventas B2B | Clientes y Cartera | Valida cupo de crédito del cliente vía `clientService.validarCupo()` |
| Ventas B2B | Inventario y WMS | Consulta stock y reserva unidades vía `inventoryService.reservarStock()` |
| Compras | Inventario y WMS | Incrementa stock y registra lotes vía `inventoryService.registrarIngresoCompra()` |
| Gastos | Cajas y Flujo de Caja | Descuenta efectivo si se paga de caja vía `cashService.registrarEgreso()` |
| Producción | Inventario y WMS | Descuenta MP y carga PT vía `inventoryService.procesarProduccion()` |
| Facturación | Ventas B2B | Lee pedido entregado; cambia estado a FACTURADO vía `ordersService.marcarFacturado()` |
| Nómina y RRHH | Gastos | Registra el costo de nómina como gasto operativo vía `expenseService.registrarGasto()` |
| Logística | Inventario y WMS | Reingresa devoluciones (Buen estado / Averías) vía `inventoryService.procesarDevolucion()` |
| Logística | Cajas y Flujo de Caja | Entrega recaudos de ruta vía `cashService.registrarRecaudoRuta()` |

> **Regla de arquitectura**: Los módulos no deben leer directamente de `localDb.ts` cruzando dominios. Deben usar las funciones de servicio del módulo dueño del dato.

---

## 4. Estructura de Servicios (Target)

```
src/
├── services/
│   ├── localDb.ts              ← Capa de persistencia (no modificar)
│   ├── posService.ts           ← Lógica de negocio del POS [CREAR]
│   ├── b2bService.ts           ← Lógica de negocio de Ventas B2B [CREAR]
│   ├── inventoryService.ts     ← Lógica de negocio del Inventario [CREAR]
│   ├── purchaseService.ts      ← Lógica de compras [CREAR]
│   ├── expenseService.ts       ← Lógica de gastos [CREAR]
│   ├── productionService.ts    ← Lógica de producción [CREAR]
│   ├── billingService.ts       ← Integración Siigo / Historial [CREAR]
│   ├── hrService.ts            ← RRHH/Nómina [CREAR]
│   ├── routeService.ts         ← Lógica de rutas y logística [CREAR]
│   ├── reportService.ts        ← Lógica de reportes consolidada [CREAR]
│   ├── cashService.ts          ← Lógica de cajas y arqueos [CREAR]
│   └── clientService.ts        ← CRUD de Clientes/Cartera [CREAR]
├── views/
│   ├── pos/                    ← Componentes del POS
│   ├── b2b/                    ← Componentes de Ventas B2B
│   ├── inventory/              ← Componentes del Inventario
│   ├── purchases/              ← Componentes de Compras
│   ├── expenses/               ← Componentes de Gastos
│   ├── production/             ← Componentes de Producción
│   ├── invoices/               ← Componentes de Facturación/Historial
│   ├── payroll/                ← Componentes de RRHH/Nómina
│   ├── logistics/              ← Componentes de Logística
│   ├── reports/                ← Componentes de Reportes
│   ├── cashflow/               ← Componentes de Caja y Flujo de Caja
│   ├── clients/                ← Componentes de Clientes/Cartera
│   └── crm/                    ← Componentes del CRM Twenty
├── types/
│   ├── pos.types.ts            ← Tipos del módulo POS
│   ├── inventory.types.ts      ← Tipos del módulo Inventario
│   ├── common.types.ts         ← Tipos compartidos
│   └── ...
└── tests/
    ├── pos.test.ts             ← Tests del POS
    ├── inventory.test.ts       ← Tests del Inventario
    └── ...
```

---

## 5. Fases de Migración a Supabase (Referencia Futura)

Esta fase NO es parte del desarrollo actual. Se documenta aquí únicamente como referencia.

| Fase | Acción |
|---|---|
| Fase Local (ACTUAL) | `localStorage` via `localDb.ts` |
| Fase Migración | Crear tabla Supabase → migrar función de servicio correspondiente → mantener `localDb.ts` como fallback |
| Fase Supabase Completo | Eliminar dependencia de `localStorage`; activar RLS y Realtime |

---

## 6. Entorno de Desarrollo y Ejecución

Para iniciar el servidor de desarrollo local, se utiliza:

```bash
pnpm dev
```

El servidor Vite se ejecuta por defecto en el puerto `3000`. Si dicho puerto ya está ocupado, Vite buscará y utilizará de forma automática el siguiente puerto disponible (por ejemplo, el puerto `3001`):

```text
Port 3000 is in use, trying another one...

  VITE v5.4.21  ready in 951 ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

