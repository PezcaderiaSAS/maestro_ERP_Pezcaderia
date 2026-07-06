# Plan de Implementación — Console Logger

**Plan ID:** PLAN-CONSOLE-LOGGER-001  
**Basado en:** SPEC-CONSOLE-LOGGER-001 (v1.0)  
**Tags:** `#logging #zustand #debugging #consola`

---

## 1. Resumen de cambios

| Tipo | Cantidad | Archivos |
|------|----------|----------|
| **Crear** | 3 | `src/lib/consoleLogger.ts`, `src/lib/consoleMiddleware.ts`, `src/hooks/useActionLogger.ts` |
| **Modificar stores** | 15 | Agregar middleware a cada `create()` |
| **Modificar servicios** | 1 | Crear `LoggableDataService` decorator + aplicarlo en `main.tsx` |
| **Modificar hooks** | 3 | Envolver acciones con logger en `usePOSCart`, `usePOSPrinter`, `useBalanza` |
| **Modificar entry** | 2 | `main.tsx` (inicializar logger + toggle), `App.tsx` (log navegación + publishEvent) |
| **Modificar tests** | 1 | `src/tests/setup.ts` (desactivar logger) |

---

## 2. Nuevos archivos

### 2.1 `src/lib/consoleLogger.ts`

**Responsabilidad:** Logger base, desacoplado de React. Produce logs formateados en la Developer Console.

**Interfaz pública:**

```ts
// Crear un logger para un módulo
const log = createLogger('POS')

// Métodos
log.info(accion, contexto?)    // → console.group + console.info
log.warn(accion, contexto?)    // → console.group + console.warn
log.error(accion, contexto?)   // → console.group + console.error
log.debug(accion, contexto?)   // → console.debug (colapsado)
log.table(accion, array)       // → console.table
log.traceStart(accion)         // → performance.mark + console.time
log.traceEnd(accion)           // → performance.measure + console.timeEnd
```

**Flujo interno:**

```
createLogger('POS')
  ↓
check isEnabled()
  ├─ false → no-op (return { info: noop, ... })
  └─ true → check runtime toggle (localStorage.debug)
       ├─ 'POS,CASH' y módulo no está en lista → no-op para ese módulo
       └─ módulo permitido → logger real

logger.info('registrarVenta', { lineas: 3 })
  ↓
console.group(`📋 [POS] registrarVenta`)
console.info(`  sessionId: ${sessionId}`)
console.info(`  timestamp: ${new Date().toISOString()}`)
console.dir(contexto)
console.groupEnd()
```

**sessionId:** Se genera una vez con `crypto.randomUUID()` y se persiste en `sessionStorage` para mantenerlo durante toda la sesión del navegador.

**Runtime toggle:** Se evalua al inicio (`localStorage.getItem('debug')`). Si cambia en caliente, se re-evalua en cada log (overhead mínimo).

**safeStringify:** Función interna que maneja círculos.

---

### 2.2 `src/lib/consoleMiddleware.ts`

**Responsabilidad:** Middleware genérico para Zustand que intercepta cada `setState` y loguea el diff.

**Firma Zustand v5:**

```ts
type ZustandMiddleware = <T>(
  config: StateCreator<T, [], []>
) => StateCreator<T, [], []>
```

**Implementación:**

```ts
export const zustandConsoleMiddleware: ZustandMiddleware =
  (config) => (set, get, api) =>
    config(
      (args) => {
        const prev = get()
        set(args)
        const next = get()
        const log = createLogger(api.storeName || 'Store')
        log.debug('setState', {
          changedKeys: Object.keys(args),
          prev: safeStringify(prev),
          next: safeStringify(next),
        })
      },
      get,
      api
    )
```

**Nota:** El middleware no loguea el `set` inicial del estado default (solo los cambios posteriores). Para distinguir, se usa un flag interno `_initialized`.

---

### 2.3 `src/hooks/useActionLogger.ts`

**Responsabilidad:** Hook que envuelve callbacks de UI para loguear interacciones de usuario.

```ts
function useActionLogger<T extends (...args: any[]) => any>(
  modulo: string,
  accion: string,
  fn: T
): T

// Uso:
const handleClick = useActionLogger('POS', 'clickFacturar', async () => {
  // lógica original
})
```

**Flujo:** Retorna un wrapper que:
1. Loguea `[modulo] accion START` con los args
2. Ejecuta `fn`
3. Loguea `[modulo] accion END` con el resultado (o error)
4. Retorna el resultado original

**No afecta tipado** — la firma es transparente.

---

## 3. Modificaciones a archivos existentes

### 3.1 Stores Zustand (15 stores)

Cada store recibe el middleware en su `create()`. Cambio de una línea:

```diff
- export const useXStore = create<State>()((set, get) => ({ ... }))
+ export const useXStore = create<State>()(
+   zustandConsoleMiddleware((set, get) => ({ ... }))
+ )
```

**Stores a modificar (lista completa):**

| Store | Archivo |
|-------|---------|
| `useAppStore` | `src/store/useAppStore.ts` |
| `useInventoryStore` | `src/store/useInventoryStore.ts` |
| `useWarehouseStore` | `src/store/useWarehouseStore.ts` |
| `useOrderStore` | `src/store/useOrderStore.ts` |
| `useClientStore` | `src/store/useClientStore.ts` |
| `useSupplierStore` | `src/store/useSupplierStore.ts` |
| `useCategoryStore` | `src/store/useCategoryStore.ts` |
| `useDriverStore` | `src/store/useDriverStore.ts` |
| `useEmployeeStore` | `src/store/useEmployeeStore.ts` |
| `useExpenseStore` | `src/store/useExpenseStore.ts` |
| `useDynamicFieldStore` | `src/store/useDynamicFieldStore.ts` |
| `useARStore` | `src/store/useARStore.ts` |
| `useReturnStore` | `src/store/useReturnStore.ts` |
| `useIntegrationStore` | `src/store/useIntegrationStore.ts` |
| `usePurchaseStore` | `src/store/usePurchaseStore.ts` |
| `useMovementStore` | `src/store/useMovementStore.ts` |
| `useEventStore` | `src/store/useEventStore.ts` |
| `useCashStore` | `src/store/useCashStore.ts` |

Total: 18 stores.

---

### 3.2 Servicios — Decorator `LoggableDataService`

No se modifican los servicios individuales. Se crea un **decorator** que implementa `IDataService` y envuelve cualquier implementación:

```ts
// En src/lib/consoleLogger.ts (o archivo separado)

export class LoggableDataService implements IDataService {
  readonly mode: IDataService['mode']
  private inner: IDataService
  private log: Logger

  constructor(inner: IDataService) {
    this.inner = inner
    this.mode = inner.mode
    this.log = createLogger('DataService')
  }

  async getAll<T>(table: string): Promise<T[]> {
    this.log.debug(`getAll(${table})`)
    const start = performance.now()
    try {
      const result = await this.inner.getAll<T>(table)
      this.log.debug(`getAll(${table}) OK`, { count: result.length, ms: performance.now() - start })
      return result
    } catch (e) {
      this.log.error(`getAll(${table}) FAIL`, { error: e, ms: performance.now() - start })
      throw e
    }
  }

  // ... mismos wrappers para create, update, delete, query, getById, softDelete, hardDelete, getDbMode, setDbMode
}
```

**Punto de inyección:** En `main.tsx` se envuelve el `LocalDataService` y opcionalmente `SupabaseDataService`:

```ts
// main.tsx
import { LoggableDataService } from './lib/consoleLogger'
import { LocalDataService } from './services/LocalDataService'

const baseService = new LocalDataService()
const dataService = import.meta.env.DEV
  ? new LoggableDataService(baseService)
  : baseService

// Pasar a stores vía setXDataService()
```

**Pero los stores usan `new LocalDataService()` internamente** — esto requiere que cada store acepte el data service desde fuera. Para minimizar cambios, se usa el patrón ya existente (`setXDataService()`):

```ts
// En cada store (ya existe el pattern):
let dataService: IDataService = new LocalDataService()
export const setXDataService = (ds: IDataService) => { dataService = ds }

// En main.tsx:
import { setInventoryDataService } from './store/useInventoryStore'
import { setPurchaseDataService } from './store/usePurchaseStore'
// ... etc

if (import.meta.env.DEV) {
  const wrapped = new LoggableDataService(new LocalDataService())
  setInventoryDataService(wrapped)
  setPurchaseDataService(wrapped)
  // ... (todos los stores con dataService)
}
```

---

### 3.3 Hooks — usePOSCart, usePOSPrinter, useBalanza

Cada hook se modifica para envolver sus acciones con el logger.

**usePOSCart** (`src/hooks/usePOSCart.ts`):
```ts
// Cambios: envolver cada acción pública
const log = createLogger('POSCart')

const agregarProducto = (producto: Producto, cantidad = 1, esPesoManual = false) => {
  log.info('agregarProducto', { sku: producto.sku, nombre: producto.nombre, cantidad })
  // ... lógica original
}

const actualizarCantidad = (productoId: string, cantidad: number) => {
  if (cantidad > 0) log.info('actualizarCantidad', { productoId, cantidad })
  // ... lógica original
}

const removerProducto = (productoId: string) => {
  log.info('removerProducto', { productoId })
  // ... lógica original
}

// setCliente, limpiarCarrito, setDescuentos — mismos wrappers
```

**usePOSPrinter** (`src/hooks/usePOSPrinter.ts`):
```ts
const log = createLogger('POSPrinter')

const imprimirTicket = async (venta: any, cliente: ClientePrinter | null): Promise<boolean> => {
  log.info('imprimirTicket', { ventaId: venta.id, total: venta.total })
  // ... lógica original con try/catch
  log.error('imprimirTicket FAIL', { error: err.message })
}
```

**useBalanza** (`src/hooks/useBalanza.ts`):
```ts
const log = createLogger('Balanza')

const leerPeso = async (baudRate = 9600): Promise<number> => {
  log.info('leerPeso', { baudRate })
  // ... try/catch alrededor de la lógica
}

const simularLeerPeso = async (): Promise<number> => {
  log.info('simularLeerPeso')
  // ...
}
```

---

### 3.4 `src/App.tsx` — Logging de navegación y eventos

Dos cambios:

```ts
// 1. Log de cambio de vista (en useAppStore.setCurrentView ya capturado por middleware)
//    pero adicionalmente loguear con contexto de navegación:

const log = createLogger('App')
const currentView = useAppStore(s => s.currentView)
useEffect(() => {
  log.info('navegacion', { vista: currentView })
}, [currentView])

// 2. En publishEvent, agregar log de evento (además de persistirlo):
const publishEvent = (...) => {
  const domainEvent = useEventStore.getState().publishEvent(...)
  log.info('publishEvent', {
    tipo: domainEvent?.tipo,
    actor: domainEvent?.actor,
    descripcion: domainEvent?.descripcion?.substring(0, 120),
    metadata: domainEvent?.metadata,
  })
}
```

---

### 3.5 `src/main.tsx` — Inicialización

```ts
import { LoggableDataService, initLogger, sessionId } from './lib/consoleLogger'

// Inicializar logger (lee localStorage.debug, configura sessionId)
initLogger()

// Wrapper de servicios
if (import.meta.env.DEV || localStorage.getItem('debug')) {
  const wrapped = new LoggableDataService(new LocalDataService())
  setInventoryDataService(wrapped)
  setPurchaseDataService(wrapped)
  setEventDataService(wrapped)
  setReturnDataService(wrapped)
  setWarehouseDataService(wrapped)
  setSupplierDataService(wrapped)
  setCashDataService(wrapped)        // useCashStore
  setClientDataService(wrapped)      // useClientStore (si existe setter)
  setCategoryDataService(wrapped)    // useCategoryStore
  setDriverDataService(wrapped)      // useDriverStore
  setEmployeeDataService(wrapped)    // useEmployeeStore
  setExpenseDataService(wrapped)     // useExpenseStore
  setDynamicFieldDataService(wrapped) // useDynamicFieldStore
  setARDataService(wrapped)          // useARStore
  setIntegrationDataService(wrapped) // useIntegrationStore (YA existe)
  setMovementDataService(wrapped)    // useMovementStore
  setOrderDataService(wrapped)       // useOrderStore
}
```

**Nota:** Validar en cada store que el setter `setXDataService()` exista. Los que no lo tengan, se añade en el mismo estilo: `export const setXDataService = (ds: IDataService) => { dataService = ds }`.

---

### 3.6 `src/tests/setup.ts` — Desactivar logger

```diff
+ // Silenciar logger en tests unitarios
+ globalThis.__LOGGER_ENABLED__ = false
```

---

## 4. Diagrama de flujo de datos

```
┌──────────────────────────────────────────────────────────┐
│ USUARIO                                                   │
│   clic en "Facturar"                                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ POSView.tsx                                               │
│   onClick={handleCobrar} → useActionLogger('POS','cobrar')│
└──────┬───────────────────────────────────────────┬────────┘
       │ log: [POS] cobrar START { args }          │ llama a:
       ▼                                           ▼
┌──────────────────┐                  ┌──────────────────────────┐
│ usePOSCart       │                  │ posService               │
│ agregarProducto  │                  │ registrarVenta           │
│ → log: agregar   │                  │ → LoggableDataService    │
│   Producto {...} │                  │   → log: getAll(ventas)  │
└──────────────────┘                  │   → log: create(venta)   │
                                      └──────────┬───────────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────────────┐
                                      │ Zustand Middleware        │
                                      │ useOrderStore.setVentas() │
                                      │ → log: setState { prev,  │
                                      │   next, changedKeys }    │
                                      └──────────────────────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────────────┐
                                      │ useEventStore.publish()   │
                                      │ → log: [App] publishEvent│
                                      │   { tipo, actor, desc }  │
                                      └──────────────────────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────────────┐
                                      │ USUARIO VE EN CONSOLA:   │
                                      │                          │
                                      │ 📋 [POS] cobrar START    │
                                      │   ├ args: { total: 52000}│
                                      │ 📋 [POSCart] agregar     │
                                      │   Producto { sku,nombre } │
                                      │ 🔍 [DataService] getAll  │
                                      │   (ventas) OK { count:5 }│
                                      │ 🔍 [Store] setState      │
                                      │   { changedKeys: ventas }│
                                      │ 📋 [App] publishEvent    │
                                      │   { tipo: SALE_COMPLETED}│
                                      │ 📋 [POS] cobrar END      │
                                      │   { ms: 230, result... } │
                                      └──────────────────────────┘
```

---

## 5. Dependencias entre capas

```
NUEVOS ARCHIVOS:
src/lib/consoleLogger.ts     ← sin dependencias (solo APIs nativas)
src/lib/consoleMiddleware.ts ← import { createLogger } from './consoleLogger'
src/hooks/useActionLogger.ts ← import { createLogger } from '../lib/consoleLogger'

MODIFICACIONES:
src/main.tsx                 ← import { LoggableDataService, initLogger }
src/App.tsx                  ← import { createLogger } from './lib/consoleLogger'
src/tests/setup.ts           ← globalThis.__LOGGER_ENABLED__ = false

CADA STORE (x18):           ← import { zustandConsoleMiddleware } from '../lib/consoleMiddleware'
CADA HOOK (x3):             ← import { createLogger } from '../lib/consoleLogger'
CADA SERVICE SETTER (x18):  ← import { LoggableDataService } from '../lib/consoleLogger' (solo main.tsx)
```

---

## 6. Orden de implementación sugerido

| Fase | Paso | Archivos | Depende de |
|------|------|----------|------------|
| **F1** | Crear `consoleLogger.ts` | 1 archivo | — |
| **F2** | Crear `consoleMiddleware.ts` | 1 archivo | F1 |
| **F3** | Crear `useActionLogger.ts` | 1 archivo | F1 |
| **F4** | Inyectar middleware en stores | 18 archivos | F2 |
| **F5** | Crear LoggableDataService + inyectar en `main.tsx` | 2 archivos (1 nuevo + main.tsx) | F1 |
| **F6** | Envolver hooks (usePOSCart, usePOSPrinter, useBalanza) | 3 archivos | F1 |
| **F7** | Agregar logging en App.tsx (navegación + publishEvent) | 1 archivo | F1 |
| **F8** | Desactivar logger en tests | 1 archivo | — |
| **F9** | Verificar build y tests | `npm run build`, `npm t` | F1-F8 |

---

## 7. Riesgos técnicos mitigados

| Riesgo | Mitigación |
|--------|------------|
| `zustandConsoleMiddleware` rompe tipado | Usar `any` para el wrapper (el tipado de Zustand v5 middleware es complejo). La interfaz pública del store no cambia. |
| Overhead de `JSON.stringify` en cada log | `safeStringify` solo se ejecuta si el nivel correspondiente está activo (short-circuit en `isEnabled()`) |
| LoggableDataService duplica logs (middleware + decorator) | El middleware loguea cambios de estado interno; el decorator loguea llamadas a servicios. Son complementarios, no duplicados. |
| Stores sin `setXDataService()` exportado | Se añade el setter en el mismo archivo (cambio de 2 líneas ya existente en la mayoría). |

---

## 8. Criterios de verificación post-implementación

- [ ] `npm run build` compila sin errores
- [ ] `npm t` pasa todas las pruebas existentes
- [ ] Al abrir la app en dev, la consola muestra logs de cada store al cambiar estado
- [ ] Al hacer una venta POS, se ve la secuencia completa: interacción → store → servicio → evento
- [ ] `localStorage.setItem('debug', 'POS')` activa solo logs del módulo POS
- [ ] En tests, no hay salida de console.log del logger
- [ ] Los logs incluyen `sessionId`, `timestamp` y `changedKeys`
- [ ] `payload_json` de integraciones NO aparece en logs (solo metadata)
