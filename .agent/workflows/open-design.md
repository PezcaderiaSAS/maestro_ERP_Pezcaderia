---
description: Genera y gestiona recursos gráficos abiertos, avatares SVG temáticos para productos a costo cero y micro-componentes visuales.
---

# Workflow: /open-design

Provee assets de diseño vectorial SVG y recursos visuales sin dependencias de servicios de pago.

## Argumentos:
```bash
/open-design <asset_type> [--category pescado|marisco|ferreteria] [--size sm|md|lg]
```

## Fases de Ejecución:
1. **Selección de Asset:** Identifica el componente gráfico o avatar necesario.
2. **Generación de Código SVG:** Inserta el componente vectorial en React/TSX con degradados dinámicos.
3. **Optimización WebP/SVG:** Asegura peso inferior a 5KB para rendimiento extremo.

Consulta `.agents/skills/open-design-assets/SKILL.md` para patrones de código.
