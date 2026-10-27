# Desglose de Tareas de Implementación: /speckit.tasks (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.tasks (SDD v3.0)  
**Ticket:** MULTIVENDOR-CASHIER-PROD-20261030  
**Título:** Arquitectura Multivendedor (Caja Única), Despliegue a Producción y Portal SuperAdmin Maestro  
**Estado:** COMPLETADO_LISTO_PARA_PRODUCCION ✅  
**Fecha:** 2026-10-27  
**Límite Kanban:** `WIP = 1` (Todas las 5 tareas completadas)  

---

## 1. Matriz de Tareas Secuenciales (Flujo TDD Estricto)

```
[TASK-032-01: TDD Cola Central de Preventas] ──► [TASK-032-02: Modal PIN Supervisor] ──► [TASK-032-03: Portal /superadmin Master] ──► [TASK-032-04: Carga Masiva Ferretería] ──► [TASK-032-05: Checklist Prod Vercel+Supabase]
```

---

### [x] TASK-032-01: Integración de Cola Central de Preventas en POS (Fase RED/GREEN) - COMPLETADO ✅
- **Objetivo:** Conectar las 8 terminales al modo "Emitir Preventa / Comanda" y dotar a la Caja Central del cajón `PendingOrdersDrawer.tsx` para llamar comanda y liquidar en un clic.
- **Archivos:** `src/views/POSView.tsx`, `src/views/pos/components/PendingOrdersDrawer.tsx`, `src/tests/pendingOrdersDrawer.test.tsx`.
- **Criterio de Aceptación:** Prueba de concurrencia pasando (20/20 tests en verde), 0 errores TypeScript (`tsc --noEmit`), bucle Chrome DevTools interactivo y vista móvil 375 px verificados.

---

### [x] TASK-032-02: Modal Táctil de Autorización con PIN de Supervisor (Fase RED/GREEN) - COMPLETADO ✅
- **Objetivo:** Crear `src/views/pos/components/SupervisorPinModal.tsx` para autorizar descuentos y anulaciones en terminales de vendedores.
- **Archivos:** `src/views/pos/components/SupervisorPinModal.tsx`, `src/tests/supervisorPinAuth.test.tsx`, `src/views/POSView.tsx`.
- **Criterio de Aceptación:** Suite de pruebas en verde (23/23 tests pasando), validación TypeScript (`tsc --noEmit` 0 errores), ergonomía táctil en pantalla táctil y auditoría de eventos de autorización verificado.

---

### [x] TASK-032-03: Portal Maestro SuperAdmin `/superadmin` (Fase RED/GREEN) - COMPLETADO ✅
- **Objetivo:** Implementar la vista desacoplada `SuperAdminMasterView.tsx` protegida por credenciales maestras, permitiendo listar empresas, cambiar de tenant y crear administradores.
- **Archivos:** `src/views/admin/SuperAdminMasterView.tsx`, `src/services/superAdminService.ts`, `src/routes/AppRoute.ts`, `src/App.tsx`, `src/components/layout/EnterpriseSidebar.tsx`, `src/tests/superAdminIntegration.test.tsx`.
- **Criterio de Aceptación:** CRUD de empresas y switch de tenant en vivo validado, 8/8 tests pasando, ruta `#superadmin` funcional y 0 errores en consola JS y móvil 375 px.

---

### [x] TASK-032-04: Módulo de Carga Masiva de Ítems de Ferretería (Fase RED/GREEN) - COMPLETADO ✅
- **Objetivo:** Crear `BulkHardwareImportModal.tsx` con soporte para SKU, pasillo, marca, unidad y cálculo de precios mayorista/detal.
- **Archivos:** `src/services/bulkHardwareImportService.ts`, `src/views/inventory/BulkHardwareImportModal.tsx`, `src/views/InventoryView.tsx`, `src/tests/bulkHardwareImport.test.ts`, `src/tests/bulkHardwareImportModal.test.tsx`.
- **Criterio de Aceptación:** Importación exitosa de archivos CSV/JSON con separadores `;` y `,`, limpieza de moneda colombiana `$`, validación en tiempo real, 7/7 tests en verde, 0 errores en TypeScript y verificación en Chrome DevTools interactiva (375 px).

---

### [x] TASK-032-05: Auditoría Pre-Despliegue a Producción (Vercel & Supabase Cloud) - COMPLETADO ✅
- **Objetivo:** Ejecutar Quality Gate estricto: `tsc --noEmit`, suite completa Vitest (100% pasando), auditoría SOLID, verificación de variables en Vercel/Supabase y bucle Chrome DevTools.
- **Resultados de Certificación:**
  1. `tsc --noEmit`: 0 errores (código de salida 0).
  2. Vitest SPEC-032 & Concurrencia: 57/57 tests en verde al 100%.
  3. Vite Production Build (`npm run build`): Compilación exitosa en 52.56s generando paquete optimizado en `dist/`.
  4. GitNexus Blast Radius: Riesgo `low`, 0 procesos afectados, 3 símbolos modificados.
  5. Chrome DevTools MCP: 0 errores no controlados en consola JS y renderizado móvil responsivo verificado en 375 px.
