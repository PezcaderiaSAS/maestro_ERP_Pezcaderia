# SPEC-08: Gestión de Caja, Control de Turnos y Mitigación de NaN

**Versión:** 1.0  
**Fecha:** 2026-07-03  
**Estado:** `BORRADOR`  
**Autor:** Antigravity  
**Relacionado con SPEC:** SPEC-01 (Módulo POS)

---

## Resumen Ejecutivo

Este requerimiento tiene como objetivo solucionar un fallo crítico de software en el Punto de Venta (POS) donde la propagación de valores matemáticos inválidos (`NaN`) bloquea completamente el procesamiento de pagos. Para prevenir pérdidas financieras y asegurar una auditoría estricta, incorporamos una arquitectura de **Caja, Control de Turnos y Conciliación**, condicionando la vista del POS al estado de un Turno de Caja Activo.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/caja.types.ts

export type EstadoTurno = 'ABIERTA' | 'EN_CUADRE' | 'CERRADA' | 'BLOQUEADA';
export type TipoCaja = 'MAYOR' | 'MENOR';

export interface Caja {
  id: string;
  nombre: string;
  bodegaId: string; // Relación jerárquica con Bodega
  tipo: TipoCaja;
  saldoActual: number;
  activa: boolean;
  creadoEn: string;
}

export interface Turno {
  id: string;
  cajaId: string;
  usuarioId: string;
  estado: EstadoTurno;
  saldoApertura: number;
  saldoCierre?: number;
  fechaApertura: string;
  fechaCierre?: string;
  arqueoEfectivo?: number;
  arqueoTransferencia?: number;
  arqueoTarjeta?: number;
  diferencia?: number;
  observaciones?: string;
}

export interface TransaccionCaja {
  id: string;
  turnoId: string;
  cajaId: string;
  usuarioId: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'MIXTO';
  categoria: 'VENTA_POS' | 'APERTURA' | 'CIERRE' | 'EGRESO_RUTA' | 'AJUSTE';
  referenciaId?: string; // ID del Pedido/Venta o Gasto
  descripcion: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuarioId: string;
  accion: string; // 'APERTURA_TURNO', 'CIERRE_TURNO', 'BLOQUEO_TURNO', 'AJUSTE_CAJA'
  detalles: any;
}
```

### 1.2 Input (Datos que recibe)

| Campo | Tipo | Fuente | Obligatorio |
|---|---|---|---|
| Cajas del Sistema | `Caja[]` | `localDb('cajas')` | Sí |
| Turnos Registrados | `Turno[]` | `localDb('turnos')` | Sí |
| Sesión de Usuario Activo | `{ id: string, role: string }` | Estado Global / Auth context | Sí |
| Datos de Pago en POS | `{ cash: number, transfer: number, card: number }` | Vista Pago POS | Sí |

### 1.3 Output (Datos que produce)

| Campo | Tipo | Destino | Cuándo |
|---|---|---|---|
| Registro de Turno (Apertura/Cierre) | `Turno` | `localDb('turnos')` | Al abrir o cerrar turno |
| Transacción de Caja | `TransaccionCaja` | `localDb('transacciones_caja')` | Al procesar cobro POS u egresos |
| Registro de Auditoría | `AuditLog` | `localDb('audit_logs')` | Tras cambios de estado sensibles |

---

## 2. Dominio (Reglas de Negocio aplicables)

**Reglas de negocio específicas del requerimiento:**

*   **RN-CAJA-01: Ciclo de Vida del Turno (Máquina de Estados)**:
    Un turno transiciona por los estados: `CERRADA` -> `ABIERTA` -> `EN_CUADRE` -> `CERRADA`. Si se detectan inconsistencias graves o a petición manual, la caja puede pasar a `BLOQUEADA`.
*   **RN-CAJA-02: Bloqueo de Operación POS sin Turno**:
    Si la API o base de datos local confirma que el usuario activo no tiene un turno con estado `ABIERTA` asignado a su caja, la vista del POS se bloquea por completo y muestra una pantalla para "Apertura de Turno".
*   **RN-CAJA-03: Relación Jerárquica y de Negocio**:
    `Bodega` -> `Caja` -> `Turno`. Los cobros deben impactar la caja asignada al turno activo de la bodega en la que el usuario está logueado.
*   **RN-CAJA-04: RBAC (Roles de Cajas)**:
    *   Rol `cajero` solo puede operar cajas de tipo `MENOR` y en bodegas secundarias asignadas.
    *   Rol `admin` o `administrativo` puede operar cajas `MAYOR` en la bodega principal y realizar cuadres, arqueos o desbloqueo de cajas.
*   **RN-CAJA-05: Transacciones Atómicas (Simulación ACID)**:
    La apertura de turno (creación del registro de turno, cambio de estado de caja a activa y saldo de apertura inicial) debe ejecutarse bajo una transacción atómica. Si falla un paso, no se confirma el inicio de turno.
*   **RN-POS-NAN: Sanitización de Totales y Variables**:
    Todo cálculo numérico en el carrito (precio unitario, descuento, subtotal, total) debe forzar la conversión de tipos (`Number(...) || 0`) para garantizar que la interfaz nunca propague valores `NaN` o rompa el flujo de caja.

---

## 3. Flujo de la Feature

```
[Usuario accede a POS]
         │
         ▼
[Sistema busca Turno ACTIVO para el usuario]
         ├── NO EXISTE / CERRADO: 
         │       └── Redirigir a "Apertura de Turno" -> Ingresar Saldo Inicial -> Iniciar Turno (ACID)
         └── ABIERTO:
                 └── Cargar catálogo del POS
                         │
                         ▼
                 [Agregar productos] -> Validar tipo numérico -> Calcular Subtotal (sin NaN)
                         │
                         ▼
                 [Formulario Cobro POS] -> Mostrar Faltante (sin NaN) -> Clic "Liquidar"
                         │
                         ▼
                 [Registrar Venta (localDb)]
                   ├── Descontar Stock
                   ├── Crear TransaccionCaja (INGRESO)
                   └── Registrar log de auditoría
```

---

## 4. Plan de Implementación (Componentes)

### Archivos Nuevos y Modificados

#### [NEW] [cajaService.ts](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/services/cajaService.ts)
*   Contiene funciones de negocio atómicas para `abrirTurno()`, `cerrarTurno()`, `cuadrarCaja()` y `registrarMovimientoCaja()`.
*   Implementa validaciones RBAC y atómicas en localDB.

#### [NEW] [CajaTurnoPanel.tsx](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/views/pos/components/CajaTurnoPanel.tsx)
*   Interfaz de Apertura / Cuadre / Cierre de Turno.
*   Formulario para ingresar base de efectivo inicial, arqueo final y comentarios.

#### [MODIFY] [POSView.tsx](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/views/POSView.tsx)
*   Incorpora el condicional del estado del Turno. Si no está abierto, bloquea el POS y renderiza `<CajaTurnoPanel />`.
*   Sanitiza variables antes de mostrarlas en el checkout para evitar NaN.

#### [MODIFY] [posService.ts](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/services/posService.ts)
*   Asegura conversión estricta con `Number` en `calcularTotalLinea` y `calcularTotalesPedido`.

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-CAJA-01 | Apertura de turno exitosa | Cajero, Caja Menor, Base $100.000 | Turno en estado ABIERTA, caja marcada, log de auditoría registrado. |
| T-POS-NAN-01 | Sanitización de precio indefinido | Producto con precio `null` | Muestra `$0` en lugar de `$NaN`, subtotal recalcula de forma segura. |
| T-CAJA-02 | Cobro POS impacta caja | Venta de $50.000 en efectivo | Saldo actual de la Caja POS incrementa en $50.000, crea transacción. |

### 5.2 Casos de Error

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-CAJA-E01 | Operar POS sin turno activo | Usuario sin turno en localDB | Interfaz de POS bloqueada, redirección a apertura de turno. |
| T-CAJA-E02 | Violación RBAC en Caja Mayor | Cajero intentando abrir Caja Mayor | Error "Acceso denegado: permisos insuficientes para esta caja". |

---

## 6. Dependencias

| Tipo | Nombre | Propósito |
|---|---|---|
| Servicio interno | `localDb.ts` | Almacenamiento persistente simulado de Cajas y Turnos. |
| Librería | `sweetalert2` | Modales interactivos de confirmación de arqueos y cierre. |

---

## 7. Notas de Implementación

- **Simulación ACID**: Como la persistencia es local (`localStorage`), la atomicidad se garantiza mediante bloques `try-catch` que guardan el estado anterior de la base de datos y lo restauran si se lanza alguna excepción antes del guardado final (rollback simulado).
