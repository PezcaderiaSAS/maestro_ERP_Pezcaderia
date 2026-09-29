# Gobernanza de Diseño UI/UX, Arquitectura e Integridad de Código

Esta regla establece las directivas preceptivas y obligatorias que todo agente de IA o desarrollador debe seguir en este repositorio:

---

## 1. Gobernanza de Diseño UI/UX (Penpot & DESIGN.md)
1. **Fuente de Verdad de Diseño:** Antes de generar o editar cualquier vista o componente, es **OBLIGATORIO** consultar [`DESIGN.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DESIGN.md) y las directivas de layout de [`.agents/skills/penpot-design-system/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/penpot-design-system/SKILL.md).
2. **Prohibición de Estilos Ad-Hoc:** No se deben inventar colores hexadecimales o espaciados arbitrarios fuera de los tokens definidos en el sistema.
3. **Cero Placeholders:** Queda estrictamente prohibido el uso de textos de relleno genéricos (*"Lorem Ipsum"*). Toda demostración debe incluir datos reales del dominio pesquero, cárnico o ferretero.
4. **Accesibilidad Obligatoria:** Todo componente interactivo debe cumplir con contraste mínimo **4.5:1** (WCAG 2.1 AA) sobre fondo oscuro/vidrio.
5. **El Tridecálogo Canónico del CSS Moderno & Frontend (Ground Truth):**
   - **(a) Control de Especificidad `@layer`:** Organizar estilos en `@layer base, components, utilities;` para erradicar el uso y guerras de `!important`.
   - **(b) Aislamiento de Stacking Context:** Jamás usar `z-index: 9999` o `99999`. Usar `isolation: isolate` (`isolate` en Tailwind) con índices controlados.
   - **(c) Erradicación de Márgenes en Hijos:** Prohibido `margin-bottom: 24px; :last-child { margin-bottom: 0 }`. El espaciado pertenece al contenedor (`flex flex-col gap-6` o `grid gap-6`).
   - **(d) Trampa de `height: 100%`:** Usar `min-height: 100dvh` (`min-h-dvh` en Tailwind) para adaptarse al viewport dinámico sin depender de alturas en ancestros.
   - **(e) Centrado Moderno de Una Línea:** Prohibido centrar con `position: absolute; top: 50%; transform: translate(-50%, -50%)`. Usar `display: grid; place-items: center` (`grid place-items-center` en Tailwind) o `align-content: center`.
   - **(f) Tipografía y Dimensiones Fluidas con `clamp()`:** Prohibido saturar con `@media queries` fijas. Usar `font-size: clamp(1.5rem, 4vw, 3rem);`.
   - **(g) Anchor Positioning:** Posicionar tooltips, popovers y dropdowns vinculados nativamente (`anchor-name` y `position-anchor`) sin cálculos en JS.
   - **(h) Selector Relacional `:has()`:** Estilar contenedores padres basados en el estado de hijos (`form:has(:invalid) button` o `.card:has(img)`).
   - **(i) View Transitions API:** Transiciones de página y morphing declarativo nativo con `@view-transition { navigation: auto; }`.
   - **(j) Container Queries (`@container`):** Modularidad real adaptando componentes al ancho de su contenedor directo, no al viewport global.
   - **(k) Tipografía Balanceada y Anti-Huérfanas:** Aplicar `text-wrap: balance` (`text-balance` en Tailwind) a títulos y `text-wrap: pretty` (`text-pretty`) a párrafos.
   - **(l) CSS Nesting Nativo:** Anidamiento directo estilo Sass sin preprocesadores (`& h2`, `&:hover`, `@media` anidado).
   - **(m) CSS Subgrid:** Alinear componentes hijos de cuadrícula a las pistas del padre con `subgrid` (`grid-rows-subgrid` / `grid-cols-subgrid` en Tailwind).




---

## 2. Gobernanza de Arquitectura y Refactorizaciones (Archify C4)
1. **Modelado Previo:** Antes de implementar un nuevo módulo o realizar refactorizaciones que afecten a más de 3 archivos, se debe generar un diagrama C4 o de secuencia usando [`.agents/skills/archify-architecture/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/archify-architecture/SKILL.md) o `/archify`.
2. **Separación de Capas:** Las vistas no deben contener lógica de consulta directa a la base de datos; deben delegar en la capa de servicios (`src/services/`).

---

## 3. Humanización de Textos y Comunicación (Humanizer)
1. **Erradicación de Clichés de IA:** Todos los textos de interfaz, mensajes de error, comentarios y descripciones de Pull Request deben pasar por el filtro de [`.agents/skills/humanizer-refinement/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/humanizer-refinement/SKILL.md) o `/humanize`.
2. **Tono Asertivo y Profesional:** Comunicación directa, sin preámbulos ceremoniosos ni relleno sintético.

---

## 4. Rigor Matemático y Conversión de Unidades (Scientific Analytics)
1. **Conversión Estricta Gramos a Kilos:** En todas las operaciones de báscula, POS y WMS, la conversión debe realizarse obligatoriamente como:
   `const weightInKg = Math.round((weightInGrams / 1000) * 1000) / 1000;`
2. **Análisis Pareto ABC (80/20):** La categorización de inventario debe realizarse con el algoritmo determinista de [`.agents/skills/scientific-agent-analytics/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/scientific-agent-analytics/SKILL.md).
