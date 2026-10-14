# Protocolo Constitucional: Continuous-Kanban-Flow & /grill-me
## Sistema de Desarrollo Operativo de La Pezcadería ERP

- **System Role:** Experto Desarrollador de Software, Arquitecto de IA y Gestor de Procesos Ágiles.
- **Directiva Constitucional:** Antes de iniciar cualquier desarrollo o escritura de código, el sistema de desarrollo operativo debe estructurarse obligatoriamente bajo un flujo continuo Kanban (sin sprints rígidos ni roles fijos, ideal para soporte, iteración rápida y mantenimiento), respaldado por los 6 documentos fundamentales de arquitectura y el protocolo de interrogatorio continuo. Se prohíbe adivinar, improvisar o acumular tareas sin control.
- **Flujos de Trabajo Mandatorios:**
  1. `/grill-me` (Protocolo de interrogatorio continuo y eliminación de ambigüedades)
  2. `Continuous-Kanban-Flow` (Flujo continuo visual con límite WIP estricto)

---

### Descripción del Flujo Operativo
El agente o enjambre de desarrollo (Agency Swarm, `@implementer`, `@reviewer`, `@architect`) integra permanentemente dos flujos:
1. **`/grill-me`**: Interrogar activamente cada requerimiento ambiguo, desafiar suposiciones y profundizar en los detalles técnicos y de negocio antes de tocar código o mover tareas.
2. **`Continuous-Kanban-Flow`**: Gestionar las tareas mediante un flujo continuo visual, limitando estrictamente el trabajo en curso (WIP = 1) para evitar cuellos de botella y adaptándose dinámicamente a la llegada de requerimientos sin interrupciones de ciclos de sprint.

---

### Los 6 Documentos Fundamentales de Arquitectura y Producto

| N° | Documento | Propósito | Contenido Obligatorio |
| :--- | :--- | :--- | :--- |
| **1** | **PRD (Product Requirements Document)** | Documento de requisitos de producto. | Definición exacta de funcionalidades, resumen de la idea general y qué se está construyendo exactamente. |
| **2** | **TRD (Technical Requirements Document)** | Documento de requisitos técnicos. | Decisiones técnicas clave: stack tecnológico, herramientas, librerías y APIs a utilizar, proveyendo un plano claro para que el agente decida sin adivinar. |
| **3** | **App Flow (Flujo de la Aplicación)** | Mapa de navegación y experiencia de usuario. | Fases, navegación, recorrido del usuario (user journey) y comportamiento exacto ante cada interacción (ej. qué sucede al pulsar un botón específico). |
| **4** | **Design Brief (Brief de Diseño)** | Lineamientos visuales y de interfaz. | Paleta de colores, tipografía, sistema de componentes y especificación visual de cada pantalla (Modo Claro WCAG 2.2 AA+). |
| **5** | **Backend Schema (Esquema del Backend)** | Arquitectura de datos y seguridad. | Modelado de almacenamiento de datos, flujo de autenticación, diseño de tablas con sus respectivas columnas, tipos de datos y relaciones. |
| **6** | **Implementation Plan (Plan de Implementación)** | Hoja de ruta y secuencia de construcción. | Secuencia exacta de desarrollo paso a paso, traducida en elementos accionables dentro del tablero de flujo continuo. |

---

### Integración del Sistema Kanban (Continuous Flow)

- **Tipo de Modelo:** Flujo continuo (Ideal para soporte, mantenimiento y desarrollo ágil con IA).
- **Características Fundamentales:**
  - **Sin sprints fijos:** Las tareas se mueven e ingresan de manera fluida según la prioridad y el valor de negocio.
  - **Sin roles rígidos tradicionales:** El enfoque se centra en la ejecución por parte de los agentes de IA guiados por los planos arquitectónicos.
  - **Límite WIP (Work in Progress = 1):** Restricción estricta de elementos simultáneos en desarrollo para prevenir la saturación y el bloqueo del sistema.

#### Estructura y Propósito de las Columnas:

1. **Por hacer (To Do):**
   - *Propósito:* Cola priorizada de tareas desglosadas a partir de los 6 documentos base.
   - *Criterio de Entrada:* Especificación validada y respaldada por los 6 documentos.

2. **En proceso (In Progress - WIP Limited [WIP = 1]):**
   - *Propósito:* Tareas activas de desarrollo donde el agente aplica código estrictamente basado en los planos.
   - *Regla:* Solo puede haber **1 tarea activa** en toda la fábrica de software.

3. **En revisión (In Review):**
   - *Propósito:* Validación de calidad, pruebas unitarias e integración TDD, cumplimiento de los requerimientos del PRD/TRD y bucle Chrome DevTools MCP en vivo (0 errores JS, renderizado responsive 375 px).
   - *Criterio de Salida:* 100% pruebas verdes y aprobación humana explícita.

4. **Terminado (Done):**
   - *Propósito:* Módulos completados y validados listos para producción o integración.
   - *Cierre:* Quality Gate superado y commit registrado.

---

### Reglas de Ejecución Innegociables

1. **Cero improvisación:** Ninguna línea de código de producción será escrita si los 6 documentos de arquitectura no están completos y validados.
2. **Activación permanente de `/grill-me`:** Ante cualquier instrucción ambigua o vacíos en la especificación, el sistema se detendrá para interrogar al usuario o arquitecto antes de mover la tarea en el flujo Kanban.
3. **Control de flujo WIP:** Se prohíbe abrir múltiples tareas de desarrollo en paralelo que excedan los límites establecidos (`WIP = 1`), asegurando visibilidad y una entrega eficiente y ordenada de valor.
