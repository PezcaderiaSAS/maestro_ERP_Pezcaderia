# Gobernanza de Modelado: Mandatory Multi-Phase System Modeling & Diagramming

**Política de Agencia:** `MANDATORY_GLOBAL_ENFORCEMENT`  
**Rol del Agente:** Principal Software Architect & Systems Engineer  
**Evento Disparador:** Activación automática en cada `git pull` (`.husky/post-merge`, `scripts/lifecycle/post-pull.cjs` y `npm run session:pull`)  
**Audiencia Objetivo:** Todos los agentes de IA (Subagents, Agency Swarm, Antigravity, Claude) y desarrolladores del proyecto.  
**Sintaxis Requerida:** Markdown con bloques `mermaid` válidos.

---

## 1. Directiva Suprema (Supreme Directive)

> **MANDATO VINCULANTE & PENALIZACIÓN INMEDIATA:**  
> Antes de escribir, modificar o proponer cualquier lógica de backend, implementación de frontend, migración de base de datos o script SQL, el asistente TIENE LA **OBLIGACIÓN ESTRICTA** de generar y validar un conjunto exhaustivo de diagramas de ingeniería que cubran la lógica, el flujo operativo, la persistencia de datos y la interacción de componentes.  
> **Penalización por Incumplimiento:** Negativa inmediata de generación de código hasta que todos los modelos estructurales y diagramas obligatorios estén completamente definidos, presentados y aprobados.

---

## 2. Los 5 Diagramas de Ingeniería Obligatorios

Para cualquier requerimiento, módulo, flujo o especificación activa dentro de `specs/NNN-nombre/spec.md`, es mandatorio estructurar y presentar paso a paso los siguientes 5 diagramas antes de redactar una sola línea de código:

### 1. Flujo de Procesos (`1_process_flowcharts`)
- **Propósito:** Pasos secuenciales y ciclo de vida del negocio.
- **Elementos requeridos:** Bloques de proceso estándar (rectángulos `[Acción]`), orden cronológico y transiciones de estado.
- **Sintaxis Mermaid:** `flowchart TD` o `graph TD`.

### 2. Rombos de Decisión y Lógica Condicional (`2_decision_logic_diagrams`)
- **Propósito:** Bifurcaciones condicionales, reglas de negocio, validaciones de cupo/crédito, manejo de mermas y casos de borde.
- **Elementos requeridos:** Compuertas de decisión en rombo (`{¿Cumple condición?}`), mapeando todas las rutas de ejecución posibles (Éxito, Fallo, Excepción, Cuarentena).
- **Sintaxis Mermaid:** `flowchart TD` con al menos un nodo en rombo `{...}`.

### 3. Modelo Entidad-Relación (`3_entity_relationship_diagrams`)
- **Propósito:** Diseño de persistencia, esquema relacional en PostgreSQL y aislamiento multi-tenant.
- **Elementos requeridos:** Definición de entidades, atributos tipados, llaves primarias (`PK`), llaves foráneas (`FK`) y cardinalidad explícita (`||--o{`, `||--||`).
- **Sintaxis Mermaid:** `erDiagram`.

### 4. Diagrama de Secuencia (`4_sequence_diagrams`)
- **Propósito:** Flujo temporal de interacción y mensajería entre el usuario, componentes React, adaptadores de servicio y endpoints de Supabase/Upstash.
- **Elementos requeridos:** Líneas de vida (`actor`, `participant`), llamadas síncronas (`->>`), respuestas (`-->>`) y notas de contexto.
- **Sintaxis Mermaid:** `sequenceDiagram`.

### 5. Arquitectura de Componentes y Límites de Capas (`5_component_architecture_diagrams`)
- **Propósito:** Estructura modular de alto nivel respetando los límites limpios (Presentación, Casos de Uso/Lógica de Negocio, Acceso a Datos/Infraestructura).
- **Elementos requeridos:** Subsistemas, submódulos, contratos de interfaz y líneas de dependencia unidireccionales (nunca invertidas).
- **Sintaxis Mermaid:** `graph TB` o `flowchart TB` organizado en `subgraph`.

---

## 3. Protocolo de Ejecución Automática en Git Pull

El hook `.husky/post-merge` y el pipeline `npm run session:pull` ejecutan automáticamente:
```bash
node scripts/architecture/audit-diagrams-compliance.cjs
```

- **Aprobado (Exit Code 0):** Las especificaciones activas cuentan con sus 5 diagramas obligatorios válidos en sintaxis Mermaid.
- **Bloqueado (Exit Code 1):** Falta alguno de los 5 diagramas en las especificaciones en curso. Se bloquea la transición a fase de codificación.

---

## 4. Plantilla de Instrucciones Rápida

```text
Para cualquier requerimiento, módulo o proyecto que debas desarrollar, tienes la obligación estricta de estructurar y presentar paso a paso los siguientes diagramas antes de escribir una sola línea de código:
1. Flujo de procesos (secuencia operativa).
2. Rombos de decisión (reglas de negocio y bifurcaciones).
3. Modelo Entidad-Relación (ER) (esquema de base de datos y llaves).
4. Diagrama de secuencia (interacción entre componentes o servicios).
5. Arquitectura de componentes (estructura general del sistema).

No escribas código de implementación, scripts SQL ni lógica de backend hasta haber presentado y validado cada uno de estos esquemas gráficos.
```
