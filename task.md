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
