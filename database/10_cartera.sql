-- 10_cartera.sql
-- Cuentas por cobrar (Cartera): facturas pendientes y abonos
-- Normaliza el array embebido `pagos[]` del tipo InvoiceAR en tabla hija

-- 1. TIPO ENUM PARA MÉTODOS DE PAGO EN CARTERA
DO $$ BEGIN
    CREATE TYPE metodo_pago_cartera AS ENUM ('EFECTIVO', 'DATAFONO', 'TRANSFERENCIA');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: cartera_facturas (Cabecera de factura de crédito)
CREATE TABLE IF NOT EXISTS cartera_facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(50) UNIQUE,                                    -- ID de localStorage (ej: 'PED-045091')
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    cliente_nombre VARCHAR(255) NOT NULL DEFAULT '',                 -- Desnormalizado para lectura histórica
    cliente_identificacion VARCHAR(20) NOT NULL DEFAULT '',
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_vencimiento DATE,
    observaciones TEXT,
    total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    saldo NUMERIC(12,2) NOT NULL CHECK (saldo >= 0),                -- Saldo pendiente (decrece con pagos)
    pagado NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (pagado >= 0), -- Total abonado a la fecha
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA', 'VENCIDA')),
    idempotency_key UUID UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_saldo_consistente CHECK (saldo = total - pagado)
);

CREATE INDEX IF NOT EXISTS idx_cartera_cliente ON cartera_facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cartera_estado ON cartera_facturas(estado);
CREATE INDEX IF NOT EXISTS idx_cartera_vencimiento ON cartera_facturas(fecha_vencimiento);

-- 3. TABLA: cartera_pagos (Abonos aplicados a una factura)
CREATE TABLE IF NOT EXISTS cartera_pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL REFERENCES cartera_facturas(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    metodo metodo_pago_cartera NOT NULL DEFAULT 'EFECTIVO',
    referencia_externa VARCHAR(100),                                 -- ID de transacción bancaria o datafono
    recibido_por VARCHAR(100),
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cartera_pagos_factura ON cartera_pagos(factura_id);

-- 4. FUNCIÓN: Registrar pago y actualizar saldo de factura atómicamente
CREATE OR REPLACE FUNCTION registrar_abono_cartera(
    p_factura_id UUID,
    p_monto NUMERIC(12,2),
    p_metodo metodo_pago_cartera DEFAULT 'EFECTIVO',
    p_referencia_externa VARCHAR(100) DEFAULT NULL,
    p_recibido_por VARCHAR(100) DEFAULT NULL,
    p_notas TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_pago_id UUID;
    v_saldo_actual NUMERIC(12,2);
    v_total NUMERIC(12,2);
    v_nuevo_saldo NUMERIC(12,2);
    v_nuevo_pagado NUMERIC(12,2);
BEGIN
    -- Validar factura existe y obtener saldos
    SELECT saldo, total INTO v_saldo_actual, v_total
    FROM cartera_facturas WHERE id = p_factura_id
    FOR UPDATE;  -- Lock row to prevent race conditions

    IF v_saldo_actual IS NULL THEN
        RAISE EXCEPTION 'Factura no encontrada: %', p_factura_id;
    END IF;

    IF p_monto > v_saldo_actual THEN
        RAISE EXCEPTION 'El abono (%) supera el saldo pendiente (%)', p_monto, v_saldo_actual;
    END IF;

    -- Insertar pago
    INSERT INTO cartera_pagos (factura_id, monto, metodo, referencia_externa, recibido_por, notas)
    VALUES (p_factura_id, p_monto, p_metodo, p_referencia_externa, p_recibido_por, p_notas)
    RETURNING id INTO v_pago_id;

    -- Actualizar saldo y pagado
    v_nuevo_pagado := v_total - v_saldo_actual + p_monto;
    v_nuevo_saldo := v_saldo_actual - p_monto;

    UPDATE cartera_facturas
    SET saldo = v_nuevo_saldo,
        pagado = v_nuevo_pagado,
        estado = CASE
            WHEN v_nuevo_saldo <= 0 THEN 'PAGADA'
            WHEN v_nuevo_pagado > 0 THEN 'PARCIAL'
            ELSE 'PENDIENTE'
        END,
        actualizado_en = NOW()
    WHERE id = p_factura_id;

    RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNCIÓN: Crear factura desde venta (para integración con módulo POS)
CREATE OR REPLACE FUNCTION crear_factura_desde_venta(
    p_venta_id UUID,                              -- ID en pedidos
    p_cliente_id UUID,
    p_total NUMERIC(12,2),
    p_es_credito BOOLEAN DEFAULT true,
    p_idempotency_key UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_factura_id UUID;
    v_cliente_nombre VARCHAR(255);
    v_cliente_identificacion VARCHAR(20);
BEGIN
    -- Obtener datos del cliente
    SELECT t.nombre_razon_social, t.identificacion
    INTO v_cliente_nombre, v_cliente_identificacion
    FROM clientes c
    JOIN terceros t ON t.id = c.id
    WHERE c.id = p_cliente_id;

    INSERT INTO cartera_facturas (
        legacy_id, cliente_id, cliente_nombre, cliente_identificacion,
        fecha, total, saldo, pagado, estado, idempotency_key
    ) VALUES (
        p_venta_id::text, p_cliente_id, v_cliente_nombre, v_cliente_identificacion,
        NOW(), p_total,
        CASE WHEN p_es_credito THEN p_total ELSE 0 END,
        CASE WHEN p_es_credito THEN 0 ELSE p_total END,
        CASE WHEN p_es_credito THEN 'PENDIENTE' ELSE 'PAGADA' END,
        p_idempotency_key
    ) RETURNING id INTO v_factura_id;

    RETURN v_factura_id;
END;
$$ LANGUAGE plpgsql;
