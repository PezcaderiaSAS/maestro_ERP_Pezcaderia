---
name: erp-modular-services
description: >
  Patrones de arquitectura de servicios modulares para MaestroPescaderia ERP.
  Úsala cuando crees o modifiques servicios de dominio (inventario, caja, contabilidad,
  RRHH, CRM, despacho), stores Zustand, o cuando definas contratos IDataService.
  Garantiza el patrón Dual-API (sync legacy + async class), la separación
  responsabilidades y el tipado estricto TypeScript.
version: 1.0.0
source: local-code-analysis
analyzed_files:
  - src/services/warehouseService.ts
  - src/services/inventoryService.ts
  - src/services/accountingService.ts
  - src/services/cashService.ts
  - src/types/services.types.ts
  - src/store/useInventoryStore.ts
---

# ERP Modular Services — Patrones de MaestroPescaderia

## Contexto del proyecto

**Stack:** React 18 + TypeScript estricto + Vite + Supabase + Zustand + Tailwind CSS  
**Backend:** Supabase (PostgreSQL + RLS + Edge Functions + pg_cron)  
**Idioma del código:** Español para nombres de dominio, inglés para patrones técnicos

---

## Patrón 1: Dual-API Service (obligatorio en todos los servicios de dominio)

Todo servicio de dominio DEBE exponer dos capas:

### Capa A — Legacy Sync (compatibilidad con stores locales)

```typescript
// Funciones puras, síncronas, usando load/save de localDb
export function obtenerEntidades(): ServiceResponse<Entidad[]> {
  try {
    const data = load<Entidad[]>('clave_localStorage', []);
    return { data, error: null };
  } catch {
    return { data: [], error: 'Error al obtener las entidades.' };
  }
}
```

### Capa B — Async Class (usa IDataService — local o Supabase)

```typescript
export class EntidadService {
  constructor(private dataService: IDataService = new LocalDataService()) {}

  async getAll(): Promise<Entidad[]> {
    return this.dataService.getAll<Entidad>('tabla_supabase');
  }

  async save(entity: Entidad): Promise<ServiceResponse<Entidad[]>> {
    try {
      // Validaciones antes de persistir
      if (!entity.nombre.trim())
        return { data: [], error: 'El nombre es obligatorio.' };

      const existing = await this.getAll();
      const idx = existing.findIndex(e => e.id === entity.id);

      if (idx !== -1) {
        await this.dataService.update('tabla_supabase', entity.id, entity);
      } else {
        await this.dataService.create('tabla_supabase', entity);
      }
      return { data: await this.getAll(), error: null };
    } catch {
      return { data: [], error: 'Error al guardar.' };
    }
  }
}
```

**REGLA:** Nunca mezclar la lógica de ambas capas. La Clase async llama a `IDataService`; las funciones sync llaman a `load`/`save`.

---

## Patrón 2: ServiceResponse<T> — Contrato universal de errores

SIEMPRE retornar este contrato. NUNCA lanzar excepciones hacia la vista:

```typescript
export interface ServiceResponse<T> {
  data: T;
  error: string | null;
}

// Para servicios con resultado nullable:
export type ResultadoOperacion<T> = {
  data: T | null;
  error: string | null;
};
```

**Anti-patrón a evitar:**
```typescript
// ❌ MAL — lanza excepción que rompe el flujo de la vista
async function guardar(e: Entidad) {
  const result = await supabase.from('tabla').insert(e);
  if (result.error) throw result.error; // ← PROHIBIDO
}

// ✅ BIEN — devuelve el error al llamador
async function guardar(e: Entidad): Promise<ServiceResponse<Entidad[]>> {
  const result = await supabase.from('tabla').insert(e);
  if (result.error) return { data: [], error: result.error.message };
  return { data: await getAll(), error: null };
}
```

---

## Patrón 3: IDataService — Abstracción de persistencia

El contrato central de acceso a datos. Todo servicio class lo recibe por inyección:

```typescript
export interface IDataService {
  mode: 'local' | 'supabase' | 'dual';

  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  create<T>(table: string, data: Partial<T>): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  softDelete(table: string, id: string): Promise<void>;
  hardDelete(table: string, id: string): Promise<void>;
  query<T>(table: string, options: QueryOptions): Promise<T[]>;
  getDbMode(): Promise<'local' | 'supabase' | 'dual'>;
  setDbMode(mode: 'local' | 'supabase' | 'dual'): Promise<void>;
}
```

**Regla:** Al inyectar `LocalDataService` por defecto, el servicio funciona offline. Al cambiar a `SupabaseDataService`, persiste en la nube sin cambiar código.

---

## Patrón 4: Zustand Store — Estructura estándar

```typescript
import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setModuloDataService = (ds: IDataService) => { dataService = ds; };

interface ModuloState {
  // Estado
  entidades: Entidad[];
  isLoading: boolean;
  // Acciones
  loadEntidades: () => Promise<void>;
  setEntidades: (entidadesOrUpdater: Entidad[] | ((prev: Entidad[]) => Entidad[])) => void;
}

export const useModuloStore = create<ModuloState>()(
  zustandConsoleMiddleware((set, get) => ({
    entidades: [],
    isLoading: false,

    loadEntidades: async () => {
      set({ isLoading: true });
      try {
        const data = await dataService.getAll<Entidad>('tabla_supabase');
        set({ entidades: data });
      } catch {
        set({ entidades: [] });
      } finally {
        set({ isLoading: false });
      }
    },

    setEntidades: (entidadesOrUpdater) =>
      set((state) => ({
        entidades:
          typeof entidadesOrUpdater === 'function'
            ? entidadesOrUpdater(state.entidades)
            : entidadesOrUpdater,
      })),
  }))
);
```

**Reglas del store:**
- Solo estado reactivo y acciones de carga/mutación
- Sin lógica de negocio pesada (va en el service)
- Siempre exportar el setter del `dataService` para pruebas e inyección

---

## Patrón 5: Validaciones de negocio en el servicio

Las validaciones de dominio van en el servicio, NO en la vista:

```typescript
// En el service:
async save(bodega: Bodega): Promise<ServiceResponse<Bodega[]>> {
  // 1. Validar campos obligatorios
  if (!bodega.nombre.trim()) return { data: [], error: 'El nombre es obligatorio.' };
  if (!bodega.codigo.trim()) return { data: [], error: 'El código es obligatorio.' };

  // 2. Validar reglas de negocio (esenciales, duplicados)
  const existentes = await this.getAll();
  const existente = existentes.find(b => b.id === bodega.id);

  if (existente?.esencial && existente.nombre !== bodega.nombre) {
    return { data: existentes, error: `La entidad '${existente.nombre}' es esencial y no se puede renombrar.` };
  }

  const duplicado = existentes.some(
    b => b.id !== bodega.id && b.codigo.toUpperCase() === bodega.codigo.toUpperCase()
  );
  if (duplicado) return { data: existentes, error: `Código '${bodega.codigo}' duplicado.` };

  // 3. Persistir
  // ...
}
```

---

## Módulos de dominio del ERP y sus servicios

| Módulo           | Service File                   | Store File                    | Tabla Supabase               |
|-----------------|-------------------------------|-------------------------------|------------------------------|
| Inventario      | `inventoryService.ts`         | `useInventoryStore.ts`        | `inventario_movimientos`     |
| Bodegas/WMS     | `warehouseService.ts`         | `useWarehouseStore.ts`        | `bodegas`                    |
| Caja/POS        | `cashService.ts`, `posService.ts` | `useCashStore.ts`         | `turnos_caja`, `movimientos_caja` |
| Contabilidad    | `accountingService.ts`        | `useAccountingStore.ts`       | `ledger_entries`, `accounts` |
| Cartera/AR      | `b2bService.ts`               | `useARStore.ts`               | `cartera_facturas`           |
| RRHH/Nómina     | `payrollService.ts`           | `useEmployeeStore.ts`         | `nomina_liquidaciones`       |
| Despacho        | `orderDispatchService.ts`     | `useOrderStore.ts`            | `traslados_logistica`        |

---

## Convenciones de nombres

```
// Tablas locales (localStorage key):  camelCase plural → 'bodegas', 'productsCatalog'
// Tablas Supabase:                    snake_case → 'inventario_movimientos'
// Tipos TypeScript:                   PascalCase → Bodega, MovimientoInventario
// Funciones legacy:                   verboCamelCase → obtenerBodegas(), guardarBodega()
// Métodos de clase async:             verboCamelCase inglés → getAll(), save(), delete()
// Stores:                             use[Modulo]Store → useInventoryStore
// Factories/setters DI:              set[Modulo]DataService → setInventoryDataService
```

---

## Checklist al crear un nuevo servicio

- [ ] Definir interfaz TypeScript del dominio con todos sus campos
- [ ] Exportar `ServiceResponse<T>` o `ResultadoOperacion<T>`
- [ ] Capa A: funciones sync con `load`/`save` (legacy)
- [ ] Capa B: clase async con `IDataService` inyectable
- [ ] Validaciones de negocio encapsuladas en el service
- [ ] Sin `try/catch` que trague errores silenciosamente — siempre retornar `error: string`
- [ ] Store Zustand que use la clase async via `dataService` inyectable
- [ ] Tablas Supabase nombradas en la constante `TablasSchemaNuevo` en `services.types.ts`
