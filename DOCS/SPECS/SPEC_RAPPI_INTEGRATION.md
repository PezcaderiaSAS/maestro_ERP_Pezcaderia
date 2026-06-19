# SPEC-05: Integración con Rappi (Rappi Sync)

**Versión:** 1.0
**Fecha:** 2026-06-19
**Estado:** `APROBADO`
**Archivo actual:** `src/views/OrderKanbanView.tsx` (a integrar)

---

## Resumen Ejecutivo

Este módulo automatiza la recepción de pedidos de Rappi a través de webhooks. Procesa las notificaciones, valida la disponibilidad de stock, crea la factura en el POS de manera idempotente (evitando cobros duplicados) y descuenta el inventario de la bodega asignada de forma asíncrona, manteniendo el dinero contablemente aislado del efectivo físico de la caja.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/rappi.types.ts

export type EstadoIntegracion = 'PENDIENTE' | 'PROCESADO' | 'ERROR' | 'REVISION_MANUAL';

export interface LogIntegracionRappi {
  idLog: string;                  // UUID local
  idPedidoRappi: string;          // ID único enviado por Rappi (idempotency key)
  fechaRecepcion: string;         // ISO Date
  payloadJson: string;            // Payload completo recibido
  estado: EstadoIntegracion;
  idFacturaPos: string | null;    // Referencia a la venta si se procesó
  mensajeError: string | null;    // Mensaje descriptivo ante fallos
}

export interface LineaPedidoRappi {
  sku: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PedidoRappiPayload {
  id: string;
  cliente: {
    nombre: string;
    telefono: string;
  };
  items: LineaPedidoRappi[];
  total: number;
  metodoPago: string;
}
```

### 1.2 Input / Output

| Campo | Dirección | Clave localDb / Origen |
|---|---|---|
| Webhook payload | Entrada | API POST `/api/webhook/rappi/order` |
| Log Integración | Escritura | `logIntegracionRappi` |
| Venta POS | Escritura | `ventas` |
| Stock Bodega | Lectura/Escritura | `stock` |

---

## 2. Dominio (Reglas de Negocio)

**Reglas heredadas de `business_rules.md`:**
- `RN-01` — Stock nunca negativo (enrutar a revisión manual si falta stock)
- `RN-21` — Autenticación obligatoria de webhooks externos
- `RN-22` — Idempotencia estricta en webhooks
- `RN-23` — Procesamiento asíncrono vía cola de integración
- `RN-24` — Cancelaciones automáticas de integraciones (NC + reversión de stock)
- `RN-25` — Aislamiento contable de caja física

---

## 3. Flujo de la Feature

```
[Rappi API envía POST Webhook]
        │
        ▼
[Validar Token HMAC-SHA256 (RN-21)]
  ├── FALLO: Responder HTTP 401
  └── OK:
        │
        ▼
[Verificar Idempotencia (RN-22)]
  ├── ID ya existe en logs: Descartar, responder HTTP 202
  └── ID nuevo:
        │
        ▼
[Registrar en Log como PENDIENTE]
        │
        ▼
[Encolar petición asíncrona (RN-23)]
        │
        ▼
[Worker procesa secuencialmente]
  ├── Validar stock en bodega asignada (RN-01)
  │     ├── NO hay stock: estado = REVISION_MANUAL, notificar cajero
  │     └── SÍ hay stock:
  │             ├── Crear factura POS con medioPago: "Rappi" (RN-25)
  │             ├── Decrementar stock físico
  │             └── Actualizar log a PROCESADO
```

---

## 4. Plan de Refactoring

### Archivo actual
*   `src/views/OrderKanbanView.tsx` (Contendrá una pestaña "Integraciones Delivery")

### Estructura objetivo
```
src/views/delivery/
├── DeliveryMonitorView.tsx         ← Vista para auditar logs y errores
├── components/
│   ├── DeliveryLogTable.tsx        ← Tabla de logs de webhooks
│   ├── ManualReviewModal.tsx       ← Modal para resolver fallas de stock
│   └── IntegrationsSidebar.tsx     ← Acceso a estado del webhook
└── hooks/
    └── useDeliveryIntegration.ts   ← Estado de logs y filtros
src/services/
└── rappiIntegrationService.ts      ← Lógica de parsing, colas y transacciones
src/types/
└── rappi.types.ts                  ← Definición de interfaces
src/tests/
└── rappi.test.ts                   ← Mocks de webhooks y validaciones
```

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito

| ID Test | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-RAP-01 | Recepción y procesamiento exitoso | Pedido con stock, token válido | Factura creada, stock decrementado, log PROCESADO |
| T-RAP-02 | Evitación de duplicados (Idempotencia) | Re-envío de pedido procesado | Retorna HTTP 202, no duplica factura (RN-22) |
| T-RAP-03 | Cancelación de pedido | Evento cancelado para pedido procesado | Nota de crédito generada, stock retornado (RN-24) |

### 5.2 Casos de Error

| ID Test | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-RAP-E01 | Firma inválida | Webhook sin signature o manipulada | Retorna HTTP 401, no registra nada (RN-21) |
| T-RAP-E02 | Falta de stock | Pedido de 10 kg, stock de 2 kg | Log en REVISION_MANUAL, alerta en UI, no factura (RN-01) |

---

## 6. Dependencias

| Tipo | Nombre | Propósito |
|---|---|---|
| Servicio interno | `posService.ts` | Crear la factura en localDb |
| Servicio interno | `inventoryService.ts` | Validar y descontar stock |
| Configuración | `env.RAPPI_PAYMENT_METHOD_ID` | Código del método de pago contable |

---

## 7. Notas de Implementación

- Durante el desarrollo local, `vite.config.ts` utiliza un proxy `/api/pollinations/*` o `/api/webhook/rappi/*` para evitar bloqueos CORS del navegador.
- El arqueo de caja del cajero final debe excluir explícitamente el acumulador de `metodoPago === 'RAPPI'` para asegurar el cumplimiento de `RN-25`.
