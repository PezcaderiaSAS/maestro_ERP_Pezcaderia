---
name: sdd
description: Enseña al agente la metodología Spec-Driven Development (SDD): redactar, revisar o cambiar specs (notación EARS), planes técnicos y tareas atómicas.
---

# Spec-Driven Development (SDD) — Protocolo v2.2

Este manual instruye la metodología formal de desarrollo basado en especificaciones (Spec-Driven Development) para cualquier nueva funcionalidad, refactorización o cambio en el ERP.

## 1. Regla Fundamental
> **NUNCA escribir código sin una especificación (`spec.md`), plan técnico (`plan.md`) y desglose de tareas (`tasks.md`) previamente redactados y aprobados.**

## 2. Estructura de Directorios
Cada iteración o característica reside en:
```
specs/NNN-nombre-funcionalidad/
├── spec.md      # El QUÉ y POR QUÉ (notación EARS, agnóstica de librerías/clases)
├── plan.md      # El CÓMO (arquitectura, funciones puras, contratos, estrategia de tests)
└── tasks.md     # Desglose de tareas atómicas con criterios de aceptación
```

## 3. Notación EARS para Requisitos
Redactar los requisitos funcionales utilizando la sintaxis EARS (Easy Approach to Requirements Syntax):

1. **Requisitos Ubicuos (Siempre activos):**
   - *Sintaxis:* `El sistema deberá <acción>`
2. **Requisitos Dirigidos por Eventos:**
   - *Sintaxis:* `CUANDO <evento>, el sistema deberá <acción>`
3. **Requisitos Dirigidos por Estado:**
   - *Sintaxis:* `MIENTRAS <estado>, el sistema deberá <acción>`
4. **Requisitos Opcionales:**
   - *Sintaxis:* `DONDE <opción/característica esté habilitada>, el sistema deberá <acción>`
5. **Requisitos No Deseados / Excepciones:**
   - *Sintaxis:* `SI <condición de error/anomalía>, ENTONCES el sistema deberá <acción defensiva>`

## 4. Desglose de Tareas Atómicas (`tasks.md`)
Cada tarea debe contener:
- Identificador claro (`T-1.1`, `T-1.2`, etc.)
- Descripción atómica ejecutable de forma independiente.
- **Criterio obligatorio de aceptación (Loop DevTools):**
  `- [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).`

## 5. Ciclo de Vida de los Agentes
1. `@coordinator`: Recibe el requerimiento y delega a `@planner`.
2. `@planner`: Redacta `spec.md`, `plan.md` y `tasks.md`. Solicita aprobación humana.
3. `@implementer`: Aplica TDD estricto tarea por tarea, ejecutando tras cada actualización el MCP de `chrome-devtools`.
4. `@reviewer`: Realiza segunda verificación con DevTools y contra `docs/constitution.md` antes de aprobar el cierre.
