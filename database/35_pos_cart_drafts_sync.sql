-- ============================================================================
-- MIGRACIÓN 35: SINCRONIZACIÓN Y PERSISTENCIA DE BORRADORES / CARROS EN ESPERA POS
-- ============================================================================
-- Módulo: pos-cart-drafts-sync
-- Arquitectura: Supabase / PostgreSQL 15+, Multi-Tenant RLS, JSONB y Bloqueo Pesimista
-- TTL: 48 horas de caducidad automática para carritos abandonados
-- ============================================================================

-- 1. TABLA: pos_drafts (Borradores y Pedidos en Espera de Mostrador POS)
CREATE TABLE IF NOT EXISTS public.pos_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    cajero_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cajero_nombre VARCHAR(120),
    alias VARCHAR(100) NOT NULL DEFAULT 'Borrador Mostrador',
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    
    -- Snapshot estructurado del carrito
    lineas JSONB NOT NULL DEFAULT '[]'::jsonb,
    descuento_global NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (descuento_global >= 0 AND descuento_global <= 100),
    total_estimado NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_estimado >= 0),
    
    -- Ciclo de vida y caducidad
    estado VARCHAR(20) NOT NULL DEFAULT 'EN_ESPERA' CHECK (estado IN ('EN_ESPERA', 'RECUPERADO', 'DESCARTADO')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    
    -- Metadatos de auditoría
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    
    -- Validación de consistencia JSONB (debe ser un arreglo)
    CONSTRAINT chk_pos_drafts_lineas_is_array CHECK (jsonb_typeof(lineas) = 'array')
);

COMMENT ON TABLE public.pos_drafts IS 'Almacén de carritos en espera y borradores de ventas POS con TTL automático de 48 horas.';
COMMENT ON COLUMN public.pos_drafts.lineas IS 'Array JSON con {productoId, sku, nombre, cantidad, precioFinal, totalLinea, etc.}';

-- 2. ÍNDICES DE RENDIMIENTO Y PURGA EFICIENTE
CREATE INDEX IF NOT EXISTS idx_pos_drafts_empresa_estado 
    ON public.pos_drafts (empresa_id, estado) 
    WHERE estado = 'EN_ESPERA';

CREATE INDEX IF NOT EXISTS idx_pos_drafts_expires_at 
    ON public.pos_drafts (expires_at) 
    WHERE estado = 'EN_ESPERA';

CREATE INDEX IF NOT EXISTS idx_pos_drafts_cajero 
    ON public.pos_drafts (cajero_id, empresa_id);

-- 3. HABILITACIÓN DE SEGURIDAD MULTI-TENANT (RLS)
ALTER TABLE public.pos_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_pos_drafts_tenant_isolation ON public.pos_drafts;

CREATE POLICY p_pos_drafts_tenant_isolation ON public.pos_drafts
    FOR ALL
    USING (empresa_id = public.get_current_empresa_id())
    WITH CHECK (empresa_id = public.get_current_empresa_id());

-- 4. FUNCIÓN RPC: GESTIÓN TRANSACCIONAL IDEMPOTENTE CON BLOQUEO PESIMISTA
CREATE OR REPLACE FUNCTION public.manage_pos_draft(
    p_draft_id UUID DEFAULT NULL,
    p_alias VARCHAR(100) DEFAULT 'Borrador Mostrador',
    p_cliente_id UUID DEFAULT NULL,
    p_lineas JSONB DEFAULT '[]'::jsonb,
    p_descuento_global NUMERIC DEFAULT 0.00,
    p_total_estimado NUMERIC DEFAULT 0.00,
    p_cajero_nombre VARCHAR(120) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_empresa_id UUID;
    v_cajero_id UUID;
    v_result_id UUID;
BEGIN
    -- 1. Resolver contexto tenant y usuario autenticado
    v_empresa_id := public.get_current_empresa_id();
    v_cajero_id := auth.uid();

    -- 2. Validar estructura de líneas
    IF jsonb_typeof(p_lineas) <> 'array' THEN
        RAISE EXCEPTION 'El parámetro p_lineas debe ser un arreglo JSON válido.';
    END IF;

    -- 3. Si se proporciona un ID existente, bloquear y actualizar
    IF p_draft_id IS NOT NULL THEN
        -- Bloqueo pesimista NOWAIT para prevenir concurrencia si otro terminal intenta alterarlo simultáneamente
        PERFORM id 
        FROM public.pos_drafts
        WHERE id = p_draft_id AND empresa_id = v_empresa_id
        FOR UPDATE NOWAIT;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El borrador con ID % no existe o no pertenece a la empresa actual.', p_draft_id;
        END IF;

        UPDATE public.pos_drafts
        SET 
            alias = COALESCE(p_alias, alias),
            cliente_id = p_cliente_id,
            lineas = p_lineas,
            descuento_global = COALESCE(p_descuento_global, 0.00),
            total_estimado = COALESCE(p_total_estimado, 0.00),
            cajero_id = COALESCE(v_cajero_id, cajero_id),
            cajero_nombre = COALESCE(p_cajero_nombre, cajero_nombre),
            estado = 'EN_ESPERA',
            expires_at = NOW() + INTERVAL '48 hours', -- Renovación de TTL
            actualizado_en = timezone('UTC', NOW())
        WHERE id = p_draft_id AND empresa_id = v_empresa_id
        RETURNING id INTO v_result_id;

        RETURN v_result_id;
    ELSE
        -- 4. Creación de un nuevo borrador / pedido en espera
        INSERT INTO public.pos_drafts (
            empresa_id,
            cajero_id,
            cajero_nombre,
            alias,
            cliente_id,
            lineas,
            descuento_global,
            total_estimado,
            estado,
            expires_at
        ) VALUES (
            v_empresa_id,
            v_cajero_id,
            p_cajero_nombre,
            COALESCE(p_alias, 'Borrador Mostrador'),
            p_cliente_id,
            p_lineas,
            COALESCE(p_descuento_global, 0.00),
            COALESCE(p_total_estimado, 0.00),
            'EN_ESPERA',
            NOW() + INTERVAL '48 hours'
        )
        RETURNING id INTO v_result_id;

        RETURN v_result_id;
    END IF;

EXCEPTION
    WHEN lock_not_available THEN
        RAISE EXCEPTION 'El pedido en espera está siendo editado o cobrado en otra terminal (Recurso bloqueado).';
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN RPC: RECUPERAR O MARCAR BORRADOR COMO COMPLETADO / DESCARTADO
CREATE OR REPLACE FUNCTION public.resolve_pos_draft(
    p_draft_id UUID,
    p_nuevo_estado VARCHAR(20) -- 'RECUPERADO' o 'DESCARTADO'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    v_empresa_id := public.get_current_empresa_id();

    IF p_nuevo_estado NOT IN ('RECUPERADO', 'DESCARTADO') THEN
        RAISE EXCEPTION 'Estado no permitido. Debe ser RECUPERADO o DESCARTADO.';
    END IF;

    -- Bloqueo pesimista para evitar doble consumo
    PERFORM id 
    FROM public.pos_drafts
    WHERE id = p_draft_id AND empresa_id = v_empresa_id
    FOR UPDATE NOWAIT;

    UPDATE public.pos_drafts
    SET 
        estado = p_nuevo_estado,
        actualizado_en = timezone('UTC', NOW())
    WHERE id = p_draft_id AND empresa_id = v_empresa_id;

    RETURN TRUE;
EXCEPTION
    WHEN lock_not_available THEN
        RAISE EXCEPTION 'El borrador está siendo procesado en este momento por otro cajero.';
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RUTINA DE PURGA DE BORRADORES EXPIRADOS O DESCARTADOS (> 48h)
CREATE OR REPLACE FUNCTION public.cleanup_expired_pos_drafts(
    p_empresa_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.pos_drafts
    WHERE 
        (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
        AND (
            expires_at < NOW() 
            OR (estado IN ('RECUPERADO', 'DESCARTADO') AND actualizado_en < NOW() - INTERVAL '24 hours')
        );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. PROGRAMACIÓN PG_CRON (Si la extensión está disponible en Supabase)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'pos-drafts-daily-purge',
            '0 3 * * *', -- Todos los días a las 03:00 AM UTC
            'SELECT public.cleanup_expired_pos_drafts();'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Si pg_cron no está disponible o falta permiso, se ignora silenciosamente
        NULL;
END;
$$;
