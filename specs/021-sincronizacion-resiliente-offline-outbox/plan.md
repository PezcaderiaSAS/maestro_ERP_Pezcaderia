# Plan Técnico de Implementación (SPEC-021)

**Código:** SPEC-021  
**Título:** Sincronización Resiliente Offline-First, Heartbeat de Conectividad y Cola Outbox Avanzada para POS y Facturación SIIGO Nube API v2  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.plan`  

---

## 1. Arquitectura de Datos y Tipos TypeScript

### 1.1 Contrato de Tipos: `src/types/offlineSync.types.ts`
```typescript
export type EstadoOutboxItem = 
  | 'PENDIENTE' 
  | 'EN_PROCESO' 
  | 'SINCRONIZADO' 
  | 'ERROR_REINTENTO' 
  | 'ERROR_FATAL';

export type TipoTransaccionOutbox = 
  | 'FACTURA_ELECTRONICA_SIIGO'
  | 'VENTA_POS_LOCAL'
  | 'GASTO_CAJA'
  | 'ARQUEO_TURNO';

export type EstadoConectividad = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export interface OfflineOutboxItem {
  id: string;
  idempotencyKey: string; // Hash único para evitar duplicados en la nube
  tipoOperacion: TipoTransaccionOutbox;
  ventaId: string;
  consecutivoInterno: string; // Ej: "VTA-1045"
  consecutivoFiscal?: string; // Ej: "FEVP-502"
  estado: EstadoOutboxItem;
  intentos: number;
  maxIntentos: number; // Por defecto 5
  creadoEn: string;
  proximoReintentoEn: string; // Timestamp ISO
  ultimoError?: string;
  payload: any;
  respuestaFiscal?: {
    cufe?: string;
    qrUrl?: string;
    siigoInvoiceId?: string;
    numeroFiscal?: string;
  };
  sincronizadoEn?: string;
}

export interface NetworkHeartbeatStatus {
  estado: EstadoConectividad;
  latenciaMs: number;
  ultimoChequeo: string;
  fallaConsecutiva: number;
}
```

---

## 2. Capa de Servicios y Lógica Transaccional

### 2.1 Servicio de Persistencia IndexedDB: `src/services/outboxSyncService.ts`
- **Mapeo a Almacén Local:** Administra la base de datos `MaestroPescaderiaOfflineDB` con el object store `caja_outbox`.
- **Idempotencia:** Método `generarIdempotencyKey(empresaId, ventaId, consecutivoInterno)` para garantizar unicidad.
- **Backoff Exponencial con Jitter:**
  ```typescript
  export const calcularProximoBackoff = (intentos: number): number => {
    const demoras = [1000, 5000, 15000, 30000, 60000];
    const base = demoras[Math.min(intentos, demoras.length - 1)];
    const jitter = Math.floor(Math.random() * 500);
    return Date.now() + base + jitter;
  };
  ```
- **Operaciones Atómicas:**
  - `encolarTransaccion(item: Omit<OfflineOutboxItem, 'id' | 'intentos' | 'estado' | 'creadoEn'>): Promise<OfflineOutboxItem>`
  - `obtenerPendientesParaProcesar(): Promise<OfflineOutboxItem[]>`
  - `marcarSincronizado(id: string, respuestaFiscal: any): Promise<void>`
  - `marcarErrorReintento(id: string, error: string): Promise<void>`
  - `marcarErrorFatal(id: string, error: string): Promise<void>`

### 2.2 Servicio de Monitoreo de Red y Heartbeat: `src/services/networkConnectivityService.ts`
- **Detección Dual:**
  - Eventos de navegador: `window.addEventListener('online')` y `'offline'`.
  - Heartbeat activo cada 15 segundos con petición `HEAD / ping` con timeout de 3.000 ms.
- **Filtro de Ruido (Debounce):** Evita cambiar a `ONLINE` o `OFFLINE` por oscilaciones menores a 2 segundos.
- **Notificación Reactiva:** Dispara callbacks registrados cuando el estado cambia.

### 2.3 Worker de Sincronización en Segundo Plano: `src/services/backgroundSyncWorker.ts`
- **Orquestación FIFO:** Procesa los ítems en orden cronológico estricto para proteger la numeración correlativa.
- **Diferenciación de Errores:**
  - Errores de red / timeout (500, 502, 504, Failed to fetch) $\rightarrow$ `ERROR_REINTENTO` con backoff.
  - Errores tributarios / sintácticos (400 Bad Request, NIT no válido) $\rightarrow$ `ERROR_FATAL` para revisión manual sin bloquear el resto de la cola.
- **Integración con useResolucionStore:** Al completar el timbrado, actualiza el registro en `useResolucionStore.facturasElectronicas` sin duplicar movimientos contables ni de inventario.

---

## 3. Capa de Presentación e Integración de UI (Ergonomía Táctil)

### 3.1 Actualización de `NetworkSyncStatusBadge.tsx`
- **Área táctil $\ge 48\text{ px}$:** Con `min-h-[48px] h-12` o `min-h-[44px]` con padding táctil.
- **Semáforo Visual de Alto Contraste:**
  - Verde Esmeralda (`bg-emerald-50 text-emerald-800 border-emerald-300`): Red activa, 0 pendientes.
  - Ámbar Alerta (`bg-amber-50 text-amber-800 border-amber-300 animate-pulse`): Desconectado o con transacciones en cola (`# Pendientes`).
  - Azul Sincronizando (`bg-blue-50 text-blue-800 border-blue-300`): Worker activo transmitiendo.
- **Click-to-Action:** Al pulsar el badge, abre un modal con el estado de la cola y botón manual "Forzar Sincronización Ahora".

### 3.2 Integración en `PaymentPanel.tsx` (Flujo POS Fricción Cero)
- Si el switch de Factura Electrónica está activo y el estado es `OFFLINE`:
  - No bloquea el botón "COBRAR".
  - Muestra un micro-badge informativo: `"Offline: Se encolará para timbrado automático al retornar red"`.
  - Genera el cobro inmediatamente en $<500\text{ ms}$, emite tirilla interna y retorna el foco al buscador.

---

## 4. Estrategia de Pruebas Unitarias e Integración (TDD)

### 4.1 Suite Dedicada: `src/tests/offlineOutboxResilience.test.ts`
1. **Prueba de Idempotencia:** Verificar que transacciones idénticas no generen claves diferentes ni se encolen dos veces.
2. **Prueba de Encolado Offline:** Simular venta en estado offline y validar inserción en IndexedDB en estado `PENDIENTE`.
3. **Prueba de Heartbeat y Detección Dual:** Validar transiciones de estado de red ante respuestas exitosas y timeouts de ping.
4. **Prueba de Retroceso Exponencial:** Validar que los reintentos calculen timestamps crecientes y respeten el límite de 5 intentos.
5. **Prueba de Aislamiento de Errores Fatales:** Verificar que un error 400 marque `ERROR_FATAL` y permita que la siguiente factura válida se transmita con éxito.
6. **Prueba de Actualización Atómica:** Validar que tras respuesta 201 de SIIGO, se asigne el CUFE y número fiscal sin modificar stock de inventario ni saldos de arqueo.
