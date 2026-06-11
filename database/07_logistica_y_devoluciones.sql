-- 07_logistica_y_devoluciones.sql
-- Extensiones para el flujo integrado B2B en La Pezcadería ERP

-- 1. MODIFICACIÓN DE ENUMS EXISTENTES
-- Agregar nuevos estados del ciclo B2B
ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'APROBADO';
ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'PAUSADO';

-- 2. MODIFICACIÓN DE TABLAS EXISTENTES
-- Detalle de pedidos para capturar pesaje real en cuarto frío
ALTER TABLE detalle_pedidos ADD COLUMN IF NOT EXISTS cantidad_real NUMERIC(12,2);
ALTER TABLE detalle_pedidos ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 3. NUEVAS TABLAS PARA LOGÍSTICA Y DEVOLUCIONES

-- Tabla: logistica_despacho (información de ruteo/despacho)
CREATE TABLE IF NOT EXISTS logistica_despacho (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    conductor_id UUID REFERENCES conductores(id) ON DELETE RESTRICT,
    tipo_entrega tipo_entrega NOT NULL DEFAULT 'EN_RUTA',
    direccion_entrega VARCHAR(255) NOT NULL,
    fecha_entrega DATE NOT NULL,
    jornada VARCHAR(15) NOT NULL CHECK (jornada IN ('MANANA', 'TARDE')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: devoluciones_pedidos (orden de recogida programada y validación)
CREATE TABLE IF NOT EXISTS devoluciones_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    conductor_id UUID REFERENCES conductores(id) ON DELETE RESTRICT,
    estado VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA' CHECK (estado IN ('PROGRAMADA', 'RECIBIDA_BODEGA', 'VALIDADA_FINANZAS', 'ANULADA')),
    fecha_programacion DATE NOT NULL,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: detalle_devoluciones (detalle físico por producto devuelto)
CREATE TABLE IF NOT EXISTS detalle_devoluciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devolucion_id UUID NOT NULL REFERENCES devoluciones_pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad_solicitada NUMERIC(12,2) NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_recibida NUMERIC(12,2) DEFAULT 0.00,
    precio_unitario_venta NUMERIC(12,2) NOT NULL, -- precio histórico para saldo en cartera
    estado_fisico VARCHAR(30) NOT NULL CHECK (estado_fisico IN ('APTO_INVENTARIO', 'AVERIA_DESCARTE', 'RECHAZADO')),
    lote_inventario VARCHAR(50)
);

-- 4. ACTUALIZACIÓN DEL CÁLCULO DE VALORES DE LÍNEA
-- Reemplazar el trigger anterior para que calcule el total de línea en base a la cantidad real si está presente
CREATE OR REPLACE FUNCTION calcular_valores_linea_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_cant_a_calcular NUMERIC(12,2);
END;
$$;

CREATE OR REPLACE FUNCTION calcular_valores_linea_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_cant_a_calcular NUMERIC(12,2);
BEGIN
    -- Aplicar descuento
    NEW.precio_final := NEW.precio_lista * (1.00 - (NEW.descuento_porcentaje / 100.00));
    
    -- Si ya se pesó en cuarto frío (cantidad_real), facturamos el peso real; si no, el solicitado.
    v_cant_a_calcular := COALESCE(NEW.cantidad_real, NEW.cantidad);
    NEW.total_linea := v_cant_a_calcular * NEW.precio_final;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
