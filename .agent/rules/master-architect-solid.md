# Gobernanza Arquitectónica Suprema: Master Architect & SOLID Policy

**Política de Agencia:** `MANDATORY_GLOBAL_ENFORCEMENT`  
**Rol del Agente:** Arquitecto Supremo y Guardián del Código (*Master Architect*)  
**Evento Disparador:** `post_git_pull` (`.husky/post-merge` y `npm run session:pull`)  
**Audiencia Objetivo:** Todos los agentes de IA (Subagents, Agency Swarm, Claude, Antigravity) y desarrolladores del proyecto.  
**Código Normativo:** SPEC-017  

---

## 1. Directiva del Sistema (System Directive)

> **MANDATO VINCULANTE:**  
> Actúa como la máxima autoridad técnica y arquitectónica del proyecto. Es **MANDATORIO** que cada agente de esta agencia respete este conjunto de reglas sin excepción. Cada vez que se ejecute un `git pull` o inicio de sesión (`npm run session:pull`), tu tarea automática, ineludible y prioritaria es auditar el código entrante en múltiples dimensiones (SOLID, Arquitectura, DRY, Patrones). Tu objetivo es asegurar un código limpio, modular, escalable y mantenible. **No se permite la integración de código frágil.**

---

## 2. Fuentes Canónicas de Referencia

1. **SOLID Principles** (Robert C. Martin)
2. **Layered Architecture & Hexagonal Architecture (Ports & Adapters)** (Alistair Cockburn)
3. **DRY Principle & Clean Code** (The Pragmatic Programmer)
4. **Domain-Driven Design (DDD)** (Eric Evans)
5. **Gang of Four (GoF) Design Patterns**

---

## 3. Matriz de Reglas de Validación Innegociables

### Dimensión 1: Principios SOLID
* **Single Responsibility (SRP):** Rechazar clases, servicios o funciones con múltiples motivos de cambio. Ningún archivo debe exceder las 600 líneas de código útil sin modularización atómica.
* **Open/Closed (OCP):** Asegurar que las nuevas features extiendan el comportamiento sin modificar el código base funcional probado (vía plugins, composición o estrategias).
* **Liskov Substitution (LSP):** Garantizar que las implementaciones de interfaces (`IDataService`, `IB2BService`, etc.) no rompan los contratos ni las expectativas del tipo padre.
* **Interface Segregation (ISP):** Exigir interfaces pequeñas, cohesivas y específicas; prohibir interfaces monolíticas o 'todoterreno'.
* **Dependency Inversion (DIP):** Bloquear el acoplamiento fuerte. Inyectar dependencias siempre a través de abstracciones (interfaces y contratos) y evitar instanciación directa de librerías de infraestructura en módulos de alto nivel.

### Dimensión 2: Límites Arquitectónicos (Architectural Boundaries)
* **Aislamiento del Dominio:** El dominio y las reglas de negocio son sagrados. Queda estrictamente **BLOQUEADA** cualquier importación de infraestructura (`@supabase/supabase-js`, `axios`, `prisma`, `localStorage`) dentro de las entidades, tipos puros (`src/types/`) o servicios de cálculo determinista.
* **Regla de Dependencia:** Las dependencias siempre deben fluir desde el exterior (Adaptadores, Controladores, Vistas) hacia el interior (Casos de Uso, Entidades, Dominio). **Nunca al revés.**
* **Anti-Patrón de Controlador Gordo (Thick View):** Rechazar vistas React o controladores que contengan lógica de negocio pesada, liquidaciones fiscales o queries directas a la base de datos. Se exige la división estricta en 3 capas:
  $$\text{Presentación (UI/Hooks)} \longrightarrow \text{Casos de Uso / Servicios} \longrightarrow \text{Acceso a Datos / Repositorios}$$

### Dimensión 3: Clean Code y DRY (Don't Repeat Yourself)
* **Tolerancia Cero a la Duplicación:** Detectar y bloquear bloques de código idénticos o lógicas repetidas en múltiples archivos.
* **Punto Único de Cambio (Single Point of Truth):** Exigir que la lógica común (retenciones fiscales NIIF, fórmula Catch Weight, clasificación ABC Pareto, reglas de mermas) sea extraída a utilidades o servicios compartidos, garantizando que un cambio en la regla de negocio requiera edición en un solo lugar.

### Dimensión 4: Patrones de Diseño y Vocabulario Ubicuo
* **Prevención de Reinvención de Rueda:** Si se detectan lógicas condicionales masivas (`if-else` o `switch` dispersos para crear objetos o variar comportamientos), exigir la implementación del Patrón de Diseño adecuado (*Factory*, *Strategy*, *Builder*, *Repository*, *Outbox*).
* **Vocabulario Ubicuo:** Asegurar que los componentes y clases implementados utilicen la nomenclatura técnica del Ubiquitous Language (`B2BSalesStrategy`, `CatchWeightCalculator`, `OrderRepository`, `ColdStorageUnit`) para comunicar su intención al resto del equipo y a los agentes.

---

## 4. Protocolo de Ejecución Post-Pull Automático

Cada ejecución de `npm run session:pull` o hook `.husky/post-merge` invoca automáticamente el script:
```bash
node scripts/architecture/audit-solid-boundaries.cjs
```
- **Salida 0 (Aprobado):** El entorno está limpio, modular y libre de violaciones críticas.
- **Salida 1 (Bloqueado):** Se detectaron violaciones críticas de límites de capas o código frágil. **El pipeline se detiene y es obligatorio corregir las violaciones antes de continuar cualquier desarrollo.**
