# SPEC-04: Recursos Humanos y Nómina

**Versión:** 1.0
**Fecha:** 2026-06-19
**Estado:** `APROBADO`
**Archivo actual:** `src/views/HRView.tsx` y `src/views/PayrollView.tsx` (a refactorizar)

---

## Resumen Ejecutivo

Este módulo gestiona la información contractual del personal y el motor de liquidación de nómina. Automatiza la liquidación quincenal/mensual, el disfrute de vacaciones y las liquidaciones definitivas de contrato ajustadas a la normativa laboral de Colombia (cálculo de 30 días comerciales por mes y apropiaciones legales de ley), integrándose directamente con la bitácora de gastos del ERP.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/payroll.types.ts

export type TipoContrato = 'INDEFINIDO' | 'FIJO' | 'APRENDIZ_SENA' | 'PRESTACION_SERVICIOS';
export type TipoLiquidacion = 'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL';
export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO';

export interface Empleado {
  id: string;
  identificacion: string;
  nombre: string;
  cargo: string;
  telefono: string;
  fechaIngreso: string;          // ISO Date YYYY-MM-DD
  fechaEgreso: string | null;     // ISO Date YYYY-MM-DD
  salarioBase: number;
  auxilioTransporte: boolean;     // Indica si le corresponde legalmente
  tipoContrato: TipoContrato;
  riesgoArlPct: number;          // Tarifa ARL (0.522% a 6.96%)
  exoneradoParafiscales: boolean;// Exoneración Ley 1607 (salud, SENA, ICBF)
  estado: EstadoEmpleado;
}

export interface NominaRegistro {
  id: string;
  empleadoId: string;
  periodoInicio: string;         // ISO Date
  periodoFin: string;            // ISO Date
  tipoLiquidacion: TipoLiquidacion;
  diasTrabajados: number;
  devengado: {
    salarioProporcional: number;
    auxilioTransporte: number;
    horasExtras: number;
    bonificaciones: number;
    viaticos: number;
    totalDevengado: number;
  };
  deducciones: {
    salud: number;               // 4% empleado
    pension: number;             // 4% empleado
    prestamos: number;
    otrasDeducciones: number;
    totalDeducciones: number;
  };
  netoAPagar: number;            // devengado - deducciones
  apropiaciones: {
    saludEmpleador: number;      // 8.5% (si no exonerado)
    pensionEmpleador: number;    // 12%
    arl: number;                 // según riesgoArlPct
    cajaCompensacion: number;    // 4%
    sena: number;                // 2% (si no exonerado)
    icbf: number;                // 3% (si no exonerado)
    provisionPrima: number;      // 8.33%
    provisionCesantias: number;  // 8.33%
    provisionIntereses: number;  // 1% mensual (12% anual)
    provisionVacaciones: number; // 4.17%
  };
  fechaAprobacion: string;       // ISO Date
  aprobadoPor: string;           // cajeroId o adminId
  gastoId: string | null;        // Relación con el módulo de gastos
}
```

### 1.2 Input (Datos que recibe)

| Campo | Tipo | Fuente | Obligatorio |
|---|---|---|---|
| Empleados | `Empleado[]` | `localDb('empleados')` | Sí |
| Salario Mínimo Legal | `number` | Variables del sistema / Config | Sí |
| Auxilio Transporte Legal | `number` | Variables del sistema / Config | Sí |

### 1.3 Output (Datos que produce)

| Campo | Tipo | Destino | Cuándo |
|---|---|---|---|
| Empleado | `Empleado` | `localDb('empleados')` | Crear/Editar o Desvincular |
| Registro de Nómina | `NominaRegistro` | `localDb('nominas')` | Al aprobar liquidación |
| Gasto registrado | `Gasto` | `localDb('gastos')` | Al aprobar liquidación |

---

## 2. Dominio (Reglas de Negocio)

**Reglas heredadas de `business_rules.md`:**
- `RN-15` — Egreso desactiva acceso inmediatamente
- `RN-26` — Días comerciales estándar (30 días por mes)
- `RN-27` — Auxilio de transporte condicional y exclusiones
- `RN-28` — Fórmulas legales de liquidación definitiva

**Reglas específicas de este SPEC:**
```
DADO un periodo de nómina con fecha de inicio y fin
CUANDO el sistema calcula los días base
ENTONCES aplicar la función calcDiasComerciales(inicio, fin) para normalizar a 30 días mensuales (RN-26).

DADO un flujo de disfrute de VACACIONES
CUANDO se liquida el registro
ENTONCES:
  - El Auxilio de Transporte se calcula en 0 COP (RN-27).
  - La ARL se calcula en 0 COP (dado que no hay exposición a riesgo).
  - El gasto de caja resultante se etiqueta bajo la categoría 'NÓMINA (VAC)'.

DADO un flujo de LIQUIDACION_FINAL
CUANDO el operador ingresa la fecha de finalización
ENTONCES:
  - Sugerir automáticamente los días transcurridos en el año comercial para Prima, Cesantías y Vacaciones.
  - Aplicar las fórmulas legales del Dominio 7 (RN-28).
  - Cambiar el estado del empleado a INACTIVO al guardar la liquidación (RN-15).
```

---

## 3. Flujo de la Feature

```
[Administrador accede a Nómina]
        │
        ▼
[Selecciona Tipo de Liquidación: REGULAR / VACACIONES / LIQUIDACION_FINAL]
        │
        ▼
[Selecciona Empleado e ingresa rango de fechas]
        │
        ▼
[Cálculo automático de Días Base (RN-26)]
        │
        ▼
[Ingresa Novedades: Horas extras, Bonificaciones, Préstamos]
  → Recálculo en tiempo real de devengos, deducciones y neto
        │
        ▼
[Visualiza apropiaciones patronales (ARL, Salud, Pensiones, Provisiones)]
        │
        ▼
[Confirmación SweetAlert2 y clic en "Aprobar y Pagar"]
  ├── Registrar NominaRegistro en localDb('nominas')
  ├── Inyectar Gasto en localDb('gastos') con categoría correcta
  └── Si es LIQUIDACION_FINAL: empleado.estado = 'INACTIVO' (RN-15)
```

---

## 4. Plan de Refactoring

### Archivo actual
*   `src/views/HRView.tsx` — Contiene tanto el directorio de personal como la nómina (110 KB).

### Estructura objetivo
```
src/views/payroll/
├── PayrollView.tsx                 ← Orquestador de Nómina (< 150 líneas)
├── HRView.tsx                      ← Orquestador de Directorio de Personal
├── components/
│   ├── EmployeeTable.tsx           ← Listado de empleados activos/inactivos
│   ├── EmployeeForm.tsx            ← Formulario CRUD de empleado
│   ├── PayrollWizard.tsx           ← Asistente paso a paso para liquidar
│   ├── NovedadesForm.tsx           ← Carga de horas extras y deducciones
│   ├── PayrollHistoryTable.tsx     ← Historial de pagos liquidados
│   └── CertificateGenerator.tsx    ← Generación de cartas de recomendación/laborales
└── hooks/
    ├── useEmployees.ts             ← Estado de empleados
    └── usePayroll.ts               ← Lógica de liquidación y wizard
src/services/
└── payrollService.ts               ← Fórmulas puras (calcDiasComerciales, cesantías)
src/types/
└── payroll.types.ts                ← Tipos de datos
src/tests/
└── payroll.test.ts                 ← Tests unitarios de las fórmulas de ley
```

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-PAY-01 | Cálculo de días comerciales bisiesto | `2024-02-01` a `2024-02-29` | 30 días base (RN-26) |
| T-PAY-02 | Liquidación definitiva estándar | Salario: 1'500.000, Auxilio: 162.000, Días: 180 | Cesantías: 831.000 COP, Prima: 831.000 COP (RN-28) |
| T-PAY-03 | Exclusión de Auxilio de Transporte | Tipo contrato: `PRESTACION_SERVICIOS` | auxilioTransporte = 0 (RN-27) |

### 5.2 Casos de Error

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-PAY-E01 | Fechas invertidas | `inicio: 2026-06-30`, `fin: 2026-06-01` | Error: "La fecha de fin debe ser posterior" |
| T-PAY-E02 | Intento de doble pago | Mismo empleado, mismo periodo ya liquidado | Error: "El periodo ya se encuentra liquidado" |

---

## 6. Dependencias

| Tipo | Nombre | Propósito |
|---|---|---|
| Servicio interno | `localDb.ts` | Almacenar nóminas y gastos |
| Librería externa | `SweetAlert2` | Confirmaciones y advertencias financieras |

---

## 7. Notas de Implementación

- Los valores de Salario Mínimo Mensual Legal Vigente (SMMLV) y Auxilio de Transporte deben guardarse en un registro de parámetros globales en localDb para permitir su actualización anual sin necesidad de compilar código.
- La generación de certificados laborales cambia los verbos basados en si `empleado.estado === 'ACTIVO'` ("labora actualmente") o `INACTIVO` ("laboró en nuestra empresa").
