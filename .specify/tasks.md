# Verificación Científica, Financiera, Contable y Logística (POS & B2B)

## [x] 📋 Tarea 1: Verificación Científica (Mermas y Pareto 80/20)
- **Archivo Destino:** `src/services/scientificAnalytics.ts` (Nuevo)
- **Estado:** Completado
- **Acciones:**
  - Implementar lógica en tiempo real para reclasificar productos (ABC) basada en volumen de ventas y rentabilidad.
  - Crear motor matemático determinista para recálculo de Costo Promedio Ponderado por impacto de mermas de Cuarto Frío en cada `DISPATCHED`.

## [x] 📋 Tarea 2: Verificación Logística Offline (Sync & Reject)
- **Archivo Destino:** `src/services/offlineSyncService.ts` (Nuevo) o en store
- **Estado:** Completado
- **Acciones:**
  - Implementar lógica de validación de `PRE_ORDEN` asíncrona.
  - Rechazar orden automáticamente si el precio cambió drásticamente o el cupo de crédito se superó entre el modo offline y la sincronización, obligando al vendedor a renegociar.

## [x] 📋 Tarea 3: Verificación Financiera y Contable (Facturación Dinámica)
- **Archivo Destino:** `src/services/billingService.ts` (Nuevo)
- **Estado:** Completado
- **Acciones:**
  - Implementar lógica de validación `ENTREGADO_CON_ACEPTACION`.
  - Asegurar que la Factura (Documento Fiscal) se genere ÚNICAMENTE sobre las cantidades reales aceptadas por el cliente final, tratando la orden original como remisión proforma.
  - Crear pruebas unitarias con Vitest para validar los cálculos.

## [x] 📋 Tarea 4: Integración UI/UX (Verificación Visual)
- **Archivo Destino:** `src/views/pos/ScientificDashboard.tsx` (Nuevo) y `B2BOrderManager.tsx`
- **Estado:** Completado
- **Acciones:**
  - Mostrar alertas visuales sobre órdenes rechazadas por validación Offline.
  - Implementar interfaz visual para que el conductor o cliente pueda realizar rechazos parciales (aceptación parcial) antes de la facturación.
  - Aplicar el sistema de diseño Rico UI / Dark Glassmorphism.

## [x] 📋 Tarea 5: Carga Masiva de Datos (CSV/Excel)
- **Archivo Destino:** `src/components/BulkUploadModal.tsx` (Nuevo) y utilidades en `src/services/bulkUploadService.ts`
- **Estado:** Completado
- **Acciones:**
  - Implementar parser para importar masivamente Clientes y Productos.
  - Validar y tipar estrictamente los datos importados antes de insertarlos al store/DB.
  - Generar retroalimentación visual (progreso y errores) al usuario.
