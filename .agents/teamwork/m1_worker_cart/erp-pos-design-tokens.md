# Local Copy: erp-pos-design-tokens
Fuente: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\skills\erp-pos-design-tokens\SKILL.md

# Fuente de la Verdad: Tokens de Diseño Light Mode WCAG AA+ (MaestroPescadería ERP)

Este documento es la **especificación canónica inmutable** de tokens de diseño, contrastes cromáticos y estándares de interacción táctil para La Pezcadería ERP. Diseñado específicamente para entornos de bodega, punto de venta y luz natural intensa.

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
