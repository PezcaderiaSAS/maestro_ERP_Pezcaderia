-- =================================================================================
-- Fase 1: Logística y Despachos Parciales
-- MaestroPescaderia ERP
-- =================================================================================

-- 1. Agregar campos de control a order_items (o la tabla equivalente de líneas de pedido)
-- Esto permite el control de lo que se pidió vs lo que realmente se empacó/alistó.
DO $$ 
BEGIN
    -- Verificar si la columna requested_quantity ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'requested_quantity'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN requested_quantity NUMERIC(10,2) NOT NULL DEFAULT 1;
    END IF;

    -- Verificar si la columna fulfilled_quantity ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'fulfilled_quantity'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN fulfilled_quantity NUMERIC(10,2) NOT NULL DEFAULT 0;
    END IF;

    -- Verificar si la columna status ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN status TEXT DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PARTIAL', 'FULFILLED', 'CANCELLED'));
    END IF;
END $$;

-- Actualizar comentarios
COMMENT ON COLUMN public.order_items.requested_quantity IS 'Cantidad originalmente solicitada por el cliente';
COMMENT ON COLUMN public.order_items.fulfilled_quantity IS 'Cantidad realmente empacada/alistada para despacho';
COMMENT ON COLUMN public.order_items.status IS 'Estado de la línea individual del pedido (PENDING, PARTIAL, FULFILLED, CANCELLED)';
