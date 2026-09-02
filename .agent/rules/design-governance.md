# Gobernanza de Diseño UI/UX, Arquitectura e Integridad de Código

Esta regla establece las directivas preceptivas y obligatorias que todo agente de IA o desarrollador debe seguir en este repositorio:

---

## 1. Gobernanza de Diseño UI/UX (Penpot & DESIGN.md)
1. **Fuente de Verdad de Diseño:** Antes de generar o editar cualquier vista o componente, es **OBLIGATORIO** consultar [`DESIGN.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/DESIGN.md) y las directivas de layout de [`.agents/skills/penpot-design-system/SKILL.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.agents/skills/penpot-design-system/SKILL.md).
2. **Prohibición de Estilos Ad-Hoc:** No se deben inventar colores hexadecimales o espaciados arbitrarios fuera de los tokens definidos en el sistema.
3. **Cero Placeholders:** Queda estrictamente prohibido el uso de textos de relleno genéricos (*"Lorem Ipsum"*). Toda demostración debe incluir datos reales del dominio pesquero, cárnico o ferretero.
4. **Accesibilidad Obligatoria:** Todo componente interactivo debe cumplir con contraste mínimo **4.5:1** (WCAG 2.1 AA) sobre fondo oscuro/vidrio.

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
