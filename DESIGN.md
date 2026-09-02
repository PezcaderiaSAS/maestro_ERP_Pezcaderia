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

## 6. Usage Guidelines & Best Practices

1. **Cero Placeholders:** Prohibido usar texto ficticio sin contexto comercial (como "Lorem Ipsum"). Utilizar siempre terminología del ERP (ej: *Filete de Tilapia Fresco*, *Lote F-2026*, *Margen 24.5%*, *Arqueo de Turno*).
2. **Contraste de Accesibilidad:** Todo texto secundario debe cumplir con ratio mínimo 4.5:1 (WCAG 2.1 AA) sobre superficies oscuras.
3. **Inmutabilidad:** En código React/TypeScript, jamás mutar objetos directamente. Siempre devolver copias inmutables con spread operators o reducers.
4. **Multi-Marca Rico UI:** Cuando se requiera un look específico (Linear, Stripe, Raycast, Supabase, Vercel), consultar el servidor MCP `ricoui-design-mcp` para inyectar sus tokens específicos preservando la estructura Glassmorphism.
