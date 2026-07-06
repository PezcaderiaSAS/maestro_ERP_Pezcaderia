-- 08_productos_catalogo_precios.sql
-- Separación del catálogo de productos en entidad + precios históricos (F3)
-- Preserva la tabla legacy `productos` intacta para compatibilidad

-- 1. CREAR EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: productos_catalogo (Información base del producto, independiente del precio)
CREATE TABLE IF NOT EXISTS productos_catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(50) UNIQUE,                        -- ID de localStorage (ej: 'p-1') para migración
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(10) CHECK (unidad_medida IN ('kg', 'und', 'lb', 'gr')),
    imagen TEXT,
    codigo_barras VARCHAR(100),
    iva NUMERIC(5,2) DEFAULT 0.00,
    iva_incluido BOOLEAN DEFAULT true,
    control_inventario BOOLEAN DEFAULT true,
    produccion BOOLEAN DEFAULT false,
    categoria_abc VARCHAR(1) CHECK (categoria_abc IN ('A', 'B', 'C')),
    activo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. TABLA: productos_precios (Historial de precios con vigencia)
CREATE TABLE IF NOT EXISTS productos_precios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos_catalogo(id) ON DELETE CASCADE,
    vigencia_desde TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    precio_compra NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_compra >= 0),
    buffer_seguridad NUMERIC(12,2) DEFAULT 0.00 CHECK (buffer_seguridad >= 0),
    precio_venta_pos NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_venta_pos >= 0),
    precio_venta_restaurante NUMERIC(12,2) DEFAULT 0.00 CHECK (precio_venta_restaurante >= 0),
    precio_venta_mayorista NUMERIC(12,2) DEFAULT 0.00 CHECK (precio_venta_mayorista >= 0),
    actualizado_por VARCHAR(100),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_producto_vigencia UNIQUE (producto_id, vigencia_desde)
);

CREATE INDEX IF NOT EXISTS idx_productos_precios_producto ON productos_precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_precios_vigencia ON productos_precios(vigencia_desde DESC);

-- 4. VISTA: productos_unified (Joins catálogo + precio vigente, emula Product interface de App.tsx)
CREATE OR REPLACE VIEW productos_unified AS
SELECT
    pc.id,
    pc.legacy_id,
    pc.sku,
    pc.nombre,
    pc.categoria,
    pc.unidad_medida,
    pc.imagen,
    pc.codigo_barras,
    pc.iva,
    pc.iva_incluido,
    pc.control_inventario,
    pc.produccion,
    pc.categoria_abc,
    pc.activo,
    pc.metadata,
    COALESCE(pp.precio_compra, 0) AS precio_compra,
    COALESCE(pp.buffer_seguridad, 0) AS buffer_seguridad,
    COALESCE(pp.precio_venta_pos, 0) AS precio_venta_pos,
    COALESCE(pp.precio_venta_restaurante, 0) AS precio_venta_restaurante,
    COALESCE(pp.precio_venta_mayorista, 0) AS precio_venta_mayorista,
    pp.id AS precio_id,
    pp.vigencia_desde,
    pp.actualizado_por,
    pc.creado_en,
    pc.actualizado_en
FROM productos_catalogo pc
LEFT JOIN LATERAL (
    SELECT * FROM productos_precios
    WHERE producto_id = pc.id
    ORDER BY vigencia_desde DESC
    LIMIT 1
) pp ON true
WHERE pc.deleted_at IS NULL;

-- 5. MIGRACIÓN: Poblar desde tabla legacy `productos` si existe y productos_catalogo está vacío
INSERT INTO productos_catalogo (
    legacy_id, sku, nombre, categoria, activo, metadata, creado_en
)
SELECT
    p.id::text AS legacy_id,
    p.sku,
    p.nombre,
    p.categoria,
    p.activo,
    jsonb_build_object(
        'migrated_from', 'productos_legacy',
        'legacy_precio_compra', p.precio_compra,
        'legacy_precio_venta_pos', p.precio_venta_pos,
        'legacy_precio_venta_restaurante', p.precio_venta_restaurante,
        'legacy_precio_venta_mayorista', p.precio_venta_mayorista,
        'legacy_buffer_seguridad', p.buffer_seguridad
    ),
    p.creado_en
FROM productos p
WHERE NOT EXISTS (SELECT 1 FROM productos_catalogo WHERE sku = p.sku);

-- Poblar precios iniciales desde legacy (primer precio histórico)
INSERT INTO productos_precios (producto_id, vigencia_desde, precio_compra, buffer_seguridad, precio_venta_pos, precio_venta_restaurante, precio_venta_mayorista, actualizado_por)
SELECT
    pc.id,
    COALESCE(p.creado_en, NOW()),
    COALESCE((pc.metadata->>'legacy_precio_compra')::numeric, 0),
    COALESCE((pc.metadata->>'legacy_buffer_seguridad')::numeric, 0),
    COALESCE((pc.metadata->>'legacy_precio_venta_pos')::numeric, 0),
    COALESCE((pc.metadata->>'legacy_precio_venta_restaurante')::numeric, 0),
    COALESCE((pc.metadata->>'legacy_precio_venta_mayorista')::numeric, 0),
    'system-migration'
FROM productos_catalogo pc
WHERE pc.legacy_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM productos_precios WHERE producto_id = pc.id);

-- 6. FUNCIÓN DE SINCRONIZACIÓN: productos_catalogo → productos (legacy)
-- Llamada explícitamente desde syncService cuando VITE_SYNC_LEGACY_PRODUCTS=true
CREATE OR REPLACE FUNCTION sync_catalogo_to_legacy(p_sku TEXT, p_nombre TEXT, p_categoria TEXT, p_activo BOOLEAN)
RETURNS void AS $$
BEGIN
    INSERT INTO productos (sku, nombre, categoria, activo)
    VALUES (p_sku, p_nombre, p_categoria, p_activo)
    ON CONFLICT (sku) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        categoria = EXCLUDED.categoria,
        activo = EXCLUDED.activo;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN DE SINCRONIZACIÓN INVERSA: productos (legacy) → productos_catalogo
CREATE OR REPLACE FUNCTION sync_legacy_to_catalogo()
RETURNS void AS $$
BEGIN
    INSERT INTO productos_catalogo (sku, nombre, categoria, activo)
    SELECT sku, nombre, categoria, activo
    FROM productos p
    WHERE p.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM productos_catalogo pc WHERE pc.sku = p.sku)
      AND p.sku IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. VISTA: id_mapping (Mapeo legacy_id → UUID para migración)
CREATE OR REPLACE VIEW id_mapping AS
SELECT 'producto' AS entidad, legacy_id AS id_legacy, id::text AS id_uuid
FROM productos_catalogo WHERE legacy_id IS NOT NULL;
