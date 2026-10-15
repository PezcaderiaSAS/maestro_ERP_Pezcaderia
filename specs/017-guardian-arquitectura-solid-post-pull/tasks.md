# Tareas Granulares de Implementación (/speckit.tasks)

**Código:** SPEC-017  
**Título:** Desglose Atómico de Tareas — Guardián de Arquitectura Supremo y Auditoría Continua SOLID Post-Git-Pull (Master Architect)  
**Estado:** APPROVED_READY_FOR_IMPLEMENTATION (Validado por Agency Swarm — SoftwareArchitect)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — Post `/speckit.analyze`  
**Gobernanza:** Continuous-Kanban-Flow (Límite Estricto WIP = 1)  

---

## Matriz de Tareas Secuenciales (WIP = 1)

```
[TASK-017-01] Regla Constitucional de Gobernanza (.agent/rules/master-architect-solid.md y AGENTS.md)
     │
     ▼
[TASK-017-02] Motor de Auditoría Arquitectónica Determinista (scripts/architecture/audit-solid-boundaries.cjs)
     │
     ▼
[TASK-017-03] Integración en el Ciclo de Vida Git (post-pull.cjs y package.json)
     │
     ▼
[TASK-017-04] Suite TDD de Verificación del Auditor (src/tests/architecturalBoundaries.test.ts)
```

---

### [x] TASK-017-01: Regla Constitucional de Gobernanza y Anclaje en Agentes (COMPLETADA)
* **Estado:** COMPLETADA ✅ (.agent/rules/master-architect-solid.md creado y vinculado en AGENTS.md)
* **Objetivo:** Formalizar la regla de gobernanza vinculante del Master Architect con mandato `MANDATORY_GLOBAL_ENFORCEMENT` para todos los agentes de IA y desarrolladores, integrándola en `AGENTS.md` y `.agent/rules/`.
* **Archivos Afectados:**
  - `.agent/rules/master-architect-solid.md` (creado)
  - `AGENTS.md` (actualizado y vinculado)
* **Entregables Realizados:**
  - Documento constitucional de reglas con especificación exhaustiva de los 4 pilares: SOLID, Architectural Boundaries, DRY/Clean Code y Design Patterns.
  - Registro de la figura del Master Architect y su mandato post-git-pull ineludible.
* **Criterio de Éxito:** Regla visible y sincronizada en el arnés de gobernanza de agentes con política `MANDATORY_GLOBAL_ENFORCEMENT`.

---

### [x] TASK-017-02: Motor de Auditoría Arquitectónica Determinista (COMPLETADA)
* **Estado:** COMPLETADA ✅ (scripts/architecture/audit-solid-boundaries.cjs funcional, 303 archivos auditados en 1.4s, 0 críticas)
* **Objetivo:** Crear el script nativo Node.js ultraligero que escanea el código fuente en $< 1.5\text{ s}$ para detectar violaciones de SOLID y límites arquitectónicos.
* **Archivos Afectados:**
  - `scripts/architecture/audit-solid-boundaries.cjs` (creado y probado)
* **Entregables Realizados:**
  - `checkDomainPurity()`: Detección estricta de imports de infraestructura (`@supabase`, `axios`, etc.) dentro de `src/types/` o entidades puras de negocio.
  - `checkViewSeparation()`: Detección de queries directas o clientes de bases de datos en `src/views/`.
  - `checkSingleResponsibility()`: Detección de archivos que superen 600 líneas útiles alertando sobrecarga de responsabilidades.
  - `checkRouteTypeSafety()`: Validación de uso de `AppRouteId` en rutas.
  - Generador de Scorecard cromático en terminal con código de salida `1` ante violaciones críticas y `0` ante salud estructural.
* **Criterio de Éxito Superado:** Ejecución en 1449 ms (< 1.5s) con diagnóstico preciso y 0 violaciones críticas.

---

### [x] TASK-017-03: Integración en el Ciclo de Vida Git (Post-Pull & Scripts) (COMPLETADA)
* **Estado:** COMPLETADA ✅ (post-pull.cjs integrado como paso 4/5, npm run audit:architecture añadido y probado)
* **Objetivo:** Acoplar la auditoría del Master Architect al ciclo de vida automatizado de puesta en marcha post-pull y proveer comando manual accesible.
* **Archivos Afectados:**
  - `scripts/lifecycle/post-pull.cjs` (actualizado con paso 4/5)
  - `package.json` (script audit:architecture añadido)
* **Entregables Realizados:**
  - Integración del paso `[4/5] Auditoría de Arquitectura Master Architect (SOLID & Boundaries)` en `post-pull.cjs`.
  - Script npm `"audit:architecture": "node scripts/architecture/audit-solid-boundaries.cjs"`.
* **Criterio de Éxito Superado:** Ejecución impecable en 484 ms al correr `npm run audit:architecture`.

---

### [x] TASK-017-04: Suite TDD de Verificación del Auditor y Quality Gate (COMPLETADA)
* **Estado:** COMPLETADA ✅ (9/9 tests pasando al 100%, tsc --noEmit en 0 errores, DevTools 0 errores JS)
* **Objetivo:** Crear pruebas automatizadas en Vitest que certifiquen el funcionamiento del motor de auditoría y asegurar 0 errores de TypeScript.
* **Archivos Afectados:**
  - `src/tests/architecturalBoundaries.test.ts` (creado y probado)
  - `src/tests/b2bContracts.test.ts` (ajuste de tipos de interface)
  - `src/tests/b2bRouteDeliveryService.test.ts` (ajuste a formaPago CONTADO)
* **Entregables Realizados:**
  - Pruebas que validan la detección de infracciones simuladas (falsos negativos prevenidos) para Aislamiento de Dominio, Anti-Patrón Controlador Gordo, SRP y Type-Safety de Navegación.
  - Verificación en vivo de que el código base actual del ERP cumple con los estándares críticos (304 archivos, 0 violaciones críticas).
  - Ejecución de `tsc --noEmit` con 0 errores y confirmación del bucle DevTools MCP (`[error] = 0`).
* **Criterio de Éxito Superado:** Suite `architecturalBoundaries.test.ts` pasando al 100% (9/9 tests), suites B2B pasando (25 tests acumulados) y compilación TypeScript en 0 errores.

---

## Estado Final de SPEC-017
**SPEC-017: Guardián de Arquitectura Supremo y Auditoría Continua SOLID Post-Git-Pull (Master Architect)** ha sido implementada, auditada e integrada al 100% bajo el régimen **Spec Kit SDD v3.0** y **Continuous-Kanban-Flow**.
