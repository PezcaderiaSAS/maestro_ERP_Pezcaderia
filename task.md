# Tareas: La Pezcadería ERP - Setup Base de Datos y Migración

- `[x]` inicializar repositorio o estructura de carpetas
- `[x]` escribir los archivos SQL de la base de datos (01 a 06)
  - `[x]` `01_schema_inicial.sql`: tablas base de terceros, clientes, proveedores, usuarios, productos y configuración.
  - `[x]` `02_sistema_inventario_y_produccion.sql`: lotes, bodega stock, producción y validación PIN de merma.
  - `[x]` `03_ventas_y_facturacion.sql`: pedidos, detalles, y secuencias de autoconsecutivos.
  - `[x]` `04_caja_y_finanzas.sql`: transacciones caja y gastos de ruta.
  - `[x]` `05_politicas_rls_y_seguridad.sql`: políticas RLS y roles.
  - `[x]` `06_recursos_humanos.sql`: módulo de Recursos Humanos, gestión de empleados, hojas de vida y políticas RLS asociadas.
- `[x]` escribir el script de migración en TypeScript (`scripts/migrate_sheets_data.ts`)
  - `[x]` lectura de productos desde Google Sheet
  - `[x]` lectura de clientes desde Google Sheet
  - `[x]` normalización y desduplicación de terceros/clientes
  - `[x]` inserción masiva y relacional a PostgreSQL (Supabase)
- `[x]` verificar integridad y validar la inserción correcta de registros

- `[x]` **TAREA 2: Autorecuperación de Caché y Sync Logic (`src/App.tsx`)**
  - `[x]` **(Línea ~791)** Actualizar la declaración del estado: `useState<Record<string, Record<string, number>>>`. Implementar la función cargadora dentro del `useState` para que valide si `localDb.load('stock')` es un array anidado y en caso afirmativo lo reduzca a objeto.
  - `[x]` **(Línea ~988)** Actualizar el `useEffect` que sincroniza el catálogo de productos contra el `stock`. Debe dejar de inicializar bodegas vacías como `[]` (usar `{}`) y de leer `newStock[bodega].map`.

## FASE 2: Interfaz de Usuario y Vistas (Consumidores)

- `[x]` **TAREA 3: Orquestador POS (`src/views/POSView.tsx`)**
  - `[x]` Actualizar `props.stock` a `Record<string, Record<string, number>>`.
  - `[x]` **(Línea ~518)** Actualizar helper `getProductStock` para lectura directa.
  - `[x]` **(Línea ~585 y ~921)** Modificar la lógica temporal que descuenta stock (RN-01). Eliminar `.map()` y usar asignaciones seguras `newStock['Bodega Principal'] = { ...newStock['Bodega Principal'], [sku]: qty }`.
  - `[x]` Eliminar `.find()` en la generación de advertencias y estados lógicos del modal de cierre.

- `[x]` **TAREA 4: Orquestador Pricing (`src/views/PricingView.tsx`)**
  - `[x]` Actualizar estado y callbacks de `stock` recibidos por prop.
  - `[x]` **(Línea ~609)** Modificar la iteración `.map()` usada durante la aprobación de cotizaciones. Convertirla a mutaciones puntuales mediante iteración directa de los ítems de la cotización contra el diccionario de stock.
- `[x]` **Tarea 5:** `src/dev/seeds/seedPOS.ts` - Actualizar estructura de los datos semilla de stock para que utilicen objetos literales por SKU.
- `[x]` **Tarea 6:** `tests/e2e/pos.spec.ts` - Refactorizar el formato inyectado `pezcaderia_stock` y aserciones dependientes para garantizar coherencia en tests E2E.
- `[ ]` **Tarea 7:** Ejecutar `npx playwright test tests/e2e/pos.spec.ts` para validar que todas las aserciones, incluyendo RN-01, pasen.
