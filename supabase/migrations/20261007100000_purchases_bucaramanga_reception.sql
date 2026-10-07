-- Migración: Módulo de Compras y Recepción en Bodega Bucaramanga
-- Flujo en 2 Fases: Pedido Previo + Recepción & Pesaje en Frío (Landed Cost con Flete Prorrateado)

-- 1. Tabla de Pedidos de Compra Previos (Acordados con proveedores foráneos)
CREATE TABLE IF NOT EXISTS public.purchases_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    origin_city VARCHAR(100) NOT NULL, -- Ej: 'Cartagena', 'Buenaventura', 'Barrancabermeja'
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_arrival_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'CREADO', -- CREADO, EN_TRANSITO, RECIBIDO_TOTAL, CANCELADO
    estimated_weight_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    estimated_purchase_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    estimated_freight_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    advance_payment_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00, -- Anticipo consignado
    advance_payment_method VARCHAR(50), -- TRANSFERENCIA_BANCARIA, EFECTIVO
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Recepción Física en Bodega Bucaramanga
CREATE TABLE IF NOT EXISTS public.purchases_receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    purchase_order_id UUID REFERENCES public.purchases_orders(id),
    reception_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    reception_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    truck_plate VARCHAR(20) NOT NULL,
    transport_company VARCHAR(150),
    shipping_guide_number VARCHAR(100),
    driver_name VARCHAR(150),
    refrigeration_temp_c DECIMAL(4,1) NOT NULL, -- 0.0 a 2.0 °C para fresco, <= -18.0 °C congelado
    sensory_status VARCHAR(50) DEFAULT 'ACEPTADO', -- ACEPTADO, OBSERVACION, RECHAZADO
    inspector_name VARCHAR(150) NOT NULL,
    total_crates INTEGER NOT NULL DEFAULT 0,
    gross_weight_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    crate_tare_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    ice_deduction_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    net_weight_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    total_purchase_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_freight_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    landed_cost_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    advance_deducted DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    balance_to_pay DECIMAL(14,2) NOT NULL DEFAULT 0.00, -- Saldo neto al proveedor
    payment_status VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO_CONTADO, CREDITO
    status VARCHAR(50) DEFAULT 'FINALIZADO',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Detalle de Canastillas Pesadas en Báscula (Pesaje granular)
CREATE TABLE IF NOT EXISTS public.purchases_reception_crates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    reception_id UUID NOT NULL REFERENCES public.purchases_receptions(id) ON DELETE CASCADE,
    crate_number INTEGER NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    crate_tare_kg DECIMAL(6,3) NOT NULL DEFAULT 2.000, -- Tara de canastilla plástica estándar
    gross_weight_kg DECIMAL(8,3) NOT NULL,
    ice_deduction_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    ice_deduction_kg DECIMAL(8,3) NOT NULL DEFAULT 0.000,
    net_weight_kg DECIMAL(8,3) NOT NULL,
    unit_cost_origin_kg DECIMAL(12,2) NOT NULL,
    prorated_freight_kg DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    landed_cost_kg DECIMAL(12,2) NOT NULL, -- Costo Real puesto en Bucaramanga
    warehouse_id UUID NOT NULL REFERENCES public.wms_warehouses(id),
    batch_id UUID REFERENCES public.wms_batches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.purchases_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases_receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases_reception_crates ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "Aislamiento tenant en pedidos compra"
ON public.purchases_orders FOR ALL
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en recepciones compra"
ON public.purchases_receptions FOR ALL
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en pesajes canastillas"
ON public.purchases_reception_crates FOR ALL
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- 6. RPC Atómica: Liquidar Recepción, Crear Lote FEFO e Ingresar Stock a Cuarto Frío
CREATE OR REPLACE FUNCTION public.rpc_liquidar_recepcion_bucaramanga(
    p_tenant_id UUID,
    p_branch_id UUID,
    p_reception_data JSONB,
    p_crates JSONB,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reception_id UUID;
    v_order_id UUID;
    v_crate RECORD;
    v_batch_id UUID;
    v_batch_number VARCHAR(100);
    v_expiration_date TIMESTAMPTZ;
BEGIN
    v_order_id := (p_reception_data ->> 'purchase_order_id')::UUID;

    -- 1. Insertar Cabecera de Recepción
    INSERT INTO public.purchases_receptions (
        tenant_id, branch_id, purchase_order_id, reception_number,
        supplier_id, supplier_name, truck_plate, transport_company,
        shipping_guide_number, driver_name, refrigeration_temp_c,
        sensory_status, inspector_name, total_crates, gross_weight_kg,
        crate_tare_kg, ice_deduction_kg, net_weight_kg, total_purchase_cost,
        total_freight_cost, landed_cost_total, advance_deducted,
        balance_to_pay, payment_status, notes
    ) VALUES (
        p_tenant_id,
        p_branch_id,
        v_order_id,
        p_reception_data ->> 'reception_number',
        (p_reception_data ->> 'supplier_id')::UUID,
        p_reception_data ->> 'supplier_name',
        p_reception_data ->> 'truck_plate',
        p_reception_data ->> 'transport_company',
        p_reception_data ->> 'shipping_guide_number',
        p_reception_data ->> 'driver_name',
        (p_reception_data ->> 'refrigeration_temp_c')::DECIMAL,
        p_reception_data ->> 'sensory_status',
        p_reception_data ->> 'inspector_name',
        (p_reception_data ->> 'total_crates')::INTEGER,
        (p_reception_data ->> 'gross_weight_kg')::DECIMAL,
        (p_reception_data ->> 'crate_tare_kg')::DECIMAL,
        (p_reception_data ->> 'ice_deduction_kg')::DECIMAL,
        (p_reception_data ->> 'net_weight_kg')::DECIMAL,
        (p_reception_data ->> 'total_purchase_cost')::DECIMAL,
        (p_reception_data ->> 'total_freight_cost')::DECIMAL,
        (p_reception_data ->> 'landed_cost_total')::DECIMAL,
        (p_reception_data ->> 'advance_deducted')::DECIMAL,
        (p_reception_data ->> 'balance_to_pay')::DECIMAL,
        p_reception_data ->> 'payment_status',
        p_reception_data ->> 'notes'
    )
    RETURNING id INTO v_reception_id;

    -- 2. Procesar cada canastilla pesada e ingresar al WMS
    FOR v_crate IN SELECT * FROM jsonb_to_recordset(p_crates) AS x(
        crate_number INTEGER,
        sku VARCHAR,
        product_name VARCHAR,
        crate_tare_kg DECIMAL,
        gross_weight_kg DECIMAL,
        ice_deduction_pct DECIMAL,
        ice_deduction_kg DECIMAL,
        net_weight_kg DECIMAL,
        unit_cost_origin_kg DECIMAL,
        prorated_freight_kg DECIMAL,
        landed_cost_kg DECIMAL,
        warehouse_id UUID,
        shelf_life_days INTEGER
    )
    LOOP
        -- Generar número de lote FEFO determinista
        v_batch_number := 'LOT-BCM-' || to_char(NOW(), 'YYYYMMDD') || '-' || v_crate.sku || '-' || v_crate.crate_number;
        v_expiration_date := NOW() + (COALESCE(v_crate.shelf_life_days, 5) || ' days')::INTERVAL;

        -- Crear Lote FEFO en wms_batches
        INSERT INTO public.wms_batches (
            tenant_id, sku, batch_number, reception_date,
            expiration_date, initial_quantity, current_quantity,
            supplier_id, status
        ) VALUES (
            p_tenant_id, v_crate.sku, v_batch_number, NOW(),
            v_expiration_date, v_crate.net_weight_kg, v_crate.net_weight_kg,
            (p_reception_data ->> 'supplier_id')::UUID, 'ACTIVE'
        )
        RETURNING id INTO v_batch_id;

        -- Registrar Canastilla detallada
        INSERT INTO public.purchases_reception_crates (
            tenant_id, reception_id, crate_number, sku, product_name,
            crate_tare_kg, gross_weight_kg, ice_deduction_pct,
            ice_deduction_kg, net_weight_kg, unit_cost_origin_kg,
            prorated_freight_kg, landed_cost_kg, warehouse_id, batch_id
        ) VALUES (
            p_tenant_id, v_reception_id, v_crate.crate_number, v_crate.sku, v_crate.product_name,
            v_crate.crate_tare_kg, v_crate.gross_weight_kg, v_crate.ice_deduction_pct,
            v_crate.ice_deduction_kg, v_crate.net_weight_kg, v_crate.unit_cost_origin_kg,
            v_crate.prorated_freight_kg, v_crate.landed_cost_kg, v_crate.warehouse_id, v_batch_id
        );

        -- Incrementar Stock en wms_stock de forma atómica
        INSERT INTO public.wms_stock (tenant_id, warehouse_id, batch_id, sku, quantity)
        VALUES (p_tenant_id, v_crate.warehouse_id, v_batch_id, v_crate.sku, v_crate.net_weight_kg)
        ON CONFLICT (warehouse_id, batch_id, sku)
        DO UPDATE SET quantity = public.wms_stock.quantity + v_crate.net_weight_kg, updated_at = NOW();

        -- Registrar en wms_movements
        INSERT INTO public.wms_movements (
            tenant_id, branch_id, movement_type, target_warehouse_id,
            batch_id, sku, quantity, reference_id, actor_id, notes
        ) VALUES (
            p_tenant_id, p_branch_id, 'IN', v_crate.warehouse_id,
            v_batch_id, v_crate.sku, v_crate.net_weight_kg, v_reception_id, p_actor_id,
            'Entrada por compra recepción Bucaramanga: ' || v_batch_number
        );
    END LOOP;

    -- 3. Si venía de una orden de compra previa, actualizar su estado
    IF v_order_id IS NOT NULL THEN
        UPDATE public.purchases_orders
        SET status = 'RECIBIDO_TOTAL', updated_at = NOW()
        WHERE id = v_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'reception_id', v_reception_id,
        'balance_to_pay', (p_reception_data ->> 'balance_to_pay')::DECIMAL,
        'message', 'Recepción finalizada, lotes creados en cuarto frío y saldo liquidado.'
    );
END;
$$;
