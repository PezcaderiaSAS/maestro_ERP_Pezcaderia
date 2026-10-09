---
name: open-design-assets
description: Catálogo y generador de assets de diseño abierto (Open Design), avatares vectoriales SVG temáticos a costo cero, paletas de colores libres y micro-componentes UI para el ERP.
---

# Open Design Assets & Visual Library Skill

Esta habilidad centraliza patrones de recursos gráficos abiertos (**Open Design**), avatares SVG generados por código, iconografía vectorizada y componentes de micro-interacción listos para usar en La Pezcaderia ERP / FerreOn sin incurrir en costos de suscripciones propietarias.

---

## 1. Generador de Avatares Vectoriales SVG (Costo 0)

Para productos que no cuenten con fotografía física o mientras se carga el recurso real:

```tsx
import React from 'react';

interface SvgProductAvatarProps {
  category: 'pescado' | 'marisco' | 'congelado' | 'empaque' | 'herramienta';
  name: string;
  size?: number;
}

export const SvgProductAvatar: React.FC<SvgProductAvatarProps> = ({
  category,
  name,
  size = 48
}) => {
  const getGradient = () => {
    switch (category) {
      case 'pescado': return ['#06b6d4', '#3b82f6'];
      case 'marisco': return ['#f43f5e', '#fb923c'];
      case 'congelado': return ['#38bdf8', '#818cf8'];
      default: return ['#6366f1', '#06b6d4'];
    }
  };

  const [c1, c2] = getGradient();
  const initial = (name || 'P').charAt(0).toUpperCase();

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-xl shadow-md">
      <defs>
        <linearGradient id={`grad-${category}-${initial}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill={`url(#grad-${category}-${initial})`} />
      <text
        x="50"
        y="62"
        fill="#ffffff"
        fontSize="42"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {initial}
      </text>
    </svg>
  );
};
```

---

## 2. Micro-Animaciones CSS Abiertas y Efectos de Brillo

Clases utilitarias open-design integradas con Tailwind:
- `animate-pulse-slow`: Pulsación suave para estados de sincronización activa.
- `animate-float`: Flotación sutil para badges destacados.
- `hover:scale-[1.02] active:scale-[0.98]`: Respuesta táctil física inmediata.

---

## 3. Invocación

```bash
/open-design <asset_type> [--category pescado|marisco|ferreteria] [--size sm|md|lg]
```
