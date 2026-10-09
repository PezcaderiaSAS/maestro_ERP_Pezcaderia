---
name: erp-database-engineering
description: >
  Ingeniería de datos para MaestroPescaderia ERP sobre Supabase/PostgreSQL.
  Úsala cuando crees migraciones SQL, tablas, RLS, funciones RPC, pg_cron o análisis ABC.
version: 1.0.0
source: local-code-analysis
---

# ERP Database Engineering — MaestroPescaderia

## Sistema de migraciones numeradas

Archivos en `database/NN_descripcion.sql`. Cada uno es idempotente.

```
database/
  01_schema_inicial.sql
  17_contabilidad_doble_partida.sql  ← Libro mayor partida doble
  19_inventario_abc_cron.sql         ← Clasificación ABC + pg_cron
  22_rls_ledger_entries.sql          ← RLS para ledger
```

## Patrón 1: Tabla estándar

```sql
CREATE TABLE IF NOT EXISTS public.nombre_tabla (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     TEXT NOT NULL,
    estado     TEXT NOT NULL DEFAULT 'ACTIVO'
               CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ANULADO')),
    branch_id  TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.nombre_tabla IS 'Descripción del propósito';
```

**Campos obligatorios:** `id`, `branch_id`, `created_by`, `created_at`.

## Patrón 2: RLS Policies (multi-tenant por branch_id)

```sql
CREATE POLICY "select_own_branch_tabla"
ON public.nombre_tabla FOR SELECT
USING (
    branch_id = (auth.jwt() ->> 'branch_id')
    OR (auth.jwt() ->> 'role') = 'admin_global'
);

CREATE POLICY "insert_own_branch_tabla"
ON public.nombre_tabla FOR INSERT
WITH CHECK (branch_id = (auth.jwt() ->> 'branch_id'));

CREATE POLICY "update_own_branch_tabla"
ON public.nombre_tabla FOR UPDATE
USING (branch_id = (auth.jwt() ->> 'branch_id'));
```

**Anti-patrón:** Nunca `USING (true)` en tablas financieras o de inventario.

## Patrón 3: Funciones RPC — Operaciones atómicas

```sql
CREATE OR REPLACE FUNCTION public.nombre_operacion(
    p_entidad_id UUID,
    p_cantidad   NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'Cantidad debe ser mayor a cero';
    END IF;
    INSERT INTO public.tabla_a (...) VALUES (...);
    UPDATE public.tabla_b SET campo = campo - p_cantidad WHERE id = p_entidad_id;
    RETURN jsonb_build_object('exito', true);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END;
$$;
```

**Usar RPC cuando:** múltiples tablas, partida doble, validación de stock, cambio de estado.

## Patrón 4: Partida Doble Contable

Toda transacción financiera DEBE generar asiento doble via `record_ledger_transaction()`.

```typescript
// En accountingService.ts — nunca insertar directo en ledger_entries
await accountingService.recordCategorizedTransaction({
  categoryKey: 'SALE_CASH',  // Débito 1105 Caja / Crédito 4135 Ventas
  amount: 150000,
  referenceType: 'SALE',
  referenceId: ventaId,
  description: 'Venta POS #001',
  branchId: branchId,
  createdBy: userId
});
```

**Códigos PUC del ERP:**

| Código | Cuenta             | Tipo      |
|--------|--------------------|-----------|
| 1105   | Caja               | ASSET     |
| 1435   | Inventario         | ASSET     |
| 4135   | Ingresos Comerciales | REVENUE |
| 5105   | Gastos de Personal | EXPENSE   |
| 5195   | Gastos Varios      | EXPENSE   |
| 2205   | Proveedores        | LIABILITY |

**Validar:** `Σ débitos == Σ créditos` siempre (la BD también lo valida en el RPC).

## Patrón 5: Análisis ABC (Pareto 80/20)

```sql
-- Ejecutar manualmente:
SELECT public.calculate_abc_inventory();
-- Corre automáticamente cada noche via pg_cron a las 00:00
-- A = top 80% de ventas (15 días) → mayor control
-- B = 80-95% → control moderado
-- C = >95% → bajo control
```

**Regla UI:** Siempre ordenar por `categoriaABC ASC` (A → B → C) y luego por valor.

## Patrón 6: Índices de rendimiento

```sql
-- Obligatorio en tablas de movimientos
CREATE INDEX IF NOT EXISTS idx_tabla_branch_created
    ON public.tabla (branch_id, created_at DESC);

-- Para búsquedas por referencia
CREATE INDEX IF NOT EXISTS idx_tabla_referencia
    ON public.tabla (reference_type, reference_id);

-- Partial index cuando 90%+ consultas filtran activos
CREATE INDEX IF NOT EXISTS idx_tabla_activos
    ON public.tabla (branch_id) WHERE estado = 'ACTIVO';
```

## Checklist nueva migración

- [ ] Archivo numerado `database/NN_descripcion.sql`
- [ ] DDL idempotente (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- [ ] Columnas `id, branch_id, created_by, created_at`
- [ ] `ENABLE ROW LEVEL SECURITY` + policies SELECT/INSERT/UPDATE
- [ ] Índice en `(branch_id, created_at DESC)` para tablas de movimientos
- [ ] `COMMENT ON TABLE/COLUMN` para columnas no obvias
- [ ] Operaciones multi-tabla en RPC `SECURITY DEFINER`
- [ ] Transacciones financieras via `record_ledger_transaction()` (Σdébito = Σcrédito)
- [ ] pg_cron dentro de bloque `DO $$ IF EXISTS pg_extension ...`
