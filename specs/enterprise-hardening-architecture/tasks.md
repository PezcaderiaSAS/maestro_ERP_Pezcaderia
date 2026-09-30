# Tareas de Implementación: Enterprise Hardening & Performance Architecture

**ID:** `TASKS-004-ENTERPRISE-HARDENING`  
**Referencia:** [`spec.md`](./spec.md) | [`plan.md`](./plan.md)  

---

### Fase 1: Base de Datos & Seguridad (Especialista: DataEngineer)
- [x] **TASK-1.1**: Implementar función `uuid_generate_v7()` en `database/32_uuid_v7_rfc9562.sql` siguiendo el estándar IETF RFC 9562 con timestamp de 48 bits y entropía aleatoria.
- [x] **TASK-1.2**: Crear esquema y políticas RLS para la tabla `legal_consents_audit` en `database/33_legal_consents_audit.sql`.
- [x] **TASK-1.3**: Eliminar la puerta trasera `'1234'` en `database/26_operational_flows_guards.sql` y reescribir la RPC de despacho para ordenar los SKUs antes del bloqueo (`ORDER BY producto_id FOR UPDATE`), previniendo deadlocks.

---

### Fase 2: Servicios de API & Manejo de Errores (Especialista: SoftwareArchitect)
- [x] **TASK-2.1**: Refactorizar `src/lib/safeApi.ts` para evaluar códigos estándar SQLSTATE (`23503`, `23505`, `23514`, `42501`) y códigos de dominio `ERR_*` eliminando el parseo frágil por cadenas de texto (`raw.includes(...)`).
- [x] **TASK-2.2**: Crear archivo de tipos `src/types/legal.types.ts` para tipar los registros de consentimiento legal y auditoría.

---

### Fase 3: Frontend & UX (Especialista: UIReviewer)
- [x] **TASK-3.1**: Actualizar `src/components/legal/ConsentGateModal.tsx` para persistir el consentimiento en la tabla `legal_consents_audit` de Supabase con fallback a caché local.
- [x] **TASK-3.2**: Eliminar las validaciones de PIN `'1234'` y `'4321'` en `src/views/InventoryView.tsx`, reemplazándolas por verificación de rol `SUPERVISOR`/`ADMIN` desde `useAppStore`.
- [x] **TASK-3.3**: Eliminar validaciones de cadenas `'1234'`, `'admin'` y `'super'` en `src/views/cash/components/ArqueoCajaModal.tsx`.

---

### Fase 4: Calidad, Testing & Regresión (Especialista: QualityEngineer)
- [x] **TASK-4.1**: Actualizar `src/tests/operationalFlows.test.ts` para reflejar el modelo de autorización por rol y eliminar dependencias de PIN estático.
- [x] **TASK-4.2**: Crear prueba unitaria `src/tests/safeApi.test.ts` para verificar la sanitización por códigos SQLSTATE sin depender de cadenas raw.
- [x] **TASK-4.3**: Ejecutar `npm run test:run` y `npm run build` para certificar la no-regresión y tipado estricto.
