# Constitución de La Pezcadería ERP (Protocolo v2.2)

## 1. Stack Tecnológico Central
- **Arquitectura:** Sistema estricto "Data-Driven".
- **Frontend:** React 18, Vite.
- **Lenguaje:** TypeScript estricto.
- **Backend:** Supabase, Edge Functions.
- **Estilos / UI:** Tailwind CSS, Glassmorphism estricto (Dark Mode).
- **Alertas:** SweetAlert2.

## 2. Principios Innegociables de Orquestación Agéntica (v2.2)
- **Control Humano:** El criterio y control humano sobre la ejecución del agente es innegociable. No se avanza a la siguiente fase (Build) sin aprobación de Spec y Plan.
- **Spec-Driven Development (SDD):** Toda funcionalidad o cambio, sin importar su tamaño, debe estar precedido por una especificación (notación EARS) y un plan técnico en `specs/`.
- **Inspección de UI Continua (Loop DevTools):** Tras *CADA* modificación al código base o interfaz, es **obligatorio** que el agente @implementer ejecute Chrome DevTools MCP para verificar:
  - 0 Errores en la consola JS.
  - Correcto renderizado y comportamiento responsivo (prueba mandataria a 375px móvil).
- **Estabilidad de Lógica Base:** Garantizar la no-regresión de la lógica y datos existentes (persistencia local, IndexedDB, etc.).
- **Memoria Condensada:** Mantenimiento estricto de memoria viva en `MEMORY.md` (no debe sobrepasar ~50 líneas) utilizando el comando `/session-sync`.

## 3. Reglas de Negocio y Lógica
- **Zonas Horarias (Fechas):** Es estricto operar **siempre con fechas y zonas locales** (nunca UTC) al calcular rachas, promedios semanales e historiales, evitando desfases para los usuarios.
- **Inventario (Pareto):** Los cálculos de inventario deben priorizar el Análisis ABC (Pareto al 80/20).
- **Depuración Sistemática:** Prohibido hacer "quick patches" adivinando. Obligatorio reproducir el fallo localmente, aislar la causa raíz, formular hipótesis y testear.

## 4. Reglas de Arquitectura y Ahorro de Tokens
- **Modularidad:** Todo el código debe ser modular. Prohibida la lógica pesada en las vistas de UI.
- **Análisis de Impacto:** TIENES PROHIBIDO leer los archivos fuente directamente de forma masiva para entender arquitecturas complejas. Usa las herramientas especializadas (Graphify o Gitnexus).
- **Fuente de Verdad:** Tu fuente principal para contexto estructural son las salidas de Graphify (`graphify query`) o el grafo local `npx gitnexus`.
