-- 16_indexes_and_maintenance.sql
-- Índices compuestos, funciones de mantenimiento y validación de schema
-- Ejecutar al final de la migración Fase 0

-- 1. ÍNDICES COMPUESTOS PARA CONSULTAS FRECUENTES
CREATE INDEX IF NOT EXISTS idx_catalogo_activo_sku ON productos_catalogo(activo, sku) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_precios_producto_tipo ON productos_precios(producto_id, tipo_precio);
CREATE INDEX IF NOT EXISTS idx_movimientos_sku_timestamp ON inventario_movimientos(sku, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_timestamp ON inventario_movimientos(tipo, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cartera_cliente_estado ON cartera_facturas(cliente_id, estado);
CREATE INDEX IF NOT EXISTS idx_cartera_vencimiento_estado ON cartera_facturas(fecha_vencimiento, estado) WHERE estado IN ('PENDIENTE', 'PARCIAL', 'VENCIDA');
CREATE INDEX IF NOT EXISTS idx_oc_proveedor_estado ON ordenes_compra(proveedor_id, estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente_estado ON cotizaciones(cliente_id, estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_items_listo ON cotizaciones_items(cotizacion_id, listo);
CREATE INDEX IF NOT EXISTS idx_turnos_caja_estado ON turnos_caja(caja_id, estado, fecha_apertura DESC);
CREATE INDEX IF NOT EXISTS idx_movcaja_turno_tipo ON movimientos_caja(turno_id, tipo);

-- 2. FUNCIÓN: limpiar soft-deletes (mover a deleted_at después de N días)
CREATE OR REPLACE FUNCTION limpiar_soft_deletes(dias_retencion INTEGER DEFAULT 90)
RETURNS TABLE(tabla TEXT, registros_limpiados INTEGER) AS $$
DECLARE
    v_fecha_limite TIMESTAMP WITH TIME ZONE;
    v_count INTEGER;
    v_tablas TEXT[] := ARRAY[
        'cartera_facturas',
        'ordenes_compra',
        'cotizaciones',
        'turnos_caja',
        'devoluciones_pedidos'
    ];
    v_t TEXT;
BEGIN
    v_fecha_limite := NOW() - (dias_retencion || ' days')::INTERVAL;

    FOREACH v_t IN ARRAY v_tablas
    LOOP
        EXECUTE format(
            'WITH deleted AS (
                DELETE FROM %I WHERE deleted_at IS NOT NULL AND deleted_at < $1
                RETURNING 1
            ) SELECT COUNT(*) FROM deleted',
            v_t
        ) INTO v_count USING v_fecha_limite;

        tabla := v_t;
        registros_limpiados := v_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCIÓN: verificar integridad referencial de todas las tablas nuevas
CREATE OR REPLACE FUNCTION verificar_integridad_referencial()
RETURNS TABLE(tabla TEXT, registro_huérfano_id UUID, detalle TEXT) AS $$
BEGIN
    -- cartera_facturas → clientes
    RETURN QUERY
    SELECT 'cartera_facturas'::TEXT, cf.id, 'cliente_id no existe en clientes'
    FROM cartera_facturas cf
    LEFT JOIN clientes c ON c.id = cf.cliente_id
    WHERE c.id IS NULL AND cf.deleted_at IS NULL;

    -- ordenes_compra → proveedores
    RETURN QUERY
    SELECT 'ordenes_compra'::TEXT, oc.id, 'proveedor_id no existe en proveedores'
    FROM ordenes_compra oc
    LEFT JOIN proveedores p ON p.id = oc.proveedor_id
    WHERE p.id IS NULL AND oc.deleted_at IS NULL;

    -- cotizaciones → clientes
    RETURN QUERY
    SELECT 'cotizaciones'::TEXT, c.id, 'cliente_id no existe en clientes'
    FROM cotizaciones c
    LEFT JOIN clientes cl ON cl.id = c.cliente_id
    WHERE cl.id IS NULL AND c.cliente_id IS NOT NULL AND c.deleted_at IS NULL;

    -- turnos_caja → cajas
    RETURN QUERY
    SELECT 'turnos_caja'::TEXT, tc.id, 'caja_id no existe en cajas'
    FROM turnos_caja tc
    LEFT JOIN cajas ca ON ca.id = tc.caja_id
    WHERE ca.id IS NULL AND tc.deleted_at IS NULL;

    -- movimientos_caja → turnos_caja
    RETURN QUERY
    SELECT 'movimientos_caja'::TEXT, mc.id, 'turno_id no existe en turnos_caja'
    FROM movimientos_caja mc
    LEFT JOIN turnos_caja tc ON tc.id = mc.turno_id
    WHERE tc.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. VISTA: schema_version (registro de migraciones aplicadas)
CREATE OR REPLACE VIEW schema_migraciones AS
SELECT '08_productos_catalogo_precios' AS migracion, NOW() AS aplicada
UNION ALL
SELECT '09_inventario_movimientos', NOW()
UNION ALL
SELECT '10_cartera', NOW()
UNION ALL
SELECT '11_ordenes_compra', NOW()
UNION ALL
SELECT '12_cotizaciones', NOW()
UNION ALL
SELECT '13_devoluciones_ext', NOW()
UNION ALL
SELECT '14_cajas_ext', NOW()
UNION ALL
SELECT '15_rls_nuevas_tablas', NOW()
UNION ALL
SELECT '16_indexes_and_maintenance', NOW();
