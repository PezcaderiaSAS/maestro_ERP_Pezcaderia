# Task Breakdown — Console Logger

**Parent plan:** PLAN-CONSOLE-LOGGER-001  
**Total tasks:** 20  
**Dependency chain:** T01 ← (T02, T03 en paralelo) ← (T04–T10, T11, T12, T13, T14, T15 en paralelo) ← (T16, T17 en paralelo) ← T18 ← (T19, T20 en paralelo)

---

## Core (orden estricto)

### T01 — Crear `src/lib/consoleLogger.ts`

**Archivo:** `src/lib/consoleLogger.ts` (nuevo)  
**Dependencias:** Ninguna  
**Contenido:**

```
- createLogger(modulo) → { info, warn, error, debug, table }
- Niveles: DEBUG | INFO | WARN | ERROR
- MODULE_LEVELS: Record<string, LogLevel> mapea módulo→nivel
  · DataService: DEBUG, localDb: DEBUG, Store: DEBUG
  · POSCart: INFO, POSPrinter: INFO, Balanza: INFO
  · App: INFO, POS: INFO, default: INFO
- safeStringify() con WeakSet para circulares
- sessionId desde crypto.randomUUID(), persistido en sessionStorage
- isEnabled(): checkea globalThis.__LOGGER_ENABLED__ → import.meta.env.DEV → localStorage.debug
- LoggableDataService class (implementa IDataService, wrappa los 8 métodos)
- initLogger(): lee toggle, setea sessionId
```

**Verificación:** `import { createLogger } from './consoleLogger'; const log = createLogger('TEST'); log.info('ok')` → ver salida coloreada en consola.

---

### T02 — Crear `src/lib/consoleMiddleware.ts`

**Archivo:** `src/lib/consoleMiddleware.ts` (nuevo)  
**Dependencias:** T01 (`createLogger`)  
**Contenido:**

```
- export const zustandConsoleMiddleware = (config) => (set, get, api) => config(wrappedSet, get, api)
- wrappedSet: loguea { changedKeys, prev, next } con createLogger('Store')
- Firma compatible con Zustand v5: create<State>()(middleware((set, get) => {...}))
```

**Verificación:** Poder usarlo en un store sin errores de TS ni runtime.

---

### T03 — Crear `src/hooks/useActionLogger.ts`

**Archivo:** `src/hooks/useActionLogger.ts` (nuevo)  
**Dependencias:** T01 (`createLogger`)  
**Contenido:**

```
- export function useActionLogger<T extends Function>(modulo: string, accion: string, fn: T): T
- Retorna wrapper que loguea START con args y END con resultado o error
- Preserva tipado (misma firma que fn)
```

**Verificación:** `const wrapped = useActionLogger('X', 'fn', (a:number) => a*2); wrapped(5)` → log en consola.

---

## Stores (independientes entre sí, dependen de T02)

### T04 — Inyectar middleware en `useAppStore`

**Archivo:** `src/store/useAppStore.ts`  
**Cambio de 1 línea:**

```diff
+ import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

- export const useAppStore = create<AppState>()((set) => ({
+ export const useAppStore = create<AppState>()(
+   zustandConsoleMiddleware((set) => ({
     // ... contenido existente
- }));
+ })));
```

---

### T05 — Inyectar middleware en `useInventoryStore`

**Archivo:** `src/store/useInventoryStore.ts`  
**Cambio de 1 línea.** Misma mecánica que T04.

---

### T06 — Inyectar middleware en `useWarehouseStore`

**Archivo:** `src/store/useWarehouseStore.ts`  
**Cambio de 1 línea.**

---

### T07 — Inyectar middleware en `useOrderStore`

**Archivo:** `src/store/useOrderStore.ts`  
**Cambio de 1 línea.**

---

### T08 — Inyectar middleware en `useClientStore`

**Archivo:** `src/store/useClientStore.ts`  
**Cambio de 1 línea.**

---

### T09 — Inyectar middleware en `useSupplierStore`

**Archivo:** `src/store/useSupplierStore.ts`  
**Cambio de 1 línea.**

---

### T10 — Inyectar middleware en stores secundarios (10 stores)

**Archivos (1 línea cada uno):**

| Archivo | Store |
|---------|-------|
| `src/store/useCategoryStore.ts` | useCategoryStore |
| `src/store/useDriverStore.ts` | useDriverStore |
| `src/store/useEmployeeStore.ts` | useEmployeeStore |
| `src/store/useExpenseStore.ts` | useExpenseStore |
| `src/store/useDynamicFieldStore.ts` | useDynamicFieldStore |
| `src/store/useARStore.ts` | useARStore |
| `src/store/useReturnStore.ts` | useReturnStore |
| `src/store/useIntegrationStore.ts` | useIntegrationStore |
| `src/store/usePurchaseStore.ts` | usePurchaseStore |
| `src/store/useMovementStore.ts` | useMovementStore |
| `src/store/useEventStore.ts` | useEventStore |
| `src/store/useCashStore.ts` | useCashStore |

---

## Servicios e inicialización

### T11 — Inicializar LoggableDataService + setear en stores

**Archivo:** `src/main.tsx`  
**Dependencias:** T01 (LoggableDataService)  
**Cambio:**

```diff
+ import { LoggableDataService, initLogger } from './lib/consoleLogger';
+ import { setInventoryDataService } from './store/useInventoryStore';
+ import { setPurchaseDataService } from './store/usePurchaseStore';
+ import { setEventDataService } from './store/useEventStore';
+ import { setOrderDataService } from './store/useOrderStore';
+ import { setClientDataService } from './store/useClientStore';
+ import { setSupplierDataService } from './store/useSupplierStore';
+ import { setCategoryDataService } from './store/useCategoryStore';
+ import { setDriverDataService } from './store/useDriverStore';
+ import { setEmployeeDataService } from './store/useEmployeeStore';
+ import { setExpenseDataService } from './store/useExpenseStore';
+ import { setDynamicFieldDataService } from './store/useDynamicFieldStore';
+ import { setARDataService } from './store/useARStore';
+ import { setReturnDataService } from './store/useReturnStore';
+ import { setWarehouseDataService } from './store/useWarehouseStore';
+ import { setIntegrationDataService } from './store/useIntegrationStore';
+ import { setCashDataService } from './store/useCashStore';
+ import { setMovementDataService } from './store/useMovementStore';
+ import { LocalDataService } from './services/LocalDataService';

+ initLogger();

+ if (import.meta.env.DEV || localStorage.getItem('debug')) {
+   const wrapped = new LoggableDataService(new LocalDataService());
+   setInventoryDataService(wrapped);
+   setPurchaseDataService(wrapped);
+   setEventDataService(wrapped);
+   // ... (todos los setXDataService)
+   setOrderDataService(wrapped);
+   setClientDataService(wrapped);
+   setSupplierDataService(wrapped);
+   setCategoryDataService(wrapped);
+   setDriverDataService(wrapped);
+   setEmployeeDataService(wrapped);
+   setExpenseDataService(wrapped);
+   setDynamicFieldDataService(wrapped);
+   setARDataService(wrapped);
+   setReturnDataService(wrapped);
+   setWarehouseDataService(wrapped);
+   setIntegrationDataService(wrapped);
+   setCashDataService(wrapped);
+   setMovementDataService(wrapped);
+ }
```

---

## Hooks

### T12 — Envolver `usePOSCart` con logger

**Archivo:** `src/hooks/usePOSCart.ts`  
**Dependencias:** T01 (`createLogger`)  
**Cambios:**

```diff
+ import { createLogger } from '../lib/consoleLogger';
+ const log = createLogger('POSCart');

  export function usePOSCart(initialCliente = null) {
    // ... estado existente

    const agregarProducto = (producto, cantidad, esPesoManual) => {
+     log.info('agregarProducto', { sku: producto.sku, nombre: producto.nombre, cantidad })
      // ... lógica existente
    }

    const actualizarCantidad = (productoId, cantidad) => {
+     if (cantidad > 0) log.info('actualizarCantidad', { productoId, cantidad })
      // ... lógica existente
    }

    const actualizarDescuentoLinea = (productoId, descuentoPct) => {
+     log.info('actualizarDescuentoLinea', { productoId, descuentoPct })
      // ... lógica existente
    }

    const removerProducto = (productoId) => {
+     log.info('removerProducto', { productoId })
      // ... lógica existente
    }

    const limpiarCarrito = () => {
+     log.info('limpiarCarrito', { lineasPrevias: lineas.length })
      // ... lógica existente
    }

    const setCliente = (cliente) => {
+     if (cliente) log.info('setCliente', { clienteId: cliente.id, nombre: cliente.nombre, tipoPrecio: cliente.tipoPrecio })
      // ... lógica existente
    }

    return {
      // ... sin cambios en la interfaz
    }
  }
```

---

### T13 — Envolver `usePOSPrinter` con logger

**Archivo:** `src/hooks/usePOSPrinter.ts`  
**Dependencias:** T01 (`createLogger`)  
**Cambios:**

```diff
+ import { createLogger } from '../lib/consoleLogger';
+ const log = createLogger('POSPrinter');

  const imprimirTicket = async (venta, cliente) => {
+   log.info('imprimirTicket', { ventaId: venta.id, total: venta.total })
    // ... lógica existente
+   log.info('imprimirTicket OK', { ventaId: venta.id })
    // ...
    catch (err) {
+     log.error('imprimirTicket FAIL', { error: err.message })
    }
  }
```

---

### T14 — Envolver `useBalanza` con logger

**Archivo:** `src/hooks/useBalanza.ts`  
**Dependencias:** T01 (`createLogger`)  
**Cambios:**

```diff
+ import { createLogger } from '../lib/consoleLogger';
+ const log = createLogger('Balanza');

  const leerPeso = async (baudRate) => {
+   log.info('leerPeso', { baudRate })
    // ... lógica existente
    catch (err) {
+     log.error('leerPeso FAIL', { error: err.message })
    }
  }

  const simularLeerPeso = async () => {
+   log.info('simularLeerPeso')
    // ... lógica existente
  }
```

---

## App.tsx

### T15 — Agregar logging de navegación, eventos y errores globales

**Archivo:** `src/App.tsx`  
**Dependencias:** T01 (`createLogger`)  
**Cambios:**

```diff
+ import { createLogger } from './lib/consoleLogger';
+ const log = createLogger('App');

  // Al inicio del componente: handlers de errores globales (CA-04)
+ useEffect(() => {
+   const onError = (event: ErrorEvent) => {
+     log.error('window.onerror', {
+       mensaje: event.message,
+       archivo: event.filename,
+       linea: event.lineno,
+       columna: event.colno,
+       error: event.error?.stack,
+     })
+   }
+   const onRejection = (event: PromiseRejectionEvent) => {
+     log.error('unhandledrejection', {
+       motivo: event.reason?.message ?? event.reason,
+       stack: event.reason?.stack,
+     })
+   }
+   window.addEventListener('error', onError)
+   window.addEventListener('unhandledrejection', onRejection)
+   return () => {
+     window.removeEventListener('error', onError)
+     window.removeEventListener('unhandledrejection', onRejection)
+   }
+ }, [])

  // Al final del useEffect de navegación (antes del return):
+ useEffect(() => {
+   log.info('navegacion', { vista: currentView })
+ }, [currentView])

  // En publishEvent, además de persistir:
  const publishEvent = (tipo, actor, descripcion, metadata, enqueueSync) => {
+   log.info('publishEvent', {
+     tipo, actor,
+     descripcion: descripcion?.substring(0, 120),
+     metadata
+   })
    useEventStore.getState().publishEvent(tipo, actor, descripcion, metadata, enqueueSync)
+   log.debug('DomainEvent creado', { tipo, actor })
  }

  // En handleCancelarPedidoDigital:
+ log.info('cancelarPedidoDigital', { logId, pedidoNo })

  // En handleAprobarPedidoManual:
+ log.info('aprobarPedidoManual', { logId, modo })
```

---

## Vistas (useActionLogger)

### T16 — Aplicar useActionLogger en POSView

**Archivo:** `src/views/POSView.tsx`  
**Dependencias:** T03 (`useActionLogger`)  
**Cambio:** Envolver `handleCobrar` con useActionLogger para loguear la acción "Facturar"

```diff
+ import { useActionLogger } from '../hooks/useActionLogger';

  // Dentro del componente:
+ const handleCobrar = useActionLogger('POS', 'facturar', async () => {
    // ... lógica existente
+ })
```

**Verificación:** Al hacer clic en "Facturar", se ve en consola: `[POS] facturar START { args }` y `[POS] facturar END { result }`.

---

### T17 — Aplicar useActionLogger en CashFlow + modales

**Archivos:** `src/views/CashFlowView.tsx`, `src/components/AperturaCajaModal.tsx`, `src/components/CierreCajaModal.tsx`  
**Dependencias:** T03 (`useActionLogger`)  
**Cambios:**

```diff
  // CashFlowView.tsx — envolver abrirTurno y cerrarTurno
+ const handleAbrirTurno = useActionLogger('CashFlow', 'abrirTurno', async (...) => { ... });
+ const handleCerrarTurno = useActionLogger('CashFlow', 'cerrarTurno', async (...) => { ... });

  // AperturaCajaModal.tsx — envolver submit
+ const handleSubmit = useActionLogger('CashFlow', 'aperturaCaja', async (...) => { ... });

  // CierreCajaModal.tsx — envolver submit
+ const handleSubmit = useActionLogger('CashFlow', 'cierreCaja', async (...) => { ... });
```

**Verificación:** Al abrir/cerrar turno, se ve en consola el log de la acción.

---

## Tests

### T18 — Desactivar logger en tests

**Archivo:** `src/tests/setup.ts`  
**Dependencias:** Ninguna  
**Cambio:**

```diff
+ // Silenciar logger en tests unitarios
+ globalThis.__LOGGER_ENABLED__ = false
```

---

## Verificación

### T19 — Verificar build

```bash
npm run build
```

Resultado esperado: `tsc` sin errores + `vite build` exitoso.

### T20 — Verificar tests

```bash
npm t
```

Resultado esperado: Todos los tests existentes pasan sin cambios en su comportamiento.

---

## Resumen de cambios por archivo

| Task | Archivo | Tipo | Líneas | Complejidad |
|------|---------|------|--------|-------------|
| T01 | `src/lib/consoleLogger.ts` | Nuevo | ~160 | Alta |
| T02 | `src/lib/consoleMiddleware.ts` | Nuevo | ~25 | Media |
| T03 | `src/hooks/useActionLogger.ts` | Nuevo | ~30 | Media |
| T04 | `src/store/useAppStore.ts` | Modificar | +2 | Trivial |
| T05 | `src/store/useInventoryStore.ts` | Modificar | +2 | Trivial |
| T06 | `src/store/useWarehouseStore.ts` | Modificar | +2 | Trivial |
| T07 | `src/store/useOrderStore.ts` | Modificar | +2 | Trivial |
| T08 | `src/store/useClientStore.ts` | Modificar | +2 | Trivial |
| T09 | `src/store/useSupplierStore.ts` | Modificar | +2 | Trivial |
| T10 | 12 stores secundarios | Modificar | +2 c/u | Trivial |
| T11 | `src/main.tsx` | Modificar | ~30 | Media |
| T12 | `src/hooks/usePOSCart.ts` | Modificar | +15 | Baja |
| T13 | `src/hooks/usePOSPrinter.ts` | Modificar | +5 | Baja |
| T14 | `src/hooks/useBalanza.ts` | Modificar | +5 | Baja |
| T15 | `src/App.tsx` | Modificar | +30 | Media-Ata |
| T16 | `src/views/POSView.tsx` | Modificar | +3 | Baja |
| T17 | `src/views/CashFlowView.tsx`, modales | Modificar | +10 | Baja |
| T18 | `src/tests/setup.ts` | Modificar | +2 | Trivial |
| T19 | — | Verificar | — | — |
| T20 | — | Verificar | — | — |
