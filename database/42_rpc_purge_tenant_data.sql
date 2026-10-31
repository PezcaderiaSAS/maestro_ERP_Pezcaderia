-- ==============================================================================
-- MIGRACIÓN 42: RPC DE PURGA Y LIMPIEZA TRANSACCIONAL POR TENANT
-- Módulo: SPEC-049 (La Pezcadería ERP - Optimización de Rendimiento & Purga Dev)
-- Fecha: 2026-10-31
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_purge_tenant_data(p_tenant_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_uuid UUID;
    v_count_prefacturas INT := 0;
    v_count_items_prefactura INT := 0;
    v_count_drafts INT := 0;
    v_count_transacciones INT := 0;
    v_count_movimientos INT := 0;
BEGIN
    IF p_tenant_id IS NULL OR trim(p_tenant_id) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'mensaje', 'El parámetro p_tenant_id es obligatorio.'
        );
    END IF;

    -- 1. Resolver UUID de tenant si existe en tabla tenants
    BEGIN
        v_tenant_uuid := p_tenant_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        SELECT id INTO v_tenant_uuid
        FROM public.tenants
        WHERE nit = p_tenant_id OR razon_social ILIKE '%' || p_tenant_id || '%'
        LIMIT 1;
    END;

    -- 2. Purga en tablas transaccionales de preventas (SPEC-037)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pos_items_prefactura') THEN
        IF v_tenant_uuid IS NOT NULL THEN
            DELETE FROM public.pos_items_prefactura WHERE tenant_id = v_tenant_uuid;
        ELSE
            DELETE FROM public.pos_items_prefactura WHERE tenant_id::TEXT = p_tenant_id;
        END IF;
        GET DIAGNOSTICS v_count_items_prefactura = ROW_COUNT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pos_prefacturas') THEN
        IF v_tenant_uuid IS NOT NULL THEN
            DELETE FROM public.pos_prefacturas WHERE tenant_id = v_tenant_uuid;
        ELSE
            DELETE FROM public.pos_prefacturas WHERE tenant_id::TEXT = p_tenant_id;
        END IF;
        GET DIAGNOSTICS v_count_prefacturas = ROW_COUNT;
    END IF;

    -- 3. Purga en borradores de compras/mostrador POS (SPEC-035)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pos_drafts') THEN
        IF v_tenant_uuid IS NOT NULL THEN
            DELETE FROM public.pos_drafts WHERE empresa_id = v_tenant_uuid;
        ELSE
            DELETE FROM public.pos_drafts WHERE empresa_id::TEXT = p_tenant_id;
        END IF;
        GET DIAGNOSTICS v_count_drafts = ROW_COUNT;
    END IF;

    -- 4. Purga de transacciones de caja de prueba
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transacciones_caja') THEN
        IF v_tenant_uuid IS NOT NULL THEN
            DELETE FROM public.transacciones_caja WHERE tenant_id = v_tenant_uuid;
        ELSE
            DELETE FROM public.transacciones_caja WHERE tenant_id::TEXT = p_tenant_id;
        END IF;
        GET DIAGNOSTICS v_count_transacciones = ROW_COUNT;
    END IF;

    -- 5. Purga de movimientos de kardex temporales
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventario_movimientos') THEN
        IF v_tenant_uuid IS NOT NULL THEN
            DELETE FROM public.inventario_movimientos WHERE tenant_id = v_tenant_uuid;
        ELSE
            DELETE FROM public.inventario_movimientos WHERE tenant_id::TEXT = p_tenant_id;
        END IF;
        GET DIAGNOSTICS v_count_movimientos = ROW_COUNT;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', p_tenant_id,
        'tenant_uuid', v_tenant_uuid,
        'items_prefactura_eliminados', v_count_items_prefactura,
        'prefacturas_eliminadas', v_count_prefacturas,
        'drafts_eliminados', v_count_drafts,
        'transacciones_eliminadas', v_count_transacciones,
        'movimientos_eliminados', v_count_movimientos,
        'mensaje', 'Purga transaccional remota completada con éxito',
        'purged_at', now()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'tenant_id', p_tenant_id,
        'error', SQLERRM,
        'mensaje', 'Error ejecutando la purga remota en Supabase'
    );
END;
$$;

-- Permisos de ejecución controlada para usuarios autenticados y desarrollo
GRANT EXECUTE ON FUNCTION public.rpc_purge_tenant_data(TEXT) TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.rpc_purge_tenant_data(TEXT) IS 
'Purga transaccional segura y acotada por tenant de datos de preventas, borradores y movimientos de prueba.';
