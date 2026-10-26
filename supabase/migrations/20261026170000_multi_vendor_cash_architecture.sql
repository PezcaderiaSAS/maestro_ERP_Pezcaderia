-- ============================================================================
-- MIGRACIÓN 36: ARQUITECTURA MULTIVENDEDOR CONCURRENTE (CAJA ÚNICA)
-- ============================================================================
-- Proyecto: Maestro Pezcaderia ERP
-- Módulos: POS, Turnos de Caja, Ventas Multivendedor y Stock Concurrente
-- ============================================================================

-- 1. Secuencia Atómica Global para Facturación Libre de Colisiones
CREATE SEQUENCE IF NOT EXISTS public.seq_pos_factura START WITH 1000 INCREMENT BY 1;

-- 2. Tabla de Movimientos y Libro Auxiliar de POS (Ledger Inmutable)
CREATE TABLE IF NOT EXISTS public.movimientos_pos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    turno_id UUID,
    session_id UUID,
    tipo_movimiento VARCHAR(30) NOT NULL DEFAULT 'VENTA',
    metodo_pago VARCHAR(25) NOT NULL DEFAULT 'EFECTIVO',
    monto NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    consecutivo_comprobante VARCHAR(40) NOT NULL,
    referencia_venta_id VARCHAR(50),
    concepto TEXT NOT NULL,
    terminal_id VARCHAR(20) DEFAULT 'TERMINAL_1',
    vendedor_id UUID,
    vendedor_nombre VARCHAR(120),
    autorizado_por VARCHAR(120),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.movimientos_pos_caja 
    ADD COLUMN IF NOT EXISTS terminal_id VARCHAR(20) DEFAULT 'TERMINAL_1',
    ADD COLUMN IF NOT EXISTS vendedor_id UUID,
    ADD COLUMN IF NOT EXISTS vendedor_nombre VARCHAR(120);

-- Habilitar RLS
ALTER TABLE public.movimientos_pos_caja ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS p_movimientos_pos_tenant ON public.movimientos_pos_caja;
    CREATE POLICY p_movimientos_pos_tenant ON public.movimientos_pos_caja
        FOR ALL USING (
            empresa_id = COALESCE(
                (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
                empresa_id
            )
        );
END $$;

-- 3. Índices de rendimiento para auditoría por terminal y vendedor
CREATE INDEX IF NOT EXISTS idx_movimientos_pos_terminal ON public.movimientos_pos_caja(terminal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pos_vendedor ON public.movimientos_pos_caja(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pos_turno ON public.movimientos_pos_caja(turno_id);

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
    
    v_session RECORD;
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

    -- Validación 1: Verificar y bloquear la Sesión de Caja Central (SELECT FOR UPDATE)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_sessions') THEN
        SELECT * INTO v_session
        FROM public.pos_sessions
        WHERE id = v_turno_id
        FOR UPDATE;

        IF FOUND AND v_session.status != 'OPEN' THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', 'La sesión de caja central no está abierta',
                'codigoError', 'CAJA_CERRADA'
            );
        END IF;
    END IF;

    -- Validación 2: Control de Stock Pesimista por Producto si existe tabla productos
    IF v_items IS NOT NULL AND jsonb_array_length(v_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
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
        session_id,
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

    -- Actualización de la expectativa de efectivo en pos_sessions si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_sessions') AND v_session.id IS NOT NULL THEN
        UPDATE public.pos_sessions
        SET expected_cash = expected_cash + v_efectivo_total
        WHERE id = v_turno_id;
    END IF;

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
        'nuevoSaldoEsperado', COALESCE(v_session.expected_cash, 0) + v_efectivo_total
    );
END;
$$;
