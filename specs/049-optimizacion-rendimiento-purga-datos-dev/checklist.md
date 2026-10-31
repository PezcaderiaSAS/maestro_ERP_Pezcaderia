# Lista de Verificación de Calidad: SPEC-049
## Optimización Extrema de Rendimiento en Localhost, Purga Automática Local/Remota y Catálogo Ligero de Desarrollo

- **Código:** SPEC-049
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). Criterios de Aceptación y Estándares de la Industria.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

### 1. Rendimiento y Cold Start (Estándares Web Vitals)
- [ ] **CH-PERF-01:** El arranque inicial (*Cold Start*) de `localhost:3000` carga en menos de 200ms sin trabas en el hilo principal.
- [ ] **CH-PERF-02:** El heap de memoria de V8 en el navegador se mantiene por debajo de 5MB en lugar de los >40MB generados por los 8.5MB de JSON.
- [ ] **CH-PERF-03:** La búsqueda y filtrado de productos y clientes en `POSView` responde a 60-120 FPS estables sin microstutter (*frame drops* = 0).
- [ ] **CH-PERF-04:** `FerreteriaJosaseService.applyToStores()` no se invoca automáticamente en el login ni bloquea la apertura de turno en caja.

---

### 2. Integridad de Purga y Reseteo (Local + Supabase)
- [ ] **CH-PURGE-01:** La función `purgeAllData()` elimina atómicamente las bases de datos de `IndexedDB` (`PezcaderiaERP_tenant-03`, `pezcaderia_outbox_db`).
- [ ] **CH-PURGE-02:** Se limpian las claves pesadas de `localStorage` (`pezcaderia_clientes`, `pezcaderia_products_catalog`, `pezcaderia_product_pricings`, `pezcaderia_stock`).
- [ ] **CH-PURGE-03:** Se ejecuta el script/RPC en Supabase PostgreSQL para purgar los datos de prueba del tenant activo (`DELETE FROM prefacturas`, `DELETE FROM clientes`, etc.) preservando integridad referencial.
- [ ] **CH-PURGE-04:** Se siembran automáticamente los 25 productos y 10 clientes ligeros en Zustand, IndexedDB y LocalStorage tras la purga.
- [ ] **CH-PURGE-05:** Se previene el bloqueo de `indexedDB.deleteDatabase` si existen otras pestañas abiertas emitiendo alerta SweetAlert2 adecuada.

---

### 3. Usabilidad y Experiencia de Usuario (UI/UX Dark Glassmorphism)
- [ ] **CH-UX-01:** Botón de "Reset & Purga Rápida" accesible en `EnterpriseTopbar` con icono de escoba/refresh en tono ámbar/cian (`hover:scale-105 active:scale-95`).
- [ ] **CH-UX-02:** Modal de confirmación con SweetAlert2 detallando el impacto: "Se limpiará el almacenamiento local y la base de datos de pruebas en Supabase para el tenant activo".
- [ ] **CH-UX-03:** Botón opcional en Configuración / POS para "Cargar Catálogo Masivo Josase (14.900 registros)" bajo demanda solo si el usuario desea hacer pruebas de estrés.

---

### 4. Cobertura de Pruebas y Seguridad (TDD & Typescript)
- [ ] **CH-QA-01:** Suite de pruebas unitarias en `src/tests/databasePurgeService.test.ts` con 100% de aserciones pasando en Vitest.
- [ ] **CH-QA-02:** Validación de compilación estricta con `tsc --noEmit` con 0 errores de tipos.
- [ ] **CH-QA-03:** Aislamiento multi-tenant estricto: la purga en Supabase solo afecta al `tenant_id` seleccionado y nunca a otros inquilinos.
