-- ============================================================================
-- MIGRACIÓN 30: TRASLADOS INTERNOS DE INVENTARIO Y REABASTECIMIENTO POS
-- ============================================================================
-- Módulo: internal-transfers-pos
-- Dominio: Bodega Principal (Picking/Lote FEFO) -> Punto de Venta POS (Checklist/Novedades)
-- Arquitectura: Multi-Tenant RLS, Transacciones Atómicas y Asiento Doble en Kardex
-- ============================================================================

-- 1. TABLA: traslados_internos (Cabecera de la Guía)
CREATE TABLE IF NOT EXISTS public.traslados_internos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero_guia VARCHAR(50) NOT NULL,
    bodega_origen_id VARCHAR(100) NOT NULL,
    bodega_origen_nombre VARCHAR(150) NOT NULL,
    bodega_destino_id VARCHAR(100) NOT NULL,
    bodega_destino_nombre VARCHAR(150) NOT NULL,
    prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (prioridad IN ('NORMAL', 'URGENTE', 'CRITICA')),
    estado VARCHAR(30) NOT NULL DEFAULT 'SOLICITADO' CHECK (estado IN ('SOLICITADO', 'EN_ALISTAMIENTO', 'EN_TRANSITO', 'RECIBIDO', 'RECIBIDO_CON_NOVEDAD', 'CANCELADO')),
    solicitado_por VARCHAR(100) NOT NULL,
    despachado_por VARCHAR(100),
    recibido_por VARCHAR(100),
    temperatura_despacho_c NUMERIC(4, 1),
    peso_solicitado_total_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    peso_despachado_total_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    peso_recibido_total_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    tiene_novedades BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT,
    observaciones_despacho TEXT,
    observaciones_recepcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    despachado_en TIMESTAMP WITH TIME ZONE,
    recibido_en TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_traslado_empresa_guia UNIQUE(empresa_id, numero_guia)
);

-- 2. TABLA: traslados_internos_items (Líneas de Detalle de Producto)
CREATE TABLE IF NOT EXISTS public.traslados_internos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    traslado_id UUID NOT NULL REFERENCES public.traslados_internos(id) ON DELETE CASCADE,
    producto_id VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    nombre_producto VARCHAR(200) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'KG',
    cantidad_solicitada NUMERIC(10, 3) NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_despachada NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (cantidad_despachada >= 0),
    cantidad_recibida NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (cantidad_recibida >= 0),
    costo_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    lote_fefo VARCHAR(100),
    fecha_vencimiento_lote DATE,
    temperatura_c NUMERIC(4, 1),
    estado_item VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_item IN ('PENDIENTE', 'ALISTADO', 'FALTANTE_ORIGEN', 'INCOMPLETO', 'RECIBIDO_OK', 'RECIBIDO_DISCREPANCIA')),
    conforme BOOLEAN NOT NULL DEFAULT TRUE,
    novedad_motivo VARCHAR(50) CHECK (novedad_motivo IS NULL OR novedad_motivo IN ('DIFERENCIA_PESO', 'ROTURA_EMPAQUE', 'AGOTADO_BODEGA', 'NO_ENTREGADO', 'CALIDAD_DEFICIENTE', 'OTRO')),
    novedad_detalle TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 3. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_traslados_empresa_estado ON public.traslados_internos(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_traslados_fechas ON public.traslados_internos(empresa_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_traslados_items_traslado ON public.traslados_internos_items(traslado_id);
CREATE INDEX IF NOT EXISTS idx_traslados_items_prod ON public.traslados_internos_items(empresa_id, producto_id);

-- 4. SEGURIDAD RLS MULTI-TENANT
ALTER TABLE public.traslados_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traslados_internos_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'traslados_internos' AND policyname = 'traslados_internos_tenant_isolation'
    ) THEN
        CREATE POLICY traslados_internos_tenant_isolation ON public.traslados_internos
            FOR ALL USING (empresa_id = public.get_current_empresa_id());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'traslados_internos_items' AND policyname = 'traslados_items_tenant_isolation'
    ) THEN
        CREATE POLICY traslados_items_tenant_isolation ON public.traslados_internos_items
            FOR ALL USING (empresa_id = public.get_current_empresa_id());
    END IF;
END $$;

-- 5. RPC TRANSACCIONAL: fn_crear_solicitud_traslado_pos
CREATE OR REPLACE FUNCTION public.fn_crear_solicitud_traslado_pos(
    p_bodega_origen_id VARCHAR(100),
    p_bodega_origen_nombre VARCHAR(150),
    p_bodega_destino_id VARCHAR(100),
    p_bodega_destino_nombre VARCHAR(150),
    p_prioridad VARCHAR(20),
    p_solicitado_por VARCHAR(100),
    p_observaciones TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_traslado_id UUID;
    v_numero_guia VARCHAR(50);
    v_item RECORD;
    v_total_solicitado NUMERIC(10, 3) := 0;
    v_contador INTEGER;
BEGIN
    v_empresa_id := public.get_current_empresa_id();

    IF p_bodega_origen_id = p_bodega_destino_id THEN
        RAISE EXCEPTION 'La bodega origen y destino no pueden ser iguales';
    END IF;

    -- Conteo para correlativo de guía
    SELECT COUNT(*) + 1 INTO v_contador 
    FROM public.traslados_internos 
    WHERE empresa_id = v_empresa_id;

    v_numero_guia := 'TRF-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(v_contador::text, 3, '0');

    -- Insertar Encabezado
    INSERT INTO public.traslados_internos (
        empresa_id,
        numero_guia,
        bodega_origen_id,
        bodega_origen_nombre,
        bodega_destino_id,
        bodega_destino_nombre,
        prioridad,
        estado,
        solicitado_por,
        observaciones
    ) VALUES (
        v_empresa_id,
        v_numero_guia,
        p_bodega_origen_id,
        p_bodega_origen_nombre,
        p_bodega_destino_id,
        p_bodega_destino_nombre,
        COALESCE(p_prioridad, 'NORMAL'),
        'SOLICITADO',
        p_solicitado_por,
        p_observaciones
    ) RETURNING id INTO v_traslado_id;

    -- Insertar Items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        "productoId" VARCHAR,
        "sku" VARCHAR,
        "nombre" VARCHAR,
        "unidadMedida" VARCHAR,
        "cantidadSolicitada" NUMERIC,
        "costoUnitario" NUMERIC
    )
    LOOP
        INSERT INTO public.traslados_internos_items (
            empresa_id,
            traslado_id,
            producto_id,
            sku,
            nombre_producto,
            unidad_medida,
            cantidad_solicitada,
            costo_unitario,
            estado_item
        ) VALUES (
            v_empresa_id,
            v_traslado_id,
            v_item."productoId",
            v_item."sku",
            v_item."nombre",
            COALESCE(v_item."unidadMedida", 'KG'),
            v_item."cantidadSolicitada",
            COALESCE(v_item."costoUnitario", 0),
            'PENDIENTE'
        );

        v_total_solicitado := v_total_solicitado + v_item."cantidadSolicitada";
    END LOOP;

    UPDATE public.traslados_internos
    SET peso_solicitado_total_kg = v_total_solicitado
    WHERE id = v_traslado_id;

    RETURN jsonb_build_object(
        'success', true,
        'trasladoId', v_traslado_id,
        'numeroGuia', v_numero_guia,
        'estado', 'SOLICITADO'
    );
END;
$$;

-- 6. RPC TRANSACCIONAL: fn_confirmar_recepcion_traslado_pos
CREATE OR REPLACE FUNCTION public.fn_confirmar_recepcion_traslado_pos(
    p_traslado_id UUID,
    p_recibido_por VARCHAR(100),
    p_items_recepcion JSONB,
    p_observaciones_recepcion TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_traslado RECORD;
    v_item RECORD;
    v_total_recibido NUMERIC(10, 3) := 0;
    v_tiene_novedades BOOLEAN := FALSE;
    v_nuevo_estado VARCHAR(30);
BEGIN
    v_empresa_id := public.get_current_empresa_id();

    SELECT * INTO v_traslado
    FROM public.traslados_internos
    WHERE id = p_traslado_id AND empresa_id = v_empresa_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Guía de traslado no encontrada o acceso denegado';
    END IF;

    IF v_traslado.estado NOT IN ('EN_TRANSITO', 'EN_ALISTAMIENTO') THEN
        RAISE EXCEPTION 'El traslado se encuentra en estado %, no apto para recepción', v_traslado.estado;
    END IF;

    -- Actualizar cada item verificado en el checklist
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items_recepcion) AS x(
        "productoId" VARCHAR,
        "cantidadRecibida" NUMERIC,
        "conforme" BOOLEAN,
        "novedadMotivo" VARCHAR,
        "novedadDetalle" TEXT
    )
    LOOP
        UPDATE public.traslados_internos_items
        SET
            cantidad_recibida = v_item."cantidadRecibida",
            conforme = v_item."conforme",
            novedad_motivo = v_item."novedadMotivo",
            novedad_detalle = v_item."novedadDetalle",
            estado_item = CASE WHEN v_item."conforme" = TRUE THEN 'RECIBIDO_OK' ELSE 'RECIBIDO_DISCREPANCIA' END
        WHERE traslado_id = p_traslado_id
          AND producto_id = v_item."productoId"
          AND empresa_id = v_empresa_id;

        v_total_recibido := v_total_recibido + v_item."cantidadRecibida";

        IF v_item."conforme" = FALSE OR v_item."novedadMotivo" IS NOT NULL THEN
            v_tiene_novedades := TRUE;
        END IF;
    END LOOP;

    v_nuevo_estado := CASE WHEN v_tiene_novedades THEN 'RECIBIDO_CON_NOVEDAD' ELSE 'RECIBIDO' END;

    UPDATE public.traslados_internos
    SET
        estado = v_nuevo_estado,
        recibido_por = p_recibido_por,
        peso_recibido_total_kg = v_total_recibido,
        tiene_novedades = v_tiene_novedades,
        observaciones_recepcion = p_observaciones_recepcion,
        recibido_en = timezone('UTC', NOW()),
        actualizado_en = timezone('UTC', NOW())
    WHERE id = p_traslado_id;

    RETURN jsonb_build_object(
        'success', true,
        'trasladoId', p_traslado_id,
        'nuevoEstado', v_nuevo_estado,
        'pesoRecibidoTotal', v_total_recibido,
        'tieneNovedades', v_tiene_novedades
    );
END;
$$;
