---
description: Generación avanzada de componentes e interfaces frontend combinando Google Stitch, sistemas de diseño Rico UI Brands (Linear, Stripe, Raycast, Supabase, Vercel, Apple) y estética Dark Glassmorphism.
---

# Workflow: /stitch-design

Genera interfaces y componentes de alta calidad visual para el ERP utilizando los sistemas de diseño de **Rico UI Brands** (`https://design.ricoui.com/brands`), el servidor MCP **`ricoui-design-mcp`** y el motor **Google Stitch**.

---

## 1. Argumentos del Comando
```bash
/stitch-design <descripcion-vista> [--brand <nombre-marca>] [--theme <dark-glass|light|obsidian>] [--type <dashboard|modal|form|pos|wms>]
```

- **`<descripcion-vista>`**: (Requerido) Descripción de la interfaz a maquetar (ej: "Dashboard de Rendimiento Financiero y Mermas", "Modal de Despiece y Rendimientos", "Terminal de Caja POS").
- **`--brand`**: (Opcional, default: `pezcaderia-glass`) Marca de Rico UI a emular (`linear`, `stripe`, `raycast`, `supabase`, `vercel`, `apple`, `pezcaderia-glass`).
- **`--theme`**: (Opcional, default: `dark-glass`) Tema visual base (`dark-glass`, `obsidian`, `light`).
- **`--type`**: (Opcional, default: `dashboard`) Tipo de vista (`dashboard`, `modal`, `data_table`, `pos`, `wms`, `pricing`).

---

## 2. Fases de Ejecución

### Fase 1: Extracción de Tokens de Marca (Rico UI MCP)
1. Invocar la herramienta MCP `ricoui_get_brand_tokens` o ejecutar el comando CLI:
   ```bash
   node tools/ricoui-mcp/server.cjs tokens $BRAND
   ```
2. Obtener la paleta de colores, familias tipográficas, elevaciones, bordes y recetas Glassmorphism.

### Fase 2: Formateo de Prompt para Google Stitch
1. Invocar `ricoui_format_stitch_prompt` o generar el prompt con `node tools/ricoui-mcp/server.cjs prompt "$DESCRIPCION" $BRAND`.
2. Sincronizar las directivas con los esquemas de `stitch.json` y `DESIGN.md`.

### Fase 3: Generación Visual y Estructura
1. Ejecutar la generación mediante Google Stitch MCP o subagent de diseño.
2. Si se requiere una plantilla base, obtenerla con:
   ```bash
   node tools/ricoui-mcp/server.cjs template $TEMPLATE_ID
   ```

### Fase 4: Construcción de Código en Producción
1. Crear el componente en `src/components/` o `src/views/` con TypeScript estricto.
2. Implementar estilos utilitarios de Tailwind CSS con soporte para Glassmorphism (`backdrop-blur-xl`, `border-white/10`, `bg-slate-900/60`).
3. Integrar iconos de `lucide-react` y micro-animaciones en hover/focus.
4. Asegurar inmutabilidad total de estado y props.

### Fase 5: Verificación de Calidad y Accesibilidad
1. Validar contraste de colores (mínimo 4.5:1 para WCAG 2.1 AA).
2. Comprobar que no existan placeholders genéricos ni textos "Lorem Ipsum".
3. Validar compilación TypeScript y ausencia de errores de lint.
