-- Migración: Deducción FEFO Automática para Sincronización POS
-- Permite deducción asíncrona de inventario desde el Outbox, soportando stock negativo

CREATE OR REPLACE FUNCTION public.rpc_pos_sync_fefo(
    p_tenant_id UUID,
    p_branch_id UUID,
    p_warehouse_id UUID,
    p_sku VARCHAR,
    p_sold_quantity DECIMAL,
    p_actor_id UUID,
    p_reference_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_remaining_qty DECIMAL := p_sold_quantity;
    v_stock_record RECORD;
    v_deduct_qty DECIMAL;
    v_fallback_stock_id UUID;
BEGIN
    -- 1. Buscar lotes disponibles en FEFO (First Expired, First Out)
    FOR v_stock_record IN
        SELECT s.id as stock_id, s.quantity, s.batch_id, b.expiration_date
        FROM public.wms_stock s
        LEFT JOIN public.wms_batches b ON s.batch_id = b.id
        WHERE s.tenant_id = p_tenant_id 
          AND s.warehouse_id = p_warehouse_id 
          AND s.sku = p_sku
          AND s.quantity > 0
        ORDER BY b.expiration_date ASC NULLS LAST
        FOR UPDATE
    LOOP
        IF v_remaining_qty <= 0 THEN
            EXIT;
        END IF;

        IF v_stock_record.quantity >= v_remaining_qty THEN
            v_deduct_qty := v_remaining_qty;
        ELSE
            v_deduct_qty := v_stock_record.quantity;
        END IF;

        -- Descontar del stock
        UPDATE public.wms_stock
        SET quantity = quantity - v_deduct_qty,
            updated_at = NOW()
        WHERE id = v_stock_record.stock_id;

        -- Registrar movimiento
        INSERT INTO public.wms_movements (
            tenant_id, branch_id, movement_type, 
            source_warehouse_id, target_warehouse_id, 
            batch_id, sku, quantity, reference_id, actor_id, notes
        ) VALUES (
            p_tenant_id, p_branch_id, 'OUT', 
            p_warehouse_id, NULL, 
            v_stock_record.batch_id, p_sku, v_deduct_qty, p_reference_id, p_actor_id, p_notes
        );

        v_remaining_qty := v_remaining_qty - v_deduct_qty;
    END LOOP;

    -- 2. Si todavía queda cantidad por descontar (Stock Negativo Temporal / Desincronización)
    IF v_remaining_qty > 0 THEN
        -- Buscar si hay un registro de stock "genérico" o usar el primero que haya
        SELECT id INTO v_fallback_stock_id
        FROM public.wms_stock
        WHERE tenant_id = p_tenant_id AND warehouse_id = p_warehouse_id AND sku = p_sku
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.wms_stock
            SET quantity = quantity - v_remaining_qty,
                updated_at = NOW()
            WHERE id = v_fallback_stock_id;

            INSERT INTO public.wms_movements (
                tenant_id, branch_id, movement_type, 
                source_warehouse_id, target_warehouse_id, 
                batch_id, sku, quantity, reference_id, actor_id, notes
            ) VALUES (
                p_tenant_id, p_branch_id, 'OUT', 
                p_warehouse_id, NULL, 
                NULL, p_sku, v_remaining_qty, p_reference_id, p_actor_id, p_notes || ' (STOCK NEGATIVO ASÍNCRONO)'
            );
        ELSE
            -- Insertar un registro nuevo negativo porque no había nada de stock
            INSERT INTO public.wms_stock (tenant_id, warehouse_id, batch_id, sku, quantity)
            VALUES (p_tenant_id, p_warehouse_id, NULL, p_sku, -v_remaining_qty);

            INSERT INTO public.wms_movements (
                tenant_id, branch_id, movement_type, 
                source_warehouse_id, target_warehouse_id, 
                batch_id, sku, quantity, reference_id, actor_id, notes
            ) VALUES (
                p_tenant_id, p_branch_id, 'OUT', 
                p_warehouse_id, NULL, 
                NULL, p_sku, v_remaining_qty, p_reference_id, p_actor_id, p_notes || ' (STOCK NEGATIVO INICIAL)'
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Deducción FEFO procesada.');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
