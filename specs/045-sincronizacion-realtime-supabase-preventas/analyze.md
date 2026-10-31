# Reporte de Análisis y Consistencia Cruzada: SPEC-045
## Sincronización en Tiempo Real con Supabase Realtime Channels (Spec -> Plan -> Tasks)

- **Código:** SPEC-045
- **Fase:** Spec Kit SDD v3.0 — `/speckit.analyze`
- **Gobernanza:** QualityEngineer + Google Harness² + Master Architect SOLID
- **Estado:** APROBADO PARA EJECUCIÓN TDD

---

## 1. Matriz de Trazabilidad y Alineación Cruzada

| Requisito EARS (`spec.md`) | Componente en Plan (`plan.md`) | Tarea Asignada (`tasks.md`) | Criterio de Verificación TDD |
| :--- | :--- | :--- | :--- |
| **REQ-01:** Suscripción al canal `realtime:preventas:${tenantId}` | `supabaseRealtimePreventasService.ts` | `TASK-045-02` | Test de conexión aislada por tenant |
| **REQ-02:** Propagación `INSERT` sub-100ms a Taquilla | `useCashierKanbanStore.ts` | `TASK-045-03` | Inserción en memoria y renderizado en `colEspera` |
| **REQ-03:** Transición `UPDATE` (`EN_COBRO`, `PAGADA`) | `useCashierKanbanStore` & `VendorSidebar` | `TASK-045-03` & `TASK-045-04` | Cambio de estado y actualización de badge |
| **REQ-04:** Silenciamiento del sondeo ciego de 4s | `CashierKanbanView.tsx` | `TASK-045-03` | 0 llamadas `cargarPreventas` periódicas en WS vivo |
| **REQ-05:** Degradación a Heartbeat (10s) en desconexión | `supabaseRealtimePreventasService.ts` | `TASK-045-02` | Activación de fallback en `CLOSED` / `ERROR` |
| **REQ-06:** Limpieza de suscripciones al desmontar | Cleanup en hooks y servicios | `TASK-045-02` | Invocación de `channel.unsubscribe()` |
| **REQ-07:** Determinismo en modo test/mock | `MockRealtimeChannel` emisor | `TASK-045-02` | 100% de la suite Vitest verde sin internet |

---

## 2. Auditoría de Riesgos y Mitigaciones
1. **Riesgo 1 (Condición de Carrera en Taquilla):** Dos cajeras intentan abrir la misma preventa al mismo tiempo.
   - *Mitigación:* Evento optimista `EN_COBRO` con `cajeroId`. Si ya tiene cajero asignado, la segunda estación recibe alerta inmediata "Preventa tomada por otra cajera".
2. **Riesgo 2 (Fuga de Memoria por Canales Abiertos):** Suscripciones acumuladas tras alternar entre POS y Taquilla.
   - *Mitigación:* Singleton de canal por tenant con contador de referencias (ref-count) y desuscripción automática al llegar a 0 escuchas.
3. **Riesgo 3 (Saturación de Conexiones en Capa Gratuita):** Demasiados WebSockets abiertos simultáneamente.
   - *Mitigación:* Un solo canal multiplexado por tenant/terminal para todos los componentes de la vista, reutilizado mediante el hook central.

---

## 3. Veredicto del Control de Calidad
- Consistencia del 100% entre Requisitos, Arquitectura y Tareas.
- Sin fisuras de seguridad multi-tenant ni dependencias circulares.
- Listo para comenzar la ejecución quirúrgica TDD: **TASK-045-01**.
