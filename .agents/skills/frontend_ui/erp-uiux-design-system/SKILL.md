---
name: erp-uiux-design-system
description: Sistema de diseño UI/UX empresarial, tokens visuales, componentes atómicos, data tables de alta densidad, micro-animaciones, soporte Multi-Tema (Light/Dark/Obsidian) y gráficos Sparkline para MaestroPescaderia ERP.
---

# ERP Enterprise UI/UX Design System Skill

Esta skill define los estándares de **Experiencia de Usuario (UX)**, **Diseño de Interfaz (UI)**, tokens de diseño y componentes atómicos para crear una experiencia de software empresarial de clase mundial en **MaestroPescaderia ERP**.

---

## 1. Tokens de Diseño y Filosofía Estética

El ERP utiliza un lenguaje visual sobrio, moderno y de alto impacto, optimizado para jornadas prolongadas de operadores y analistas:

### Paleta de Colores Semántica
- **Superficies & Fondos**:
  - Light Mode: Slate 50 (`#F8FAFC`) con tarjetas en Blanco Puro (`#FFFFFF`) y bordes en Slate 200 (`#E2E8F0`).
  - Dark Mode: Slate 900 (`#0F172A`) con tarjetas en Slate 800 (`#1E293B`) y bordes en Slate 700 (`#334155`).
  - Obsidian Mode (Cyberpunk): Negro Ébano (`#060B0E`) con acentos Neón Cyan (`#00FFD1`) y grillas sutiles.
- **Marca & Acentos**:
  - Deep Ocean Blue (`#0F172A` / `#1E3A8A`) para elementos estructurales.
  - Cyan Wave (`#06B6D4` / `#00FFD1`) para llamados a la acción primarios y badges de estado activo.
  - Emerald Green (`#10B981`) para estados positivos, ganancias y stock óptimo.
  - Coral Amber (`#F59E0B`) para alertas de stock mínimo o lotes próximos a vencer.
  - Crimson Red (`#EF4444`) para errores críticos, mermas excesivas o descuadres de caja.

### Tipografía
- **Fuente Principal**: `'Inter', system-ui, -apple-system, sans-serif` para interfaces legibles.
- **Tipografía Numérica**: Números tabulares `font-variant-numeric: tabular-nums` para que columnas de precios y pesos no bailen al cambiar de valor.

---

## 2. Componentes Atómicos y Patrones de Alta Densidad

### A. Data Tables de Alta Densidad (WMS & Finanzas)
- **Cabeceras Fijas (`sticky top-0`)**: Con soporte para ordenamiento multi-columna y filtros rápidos inline.
- **Hover & Focus Rows**: Iluminación sutil de fila (`hover:bg-slate-50/80 dark:hover:bg-slate-800/60`).
- **Formateadores Automáticos**: Moneda, kilogramos con 3 decimales (`1.250 kg`), badges de estado redondeados y tags de lotes FEFO.
- **Paginación & Virtualización**: Paginación integrada con selector de registros por página (10, 25, 50, 100).

### B. KPI Cards con Sparkline y Tendencia
- **Estructura Visual**:
  - Icono semántico en caja redondeada con fondo traslúcido.
  - Valor métrico principal grande (`text-2xl font-bold tracking-tight`).
  - Indicador de tendencia porcentual con flecha (`+12.4% vs mes anterior`).
  - Gráfico sparkline minimalista SVG integrado en la esquina inferior.

### C. Modales y Drawers Contextuales
- **Backdrop Blur**: Fondos con desenfoque (`backdrop-blur-sm bg-slate-900/40`).
- **Focus Trap & ESC Key**: Cierre accesible con tecla Escape y auto-enfoque en el primer campo interactivo.
- **Acciones Claras**: Botón de confirmación primario a la derecha y botón de cancelación neutro a la izquierda.

### E. Skeletons Shimmer para React 18 Suspense (Zero CLS)
- **Eliminación de Saltos de Pantalla (Cumulative Layout Shift)**: Todo estado de carga debe renderizar un esqueleto visual que replique la estructura y altura exacta del componente cargado.
- **Tipos de Indicadores de Carga**:
  - `Skeleton Shimmer`: Para Data Tables, tarjetas de KPI y formularios.
  - `Pulse Dot`: Para indicadores de estado en tiempo real (ej. conexión Supabase/Redis).
  - `Circular Spinner`: Restringido exclusivamente a botones de acción durante el submit (`isSubmitting`).

---

## 3. Responsive Breakpoints & Soporte de Impresión (@media print)

### A. Matriz de Breakpoints Operativos
- **Mobile (`< 640px` - `sm:` base)**: Terminales móviles de operarios de bodega en cuartos fríos (lectura de códigos de barras, pesaje y conteo cíclico).
- **Tablet (`768px - 1024px` - `md:` / `lg:`)**: Pantallas táctiles de punto de venta (POS) en mostrador. Botones táctiles con altura mínima de 44px (`min-h-[44px]`).
- **Desktop (`>= 1280px` - `xl:` / `2xl:`)**: Monitores de administración para balances contables, conciliación de nómina y dashboards ejecutivos.

### B. Hoja de Estilos de Impresión (@media print)
- Ocultamiento de barras de navegación, botones y elementos no imprimibles (`.no-print`).
- Reset a fondo blanco puro (`#FFFFFF`) y texto negro de alto contraste.
- Formato específico para tickets térmicos ESC/POS de 80mm y 58mm:
```css
@media print {
  nav, aside, button, .no-print {
    display: none !important;
  }
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 11px !important;
  }
}
```

---

## 4. Ejemplo de Componente KPI Card Reutilizable

```tsx
// src/components/ui/KPICard.tsx
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // Porcentaje ej: 5.4 o -2.1
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'cyan';
}

const variantStyles = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  variant = 'blue',
}) => {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`rounded-lg p-2.5 border ${variantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </div>
        {change !== undefined && (
          <div className="mt-1.5 flex items-center gap-1 text-xs font-medium">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-slate-400 dark:text-slate-500">vs período anterior</span>
          </div>
        )}
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
};
```

---

---

## 5. El Tridecálogo Canónico del CSS Moderno (Verdades Absolutas de Diseño)

Las siguientes directivas constituyen la **fuente de verdad absoluta** para maquetación, arquitectura visual y control de componentes en MaestroPescaderia ERP:

1. **Control de Especificidad con `@layer`**: Declarar capas en `@layer base, components, utilities;`. Elimina las guerras de especificidad y prohíbe el uso de `!important`.
2. **Aislamiento de Stacking Context (`isolation: isolate`)**: Jamás recurrir a `z-index: 9999` o `99999`. Utilizar `isolation: isolate` (clase `isolate`) para generar un nuevo contexto de apilamiento limpio con índices controlados (`z-1`, `z-10`, `z-50`).
3. **Erradicación de Márgenes en Hijos (`Margins Everywhere`)**: Prohibido aplicar `margin-bottom: 24px; :last-child { margin-bottom: 0 }`. El espaciado pertenece al contenedor padre mediante `display: flex; flex-direction: column; gap: 24px;` o `display: grid; gap: 24px;` (`gap-6` en Tailwind).
4. **La Trampa de `height: 100%` vs `min-height: 100dvh`**: `height: 100%` no surte efecto si los ancestros carecen de altura fija. En vistas raíz, modales y sidebars emplear `min-height: 100dvh` o flex con `min-height: 0` en hijos con scroll.
5. **Centrado Moderno de Una Línea**: Prohibido centrar con `position: absolute; top: 50%; transform: translate(-50%, -50%)`. Usar `display: grid; place-items: center;` (`grid place-items-center`) o `align-content: center;` en el contenedor.
6. **Dimensiones y Tipografía Fluida con `clamp()`**: Prohibido saturar el código con `@media queries` para cada breakpoint. Escalar tipografías y anchos con una sola línea: `font-size: clamp(1.5rem, 4vw, 3rem);`.
7. **Posicionamiento Ancla Declarativo (`Anchor Positioning`)**: Vincular tooltips, popovers y menús flotantes a sus disparadores nativamente con `anchor-name: --tooltip` y `position-anchor: --tooltip; top: anchor(bottom); left: anchor(center);` sin scripts pesados de cálculo de coordenadas en JS.
8. **Selector Relacional de Padre `:has()`**: Estilizar contenedores padres según la presencia o validez de hijos (`.card:has(img)` o `form:has(:invalid) button { pointer-events: none; opacity: 0.5; }`).
9. **View Transitions API**: Transiciones y morphing suave entre estados o rutas con `@view-transition { navigation: auto; }` y `view-transition-name`.
10. **Container Queries (`@container`)**: Estilar componentes en función del tamaño de su contenedor inmediato (`container-type: inline-size; @container (min-width: 400px)`), permitiendo componentes 100% modulares y portables.
11. **Tipografía Balanceada y Anti-Huérfanas**: Aplicar `text-wrap: balance` (`text-balance`) a encabezados (`h1, h2, h3`) y `text-wrap: pretty` (`text-pretty`) a párrafos (`p`) para evitar palabras aisladas al final de línea.
12. **CSS Nesting Nativo**: Anidar selectores jerárquicos de forma nativa sin herramientas de preprocesado (`& h2`, `&:hover`, `@media` anidado).
13. **CSS Subgrid (`subgrid`)**: Heredar las pistas de cuadrícula del contenedor padre en los hijos con `grid-template-rows: subgrid; grid-row: span 3;` para alineación vertical idéntica en tarjetas de catálogo y dashboards.

---

## 6. Checklist de Validación UI/UX

- [ ] ¿Los elementos interactivos cuentan con estados `hover`, `active` y `focus-visible` accesibles?
- [ ] ¿Los valores monetarios y de pesaje utilizan alineación numérica tabular?
- [ ] ¿Los estados vacíos (*Empty States*) muestran ilustraciones amigables y un botón de acción principal?
- [ ] ¿El contraste de color cumple con las pautas WCAG AA para legibilidad en pantallas de baja luminosidad?
- [ ] ¿Se aplican las 13 verdades absolutas de CSS moderno (cero `!important`, cero `z-index: 9999`, flex gap, `clamp()`, `text-balance`)?

