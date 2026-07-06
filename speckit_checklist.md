# Speckit Checklist: Requisitos y Calidad

Con base en tus respuestas a las preguntas de aclaración (A, B, C, D, E), he generado esta lista de verificación (`/speckit.checklist`) para asegurar que no queden brechas arquitectónicas o de negocio antes de planificar la implementación (`speckit.plan`).

## 1. Módulo Contable (Partida Doble + UI Simple)
- [ ] **Estructura DB (Supabase):** Existe un catálogo de cuentas (`accounts`) y una tabla de asientos (`ledger_entries`) que valida que `sum(debits) = sum(credits)`.
- [ ] **UX "A Prueba de Tontos":** En el frontend, el usuario solo selecciona "Pago de Arriendo" (Categoría). Por debajo, el sistema mapea automáticamente: *Débito a Gasto Arriendo*, *Crédito a Caja/Banco*.
- [ ] **Integridad:** Validar que los asientos automáticos no puedan ser eliminados manualmente sin dejar rastro (anulación reversible).

## 2. Flujo de Caja y Cierre de Turno
- [ ] **Automatización del Cierre:** Al presionar "Cerrar Turno", el descuadre (Faltante o Sobrante) genera automáticamente una entrada en `ledger_entries` contra la cuenta de "Diferencias de Caja".
- [ ] **Trazabilidad:** El asiento contable debe tener un `reference_id` apuntando al ID del turno de caja cerrado (`cash_shifts`).

## 3. Inventario ABC (Cron Job a 15 días)
- [ ] **Postgres / Supabase Cron:** Crear una función RPC en Supabase llamada `calculate_abc_inventory()` ejecutada vía `pg_cron` a medianoche.
- [ ] **Lógica Pareto:** La función debe calcular el volumen de ventas de los **últimos 15 días**, ordenar descendentemente y asignar 'A' al top 80% del valor, 'B' al 15% y 'C' al 5%.
- [ ] **Frontend:** `InventoryView.tsx` solo lee la etiqueta calculada (A, B o C), garantizando 0 impacto en el rendimiento al abrir la vista.

## 4. Despachos y Logística (Filtro por Sucursal)
- [ ] **Row Level Security (RLS):** Las políticas en Supabase para las órdenes deben tener una condición `auth.uid()` o el ID de la sucursal asignada al empleado, garantizando que el *Realtime* no envíe datos de otras sucursales.
- [ ] **Despachos Parciales:** El modelo de datos (`order_items`) debe soportar los campos `requested_quantity` y `fulfilled_quantity`. Si se despacha parcial, el sistema debe preguntar si el resto queda en *Backorder* (Pendiente) o si se cancela la diferencia.

---

## User Review Required

> [!IMPORTANT]
> **Aprobación de la Checklist:**
> Revisa estos puntos de verificación. Si consideras que el estándar de calidad y los casos de uso están cubiertos, dímelo y procederé con **`/speckit.plan`** para diseñar el paso a paso detallado de la arquitectura de base de datos y componentes de React. (Recuerda que no generaré código fuente hasta que el plan técnico esté aprobado).
