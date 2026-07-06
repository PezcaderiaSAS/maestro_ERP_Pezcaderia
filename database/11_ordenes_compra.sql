-- 11_ordenes_compra.sql
-- Órdenes de compra a proveedores y sus líneas de detalle
-- Normaliza el array embebido `items[]` del tipo OrdenCompra en tabla hija

-- 1. TIPO ENUM
DO $$ BEGIN
    CREATE TYPE estado_orden_compra AS ENUM ('PENDIENTE', 'ENVIADA', 'PARCIAL', 'RECIBIDA', 'CANCELADA');
    CREATE TYPE forma_pago_oc AS ENUM ('CONTADO', 'CREDITO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: ordenes_compra (Cabecera)
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(50) UNIQUE,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    proveedor_nombre VARCHAR(255) NOT NULL DEFAULT '',
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    estado estado_orden_compra NOT NULL DEFAULT 'PENDIENTE',
    subtotal NUMERIC(12,2) DEFAULT 0,
    iva NUMERIC(5,2) DEFAULT 0,                     -- Porcentaje de IVA (ej: 19.00)
    valor_iva NUMERIC(12,2) DEFAULT 0,
    fletes NUMERIC(12,2) DEFAULT 0,
    total_compra NUMERIC(12,2) NOT NULL DEFAULT 0,
    forma_pago forma_pago_oc DEFAULT 'CONTADO',
    saldo NUMERIC(12,2) DEFAULT 0,                  -- Saldo pendiente para cuentas por pagar (AP)
    bodega_destino VARCHAR(100) NOT NULL DEFAULT '',
    bodega_destino_id UUID REFERENCES bodegas(id) ON DELETE RESTRICT,
    actor VARCHAR(100) NOT NULL DEFAULT 'sistema',
    notas TEXT,
    idempotency_key UUID UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_oc_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_oc_estado ON ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_oc_fecha ON ordenes_compra(fecha DESC);

-- 3. TABLA: ordenes_compra_items (Líneas de detalle)
CREATE TABLE IF NOT EXISTS ordenes_compra_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos_catalogo(id) ON DELETE RESTRICT,
    sku VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL DEFAULT '',
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    lote VARCHAR(100) DEFAULT '',
    total_linea NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oc_items_oc ON ordenes_compra_items(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_oc_items_producto ON ordenes_compra_items(producto_id);

-- 4. FUNCIÓN: Calcular totales y actualizar cabecera automáticamente
CREATE OR REPLACE FUNCTION actualizar_totales_oc(p_oc_id UUID) RETURNS void AS $$
DECLARE
    v_subtotal NUMERIC(12,2);
    v_iva_porc NUMERIC(5,2);
    v_valor_iva NUMERIC(12,2);
    v_fletes NUMERIC(12,2);
    v_total NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(total_linea), 0)
    INTO v_subtotal
    FROM ordenes_compra_items
    WHERE orden_compra_id = p_oc_id;

    SELECT iva, fletes INTO v_iva_porc, v_fletes
    FROM ordenes_compra WHERE id = p_oc_id;

    v_valor_iva := ROUND(v_subtotal * (v_iva_porc / 100), 2);
    v_total := v_subtotal + v_valor_iva + COALESCE(v_fletes, 0);

    UPDATE ordenes_compra
    SET subtotal = v_subtotal,
        valor_iva = v_valor_iva,
        total_compra = v_total,
        actualizado_en = NOW()
    WHERE id = p_oc_id;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER: Recalcular totales después de INSERT/UPDATE/DELETE en items
CREATE OR REPLACE FUNCTION trg_oc_recalcular_totales()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM actualizar_totales_oc(COALESCE(NEW.orden_compra_id, OLD.orden_compra_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oc_items_recalcular ON ordenes_compra_items;
CREATE TRIGGER trg_oc_items_recalcular
    AFTER INSERT OR UPDATE OR DELETE ON ordenes_compra_items
    FOR EACH ROW EXECUTE FUNCTION trg_oc_recalcular_totales();
