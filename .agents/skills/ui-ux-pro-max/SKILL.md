---
name: ui-ux-pro-max
description: |
  Inteligencia de diseño UI/UX para desarrollo frontend de alto impacto. 
  Proporciona patrones de flujo de trabajo SaaS, sistemas de diseño Light Mode,
  directrices de formularios y data tables, y contraste WCAG 2.2 AA/AAA.
  Inspirado en nextlevelbuilder/ui-ux-pro-max-skill, saas-admin-dashboard y Figma/Linear conventions.
---

# UI/UX Pro Max: Inteligencia de Diseño Frontend Enterprise

Esta skill actúa como el cerebro de diseño de frontend empresarial para evitar interfaces genéricas o con problemas de contraste. Define patrones probados de diseño SaaS y POS en Light Mode.

---

## 1. Patrones de Flujo de Trabajo SaaS (Workflow Patterns)

### A. AppShell Responsivo
- **Estructura:** Header superior fijo (h-16) + Sidebar lateral colapsable (64px / 256px) + Área de trabajo principal con scroll independiente.
- **Jerarquía:**
  - Header: Fondo `#ffffff` o traslúcido con backdrop-blur, borde inferior `#e2e8f0`, buscador global (Cmd+K / Ctrl+K), selector de sede/sucursal, estado de red y perfil.
  - Sidebar: Fondo `#ffffff`, navegación con grupos de dominio, indicadores de estado numéricos (badges de alertas pendientes) y selección activa con acento de color.
  - Área Principal: Fondo `#f8fafc` (slate-50), padding responsivo `p-4 lg:p-6`, sin scroll horizontal innecesario.

### B. Maestro-Detalle y Vistas Divididas (Split-Pane)
- Ideal para POS (Catálogo 70% | Carrito y Pago 30%) y Consolidación B2B (Lista de Pedidos 35% | Detalle de Alistamiento 65%).
- Scroll desacoplado: cada panel debe tener su propio scroll `overflow-y-auto` sin arrastrar toda la página.

### C. Modales y Wizards Táctiles (<= 3 Pasos)
- Tamaño óptimo: `max-w-lg` para operaciones rápidas (apertura de turno, ingreso de peso), `max-w-2xl` para formularios complejos.
- Fondo blanco puro `#ffffff` con `box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`.
- Inputs destacados con labels claros, validación visual inmediata y botones de confirmación de 44px de altura.

---

## 2. Formularios e Inputs de Alto Rendimiento

1. **Visibilidad en Entornos Exigentes:**
   - Todo input debe tener fondo `#ffffff` y borde `1.5px solid #cbd5e1`.
   - Al recibir foco: `border-color: #4f46e5` y `ring-2 ring-indigo-500/20`.
   - Texto del usuario: `#0f172a` (slate-900), con tamaño mínimo de 14px (óptimo 16px para evitar auto-zoom en iOS/móviles).
2. **Formato Monetario y Numérico:**
   - Usar `tabular-nums` para alineación perfecta de columnas de números.
   - Separadores de miles con punto (`.`) y decimales con coma (`,`) en Colombia (`es-CO`).
   - Prefijos visuales inmediatos (`$ `).
3. **Botones de Teclado Rápido:**
   - Botones auxiliares junto a los inputs (`Exacto`, `$10k`, `$20k`, etc.) con estilos de tecla física y hints de atajos (`Space`, `Enter`, `F2`).

---

## 3. Data Tables de Alta Densidad (TanStack Table Style)

- **Header de Tabla:** Fondo `#f1f5f9` (slate-100), texto en mayúsculas `text-xs font-bold text-slate-700`, separadores sutiles.
- **Filas:** Alternancia de filas o fondo blanco con hover `#f8fafc`, borde inferior `1px solid #e2e8f0`.
- **Acciones Rápidas:** Botones compactos con iconos claros (Ver, Editar, Imprimir, Anular).
- **Badges de Estado:** Pastillas con fondo suave (`bg-emerald-50 text-emerald-700 border-emerald-200`) para estados (Aprobado, Pendiente, Rechazado, Listo).

---

## 4. Regla de Oro de Accesibilidad y Color

- **Fondo General:** Siempre claro (`#f8fafc` / `#f1f5f9`).
- **Fondos Oscuros Prohibidos en Vistas Operativas:** No usar temas totalmente oscuros para POS, bodegas o pantallas donde los operarios usen pantallas táctiles o estén bajo iluminación intensa.
- **Contraste Mínimo:** Todos los elementos interactivos y textos deben superar la prueba de contraste WCAG AA (mínimo 4.5:1).
