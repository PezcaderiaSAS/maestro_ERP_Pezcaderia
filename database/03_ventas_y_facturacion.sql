-- 03_ventas_y_facturacion.sql
-- Gestión de pedidos, detalles de pedido, descuentos y facturación electrónica Siigo

-- 1. SECUENCIA PARA CONSECUTIVOS DE PEDIDOS
CREATE SEQUENCE IF NOT EXISTS seq_numero_pedido START WITH 1;

-- 2. TABLA: pedidos (Cabecera)
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_orden VARCHAR(30) UNIQUE NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    origen VARCHAR(20) NOT NULL CHECK (origen IN ('VISITA', 'LLAMADA', 'WHATSAPP', 'POS')),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    bodega_id UUID NOT NULL REFERENCES bodegas(id) ON DELETE RESTRICT,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    forma_pago forma_pago NOT NULL DEFAULT 'CONTADO',
    tipo_entrega tipo_entrega NOT NULL DEFAULT 'INMEDIATA',
    fecha_entrega DATE NOT NULL CHECK (fecha_entrega >= CURRENT_DATE),
    jornada VARCHAR(15) NOT NULL CHECK (jornada IN ('MANANA', 'TARDE')),
    estado estado_pedido NOT NULL DEFAULT 'CREADO',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    descuento_global_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (descuento_global_porcentaje BETWEEN 0 AND 100),
    descuento_global_valor NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (descuento_global_valor >= 0),
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    idempotency_key UUID UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    -- Campos Siigo
    siigo_factura_guid UUID UNIQUE,
    siigo_status siigo_status NOT NULL DEFAULT 'PENDIENTE',
    siigo_error_message TEXT
);

-- 3. TABLA: detalle_pedidos (Líneas)
CREATE TABLE detalle_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    lote_inventario_id UUID REFERENCES lotes_inventario(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    precio_lista NUMERIC(12,2) NOT NULL CHECK (precio_lista >= 0),
    descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (descuento_porcentaje BETWEEN 0 AND 100),
    precio_final NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (precio_final >= 0),
    total_linea NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_linea >= 0)
);

-- 4. TRIGGERS Y FUNCIONES DE AUTO-CÁLCULO MATEMÁTICO

-- Trigger para setear consecutivo del pedido
CREATE OR REPLACE FUNCTION set_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_orden IS NULL THEN
        NEW.numero_orden := 'PED-' || LPAD(nextval('seq_numero_pedido')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_numero_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION set_numero_pedido();

-- Trigger para auto-calcular precio_final y total_linea en detalle_pedidos
CREATE OR REPLACE FUNCTION calcular_valores_linea_pedido()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular precio final aplicando descuento de línea
    NEW.precio_final := NEW.precio_lista * (1.00 - (NEW.descuento_porcentaje / 100.00));
    -- Calcular total de línea
    NEW.total_linea := NEW.cantidad * NEW.precio_final;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_valores_linea
BEFORE INSERT OR UPDATE ON detalle_pedidos
FOR EACH ROW
EXECUTE FUNCTION calcular_valores_linea_pedido();

-- Trigger para actualizar subtotal y total de la cabecera del pedido al modificar detalle_pedidos
CREATE OR REPLACE FUNCTION recalcular_cabecera_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id UUID;
    v_subtotal NUMERIC(12,2);
    v_descuento_global_porcentaje NUMERIC(5,2);
    v_descuento_global_valor NUMERIC(12,2);
    v_total NUMERIC(12,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_pedido_id := OLD.pedido_id;
    ELSE
        v_pedido_id := NEW.pedido_id;
    END IF;

    -- Obtener la sumatoria de las líneas de detalle
    SELECT COALESCE(SUM(total_linea), 0.00) INTO v_subtotal
    FROM detalle_pedidos
    WHERE pedido_id = v_pedido_id;

    -- Obtener porcentajes y valores globales actuales
    SELECT descuento_global_porcentaje, descuento_global_valor
    INTO v_descuento_global_porcentaje, v_descuento_global_valor
    FROM pedidos
    WHERE id = v_pedido_id;

    -- Calcular valor global si se maneja por porcentaje
    IF v_descuento_global_porcentaje > 0 THEN
        v_descuento_global_valor := v_subtotal * (v_descuento_global_porcentaje / 100.00);
    END IF;

    v_total := v_subtotal - v_descuento_global_valor;
    IF v_total < 0 THEN
        v_total := 0.00;
    END IF;

    -- Actualizar cabecera del pedido
    UPDATE pedidos
    SET subtotal = v_subtotal,
        descuento_global_valor = v_descuento_global_valor,
        total = v_total
    WHERE id = v_pedido_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_cabecera
AFTER INSERT OR UPDATE OR DELETE ON detalle_pedidos
FOR EACH ROW
EXECUTE FUNCTION recalcular_cabecera_pedido();

-- Trigger para recalcular total del pedido al actualizar directamente descuentos globales en la cabecera
CREATE OR REPLACE FUNCTION recalcular_pedido_por_descuento_global()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el porcentaje de descuento global cambió, recalculamos el valor
    IF NEW.descuento_global_porcentaje <> OLD.descuento_global_porcentaje THEN
        NEW.descuento_global_valor := NEW.subtotal * (NEW.descuento_global_porcentaje / 100.00);
    END IF;

    NEW.total := NEW.subtotal - NEW.descuento_global_valor;
    IF NEW.total < 0 THEN
        NEW.total := 0.00;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_pedido_global
BEFORE UPDATE OF descuento_global_porcentaje, descuento_global_valor ON pedidos
FOR EACH ROW
EXECUTE FUNCTION recalcular_pedido_por_descuento_global();
