-- =================================================================================
-- Fase 1: Inventario Clasificación ABC (Pareto)
-- MaestroPescaderia ERP
-- =================================================================================

-- 1. Asegurar que la columna existe en la tabla de productos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'categoria_abc'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN categoria_abc TEXT DEFAULT 'C'
        CHECK (categoria_abc IN ('A', 'B', 'C'));
    END IF;
END $$;

-- 2. Crear función RPC para el cálculo ABC (últimos 15 días)
CREATE OR REPLACE FUNCTION public.calculate_abc_inventory()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_sales_value NUMERIC;
BEGIN
    -- 2.1 Calcular el valor total de ventas de los últimos 15 días
    SELECT COALESCE(SUM(oi.cantidad * oi.precio), 0)
    INTO total_sales_value
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.created_at >= (now() - INTERVAL '15 days')
      AND o.estado NOT IN ('CANCELADA', 'ANULADA'); -- Ajustar según estados reales

    -- Si no hay ventas, no hacemos nada o seteamos todo a 'C'
    IF total_sales_value > 0 THEN
        -- 2.2 Actualizar clasificación ABC usando una CTE con suma acumulada (Running Total)
        WITH product_sales AS (
            -- Agrupar ventas por producto
            SELECT 
                oi.product_id,
                SUM(oi.cantidad * oi.precio) as sales_value
            FROM public.order_items oi
            JOIN public.orders o ON o.id = oi.order_id
            WHERE o.created_at >= (now() - INTERVAL '15 days')
              AND o.estado NOT IN ('CANCELADA', 'ANULADA')
            GROUP BY oi.product_id
        ),
        ranked_sales AS (
            -- Ordenar y calcular porcentaje acumulado
            SELECT 
                product_id,
                sales_value,
                SUM(sales_value) OVER (ORDER BY sales_value DESC) as running_total,
                (SUM(sales_value) OVER (ORDER BY sales_value DESC) / total_sales_value) * 100 as running_percentage
            FROM product_sales
        ),
        classified_products AS (
            -- Clasificar A (0-80%), B (80-95%), C (>95%)
            SELECT 
                product_id,
                CASE 
                    WHEN running_percentage <= 80 THEN 'A'
                    WHEN running_percentage <= 95 THEN 'B'
                    ELSE 'C'
                END as abc_class
            FROM ranked_sales
        )
        -- Realizar el UPDATE en la tabla products
        UPDATE public.products p
        SET categoria_abc = cp.abc_class
        FROM classified_products cp
        WHERE p.id = cp.product_id;
        
        -- Los productos que no tuvieron ventas en 15 días, pasan a 'C' automáticamente
        UPDATE public.products
        SET categoria_abc = 'C'
        WHERE id NOT IN (SELECT product_id FROM classified_products);
    END IF;
END;
$$;

COMMENT ON FUNCTION public.calculate_abc_inventory() IS 'Calcula la clasificación de inventario ABC basándose en las ventas de los últimos 15 días. Asigna A (80%), B (15%), C (5%).';

-- 3. Configuración de pg_cron (Ejecutar todos los días a medianoche)
-- Requiere que la extensión pg_cron esté habilitada en Supabase.
-- Ejecutar como un bloque anónimo para evitar errores si pg_cron no está disponible.
DO $$
BEGIN
    -- Comprobar si la extensión pg_cron existe
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Desprogramar si ya existe para evitar duplicados
        PERFORM cron.unschedule('job_calculate_abc_inventory');
        -- Programar a las 00:00 todos los días
        PERFORM cron.schedule(
            'job_calculate_abc_inventory',
            '0 0 * * *',
            'SELECT public.calculate_abc_inventory();'
        );
    ELSE
        RAISE NOTICE 'La extensión pg_cron no está habilitada. Por favor habilítala en Supabase Database Extensions para activar la tarea programada.';
    END IF;
END $$;
