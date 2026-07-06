# SPEC-02: Módulo Ventas B2B

**Versión:** 1.0 | **Fecha:** 2026-06-20 | **Estado:** `APROBADO`
**Archivos actuales:** `OrderKanbanView.tsx`

---

## Resumen Ejecutivo

El módulo de Ventas B2B gestiona el ciclo comercial con clientes corporativos. Abarca la creación de pedidos por parte de los vendedores (con pesos y montos estimados), la validación de cupos de crédito, el alistamiento en bodega (con pesos reales), el despacho y la entrega. Se integra con los módulos de Inventario, Cartera, Logística y Facturación.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

Los tipos están definidos centralizadamente en `src/types/orders.types.ts`:

```typescript
export type EstadoPedido = 
  | 'CREADO' 
  | 'LISTO' 
  | 'EN_DESPACHO' 
  | 'ENTREGADO' 
  | 'FACTURADO' 
  | 'PAGADO' 
  | 'PAUSADO' 
  | 'PAUSADO_POR_CREDITO' 
  | 'ANULADO';

export interface LineaPedido {
  productoId: string;
  cantidadSolicitada: number;
  cantidadAlistada: number; // o null si no se ha alistado
  precioPactado: number;
  totalLinea: number;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  fecha: string;
  origen: 'VISITA' | 'RAPPI' | 'TELEFONO';
  clienteId: string;
  bodegaId: string;
  vendedorId: string;
  formaPago: 'CONTADO' | 'CREDITO';
  tipoEntrega: 'EN_RUTA' | 'RECOGE';
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
  facturacionElectronica: boolean;
  idSiigo: string | null;
}
```

### 1.2 Input / Output

| Dato | Dirección | Clave localDb |
|---|---|---|
| Pedidos | Lectura + Escritura | `quotations` |
| Clientes | Solo Lectura | `clientes` |
| Stock | Solo Lectura (validar) | `stock` |
| Movimientos | Escritura | `movimientos` |

---

## 2. Reglas de Negocio

**RN-04 (Máquina de estados unidireccional B2B):**
El flujo aprobado es: `CREADO → LISTO → EN_DESPACHO → ENTREGADO → FACTURADO → PAGADO`. Retrocesos bloqueados.

**RN-18 (Diferencia de peso):**
Al confirmar el alistamiento (pasar a `LISTO`), se capturan los pesos reales. Si la diferencia frente a la `cantidadSolicitada` es > 5%, el estado cambia automáticamente a `PAUSADO` esperando revisión administrativa.

**RN-33 (Cupo de Crédito):**
Al intentar crear un pedido, o al actualizar pesos, se debe validar que el saldo pendiente de la cartera del cliente + el valor del nuevo pedido <= cupo de crédito asignado. Si se excede, el pedido entra en `PAUSADO_POR_CREDITO`.

**RN-05 (Facturación POST-alistamiento):**
Solo se puede facturar (y emitir factura electrónica Siigo) un pedido cuando se cuenta con los pesos reales. Según la nueva regla, la facturación ocurre desde el estado `ENTREGADO`.

---

## 3. Flujo de la Feature

### Flujo Principal
1. **[Vendedor crea pedido]:** Se crea cotización con cantidades solicitadas (estimadas). Se valida RN-33 (cupo). Estado: `CREADO` (o `PAUSADO_POR_CREDITO`).
2. **[Alistamiento en Bodega]:** Bodeguero ajusta cantidades a pesos reales y confirma. Se evalúa RN-18 (tolerancia 5%). Si pasa: Estado `LISTO`. Si no: `PAUSADO`. **Aquí se descuenta el stock (salida por alistamiento).**
3. **[Despacho]:** Logística asigna el pedido a una ruta. Estado: `EN_DESPACHO`.
4. **[Entrega]:** Conductor marca la entrega como realizada. Estado: `ENTREGADO`.
5. **[Facturación]:** Administrativo genera factura o tiquete según configuración del cliente. Estado: `FACTURADO`.
6. **[Recaudo/Cartera]:** Cuando el saldo de la factura queda en cero (ya sea por pago contado reportado en liquidación o pago a crédito reportado en abonos). Estado: `PAGADO`.

---

## 4. Plan de Refactoring

### Archivo actual
- `OrderKanbanView.tsx` — Vista monolítica actual con lógica embebida.

### Estructura objetivo
```
src/views/b2b/
├── OrderKanbanView.tsx       ← Orquestador, conecta b2bService a la UI
├── components/
│   ├── PedidoColumn.tsx      ← Columna del Kanban por estado
│   ├── PedidoCard.tsx        ← Tarjeta individual de pedido
│   ├── NuevoPedidoForm.tsx   ← Formulario de creación
│   └── AlistamientoModal.tsx ← Modal para registrar pesos reales
└── hooks/
    └── useB2BOrders.ts       ← Estado de pedidos B2B

src/services/
└── b2bService.ts             ← Lógica de negocio de la máquina de estados
```

### Orden de ejecución
1. Implementar `b2bService.ts` completo (crear, cambiarEstado, confirmarAlistamiento).
2. Refactorizar `OrderKanbanView.tsx` para usar las nuevas columnas correspondientes a `EstadoPedido`.
3. Conectar los modales de creación y alistamiento a los métodos de `b2bService.ts`.

---

## 5. Criterios de Validación (Tests)

### Éxito
| ID | Escenario | Resultado esperado |
|---|---|---|
| T-B2B-01 | Crear pedido con saldo suficiente | Estado `CREADO` |
| T-B2B-02 | Alistar con variación de peso <= 5% | Estado `LISTO`, stock decrementado |
| T-B2B-03 | Cambiar estado `LISTO` a `EN_DESPACHO` | Estado actualizado con éxito |
| T-B2B-04 | Pago completo de la factura | Estado `PAGADO` |

### Error
| ID | Escenario | Resultado esperado |
|---|---|---|
| T-B2B-E01 | Crear pedido que excede cupo | Estado `PAUSADO_POR_CREDITO` |
| T-B2B-E02 | Alistar con variación > 5% | Estado `PAUSADO`, retención hasta admin bypass |
| T-B2B-E03 | Transición inválida (`LISTO` a `CREADO`) | Error: Transición no permitida |
