---
description: Traduce bocetos y especificaciones de diseño basadas en Penpot (Flexbox, CSS Grid, SVG) en componentes React y Tailwind CSS de alta fidelidad.
---

# Workflow: /penpot-ui

Genera estructuras y layouts responsivos alineados con los estándares de diseño abierto de Penpot.

## Argumentos:
```bash
/penpot-ui <nombre_vista> [--layout flex|grid] [--responsive]
```

## Fases de Ejecución:
1. **Definición de Cuadrícula/Flexbox:** Mapea el auto-layout a utilidades de Tailwind CSS.
2. **Construcción de Componente:** Genera código TypeScript estricto con soporte para `lucide-react`.
3. **Verificación de Viewport:** Comprueba soporte móvil (`375px`) y desktop (`1280px+`).

Consulta `.agents/skills/penpot-design-system/SKILL.md` para más información.
