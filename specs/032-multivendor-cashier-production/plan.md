# Plan de Implementación Técnica: /speckit.plan (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.plan (SDD v3.0)  
**Ticket:** MULTIVENDOR-CASHIER-PROD-20261030  
**Título:** Arquitectura Multivendedor (Caja Única), Despliegue a Producción y Portal SuperAdmin Maestro  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-27  

---

## 1. Arquitectura Técnica de la Solución (El "Cómo")

### 1.1. Estructura Modular
```
src/
├── services/
│   ├── multiVendorCashService.ts         # [Existente] Orquestador de Concurrencia y Locks
│   ├── superAdminService.ts              # [Nuevo] Servicio de Gestión Multi-Empresa / Multi-Tenant
│   └── bulkHardwareImportService.ts      # [Nuevo] Importador Masivo de Ferretería/FerreOn
├── views/
│   ├── pos/
│   │   ├── POSView.tsx                   # [Adaptar] Modo Preventa / Comanda para Terminales 01..08
│   │   └── components/
│   │       ├── SupervisorPinModal.tsx    # [Nuevo] Modal Táctil de PIN de Autorización
│   │       └── PendingOrdersDrawer.tsx   # [Nuevo] Cajón de Comandas Centralizadas para Cobro
│   ├── admin/
│   │   └── SuperAdminMasterView.tsx      # [Nuevo] Portal Maestro /superadmin
│   └── inventory/
│       └── BulkHardwareImportModal.tsx   # [Nuevo] Modal de Carga Masiva CSV/Excel Ferretería
└── tests/
    ├── multiVendorCashConcurrency.test.ts # [Existente] 5 tests pasando
    ├── supervisorPinAuth.test.tsx        # [Nuevo] Tests de PIN de Supervisor
    ├── superAdminMasterView.test.tsx     # [Nuevo] Tests de Portal SuperAdmin
    └── bulkHardwareImport.test.ts        # [Nuevo] Tests de Importación Masiva Ferretería
```

---

## 2. Cronograma de Hitos Previos al 30 de Octubre de 2026

| Hito | Módulo | Fecha Límite | Entregable / Criterio de Éxito |
| :--- | :--- | :--- | :--- |
| **HITO 1** | **Arquitectura Multivendedor & Caja Única** | 2026-10-27 (Hoy) | Preventas concurrentes desde 8 terminales (`TERM-01` a `TERM-08`) y cobro centralizado en caja única. |
| **HITO 2** | **Trazabilidad & PIN de Supervisor** | 2026-10-28 | `SupervisorPinModal.tsx` integrado en POS; registro de `vendedor_id` y auditoría de descuentos. |
| **HITO 3** | **Portal SuperAdmin Maestro (`/superadmin`)** | 2026-10-29 | Panel de control global para crear empresas, configurar rubro (Pescadería / Ferretería) y gestionar usuarios. |
| **HITO 4** | **Carga Masiva de Ferretería & Deploy Prod** | 2026-10-30 | Importador CSV/Excel validado con Vitest + Despliegue en Vercel & Supabase Cloud con variables de prod. |
