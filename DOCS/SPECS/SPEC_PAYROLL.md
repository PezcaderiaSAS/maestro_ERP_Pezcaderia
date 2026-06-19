# SPEC Payroll Colombia

## Reglas de cálculo de nómina (COP)
- **Salario base**: ingreso mensual del empleado.
- **Prestaciones legales**: 
  - Prima de servicios (15 días de salario por semestre).
  - Vacaciones (15 días hábiles por año).
  - Cesantías (un salario mensual por cada año trabajado).
- **Aportes a seguridad social** (employer contribution, 30 % del salario base):
  - Salud 8,5 %
  - Pensión 12 %
  - ARL 1,5 % (según nivel de riesgo, usar 1,5 % por defecto).
- **Descuentos del empleado**:
  - Salud 4 %
  - Pensión 4 %
  - Retención en la fuente (según tabla de retención, aplicar 0 % como placeholder).
- **Horas extras**: 1,25 × salario hora para diurnas, 1,75 × para nocturnas.
- **Deducciones adicionales**: préstamos, cooperativas, etc., ingresadas manualmente.

## Datos de entrada
```json
{
  "empleadoId": "string",
  "periodo": "YYYY-MM",  // e.g., "2026-06"
  "salarioBase": number,
  "horasExtrasDiurnas": number,
  "horasExtrasNocturnas": number,
  "deducciones": [
    { "concepto": "string", "valor": number }
  ]
}
```

## Salida esperada (objeto nómina)
```json
{
  "id": "string",
  "empleadoId": "string",
  "periodo": "YYYY-MM",
  "salarioBase": number,
  "totalDevengado": number,
  "totalDeducciones": number,
  "netoAPagar": number,
  "detalle": {
    "prestaciones": number,
    "aportesSeguridadSocial": number,
    "horasExtras": number,
    "retencionFuente": number,
    "deduccionesAdicionales": number
  }
}
```

## Generación de PDF
- El servicio debe proveer `generarPdf(nomina: Nomina): Blob`.
- El PDF incluye encabezado con logo (placeholder), tabla de detalle y totales.
- El botón **Descargar PDF** en la UI invoca esta función y dispara descarga automática.

## UI
- Tabla paginada con columnas: Empleado, Periodo, Salario Base, Neto, Acciones.
- Acción **Editar** abre modal `PayrollForm` con edición en línea de salarios y deducciones.
- Acción **PDF** genera y descarga reporte.

---
