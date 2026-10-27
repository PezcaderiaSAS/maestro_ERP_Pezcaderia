# Plan de Implementación Técnica — SPEC-038
**Optimización Ergonómica y Leyes de UX en Frontend para Pantallas de Laptop (1366×768 / 1080p)**

---

## 1. Arquitectura Técnica de la Fase 1 (Shell Global Híbrido)

### Principio de Diseño
Eliminar el scroll vertical exterior que corta tarjetas y elementos en pantallas de 1366×768 mediante un Shell Híbrido en `App.tsx` que clasifica declarativamente las vistas activas:
- **Vistas Transaccionales:** `TRANSACTIONAL_FIXED_VIEWS = ['pos', 'order-kanban', 'dashboard', 'cash-flow', 'alistamiento', 'dispatch']`.
  - Contenedor: `h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] overflow-hidden flex flex-col`.
  - Paddings: `px-2.5 pb-2 pt-0` para laptops.
  - Comportamiento: Cabeceras y docks de control siempre fijos en el viewport; las tablas o catálogos internos encapsulan su propio scroll con `overflow-y-auto`.
- **Vistas Documentales y Administrativas:** `['clients', 'suppliers', 'payroll', 'pricing', 'ar', 'hr', 'crm', 'accounting']`.
  - Contenedor: `min-h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] overflow-y-auto flex flex-col`.

---

## 2. Desglose de Fases (Flujo Continuo WIP = 1)

1. **Fase 1: Shell Global Híbrido y Layout Ergonómico en `App.tsx` (Activa)**
   - Declarar `TRANSACTIONAL_FIXED_VIEWS` en `App.tsx`.
   - Aplicar el contenedor híbrido y normalizar padding en laptop.
   - Ajustar márgenes compactos del Topbar (`mt-1.5 mb-1 mx-2.5`).
   - Prueba TDD en `src/tests/globalLayoutV8.test.tsx`.
2. **Fase 2: Rediseño Ergonómico de POS y Mostrador (`POSView.tsx`)**
   - Reducir las métricas de turno a un subheader de 32px.
   - Mostrar 3 filas completas de productos sin scroll en 1366×768.
   - Anclar dock de cobro inferior fijo.
3. **Fase 3: Unificación Dark Glassmorphism V8 de Módulos Huérfanos**
   - Migrar `B2BExternalSalesView`, `ColdStorageRentalView` y `CashFlowView` a Dark Mode V8.
4. **Fase 4: Optimización de Columnas Kanban y Alistamiento (`OrderKanbanView.tsx`)**
   - Altura dinámica con scroll interno por estación.
