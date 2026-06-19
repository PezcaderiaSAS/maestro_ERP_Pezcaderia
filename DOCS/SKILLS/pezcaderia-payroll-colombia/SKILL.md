---
name: pezcaderia-payroll-colombia
description: Fórmulas matemáticas y legales de nómina y liquidaciones definitivas ajustadas al código laboral colombiano.
---

# Nómina y Liquidación Colombiana

Este skill recopila las fórmulas legales y criterios del Código Sustantivo del Trabajo de Colombia aplicados al asistente Wizard del ERP.

## Días Comerciales Base (Fórmula de los 30 días)

Para efectos laborales y fiscales en Colombia, todos los meses se asumen con 30 días (360 días por año).

### Algoritmo de Normalización

```typescript
export function calcDiasComerciales(fechaInicio: Date, fechaFin: Date): number {
  const y1 = fechaInicio.getFullYear();
  const m1 = fechaInicio.getMonth() + 1;
  const d1 = fechaInicio.getDate();
  
  const y2 = fechaFin.getFullYear();
  const m2 = fechaFin.getMonth() + 1;
  const d2 = fechaFin.getDate();
  
  // Normalizar días de fin de mes
  const d1Ajustado = d1 === 31 ? 30 : d1;
  let d2Ajustado = d2;
  
  if (d2 === 31) {
    if (d1Ajustado >= 30) {
      d2Ajustado = 30;
    }
  }
  
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2Ajustado - d1Ajustado) + 1;
}
```

---

## Consultas de Contexto Avanzado (Context7 API)

Para consultar algoritmos de conversión de fechas comerciales en JavaScript, optimización de cálculos temporales o manejo de zonas horarias en el frontend, consulta Context7:

```bash
# Consultar algoritmos JS para cálculo de diferencia de días comerciales (360)
curl -X GET "https://context7.com/api/v2/context?libraryId=/facebook/react&query=calculate+days+difference+date+utils&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

## Estándares de Liquidación
- **Auxilio de Transporte**: Valida siempre que el salario del empleado sea inferior o igual a 2 SMMLV (Salarios Mínimos Mensuales Legales Vigentes). Excluye este rubro en periodos de disfrute vacacional.
- **Categorización de Gastos**: Toda aprobación de nómina genera un egreso contable en el ERP bajo las siguientes subcategorías específicas:
  * Regular: `'NÓMINA'`
  * Vacaciones: `'NÓMINA (VAC)'`
  * Liquidación final: `'LIQUIDACIÓN'`
