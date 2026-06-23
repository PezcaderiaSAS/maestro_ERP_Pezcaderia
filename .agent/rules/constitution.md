---
trigger: always_on
---

# Constitución de La Pezcadería ERP

- **Arquitectura:** Sistema estricto "Data-Driven".
- **Frontend:** React 18, Vite.
- **Lenguaje:** TypeScript estricto.
- **Backend:** Supabase.
- **Estilos / UI:** Tailwind CSS.
- **Alertas:** SweetAlert2.
- **Estructura de Código:** Todo el código debe ser modular. No debe existir lógica pesada en las vistas.
- **Regla de Negocio (Inventario):** Los cálculos de inventario deben priorizar el Análisis ABC (Pareto al 80/20).
### Reglas de Arquitectura y Ahorro de Tokens
1. Para cualquier análisis de código, dependencias o arquitectura en este ERP, TIENES PROHIBIDO leer los archivos fuente directamente de forma masiva.
2. Tu única fuente de verdad para el contexto estructural es Graphify.
3. Antes de ejecutar comandos como `/speckit.plan` o `/speckit.analyze`, DEBES ejecutar en la terminal el comando `graphify query "<lo que necesitas saber>"` o leer el archivo `graphify-out/graph.json`.