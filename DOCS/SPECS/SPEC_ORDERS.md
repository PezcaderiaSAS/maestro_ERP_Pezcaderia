# SPEC-03: Módulo Pedidos / Logística

**Versión:** 1.0 | **Fecha:** 2026-06-19 | **Estado:** `APROBADO`
**Archivos actuales:** `OrderKanbanView.tsx` + `ARView.tsx`

---

## Resumen Ejecutivo

El módulo de Pedidos/Logística gestiona el ciclo completo de un pedido B2B: desde la cotización inicial con pesos estimados, pasando por el alistamiento en bodega con pesos reales, hasta la entrega en ruta y la liquidación del recaudo. Es el flujo operativo central del negocio de distribución.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/orders.types.ts

export type EstadoPedido =
  | 'CREADO'
  | 'ALISTADO'
  | 'FACTURADO'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'ANULADO';

export interface Pedido {
  id: string;
  numeroPedido: string;          // Formato: PED-XXXXXX
  fecha: string;
  origen: 'VISITA' | 'LLAMADA' | 'WHATSAPP' | 'POS';
  clienteId: string;
  bodegaId: string;
  vendedorId: string;
  formaPago: 'CREDITO' | 'CONTADO';
  tipoEntrega: 'EN_RUTA' | 'INMEDIATA' | 'RECOGEN';
  fechaEntrega: string;
  jornada: 'MANANA' | 'TARDE';
  estado: EstadoPedido;
  observaciones: string;
  lineas: LineaPedido[];
  subtotal: number;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totalFinal: number;
  idempotencyKey: string;
  rutaId: string | null;
}

export interface LineaPedido {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidadSolicitada: number;      // Peso estimado al crear el pedido
  cantidadAlistada: number | null; // Peso real al alistar en bodega
  precioLista: number;
  descuentoPct: number;
  precioFinal: number;
  totalLinea: number;
}

export interface Ruta {
  id: string;
  numeroRuta: string;
  fecha: string;
  conductorId: string;
  vehiculoId: string;
  estado: 'CREADA' | 'EN_TRANSITO' | 'LIQUIDADA' | 'ANULADA';
  pedidos: string[];              // IDs de pedidos asignados
  totalRecaudoEsperado: number;
  totalRecaudoReal: number | null;
  gastosRuta: GastoRuta[];
  diferencia: number | null;
  justificacionDiferencia: string | null;
}

export interface GastoRuta {
  id: string;
  rutaId: string;
  concepto: string;
  valor: number;
  fotoSoporte: string | null;
}

export interface Devolucion {
  id: string;
  pedidoId: string;
  rutaId: string;
  lineas: LineaDevolucion[];
  fecha: string;
  notaCreditoId: string | null;
}

export interface LineaDevolucion {
  productoId: string;
  cantidadDevuelta: number;
  motivo: string;
  estadoMercancia: 'BUEN_ESTADO' | 'AVERIA' | 'CUARENTENA';
}

export interface ResultadoOperacion<T> {
  data: T | null;
  error: string | null;
}
```

### 1.2 Input / Output

| Dato | Dirección | Clave localDb |
|---|---|---|
| Pedidos (cotizaciones) | Lectura + Escritura | `quotations` |
| Clientes | Solo Lectura | `clientes` |
| Stock | Solo Lectura (validar) | `stock` |
| Cartera | Lectura + Escritura | `cartera` |
| Movimientos | Solo Escritura | `movimientos` |
| Devoluciones | Lectura + Escritura | `devoluciones` |
| Conductores | Solo Lectura | `conductores` |

---

## 2. Reglas de Negocio

**Heredadas:** `RN-04` (estados unidireccionales), `RN-05` (factura solo desde ALISTADO), `RN-06` (cálculo de descuentos), `RN-07` (idempotencia), `RN-10` (cierre ruta con cuadre), `RN-11` (devolución atómica)

**Específicas:**
```
DADO transición de estado de un pedido
ENTONCES aplicar tabla de transiciones válidas:
  CREADO → ALISTADO (solo con pesos reales confirmados)
  ALISTADO → FACTURADO
  FACTURADO → EN_RUTA (al asignar a una ruta)
  EN_RUTA → ENTREGADO (conductor confirma entrega)
  CREADO | ALISTADO → ANULADO
  Cualquier otra transición: BLOQUEADA

DADO alistamiento de un pedido en bodega
CUANDO el jefe de bodega confirma el alistamiento
ENTONCES:
  Por cada línea: cantidadAlistada debe ser > 0
  cantidadAlistada puede diferir de cantidadSolicitada
  La factura se generará con cantidadAlistada (peso real)
  Se descuenta el stock con cantidadAlistada, NO cantidadSolicitada

DADO asignación de pedidos a una ruta
CUANDO el coordinador confirma la ruta
ENTONCES:
  Solo pedidos en estado FACTURADO pueden ser asignados
  Al asignar: pedido.estado → EN_RUTA
  pedido.rutaId = ruta.id
```

---

## 3. Flujo de la Feature

### Flujo Principal: Cotización → Entrega
```
[Vendedor crea pedido] → estado: CREADO
  - Cliente, bodega, productos con cantidades estimadas, forma pago, fecha entrega

[Bodega recibe alerta] → Módulo Alistamiento
  - Jefe bodega ajusta cantidades reales
  - Confirma → estado: ALISTADO

[Facturación] → estado: FACTURADO
  - Se genera factura con pesos reales
  - Si requiere Siigo → solicitud a billingService

[Logística asigna ruta]
  - Coordinador asigna pedidos FACTURADOS a Conductor + Vehículo
  - pedido.estado → EN_RUTA

[Conductor entrega]
  - Confirma entrega conforme → estado: ENTREGADO
  - Devolución parcial → RN-11 (atómico)

[Liquidación de ruta] → RN-10
  - Conductor informa recaudo + gastos
  - Admin valida, justifica diferencias si hay
  - Ruta.estado → LIQUIDADA
```

---

## 4. Plan de Refactoring

### Archivos actuales
- `OrderKanbanView.tsx` — Vista Kanban de pedidos
- `ARView.tsx` — Logística y rutas

### Estructura objetivo
```
src/views/orders/
├── OrdersView.tsx                ← Orquestador principal (< 200 líneas)
├── components/
│   ├── PedidoKanban.tsx          ← Vista Kanban por estados
│   ├── PedidoCard.tsx            ← Tarjeta de pedido en Kanban
│   ├── PedidoForm.tsx            ← Crear/editar cotización
│   ├── AlistamientoModal.tsx     ← Confirmar pesos reales
│   ├── RutaBoard.tsx             ← Asignación de pedidos a rutas
│   ├── ConductorRoute.tsx        ← Vista del conductor (móvil)
│   ├── DevolucionForm.tsx        ← Registro de devoluciones (RN-11)
│   └── LiquidacionModal.tsx      ← Liquidación de ruta (RN-10)
└── hooks/
    ├── useOrders.ts              ← Estado de pedidos
    ├── useRutas.ts               ← Estado de rutas
    └── useDevolucion.ts          ← Lógica de devoluciones
src/services/
└── ordersService.ts             ← Lógica de negocio pura
src/types/
└── orders.types.ts
src/tests/
└── orders.test.ts
```

### Orden de extracción
1. Tipos → `orders.types.ts`
2. Lógica pura → `ordersService.ts` (especialmente transiciones de estado)
3. `PedidoCard.tsx` (componente simple)
4. `AlistamientoModal.tsx` (flujo crítico aislado)
5. `DevolucionForm.tsx` + `useDevolucion.ts`
6. `LiquidacionModal.tsx` + lógica RN-10
7. `PedidoKanban.tsx` completo
8. `RutaBoard.tsx` + `ConductorRoute.tsx`

---

## 5. Criterios de Validación (Tests)

### Éxito

| ID | Escenario | Resultado esperado |
|---|---|---|
| T-ORD-01 | Crear pedido CREADO | Pedido con numeroPedido generado, estado CREADO |
| T-ORD-02 | Alistar pedido (CREADO → ALISTADO) | Estado actualizado, cantidades reales registradas |
| T-ORD-03 | Facturar pedido alistado (ALISTADO → FACTURADO) | Estado actualizado, stock decrementado con pesos reales |
| T-ORD-04 | Asignar pedido a ruta | pedido.estado = EN_RUTA, pedido.rutaId asignado |
| T-ORD-05 | Liquidación con cuadre exacto (RN-10) | Ruta cerrada automáticamente como LIQUIDADA |

### Error

| ID | Escenario | Resultado esperado |
|---|---|---|
| T-ORD-E01 | Facturar pedido en estado CREADO (RN-05) | BLOQUEADO: "El pedido debe estar ALISTADO para facturar" |
| T-ORD-E02 | Retroceder estado FACTURADO → ALISTADO (RN-04) | BLOQUEADO: "Transición de estado no permitida" |
| T-ORD-E03 | Liquidar ruta con faltante sin justificación (RN-10) | BLOQUEADO: "Ingrese justificación del faltante de ${diferencia}" |
| T-ORD-E04 | Devolución sin reingreso a inventario (RN-11) | Operación solo válida como transacción completa |

---

## 6. Notas de Implementación

- `ordersService.cambiarEstado(pedidoId, nuevoEstado)` es la única función que cambia el estado de un pedido. Debe validar la tabla de transiciones antes de ejecutar.
- Al alistar un pedido, el stock se descuenta con `cantidadAlistada`, no con `cantidadSolicitada`. Esta es la diferencia crítica entre cotización y factura.
- Las devoluciones (RN-11) deben ejecutarse en una sola transacción que incluya: stock, cartera y nota de crédito. Si alguna falla, todo se revierte.
- La liquidación de ruta calcula: `balance_teorico = SUM(pedidos CONTADO ENTREGADOS) - gastos_ruta`. Si `recaudo_fisico != balance_teorico`, exigir justificación.
