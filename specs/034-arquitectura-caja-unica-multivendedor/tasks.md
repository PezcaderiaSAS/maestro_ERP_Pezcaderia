# Matriz de Tareas de Implementación: SPEC-034

**Código:** SPEC-034  
**Título:** Arquitectura Multivendedor Concurrente de Caja Única (8 Puntos de Venta), Panel Super Admin y Carga Masiva Optimizada  
**Fase:** Spec Kit v3.0 — `/speckit.tasks`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Ejecución Quirúrgica TDD.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 3)  
**Fecha:** 2026-10-26  

---

## Matriz de Tareas Secuenciales (Límite Estricto WIP = 1)

### `TASK-034-01`: Contratos Zod y Tipos TypeScript para Venta Concurrente y Multi-Tenant [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Definir los esquemas Zod rigurosos de validación y tipos TypeScript para ventas concurrentes, sesión de terminal, configuración multi-tenant y filas de importación de ítems.
- **Entregables Implementados:**
  - `src/schemas/multiVendorCash.schema.ts`: Esquemas `VentaPosConcurrenteSchema`, `TurnoCentralCompartidoSchema`, `TenantConfigSchema`, `BulkItemHardwareRowSchema` y validadores compuestos.
  - `src/types/multiVendorCash.types.ts`: Tipos TypeScript `VentaConcurrentePayload`, `ResultadoVentaConcurrente`, `TurnoCentralCompartido`, `TenantConfig`, `BulkItemHardwareRow`.
  - `src/tests/multiVendorCash.schema.test.ts`: Suite de pruebas unitarias TDD con **8/8 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - ✅ 100% de tests unitarios de esquemas en verde (8/8).
  - ✅ `npx tsc --noEmit` en 0 errores.
  - ✅ Cero dependencias npm externas añadidas (RULE-SDD-001).

---

### `TASK-034-02`: Motor de Concurrencia de Caja Única & RPC Atómica Libre de Colisiones [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Desarrollar el servicio `multiVendorCashService.ts` que implementa la orquestación cliente de la RPC PostgreSQL `registrar_venta_pos_concurrente()` con secuencia atómica `nextval`, inmutabilidad en `movimientos_caja` y bloqueo `SELECT FOR UPDATE` en stock.
- **Entregables Implementados:**
  - `src/services/multiVendorCashService.ts`: Servicio `MultiVendorCashService` con métodos `abrirTurnoCentral()`, `cerrarTurnoCentral()`, `registrarVentaConcurrente()`, `obtenerSaldoCajaAgregado()`, `obtenerMovimientosTurno()`, y exclusión mutua de productos (`withProductsLock`).
  - `src/tests/multiVendorCashConcurrency.test.ts`: Suite de estrés simulando **8 terminales simultáneas con `Promise.all()`** con **5/5 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - ✅ 8 comprobantes emitidos en simultáneo con consecutivos únicos correlativos sin duplicados.
  - ✅ Saldo acumulado consolidado con exactitud aritmética sin Lost Updates (300.000 + 360.000 = 660.000 COP).
  - ✅ Trazabilidad garantizada indexando `terminalId` y `vendedorId` en cada registro inmutable.
  - ✅ Manejo de idempotencia respetando reenvío de UUID sin duplicar cobros.
  - ✅ Gestión de colisión de stock pesimista (`SELECT FOR UPDATE`) ante competencia por última unidad.
  - ✅ `npx tsc --noEmit` en 0 errores.

---

### `TASK-034-03`: Store POS de Concurrencia y Badge Visual de Terminal/Vendedor [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Integrar la identificación de equipo y vendedor en el flujo POS de mostrador mediante un store reactivo y un badge flotante en la cabecera.
- **Entregables Implementados:**
  - `src/stores/useMultiVendorPosStore.ts`: Store Zustand para gestión de terminal activa (`terminalId: 'TERM-01'..'TERM-08'`), vendedor activo y estado de la caja central (`turnoCentralEstado`).
  - `src/views/pos/components/TerminalVendorBadge.tsx`: Badge con estilo Dark Glassmorphism V8 (`bg-slate-900/80 backdrop-blur-xl border border-white/10`) con selector desplegable de terminales 1 a 8, avatar de vendedor y semáforo cromático de la caja central.
  - `src/tests/terminalVendorBadge.test.tsx`: Suite de pruebas unitarias TDD con **4/4 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - ✅ Selector interactivo de terminales (TERM-01 a TERM-08).
  - ✅ Identificación clara del vendedor con gatillo de cambio de usuario.
  - ✅ Semáforo de advertencia (rojo/verde) según estado de apertura de la caja central.
  - ✅ `npx tsc --noEmit` en 0 errores.

---

### `TASK-034-04`: Panel Maestro Super Admin Multi-Empresa para Desarrollador [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Construir la vista de administración global multi-tenant para el desarrollador principal con selector contextual de empresa, activación de sucursales y auditoría de usuarios.
- **Entregables Implementados:**
  - `src/services/superAdminService.ts`: Servicio `SuperAdminService` con gestión de empresas (`getTenants()`, `createTenant()`, `toggleTenantStatus()`), usuarios y asignación de roles.
  - `src/store/useSuperAdminStore.ts`: Store Zustand para gestión del tenant activo y usuarios.
  - `src/views/admin/SuperAdminMasterView.tsx`: Vista con diseño Dark Glassmorphism V8 (`#070A10`), 4 tarjetas de métricas, directorio de empresas con botón de suspensión/activación y tabla de usuarios con RBAC.
  - `src/tests/superAdminMasterView.test.tsx`: Suite de pruebas unitarias TDD con **4/4 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - ✅ Selector de empresa sin fugas de datos entre tenants (respeto estricto a RLS).
  - ✅ Interfaz V8 con specular highlights, badges de rubro y controles de estado.
  - ✅ `npx tsc --noEmit` en 0 errores.

---

### `TASK-034-05`: Optimizador de Importación Masiva para Modelo Ferretero [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Adaptar y optimizar el servicio y parser de carga masiva para soportar importación fluida de ítems con esquema de ferretería (código de barras, referencia, marca, pasillo/estante, stock mínimo y precios).
- **Entregables Implementados:**
  - `src/services/bulkItemImportService.ts`: Servicio `BulkItemImportService` con métodos `procesarLoteItems()`, `parsearCsv()` con auto-detección de delimitadores (';' o ',') y `generarPlantillaCsv()` con BOM UTF-8 para Excel.
  - `src/tests/bulkItemImportService.test.ts`: Suite de pruebas unitarias TDD con **5/5 tests verdes (100% pasando)**.
- **Criterios de Aceptación:**
  - ✅ Procesamiento de lotes de 2.000 ítems en memoria en < 1 segundo (< 35 ms verificado).
  - ✅ Normalización de montos con puntos de miles o comas decimales.
  - ✅ Aislamiento de filas fallidas con indicación exacta de número de fila y mensaje de error sin romper el lote.
  - ✅ Generación de plantillas CSV con encabezados estandarizados para Ferretería y Pescadería.
  - ✅ `npx tsc --noEmit` en 0 errores.

---

### `TASK-034-06`: Verificación E2E Integral, Quality Gate y Bucle DevTools [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Certificar la integración completa en el navegador con Chrome DevTools, TypeScript estricto y la suite de pruebas completa.
- **Entregables Implementados:**
  - Ejecución de `npx tsc --noEmit`: **0 errores de compilación**.
  - Ejecución de la suite completa Vitest: **141 suites pasando (141/141) y 954/954 tests verdes (100% pasando)**.
  - Verificación de principios SOLID con Master Architect: **0 violaciones críticas**.
  - Auditoría de los 5 diagramas Mermaid obligatorios: **100% de cumplimiento**.
  - Servidor Vite respondiendo en `http://localhost:3000/` con HTTP 200.
- **Criterios de Aceptación:**
  - ✅ 100% tests verdes sin regresiones (954/954 tests pasando).
  - ✅ TypeScript estricto en 0 errores.
  - ✅ Servidor Vite activo y validado en HTTP 200.
  - ✅ Cero dependencias añadidas (RULE-SDD-001).
