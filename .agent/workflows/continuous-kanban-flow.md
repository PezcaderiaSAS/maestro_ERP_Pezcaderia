---
description: Gestión de tareas mediante flujo continuo visual Lean Kanban con límite estricto WIP = 1, sin sprints rígidos y guiado por planos arquitectónicos.
argument-hint: "[spec-id o módulo]"
---

# Workflow: Continuous-Kanban-Flow
## Flujo Continuo Visual Lean Kanban para La Pezcadería ERP

### Propósito
Gestionar las tareas de desarrollo, soporte y mantenimiento mediante un flujo continuo visual, eliminando sprints rígidos y roles fijos, e imponiendo un límite de trabajo en curso (**WIP = 1**) para asegurar máxima calidad, cero cuellos de botella y entrega ordenada respaldada por los 6 documentos fundamentales de arquitectura.

### Estructura de Columnas y Políticas

| Columna | Definición y Propósito | Política de Salida (Definition of Done) |
| :--- | :--- | :--- |
| **1. Por hacer (To Do)** | Cola priorizada de tareas desglosadas a partir de los 6 documentos base (PRD, TRD, App Flow, Design Brief, Backend Schema, Plan). | La tarjeta cuenta con criterios de aceptación claros, esquema Zod y tipos TypeScript definidos. |
| **2. En proceso (In Progress)** | **Límite WIP = 1.** Tareas activas de desarrollo donde el agente aplica código quirúrgico estrictamente basado en los planos. | TDD estricto (pruebas primero o acompañando al código). Prohibido tener más de una tarea activa simultáneamente. |
| **3. En revisión (In Review)** | Validación de calidad, pruebas y cumplimiento de los requerimientos descritos en el PRD/TRD. | - 100% pruebas unitarias e integración en verde (`vitest`).<br>- 0 errores de compilación (`tsc --noEmit`).<br>- 0 errores en consola JS con Chrome DevTools MCP.<br>- Renderizado verificado en vista móvil (375 px). |
| **4. Terminado (Done)** | Módulos completados y validados listos para producción o integración. | Aprobación humana explícita confirmada tras la revisión. |

### Reglas de Operación
1. **Los 6 Documentos Base Primero:** Antes de ingresar tarjetas al desarrollo activo, los 6 documentos fundamentales deben estar formalizados y aprobados.
2. **Límite WIP Inviolable:** No se puede pasar una tarjeta a `In Progress` si ya existe una tarea en proceso.
3. **Loop `/grill-me`:** Ante cualquier discrepancia técnica o duda sobre reglas de negocio (ej. manejo de dinero, redondeos en COP, flujos offline), se dispara `/grill-me`.
