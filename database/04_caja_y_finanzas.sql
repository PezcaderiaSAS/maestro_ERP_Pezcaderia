-- 04_caja_y_finanzas.sql
-- Gestión de flujo de caja, arqueos, rutas de logística y egresos/gastos

-- 1. TABLA: cajas (Cuentas financieras y caja chica)
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    saldo_actual NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar Caja POS por defecto
INSERT INTO cajas (nombre, saldo_actual) VALUES ('Caja POS Principal', 0.00);
INSERT INTO cajas (nombre, saldo_actual) VALUES ('Caja Chica Administrativa', 0.00);

-- 2. TABLA: transacciones_caja (Libro diario de ingresos y egresos)
CREATE TABLE transacciones_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    categoria VARCHAR(50) NOT NULL, -- Servicios, Nomina, Compra Proveedor, Venta POS, etc.
    comprobante_url VARCHAR(500), -- Imagen del tique o soporte físico
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL, -- Si es un cobro de pedido
    descripcion TEXT NOT NULL,
    creado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: rutas (Control logístico y arqueo de ruta)
CREATE TABLE rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_ruta VARCHAR(30) UNIQUE NOT NULL,
    conductor_id UUID NOT NULL REFERENCES conductores(id) ON DELETE RESTRICT,
    placa_vehiculo VARCHAR(10) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ASIGNADA' CHECK (estado IN ('ASIGNADA', 'CARGADA', 'LIQUIDADA')),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    recaudo_efectivo_real NUMERIC(12,2) DEFAULT 0.00,
    diferencia_arqueo NUMERIC(12,2) DEFAULT 0.00,
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secuencia para consecutivos de rutas
CREATE SEQUENCE IF NOT EXISTS seq_numero_ruta START WITH 1;

CREATE OR REPLACE FUNCTION set_numero_ruta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_ruta IS NULL THEN
        NEW.numero_ruta := 'RUT-' || LPAD(nextval('seq_numero_ruta')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_numero_ruta
BEFORE INSERT ON rutas
FOR EACH ROW
EXECUTE FUNCTION set_numero_ruta();

-- 4. TABLA: gastos_ruta (Egresos liquidados durante el viaje)
CREATE TABLE gastos_ruta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruta_id UUID NOT NULL REFERENCES rutas(id) ON DELETE CASCADE,
    categoria categoria_gasto_ruta NOT NULL DEFAULT 'OTROS',
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    descripcion TEXT NOT NULL,
    comprobante_url VARCHAR(500), -- Foto del tique subida por conductor
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TRIGGERS Y FUNCIONES FINANCIERAS

-- Trigger para actualizar el saldo_actual en cajas al insertar transacciones
CREATE OR REPLACE FUNCTION actualizar_saldo_caja()
RETURNS TRIGGER AS $$
DECLARE
    v_factor INTEGER;
BEGIN
    IF NEW.tipo = 'INGRESO' THEN
        v_factor := 1;
    ELSE
        v_factor := -1;
    END IF;

    -- Validar que la caja no quede en saldo negativo si es egreso
    IF NEW.tipo = 'EGRESO' THEN
        IF (SELECT saldo_actual FROM cajas WHERE id = NEW.caja_id) < NEW.monto THEN
            RAISE EXCEPTION 'Transacción Contable Rechazada: Saldo insuficiente en la caja de origen.';
        END IF;
    END IF;

    UPDATE cajas
    SET saldo_actual = saldo_actual + (v_factor * NEW.monto)
    WHERE id = NEW.caja_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_saldo_caja
BEFORE INSERT ON transacciones_caja
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldo_caja();
