---
description: Ejecuta cálculos matemáticos deterministas de alta precisión para el ERP (Pareto ABC 80/20, mermas de despiece, stock de seguridad y conversión gramos/kilos).
---

# Workflow: /scientific-skills

Ejecuta algoritmos de análisis cuantitativo y clasificación ABC para inventario y finanzas.

## Argumentos:
```bash
/scientific-skills <calc_type> [--data <datos_json>]
```
Tipos soportados: `pareto`, `merma`, `reorder_point`, `conversion`.

## Fases de Ejecución:
1. **Validación de Entradas:** Normaliza unidades (garantiza conversión estricta gramos a kilogramos con 3 decimales).
2. **Cálculo Determinista:** Aplica la fórmula correspondiente sin errores de redondeo.
3. **Generación de Reporte:** Retorna clasificación A/B/C y métricas acumuladas.

Consulta `.agents/skills/scientific-agent-analytics/SKILL.md` para el código del algoritmo.
