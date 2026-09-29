-- ============================================================================
-- MIGRACIÓN 29: PICKING, PACKING Y DESPACHOS B2B (CATCH WEIGHT & WMS QR)
-- ============================================================================
-- Módulo: b2b-dispatch-wms
-- Arquitectura: Multi-Tenant RLS, Transacciones Atómicas y Bloqueo Pesimista
-- Dominio: Venta Dual (Unidades + Calibre vs Kilos Facturados), Trazabilidad FEFO y Cadena de Frío
-- ============================================================================

-- 1. TABLA: despachos_remisiones (Remisiones de Entrega WMS con Token QR)
CREATE TABLE IF NOT EXISTS public.despachos_remisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero_remision VARCHAR(50) NOT NULL,
    pedido_id VARCHAR(100) NOT NULL,
    cliente_id VARCHAR(100) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    transportista_nombre VARCHAR(150) NOT NULL,
    placa_vehiculo VARCHAR(20) NOT NULL,
    temperatura_salida_c NUMERIC(4, 1) NOT NULL,
    temperatura_llegada_c NUMERIC(4, 1),
    token_qr VARCHAR(64) NOT NULL UNIQUE,
    peso_total_neto_kg NUMERIC(12, 3) NOT NULL CHECK (peso_total_neto_kg > 0),
    piezas_totales INTEGER DEFAULT 0 CHECK (piezas_totales >= 0),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado VARCHAR(30) NOT NULL DEFAULT 'EN_RUTA' CHECK (estado IN ('EN_PREPARACION', 'LISTO', 'EN_RUTA', 'ENTREGADO', 'NOVEDAD')),
    firma_recibido_url TEXT,
    novedades TEXT,
    fecha_despacho TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_remision_empresa_numero UNIQUE(empresa_id, numero_remision)
);

-- 2. TABLA: pesajes_alistamiento_b2b (Auditoría Forense de Báscula y Calibre)
CREATE TABLE IF NOT EXISTS public.pesajes_alistamiento_b2b (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    pedido_id VARCHAR(100) NOT NULL,
    linea_pedido_id VARCHAR(100) NOT NULL,
    producto_id VARCHAR(100) NOT NULL,
    modalidad VARCHAR(30) NOT NULL DEFAULT 'PESO_DIRECTO' CHECK (modalidad IN ('PESO_DIRECTO', 'CATCH_WEIGHT_PIEZAS', 'UNIDADES_FIJAS')),
    peso_nominal_kg NUMERIC(10, 3) NOT NULL CHECK (peso_nominal_kg > 0),
    peso_real_kg NUMERIC(10, 3) NOT NULL CHECK (peso_real_kg > 0),
    piezas_solicitadas INTEGER,
    piezas_alistadas INTEGER,
    calibre_min_g NUMERIC(8, 2),
    calibre_max_g NUMERIC(8, 2),
    peso_promedio_pieza_g NUMERIC(8, 2),
    variacion_porcentaje NUMERIC(6, 2) NOT NULL,
    dentro_de_tolerancia BOOLEAN NOT NULL DEFAULT TRUE,
    precio_unitario_kg NUMERIC(14, 2) NOT NULL CHECK (precio_unitario_kg >= 0),
    subtotal_ajustado NUMERIC(14, 2) NOT NULL CHECK (subtotal_ajustado >= 0),
    temperatura_c NUMERIC(4, 1) NOT NULL,
    lote_fefo VARCHAR(100) NOT NULL,
    operario_id VARCHAR(100) NOT NULL,
    observaciones TEXT,
    pesado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 3. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_remisiones_empresa_estado ON public.despachos_remisiones (empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_remisiones_token_qr ON public.despachos_remisiones (token_qr);
CREATE INDEX IF NOT EXISTS idx_remisiones_pedido_id ON public.despachos_remisiones (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pesajes_pedido_linea ON public.pesajes_alistamiento_b2b (pedido_id, linea_pedido_id);
CREATE INDEX IF NOT EXISTS idx_pesajes_lote_fefo ON public.pesajes_alistamiento_b2b (lote_fefo);

-- 4. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.despachos_remisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesajes_alistamiento_b2b ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_despachos_remisiones_empresa_isolation ON public.despachos_remisiones;
CREATE POLICY p_despachos_remisiones_empresa_isolation ON public.despachos_remisiones
    FOR ALL
    USING (empresa_id = public.get_current_empresa_id())
    WITH CHECK (empresa_id = public.get_current_empresa_id());

DROP POLICY IF EXISTS p_pesajes_alistamiento_empresa_isolation ON public.pesajes_alistamiento_b2b;
CREATE POLICY p_pesajes_alistamiento_empresa_isolation ON public.pesajes_alistamiento_b2b
    FOR ALL
    USING (empresa_id = public.get_current_empresa_id())
    WITH CHECK (empresa_id = public.get_current_empresa_id());

-- Permitir lectura pública por token QR para la vista móvil del transportador y cliente
DROP POLICY IF EXISTS p_despachos_remisiones_qr_public_read ON public.despachos_remisiones;
CREATE POLICY p_despachos_remisiones_qr_public_read ON public.despachos_remisiones
    FOR SELECT
    USING (token_qr IS NOT NULL);

-- ============================================================================
-- 5. PROCEDIMIENTOS ALMACENADOS TRANSACCIONALES (RPCs)
-- ============================================================================

-- RPC 1: fn_conciliar_pesaje_b2b
-- Valida peso real, calcula calibre promedio, valida tolerancia y guarda auditoría.
CREATE OR REPLACE FUNCTION public.fn_conciliar_pesaje_b2b(
    p_pedido_id VARCHAR,
    p_linea_id VARCHAR,
    p_producto_id VARCHAR,
    p_modalidad VARCHAR,
    p_peso_nominal_kg NUMERIC,
    p_peso_real_kg NUMERIC,
    p_piezas_solicitadas INTEGER,
    p_piezas_alistadas INTEGER,
    p_calibre_min_g NUMERIC,
    p_calibre_max_g NUMERIC,
    p_precio_unitario_kg NUMERIC,
    p_tolerancia_pct NUMERIC,
    p_temperatura_c NUMERIC,
    p_lote_fefo VARCHAR,
    p_operario_id VARCHAR,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_diff_kg NUMERIC(10, 3);
    v_variacion_pct NUMERIC(6, 2);
    v_dentro_tolerancia BOOLEAN;
    v_peso_promedio_g NUMERIC(8, 2) := NULL;
    v_dentro_calibre BOOLEAN := TRUE;
    v_subtotal NUMERIC(14, 2);
    v_pesaje_id UUID;
BEGIN
    v_empresa_id := public.get_current_empresa_id();

    IF p_peso_real_kg <= 0 THEN
        RAISE EXCEPTION 'El peso real en báscula debe ser superior a 0 kg.';
    END IF;

    -- Cálculo de variación y tolerancia
    v_diff_kg := p_peso_real_kg - p_peso_nominal_kg;
    IF p_peso_nominal_kg > 0 THEN
        v_variacion_pct := ROUND(((v_diff_kg / p_peso_nominal_kg) * 100)::numeric, 2);
    ELSE
        v_variacion_pct := 0.00;
    END IF;

    v_dentro_tolerancia := ABS(v_variacion_pct) <= COALESCE(p_tolerancia_pct, 10.00);

    -- Validación de calibre en venta Catch Weight
    IF p_modalidad = 'CATCH_WEIGHT_PIEZAS' AND COALESCE(p_piezas_alistadas, 0) > 0 THEN
        v_peso_promedio_g := ROUND(((p_peso_real_kg * 1000) / p_piezas_alistadas)::numeric, 2);
        IF p_calibre_min_g IS NOT NULL AND v_peso_promedio_g < p_calibre_min_g THEN
            v_dentro_calibre := FALSE;
        END IF;
        IF p_calibre_max_g IS NOT NULL AND v_peso_promedio_g > p_calibre_max_g THEN
            v_dentro_calibre := FALSE;
        END IF;
    END IF;

    -- Subtotal exacto facturado por peso
    v_subtotal := ROUND((p_peso_real_kg * p_precio_unitario_kg)::numeric, 2);

    -- Registro en auditoría forense
    INSERT INTO public.pesajes_alistamiento_b2b (
        empresa_id,
        pedido_id,
        linea_pedido_id,
        producto_id,
        modalidad,
        peso_nominal_kg,
        peso_real_kg,
        piezas_solicitadas,
        piezas_alistadas,
        calibre_min_g,
        calibre_max_g,
        peso_promedio_pieza_g,
        variacion_porcentaje,
        dentro_de_tolerancia,
        precio_unitario_kg,
        subtotal_ajustado,
        temperatura_c,
        lote_fefo,
        operario_id,
        observaciones
    ) VALUES (
        v_empresa_id,
        p_pedido_id,
        p_linea_id,
        p_producto_id,
        COALESCE(p_modalidad, 'PESO_DIRECTO'),
        p_peso_nominal_kg,
        p_peso_real_kg,
        p_piezas_solicitadas,
        p_piezas_alistadas,
        p_calibre_min_g,
        p_calibre_max_g,
        v_peso_promedio_g,
        v_variacion_pct,
        v_dentro_tolerancia,
        p_precio_unitario_kg,
        v_subtotal,
        p_temperatura_c,
        p_lote_fefo,
        p_operario_id,
        p_observaciones
    ) RETURNING id INTO v_pesaje_id;

    RETURN jsonb_build_object(
        'success', true,
        'pesaje_id', v_pesaje_id,
        'peso_real_kg', p_peso_real_kg,
        'peso_promedio_pieza_g', v_peso_promedio_g,
        'dentro_calibre', v_dentro_calibre,
        'variacion_porcentaje', v_variacion_pct,
        'dentro_tolerancia', v_dentro_tolerancia,
        'subtotal_ajustado', v_subtotal,
        'lote_fefo', p_lote_fefo,
        'temperatura_c', p_temperatura_c
    );
END;
$$;

-- RPC 2: fn_crear_remision_despacho_wms
-- Genera la remisión numerada, calcula el token QR criptográfico y asocia items alistados.
CREATE OR REPLACE FUNCTION public.fn_crear_remision_despacho_wms(
    p_pedido_id VARCHAR,
    p_cliente_id VARCHAR,
    p_cliente_nombre VARCHAR,
    p_direccion_entrega TEXT,
    p_transportista_nombre VARCHAR,
    p_placa_vehiculo VARCHAR,
    p_temperatura_salida_c NUMERIC,
    p_peso_total_neto_kg NUMERIC,
    p_piezas_totales INTEGER,
    p_items JSONB,
    p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_remision_id UUID;
    v_consecutivo INT;
    v_numero_remision VARCHAR(50);
    v_token_qr VARCHAR(64);
BEGIN
    v_empresa_id := public.get_current_empresa_id();

    -- Generar consecutivo anual
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_consecutivo
    FROM public.despachos_remisiones
    WHERE empresa_id = v_empresa_id;

    v_numero_remision := 'REM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_consecutivo::text, 5, '0');
    v_token_qr := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.despachos_remisiones (
        empresa_id,
        numero_remision,
        pedido_id,
        cliente_id,
        cliente_nombre,
        direccion_entrega,
        transportista_nombre,
        placa_vehiculo,
        temperatura_salida_c,
        token_qr,
        peso_total_neto_kg,
        piezas_totales,
        items,
        estado,
        novedades,
        fecha_despacho
    ) VALUES (
        v_empresa_id,
        v_numero_remision,
        p_pedido_id,
        p_cliente_id,
        p_cliente_nombre,
        p_direccion_entrega,
        p_transportista_nombre,
        UPPER(TRIM(p_placa_vehiculo)),
        p_temperatura_salida_c,
        v_token_qr,
        p_peso_total_neto_kg,
        COALESCE(p_piezas_totales, 0),
        p_items,
        'EN_RUTA',
        p_notas,
        timezone('UTC', NOW())
    ) RETURNING id INTO v_remision_id;

    RETURN jsonb_build_object(
        'success', true,
        'remision_id', v_remision_id,
        'numero_remision', v_numero_remision,
        'token_qr', v_token_qr,
        'peso_total_neto_kg', p_peso_total_neto_kg,
        'temperatura_salida_c', p_temperatura_salida_c
    );
END;
$$;
