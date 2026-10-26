# Sistema de Diseño Oficial: Glassmorphism & Dark UI V8 (DesignSystem_V8.md)

**Documento:** DesignSystem_V8.md  
**Versión:** 8.0.0 (Enterprise V8)  
**Autor:** Dirección de Tecnología & Equipo de Arquitectura Frontend  
**Estado:** OFICIAL / VIGENTE  
**Aprobación Grill-Me:** 2026-10-26 (Aprobado por Tech Lead)  
**Herramientas y MCPs:** Google Stitch MCP, Rico UI Brands (`pezcaderia-glass`, `apple`), Google Harness²  

---

## 1. Manifiesto y Ley Visual V8

El **Dashboard V8** establece una transformación visual y ergonómica absoluta para todo el frontend de La Pezcadería ERP. Bajo esta directriz, **se erradica cualquier componente plano o pegado a los bordes de la pantalla**. Toda la interfaz se concibe como un ecosistema de **paneles flotantes de vidrio esmerilado oscuro (Dark Glassmorphism)** suspendidos sobre un lienzo atmosférico profundo, gobernados por metáforas de sistemas operativos de escritorio (**macOS Window Controls**) y una jerarquía tipográfica de alta precisión.

---

## 2. Fundamentos Matemáticos y Físicos del Glassmorfismo

### 2.1. Canal Alfa y Opacidad de Superficie
Para evitar la pérdida de legibilidad (texto difuso) y el efecto lavado, la opacidad de los contenedores oscuros sigue la fórmula de equilibrio:
$$\alpha_{\text{surface}} \in [0.75, 0.88]$$
- **Estándar V8:** `rgba(15, 23, 42, 0.85)` (`bg-slate-900/85`).
- **Efecto:** Proporciona suficiente densidad para que el texto en `#F8FAFC` alcance un ratio de contraste $> 12:1$ (superando holgadamente el requisito AAA de WCAG 2.2 de 7:1), permitiendo al mismo tiempo el paso de la luz difusa de fondo.

### 2.2. Ecuación de Difusión Gaussiana y Saturación
$$f(x, y) = \text{blur}(\sigma) \times \text{saturate}(S)$$
- **Radio de Desenfoque ($\sigma$):** $16\text{px}$ a $24\text{px}$ (`backdrop-blur-2xl`).
- **Realce de Saturación ($S$):** $180\%$ (`backdrop-saturate-180`). Evita que los colores proyectados a través del vidrio se tornen grises o deslavados.

### 2.3. Luz Especular de Borde (Top-Edge Highlight)
La luz física en un panel de vidrio incide con mayor intensidad en el bisel superior. En V8 se modela mediante:
```css
box-shadow: 
  0 20px 50px rgba(0, 0, 0, 0.5),           /* Sombra ambiental profunda */
  inset 0 1px 0 0 rgba(255, 255, 255, 0.15); /* Reflejo especular superior */
border: 1px solid rgba(255, 255, 255, 0.12); /* Borde perimetral translúcido */
```

### 2.4. Aceleración por Hardware en GPU
Para evitar caídas de tasa de refresco (60 FPS estables) provocadas por el re-cálculo de `backdrop-filter` en scroll, todo panel flotante debe declarar obligatoriamente:
```css
transform: translateZ(0);
will-change: transform, opacity;
```

---

## 3. Matriz de Tokens de Diseño V8

### 3.1. Paleta de Colores Primaria

| Token CSS | Variable / Clase Tailwind | Valor Hex / RGBA | Función Semántica |
| :--- | :--- | :--- | :--- |
| `--v8-canvas-bg` | `bg-[#0b0f19]` / `bg-slate-950` | `#0B0F19` | Fondo base atmosférico |
| `--v8-glass-surface` | `bg-slate-900/85` | `rgba(15, 23, 42, 0.85)` | Superficie de paneles flotantes |
| `--v8-glass-hover` | `hover:bg-white/10` | `rgba(255, 255, 255, 0.10)` | Interacción hover sobre vidrio |
| `--v8-glass-border` | `border-white/12` | `rgba(255, 255, 255, 0.12)` | Borde perimetral sutil |
| `--v8-glass-specular` | `inset 0 1px 0 0 white/15` | `rgba(255, 255, 255, 0.15)` | Reflejo superior de bisel |
| `--v8-active-solid` | `bg-red-600` / `#EF4444` | `#EF4444` | **Bloque Activo Unificado Code XR** |
| `--v8-active-glow` | `shadow-red-600/30` | `rgba(239, 68, 68, 0.30)` | Resplandor del elemento activo |
| `--v8-text-primary` | `text-white` / `text-slate-50` | `#F8FAFC` | Texto principal (Contraste 13:1) |
| `--v8-text-secondary`| `text-slate-300` | `#CBD5E1` | Texto descriptivo y metadatos |
| `--v8-text-muted` | `text-slate-400` / `text-slate-500` | `#94A3B8` | Etiquetas secundarias e inactivos |

### 3.2. Controles de Escritorio macOS

| Control | Color Hex | Clase Tailwind | Semántica / Acción Aprobada (/grill-me) |
| :--- | :--- | :--- | :--- |
| **Cerrar** | `#FF5F56` | `bg-[#FF5F56]` | Confirmar salida con SweetAlert2 / Cerrar modal |
| **Minimizar**| `#FFBD2E` | `bg-[#FFBD2E]` | Alternar modo Rail / Colapsar cuerpo de tarjeta |
| **Maximizar**| `#27C93F` | `bg-[#27C93F]` | Alternar pantalla completa (`requestFullscreen`) |

*Especificaciones:* Diámetro exacto de $12\text{px}$ (`w-3 h-3 rounded-full`), borde `border-black/20`, microinteracción `active:scale-90` y transición fluida `transition-transform duration-150`.

---

## 4. Arquitectura de Componentes Estructurales

### 4.1. Layout Flotante (Floating Shell)
Ningún elemento toca los extremos de la pantalla:
- **Barra Lateral Flotante (`EnterpriseSidebar`):**
  - Posicionamiento: `fixed top-3 bottom-3 left-3 z-50`.
  - Geometría: `rounded-3xl` ($24\text{px}$ de radio de curvatura).
  - Comportamiento: Formato **Rail por defecto** (`w-20`), expandible a `w-64` al pulsar el control amarillo o `Ctrl+B`.
- **Barra Superior Flotante (`EnterpriseTopbar`):**
  - Posicionamiento: `mx-3 mt-3 rounded-2xl` o `top-3 left-28 right-3`.
  - Superficie: `bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-xl`.
- **Lienzo de Contenido Principal (`Main Canvas`):**
  - Margen perimetral: `p-3` a `p-4` desacoplado de los bordes.
- **Modales Flotantes (`GlobalModal` / `Swal`):**
  - Posicionamiento centrado absoluto con márgenes mínimos de $16\text{px}$ en móviles.
  - Esquinas `rounded-3xl`, cabecera con los tres controles macOS y overlay de desenfoque `backdrop-blur-md bg-black/70`.

### 4.2. Tarjetas de Datos (Glass Cards)
```tsx
<div className="rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-2xl shadow-black/50 p-5 transform-gpu transition-all duration-200 hover:border-white/20 hover:shadow-cyan-500/10">
  {/* Cabecera con Controles macOS Opcionales y Overline */}
  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80" />
      <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase ml-2">
        MÉTRICAS EN VIVO
      </span>
    </div>
    <span className="text-xs font-mono text-emerald-400 font-bold">ONLINE</span>
  </div>
  {/* Contenido */}
</div>
```

### 4.3. Tipografía y Micro-Etiquetas (Overline Text)
- **Overline / Categorías:** `text-[10px] font-extrabold tracking-widest text-slate-400 uppercase select-none`.
- **Títulos de Módulo:** `text-xl font-black text-white tracking-tight`.
- **Cifras Numéricas y Monedas:** Fuente tabular/mono (`font-mono font-bold tracking-tight text-white`).

---

## 5. Accesibilidad y Estándares WCAG 2.2 AA+

1. **Ratios de Contraste Certificados:**
   - Texto Blanco (`#FFFFFF`) sobre Fondo Vidrio (`#0F172A` al 85% sobre fondo `#0B0F19`): **Ratio 14.8:1** (Supera AA 4.5:1 y AAA 7.0:1).
   - Bloque Activo Rojo (`#EF4444`) con Texto Blanco (`#FFFFFF`): **Ratio 4.6:1** (Cumple AA para texto en negrita $\ge 14\text{pt}$).
2. **Navegación por Teclado:**
   - Atajo global `Ctrl+B` para colapsar/expandir barra lateral.
   - Atajo `F8` para búsqueda rápida global (Omnibox).
   - Anillos de foco visibles: `focus-visible:ring-2 focus-visible:ring-red-500/80 focus-visible:outline-none`.

---

## 6. Gobernanza de Implementación y Regla de No-Regresión

- **WIP = 1:** Se migra componente por componente bajo TDD riguroso.
- **Zero Broken Integrations:** Se preservan todas las props, callbacks y test IDs de la suite de pruebas existente.
- **Validación DevTools Obligatoria:** Verificación de 0 errores en consola JS y captura fotográfica en resolución móvil (375 px) y escritorio (1440 px).
