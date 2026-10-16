# Desglose Atómico de Tareas: SPEC-020

**Código:** SPEC-020  
**Título:** Sistema Maestro de Resoluciones de Ventas, Consecutivo Dual y Facturación Electrónica DIAN para SIIGO Nube API V2  
**Estado:** COMPLETADO (100% Verificado — 12/12 Tests Verdes, 0 Errores TSC)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.implement`  
**Regla de Ejecución:** Límite Kanban WIP = 1 estricto. Una sola tarea activa a la vez.

---

## Tablero Kanban de Implementación

### Tarea 1: Contratos de Tipos TypeScript y Store Transaccional
- [x] **TASK-020-01:** Crear `src/types/resoluciones.types.ts` y `src/store/useResolucionStore.ts`:
  - Definición de tipos `ResolucionVenta`, `FacturaElectronicaRegistro`, `SiigoQueueItem`.
  - Store Zustand con persistencia en `localStorage`/IndexedDB.
  - Resoluciones iniciales predeterminadas: Control Interno (`VTA-`) y Resolución DIAN (`FEVP-`) con soporte de último consecutivo de Siigo.
- **Criterio de Aceptación:** Tipos exportados y store con métodos CRUD básicos.

---

### Tarea 2: Servicio de Resoluciones y Suite TDD Consecutivo Dual
- [x] **TASK-020-02:** Implementar `src/services/resolucionService.ts` y suite TDD `src/tests/resolucionesConsecutivoDual.test.ts`:
  - Función atómica `consumirSiguienteConsecutivo` para números internos y fiscales.
  - Detección de alertas de rango (< 100 números) y vigencia (< 30 días).
  - Sincronización del punto de partida con el consecutivo que ya lleva Siigo Nube.
- **Criterio de Aceptación:** Suite TDD con 100% de pruebas pasando en rojo (RED) y luego verde (GREEN).

---

### Tarea 3: Mapeador SIIGO Nube API v2 y Exportador CSV Contable
- [x] **TASK-020-03:** Implementar `src/services/siigoPayloadMapper.ts`, `src/services/siigoExportService.ts` y suite `src/tests/siigoPayloadAndExport.test.ts`:
  - Construcción del JSON oficial para Siigo Nube (`document.id`, `customer`, `items`, `payments`, `send_dian: true`).
  - Generación de archivo CSV compatible con la plantilla contable de importación de comprobantes de Siigo.
- **Criterio de Aceptación:** Payloads validados contra esquema oficial y archivo CSV descargable.

---

### Tarea 4: Módulo de Configuración de Resoluciones (UI/UX)
- [x] **TASK-020-04:** Crear `src/views/settings/ResolucionesConfigView.tsx`:
  - Listado de resoluciones con barra de progreso de consumo de rango y semáforo de vigencia.
  - Modal para crear y editar resoluciones: prefijo, resolución DIAN, rango, vigencia y último consecutivo de Siigo.
  - Light Mode WCAG 2.2 AA+ con cero imágenes externas (100% Lucide React).
- **Criterio de Aceptación:** Interfaz accesible y fluida para la administración de numeraciones.

---

### Tarea 5: Switch Táctil en Checkout POS y Predeterminación
- [x] **TASK-020-05:** Implementar `PosElectronicInvoiceToggle.tsx` e integrarlo en `PaymentPanel.tsx` y `POSView.tsx`:
  - Botón táctil ergonómico ($\ge 48\text{ px}$) con feedback visual.
  - Lógica de triple nivel: sucursal por defecto, cliente B2B que exige factura electrónica, o selección manual en el checkout.
  - Emisión de ticket térmico con Consecutivo Interno y Consecutivo Fiscal DIAN.
- **Criterio de Aceptación:** Venta en POS emite ambos números en < 500 ms y encola en Outbox.

---

### Tarea 6: Modal Táctil de Post-Facturación en 1 Toque
- [x] **TASK-020-06:** Implementar `QuickConvertToElectronicInvoiceModal.tsx` en el historial de ventas:
  - Botón "Convertir a Factura Electrónica" en ventas registradas previamente como ticket interno.
  - Captura o verificación rápida de NIT, Razón Social, Correo y Municipio DANE del cliente.
  - Asignación del consecutivo fiscal correlativo y encolado a Siigo sin duplicar inventario ni dinero en caja.
- **Criterio de Aceptación:** Conversión exitosa sin duplicidad contable ni física.

---

### Tarea 7: Monitor Outbox SIIGO, Suite Integral E2E y Quality Gate
- [x] **TASK-020-07:** Implementar `SiigoQueueMonitorModal.tsx` y suite integral `src/tests/posElectronicInvoicingFlow.test.tsx`:
  - Visor de estados de sincronización: `PENDIENTE`, `SINCRONIZADO`, `ERROR_REINTENTO`.
  - Botón de reintento de envío con 1 clic y botón de exportación CSV contable.
  - Validación con Chrome DevTools (0 errores en consola JS y renderizado móvil de 375 px).
  - Verificación `tsc --noEmit` en 0 errores.
- **Criterio de Aceptación:** 100% de pruebas pasando, 0 errores de compilación y certificación final.
