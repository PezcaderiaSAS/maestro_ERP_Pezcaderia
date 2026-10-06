-- Migración: RPCs para Módulo Inventarios y Bodegas (WMS)
-- Maneja lógica de negocio ACID usando SELECT FOR UPDATE

-- 1. Función para Traslado de Stock entre Bodegas
CREATE OR REPLACE FUNCTION public.rpc_transfer_stock(
    p_tenant_id UUID,
    p_branch_id UUID,
    p_source_warehouse_id UUID,
    p_target_warehouse_id UUID,
    p_batch_id UUID,
    p_sku VARCHAR,
    p_quantity DECIMAL,
    p_actor_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_source_stock_id UUID;
    v_source_quantity DECIMAL;
    v_target_stock_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Bloquear y verificar stock de origen
    SELECT id, quantity INTO v_source_stock_id, v_source_quantity
    FROM public.wms_stock
    WHERE tenant_id = p_tenant_id 
      AND warehouse_id = p_source_warehouse_id 
      AND sku = p_sku 
      AND (batch_id = p_batch_id OR (batch_id IS NULL AND p_batch_id IS NULL))
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No existe stock en la bodega de origen para este producto/lote.');
    END IF;

    IF v_source_quantity < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock insuficiente en la bodega de origen.');
    END IF;

    -- 2. Restar del origen
    UPDATE public.wms_stock
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = v_source_stock_id;

    -- 3. Sumar al destino (Insertar si no existe, actualizar si existe)
    INSERT INTO public.wms_stock (tenant_id, warehouse_id, batch_id, sku, quantity)
    VALUES (p_tenant_id, p_target_warehouse_id, p_batch_id, p_sku, p_quantity)
    ON CONFLICT (warehouse_id, batch_id, sku)
    DO UPDATE SET quantity = public.wms_stock.quantity + p_quantity, updated_at = NOW()
    RETURNING id INTO v_target_stock_id;

    -- 4. Registrar el movimiento en Kardex
    INSERT INTO public.wms_movements (
        tenant_id, branch_id, movement_type, 
        source_warehouse_id, target_warehouse_id, 
        batch_id, sku, quantity, actor_id, notes
    ) VALUES (
        p_tenant_id, p_branch_id, 'TRANSFER', 
        p_source_warehouse_id, p_target_warehouse_id, 
        p_batch_id, p_sku, p_quantity, p_actor_id, p_notes
    );

    RETURN jsonb_build_object('success', true, 'message', 'Traslado realizado con éxito.');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 2. Función para Ajustes y Mermas de Despiece
CREATE OR REPLACE FUNCTION public.rpc_adjust_stock(
    p_tenant_id UUID,
    p_branch_id UUID,
    p_warehouse_id UUID,
    p_batch_id UUID,
    p_sku VARCHAR,
    p_quantity DECIMAL, -- Puede ser negativo (merma) o positivo (ajuste)
    p_movement_type VARCHAR, -- 'SCRAP', 'COUNT_ADJUSTMENT'
    p_actor_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_id UUID;
    v_current_quantity DECIMAL;
BEGIN
    -- 1. Bloquear y verificar stock actual
    SELECT id, quantity INTO v_stock_id, v_current_quantity
    FROM public.wms_stock
    WHERE tenant_id = p_tenant_id 
      AND warehouse_id = p_warehouse_id 
      AND sku = p_sku 
      AND (batch_id = p_batch_id OR (batch_id IS NULL AND p_batch_id IS NULL))
    FOR UPDATE;

    -- Si es merma (negativo) y no hay suficiente stock
    IF p_quantity < 0 AND (NOT FOUND OR v_current_quantity < ABS(p_quantity)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock insuficiente para aplicar merma/ajuste negativo.');
    END IF;

    -- 2. Actualizar o Insertar
    IF FOUND THEN
        UPDATE public.wms_stock
        SET quantity = quantity + p_quantity,
            updated_at = NOW()
        WHERE id = v_stock_id;
    ELSE
        IF p_quantity > 0 THEN
            INSERT INTO public.wms_stock (tenant_id, warehouse_id, batch_id, sku, quantity)
            VALUES (p_tenant_id, p_warehouse_id, p_batch_id, p_sku, p_quantity)
            RETURNING id INTO v_stock_id;
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'No existe stock para ajustar negativamente.');
        END IF;
    END IF;

    -- 3. Registrar en el lote si existe
    IF p_batch_id IS NOT NULL THEN
        UPDATE public.wms_batches
        SET current_quantity = current_quantity + p_quantity
        WHERE id = p_batch_id;
    END IF;

    -- 4. Registrar movimiento
    INSERT INTO public.wms_movements (
        tenant_id, branch_id, movement_type, 
        source_warehouse_id, target_warehouse_id, 
        batch_id, sku, quantity, actor_id, notes
    ) VALUES (
        p_tenant_id, p_branch_id, p_movement_type, 
        p_warehouse_id, p_warehouse_id, 
        p_batch_id, p_sku, ABS(p_quantity), p_actor_id, p_notes
    );

    RETURN jsonb_build_object('success', true, 'message', 'Ajuste de stock realizado con éxito.');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
