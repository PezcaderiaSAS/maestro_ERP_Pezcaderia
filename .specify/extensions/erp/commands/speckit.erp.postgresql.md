# Migración de localStorage a PostgreSQL (Supabase)

## 1. Principios Arquitectónicos

1. **Dual-Write durante migración:** Toda escritura debe ir a PostgreSQL primero y a localStorage como respaldo. El sistema debe funcionar incluso si PostgreSQL no está disponible (fallback a localStorage).
2. **Idempotencia:** Todas las operaciones de migración deben ser idempotentes. Ejecutar el mismo script de migración múltiples veces no debe duplicar datos.
3. **Zero Downtime:** La app nunca debe mostrar pantalla en blanco durante la migración. Los datos migran en background.
4. **Feature Flag:** La migración se controla con `DB_MODE = 'local' | 'supabase' | 'dual'` en `parametros`.
5. **Validación Cruzada:** En modo `dual`, cada operación compara resultados entre localStorage y PostgreSQL y alerta si hay divergencia.

## 2. Mapeo localStorage → PostgreSQL

| Clave localStorage | Tabla PostgreSQL | Estado Schema | Prioridad |
|---|---|---|---|
| `productsCatalog` | `productos_catalogo` | Existe en `01_schema_inicial.sql` | P0 |
| `productPricings` | `productos_precios` | Existe en `01_schema_inicial.sql` | P0 |
| `stock` | `inventario_stock` | Existe en `02_sistema_inventario_y_produccion.sql` | P0 |
| `movimientos` | `inventario_movimientos` | Existe en `02_sistema_inventario_y_produccion.sql` | P0 |
| `bodegas` | `bodegas` | Existe en `01_schema_inicial.sql` | P0 |
| `categorias` | `categorias` | Existe en `01_schema_inicial.sql` | P0 |
| `clientes` | `clientes` | Existe en `01_schema_inicial.sql` | P1 |
| `proveedores` | `proveedores` | Existe en `01_schema_inicial.sql` | P1 |
| `ventas` | `ventas` + `ventas_items` | Existe en `03_ventas_y_facturacion.sql` | P1 |
| `cartera` | `cartera_facturas` + `cartera_pagos` | Existe en `03_ventas_y_facturacion.sql` | P1 |
| `ordenesCompra` | `ordenes_compra` + `ordenes_compra_items` | Existe en `02_sistema_inventario_y_produccion.sql` | P1 |
| `cajas` | `cajas` | Existe en `04_caja_y_finanzas.sql` | P2 |
| `turnosCaja` | `caja_turnos` | Existe en `04_caja_y_finanzas.sql` | P2 |
| `movimientosCaja` | `caja_movimientos` | Existe en `04_caja_y_finanzas.sql` | P2 |
| `trasladosDinero` | `caja_traslados` | Existe en `04_caja_y_finanzas.sql` | P2 |
| `empleados` | `recursos_humanos_empleados` | Existe en `06_recursos_humanos.sql` | P2 |
| `nominas` | `recursos_humanos_nominas` | Existe en `06_recursos_humanos.sql` | P2 |
| `gastos` | `gastos` | Por crear | P2 |
| `conductores` | `logistica_conductores` | Existe en `07_logistica_y_devoluciones.sql` | P2 |
| `rutas` | `logistica_rutas` | Existe en `07_logistica_y_devoluciones.sql` | P2 |
| `devoluciones` | `logistica_devoluciones` | Existe en `07_logistica_y_devoluciones.sql` | P2 |
| `lastClientPrices` | `clientes_ultimos_precios` | Por crear | P2 |
| `events` | `sistema_eventos` | Por crear | P3 |
| `syncQueue` | `sistema_sync_queue` | Por crear | P3 |
| `parametros` | `sistema_parametros` | Por crear | P3 |
| `logIntegracion` | `canales_digitales_log` | Por crear | P3 |
| `role` | `usuarios` (columna `rol`) | Existe en `01_schema_inicial.sql` + `05_politicas_rls_y_seguridad.sql` | P0 |
| `dynamicFields` | `sistema_campos_dinamicos` | Por crear | P3 |
| `recetas` | `produccion_recetas` | Por crear | P3 |
| `logsSiigo` | `integracion_siigo_logs` | Por crear | P3 |
| `categoriasGastos` | `gastos_categorias` | Por crear | P3 |

## 3. Capas de Implementación

### Capa 1: Cliente Supabase (`src/lib/supabase.ts`)
- Cliente Singleton de Supabase con manejo de reintentos (exponential backoff)
- Timeout configurable por operación
- Logging de todas las queries en desarrollo

### Capa 2: Servicio de Datos Abstracto (`src/services/dataService.ts`)
Capa intermedia que decide dónde leer/escribir según `DB_MODE`:

```typescript
interface IDataService<T> {
  getAll(): Promise<ResultadoOperacion<T[]>>;
  getById(id: string): Promise<ResultadoOperacion<T | null>>;
  create(data: T): Promise<ResultadoOperacion<T>>;
  update(id: string, data: Partial<T>): Promise<ResultadoOperacion<T>>;
  delete(id: string): Promise<ResultadoOperacion<void>>;
}
```

Implementaciones concretas:
- `LocalDataService<T>` — opera sobre localStorage (código existente envuelto)
- `SupabaseDataService<T>` — opera sobre PostgreSQL vía Supabase client
- `DualDataService<T>` — escribe en ambos, lee de Supabase con fallback a localStorage

### Capa 3: Adaptadores por Entidad
Cada store de Zustand se modifica para inyectar el `DataService` correspondiente en lugar de llamar directamente a `localDb`.

### Capa 4: Scripts de Migración Inicial (`src/scripts/migrateToSupabase.ts`)
- Batch export desde localStorage a JSON
- Inserción en Supabase con `INSERT ... ON CONFLICT DO NOTHING`
- Reporte de resultados (éxitos, fallos, conflictos)
- Ejecutable vía `npm run migrate:supabase`

## 4. Transformaciones de Datos Requeridas

### 4.1 Stock: Dictionary O(1) → Tabla Relacional
```sql
-- Estado actual en localStorage:
{ "Bodega Principal": { "PES-ENT-001": 500, "FIL-LIM-002": 120 }, ... }
-- Estado destino en PostgreSQL:
-- Cada registro es un row en inventario_stock(producto_id, bodega_id, cantidad)
```

### 4.2 Ventas: Array embebido → Tabla hija
`items` dentro de `VentaPOS` → `ventas_items` con FK a `ventas.id`

### 4.3 Órdenes de Compra: Array embebido → Tabla hija
`lineas` dentro de `OrdenCompra` → `ordenes_compra_items`

### 4.4 Catálogo + Precios: FKs
`productos_precios.producto_id` → `productos_catalogo.id`

### 4.5 LastClientPrices: Dictionary → Tabla
```sql
CREATE TABLE clientes_ultimos_precios (
  cliente_identificacion TEXT NOT NULL,
  producto_id UUID NOT NULL,
  precio_ultimo NUMERIC(12,2) NOT NULL,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cliente_identificacion, producto_id)
);
```

## 5. Migración de Stores de Zustand

### Patrón General
```typescript
// ANTES:
const loadInventory = () => {
  const catalog = localDb.load('productsCatalog', []);
  set({ productsCatalog: catalog });
};

// DESPUÉS (modo dual):
const loadInventory = async () => {
  // Intentar desde Supabase
  const { data, error } = await supabase.from('productos_catalogo').select('*');
  if (error || !data?.length) {
    // Fallback a localStorage
    const catalog = localDb.load('productsCatalog', []);
    set({ productsCatalog: catalog });
    return;
  }
  set({ productsCatalog: data });
};
```

### Stores a Migrar por Prioridad

**P0 (Core):**
1. `useInventoryStore` — Catálogo + Precios
2. `useWarehouseStore` — Bodegas + Stock
3. `useOrderStore` — Ventas + Cotizaciones

**P1 (Operacional):**
4. `useClientStore` — Clientes
5. `useSupplierStore` — Proveedores

**P2 (Financiero):**
6. `useCashStore` — Caja, Turnos, Movimientos

## 6. RLS (Row Level Security)

Las políticas RLS ya están definidas en `05_politicas_rls_y_seguridad.sql`. La migración debe respetar:

- **ADMIN:** Acceso total a todas las tablas
- **VENDEDOR:** Lectura de catálogo y clientes, escritura en ventas
- **BODEGUERO:** Lectura/escritura en inventario, solo lectura en ventas
- **CONDUCTOR:** Solo lectura en rutas asignadas y devoluciones

El `role` se mapea desde `usuarios.rol` almacenado en localStorage como `pezcaderia_role`.

## 7. Plan de Ejecución por Fases

### Fase 1: Infraestructura (Día 1-2)
- [ ] Crear `src/lib/supabase.ts` con cliente configurable
- [ ] Crear `src/services/dataService.ts` con el patrón abstracto
- [ ] Implementar `LocalDataService`, `SupabaseDataService`, `DualDataService`
- [ ] Agregar `DB_MODE` a `parametros` en localStorage
- [ ] Validar esquemas SQL existentes vs. tipos de TypeScript

### Fase 2: Migración P0 - Core (Día 3-5)
- [ ] Migrar `useInventoryStore` a `DualDataService`
- [ ] Migrar `useWarehouseStore` a `DualDataService`
- [ ] Migrar carga inicial en `App.tsx` (useEffect de hidratación)
- [ ] Escribir script `migrateToSupabase.ts` para Productos, Bodegas, Stock
- [ ] Tests de validación cruzada (localStorage vs Supabase)

### Fase 3: Migración P1 - Operaciones (Día 6-8)
- [ ] Migrar `useClientStore` + `useSupplierStore`
- [ ] Migrar Ventas y Cartera
- [ ] Migrar Órdenes de Compra
- [ ] Scripts de migración para estas entidades

### Fase 4: Migración P2 - Financiero y RRHH (Día 9-11)
- [ ] Migrar Caja (turnos, movimientos, traslados)
- [ ] Migrar Empleados y Nóminas
- [ ] Migrar Gastos

### Fase 5: P3 - Sistemas y Remanentes (Día 12-13)
- [ ] Migrar eventos, syncQueue, logs de integración
- [ ] Migrar parámetros, campos dinámicos, recetas
- [ ] Limpieza de datos huérfanos

### Fase 6: Cutover (Día 14)
- [ ] Cambiar `DB_MODE` de `'dual'` a `'supabase'`
- [ ] Monitoreo de errores 48h
- [ ] Desactivar DualDataService si todo estable
- [ ] Backup final de localStorage antes de limpieza

## 8. Manejo de Errores y Rollback

### Por Operación
- Timeout por query: 5s (lectura), 10s (escritura)
- Reintentos: 3 con exponential backoff (500ms, 1s, 2s)
- Si Supabase falla: logging del error + operación continúa en localStorage sin notificar al usuario

### Por Fase
- Cada fase tiene un script de rollback que exporta datos de Supabase a JSON y restaura localStorage
- `npm run migrate:rollback -- --phase 2`
- El feature flag `DB_MODE` permite revertir instantáneamente de `'supabase'` a `'local'`

### Health Check
Endpoint interno `window.__dbHealth()` que retorna:
- Estado de conexión a Supabase
- Conteo de registros en tablas principales (vs localStorage)
- Última sincronización exitosa
- Errores recientes

## 9. Tests

### Unitarios (Vitest)
- `src/tests/services/dataService.test.ts` — Patrón abstracto y fallbacks
- `src/tests/migration/transformations.test.ts` — Transformaciones de datos (stock dict → rows, arrays anidados → tablas hijas)

### E2E (Playwright)
- `tests/e2e/migration.spec.ts` — Flujo completo: inyectar localStorage → migrar → verificar datos en Supabase → operar en modo supabase
- `tests/e2e/dual-mode.spec.ts` — Modo dual: escribir, desconectar Supabase, verificar que localStorage funciona

## 10. Criterios de Aceptación

1. Toda entidad P0 se lee y escribe correctamente en Supabase con fallback a localStorage
2. Script de migración inicial procesa 100% de los datos existentes sin pérdida
3. Modo dual no duplica registros (idempotencia)
4. RLS funcional: un VENDEDOR no puede modificar precios ni bodegas
5. Cutover a Supabase no requiere recarga forzada del navegador
6. Tiempo de respuesta P99 para lectura < 200ms en Supabase
7. Todos los tests unitarios y E2E pasan en los 3 modos (local, supabase, dual)
