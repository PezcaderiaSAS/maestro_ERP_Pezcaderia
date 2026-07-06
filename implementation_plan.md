# Speckit Plan: Implementación Técnica (El Cómo)

Este plan de implementación traduce la arquitectura y los requisitos de calidad aprobados en esquemas técnicos concretos y tareas ejecutables.

## 1. Esquemas de Datos (Supabase SQL)

### A. Base Contable (Partida Doble)
Se requiere crear dos tablas nuevas para el Libro Mayor, permitiendo el modelo estricto por debajo y la categorización simple por encima.

```sql
-- Catálogo de Cuentas (Simple para MVP)
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- Ej: '1105' (Caja), '4135' (Ingresos Comerciales)
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Asientos del Libro Mayor
CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  reference_type text NOT NULL, -- 'CASH_SHIFT', 'SALE', 'PURCHASE'
  reference_id text NOT NULL, -- ID del turno o factura
  debit numeric(12,2) DEFAULT 0,
  credit numeric(12,2) DEFAULT 0,
  description text,
  branch_id text NOT NULL, -- Sucursal
  created_at timestamp with time zone DEFAULT now(),
  created_by text NOT NULL -- Usuario que causó el movimiento
);
-- Regla de Integridad en Aplicación: sum(debit) debe ser igual a sum(credit) por cada reference_id
```

### B. Despachos Parciales y Logística
Modificaciones al esquema de órdenes existente para soportar despachos parciales.

```sql
-- Agregar columnas a la tabla order_items (o equivalente actual)
ALTER TABLE order_items 
ADD COLUMN requested_quantity numeric(10,2) NOT NULL DEFAULT 1,
ADD COLUMN fulfilled_quantity numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'FULFILLED', 'CANCELLED'));
```

## 2. Flujos de Información y Servicios Frontend

### A. Módulo Contable (UX Simple)
*   **Servicio (`src/services/accountingService.ts`):** 
    Expondrá una función `recordCategorizedTransaction(category, amount, referenceId)` que por debajo mapeará la categoría a las cuentas correctas e insertará dos registros en `ledger_entries` (Débito y Crédito).
*   **Estado (`src/store/useAccountingStore.ts`):** 
    Cargará los resúmenes financieros (Ingresos Totales vs Gastos Totales) utilizando llamadas a Supabase RPC para no cargar miles de registros en memoria.

### B. Automatización de Cierre de Caja
*   **Intercepción en `cashService.ts`:** 
    Al ejecutar `cerrarTurno(id, diferencias)`, el servicio llamará a `accountingService.recordCategorizedTransaction('CASH_DIFFERENCE', diferencias, id)` para asentar los faltantes/sobrantes automáticamente.

### C. Inventario ABC (Backend Cron)
*   **Supabase RPC + pg_cron:**
    Se creará una función SQL `calculate_abc_inventory()` que agrupa las ventas de los últimos 15 días, calcula porcentajes acumulados y actualiza una columna `abc_class` en la tabla `products`.
*   **Frontend (`InventoryView.tsx`):**
    Solo leerá la columna `abc_class` existente en `products`. Se aplicará una clase CSS condicional (rojo/amarillo/verde) basada en esa letra.

### D. Supabase Realtime y RLS (Despachos)
*   **Row Level Security (RLS):**
    ```sql
    CREATE POLICY "Ver ordenes de mi sucursal" 
    ON orders FOR SELECT 
    USING (branch_id = auth.jwt() ->> 'branch_id');
    ```
*   **Zustand Realtime Subscription:**
    En `useOrderStore.ts`, se activará un canal `supabase.channel('orders')` que escuchará `INSERT` y `UPDATE` para actualizar el tablero Kanban en tiempo real, filtrado por el RLS del usuario.

## 3. Plan de Ejecución (Fases de Desarrollo)

Para evitar romper el sistema actual, la ejecución se hará de forma secuencial:

1.  **Fase 1: Infraestructura DB:** Ejecutar scripts SQL en Supabase para `accounts`, `ledger_entries`, y la modificación de `order_items`. Crear la función RPC del cálculo ABC.
2.  **Fase 2: Core Contable (Servicios):** Implementar `accountingService.ts` y conectarlo al proceso de cierre de caja en `cashService.ts`.
3.  **Fase 3: Logística Realtime:** Implementar suscripciones WebSockets en `useOrderStore.ts`, adaptar `OrderKanbanView` y `AlistamientoBodegaView` para soportar estados y despachos parciales.
4.  **Fase 4: UI de Reportes e Inventario:** Crear la vista `AccountingView.tsx` (Reportes financieros) y agregar los indicadores visuales ABC en `InventoryView.tsx`.

---

## User Review Required

> [!IMPORTANT]
> **Aprobación de la Arquitectura Técnica (El Cómo):**
> Este es el mapa exacto de cómo se estructurará el código y la base de datos.
> ¿Estás de acuerdo con el esquema SQL, los flujos de servicio propuestos y el orden de ejecución (Fase 1 a 4)? 
> 
> Si apruebas, dime "Aprobado, inicia con la Fase 1" y comenzaré a generar y aplicar el código SQL y estructural directamente.
