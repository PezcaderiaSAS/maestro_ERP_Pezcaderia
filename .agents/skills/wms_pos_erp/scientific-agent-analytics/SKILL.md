---
name: scientific-agent-analytics
description: Motor de cálculos científicos, analítica matemática y algoritmos deterministas para el ERP. Implementa Análisis Pareto ABC (80/20), rendimiento y mermas de despiece, stock de seguridad y conversiones precisas de unidades (Gramos/Kilos).
---

# Scientific Agent Analytics & Calculations Skill

Esta habilidad proporciona algoritmos matemáticos rigurosos y libres de errores de redondeo en punto flotante para operaciones financieras, inventario WMS y cálculos de producción en MaestroPescaderia ERP.

---

## 1. Algoritmo Canónico Pareto ABC (80/20)

Clasificación de productos basada en su contribución acumulada al valor total de inventario o ventas:
- **Categoría A (Top 80% del valor):** ~20% de los SKUs. Control de inventario diario y conteo cíclico estricto.
- **Categoría B (Siguiente 15% del valor / 80%-95% acumulado):** ~30% de los SKUs. Control semanal.
- **Categoría C (Último 5% del valor / 95%-100% acumulado):** ~50% de los SKUs. Control mensual/bimensual.

```typescript
export interface ProductItem {
  id: string;
  name: string;
  unitPrice: number;
  stockQuantity: number; // en Kg
}

export interface AbcResultItem extends ProductItem {
  totalValue: number;
  sharePercent: number;
  accumulatedPercent: number;
  category: 'A' | 'B' | 'C';
}

export function calculateParetoAbc(items: ProductItem[]): AbcResultItem[] {
  if (!items || items.length === 0) return [];

  // 1. Calcular valor total por ítem
  const evaluated = items.map(item => ({
    ...item,
    totalValue: Math.round(item.unitPrice * item.stockQuantity)
  }));

  // 2. Ordenar descendentemente por valor monetario
  evaluated.sort((a, b) => b.totalValue - a.totalValue);

  const grandTotal = evaluated.reduce((acc, curr) => acc + curr.totalValue, 0);
  if (grandTotal === 0) {
    return evaluated.map(item => ({
      ...item,
      sharePercent: 0,
      accumulatedPercent: 0,
      category: 'C'
    }));
  }

  // 3. Calcular acumulados y categorizar
  let runningTotal = 0;
  return evaluated.map(item => {
    runningTotal += item.totalValue;
    const sharePercent = Number(((item.totalValue / grandTotal) * 100).toFixed(2));
    const accumulatedPercent = Number(((runningTotal / grandTotal) * 100).toFixed(2));

    let category: 'A' | 'B' | 'C' = 'C';
    if (accumulatedPercent <= 80) {
      category = 'A';
    } else if (accumulatedPercent <= 95) {
      category = 'B';
    }

    return {
      ...item,
      sharePercent,
      accumulatedPercent,
      category
    };
  });
}
```

---

## 2. Regla Crítica de Conversión de Peso (Gramos vs. Kilogramos)

> [!CAUTION]
> En la base de datos Supabase y en `Schema.js`, todo peso monetario y cantidades en el POS se calculan por **KILOGRAMOS**. Si la báscula entrega gramos, la conversión DEBE ser:
> ```typescript
> const weightInKg = Math.round((weightInGrams / 1000) * 1000) / 1000; // 3 decimales de precisión
> ```

---

## 3. Invocación

```bash
/scientific-skills <pareto|merma|reorder_point|conversion> [--data <json_or_array>]
```
