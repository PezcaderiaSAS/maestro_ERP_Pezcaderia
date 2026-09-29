-- ============================================================================
-- MIGRACIÓN 28: MOTOR DE CAJA POS, ARQUEOS Y RETIROS PARCIALES (CASH ENGINE)
-- ============================================================================
-- Módulo: pos-cash-engine
-- Arquitectura: Multi-Tenant RLS, Transacciones Atómicas y Bloqueo Pesimista
-- Moneda: COP (Pesos Colombianos)
-- ============================================================================

-- 1. TABLA: cajas_pos (Terminales y Cajas Registradoras Físicas)
CREATE TABLE IF NOT EXISTS public.cajas_pos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    bodega_id VARCHAR(50) NOT NULL DEFAULT '1',
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'POS' CHECK (tipo IN ('POS', 'MENOR', 'MAYOR', 'MOVIL')),
    tope_efectivo_maximo NUMERIC(14, 2) NOT NULL DEFAULT 1500000.00 CHECK (tope_efectivo_maximo > 0),
    modo_arqueo_ciego BOOLEAN NOT NULL DEFAULT TRUE,
    umbral_tolerancia_ajuste NUMERIC(10, 2) NOT NULL DEFAULT 5000.00 CHECK (umbral_tolerancia_ajuste >= 0),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_caja_pos_empresa_codigo UNIQUE(empresa_id, codigo)
);

-- 2. TABLA: turnos_pos (Aperturas, Turnos de Cajeros y Cierres)
CREATE TABLE IF NOT EXISTS public.turnos_pos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    caja_id UUID NOT NULL REFERENCES public.cajas_pos(id) ON DELETE RESTRICT,
    cajero_id UUID,
    cajero_nombre VARCHAR(120) NOT NULL,
    consecutivo_turno VARCHAR(30) NOT NULL,
    fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    base_inicial NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (base_inicial >= 0),
    
    -- Totales acumulados por medio de pago
    total_efectivo NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_nequi NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_daviplata NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_qr_bancolombia NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_tarjeta NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_credito NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_ingresos_adicionales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_retiros_parciales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- Cálculos de cierre y arqueo
    saldo_esperado_efectivo NUMERIC(14, 2) GENERATED ALWAYS AS (
        base_inicial + total_efectivo + total_ingresos_adicionales - total_retiros_parciales
    ) STORED,
    saldo_real_declarado NUMERIC(14, 2),
    diferencia NUMERIC(14, 2),
    tipo_descuadre VARCHAR(20) CHECK (tipo_descuadre IN ('EXACTO', 'TOLERANCIA_REDONDEO', 'FALTANTE', 'SOBRANTE')),
    justificacion_descuadre TEXT,
    
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO', 'AUDITADO')),
    supervisor_cierre_id UUID,
    supervisor_nombre VARCHAR(120),
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 3. TABLA: arqueos_pos_detalles (Desglose de Billetes y Monedas del Conteo Físico)
CREATE TABLE IF NOT EXISTS public.arqueos_pos_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES public.turnos_pos(id) ON DELETE CASCADE,
    denominacion_valor NUMERIC(10, 2) NOT NULL CHECK (denominacion_valor > 0),
    denominacion_etiqueta VARCHAR(20) NOT NULL, -- Ej: '$100.000', '$50.000', '$500'
    tipo_especie VARCHAR(10) NOT NULL CHECK (tipo_especie IN ('BILLETE', 'MONEDA')),
    cantidad INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    subtotal NUMERIC(14, 2) GENERATED ALWAYS AS (denominacion_valor * cantidad) STORED,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 4. TABLA: movimientos_pos_caja (Libro Auxiliar de Flujos de Efectivo y Medios)
CREATE TABLE IF NOT EXISTS public.movimientos_pos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    turno_id UUID NOT NULL REFERENCES public.turnos_pos(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'VENTA', 'INGRESO_BASE', 'INGRESO_EXTRA', 'GASTO_MENOR', 'RETIRO_PARCIAL', 'AJUSTE_ARQUEO'
    )),
    metodo_pago VARCHAR(25) NOT NULL CHECK (metodo_pago IN (
        'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'QR_BANCOLOMBIA', 'DATAFONO', 'CREDITO', 'MIXTO'
    )),
    monto NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
    consecutivo_comprobante VARCHAR(40) NOT NULL,
    referencia_venta_id VARCHAR(50),
    concepto TEXT NOT NULL,
    autorizado_por VARCHAR(120),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- ============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cajas_pos_empresa ON public.cajas_pos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_turnos_pos_caja ON public.turnos_pos(caja_id);
CREATE INDEX IF NOT EXISTS idx_turnos_pos_estado ON public.turnos_pos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_pos_cajero ON public.turnos_pos(cajero_id);
CREATE INDEX IF NOT EXISTS idx_arqueos_detalles_turno ON public.arqueos_pos_detalles(turno_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pos_turno ON public.movimientos_pos_caja(turno_id);

-- ============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ============================================================================
ALTER TABLE public.cajas_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqueos_pos_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_pos_caja ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS p_cajas_pos_tenant ON public.cajas_pos;
    CREATE POLICY p_cajas_pos_tenant ON public.cajas_pos
        FOR ALL USING (empresa_id = public.get_current_empresa_id())
        WITH CHECK (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_turnos_pos_tenant ON public.turnos_pos;
    CREATE POLICY p_turnos_pos_tenant ON public.turnos_pos
        FOR ALL USING (empresa_id = public.get_current_empresa_id())
        WITH CHECK (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_arqueos_detalles_tenant ON public.arqueos_pos_detalles;
    CREATE POLICY p_arqueos_detalles_tenant ON public.arqueos_pos_detalles
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.turnos_pos t
                WHERE t.id = arqueos_pos_detalles.turno_id
                AND t.empresa_id = public.get_current_empresa_id()
            )
        );

    DROP POLICY IF EXISTS p_movimientos_pos_tenant ON public.movimientos_pos_caja;
    CREATE POLICY p_movimientos_pos_tenant ON public.movimientos_pos_caja
        FOR ALL USING (empresa_id = public.get_current_empresa_id())
        WITH CHECK (empresa_id = public.get_current_empresa_id());
END $$;

-- ============================================================================
-- FUNCIONES RPC TRANSACCIONALES CON BLOQUEO PESIMISTA
-- ============================================================================

-- 1. RPC: Abrir Turno de Caja con Validación de Concurrencia
CREATE OR REPLACE FUNCTION public.fn_abrir_turno_pos(
    p_empresa_id UUID,
    p_caja_id UUID,
    p_cajero_id UUID,
    p_cajero_nombre VARCHAR,
    p_base_inicial NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_caja RECORD;
    v_turno_activo_id UUID;
    v_nuevo_turno_id UUID;
    v_consecutivo VARCHAR(30);
    v_seq INT;
BEGIN
    -- Validar que la caja exista y pertenezca al tenant
    SELECT * INTO v_caja FROM public.cajas_pos
    WHERE id = p_caja_id AND empresa_id = p_empresa_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CAJA_NO_ENCONTRADA: La caja seleccionada no existe o no pertenece a la empresa' USING ERRCODE = 'P0001';
    END IF;

    -- Validar que no haya ya un turno abierto en esta caja
    SELECT id INTO v_turno_activo_id FROM public.turnos_pos
    WHERE caja_id = p_caja_id AND estado = 'ABIERTO' LIMIT 1;

    IF v_turno_activo_id IS NOT NULL THEN
        RAISE EXCEPTION 'TURNO_YA_ABIERTO: Esta caja ya tiene un turno abierto activo (%s)', v_turno_activo_id USING ERRCODE = 'P0001';
    END IF;

    -- Generar consecutivo anual
    SELECT COUNT(*) + 1 INTO v_seq FROM public.turnos_pos WHERE empresa_id = p_empresa_id;
    v_consecutivo := 'TRN-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_seq::TEXT, 4, '0');

    -- Insertar turno
    INSERT INTO public.turnos_pos (
        empresa_id,
        caja_id,
        cajero_id,
        cajero_nombre,
        consecutivo_turno,
        fecha_apertura,
        base_inicial,
        estado
    ) VALUES (
        p_empresa_id,
        p_caja_id,
        p_cajero_id,
        p_cajero_nombre,
        v_consecutivo,
        NOW(),
        p_base_inicial,
        'ABIERTO'
    ) RETURNING id INTO v_nuevo_turno_id;

    -- Registrar movimiento de base inicial
    INSERT INTO public.movimientos_pos_caja (
        empresa_id,
        turno_id,
        tipo_movimiento,
        metodo_pago,
        monto,
        consecutivo_comprobante,
        concepto,
        autorizado_por
    ) VALUES (
        p_empresa_id,
        v_nuevo_turno_id,
        'INGRESO_BASE',
        'EFECTIVO',
        p_base_inicial,
        'BASE-' || v_consecutivo,
        'Apertura de turno con base inicial',
        p_cajero_nombre
    );

    RETURN jsonb_build_object(
        'success', true,
        'turno_id', v_nuevo_turno_id,
        'consecutivo_turno', v_consecutivo,
        'base_inicial', p_base_inicial,
        'modo_arqueo_ciego', v_caja.modo_arqueo_ciego,
        'tope_efectivo_maximo', v_caja.tope_efectivo_maximo
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: Registrar Retiro Parcial de Efectivo (Drop / Alivio de Caja)
CREATE OR REPLACE FUNCTION public.fn_registrar_retiro_parcial_pos(
    p_empresa_id UUID,
    p_turno_id UUID,
    p_monto_retiro NUMERIC,
    p_motivo TEXT,
    p_cajero_nombre VARCHAR,
    p_supervisor_nombre VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    v_turno RECORD;
    v_saldo_actual NUMERIC;
    v_comprobante VARCHAR(40);
    v_seq INT;
BEGIN
    IF p_monto_retiro <= 0 THEN
        RAISE EXCEPTION 'MONTO_INVALIDO: El monto del retiro debe ser superior a cero' USING ERRCODE = 'P0001';
    END IF;

    -- Bloqueo pesimista del turno
    SELECT * INTO v_turno FROM public.turnos_pos
    WHERE id = p_turno_id AND empresa_id = p_empresa_id AND estado = 'ABIERTO' FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TURNO_NO_ACTIVO: El turno no existe, no está abierto o no pertenece al tenant' USING ERRCODE = 'P0001';
    END IF;

    -- Calcular saldo actual en efectivo en gaveta
    v_saldo_actual := v_turno.base_inicial + v_turno.total_efectivo + v_turno.total_ingresos_adicionales - v_turno.total_retiros_parciales;

    IF p_monto_retiro > v_saldo_actual THEN
        RAISE EXCEPTION 'FONDOS_INSUFICIENTES: El retiro solicitado ($%s) supera el efectivo actual en gaveta ($%s)',
            p_monto_retiro, v_saldo_actual USING ERRCODE = 'P0001';
    END IF;

    -- Actualizar acumulador de retiros
    UPDATE public.turnos_pos
    SET total_retiros_parciales = total_retiros_parciales + p_monto_retiro,
        actualizado_en = NOW()
    WHERE id = p_turno_id;

    -- Consecutivo de retiro
    SELECT COUNT(*) + 1 INTO v_seq FROM public.movimientos_pos_caja WHERE turno_id = p_turno_id AND tipo_movimiento = 'RETIRO_PARCIAL';
    v_comprobante := 'DROP-' || v_turno.consecutivo_turno || '-' || LPAD(v_seq::TEXT, 2, '0');

    -- Insertar movimiento
    INSERT INTO public.movimientos_pos_caja (
        empresa_id,
        turno_id,
        tipo_movimiento,
        metodo_pago,
        monto,
        consecutivo_comprobante,
        concepto,
        autorizado_por
    ) VALUES (
        p_empresa_id,
        p_turno_id,
        'RETIRO_PARCIAL',
        'EFECTIVO',
        p_monto_retiro,
        v_comprobante,
        COALESCE(p_motivo, 'Alivio de caja por tope de seguridad'),
        p_supervisor_nombre
    );

    RETURN jsonb_build_object(
        'success', true,
        'comprobante_retiro', v_comprobante,
        'monto_retirado', p_monto_retiro,
        'nuevo_saldo_gaveta', (v_saldo_actual - p_monto_retiro)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Cerrar Turno con Arqueo y Desglose de Denominaciones
CREATE OR REPLACE FUNCTION public.fn_cerrar_turno_pos(
    p_empresa_id UUID,
    p_turno_id UUID,
    p_denominaciones JSONB, -- Array de [{ valor, cantidad, etiqueta, tipo }]
    p_justificacion TEXT DEFAULT NULL,
    p_supervisor_id UUID DEFAULT NULL,
    p_supervisor_nombre VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_turno RECORD;
    v_caja RECORD;
    v_elem JSONB;
    v_saldo_declarado NUMERIC := 0.00;
    v_saldo_esperado NUMERIC;
    v_diferencia NUMERIC;
    v_tipo_descuadre VARCHAR(20);
    v_umbral NUMERIC := 5000.00;
BEGIN
    -- Bloqueo pesimista del turno
    SELECT * INTO v_turno FROM public.turnos_pos
    WHERE id = p_turno_id AND empresa_id = p_empresa_id AND estado = 'ABIERTO' FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TURNO_NO_ACTIVO: El turno no existe o ya fue cerrado' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_caja FROM public.cajas_pos WHERE id = v_turno.caja_id;
    IF FOUND AND v_caja.umbral_tolerancia_ajuste IS NOT NULL THEN
        v_umbral := v_caja.umbral_tolerancia_ajuste;
    END IF;

    -- Borrar detalles anteriores si los hubiera
    DELETE FROM public.arqueos_pos_detalles WHERE turno_id = p_turno_id;

    -- Iterar denominaciones y acumular saldo físico declarado
    IF p_denominaciones IS NOT NULL AND jsonb_array_length(p_denominaciones) > 0 THEN
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_denominaciones)
        LOOP
            INSERT INTO public.arqueos_pos_detalles (
                turno_id,
                denominacion_valor,
                denominacion_etiqueta,
                tipo_especie,
                cantidad
            ) VALUES (
                p_turno_id,
                (v_elem->>'valor')::NUMERIC,
                COALESCE(v_elem->>'etiqueta', '$' || (v_elem->>'valor')),
                COALESCE(v_elem->>'tipo', 'BILLETE'),
                COALESCE((v_elem->>'cantidad')::INT, 0)
            );

            v_saldo_declarado := v_saldo_declarado + ((v_elem->>'valor')::NUMERIC * COALESCE((v_elem->>'cantidad')::INT, 0));
        END LOOP;
    END IF;

    -- Calcular saldo esperado efectivo
    v_saldo_esperado := v_turno.base_inicial + v_turno.total_efectivo + v_turno.total_ingresos_adicionales - v_turno.total_retiros_parciales;
    v_diferencia := v_saldo_declarado - v_saldo_esperado;

    -- Clasificar descuadre
    IF v_diferencia = 0 THEN
        v_tipo_descuadre := 'EXACTO';
    ELSIF ABS(v_diferencia) <= v_umbral THEN
        v_tipo_descuadre := 'TOLERANCIA_REDONDEO';
    ELSIF v_diferencia < -v_umbral THEN
        v_tipo_descuadre := 'FALTANTE';
    ELSE
        v_tipo_descuadre := 'SOBRANTE';
    END IF;

    -- Actualizar turno a CERRADO
    UPDATE public.turnos_pos
    SET fecha_cierre = NOW(),
        saldo_real_declarado = v_saldo_declarado,
        diferencia = v_diferencia,
        tipo_descuadre = v_tipo_descuadre,
        justificacion_descuadre = p_justificacion,
        supervisor_cierre_id = p_supervisor_id,
        supervisor_nombre = p_supervisor_nombre,
        estado = 'CERRADO',
        actualizado_en = NOW()
    WHERE id = p_turno_id;

    RETURN jsonb_build_object(
        'success', true,
        'turno_id', p_turno_id,
        'consecutivo_turno', v_turno.consecutivo_turno,
        'saldo_esperado_efectivo', v_saldo_esperado,
        'saldo_real_declarado', v_saldo_declarado,
        'diferencia', v_diferencia,
        'tipo_descuadre', v_tipo_descuadre,
        'requiere_autorizacion', (v_tipo_descuadre IN ('FALTANTE', 'SOBRANTE'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA DE CAJAS POR DEFECTO PARA LA EMPRESA PRINCIPAL
-- ============================================================================
INSERT INTO public.cajas_pos (
    id, empresa_id, bodega_id, codigo, nombre, tipo, tope_efectivo_maximo, modo_arqueo_ciego
) VALUES 
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    '1',
    'POS-01',
    'Caja Mostrador Principal 1',
    'POS',
    1500000.00,
    TRUE
),
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    '1',
    'POS-02',
    'Caja Rápida Pescados y Mariscos',
    'POS',
    1000000.00,
    TRUE
)
ON CONFLICT (empresa_id, codigo) DO NOTHING;
