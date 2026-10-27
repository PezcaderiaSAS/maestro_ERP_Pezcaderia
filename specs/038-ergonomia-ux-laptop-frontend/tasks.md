# Tareas de Implementación — SPEC-038
**Optimización Ergonómica y Leyes de UX en Frontend para Pantallas de Laptop (1366×768 / 1080p)**
**Regla:** Límite estricto `WIP = 1`. Ejecutar una sola tarea a la vez con TDD.

---

### Fase 1: Shell Global Híbrido y Layout Ergonómico (Completada ✅)
- [x] **`TASK-038-01`**: Implementar suite de pruebas TDD para el Shell Híbrido en `src/tests/globalLayoutV8.test.tsx` (verificar clases `overflow-hidden` vs `overflow-y-auto` según `currentView`, paddings compactos y ausencia de doble scroll).
- [x] **`TASK-038-02`**: Implementar `TRANSACTIONAL_FIXED_VIEWS` en `src/App.tsx`, adaptar el contenedor `<main>` para renderizado híbrido condicional y compactar márgenes de `EnterpriseTopbar.tsx` a `mt-1.5 mb-1`.
- [x] **`TASK-038-03`**: Validación en vivo con Chrome DevTools en `1366×768` (0 errores en consola JS, comprobación de ausencia de scroll de ventana en POS y Dashboard).

---

### Fase 2: Rediseño Ergonómico de POS y Mostrador (Completada ✅)
- [x] **`TASK-038-04`**: Pruebas TDD para componentes compactos de `POSView.tsx` (subheader de métricas, visibilidad de catálogo en 1366×768).
- [x] **`TASK-038-05`**: Refactorizar métricas de turno a barra compacta de 36px y anclar dock de carrito y cobro inferior en `POSView.tsx` y `ProductSearchPanel.tsx`.

---

### Fase 3: Unificación Dark Glassmorphism V8 de Módulos Huérfanos (Completada ✅)
- [x] **`TASK-038-06`**: Migrar `CashFlowView.tsx` (Gestión de Cajas) a Dark Glassmorphism V8 (`bg-[#070A10]`, `border-white/10`).
- [x] **`TASK-038-07`**: Migrar `B2BExternalSalesView.tsx` y `ColdStorageRentalView.tsx` a Dark Glassmorphism V8.

---

### Fase 4: Optimización Kanban y Alistamiento WMS (Completada ✅)
- [x] **`TASK-038-08`**: Ajustar altura y scroll independiente de columnas en `OrderKanbanView.tsx` y `CashierKanbanView.tsx`.
