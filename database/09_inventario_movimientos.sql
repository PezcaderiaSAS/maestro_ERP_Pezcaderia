-- 09_inventario_movimientos.sql
-- Auditoría de movimientos de inventario (entradas, salidas, traslados, devoluciones, producción, ventas, ajustes)
-- FK a productos_catalogo y bodegas

-- 1. TIPO ENUM PARA TIPOS DE MOVIMIENTO
DO $$ BEGIN
    CREATE TYPE tipo_movimiento_inventario AS ENUM (
        'ENTRADA_COMPRA',
        'ENTRADA_DEVOLUCION',
        'ENTRADA_PRODUCCION',
        'SALIDA_VENTA',
        'SALIDA_PRODUCCION',
        'SALIDA_MERMA',
        'TRASLADO_SALIDA',
        'TRASLADO_ENTRADA',
        'AJUSTE_INVENTARIO'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: inventario_movimientos (Registro inmutable de cada cambio físico de stock)
CREATE TABLE IF NOT EXISTS inventario_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    tipo tipo_movimiento_inventario NOT NULL,
    sku VARCHAR(50) NOT NULL,                                        -- SKU en texto para legibilidad histórica
    nombre_producto VARCHAR(150) NOT NULL DEFAULT '',                 -- Desnormalizado para lectura histórica
    producto_id UUID REFERENCES productos_catalogo(id) ON DELETE RESTRICT,
    bodega_origen_id UUID REFERENCES bodegas(id) ON DELETE RESTRICT,
    bodega_destino_id UUID REFERENCES bodegas(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),            -- Siempre positivo; el tipo indica dirección
    lote VARCHAR(100) DEFAULT '',
    referencia_id VARCHAR(50),                                       -- ID de OrdenCompra, Venta, etc.
    referencia_tipo VARCHAR(30) CHECK (referencia_tipo IN (
        'ORDEN_COMPRA', 'VENTA', 'PRODUCCION', 'TRASLADO', 'DEVOLUCION', 'AJUSTE_MANUAL'
    )),
    actor VARCHAR(100) NOT NULL DEFAULT 'sistema',
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA CONSULTAS FRECUENTES
CREATE INDEX IF NOT EXISTS idx_movimientos_timestamp ON inventario_movimientos(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_sku ON inventario_movimientos(sku);
CREATE INDEX IF NOT EXISTS idx_movimientos_bodega_origen ON inventario_movimientos(bodega_origen_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_bodega_destino ON inventario_movimientos(bodega_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia ON inventario_movimientos(referencia_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON inventario_movimientos(producto_id);

-- 4. FUNCIÓN: Registrar movimiento con detección automática de SKU desde producto_id
CREATE OR REPLACE FUNCTION registrar_movimiento_inventario(
    p_tipo tipo_movimiento_inventario,
    p_producto_id UUID,
    p_bodega_origen_id UUID DEFAULT NULL,
    p_bodega_destino_id UUID DEFAULT NULL,
    p_cantidad NUMERIC(12,2) DEFAULT 0,
    p_lote VARCHAR(100) DEFAULT '',
    p_referencia_id VARCHAR(50) DEFAULT NULL,
    p_referencia_tipo VARCHAR(30) DEFAULT NULL,
    p_actor VARCHAR(100) DEFAULT 'sistema',
    p_notas TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_sku VARCHAR(50);
    v_nombre VARCHAR(150);
    v_mov_id UUID;
BEGIN
    -- Resolver SKU y nombre desde productos_catalogo
    SELECT sku, nombre INTO v_sku, v_nombre
    FROM productos_catalogo WHERE id = p_producto_id;

    IF v_sku IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado: %', p_producto_id;
    END IF;

    INSERT INTO inventario_movimientos (
        tipo, sku, nombre_producto, producto_id,
        bodega_origen_id, bodega_destino_id, cantidad, lote,
        referencia_id, referencia_tipo, actor, notas
    ) VALUES (
        p_tipo, v_sku, v_nombre, p_producto_id,
        p_bodega_origen_id, p_bodega_destino_id, p_cantidad, p_lote,
        p_referencia_id, p_referencia_tipo, p_actor, p_notas
    ) RETURNING id INTO v_mov_id;

    RETURN v_mov_id;
END;
$$ LANGUAGE plpgsql;

-- 5. VISTA: resumen_movimientos_por_periodo
CREATE OR REPLACE VIEW resumen_movimientos_por_periodo AS
SELECT
    DATE_TRUNC('day', timestamp) AS fecha,
    tipo,
    sku,
    nombre_producto,
    COUNT(*) AS total_movimientos,
    SUM(cantidad) AS cantidad_total
FROM inventario_movimientos
GROUP BY DATE_TRUNC('day', timestamp), tipo, sku, nombre_producto;
