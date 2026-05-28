-- 02_sistema_inventario_y_produccion.sql
-- Gestión de lotes, control de stock y órdenes de producción con mermas

-- 1. TABLA: lotes_inventario
CREATE TABLE lotes_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    bodega_id UUID NOT NULL REFERENCES bodegas(id) ON DELETE RESTRICT,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial NUMERIC(12,2) NOT NULL CHECK (cantidad_inicial >= 0),
    cantidad_actual NUMERIC(12,2) NOT NULL CHECK (cantidad_actual >= 0),
    temperatura_camara NUMERIC(4,1),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: ordenes_produccion
CREATE TABLE ordenes_produccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_origen_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    lote_origen VARCHAR(50) NOT NULL,
    cantidad_origen NUMERIC(12,2) NOT NULL CHECK (cantidad_origen > 0),
    producto_destino_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    lote_destino VARCHAR(50) NOT NULL,
    cantidad_destino NUMERIC(12,2) NOT NULL CHECK (cantidad_destino > 0),
    merma NUMERIC(12,2) GENERATED ALWAYS AS (cantidad_origen - cantidad_destino) STORED,
    merma_justificacion TEXT,
    autorizado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRIGGERS Y FUNCIONES DE CONTROL DE INVENTARIO

-- Función para actualizar stock_bodegas al alterar lotes_inventario
CREATE OR REPLACE FUNCTION actualizar_stock_bodegas_por_lote()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC(12,2);
BEGIN
    IF (TG_OP = 'INSERT') THEN
        delta := NEW.cantidad_actual;
        
        -- Asegurar que exista la relación bodega-producto
        INSERT INTO stock_bodegas (bodega_id, producto_id, cantidad)
        VALUES (NEW.bodega_id, NEW.producto_id, delta)
        ON CONFLICT (bodega_id, producto_id)
        DO UPDATE SET cantidad = stock_bodegas.cantidad + delta;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        delta := NEW.cantidad_actual - OLD.cantidad_actual;
        
        UPDATE stock_bodegas
        SET cantidad = cantidad + delta
        WHERE bodega_id = NEW.bodega_id AND producto_id = NEW.producto_id;
        
    ELSIF (TG_OP = 'DELETE') THEN
        delta := -OLD.cantidad_actual;
        
        UPDATE stock_bodegas
        SET cantidad = cantidad + delta
        WHERE bodega_id = OLD.bodega_id AND producto_id = OLD.producto_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_stock_lote
AFTER INSERT OR UPDATE OR DELETE ON lotes_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_bodegas_por_lote();

-- Función para validar merma y PIN del bodeguero al procesar producción
CREATE OR REPLACE FUNCTION validar_y_procesar_produccion()
RETURNS TRIGGER AS $$
DECLARE
    v_tolerancia_porcentaje NUMERIC(5,2) := 35.00; -- 35% de tolerancia de merma por defecto
    v_merma_porcentaje NUMERIC(5,2);
    v_rol_autorizador VARCHAR(30);
BEGIN
    -- 1. Calcular porcentaje de merma
    v_merma_porcentaje := (NEW.merma / NEW.cantidad_origen) * 100.00;
    
    -- 2. Validar que la merma no sea negativa (cantidad de salida no puede ser mayor que la de entrada)
    IF NEW.merma < 0 THEN
        RAISE EXCEPTION 'Error de Producción: La cantidad terminada no puede exceder a la materia prima.';
    END IF;
    
    -- 3. Validar tolerancia y requerimientos de justificación y PIN
    IF v_merma_porcentaje > v_tolerancia_porcentaje THEN
        -- Validar justificación
        IF NEW.merma_justificacion IS NULL OR TRIM(NEW.merma_justificacion) = '' THEN
            RAISE EXCEPTION 'Bloqueo de Producción: La merma es del %%% (mayor al %). Se requiere obligatoriamente una justificación escrita.', 
                ROUND(v_merma_porcentaje, 2), ROUND(v_tolerancia_porcentaje, 2);
        END IF;

        -- Validar PIN del Jefe de Bodega (autorizado_por debe ser BODEGUERO o ADMIN)
        SELECT rol INTO v_rol_autorizador FROM usuarios WHERE id = NEW.autorizado_por;
        IF v_rol_autorizador IS NULL OR v_rol_autorizador NOT IN ('BODEGUERO', 'ADMIN') THEN
            RAISE EXCEPTION 'Autorización Rechazada: El usuario autorizador no tiene rol de Jefe de Bodega (BODEGUERO/ADMIN).';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_produccion
BEFORE INSERT ON ordenes_produccion
FOR EACH ROW
EXECUTE FUNCTION validar_y_procesar_produccion();
