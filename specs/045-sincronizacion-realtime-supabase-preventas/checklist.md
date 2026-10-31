# Lista de Verificación de Calidad: SPEC-045
## Sincronización en Tiempo Real con Supabase Realtime Channels para Preventas, Comandas y Taquilla Central (Caja Única)

- **Código:** SPEC-045
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Gobernanza:** QualityEngineer + Google Harness² + Master Architect SOLID
- **Estado:** PENDIENTE DE VALIDACIÓN TDD

---

### 1. Gestión de Canales WebSockets & Conectividad Realtime
- [ ] **CHK-045-01:** La suscripción a Supabase Realtime se encapsula de forma aislada por tenant en canales con nomenclatura canónica `realtime:preventas:${tenantId}`.
- [ ] **CHK-045-02:** Los eventos de cambio de base de datos (`postgres_changes`) filtran obligatoriamente por `tenant_id=eq.${tenantId}`, garantizando cero fugas multi-tenant.
- [ ] **CHK-045-03:** El servicio de canal emite eventos optimistas `broadcast` (`PREVENTA_EMITIDA`, `PREVENTA_EN_COBRO`, `PREVENTA_COBRADA`, `PREVENTA_CANCELADA`) para latencia ultra-baja (<50ms) entre terminales concurrentes.
- [ ] **CHK-045-04:** Cuando el estado de conexión del canal reporta `SUBSCRIBED`, el temporizador de sondeo ciego de 4s en `CashierKanbanView` se desactiva por completo (0 peticiones HTTP GET periódicas).
- [ ] **CHK-045-05:** Al desmontarse los componentes que consumen el canal o conmutar de vista, se invoca `channel.unsubscribe()` limpiando escuchas y liberando recursos (cero memory leaks).

---

### 2. Resiliencia, Fallback y Conexión Degradada
- [ ] **CHK-045-06:** Si la conexión WebSocket entra en estado `CHANNEL_ERROR`, `CLOSED`, `TIMED_OUT` o `navigator.onLine === false`, el sistema activa automáticamente un sondeo degradado de respaldo (heartbeat cada 10s).
- [ ] **CHK-045-07:** Al restablecerse la conectividad o reconectarse el canal WebSocket (`SUBSCRIBED`), el sondeo de respaldo se silencia nuevamente y se ejecuta una resincronización delta para asegurar consistencia de datos.
- [ ] **CHK-045-08:** La reconexión automática maneja backoff exponencial con jitter para evitar tormentas de reconexión hacia Supabase.

---

### 3. Integración con Taquilla Central Kanban & Barra del Vendedor
- [ ] **CHK-045-09:** Cuando un vendedor emite una preventa desde el mostrador (botón F6 o `handleEmitirPreventa`), la tarjeta se renderiza en la columna `PENDIENTE_COBRO` de `CashierKanbanView` en sub-100ms sin requerir recarga manual.
- [ ] **CHK-045-10:** Cuando una cajera arrastra una tarjeta a `EN_COBRO` o abre el modal de recaudo mixto, el evento se propaga en vivo y la comanda en `VendorTicketSidebar` actualiza su badge a "EN VENTANILLA".
- [ ] **CHK-045-11:** Cuando se liquida el cobro en `QuickPaymentMixedModal`, la preventa pasa en vivo a columna `PAGADAS` y en `VendorTicketSidebar` se marca como `COBRADO` con el número de transacción/factura.
- [ ] **CHK-045-12:** Si una preventa es cancelada o recuperada para edición por el asesor, la tarjeta se retira del tablero Kanban de caja de forma reactiva instantánea.

---

### 4. Gobernanza de Tipos, Modo Test & DevTools
- [ ] **CHK-045-13:** El servicio incluye un `MockRealtimeChannel` determinista para que la suite de Vitest ejecute al 100% verde sin requerir conexión a internet ni servidor WebSocket vivo.
- [ ] **CHK-045-14:** `npx tsc --noEmit` compila con **0 errores**.
- [ ] **CHK-045-15:** Suite Vitest completa (unitarias, integración y E2E de sincronización multi-estación) al 100% pasando (0 fallos).
- [ ] **CHK-045-16:** Bucle Chromium DevTools: 0 errores/warnings en consola JS durante la suscripción, emisión y recepción de eventos en vista Desktop y Mobile (375px).
