-- =================================================================================
-- Fase 1: Infraestructura Contable (Partida Doble)
-- MaestroPescaderia ERP
-- =================================================================================

-- 1. Tabla de Catálogo de Cuentas (accounts)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- Ej: '1105' (Caja), '4135' (Ingresos Comerciales)
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentarios explicativos
COMMENT ON TABLE public.accounts IS 'Catálogo de cuentas contables para el ERP';
COMMENT ON COLUMN public.accounts.type IS 'Tipo de cuenta: ASSET (Activo), LIABILITY (Pasivo), EQUITY (Patrimonio), REVENUE (Ingreso), EXPENSE (Gasto)';

-- 2. Tabla de Asientos del Libro Mayor (ledger_entries)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    reference_type TEXT NOT NULL, -- 'CASH_SHIFT', 'SALE', 'PURCHASE', 'MANUAL'
    reference_id TEXT NOT NULL,   -- ID del turno de caja, venta, o compra
    debit NUMERIC(12,2) DEFAULT 0,
    credit NUMERIC(12,2) DEFAULT 0,
    description TEXT,
    branch_id TEXT NOT NULL,      -- ID de la sucursal para RLS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT NOT NULL      -- Usuario o sistema que causó el movimiento
);

-- Comentarios explicativos
COMMENT ON TABLE public.ledger_entries IS 'Registro de movimientos del libro mayor (Partida Doble)';

-- 3. Trigger de Validación de Partida Doble
-- Este trigger asegura que para una misma transacción (reference_id), 
-- la suma de débitos sea igual a la suma de créditos.
-- NOTA: Como la inserción de múltiples registros se hace generalmente en bloque o de forma secuencial,
-- validar fila por fila en inserciones simultáneas puede fallar si se usa un trigger BEFORE INSERT.
-- Se recomienda usar un CONSTRAINT DEFERRED o validar al finalizar la transacción. 
-- Para Supabase/PostgreSQL estándar vía API, lo más seguro es usar una función RPC que inserte ambas líneas
-- y haga el commit, o un TRIGGER AFTER STATEMENT (si es posible) o CONSTRAINT DEFERRED.

-- En lugar de un trigger que bloquee la inserción asíncrona de 2 filas desde el cliente,
-- crearemos una función RPC para registrar asientos completos garantizando la partida doble.

CREATE OR REPLACE FUNCTION public.record_ledger_transaction(
    p_entries JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_debit NUMERIC := 0;
    total_credit NUMERIC := 0;
    entry JSONB;
BEGIN
    -- Validar balance
    FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        total_debit := total_debit + COALESCE((entry->>'debit')::NUMERIC, 0);
        total_credit := total_credit + COALESCE((entry->>'credit')::NUMERIC, 0);
    END LOOP;

    IF total_debit != total_credit THEN
        RAISE EXCEPTION 'Asiento desequilibrado: Débitos (%) ≠ Créditos (%)', total_debit, total_credit;
    END IF;

    -- Insertar registros
    FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO public.ledger_entries (
            account_id, reference_type, reference_id, debit, credit, description, branch_id, created_by
        ) VALUES (
            (entry->>'account_id')::UUID,
            entry->>'reference_type',
            entry->>'reference_id',
            COALESCE((entry->>'debit')::NUMERIC, 0),
            COALESCE((entry->>'credit')::NUMERIC, 0),
            entry->>'description',
            entry->>'branch_id',
            entry->>'created_by'
        );
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.record_ledger_transaction(JSONB) IS 'RPC para insertar asientos asegurando que Débitos = Créditos';

-- Habilitar RLS en ledger_entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
