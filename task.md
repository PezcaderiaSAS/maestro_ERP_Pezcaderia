# Speckit Tasks: Tareas de Ejecución

Esta es la lista granular y secuencial de tareas basadas en la arquitectura propuesta y ajustadas tras el reporte de consistencia (Control de Calidad 2). Cada tarea representa un paso accionable.

## Fase 0: Correcciones Bloqueadoras (Core)
- [x] 0.1 Modificar `src/types/orders.types.ts`, `src/types/cash.types.ts` para agregar `branch_id: string` a los tipos `Pedido`, `TurnoCaja` y `MovimientoCaja`.
- [x] 0.2 Verificar/crear `src/lib/supabaseClient.ts` y definir estrategia de persistencia (integración de Supabase en stores de Zustand).

## Fase 1: Infraestructura Base de Datos (Supabase)
- [x] 1.1 Crear script SQL para tablas contables (`accounts`, `ledger_entries`) con llaves foráneas y constraint/trigger de validación de partida doble (`SUM(debit) = SUM(credit)`).
- [x] 1.2 Crear script SQL para modificar esquema logístico (`order_items`) añadiendo `requested_quantity`, `fulfilled_quantity` y `status`.
- [x] 1.3 Crear script SQL de función RPC (`calculate_abc_inventory`) y configuración de `pg_cron`.
- [x] 1.4 Crear script SQL para políticas de seguridad (RLS) en `orders` que filtren por `branch_id`.
- [x] 1.5 Crear script SQL de datos iniciales (Seed Data) para el catálogo de cuentas (PUC básico colombiano: 1105 Caja, 4135 Ventas, etc.).
- [x] 1.6 Aplicar los scripts en la base de datos (Entregarlos al usuario para su ejecución en el Dashboard de Supabase).

## Fase 2: Core Contable y Cierre de Caja
- [x] 2.1 Crear `src/types/accounting.ts` definiendo las interfaces `Account` y `LedgerEntry`.
- [x] 2.2 Implementar `src/services/accountingService.ts` con la función `recordCategorizedTransaction` (mapeo "a prueba de tontos" a partida doble).
- [x] 2.3 Crear `src/store/useAccountingStore.ts` para manejar consultas resumidas (Ingresos vs Egresos).
- [x] 2.4 Modificar `src/services/cashService.ts` para que la función de "Cierre de Turno" llame automáticamente a `accountingService`.
- [x] 2.5 Implementar validación o soft-delete en el backend (vía RLS o función) para evitar eliminación manual de asientos contables.

## Fase 3: Logística Realtime y Despachos Parciales
- [x] 3.1 Actualizar `src/types/orders.types.ts` para reflejar los nuevos campos de despachos parciales (si falta alguno en el cliente).
- [x] 3.2 Modificar `src/store/useOrderStore.ts` para suscribirse a `supabase.channel('orders')` y mantener el Kanban sincronizado en tiempo real.
- [x] 3.3 Refactorizar `src/views/OrderKanbanView.tsx` para consumir el estado en tiempo real.
- [x] 3.4 Actualizar `src/views/inventory/AlistamientoBodegaView.tsx` para permitir seleccionar cantidades parciales a despachar (Fulfill parcial) o generar backorders.

## Fase 4: Interfaces (UI) e Inventario ABC
- [ ] 4.1 Crear `src/views/AccountingView.tsx` (UI del Libro Mayor simplificado) usando los componentes atómicos (`Button`, `Input`, `Table`).
- [ ] 4.2 Actualizar `src/App.tsx` para incluir las nuevas rutas (`AccountingView`, `DispatchView`).
- [ ] 4.3 Modificar `src/views/InventoryView.tsx` para leer la columna `categoriaABC` existente, aplicar badges de colores (Rojo/Amarillo/Verde) y programar alertas `SweetAlert2` para bajo stock en productos 'A'.
- [ ] 4.4 Crear `src/views/DispatchView.tsx` (Módulo de Despachos y Rutas) para completar el ecosistema logístico.

---
*Nota: Las tareas se marcarán como `[/]` (en progreso) y `[x]` (completadas) a medida que avancemos.*
