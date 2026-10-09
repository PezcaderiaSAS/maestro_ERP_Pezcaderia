---
name: erp-pos-design-tokens
description: |
  Fuente de la verdad canónica para tokens de diseño Light Mode WCAG AA+ (ratio >= 4.5:1 y >= 7:1)
  para POS, Caja, Bodega, Inventario y todos los módulos operativos de MaestroPescadería ERP.
  Basada en directrices de diseño SaaS de Stripe, Linear y ui-ux-pro-max-skill.
---

# Fuente de la Verdad: Tokens de Diseño Light Mode WCAG AA+ (MaestroPescadería ERP)

Este documento es la **especificación canónica inmutable** de tokens de diseño, contrastes cromáticos y estándares de interacción táctil para La Pezcadería ERP. Diseñado específicamente para entornos de bodega, punto de venta y luz natural intensa.

---

## 1. Paleta Cromática Canónica (Light Mode de Alto Contraste)

Todos los colores de fondo, superficie, texto y bordes deben cumplir estrictamente con los estándares **WCAG 2.2 Nivel AA y AAA** (relación de contraste mínima de 4.5:1 para texto normal, 3:1 para texto grande/elementos de UI, y 7:1 para nivel AAA).

### A. Superficies y Fondos
| Token | Hex | Tailwind | Ratio de Contraste con Texto Primario | Uso Exclusivo |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-app` | `#f8fafc` | `slate-50` | 18.1:1 (AAA) | Fondo de la aplicación global y viewport |
| `--bg-subtle` | `#f1f5f9` | `slate-100` | 15.6:1 (AAA) | Contenedores secundarios, headers de tabla, barras de herramientas |
| `--card-bg` | `#ffffff` | `white` | 18.5:1 (AAA) | Tarjetas de producto, modales, paneles flotantes, dropdowns |
| `--input-bg` | `#ffffff` | `white` | 18.5:1 (AAA) | **OBLIGATORIO en todos los inputs, selects y textareas** |
| `--bg-hover` | `#e2e8f0` | `slate-200` | 11.2:1 (AAA) | Hover en filas, botones neutros y tabs |

### B. Jerarquía Tipográfica y Texto (Sobre Fondo Blanco `#ffffff`)
| Token | Hex | Tailwind | Ratio de Contraste | Aplicación |
| :--- | :--- | :--- | :--- | :--- |
| `--text-primary` | `#0f172a` | `slate-900` | **18.5:1** (AAA) | Títulos, valores ingresados en inputs, totales monetarios, SKU |
| `--text-secondary` | `#334155` | `slate-700` | **9.5:1** (AAA) | Etiquetas (labels), texto informativo, categorías, subtítulos |
| `--text-muted` | `#64748b` | `slate-500` | **4.6:1** (AA) | Placeholders de inputs, metadatos secundarios, fechas |
| `--text-inverse` | `#ffffff` | `white` | 18.5:1 (en fondo primario) | Texto dentro de botones de acción saturados |

> ⚠️ **PROHIBICIÓN ESTRICTA:** Queda prohibido usar texto blanco (`text-white`, `#ffffff`) o gris muy claro (`#e2e8f0`) sobre fondos blancos o claros.

### C. Bordes y Delimitadores Visuales
| Token | Hex | Tailwind | Uso |
| :--- | :--- | :--- | :--- |
| `--border-color` | `#e2e8f0` | `slate-200` | Separadores entre filas, bordes de tarjetas |
| `--border-strong` | `#cbd5e1` | `slate-300` | **Borde predeterminado de inputs, selects y botones** |
| `--border-hover` | `#94a3b8` | `slate-400` | Hover sobre inputs interactivos |
| `--focus-ring` | `#4f46e5` | `indigo-600` | Focus en inputs (con `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.20)`) |

### D. Semáforo Operativo y Acciones Funcionales
| Semáforo | Fondo Suave | Borde | Texto / Icono | Botón Sólido | Significado Operativo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Verde (Ingreso / Éxito)** | `#ecfdf5` (emerald-50) | `#a7f3d0` | `#065f46` (emerald-800) | `#059669` (emerald-600) | Entra dinero, cobro exacto, stock óptimo (> 10 uds) |
| **Azul/Cyan (Frío / B2B)** | `#eff6ff` (blue-50) | `#bfdbfe` | `#1e40af` (blue-800) | `#0284c7` (sky-600) | Cuarto frío, alistamiento B2B, pedidos consolidados |
| **Ámbar (Pendiente / Caja)** | `#fffbeb` (amber-50) | `#fde68a` | `#92400e` (amber-800) | `#d97706` (amber-600) | Caja cerrada, stock bajo (< buffer), retiro parcial |
| **Rojo (Alerta / Deuda)** | `#fef2f2` (red-50) | `#fecaca` | `#991b1b` (red-800) | `#dc2626` (red-600) | Stock agotado (0 uds), deuda en mora, cancelar |

---

## 2. Reglas de Diseño de Inputs para Operadores de POS y Bodega

1. **Fondo de Input:** Siempre blanco puro (`#ffffff`), nunca transparente ni oscuro.
2. **Borde de Input:** Visible con luz artificial o sol directo: `1.5px solid #cbd5e1`.
3. **Tipografía del Input:**
   - Montos y cantidades: `font-size: 16px` o `18px`, `font-weight: 700`, `font-family: monospace / tabular-nums`.
   - Color del valor digitado: `#0f172a` (negro azulado profundo).
4. **Placeholder:** `#64748b` con peso regular (400) para no confundirse con texto digitado.
5. **Labels de Input:** Ubicadas arriba del input, `font-size: 12px` o `13px`, `font-weight: 700`, `color: #334155`.
6. **Focus State:** Borde `#4f46e5` y resplandor sutil `ring-2 ring-indigo-500/20`.

---

## 3. Botones y Elementos Táctiles (Regla de los 12 Años)

1. **Tamaño Mínimo:** Los botones de acción operativos deben tener una altura mínima de **44px** (óptimo 48px).
2. **Billetes Rápidos ($10k, $20k, $50k, $100k):**
   - Fondo: `#f1f5f9` (slate-100)
   - Borde: `#cbd5e1` (slate-300)
   - Texto: `#0f172a` (slate-900), font-weight: 700
   - Hover: `#e2e8f0` (slate-200)
3. **Botón Cobrar:**
   - Fondo: Degradado de `indigo-600` a `cyan-600` o `#059669` (emerald-600).
   - Texto: `#ffffff` en negrita extrema, con etiqueta del atajo `F2 / Enter`.
4. **Botón Exacto:**
   - Fondo: `#e0e7ff` (indigo-100) con texto `#3730a3` (indigo-800).
   - Borde: `#c7d2fe`.

---

## 4. Tarjetas de Productos en el Catálogo

- **Fondo:** `#ffffff` (blanco puro) con borde `1px solid #e2e8f0` y sombra sutil `0 1px 3px rgba(0,0,0,0.06)`.
- **Nombre del Producto:** `#0f172a` en mayúsculas, tamaño 13px, font-weight 700.
- **Etiqueta de Precio:** Pastilla oscura `#1e293b` con texto blanco `#ffffff`, o pastilla `#e0e7ff` con texto `#3730a3`.
- **Indicadores de Stock:** Semáforo circular verde/amarillo/rojo con borde blanco de 2px.
- **Hover:** Elevación suave con `transform: translateY(-2px)` y sombra `0 6px 16px rgba(0,0,0,0.08)`.

---

## 5. Alertas SweetAlert2 en Light Mode

- Fondo de modal: `#ffffff`
- Título: `#0f172a`
- Texto de contenido: `#334155`
- Inputs dentro de SweetAlert2: `#ffffff` de fondo, texto `#0f172a`, borde `#cbd5e1`.
- Botón confirmar: `#4f46e5` o `#059669`.
- Botón cancelar: `#f1f5f9` con texto `#475569`.
