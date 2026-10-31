# Reporte de Consistencia y Alineación Cruzada: SPEC-049
## Auditoría Pre-Implementación (Spec -> Plan -> Tasks)

- **Código:** SPEC-049
- **Fase:** Spec Kit SDD v3.0 — `/speckit.analyze`
- **Auditor:** QualityEngineer (Agency Swarm & Google Harness²)
- **Fecha:** 2026-10-31
- **Veredicto:** APROBADO SIN FISURAS (100% Coherencia y Trazabilidad)

---

### 1. Matriz de Alineación Cruzada y Trazabilidad

| Requisito EARS | Componente Plan | Tarea Atómica | Validación TDD |
| :--- | :--- | :--- | :--- |
| **EARS-01** (Cold Start < 200ms) | Desacoplamiento de `applyToStores` en Login | `TASK-049-03` | Benchmark de arranque en Vitest |
| **EARS-02** (Catálogo Semilla Ligero) | `seedLightData.ts` (25 prod, 10 cli) | `TASK-049-01` | `seedLightData.test.ts` |
| **EARS-03** (Purga Local de 1-Clic) | `databasePurgeService.ts` | `TASK-049-02` | `databasePurgeService.test.ts` |
| **EARS-04** (Cero Frame Drops en POS) | Zustand con catálogo ligero en memoria | `TASK-049-01`, `TASK-049-03` | Bucle DevTools (60-120 FPS) |
| **EARS-05** (Integridad Backend Supabase) | RPC `rpc_purge_tenant_data` | `TASK-049-04` | Transaccionalidad PL/pgSQL |

---

### 2. Auditoría de Riesgos y Mitigaciones
1. **Riesgo 1: Bloqueo de IndexedDB al purgar por múltiples pestañas abiertas:**
   - *Mitigación:* Se añade evento `onblocked` en `databasePurgeService` que emite alerta SweetAlert2 indicando al usuario que cierre pestañas duplicadas si el navegador bloquea la eliminación.
2. **Riesgo 2: Borrado accidental de datos de otro tenant:**
   - *Mitigación:* Aislamiento forzoso con validación Zod de `tenantId`. La RPC de Supabase y el nombre de la BD local (`PezcaderiaERP_${tenantId}`) están vinculados al tenant activo.
3. **Riesgo 3: Rotura de interfaces existentes del POS:**
   - *Mitigación:* `seedLightData` implementa exactamente las interfaces `Producto` y `Cliente`, garantizando compatibilidad del 100% con los selectores de búsqueda, carrito y taquilla central.

---

### 3. Veredicto Final Pre-Código
El diseño técnico, los contratos Zod y las tareas atómicas están completamente alineados y listos para ejecución quirúrgica bajo el protocolo TDD (`WIP = 1`).
