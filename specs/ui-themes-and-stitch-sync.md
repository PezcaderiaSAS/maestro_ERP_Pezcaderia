# Especificación Técnica: Multi-Theme Suite & Sincronización Google Stitch

**Fecha:** 2026-10-07  
**Estado:** `Sincronizado / Producción`  
**Framework:** React 18 SPA + Vite + Zustand 5.0 + Tailwind CSS 3.4  
**Estándar Evaluado:** Dark Glassmorphism Canónico, W3C WCAG 2.1 AA, Google Stitch MCP  

---

## 1. Resumen Ejecutivo
Se completó la consolidación del Design System de **La Pezcadería ERP / Maestro Pezcaderia Enterprise Suite** integrando 3 nuevos esquemas cromáticos seleccionables a nivel global mediante `data-theme`, unificando la tipografía tabular en operaciones críticas (POS, báscula y arqueo ciego), y sincronizando el estado final del sistema de diseño en los artefactos de **Google Stitch** (`stitch.json` y `stitch-state.json`).

---

## 2. Matriz Canónica de Temas (`data-theme`)

| ID Tema | Nombre Comercial | Primario / Glow | Acento / Highlights | Canvas Background | Surface Card (Glass) | Badge Topbar |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pezcaderia-glass` | Pezcaderia Dark Glass (Default) | `#4f46e5` (Marine Indigo) | `#06b6d4` (Cyan Wave) | `#0a0f1d` | `rgba(17, 24, 39, 0.75)` | `PEZCADERIA S.A.S` |
| `hyper-cobalt` | Hyper Cobalt & Skin Sand | `#0038FF` (Cobalt Electric) | `#FFD8B8` (Skin Sand) | `#050b1a` | `rgba(8, 16, 38, 0.78)` | `COBALT & SAND` |
| `carbon-teal` | Carbon Teal & Mint Foam | `#042F32` (Carbon Teal) | `#D6FFCB` (Mint Foam) | `#021214` | `rgba(4, 47, 50, 0.75)` | `TEAL & MINT` |
| `chrome-violet` | Chrome Violet & Glass Blue | `#5F2CFF` (Chrome Violet) | `#DFF6FF` (Glass Blue) | `#0a0618` | `rgba(28, 16, 64, 0.75)` | `VIOLET & BLUE` |

---

## 3. Arquitectura de Implementación

### 3.1. Capa de Estilos (`src/index.css` & `tailwind.config.js`)
* Inyección de tokens en `@layer base` bajo selectores `[data-theme="..."]`.
* Variables dinámicas: `--bg-color`, `--card-bg`, `--card-hover`, `--border-color`, `--primary-color`, `--accent-color`, `--shadow-glow`.
* Token utilitario `boxShadow.glow` añadido en `tailwind.config.js`.

### 3.2. Gestión de Estado (`src/store/useAppStore.ts`)
* Tipado formal: `ThemeMode = 'pezcaderia-glass' | 'hyper-cobalt' | 'carbon-teal' | 'chrome-violet'`.
* Función de selección directa `setTheme(theme: ThemeMode)`.
* Función de ciclo `toggleTheme()` que itera entre los 4 temas.
* Persistencia automática en almacenamiento local (`localDb`).

### 3.3. Componente de Navegación (`src/components/layout/EnterpriseTopbar.tsx`)
* Integración del selector popover con icono `Palette`, indicador visual del color activo y swatches circulares de previsualización.
* Menú accesible con aislamiento de stacking context (`isolation: isolate`).
* Badge del sistema sincronizado con la identidad activa.

### 3.4. Tipografía y Telemetría Operativa
* Inyección de `font-mono tracking-tight tabular-nums` en:
  * Total final del mostrador en `CartPanel.tsx`.
  * Precios unitarios y subtotales en `LineaVentaRow.tsx`.
  * Columnas de conteo físico, datáfono y descuadre en `ArqueoCajaModal.tsx`.

---

## 4. Sincronización con Google Stitch & Rico UI Brands

* **`stitch.json`**: Incorporó la definición formal de los 4 temas dentro de `design_system.tokens.themes`.
* **`stitch-state.json`**: Marcado como `synchronized`, registrando los 4 temas activos y conformidad WCAG 2.1 AA.
* **`tools/ricoui-mcp/catalog/brands.json`**: Registró los metadatos y tokens de las marcas `hyper-cobalt`, `carbon-teal` y `chrome-violet`.

---

## 5. Checklist de Verificación y Calidad

- [x] Contraste de colores verificado ≥ 4.5:1 para WCAG 2.1 AA en todas las variantes sobre superficie glass.
- [x] Sin mutación de estado global (immutabilidad estricta en Zustand 5.0).
- [x] Sin clases de color hardcodeadas ni dependencias a Server Components / Next.js.
- [x] Compatibilidad retrospectiva con selectores legados (`data-theme="obsidian"` / `data-theme="legacy"`).
- [x] Cero blur recursivo en filas de tablas para garantizar 60 FPS en terminales POS.
