# Plan Técnico de Implementación: SPEC-045
## Sincronización en Tiempo Real con Supabase Realtime Channels para Preventas, Comandas y Taquilla Central (Caja Única)

- **Código:** SPEC-045
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Master Architect + DataEngineer + UIReviewer + Google Harness²
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Arquitectura Técnica & Patrones de Diseño

El sistema se estructura en cuatro (4) capas desacopladas conforme a la directiva Master Architect SOLID:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CAPA DE PRESENTACIÓN (UI / Dark Glassmorphism V8)                   │
│   • CashierKanbanView.tsx: Elimina setInterval(4000) -> Hook reactivo  │
│   • VendorTicketSidebar.tsx: Reflejo en vivo de estados de comandas    │
│   • POSView.tsx: Emisión instantánea broadcast tras presionar F6       │
│   • NetworkSyncStatusBadge.tsx: Indicador visual de canal WebSocket    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. CAPA DE ESTADO & REACTIVIDAD (Zustand Stores)                       │
│   • useCashierKanbanStore.ts: Suscripción a canal, reducers en vivo    │
│   • useRealtimePreventasStore.ts: Gestión de conexión, status, eventos │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. CAPA DE CONTRATOS & VALIDACIÓN DE EVENTOS                           │
│   • realtimePreventa.schema.ts: Esquema Zod de eventos y payloads      │
│   • Supabase Realtime Payload: Tipado estricto postgres_changes & BC   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. CAPA DE SERVICIO REALTIME & RESILIENCIA HÍBRIDA                     │
│   • supabaseRealtimePreventasService.ts: Singleton gestor de canales   │
│   • Fallback Heartbeat (10s): Activo solo en desconexión / offline     │
│   • MockRealtimeChannel: Emisor para pruebas unitarias sin internet    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes y Módulos a Modificar y Crear

### Módulo 1: Esquema Zod y Tipado de Eventos Realtime
1. **Archivo nuevo [`src/schemas/realtimePreventa.schema.ts`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/schemas/realtimePreventa.schema.ts):**
   - Validación Zod para eventos de preventa:
     - `INSERT_PREVENTA`: comanda nueva emitida por el vendedor.
     - `UPDATE_ESTADO_PREVENTA`: cambio a `EN_COBRO`, `PAGADA`, `ANULADA`.
     - `DELETE_PREVENTA`: preventa descartada o devuelta.
     - `BROADCAST_TICKET_PULSE`: pulso efímero optimista para sincronización en <50ms entre terminales de la misma red local/tenant.

### Módulo 2: Servicio de Suscripción Resiliente de Canales Supabase
2. **Archivo nuevo [`src/services/supabaseRealtimePreventasService.ts`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/services/supabaseRealtimePreventasService.ts):**
   - Gestiona el canal WebSocket `realtime:preventas:${tenantId}`.
   - Escucha dual:
     - `postgres_changes` con filtro `tenant_id=eq.${tenantId}` en la tabla de preventas / pedidos.
     - `broadcast` para propagación optimista instantánea de eventos del mostrador.
   - Estado de salud del canal: `'CONNECTING' | 'SUBSCRIBED' | 'DISCONNECTED' | 'ERROR'`.
   - Control de Fallback: Desactiva el sondeo cuando el estado es `SUBSCRIBED`; activa temporizador de emergencia (heartbeat de 10s) si el socket se cierra o entra en error.
   - Soporte para `isMockMode` / Vitest mediante emisor desacoplado determinista.

### Módulo 3: Adaptación del Store de Caja Única (`useCashierKanbanStore`)
3. **Archivo a modificar [`src/stores/useCashierKanbanStore.ts`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/stores/useCashierKanbanStore.ts):**
   - Incorporar acciones reactivas:
     - `iniciarSuscripcionRealtime(tenantId: string)`
     - `detenerSuscripcionRealtime()`
     - `onRealtimeInsert(preventa: Prefactura)`
     - `onRealtimeUpdate(preventa: Prefactura)`
     - `onRealtimeDelete(preventaId: string)`
   - La carga inicial trae el snapshot de preventas y activa inmediatamente la suscripción en tiempo real.

### Módulo 4: Refactorización de Vistas (Cero Polling Inútil)
4. **Archivo a modificar [`src/views/pos/components/CashierKanbanView.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/CashierKanbanView.tsx):**
   - Reemplazar el `setInterval` de 4000ms por la suscripción al canal en tiempo real.
   - Mantener sondeo de contingencia condicional únicamente si la salud del WebSocket indica caída o modo offline.
5. **Archivo a modificar [`src/views/POSView.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/POSView.tsx):**
   - Al emitir una preventa con F6 o desde el mostrador, emitir el evento realtime broadcast al canal del tenant para alertar inmediatamente a la taquilla central de caja.

---

## 3. Plan de Pruebas Automatizadas (TDD)
1. **Archivo nuevo [`src/tests/supabaseRealtimePreventas.test.ts`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/tests/supabaseRealtimePreventas.test.ts):**
   - Prueba 1: Inicialización de canal por tenant (`realtime:preventas:tenant-03`).
   - Prueba 2: Recepción de evento `INSERT` agrega tarjeta a `PENDIENTE_COBRO` en tiempo real.
   - Prueba 3: Recepción de evento `UPDATE` transiciona comanda a `EN_COBRO` y `PAGADA`.
   - Prueba 4: Silenciamiento del sondeo periódico cuando el canal está `SUBSCRIBED`.
   - Prueba 5: Activación de sondeo heartbeat cuando el canal pasa a `CHANNEL_ERROR` o `CLOSED`.
   - Prueba 6: Aislamiento estricto multi-tenant (eventos de otro tenant son descartados).
2. **Prueba E2E existente:**
   - Ejecución y verificación de `src/tests/multiVendorCashierIntegrationE2E.test.tsx` para asegurar 100% de compatibilidad regresiva.
