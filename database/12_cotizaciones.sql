-- 12_cotizaciones.sql
-- Cotizaciones/Pedidos (quotations) — tabla nueva (no existía en schema legacy)
-- Normaliza items embebidos en tabla hija y logística en JSONB

-- 1. TIPO ENUM
DO $$ BEGIN
    CREATE TYPE estado_cotizacion AS ENUM (
        'VIGENTE', 'APPROVED', 'PAUSADO', 'LISTO', 'SOLD', 'FACTURADO', 'EXPIRED', 'CANCELADA'
    );
    CREATE TYPE origen_pedido AS ENUM ('WHATSAPP', 'TELEFONO', 'PRESENCIAL', 'CORREO', 'OTRO');
    CREATE TYPE tipo_entrega AS ENUM ('EN_RUTA', 'RECOGEN', 'DOMICILIO');
    CREATE TYPE forma_pago_cotizacion AS ENUM ('CONTADO', 'CREDITO', 'TRANSFERENCIA', 'DATAFONO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: cotizaciones (Cabecera)
CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(50) UNIQUE,
    no VARCHAR(20) NOT NULL,                                         -- Número legible tipo 'PED-001'
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
    client_name VARCHAR(255) NOT NULL DEFAULT '',
    client_ident VARCHAR(20) DEFAULT '',
    client_type VARCHAR(30) DEFAULT '',
    origen_pedido origen_pedido DEFAULT 'WHATSAPP',
    factura_electronica BOOLEAN DEFAULT false,
    forma_pago forma_pago_cotizacion DEFAULT 'CREDITO',
    descuento_global NUMERIC(12,2) DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    descuentos NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado estado_cotizacion NOT NULL DEFAULT 'VIGENTE',
    observaciones TEXT,
    fecha VARCHAR(20) NOT NULL,                                      -- Fecha legible 'dd/mm/aaaa'
    vencimiento VARCHAR(20),                                         -- Fecha de vencimiento legible
    logistica JSONB,                                                 -- {tipoEntrega, direccion, fecha, jornada, conductorId, conductorNombre}
    idempotency_key UUID UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_logistica ON cotizaciones USING gin(logistica);

-- 3. TABLA: cotizaciones_items (Líneas de detalle)
CREATE TABLE IF NOT EXISTS cotizaciones_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos_catalogo(id) ON DELETE RESTRICT,
    sku VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL DEFAULT '',
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    cantidad_real NUMERIC(12,2),                                     -- Peso real al alistar (nullable hasta alistamiento)
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    descuento NUMERIC(12,2) DEFAULT 0,
    detalle TEXT DEFAULT '',
    listo BOOLEAN DEFAULT false,
    es_devolucion BOOLEAN DEFAULT false,
    devolucion_id VARCHAR(50) DEFAULT '',
    total_linea NUMERIC(12,2) GENERATED ALWAYS AS ((cantidad * precio) - descuento) STORED,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_items_cot ON cotizaciones_items(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_items_producto ON cotizaciones_items(producto_id);

-- 4. VISTA: cotizaciones_pendientes_alistamiento
CREATE OR REPLACE VIEW cotizaciones_pendientes_alistamiento AS
SELECT c.*, ci.sku, ci.nombre, ci.cantidad, ci.cantidad_real, ci.precio, ci.listo
FROM cotizaciones c
JOIN cotizaciones_items ci ON ci.cotizacion_id = c.id
WHERE c.estado IN ('APPROVED', 'PAUSADO')
  AND c.deleted_at IS NULL
ORDER BY c.creado_en;
