---
name: penpot-design-system
description: Integración de estándares de maquetación, diseño vectorial y tokens de diseño basados en Penpot Open-Source. Transforma especificaciones de Flexbox, CSS Grid y componentes vectoriales SVG en código React y Tailwind CSS para producción.
---

# Penpot Design System & Layout Engine Skill

Esta habilidad permite traducir especificaciones de diseño, sistemas de layout y tokens de diseño de **Penpot** (la plataforma open-source líder en diseño y prototipado UI/UX) directamente a componentes React 18, Tailwind CSS y SVG vectoriales en el ERP.

---

## 1. Mapeo de Layout Nativo de Penpot a Tailwind CSS

Penpot utiliza estándares web nativos (CSS Flexbox y CSS Grid). A continuación se detalla la matriz de correspondencia:

| Propiedad Penpot (Auto-Layout) | Clase Tailwind CSS | Comportamiento |
| :--- | :--- | :--- |
| Direction: Horizontal | `flex flex-row` | Elementos alineados horizontalmente |
| Direction: Vertical | `flex flex-col` | Elementos apilados verticalmente |
| Justify: Space Between | `justify-between` | Distribución uniforme de extremos |
| Align: Center | `items-center` | Centrado perpendicular |
| Gap: 16px | `gap-4` | Espaciado estándar de 1rem |
| Padding: 24px 16px | `py-6 px-4` | Relleno simétrico |
| Grid: Auto-fill (Min 280px) | `grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` | Cuadrícula responsiva fluida sin media queries |

---

## 2. Manejo de Tokens de Diseño y Exportación SVG

1. **Tokens de Tipografía y Escalas:**
   - Tipografía vectorial limpia renderizada sin distorsiones en resoluciones Retina/4K.
   - Textos con alineación precisa de línea base (`leading-none`, `leading-tight`).
2. **Iconografía e Ilustraciones Vectoriales (SVG):**
   - Siempre envolver SVGs en contenedores accesibles con `aria-hidden="true"` si son decorativos o con `<title>` si transmiten información funcional.
   - Uso de `currentColor` para permitir herencia dinámica de color desde clases de Tailwind.

---

## 3. Plantilla de Layout: Dashboard Penpot en Tailwind

```tsx
import React from 'react';

export const PenpotResponsiveDashboardLayout: React.FC<{ children: React.ReactNode; header: React.ReactNode }> = ({
  children,
  header
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
      {/* Penpot Sticky App Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-slate-900/80 px-6 backdrop-blur-xl">
        {header}
      </header>

      {/* Main Penpot CSS Grid Workspace */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {children}
        </div>
      </main>
    </div>
  );
};
```

---

## 4. Invocación

Para consultar patrones o convertir bocetos de Penpot a código:
```bash
/penpot-ui <nombre_vista> [--layout flex|grid] [--responsive]
```
