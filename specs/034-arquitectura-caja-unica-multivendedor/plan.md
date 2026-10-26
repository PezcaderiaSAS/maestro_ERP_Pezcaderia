# Plan de Implementación Técnica (Technical Plan): SPEC-034

**Código:** SPEC-034  
**Título:** Arquitectura Multivendedor Concurrente de Caja Única (8 Puntos de Venta), Panel Super Admin y Carga Masiva Optimizada  
**Fase:** Spec Kit SDD v3.0 — `/speckit.plan`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Arquitectura Data-Driven.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 2)  
**Fecha:** 2026-10-26  

---

## 1. Resumen Ejecutivo y Decisiones Arquitectónicas

Con base en la especificación [spec.md](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/specs/034-arquitectura-caja-unica-multivendedor/spec.md), las recomendaciones del `SoftwareArchitect` y `DataEngineer` de Agency Swarm y la validación de Google Harness², se establecen las siguientes decisiones arquitectónicas:

1. **Desacoplamiento de Turno y Terminal:**
   - La caja física opera con un único `TurnoCaja` activo central (`estado = 'ABIERTO'`).
   - Las 8 terminales POS no abren ni cierran turnos individuales; consumen el `turno_caja_id` compartido de la sucursal y firman cada transacción con `terminal_id` (del 1 al 8) y `vendedor_id`.

2. **Atomicidad Transaccional y Cero Lost Updates en Caja:**
   - Toda venta concurrente se despacha mediante la función RPC PostgreSQL `registrar_venta_pos_concurrente()`.
   - Se elimina la actualización destructiva de un campo acumulativo de saldo. Cada cobro genera un registro inmutable en `movimientos_caja` (`INGRESO_VENTA`).
   - El saldo se calcula como una proyección `SUM(monto)` filtrado por el `turno_id` activo.

3. **Generación de Consecutivos Libres de Colisión:**
   - La secuencia nativa `nextval('seq_pos_factura')` garantiza numeración correlativa estricta incluso si dos o más terminales finalizan el cobro en el mismo milisegundo.

4. **Bloqueo Pesimista Focalizado en Stock:**
   - Se aplica `SELECT FOR UPDATE` sobre las filas de inventario comprometidas por la venta, asegurando que si dos terminales compiten por la última unidad disponible, una obtenga la confirmación y la otra reciba error amigable de conflicto (HTTP 409).

5. **Panel Maestro Super Admin:**
   - Módulo exclusivo para desarrollador (`AppRouteId.SUPER_ADMIN = 'super_admin'`) con selector de tenant, monitor de terminales activas, auditoría de usuarios y control global de empresas.

6. **Carga Masiva Optimizada:**
   - Servicio de importación por lotes (`bulkItemImportService.ts`) con soporte para esquemas industriales/ferretería (SKU, código de barras, marca, ubicación de pasillo/estante, stock mínimo y lista de precios).

7. **Gobernanza de Dependencias (RULE-SDD-001):**
   - 0 dependencias npm externas añadidas (preservación de las dependencias oficiales actuales).

---

## 2. Mapa de Archivos y Responsabilidades (Límites de Capas)

```
src/schemas/
└── multiVendorCash.schema.ts         # Contratos Zod: VentaConcurrente, SuperAdmin, BulkUpload

src/types/
└── multiVendorCash.types.ts          # Interfaces TypeScript: Payloads, Concurrencia, Tenants

src/services/
├── multiVendorCashService.ts         # Orquestador cliente de concurrencia y RPC atómica
├── superAdminService.ts              # Gestión y auditoría multi-tenant para el desarrollador
└── bulkItemImportService.ts          # Parser y validador de importación masiva por lotes

src/stores/
├── useMultiVendorPosStore.ts         # Estado de terminal (terminalId, vendedorActivo)
└── useSuperAdminStore.ts             # Estado de gestión global de empresas y usuarios

src/views/admin/
├── SuperAdminMasterView.tsx          # Panel de control maestro Super Admin (Dark Glassmorphism V8)
└── components/
    ├── TenantSelectorDropdown.tsx    # Selector contextual de empresa activa
    ├── TenantMetricsSummary.tsx      # Métricas globales de ventas y usuarios por empresa
    └── UserTenantAccessTable.tsx     # Tabla de auditoría de usuarios, roles y permisos

src/views/pos/components/
└── TerminalVendorBadge.tsx           # Indicador visual en el POS: Terminal # y Vendedor activo

src/components/inventory/
└── BulkUploadModal.tsx               # Modal de carga masiva optimizado para esquema ferretero

src/tests/
├── multiVendorCash.schema.test.ts    # Tests unitarios para contratos de validación Zod
├── multiVendorCashConcurrency.test.ts# Suite de estrés con 8 terminales simultáneas concurrentes
├── superAdminService.test.ts         # Pruebas de gestión multi-tenant y aislamiento RLS
└── bulkItemImportService.test.ts     # Pruebas de parsing y validación de catálogo ferretero
```

---

## 3. Plan de Pruebas Automatizadas (TDD)

1. **RED:** Escribir primero las pruebas que definan el comportamiento esperado de concurrencia de 8 terminales:
   - `multiVendorCashConcurrency.test.ts`: Simular `Promise.all()` con 8 terminales enviando ventas de $10.000 a $80.000 contra el mismo `turnoId`.
   - Verificar que se generen 8 números de comprobante correlativos consecutivos sin duplicados.
   - Verificar que el total de la caja aumente exactamente en la suma de los 8 montos.
   - Verificar que cada venta quede indexada con su respectivo `terminalId` y `vendedorId`.
2. **GREEN:** Implementar los contratos Zod, tipos, servicios y stores correspondientes.
3. **REFACTOR:** Optimizar tiempos de respuesta (< 50 ms por venta en memoria / mock RPC) y verificar cumplimiento de límites de líneas (< 600 líneas por archivo) y principios SOLID.
4. **DevTools Loop:** Validación en vivo en `http://localhost:3000/` con consola JS en 0 errores.
