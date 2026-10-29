# Lista de Verificación de Calidad (Quality Checklist): SPEC-041
## Sincronización Bidireccional Supabase <-> IndexedDB (Outbox Worker Resiliente & OCC)

- **Código:** SPEC-041
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Estado:** Lista de Verificación de Estándares de la Industria (Aprobación Pendiente)
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico.

---

### 1. Integridad de Datos e Idempotencia (Data Integrity & Idempotency)
- [ ] **CH-DAT-01 (Doble Barrera de Idempotencia):** Cada transacción Outbox genera un UUID v4 local como PK de entidad y un hash SHA-256 determinista (`idempotencyKey`), evitando duplicación de ventas o cobros ante reintentos de red.
- [ ] **CH-DAT-02 (Aislamiento Multi-Tenant Físico):** Las operaciones de IndexedDB residen en la base de datos independiente `PezcaderiaERP_{tenantId}`, impidiendo contaminación cruzada de datos entre empresas.
- [ ] **CH-DAT-03 (Esquemas Zod Estrictos):** Toda mutación Outbox, delta de sincronización y conflicto OCC se valida en tiempo de ejecución mediante esquemas Zod en `deltaSync.schema.ts`.

---

### 2. Control de Concurrencia Optimista (OCC Engine)
- [ ] **CH-OCC-01 (Client-Wins en Mostrador Físico):** Las ventas POS y prefacturas emitidas en mostrador prevalecen siempre sobre el servidor; el stock se descuenta en modo delta permitiendo saldo negativo transitorio y disparando alerta de auditoría.
- [ ] **CH-OCC-02 (Server-Wins en Maestros de Catálogo):** Si `server.version > client.version` en productos o precios, los datos del servidor prevalecen y se actualiza el almacenamiento local de IndexedDB.
- [ ] **CH-OCC-03 (Trazabilidad en `sync_conflicts`):** El 100% de las colisiones de concurrencia se persisten en el ObjectStore `sync_conflicts` con `versionCliente`, `versionServidor`, payload comparativo y estado de resolución.

---

### 3. Rendimiento, Off-Thread Worker y Ergonomía de UI (Performance & UX)
- [ ] **CH-PERF-01 (Cero Bloqueo del Hilo Principal - 120 FPS):** La deserialización y transmisión de lotes corre en `syncWorker.worker.ts` sin degradar el framerate de la interfaz de React.
- [ ] **CH-PERF-02 (Escala 3X y Chunking a 500 Registros):** La sincronización upstream y downstream procesa paquetes homogéneos de máximo 500 registros, evitando sobrecargar la memoria del navegador y los límites de payload de Supabase.
- [ ] **CH-PERF-03 (Latencia de Escritura Local $\le 5\text{ ms}$):** El operador en mostrador recibe confirmación optimista instantánea en el POS antes de que se inicie la transmisión de red.

---

### 4. Tolerancia a Fallos, Backoff y Dead-Letter Queue (DLQ)
- [ ] **CH-RES-01 (Backoff Exponencial Resiliente):** Ante fallos transitorios de red (timeouts, HTTP 500/503), el worker aplica backoff escalonado (1s, 2s, 4s, 8s, 16s, máx 60s) hasta 5 reintentos.
- [ ] **CH-RES-02 (Aislamiento Dead-Letter Queue):** Transacciones con error irrecuperable (HTTP 422, datos corruptos) se marcan `ERROR_FATAL_DATOS` y se extraen de la cola activa para evitar el bloqueo Head-of-Line.
- [ ] **CH-RES-03 (Drawer de Resolución Asistida):** `NetworkSyncStatusBadge` notifica la existencia de ítems en DLQ y permite al supervisor inspeccionar el payload para reintentar o descartar con nota auditada.

---

### 5. Cumplimiento de Capa Gratuita (Free Tier SLA & Zero Cost)
- [ ] **CH-COST-01 (Delta Queries Estrictas):** El cliente solo solicita registros modificados desde `sync_metadata.lastSyncTimestamp` (`updated_at > lastSync`), ahorrando más del 95% del ancho de banda y lecturas de Supabase.
- [ ] **CH-COST-02 (Heartbeat Adaptativo de 60s):** Se elimina el sondeo agresivo innecesario, empleando reactividad por eventos locales y verificación de fondo cada 60s.
- [ ] **CH-COST-03 (Costo $0 Absoluto):** Sin servicios SaaS de sincronización de pago; uso exclusivo de Web Workers nativos e IndexedDB.

---

### 6. Calidad de Software, TDD y Compatibilidad Híbrida
- [ ] **CH-QA-01 (Arquitectura Híbrida de Pruebas):** El worker conmuta transparentemente a bucle de microtareas asíncrono en suites Vitest en Node.js, garantizando 100% de tests verdes sin mockeos frágiles.
- [ ] **CH-QA-02 (Cobertura de Pruebas $\ge 80\%$):** Suites de prueba unitarias e integración para validadores Zod, motor OCC, persistencia IndexedDB y worker de transmisión.
- [ ] **CH-QA-03 (Cero Errores TypeScript & DevTools):** `tsc --noEmit` con 0 errores y 0 advertencias/errores en consola de Chrome DevTools (375px y 1280px).

