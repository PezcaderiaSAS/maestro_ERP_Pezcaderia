# Console Logger — Sistema de Trazabilidad en Consola de Desarrollador

**ID:** SPEC-CONSOLE-LOGGER-001  
**Versión:** 1.0  
**Fecha:** 2026-07-02  

---

## Resumen Ejecutivo

Implementar un sistema de logging estructurado que registre en la consola del desarrollador (`console.log`, `console.group`, `console.table`) todas las interacciones del usuario, mutaciones de estado en Zustand, llamadas a servicios, y errores del sistema. El objetivo es permitir la trazabilidad completa de cualquier operación para depuración profesional.

---

## Qué se va a construir

Un módulo centralizado de logging (`src/lib/consoleLogger.ts`) + middleware de Zustand + wrapper de servicios, que produzca en la Developer Console un registro **formateado, coloreado, agrupado y filtrable** de:

1. **Interacciones de usuario** — clics en botones, cambios de vista, apertura de modales
2. **Mutaciones de estado** — cada `setState` en stores Zustand (antes/después)
3. **Llamadas a servicios** — entrada/salida/duración de cada operación en servicios
4. **Errores** — toda excepción capturada con stack trace completo y contexto
5. **Eventos del dominio** — eventos `publishEvent` con metadata

---

## Por qué

- **Depuración profesional**: un desarrollador puede abrir la consola, ver exactamente qué pasó paso a paso, y compartir el log completo
- **Trazabilidad de bugs**: cuando un usuario reporta un error, el desarrollador pide un screenshot de la consola y ve toda la secuencia de acciones previas
- **Sin dependencias externas**: no requiere servidores de logging, bases de datos, ni servicios cloud
- **Correlación de errores**: todo error incluye el contexto de la acción de usuario que lo desencadenó

---

## Arquitectura

```
┌────────────────────────────────────────────────────┐
│  src/lib/consoleLogger.ts                           │
│  ┌─ LogLevel (DEBUG | INFO | WARN | ERROR)         │
│  └─ createLogger(modulo) → { info, warn, error,    │
│        group, table, trace }                        │
├────────────────────────────────────────────────────┤
│  src/lib/consoleMiddleware.ts                       │
│  └─ zustandConsoleMiddleware → middleware Zustand   │
│     que loguea cada setState con diff               │
├────────────────────────────────────────────────────┤
│  stores/* → inyectar middleware                     │
│  services/* → wrapper try/catch con log             │
│  views/* → hooks useLogger(actionName)              │
└────────────────────────────────────────────────────┘
```

---

## Formato de logs

| Propiedad   | Descripción |
|-------------|-------------|
| `modulo`    | Nombre del módulo (ej: `POS`, `INVENTORY`, `CASH`) |
| `accion`    | Nombre de la acción (ej: `registrarVenta`, `abrirTurno`) |
| `nivel`     | `DEBUG` / `INFO` / `WARN` / `ERROR` |
| `timestamp` | ISO 8601 con timezone |
| `duracion`  | Milisegundos desde inicio (solo operaciones síncronas) |
| `sessionId` | UUID generado al cargar la app (misma sesión = mismo ID) |
| `contexto`  | Objeto con datos relevantes de la operación |

**Ejemplo de salida visual en consola:**

```
📋 [POS] registrarVenta ───────────────────────────────
  ├ sessionId: a1b2c3d4-...
  ├ timestamp: 2026-07-02T15:30:00.000-05:00
  ├ lineas: 3 ítems (total $52,000)
  ├ resultado: SUCCESS (id: vta-abc123)
  └ duración: 23ms
```

---

## Puntos de inyección

### 1. Stores Zustand (15 stores)

Cada store recibe el middleware `zustandConsoleMiddleware` que intercepta `setState`:

```
setState (prev) → LOG: diff de propiedades cambiadas + valores → aplica setState
```

Stores objetivo: `useAppStore`, `usePOSCart`, `useInventoryStore`, `useWarehouseStore`, `useOrderStore`, `useClientStore`, `useSupplierStore`, `useCategoryStore`, `useDriverStore`, `useEmployeeStore`, `useExpenseStore`, `useDynamicFieldStore`, `useARStore`, `useReturnStore`, `useIntegrationStore`, `usePurchaseStore`, `useMovementStore`, `useEventStore`, `useCashStore`

### 2. Servicios (7 servicios)

Wrapper que envuelve cada método público:

```
método(args) → LOG: entrada(args) → ejecución → LOG: salida(resultado|error, duración)
```

Servicios objetivo: `posService`, `cashService`, `inventoryService`, `b2bService`, `payrollService`, `warehouseService`, `localDb`

### 3. Interacciones de UI

Hook `useActionLogger(actionName)` que se usa en las vistas/envío de formularios. Loguea automáticamente:

- Cambios de `currentView` (navegación)
- Apertura/cierre de modales
- Submit de formularios
- Clics en botones críticos (facturar, abrir turno, cerrar caja)

### 4. Errores globales

Handler `window.onerror` + `window.onunhandledrejection` que captura y loguea errores no atrapados con el contexto actual.

---

## Estructura de archivos

| Archivo | Propósito |
|---------|-----------|
| `src/lib/consoleLogger.ts` | Logger base con niveles, colores, grupos, timers |
| `src/lib/consoleMiddleware.ts` | Middleware genérico para Zustand |
| `src/hooks/useActionLogger.ts` | Hook React para interacciones de UI |

Sin archivos nuevos en servicios/stores — solo se modifican los existentes para inyectar el logger.

---

## Niveles y estilos visuales

| Nivel   | Prefijo | Color   | Uso |
|---------|---------|---------|-----|
| DEBUG   | `🔍`    | gris    | Mutaciones de estado detalladas |
| INFO    | `📋`    | azul    | Acciones de usuario completadas |
| WARN    | `⚠️`    | amarillo| Deprecaciones, condiciones inesperadas |
| ERROR   | `❌`    | rojo    | Excepciones, fallos de operación |

---

## Criterios de aceptación

- [ ] CA-01: Cada store Zustand loguea sus `setState` con diff del estado anterior y nuevo
- [ ] CA-02: Cada servicio envuelve sus métodos con log de entrada/salida/duración
- [ ] CA-03: Las acciones de usuario (navegación, clics críticos) se registran automáticamente
- [ ] CA-04: Errores no capturados (`window.onerror`) se loguean con stack trace
- [ ] CA-05: Los logs son coloreados, agrupados (`console.group`) y filtrables por módulo
- [ ] CA-06: `sessionId` persistente durante toda la sesión para correlacionar logs
- [ ] CA-07: Sin impacto en rendimiento (<1ms overhead por log, desactivado en producción vía `import.meta.env.DEV`)
- [ ] CA-08: Los logs de error incluyen el contexto completo de la acción que falló

---

## H1-H5: Resolución de Open Items

### H1 — Zustand v5 middleware API

**Conclusión:** El middleware wrapper es compatible con Zustand v5. Los stores actuales usan `create<State>()((set, get) => ({...}))`. El middleware se aplica así:

```ts
// src/lib/consoleMiddleware.ts
const zustandConsoleMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (args: any) => {
      const prev = get()
      set(args)
      logStoreMutation(get().constructor?.name ?? 'Store', prev, get(), Object.keys(args))
    },
    get,
    api
  )

// Uso en cada store:
export const useXStore = create<State>()(
  zustandConsoleMiddleware((set, get) => ({ ... }))
)
```

Sin cambios de breaking. No se requiere `subscribeWithSelector` ni `devtools`.

---

### H2 — usePOSCart logging: renders vs acciones

**Conclusión:** Loggear **solo en acciones explícitas**, no en re-renders. El `useMemo` es una derivación pura (no muta estado). Los setters (`setLineas`, `setCliente`, etc.) se envuelven dentro de cada acción:

| Acción | Log |
|--------|-----|
| `agregarProducto` | `[POSCart] agregarProducto: { sku, nombre, cantidad, precio }` |
| `actualizarCantidad` | `[POSCart] actualizarCantidad: { productoId, cantidad }` |
| `removerProducto` | `[POSCart] removerProducto: { productoId }` |
| `limpiarCarrito` | `[POSCart] limpiarCarrito: { lineasPrevias: N }` |
| `setCliente` | `[POSCart] setCliente: { clienteId, nombre, tipoPrecio }` |

Los cambios de `useMemo` (totales) NO se loguean — son derivados.

---

### H3 — Flag global para tests (Vitest)

**Conclusión:** Se añade flag `globalThis.__LOGGER_ENABLED__` controlado por entorno:

```ts
// src/lib/consoleLogger.ts
const isEnabled = (): boolean => {
  if (typeof globalThis.__LOGGER_ENABLED__ === 'boolean') return globalThis.__LOGGER_ENABLED__
  return import.meta.env.DEV
}
```

En `src/tests/setup.ts` se desactiva:
```ts
globalThis.__LOGGER_ENABLED__ = false
```

En QA/producción se activa vía `localStorage.debug` (runtime toggle).

---

### H4 — Objetos circulares en contexto

**Conclusión:** Usar `JSON.stringify` con `getCircularReplacer` en `src/lib/consoleLogger.ts`:

```ts
function safeStringify(obj: unknown): string {
  const seen = new WeakSet()
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  }, 2)
}
```

---

### H5 — PII en payload_json de integraciones

**Conclusión:** `LogIntegracion.payload_json` contiene datos sensibles del cliente (nombre, identificación, dirección). No se loguea completo. Se loguea solo metadata de resumen:

```ts
// En lugar de loggear payload_json completo:
logger.info(log, {
  id_pedido_externo: log.id_pedido_externo,
  canal: log.canal,
  estado: log.estado,
  total_items: JSON.parse(log.payload_json)?.items?.length ?? 'N/A',
  monto_total: JSON.parse(log.payload_json)?.total ?? 'N/A',
})
```

El `payload_json` crudo NUNCA se pasa al logger.

---

## Decisiones aprobadas (QC v1.0)

| Decisión | Opción elegida |
|----------|----------------|
| Alcance | **Stores + Servicios + Hooks** (15 stores, 7 servicios, 3 hooks) |
| Detalle de diffs | **Completo** — muestra todo el estado nuevo en cada `setState` |
| Capa de datos | **Decorator de interfaz** — `LoggableDataService implements IDataService` |
| Eventos de dominio | **Incluir DomainEvent** en metadata del log de consola |
| Niveles por módulo | **Sí** — `localDb`=DEBUG, stores UI=INFO, servicios=INFO |
| Runtime toggle | **Sí** — `localStorage.setItem('debug', 'POS,CASH')` activa logs en QA/producción |
| Formato de diff | **console.log + changedKeys** — prev, next, y lista de claves cambiadas |
| Hooks internos | **Incluidos** — `usePOSCart`, `usePOSPrinter`, `useBalanza` envueltos con `useRef` + logger manual |

---

## Lo que NO incluye esta especificación

- No es un sistema de logging remoto ni persistente
- No reemplaza el sistema de eventos del dominio (`publishEvent`)
- No tiene UI en la app — solo visible en Developer Console
- No aplica a producción (solo en desarrollo, controlado por `import.meta.env.DEV` + toggle runtime por módulo)
