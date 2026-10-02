# PRD: Dashboard Interactivo de Obligaciones Financieras (Calendario)

**Estado:** Planeación Estratégica (Spec Kit)
**Fecha:** 2026-10-02
**Módulo:** Dashboard Principal (`src/views/DashboardView.tsx`)

## 1. Objetivo del Producto (Task)
Construir un módulo de Dashboard gerencial enfocado en el flujo de caja operativo y compromisos temporales. La pieza central es un calendario mensual que consolida y visualiza obligaciones de pago, fechas de corte y cuentas por cobrar en un formato unificado.

## 2. Orígenes de Datos (Contexto)
El calendario debe abstraer la complejidad de los distintos módulos de la base de datos (PostgreSQL/Supabase + IndexedDB). La agregación provendrá de:
- **Proveedores (CxP):** Fechas límite de pago de facturas a proveedores (Materia prima, logística).
- **Clientes (CxC):** Fechas de corte y vencimiento de facturas de crédito de clientes.
- **Nómina (HR):** Días de pago de nómina de los empleados.
- **Servicios Públicos (Gastos):** Fechas de corte y pago de recibos, arriendos y obligaciones recurrentes (`useExpenseStore`).

## 3. Decisiones de Arquitectura y Diseño (Constraints)
1. **Renderizado Visual:** Calendario construido desde cero (Custom CSS Grid) usando **Tailwind CSS** y `date-fns`. No se usarán librerías rígidas de terceros para garantizar el acoplamiento perfecto al tema `pezcaderia-glass` (Dark Glassmorphism).
2. **Patrón de Capas:** Se implementará un **Adapter Pattern** a través de `src/services/calendarService.ts`. Este servicio unificará las entidades dispares (`Cliente`, `Proveedor`, `Gasto`, `Nomina`) en un solo contrato tipo `CalendarEvent`.
3. **Experiencia de Usuario (UX):** Diseño **Split View**. El calendario ocupa el 70% del viewport. Al interactuar con un evento, un **Side-Panel (Drawer)** se desliza desde la derecha, exponiendo la información granular del compromiso y botones de acción rápida (ej. "Marcar Pagado").

## 4. Contrato de Datos Propuesto (`calendar.types.ts`)
```typescript
export type EventCategory = 'PAYROLL' | 'ACCOUNTS_PAYABLE' | 'ACCOUNTS_RECEIVABLE' | 'UTILITY_BILL';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  amount: number;
  category: EventCategory;
  isPaid: boolean;
  referenceId: string; // ID original en su store respectivo
  entityName: string; // Ej: "Proveedor X", "Servicio de Luz", "Empleado Y"
}
```
