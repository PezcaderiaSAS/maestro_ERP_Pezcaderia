# Reporte de Clarificación y Mitigación de Riesgos: SPEC-040
## Control de Calidad 1 — `/speckit.clarify` & `/grill-me`

- **Código:** SPEC-040
- **Fase:** Spec Kit SDD v3.0 — `/speckit.clarify`
- **Fecha:** 2026-10-28
- **Estado:** Clarificación Completada y Aprobada por el Usuario

---

### 1. Resumen de Decisiones del Árbol de Diseño (/grill-me)

| Rama de Decisión | Pregunta Clave | Decisión Aprobada | Justificación Técnica & Arquitectónica |
| :--- | :--- | :--- | :--- |
| **Rama 1: Persistencia & Aislamiento** | ¿Cómo almacenar y aislar 16.000 ítems y 30.000 clientes superando el límite de 5MB de `localStorage`? | **IndexedDB independiente por Tenant (`PezcaderiaERP_{tenantId}`)** | Aislamiento físico estricto en el navegador. Supera la cuota de 5MB (permite gigabytes), transacciones asíncronas no bloqueantes y cero riesgo de fuga cruzada entre empresas. |
| **Rama 2: Motor de Búsqueda** | ¿Cómo lograr búsqueda instantánea (search-as-you-type) sin congelar la UI? | **Web Worker dedicado Off-Thread con Búsqueda Difusa (Fuzzy Search)** | Desacopla la indexación de 16k ítems del hilo de React. Consultas en $\le 2\text{ ms}$, tolerancia a erratas tipográficas y 120 FPS estables. |
| **Rama 3: Renderizado Frontend** | ¿Cómo renderizar cientos de resultados sin sobrecargar el DOM? | **Virtualización Headless de Grilla (`useVirtualGrid`)** | El DOM solo mantiene en memoria las 12-16 tarjetas visibles en el viewport actual. Recicla nodos DOM y garantiza consumo de memoria $\mathcal{O}(1)$. |
| **Rama 4: Ingesta de Datos** | ¿Cómo eliminar el tiempo de carga en el primer acceso o cambio de empresa? | **Ingesta Progresiva Pareto ABC (80/20) en Chunks** | La UI se vuelve interactiva en $< 150\text{ ms}$ con el Top 100 de productos y clientes más frecuentes. El Worker hidrata IndexedDB en segundo plano en lotes de 1.000 registros. |
| **Rama 5: Sincronización Supabase** | ¿Cómo mantener la consistencia nube-local sin saturar ancho de banda? | **Sincronización Delta (`updated_at > lastSync`) + Outbox Pattern** | Solo viajan los cambios netos por la red. Ventas descuentan stock al instante en local y encolan la transmisión a Supabase. Soporte offline-first garantizado. |

---

### 2. Matriz de Mitigación de Riesgos

1. **Riesgo 1: Caída de Rendimiento por Indexación de 16.000 Ítems**
   - *Mitigación:* La indexación se ejecuta 100% dentro del Web Worker. Si el hilo secundario tarda 200ms en indexar, el hilo de la UI nunca se bloquea y el usuario puede interactuar de inmediato con el catálogo Pareto inicial.
2. **Riesgo 2: Inconsistencia de Stock en Modo Desconectado (Offline)**
   - *Mitigación:* Se implementa reserva local inmediata en IndexedDB (`Hard-Hold`). Al reconectarse, la cola Outbox aplica las transacciones en Supabase mediante RPC atómica con verificación de saldo pesimista.
3. **Riesgo 3: Complejidad de Dependencias NPM Externas**
   - *Mitigación:* Se implementa un motor de búsqueda por trigramas/tokens y un hook de virtualización de ventana con código nativo TypeScript en el proyecto (`RULE-SDD-001`), evitando inflar el bundle de producción y manteniendo control absoluto del ciclo de vida.

