-- 14_cajas_ext.sql
-- Extensión del módulo de cajas para alineación con tipos cash.types.ts de la app
-- Crea tablas paralelas (no modifica cajas/transacciones_caja legacy)

-- 1. TIPOS ENUM
DO $$ BEGIN
    CREATE TYPE estado_turno AS ENUM ('ABIERTO', 'CERRADO', 'AUDITADO');
    CREATE TYPE tipo_movimiento_caja AS ENUM (
        'INGRESO_VENTA',
        'INGRESO_ABONO',
        'INGRESO_TRASLADO',
        'INGRESO_BASE_INICIAL',
        'EGRESO_GASTO',
        'EGRESO_TRASLADO',
        'AJUSTE_SOBRANTE',
        'AJUSTE_FALTANTE'
    );
    CREATE TYPE metodo_pago_ext AS ENUM ('EFECTIVO', 'DATAFONO', 'TRANSFERENCIA');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. EXTENDER cajas legacy con bodega_id (app requiere bodegaId)
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS bodega_id UUID REFERENCES bodegas(id) ON DELETE RESTRICT;
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. TABLA: turnos_caja (Apertura/cierre de turno de cajero)
CREATE TABLE IF NOT EXISTS turnos_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE RESTRICT,
    cajero_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    base_inicial NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_inicial >= 0),
    saldo_teorico_global NUMERIC(12,2) DEFAULT 0,
    total_efectivo NUMERIC(12,2) DEFAULT 0,
    total_datafono NUMERIC(12,2) DEFAULT 0,
    total_transferencias NUMERIC(12,2) DEFAULT 0,
    saldo_fisico_efectivo NUMERIC(12,2),
    diferencia_efectivo NUMERIC(12,2),
    saldo_fisico_datafono NUMERIC(12,2),
    diferencia_datafono NUMERIC(12,2),
    saldo_fisico_transferencias NUMERIC(12,2),
    diferencia_transferencias NUMERIC(12,2),
    estado estado_turno NOT NULL DEFAULT 'ABIERTO',
    justificacion TEXT,
    idempotency_key UUID UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_turnos_caja ON turnos_caja(caja_id, estado);
CREATE INDEX IF NOT EXISTS idx_turnos_cajero ON turnos_caja(cajero_id);

-- 4. TABLA: movimientos_caja (Transacciones detalladas con turno y método de pago)
CREATE TABLE IF NOT EXISTS movimientos_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turno_id UUID NOT NULL REFERENCES turnos_caja(id) ON DELETE CASCADE,
    caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE RESTRICT,
    tipo tipo_movimiento_caja NOT NULL,
    metodo_pago metodo_pago_ext NOT NULL DEFAULT 'EFECTIVO',
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    concepto VARCHAR(255) NOT NULL DEFAULT '',
    referencia_id VARCHAR(50),                                       -- ID de Venta, Gasto, etc.
    referencia_tabla VARCHAR(50),                                    -- 'pedidos', 'gastos', etc.
    idempotency_key UUID UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movcaja_turno ON movimientos_caja(turno_id);
CREATE INDEX IF NOT EXISTS idx_movcaja_caja ON movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movcaja_tipo ON movimientos_caja(tipo);

-- 5. TABLA: detalles_arqueo (Conteo físico de billetes/monedas)
CREATE TABLE IF NOT EXISTS detalles_arqueo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turno_id UUID NOT NULL REFERENCES turnos_caja(id) ON DELETE CASCADE,
    tipo_arqueo VARCHAR(10) NOT NULL CHECK (tipo_arqueo IN ('APERTURA', 'CIERRE')),
    billetes_100k INTEGER NOT NULL DEFAULT 0,
    billetes_50k INTEGER NOT NULL DEFAULT 0,
    billetes_20k INTEGER NOT NULL DEFAULT 0,
    billetes_10k INTEGER NOT NULL DEFAULT 0,
    billetes_5k INTEGER NOT NULL DEFAULT 0,
    billetes_2k INTEGER NOT NULL DEFAULT 0,
    monedas_1k INTEGER NOT NULL DEFAULT 0,
    monedas_500 INTEGER NOT NULL DEFAULT 0,
    monedas_200 INTEGER NOT NULL DEFAULT 0,
    monedas_100 INTEGER NOT NULL DEFAULT 0,
    monedas_50 INTEGER NOT NULL DEFAULT 0,
    total_calculado NUMERIC(12,2) GENERATED ALWAYS AS (
        (billetes_100k * 100000) +
        (billetes_50k * 50000) +
        (billetes_20k * 20000) +
        (billetes_10k * 10000) +
        (billetes_5k * 5000) +
        (billetes_2k * 2000) +
        (monedas_1k * 1000) +
        (monedas_500 * 500) +
        (monedas_200 * 200) +
        (monedas_100 * 100) +
        (monedas_50 * 50)
    ) STORED,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arqueo_turno ON detalles_arqueo(turno_id, tipo_arqueo);

-- 6. TABLA: traslados_dinero (Transferencias entre cajas)
CREATE TABLE IF NOT EXISTS traslados_dinero (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_origen_id UUID NOT NULL REFERENCES cajas(id) ON DELETE RESTRICT,
    caja_destino_id UUID NOT NULL REFERENCES cajas(id) ON DELETE RESTRICT,
    metodo_pago metodo_pago_ext NOT NULL DEFAULT 'EFECTIVO',
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADO' CHECK (estado IN ('COMPLETADO')),
    concepto VARCHAR(255) NOT NULL DEFAULT '',
    realizado_por UUID REFERENCES usuarios(id),
    idempotency_key UUID UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_origen ON traslados_dinero(caja_origen_id);
CREATE INDEX IF NOT EXISTS idx_traslados_destino ON traslados_dinero(caja_destino_id);
