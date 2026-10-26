-- ============================================================================
-- MIGRACIÓN 36: ARQUITECTURA MULTIVENDEDOR CONCURRENTE (CAJA ÚNICA)
-- ============================================================================
-- Proyecto: Maestro Pezcaderia ERP
-- Módulos: POS, Turnos de Caja, Ventas Multivendedor y Stock Concurrente
-- ============================================================================

-- 1. Secuencia Atómica Global para Facturación Libre de Colisiones
CREATE SEQUENCE IF NOT EXISTS public.seq_pos_factura START WITH 1000 INCREMENT BY 1;

-- 2. Asegurar columnas de multivendedor y terminal en movimientos_pos_caja
ALTER TABLE public.movimientos_pos_caja 
    ADD COLUMN IF NOT EXISTS terminal_id VARCHAR(20) DEFAULT 'TERMINAL_1',
    ADD COLUMN IF NOT EXISTS vendedor_id UUID,
    ADD COLUMN IF NOT EXISTS vendedor_nombre VARCHAR(120);

-- 3. Índice para auditoría rápida por terminal y vendedor
CREATE INDEX IF NOT EXISTS idx_movimientos_pos_terminal ON public.movimientos_pos_caja(terminal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pos_vendedor ON public.movimientos_pos_caja(vendedor_id);

-- 4. RPC Atómica: registrar_venta_pos_concurrente
-- Soporta hasta 8 terminales concurrentes sobre la misma caja física abierta
CREATE OR REPLACE FUNCTION public.registrar_venta_pos_concurrente(
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_turno_id UUID;
    v_terminal_id VARCHAR(20);
    v_vendedor_id UUID;
    v_vendedor_nombre VARCHAR(120);
    v_monto_total NUMERIC(14, 2);
    v_items JSONB;
    v_pagos JSONB;
    v_item JSONB;
    v_pago JSONB;
    
    v_turno RECORD;
    v_seq_val BIGINT;
    v_consecutivo_factura VARCHAR(40);
    v_venta_id VARCHAR(50);
    v_movimiento_id UUID;
    
    v_stock_actual NUMERIC(14, 3);
    v_efectivo_total NUMERIC(14, 2) := 0.00;
    v_electronico_total NUMERIC(14, 2) := 0.00;
    v_metodo_principal VARCHAR(25) := 'EFECTIVO';
BEGIN
    -- Extracción de variables del payload
    v_tenant_id := (p_payload ->> 'tenantId')::UUID;
    v_turno_id := (p_payload ->> 'turnoId')::UUID;
    v_terminal_id := COALESCE(p_payload ->> 'terminalId', 'TERMINAL_1');
    v_vendedor_id := (p_payload ->> 'vendedorId')::UUID;
    v_vendedor_nombre := COALESCE(p_payload ->> 'vendedorNombre', 'VENDEDOR');
    v_monto_total := (p_payload ->> 'montoTotal')::NUMERIC(14, 2);
    v_items := p_payload -> 'items';
    v_pagos := p_payload -> 'pagos';

    -- Validación 1: Verificar y bloquear el Turno de Caja Central (SELECT FOR UPDATE)
    SELECT * INTO v_turno
    FROM public.turnos_pos
    WHERE id = v_turno_id AND empresa_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'Turno de caja central no encontrado para la empresa',
            'codigoError', 'CAJA_CERRADA'
        );
    END IF;

    IF v_turno.estado != 'ABIERTO' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'El turno de caja central está cerrado',
            'codigoError', 'CAJA_CERRADA'
        );
    END IF;

    -- Validación 2: Control de Stock Pesimista por Producto
    IF v_items IS NOT NULL AND jsonb_array_length(v_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
            -- Bloqueo pesimista de stock si la tabla productos o inventario_existencias existe
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'productos') THEN
                SELECT COALESCE(stock_actual, 0) INTO v_stock_actual
                FROM public.productos
                WHERE id = (v_item ->> 'productoId')::UUID
                FOR UPDATE;

                IF v_stock_actual < (v_item ->> 'cantidad')::NUMERIC THEN
                    RETURN jsonb_build_object(
                        'ok', false,
                        'error', 'Stock insuficiente para el producto: ' || (v_item ->> 'nombre'),
                        'codigoError', 'STOCK_INSUFICIENTE'
                    );
                END IF;

                -- Descontar existencias
                UPDATE public.productos
                SET stock_actual = stock_actual - (v_item ->> 'cantidad')::NUMERIC
                WHERE id = (v_item ->> 'productoId')::UUID;
            END IF;
        END LOOP;
    END IF;

    -- Generar consecutivo atómico libre de colisiones
    v_seq_val := nextval('public.seq_pos_factura');
    v_consecutivo_factura := 'FAC-' || LPAD(v_seq_val::TEXT, 6, '0');
    v_venta_id := 'vta-' || LOWER(v_terminal_id) || '-' || v_seq_val::TEXT;

    -- Procesar desglose de pagos
    IF v_pagos IS NOT NULL AND jsonb_array_length(v_pagos) > 0 THEN
        FOR v_pago IN SELECT * FROM jsonb_array_elements(v_pagos)
        LOOP
            IF (v_pago ->> 'metodoPago') = 'EFECTIVO' THEN
                v_efectivo_total := v_efectivo_total + (v_pago ->> 'monto')::NUMERIC;
            ELSE
                v_electronico_total := v_electronico_total + (v_pago ->> 'monto')::NUMERIC;
            END IF;
            v_metodo_principal := (v_pago ->> 'metodoPago');
        END LOOP;
    ELSE
        v_efectivo_total := v_monto_total;
    END IF;

    -- Inserción en el libro de movimientos de caja (Ledger Inmutable)
    INSERT INTO public.movimientos_pos_caja (
        empresa_id,
        turno_id,
        tipo_movimiento,
        metodo_pago,
        monto,
        consecutivo_comprobante,
        referencia_venta_id,
        concepto,
        terminal_id,
        vendedor_id,
        vendedor_nombre,
        autorizado_por
    ) VALUES (
        v_tenant_id,
        v_turno_id,
        'VENTA',
        v_metodo_principal,
        v_monto_total,
        v_consecutivo_factura,
        v_venta_id,
        'Venta POS ' || v_consecutivo_factura || ' (' || v_terminal_id || ')',
        v_terminal_id,
        v_vendedor_id,
        v_vendedor_nombre,
        v_vendedor_nombre
    ) RETURNING id INTO v_movimiento_id;

    -- Actualización de los acumuladores en el turno de caja central
    UPDATE public.turnos_pos
    SET total_efectivo = total_efectivo + v_efectivo_total,
        actualizado_en = timezone('UTC', NOW())
    WHERE id = v_turno_id;

    RETURN jsonb_build_object(
        'ok', true,
        'consecutivoFactura', v_consecutivo_factura,
        'ventaId', v_venta_id,
        'movimientoId', v_movimiento_id,
        'terminalId', v_terminal_id,
        'vendedorId', v_vendedor_id,
        'montoTotal', v_monto_total,
        'efectivoAfectado', v_efectivo_total,
        'electronicoAfectado', v_electronico_total,
        'nuevoSaldoEsperado', (v_turno.saldo_esperado_efectivo + v_efectivo_total)
    );
END;
$$;
