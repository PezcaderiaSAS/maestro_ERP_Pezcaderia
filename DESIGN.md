# La Pezcadería ERP / FerreOn — Style Reference & Design System

> Canonical DESIGN.md specification formatted for Rico UI Design Workspace, Google Stitch MCP and Autonomous AI Coding Agents.

- **Theme Mode:** Dark Glassmorphism (`data-theme="dark"` / `data-theme="admin"` / `data-theme="obsidian"`)
- **Primary Archetype:** Translucent Frosted Glass with Marine Indigo & Cyan Wave accents
- **Target Frameworks:** React 18, Next.js 14+ (App Router), Tailwind CSS, TypeScript

---

## 1. Brand & Palette

### Color Tokens

| Name | Value | Token | Role |
| :--- | :--- | :--- | :--- |
| Canvas Deep Background | `#0a0f1d` / `hsl(222, 47%, 8%)` | `--bg-color` | Fondo principal de la aplicación |
| Frosted Glass Surface | `rgba(17, 24, 39, 0.75)` / `hsl(222, 47%, 11%)` | `--card-bg` | Paneles, tarjetas y modales translúcidos |
| Surface Hover | `rgba(31, 41, 55, 0.85)` / `hsl(215, 28%, 17%)` | `--card-hover` | Estado hover de tarjetas y filas |
| Surface Border Subtle | `rgba(255, 255, 255, 0.12)` | `--border-color` | Límites de paneles de vidrio y separadores |
| Primary Marine Indigo | `#4f46e5` / `hsl(244, 75%, 59%)` | `--primary-color` | Botones de acción principal, pestañas activas |
| Primary Hover | `#4338ca` / `hsl(244, 57%, 50%)` | `--primary-hover` | Estado hover de botones primarios |
| Accent Cyan Wave | `#06b6d4` / `hsl(189, 94%, 43%)` | `--color-cyan-wave` | Resaltados, métricas clave, glows, iconos |
| Accent Cyan Hover | `#0891b2` / `hsl(192, 91%, 36%)` | `--accent-hover` | Interacciones de acento secundario |
| Success Emerald | `#10b981` / `hsl(160, 84%, 39%)` | `--color-emerald-a` | Margen positivo, lotes vigentes, stock óptimo |
| Warning Amber | `#f59e0b` / `hsl(38, 92%, 50%)` | `--color-warning` | Lotes próximos a vencer, alertas de arqueo |
| Danger Rose / Red | `#ef4444` / `hsl(0, 84%, 60%)` | `--btn-exit-bg` | Mermas críticas, botones de cierre/salida, errores |
| Text Primary | `#f9fafb` / `hsl(210, 40%, 98%)` | `--text-primary` | Títulos, valores destacados, encabezados |
| Text Secondary | `#9ca3af` / `hsl(218, 11%, 65%)` | `--text-secondary` | Subtítulos, descripciones, etiquetas |
| Text Muted | `#6b7280` / `hsl(220, 9%, 46%)` | `--text-muted` | Metadatos secundarios, placeholders |

### Gradients & Ambient Glows

- **Primary Glow:** `linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)`
- **Glass Card Overlay:** `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)`
- **Action Button Gradient:** `linear-gradient(to right, #4f46e5, #06b6d4)`

---

## 2. Typography

| Role | Font Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display / H1 | `'Outfit', 'Inter', sans-serif` | `2.25rem (36px)` | `700 (Bold)` | `1.2` | `-0.025em` |
| Section / H2 | `'Outfit', 'Inter', sans-serif` | `1.5rem (24px)` | `600 (Semibold)` | `1.3` | `-0.02em` |
| Card Title / H3 | `'Outfit', 'Inter', sans-serif` | `1.125rem (18px)` | `600 (Semibold)` | `1.4` | `-0.01em` |
| Body Regular | `'Inter', system-ui, sans-serif` | `0.875rem (14px)` | `400 (Regular)` | `1.5` | `0em` |
| Body Small | `'Inter', system-ui, sans-serif` | `0.75rem (12px)` | `500 (Medium)` | `1.4` | `0.01em` |
| Monospace / Numbers | `'JetBrains Mono', monospace` | `0.8125rem (13px)` | `500 (Medium)` | `1.4` | `0.02em` |
| Badge / Eyebrow | `'Inter', system-ui, sans-serif` | `0.6875rem (11px)` | `700 (Bold)` | `1.2` | `0.05em (Uppercase)` |

---

## 3. Surfaces, Radii & Shadows

### Elevaciones y Filtros
- **Backdrop Blur Base:** `backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`
- **Glass Panel:** `background: rgba(17, 24, 39, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);`
- **Glow Accent:** `box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);`

### Radios de Borde (`border-radius`)
- **Default (Standard):** `sm: 0.375rem`, `md: 0.5rem`, `lg: 0.75rem`, `xl: 1rem`, `full: 9999px`
- **Obsidian Theme Override:** `0px` (`rounded-none` estricto en temas industriales).

---

## 4. Layout & Spacing

- **Base Grid:** Sistema modular de 4px / 8px (`gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`).
- **Data Table Density:** Alta densidad ERP (`px-4 py-2.5` por celda para maximizar información visible en pantalla sin scroll vertical innecesario).
- **Responsive Breakpoints:**
  - `sm`: 640px (Móvil horizontal)
  - `md`: 768px (Tablets / POS Táctil)
  - `lg`: 1024px (Laptops de mostrador)
  - `xl`: 1280px (Escritorio Administrativo)
  - `2xl`: 1536px (Monitores de Auditoría / Despacho)

---

## 5. Component Specifications & State Matrices

### Botón Primario (`PrimaryButton`)
- **Default:** `bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-xl px-4 py-2 text-xs shadow-lg`
- **Hover:** `brightness-110 shadow-cyan-500/20 scale-[1.02]`
- **Focus:** `ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 outline-none`
- **Active:** `scale-[0.98]`
- **Disabled:** `opacity-40 cursor-not-allowed filter grayscale`

### Tarjeta KPI (`KpiCard`)
- **Default:** `rounded-xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-lg`
- **Hover:** `border-cyan-500/30 shadow-cyan-500/10`
- **Contenido:** Título uppercase 11px, Valor Display 24px, Badge de tendencia (+/-%), Icono con fondo `bg-white/5`.

### Modal Glassmorphism (`ModalDialog`)
- **Backdrop:** `fixed inset-0 bg-black/70 backdrop-blur-sm`
- **Panel:** `rounded-2xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl max-w-lg w-full animate-in fade-in zoom-in-95`

---

## 7. El Tridecálogo Canónico del CSS Moderno & Frontend (Absolute Ground Truth)

> **NORMA PRECEPTIVA:** Las siguientes trece directivas de ingeniería visual y CSS moderno constituyen la **fuente de verdad absoluta** para la maquetación, control de flujo, transiciones y componentes en todo el sistema ERP.


### 🏛️ Regla 1: Control de Especificidad con `@layer` (No More `!important` Fights)
- **Principio:** Declarar y organizar siempre las capas de estilo en `@layer base, components, utilities;`.
- **Efecto:** Elimina de raíz las guerras de especificidad y el uso de `!important`. Las utilidades siempre prevalecen sobre los componentes y estos sobre la base de forma determinista.
- **Sintaxis Estándar:**
  ```css
  @layer base, components, utilities;

  @layer base {
    a { color: blue; }
  }

  @layer utilities {
    .text-red { color: red; } /* always wins over base */
  }
  ```

### 🛡️ Regla 2: Aislamiento con `isolation: isolate` vs la Trampa de `z-index: 9999`
- **Principio:** El problema real de las capas no es la magnitud del número, sino el contexto de apilamiento (*stacking context*).
- **❌ DON'T (Guerra de Escalación):**
  ```css
  .modal { z-index: 9999; }
  .tooltip { z-index: 99999; } /* escalation war */
  ```
- **✅ DO (Clean Slate Stacking Context):**
  ```css
  .modal {
    isolation: isolate;
    z-index: 1; /* contexto limpio */
  }
  ```
- **Equivalencia Tailwind:** `isolate z-10`, `isolate z-50`. Prohibido inventar valores arbitrarios desbordados (`z-[999999]`).

### 📐 Regla 3: Erradicación de Márgenes en Hijos (`Margins Everywhere`)
- **Principio:** Detener la batalla contra márgenes colapsados y la fragilidad de `:last-child`. El espaciado pertenece al contenedor padre que orquesta el layout, nunca a los elementos hijos.
- **❌ DON'T:**
  ```css
  .card { margin-bottom: 24px; }
  .card:last-child { margin-bottom: 0; }
  ```
- **✅ DO:**
  ```css
  .grid {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  ```
- **Equivalencia Tailwind:** `flex flex-col gap-6` o `grid gap-6`. Prohibido usar `mb-6 last:mb-0` en componentes de listas o tarjetas repetidas.

### 📱 Regla 4: La Trampa de `height: 100%` vs `min-height: 100dvh`
- **Principio:** `height: 100%` solo funciona si absolutamente todos los ancestros tienen una altura fija o explícita. En vistas raíz o modales, produce contenedores colapsados.
- **❌ DON'T:**
  ```css
  .container {
    height: 100%; /* Si el padre no tiene altura explícita, esto no hace nada */
  }
  ```
- **✅ DO:**
  ```css
  .container {
    min-height: 100dvh; /* dynamic viewport height: funciona en todo viewport móvil/desktop sin depender de ancestros */
  }
  ```
- **Equivalencia Tailwind:** `min-h-dvh` (o `min-h-screen` con fallback dvh). Impide los desajustes de la barra de navegación en navegadores móviles (iOS Safari / Android Chrome).

### 🎯 Regla 5: Centrado Moderno de Una Línea (No Centering Like It's 2015)
- **Principio:** Descartar definitivamente el posicionamiento absoluto con `top: 50%` y transformaciones negativas para centrar elementos.
- **❌ DON'T (Patrón anticuado de 2015):**
  ```css
  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  ```
- **✅ DO (CSS Moderno en una sola línea):**
  ```css
  .center {
    display: grid;
    place-items: center;
  }
  /* O aún más simple en el contenedor: */
  .parent {
    align-content: center;
  }
  ```
- **Equivalencia Tailwind:** `grid place-items-center` o `flex items-center justify-center`.

### 📏 Regla 6: Dimensiones y Tipografía Fluida con `clamp()` (Fixed Widths Break)
- **Principio:** Responsivo no significa llenar el código de `@media queries` para cada breakpoint. Usar funciones matemáticas nativas de CSS para escalar fluidamente.
- **❌ DON'T (Cascada infinita de Media Queries):**
  ```css
  h1 { font-size: 48px; }
  @media (max-width: 768px) { h1 { font-size: 32px; } }
  @media (max-width: 480px) { h1 { font-size: 24px; } }
  ```
- **✅ DO (Escala fluida en 1 sola línea para todas las pantallas):**
  ```css
  h1 {
    font-size: clamp(1.5rem, 4vw, 3rem);
  }
  ```
- **Equivalencia Tailwind:** Clases de tipografía fluida o valores arbitrarios `text-[clamp(1.5rem,4vw,3rem)]` en títulos principales.

### ⚓ Regla 7: Posicionamiento Ancla Declarativo (`Anchor Positioning`)
- **Principio:** Posicionar tooltips, popovers y dropdowns directamente vinculados al disparador con CSS nativo puro, erradicando scripts pesados de cálculo de coordenadas JS (`getBoundingClientRect`).
- **Sintaxis Estándar:**
  ```css
  .trigger {
    anchor-name: --tooltip;
  }

  .tooltip {
    position: fixed;
    position-anchor: --tooltip;
    top: anchor(bottom);
    left: anchor(center);
  }
  ```

### 🧬 Regla 8: Selector Relacional de Padre `:has()` (Parent Selector)
- **Principio:** Estilizar contenedores padres basándose en el estado o presencia de sus hijos, resolviendo lógica de UI y validaciones sin sobrecargar JavaScript.
- **Ejemplos de Aplicación:**
  ```css
  /* Estilar una tarjeta SOLO si contiene una imagen */
  .card:has(img) {
    grid-template-rows: 200px 1fr;
  }

  /* Validación visual de formulario reactiva sin JS */
  form:has(:invalid) button[type="submit"] {
    opacity: 0.5;
    pointer-events: none;
  }
  ```
- **Equivalencia Tailwind:** Modificadores `has-[img]:grid-rows-[200px_1fr]` y `has-[:invalid]:opacity-50 has-[:invalid]:pointer-events-none`.

### 🎬 Regla 9: View Transitions API Declarativa
- **Principio:** Transiciones y morphing suave entre estados de página o vistas de datos con 3 líneas de CSS nativo a nivel de plataforma.
- **Sintaxis Estándar:**
  ```css
  @view-transition {
    navigation: auto;
  }

  .hero-image {
    view-transition-name: hero;
  }
  ```
- **Beneficio:** Experiencia de usuario idéntica a una aplicación nativa sin librerías de animación complejas.

### 📦 Regla 10: Container Queries (`@container`)
- **Principio:** Estilar los componentes en base al tamaño de su contenedor padre inmediato, no al viewport general de la pantalla. Permite crear componentes verdaderamente modulares y reutilizables en sidebars, modales o áreas de contenido principal.
- **Sintaxis Estándar:**
  ```css
  .card-container {
    container-type: inline-size;
  }

  @container (min-width: 400px) {
    .card {
      grid-template-columns: 1fr 1fr;
    }
  }
  ```
- **Equivalencia Tailwind:** Clases `@container` en el padre y `@md:grid-cols-2` en el hijo.

### 🖋️ Regla 11: Tipografía Balanceada y Anti-Huérfanas (`text-wrap: balance` & `text-wrap: pretty`)
- **Principio:** No más líneas finales antiestéticas de una sola palabra (*widows* o líneas huérfanas).
- **Sintaxis Estándar:**
  ```css
  /* Encabezados y títulos: balance armónico de caracteres */
  h1, h2, h3 {
    text-wrap: balance;
  }

  /* Cuerpos de texto y párrafos: prevención de huérfanas con alta performance */
  p {
    text-wrap: pretty;
  }
  ```
- **Equivalencia Tailwind:** Clases nativas `text-balance` (en encabezados y modales) y `text-pretty` (en descripciones y párrafos del ERP).

### 🪆 Regla 12: CSS Nesting Nativo (Sass-like Nesting Built Into CSS)
- **Principio:** Anidamiento jerárquico nativo sin necesidad de preprocesadores (Sass/SCSS). Permite encapsular selectores hijos, pseudoclases y media queries dentro del bloque del componente padre.
- **Sintaxis Estándar:**
  ```css
  .card {
    background: #12121a;

    & h2 {
      font-size: 2rem;
    }

    &:hover {
      transform: scale(1.02);
    }

    @media (width < 768px) {
      padding: 1rem;
    }
  }
  ```

### 📐 Regla 13: CSS Subgrid (`subgrid`) — Alineación Perfecta de Cuadrículas
- **Principio:** Los elementos hijos pueden heredar y alinearse directamente a las pistas de la cuadrícula padre (`grid tracks`), resolviendo de raíz el desalineamiento vertical en tarjetas que poseen contenidos dinámicos de longitud dispar.
- **Sintaxis Estándar:**
  ```css
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .card {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
  }
  ```
- **Equivalencia Tailwind:** Clases de Tailwind v3.4+ / v4: `grid-rows-subgrid` y `grid-cols-subgrid`.


---


## 8. Usage Guidelines & Best Practices

1. **Cero Placeholders:** Prohibido usar texto ficticio sin contexto comercial (como "Lorem Ipsum"). Utilizar siempre terminología del ERP (ej: *Filete de Tilapia Fresco*, *Lote F-2026*, *Margen 24.5%*, *Arqueo de Turno*).
2. **Contraste de Accesibilidad:** Todo texto secundario debe cumplir con ratio mínimo 4.5:1 (WCAG 2.1 AA) sobre superficies oscuras.
3. **Inmutabilidad:** En código React/TypeScript, jamás mutar objetos directamente. Siempre devolver copias inmutables con spread operators o reducers.
4. **Multi-Marca Rico UI:** Cuando se requiera un look específico (Linear, Stripe, Raycast, Supabase, Vercel), consultar el servidor MCP `ricoui-design-mcp` para inyectar sus tokens específicos preservando la estructura Glassmorphism.

