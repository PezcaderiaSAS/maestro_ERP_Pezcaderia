# SPEC-11: Módulo de Cajas (CashFlow)

**Versión:** 1.0 | **Fecha:** 2026-06-20 | **Estado:** `APROBADO`
**Archivos actuales:** Nuevos (`cashService.ts`, `CashFlowView.tsx`)

---

## Resumen Ejecutivo

El módulo de Cajas (CashFlow) administra de forma estricta la entrada y salida de efectivo en la operación diaria. Soporta una arquitectura **Multi-Caja** (hasta 3 cajas operando simultáneamente por bodega). Introduce el concepto de `TurnoCaja` para auditar sesiones individuales de cajeros, y permite **traslados de dinero** entre cajas y/o bodegas (ej. de la caja POS a la caja principal administrativa).

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript (`src/types/cash.types.ts`)

```typescript
import { Auditable } from './common.types';

export type EstadoTurno = 'ABIERTO' | 'CERRADO' | 'AUDITADO';

export type TipoMovimientoCaja = 
  | 'INGRESO_VENTA' 
  | 'INGRESO_ABONO' 
  | 'INGRESO_TRASLADO' 
  | 'EGRESO_GASTO' 
  | 'EGRESO_TRASLADO' 
  | 'AJUSTE_SOBRANTE' 
  | 'AJUSTE_FALTANTE';

export type MetodoPago = 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA';

export interface Caja {
  id: string;
  bodegaId: string;
  nombre: string;         // Ej: "Caja Principal", "Caja POS 1"
  activa: boolean;
}

export interface TurnoCaja extends Auditable {
  id: string;
  cajaId: string;
  cajeroId: string;
  fechaApertura: string;
  fechaCierre: string | null;
  baseInicial: number;
  
  saldoTeoricoGlobal: number; // Suma de todos los medios
  totalEfectivo: number;      // baseInicial + ingresos EFECTIVO - egresos EFECTIVO
  totalDatafono: number;
  totalTransferencias: number;
  
  saldoFisicoEfectivo: number | null; // Lo que cuenta el cajero en billetes
  diferenciaEfectivo: number | null;  // saldoFisicoEfectivo - totalEfectivo
  
  estado: EstadoTurno;
  justificacion: string | null; // Requerido si diferenciaEfectivo != 0
}

export interface MovimientoCaja extends Auditable {
  id: string;
  turnoId: string;
  cajaId: string; // Redundancia útil para consultas rápidas
  tipo: TipoMovimientoCaja;
  metodoPago: MetodoPago;
  monto: number;
  concepto: string;
  referenciaId: string | null; // Ej: ID de Venta, ID de Traslado
}

export interface TrasladoDinero extends Auditable {
  id: string;
  cajaOrigenId: string;
  cajaDestinoId: string;
  metodoPago: MetodoPago;
  monto: number;
  estado: 'COMPLETADO';
  concepto: string;
}
```

### 1.2 Input / Output

| Dato | Dirección | Clave localDb |
|---|---|---|
| Cajas y Turnos | Lectura/Escritura | `cajas` |
| Movimientos | Lectura/Escritura | `movimientosCaja` |
| Bodegas | Solo Lectura | N/A (Hardcoded o `parametros`) |

---

## 2. Reglas de Negocio

**RN-10 (Arqueo y Cierre de Caja):**
Al realizar el cierre, el sistema exige ingresar el efectivo físico. Esto se compara **únicamente** con el `totalEfectivo`. Los saldos digitales (`totalDatafono`, `totalTransferencias`) se asumen conciliados por banco. Si hay diferencia en efectivo, se genera un movimiento automático de `AJUSTE_FALTANTE` o `AJUSTE_SOBRANTE` y se exige una `justificacion`.

**RN-56 (Traslados Inter-caja):**
El traslado de dinero es atómico. Crea dos movimientos simultáneos: un `EGRESO_TRASLADO` en el turno origen y un `INGRESO_TRASLADO` en el turno destino. Ambos turnos deben estar en estado `ABIERTO`. **El usuario puede elegir el método de pago del traslado**, validando que existan fondos suficientes en ese rubro específico (`totalEfectivo`, `totalDatafono`, o `totalTransferencias`).

**RN-57 (Restricción de Operación POS):**
El módulo POS o B2B solo puede registrar pagos si existe un `TurnoCaja` `ABIERTO` asociado a la bodega activa y al usuario actual.

**RN-58 (Desglose de Medios de Pago):**
Todo movimiento transaccional debe declarar su `metodoPago`. La caja debe mostrar en tiempo real al usuario un Dashboard desglosando exactamente cuánto dinero teórico tiene por cada medio para detectar descuadres durante su jornada.

---

## 3. Flujo de la Feature

1. **[Apertura de Turno]:** El cajero selecciona su Caja (Ej. "Bodega Norte - Caja POS 1") e ingresa la Base Inicial. El turno queda `ABIERTO`.
2. **[Operación Diaria]:** Se registran ingresos por ventas POS o abonos de clientes. Se registran egresos (gastos menores). Todo alimenta el `saldoTeorico`.
3. **[Traslado de Efectivo]:** El cajero acumula mucho efectivo. Ejecuta un traslado de $1,000,000 a la "Caja Administrativa Principal". Se descuenta de su caja y suma a la destino.
4. **[Cierre de Turno]:** Al final del día, el cajero cuenta billetes e ingresa el monto total. Si faltan $5,000, ingresa justificación ("Devuelta incorrecta"). Turno cambia a `CERRADO`.
5. **[Auditoría]:** El Admin revisa los cierres diarios y marca los turnos como `AUDITADO`.

---

## 4. Plan de Refactoring

- Crear `cash.types.ts` con interfaces base.
- Implementar `cashService.ts` para manejar apertura, cierre, movimientos y traslados.
- Crear vista de Control `CashFlowView.tsx` para panel de cajero y dashboard de administrador.
- Conectar POS: Enviar el `turnoId` al procesar pagos en efectivo en `posService.ts`.

---

## 5. Criterios de Validación (Tests)

### Éxito
| ID | Escenario | Resultado esperado |
|---|---|---|
| T-CSH-01 | Abrir turno de caja | Turno creado en `ABIERTO` |
| T-CSH-02 | Ingreso y egreso manual | `saldoTeorico` actualizado correctamente |
| T-CSH-03 | Traslado de dinero | Dos movimientos creados, un turno sube, otro baja |
| T-CSH-04 | Cierre con cuadre exacto | `saldoFisico` == `saldoTeorico`, `CERRADO` |

### Error
| ID | Escenario | Resultado esperado |
|---|---|---|
| T-CSH-E01 | Traslado a caja con turno cerrado | BLOQUEADO: Destino no tiene turno abierto |
| T-CSH-E02 | Cierre con descuadre sin justificación | BLOQUEADO: Requiere justificación |
| T-CSH-E03 | Movimiento en turno cerrado | BLOQUEADO: Turno ya no recibe movimientos |
