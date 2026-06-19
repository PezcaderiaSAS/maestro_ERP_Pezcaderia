# SPEC-01: Módulo POS (Punto de Venta)

**Versión:** 1.0
**Fecha:** 2026-06-19
**Estado:** `APROBADO`
**Archivo actual:** `src/views/POSView.tsx` (132 KB — refactoring requerido)

---

## Resumen Ejecutivo

El módulo POS gestiona la venta directa en mostrador. Permite al cajero/operario seleccionar productos, leer el peso desde una balanza física, aplicar descuentos, registrar el pago y emitir el ticket impreso. Es el módulo de mayor uso operativo diario y el que tiene mayor impacto en la integridad del inventario.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/pos.types.ts

export interface LineaVenta {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;         // En kg para productos a granel, unidades para el resto
  unidad: 'KG' | 'UNIDAD';
  precioLista: number;
  descuentoPct: number;     // Descuento por línea en %
  precioFinal: number;      // precioLista * (1 - descuentoPct/100) — RN-06
  totalLinea: number;       // cantidad * precioFinal — RN-06
  esPesoManual: boolean;    // true si el peso se ingresó manualmente — RN-13
}

export interface VentaPOS {
  id: string;
  fecha: string;            // ISO 8601
  clienteId: string | null; // null = cliente genérico / mostrador
  cajeroId: string;
  lineas: LineaVenta[];
  subtotal: number;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totalFinal: number;       // subtotal - descuentoGlobalValor — RN-06
  formaPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO';
  requiereFacturaElectronica: boolean;
  estadoSiigo: 'NO_REQUERIDO' | 'PENDIENTE' | 'ENVIADO' | 'FALLIDO';
  idempotencyKey: string;   // UUID generado en frontend — RN-07
}

export interface ConfiguracionPOS {
  bodegaActivaId: string;
  cajaActivaId: string;
  puertoBalanza: string | null;
  puertoImpresora: string | null;
}

export interface ResultadoOperacion<T> {
  data: T | null;
  error: string | null;
}
```

### 1.2 Input (Datos que recibe)

| Dato | Tipo | Fuente | Obligatorio |
|---|---|---|---|
| Catálogo de productos | `Producto[]` | `localDb('productsCatalog')` | Sí |
| Stock por bodega | `StockBodega[]` | `localDb('stock')` | Sí |
| Cliente seleccionado | `Cliente \| null` | `localDb('clientes')` | No |
| Configuración POS | `ConfiguracionPOS` | `localDb('parametros')` | Sí |
| Peso desde balanza | `number` | Web Serial API | Condicional |

### 1.3 Output (Datos que produce)

| Dato | Tipo | Destino | Cuándo |
|---|---|---|---|
| Venta registrada | `VentaPOS` | `localDb('ventas')` | Al confirmar pago |
| Movimiento de stock | `Movimiento` | `localDb('movimientos')` | Al confirmar pago |
| Actualización cartera | `CarteraEntry` | `localDb('cartera')` | Si formaPago === 'CREDITO' |

---

## 2. Dominio (Reglas de Negocio)

**Reglas heredadas de `business_rules.md`:**
- `RN-01` — Stock nunca negativo (bloquear si no hay existencia suficiente)
- `RN-06` — Cálculo de descuentos por línea y global
- `RN-07` — Idempotencia: UUID por venta para evitar duplicados
- `RN-12` — Gaveta de dinero solo con pago confirmado o PIN admin
- `RN-13` — Lectura de balanza con fallback a entrada manual

**Reglas específicas del POS:**
```
DADO un producto de tipo GRANEL que se agrega al carrito
CUANDO el operario hace clic en "Leer Balanza"
ENTONCES:
  1. Se intenta leer el peso via Web Serial API (timeout: 3 segundos)
  2. ÉXITO: el peso se carga automáticamente en cantidad
  3. TIMEOUT/ERROR: alerta "Balanza no detectada", campo manual habilitado
  4. lineaVenta.esPesoManual = true si fue manual

DADO un carrito con líneas de venta
CUANDO el operario agrega/modifica cualquier línea o descuento
ENTONCES:
  El recálculo de subtotal/total es INMEDIATO (reactivo, sin botón "recalcular")
  totalFinal nunca puede ser <= 0 si hay productos en el carrito

DADO el intento de confirmar una venta
CUANDO el operario hace clic en "Cobrar"
ENTONCES:
  1. Validar: carrito no vacío
  2. Validar: stock disponible para cada línea (RN-01)
  3. Validar: totalFinal > 0 (RN-06)
  4. Generar idempotencyKey (UUID)
  5. Registrar VentaPOS en localDb('ventas')
  6. Registrar Movimiento de egreso en localDb('movimientos')
  7. Si CREDITO: actualizar localDb('cartera')
  8. Enviar comando ESC/POS a impresora (ticket)
  9. SOLO si pago == EFECTIVO o TRANSFERENCIA: enviar comando abrir gaveta (RN-12)
  10. Limpiar carrito
```

---

## 3. Flujo de la Feature

```
[Operario abre POS]
        │
        ▼
[Selecciona cliente (opcional)] → [Busca en catálogo por nombre/SKU]
        │
        ▼
[Agrega producto al carrito]
  ├── Si es GRANEL: botón "Leer Balanza"
  │       ├── ÉXITO: peso cargado automáticamente
  │       └── ERROR: campo manual habilitado
  └── Si es UNIDAD: campo de cantidad directo
        │
        ▼
[Aplica descuento por línea (opcional)] → [Recálculo inmediato]
        │
        ▼
[Aplica descuento global (opcional)] → [Recálculo inmediato]
        │
        ▼
[Selecciona forma de pago: EFECTIVO / TRANSFERENCIA / CREDITO]
        │
        ▼
[Clic "Cobrar"]
  ├── Validación STOCK (RN-01)
  │       └── FALLO: alerta, no procede
  ├── Validación TOTAL > 0 (RN-06)
  │       └── FALLO: alerta, no procede
  └── ÉXITO:
          ├── Registrar venta + movimiento
          ├── Imprimir ticket (ESC/POS)
          ├── Abrir gaveta si aplica (RN-12)
          └── Limpiar carrito → estado inicial
```

---

## 4. Plan de Refactoring

### Archivo actual
`src/views/POSView.tsx` — **132 KB** (estimado ~3,300 líneas)

### Estructura objetivo
```
src/views/pos/
├── POSView.tsx                     ← Orquestador (< 200 líneas)
├── components/
│   ├── ProductSearchPanel.tsx      ← Buscador + catálogo de productos
│   ├── CartPanel.tsx               ← Carrito con líneas de venta
│   ├── LineaVentaRow.tsx           ← Fila individual del carrito
│   ├── DiscountPanel.tsx           ← Descuentos globales y totales
│   ├── PaymentPanel.tsx            ← Métodos de pago y botón "Cobrar"
│   ├── BalanzaButton.tsx           ← Botón de lectura + lógica Web Serial
│   └── TicketPreview.tsx           ← Preview del ticket antes de imprimir
└── hooks/
    ├── usePOSCart.ts               ← Estado del carrito y cálculos (RN-06)
    ├── useBalanza.ts               ← Comunicación Web Serial con balanza
    └── usePOSPrinter.ts            ← Comunicación ESC/POS con impresora
src/services/
└── posService.ts                   ← registrarVenta(), validarStock(), etc.
src/types/
└── pos.types.ts                    ← Tipos del módulo (ver sección 1.1)
src/tests/
└── pos.test.ts                     ← Tests (ver sección 5)
```

### Orden de extracción (ejecutar en fases)
1. **Fase 1**: Extraer `pos.types.ts` — tipos e interfaces
2. **Fase 2**: Crear `posService.ts` — extraer funciones de negocio (sin JSX)
3. **Fase 3**: Crear `usePOSCart.ts` — extraer estado del carrito y cálculos
4. **Fase 4**: Extraer `PaymentPanel.tsx` y `DiscountPanel.tsx` (menor acoplamiento)
5. **Fase 5**: Extraer `BalanzaButton.tsx` y `useBalanza.ts`
6. **Fase 6**: Extraer `CartPanel.tsx` y `LineaVentaRow.tsx`
7. **Fase 7**: Extraer `ProductSearchPanel.tsx`
8. **Fase 8**: Simplificar `POSView.tsx` a orquestador puro

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito

| ID | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-POS-01 | Venta estándar con pago efectivo | 2 productos, 1.5 kg salmón, 1 un. trucha, efectivo | Venta registrada, stock decrementado, ticket impreso, gaveta abierta |
| T-POS-02 | Descuento por línea | Producto $10,000 con 10% descuento | precioFinal = $9,000, totalLinea correcto |
| T-POS-03 | Descuento global porcentual | Subtotal $50,000 con 5% global | totalFinal = $47,500 |
| T-POS-04 | Venta a crédito | Pedido a crédito, cliente con cartera | Venta registrada, cartera del cliente actualizada, gaveta NO se abre |
| T-POS-05 | Peso desde balanza exitoso | Lectura COM: "001.350 KG" | cantidad = 1.35, esPesoManual = false |

### 5.2 Casos de Error

| ID | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-POS-E01 | Stock insuficiente (RN-01) | Producto con 2 kg en stock, venta de 5 kg | Alerta "Stock insuficiente", venta NO registrada |
| T-POS-E02 | Carrito vacío al cobrar | Sin productos en carrito | Alerta "Agrega productos al carrito", botón Cobrar inhabilitado |
| T-POS-E03 | Descuento global > subtotal (RN-06) | Subtotal $10,000, descuento global $15,000 | Alerta "El descuento no puede superar el total", bloqueado |
| T-POS-E04 | Balanza desconectada (RN-13) | Puerto COM no disponible, timeout 3s | Alerta "Balanza no detectada", campo manual habilitado |
| T-POS-E05 | Venta duplicada (RN-07) | Mismo idempotencyKey enviado 2 veces | Segunda petición retorna la venta existente, no crea duplicado |

### 5.3 Casos de Carga

| ID | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-POS-S01 | Catálogo grande | 500 productos en catálogo | Búsqueda responde en < 200ms |
| T-POS-S02 | Carrito con muchas líneas | 50 líneas en un solo pedido | Recálculo de totales < 100ms |

---

## 6. Dependencias

| Tipo | Nombre | Propósito |
|---|---|---|
| Servicio interno | `localDb.ts` | Persistencia de ventas, stock |
| Servicio interno | `inventoryService.ts` | Validar y decrementar stock (RN-01) |
| Servicio interno | `clientService.ts` | Cargar cliente, actualizar cartera |
| API Browser | `Web Serial API` | Comunicación con balanza e impresora |
| Librería | `lucide-react` | Iconografía |

---

## 7. Notas de Implementación

- La lectura de la balanza (`useBalanza.ts`) debe manejar distintos formatos de string (ej: `"001.350 KG"`, `"1350g"`, `"  1.35  "`). El hook debe parsear y normalizar siempre a `number` en kilogramos.
- Los comandos ESC/POS para la impresora y la gaveta son comandos RAW que no deben mezclarse con la lógica de negocio. `usePOSPrinter.ts` es el único responsable de generarlos.
- El `idempotencyKey` debe generarse con `crypto.randomUUID()` (disponible en todos los navegadores modernos Chromium), no con librerías externas.
- Durante el refactoring, mantener `POSView.tsx` funcional en todo momento. Extraer un componente a la vez y validar que no se rompe antes de continuar con el siguiente.
