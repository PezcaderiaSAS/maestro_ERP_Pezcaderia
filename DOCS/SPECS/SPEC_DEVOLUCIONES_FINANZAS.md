# SPEC-06: Devoluciones y Conciliación Contable B2B

**Versión:** 1.0
**Fecha:** 2026-06-19
**Estado:** `APROBADO`
**Archivo actual:** `src/views/ARView.tsx` (a integrar)

---

## Resumen Ejecutivo

Este módulo gestiona el ciclo de vida contable y físico de las devoluciones de producto por parte de clientes B2B. Abarca el ingreso de mercancía a bodega (clasificando en apto o merma), la generación de saldos a favor en cartera del cliente y la emisión y cruce automático de Notas de Crédito (NC) al facturar nuevas transacciones.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/devoluciones.types.ts

export type EstadoDevolucion = 'RECIBIDA_BODEGA' | 'VALIDADA_FINANZAS' | 'ANULADA';
export type EstadoMercancia = 'BUEN_ESTADO' | 'AVERIA' | 'CUARENTENA';

export interface DevolucionB2B {
  id: string;
  pedidoOriginalId: string;
  clienteId: string;
  fechaRegistro: string;          // ISO Date
  estado: EstadoDevolucion;
  lineas: LineaDevolucionB2B[];
  subtotal: number;
  ivaTotal: number;
  totalDevolucion: number;       // Valor neto a favor del cliente
  notaCreditoId: string | null;  // Asignado cuando pasa a VALIDADA_FINANZAS
}

export interface LineaDevolucionB2B {
  productoId: string;
  cantidadDevuelta: number;      // Peso real devuelto
  precioPactado: number;         // Copiado de la factura original
  estadoMercancia: EstadoMercancia;
  motivoDevolucion: string;
}

export interface NotaCredito {
  id: string;                    // Formato: NC-XXXXXX
  devolucionId: string;
  clienteId: string;
  fechaEmision: string;
  valor: number;
  estadoSiigo: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO';
}
```

### 1.2 Input / Output

| Campo | Dirección | Clave localDb / Destino |
|---|---|---|
| Pedidos | Lectura | `quotations` / `ventas` |
| Devoluciones | Lectura/Escritura | `devoluciones` |
| Cartera Cliente | Escritura | `cartera` |
| Movimientos Stock | Escritura | `movimientos` |

---

## 2. Dominio (Reglas de Negocio)

**Reglas heredadas de `business_rules.md`:**
- `RN-11` — Devolución genera nota de crédito atómica
- `RN-16` — Reingreso condicional de devoluciones físicas
- `RN-17` — Saldo a favor automático en cartera
- `RN-19` — Cruce contable de saldos a favor

---

## 3. Flujo de la Feature

```
[Conductor retorna con mercancía]
        │
        ▼
[Jefe Bodega recibe y clasifica]
  ├── Registra cantidad y estado de mercancía (BUEN_ESTADO / AVERIA)
  └── Confirma → Estado: RECIBIDA_BODEGA
        │
        ├─────────────────────────────────────────┐
        ▼ (RN-16)                                 ▼ (RN-17)
[Actualizar stock físico]                 [Calcular valor total]
  ├── BUEN_ESTADO -> Bodega Principal       └── Inyectar saldo a favor en
  └── AVERIA/CUARENTENA -> Bodega Averías       cartera del cliente
        │
        ▼
[Admin realiza nueva facturación B2B]
        │
        ▼
[Cruzar saldos a favor disponibles (RN-19)]
  ├── Aplicar total a favor como descuento de factura
  ├── Generar Nota de Crédito NC-XXXXXX
  ├── Cambiar estado devolución -> VALIDADA_FINANZAS
  └── Registrar bitácora para sincronización Siigo (evento)
```

---

## 4. Plan de Refactoring

### Archivo actual
*   `src/views/ARView.tsx` (Contiene actualmente cuentas por cobrar y facturación administrativa)

### Estructura objetivo
```
src/views/ar/
├── AccountsReceivableView.tsx      ← Orquestador de cartera y cobros
├── components/
│   ├── ClientCreditStatus.tsx      ← Indicador de límite de crédito y cartera
│   ├── DevolutionReceiver.tsx      ← Panel para recibir mercancía en bodega
│   ├── SalesCreditConnector.tsx    ← Selector de saldos a favor en facturación
│   └── CreditNotesList.tsx         ← Historial de notas de crédito
└── hooks/
    ├── useAccountsReceivable.ts    ← Hook de cartera y cobros
    └── useDevolutions.ts           ← Hook de devoluciones
src/services/
└── arService.ts                    ← Lógica de saldos a favor, NC y cupos (RN-20)
src/types/
└── ar.types.ts
src/tests/
└── ar.test.ts                      ← Tests del cruce de saldos
```

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito

| ID Test | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-AR-01 | Reingreso en buen estado | 10 kg en buen estado | Stock bodega principal += 10, saldo cartera inyectado (RN-16) |
| T-AR-02 | Cruce contable completo | Factura de $500k, saldo favor $100k | Neto factura = $400k, estado devolución VALIDADA_FINANZAS, NC creada |

### 5.2 Casos de Error

| ID Test | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-AR-E01 | Cupo de crédito excedido | Deuda propuesta = $2M, Cupo = $1.5M | Transacción bloqueada con error descriptivo (RN-20) |
| T-AR-E02 | Reingreso con cantidad <= 0 | Devolución de -5 kg | Error de validación en formulario, no se guarda nada |

---

## 6. Dependencias

| Tipo | Nombre | Propósito |
|---|---|---|
| Servicio interno | `localDb.ts` | Almacenamiento de datos |
| Servicio interno | `inventoryService.ts` | Actualizar el stock al ingresar devoluciones |

---

## 7. Notas de Implementación

- Toda aplicación de saldo a favor y creación de Nota de Crédito debe generar un evento inmutable registrado en el log del sistema mediante `publishEvent('METADATA_CONFIGURED', ...)` para auditorías contables posteriores.
