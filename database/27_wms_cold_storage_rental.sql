-- ============================================================================
-- 27_wms_cold_storage_rental.sql
-- MÓDULO ENTERPRISE: ALQUILER DE CUARTO FRÍO Y CUSTODIA WMS 3PL
-- Multi-Tenant con Supabase RLS, Posiciones de 800 kg, RPCs Atómicas y Contabilidad
-- ============================================================================

-- 1. TABLA: cuartos_frios (Infraestructura física)
CREATE TABLE IF NOT EXISTS public.cuartos_frios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    temperatura_setpoint NUMERIC(4, 1) NOT NULL DEFAULT -18.0,
    capacidad_total_posiciones INT NOT NULL CHECK (capacidad_total_posiciones > 0),
    capacidad_total_kg NUMERIC(12, 2) GENERATED ALWAYS AS (capacidad_total_posiciones * 800.0) STORED,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_cuartos_frios_empresa_codigo UNIQUE(empresa_id, codigo)
);

-- 2. TABLA: clientes_custodia (Clientes de almacenamiento 3PL)
CREATE TABLE IF NOT EXISTS public.clientes_custodia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tercero_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    razon_social VARCHAR(150) NOT NULL,
    numero_identificacion VARCHAR(30) NOT NULL,
    tipo_identificacion VARCHAR(10) NOT NULL DEFAULT 'NIT',
    responsable_contacto VARCHAR(100),
    telefono VARCHAR(30),
    email VARCHAR(100),
    autorizados_retiro JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO_MORA')),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_clientes_custodia_identificacion UNIQUE(empresa_id, numero_identificacion)
);

-- 3. TABLA: productos_custodia (Catálogo de SKUs de clientes)
CREATE TABLE IF NOT EXISTS public.productos_custodia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes_custodia(id) ON DELETE CASCADE,
    codigo_cliente VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    tipo_empaque VARCHAR(30) NOT NULL DEFAULT 'CAJA_CARTON',
    modalidad_medicion VARCHAR(25) NOT NULL CHECK (modalidad_medicion IN ('SOLO_PESO', 'PESO_ESTABLE', 'MIXTO_BULTOS_PESO')),
    peso_unitario_nominal NUMERIC(10, 3) CHECK (peso_unitario_nominal > 0),
    temperatura_optima VARCHAR(30) DEFAULT '-18C a -22C',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 4. TABLA: contratos_alquiler_cf (Contratos de almacenamiento por días/meses)
CREATE TABLE IF NOT EXISTS public.contratos_alquiler_cf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    consecutivo VARCHAR(30) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes_custodia(id) ON DELETE RESTRICT,
    cuarto_frio_id UUID NOT NULL REFERENCES public.cuartos_frios(id) ON DELETE RESTRICT,
    modalidad_tiempo VARCHAR(10) NOT NULL CHECK (modalidad_tiempo IN ('DIAS', 'MESES')),
    posiciones_contratadas INT NOT NULL CHECK (posiciones_contratadas > 0),
    capacidad_contratada_kg NUMERIC(12, 2) GENERATED ALWAYS AS (posiciones_contratadas * 800.0) STORED,
    tarifa_unitaria NUMERIC(12, 2) NOT NULL CHECK (tarifa_unitaria >= 0),
    tarifa_recargo_sobrepeso_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    modalidad_facturacion VARCHAR(15) NOT NULL DEFAULT 'ANTICIPADA' CHECK (modalidad_facturacion IN ('ANTICIPADA', 'VENCIDA')),
    requiere_cuentas_orden BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'VIGENTE' CHECK (estado IN ('BORRADOR', 'VIGENTE', 'FINALIZADO', 'CANCELADO')),
    observaciones TEXT,
    creado_por UUID REFERENCES auth.users(id),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_contratos_cf_empresa_consecutivo UNIQUE(empresa_id, consecutivo),
    CONSTRAINT chk_contratos_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- 5. TABLA: inventario_custodia (Inventario de terceros aislado de cuenta 1435)
CREATE TABLE IF NOT EXISTS public.inventario_custodia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    contrato_id UUID NOT NULL REFERENCES public.contratos_alquiler_cf(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES public.clientes_custodia(id) ON DELETE RESTRICT,
    producto_custodia_id UUID NOT NULL REFERENCES public.productos_custodia(id) ON DELETE RESTRICT,
    lote_cliente VARCHAR(50) NOT NULL,
    fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    fecha_vencimiento DATE,
    bultos_iniciales INT NOT NULL DEFAULT 0,
    bultos_actuales INT NOT NULL DEFAULT 0 CHECK (bultos_actuales >= 0),
    peso_neto_inicial_kg NUMERIC(12, 2) NOT NULL CHECK (peso_neto_inicial_kg >= 0),
    peso_neto_actual_kg NUMERIC(12, 2) NOT NULL CHECK (peso_neto_actual_kg >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_inventario_custodia_lote UNIQUE(contrato_id, producto_custodia_id, lote_cliente)
);

-- 6. TABLA: movimientos_custodia (Actas de Entrada y Salida)
CREATE TABLE IF NOT EXISTS public.movimientos_custodia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    inventario_custodia_id UUID NOT NULL REFERENCES public.inventario_custodia(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(10) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    consecutivo_acta VARCHAR(30) NOT NULL,
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    bultos INT NOT NULL CHECK (bultos >= 0),
    peso_bruto_kg NUMERIC(12, 2) NOT NULL CHECK (peso_bruto_kg >= 0),
    peso_tara_kg NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (peso_tara_kg >= 0),
    peso_neto_kg NUMERIC(12, 2) GENERATED ALWAYS AS (peso_bruto_kg - peso_tara_kg) STORED,
    temperatura_medida NUMERIC(4, 1),
    merma_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    transportador_nombre VARCHAR(100),
    transportador_cedula VARCHAR(30),
    placa_vehiculo VARCHAR(15),
    documento_soporte_pdf_url TEXT,
    firmado_por_cliente TEXT,
    operador_almacen_id UUID REFERENCES auth.users(id),
    autorizado_gerencia_id UUID REFERENCES auth.users(id),
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 7. TABLA: causaciones_alquiler_cf (Causación de ingresos por almacenamiento)
CREATE TABLE IF NOT EXISTS public.causaciones_alquiler_cf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    contrato_id UUID NOT NULL REFERENCES public.contratos_alquiler_cf(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES public.clientes_custodia(id) ON DELETE RESTRICT,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    posiciones_facturadas INT NOT NULL CHECK (posiciones_facturadas > 0),
    unidades_tiempo INT NOT NULL CHECK (unidades_tiempo > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    recargo_sobrecupo NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (recargo_sobrecupo >= 0),
    base_gravable NUMERIC(12, 2) GENERATED ALWAYS AS (subtotal + recargo_sobrecupo) STORED,
    iva_19 NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND((subtotal + recargo_sobrecupo) * 0.19, 2)) STORED,
    retefuente NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_a_cobrar NUMERIC(12, 2) GENERATED ALWAYS AS ((subtotal + recargo_sobrecupo) + ROUND((subtotal + recargo_sobrecupo) * 0.19, 2) - retefuente) STORED,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CAUSADO', 'FACTURADO', 'PAGADO', 'ANULADO')),
    asiento_contable_id UUID,
    factura_venta_id UUID,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- ============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cuartos_frios_empresa ON public.cuartos_frios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_custodia_empresa ON public.clientes_custodia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_custodia_cliente ON public.productos_custodia(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cf_cliente ON public.contratos_alquiler_cf(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cf_cuarto ON public.contratos_alquiler_cf(cuarto_frio_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cf_estado ON public.contratos_alquiler_cf(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_custodia_contrato ON public.inventario_custodia(contrato_id);
CREATE INDEX IF NOT EXISTS idx_inventario_custodia_cliente ON public.inventario_custodia(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_custodia_inv ON public.movimientos_custodia(inventario_custodia_id);
CREATE INDEX IF NOT EXISTS idx_causaciones_cf_contrato ON public.causaciones_alquiler_cf(contrato_id);
CREATE INDEX IF NOT EXISTS idx_causaciones_cf_estado ON public.causaciones_alquiler_cf(estado);

-- ============================================================================
-- HABILITACIÓN DE ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ============================================================================
ALTER TABLE public.cuartos_frios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_custodia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_custodia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_alquiler_cf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_custodia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_custodia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causaciones_alquiler_cf ENABLE ROW LEVEL SECURITY;

-- Políticas RLS deterministas
DO $$
BEGIN
    DROP POLICY IF EXISTS p_cuartos_frios_tenant ON public.cuartos_frios;
    CREATE POLICY p_cuartos_frios_tenant ON public.cuartos_frios
        FOR ALL USING (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_clientes_custodia_tenant ON public.clientes_custodia;
    CREATE POLICY p_clientes_custodia_tenant ON public.clientes_custodia
        FOR ALL USING (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_productos_custodia_tenant ON public.productos_custodia;
    CREATE POLICY p_productos_custodia_tenant ON public.productos_custodia
        FOR ALL USING (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_contratos_cf_tenant ON public.contratos_alquiler_cf;
    CREATE POLICY p_contratos_cf_tenant ON public.contratos_alquiler_cf
        FOR ALL USING (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_inventario_custodia_tenant ON public.inventario_custodia;
    CREATE POLICY p_inventario_custodia_tenant ON public.inventario_custodia
        FOR ALL USING (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_movimientos_custodia_tenant ON public.movimientos_custodia;
    CREATE POLICY p_movimientos_custodia_tenant ON public.movimientos_custodia
        FOR ALL USING (empresa_id = public.get_current_empresa_id());

    DROP POLICY IF EXISTS p_causaciones_cf_tenant ON public.causaciones_alquiler_cf;
    CREATE POLICY p_causaciones_cf_tenant ON public.causaciones_alquiler_cf
        FOR ALL USING (empresa_id = public.get_current_empresa_id());
END $$;

-- ============================================================================
-- FUNCIONES RPC TRANSACCIONALES CON BLOQUEO PESIMISTA
-- ============================================================================

-- 1. RPC: Registrar Recepción / Ingreso en Custodia
CREATE OR REPLACE FUNCTION public.fn_registrar_recepcion_custodia(
    p_empresa_id UUID,
    p_contrato_id UUID,
    p_producto_custodia_id UUID,
    p_lote_cliente VARCHAR,
    p_bultos INT,
    p_peso_bruto_kg NUMERIC,
    p_peso_tara_kg NUMERIC,
    p_temperatura NUMERIC,
    p_transportador_nombre VARCHAR,
    p_transportador_cedula VARCHAR,
    p_placa_vehiculo VARCHAR,
    p_operador_id UUID,
    p_fecha_vencimiento DATE DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_contrato RECORD;
    v_peso_neto NUMERIC;
    v_inventario_id UUID;
    v_movimiento_id UUID;
    v_consecutivo_acta VARCHAR(30);
    v_peso_total_contrato NUMERIC;
    v_sobrecupo_kg NUMERIC := 0.00;
BEGIN
    v_peso_neto := p_peso_bruto_kg - p_peso_tara_kg;
    IF v_peso_neto <= 0 THEN
        RAISE EXCEPTION 'PESO_INVALIDO: El peso neto debe ser mayor a cero' USING ERRCODE = 'P0001';
    END IF;

    -- Validar y bloquear el contrato con SELECT FOR UPDATE
    SELECT * INTO v_contrato
    FROM public.contratos_alquiler_cf
    WHERE id = p_contrato_id AND empresa_id = p_empresa_id
    FOR UPDATE;

    IF v_contrato.id IS NULL THEN
        RAISE EXCEPTION 'CONTRATO_NO_EXISTE: Contrato no encontrado o no pertenece a la empresa' USING ERRCODE = 'P0002';
    END IF;

    IF v_contrato.estado <> 'VIGENTE' THEN
        RAISE EXCEPTION 'CONTRATO_NO_VIGENTE: El contrato se encuentra en estado %', v_contrato.estado USING ERRCODE = 'P0003';
    END IF;

    -- Verificar capacidad y sobrecupo
    SELECT COALESCE(SUM(peso_neto_actual_kg), 0) INTO v_peso_total_contrato
    FROM public.inventario_custodia
    WHERE contrato_id = p_contrato_id AND activo = TRUE;

    IF (v_peso_total_contrato + v_peso_neto) > v_contrato.capacidad_contratada_kg THEN
        v_sobrecupo_kg := (v_peso_total_contrato + v_peso_neto) - v_contrato.capacidad_contratada_kg;
    END IF;

    -- Generar consecutivo de Acta de Recepción
    v_consecutivo_acta := 'ACT-REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');

    -- Insertar o actualizar registro de inventario en custodia
    INSERT INTO public.inventario_custodia (
        empresa_id, contrato_id, cliente_id, producto_custodia_id,
        lote_cliente, fecha_ingreso, fecha_vencimiento,
        bultos_iniciales, bultos_actuales,
        peso_neto_inicial_kg, peso_neto_actual_kg
    ) VALUES (
        p_empresa_id, p_contrato_id, v_contrato.cliente_id, p_producto_custodia_id,
        p_lote_cliente, NOW(), p_fecha_vencimiento,
        p_bultos, p_bultos,
        v_peso_neto, v_peso_neto
    )
    ON CONFLICT (contrato_id, producto_custodia_id, lote_cliente)
    DO UPDATE SET
        bultos_actuales = inventario_custodia.bultos_actuales + p_bultos,
        peso_neto_actual_kg = inventario_custodia.peso_neto_actual_kg + v_peso_neto,
        actualizado_en = NOW()
    RETURNING id INTO v_inventario_id;

    -- Registrar el Movimiento (Acta)
    INSERT INTO public.movimientos_custodia (
        empresa_id, inventario_custodia_id, tipo_movimiento,
        consecutivo_acta, fecha_movimiento, bultos,
        peso_bruto_kg, peso_tara_kg, temperatura_medida,
        transportador_nombre, transportador_cedula, placa_vehiculo,
        operador_almacen_id, observaciones
    ) VALUES (
        p_empresa_id, v_inventario_id, 'ENTRADA',
        v_consecutivo_acta, NOW(), p_bultos,
        p_peso_bruto_kg, p_peso_tara_kg, p_temperatura,
        p_transportador_nombre, p_transportador_cedula, p_placa_vehiculo,
        p_operador_id, p_observaciones
    ) RETURNING id INTO v_movimiento_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'acta_consecutivo', v_consecutivo_acta,
        'movimiento_id', v_movimiento_id,
        'inventario_id', v_inventario_id,
        'peso_neto_ingresado', v_peso_neto,
        'sobrecupo_detectado_kg', v_sobrecupo_kg
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: Registrar Despacho / Salida de Custodia
CREATE OR REPLACE FUNCTION public.fn_registrar_despacho_custodia(
    p_empresa_id UUID,
    p_inventario_id UUID,
    p_bultos_despacho INT,
    p_peso_bruto_salida NUMERIC,
    p_peso_tara_salida NUMERIC,
    p_transportador_nombre VARCHAR,
    p_transportador_cedula VARCHAR,
    p_placa_vehiculo VARCHAR,
    p_operador_id UUID,
    p_autorizado_gerencia_id UUID DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inv RECORD;
    v_peso_neto_salida NUMERIC;
    v_merma_kg NUMERIC := 0.00;
    v_consecutivo_acta VARCHAR(30);
    v_nuevo_peso NUMERIC;
    v_nuevos_bultos INT;
    v_movimiento_id UUID;
BEGIN
    v_peso_neto_salida := p_peso_bruto_salida - p_peso_tara_salida;
    IF v_peso_neto_salida <= 0 THEN
        RAISE EXCEPTION 'PESO_INVALIDO: El peso neto de salida debe ser mayor a cero' USING ERRCODE = 'P0001';
    END IF;

    -- Bloquear inventario con SELECT FOR UPDATE
    SELECT * INTO v_inv
    FROM public.inventario_custodia
    WHERE id = p_inventario_id AND empresa_id = p_empresa_id
    FOR UPDATE;

    IF v_inv.id IS NULL THEN
        RAISE EXCEPTION 'INVENTARIO_NO_EXISTE: Registro de custodia no encontrado' USING ERRCODE = 'P0002';
    END IF;

    IF p_bultos_despacho > v_inv.bultos_actuales THEN
        RAISE EXCEPTION 'STOCK_INSUFICIENTE_BULTOS: No puede despachar % bultos (disponibles: %)',
            p_bultos_despacho, v_inv.bultos_actuales USING ERRCODE = 'P0003';
    END IF;

    IF v_peso_neto_salida > v_inv.peso_neto_actual_kg THEN
        -- Calcular posible merma natural si los bultos coinciden pero el peso bajó
        IF p_bultos_despacho = v_inv.bultos_actuales AND v_peso_neto_salida < v_inv.peso_neto_actual_kg THEN
            v_merma_kg := v_inv.peso_neto_actual_kg - v_peso_neto_salida;
        ELSE
            RAISE EXCEPTION 'STOCK_INSUFICIENTE_KILOS: Kilos a despachar (%) superan disponible (%)',
                v_peso_neto_salida, v_inv.peso_neto_actual_kg USING ERRCODE = 'P0004';
        END IF;
    END IF;

    v_nuevos_bultos := v_inv.bultos_actuales - p_bultos_despacho;
    v_nuevo_peso := GREATEST(0, v_inv.peso_neto_actual_kg - v_peso_neto_salida - v_merma_kg);

    -- Actualizar inventario remanente
    UPDATE public.inventario_custodia
    SET bultos_actuales = v_nuevos_bultos,
        peso_neto_actual_kg = v_nuevo_peso,
        activo = CASE WHEN v_nuevos_bultos = 0 AND v_nuevo_peso = 0 THEN FALSE ELSE TRUE END,
        actualizado_en = NOW()
    WHERE id = p_inventario_id;

    -- Generar acta de despacho
    v_consecutivo_acta := 'ACT-DESP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');

    INSERT INTO public.movimientos_custodia (
        empresa_id, inventario_custodia_id, tipo_movimiento,
        consecutivo_acta, fecha_movimiento, bultos,
        peso_bruto_kg, peso_tara_kg, merma_kg,
        transportador_nombre, transportador_cedula, placa_vehiculo,
        operador_almacen_id, autorizado_gerencia_id, observaciones
    ) VALUES (
        p_empresa_id, p_inventario_id, 'SALIDA',
        v_consecutivo_acta, NOW(), p_bultos_despacho,
        p_peso_bruto_salida, p_peso_tara_salida, v_merma_kg,
        p_transportador_nombre, p_transportador_cedula, p_placa_vehiculo,
        p_operador_id, p_autorizado_gerencia_id, p_observaciones
    ) RETURNING id INTO v_movimiento_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'acta_consecutivo', v_consecutivo_acta,
        'movimiento_id', v_movimiento_id,
        'bultos_despachados', p_bultos_despacho,
        'peso_despachado_kg', v_peso_neto_salida,
        'merma_kg', v_merma_kg,
        'remanente_bultos', v_nuevos_bultos,
        'remanente_peso_kg', v_nuevo_peso
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Causar Ingresos Contables de Alquiler de Cuarto Frío
CREATE OR REPLACE FUNCTION public.fn_causar_ingreso_alquiler_cf(
    p_empresa_id UUID,
    p_contrato_id UUID,
    p_periodo_inicio DATE,
    p_periodo_fin DATE,
    p_recargo_sobrecupo NUMERIC DEFAULT 0.00,
    p_porcentaje_retefuente NUMERIC DEFAULT 0.00
)
RETURNS JSONB AS $$
DECLARE
    v_ctr RECORD;
    v_unidades INT;
    v_subtotal NUMERIC;
    v_base NUMERIC;
    v_iva NUMERIC;
    v_retefuente NUMERIC;
    v_causacion_id UUID;
BEGIN
    SELECT * INTO v_ctr
    FROM public.contratos_alquiler_cf
    WHERE id = p_contrato_id AND empresa_id = p_empresa_id;

    IF v_ctr.id IS NULL THEN
        RAISE EXCEPTION 'CONTRATO_NO_EXISTE: Contrato no encontrado' USING ERRCODE = 'P0001';
    END IF;

    IF v_ctr.modalidad_tiempo = 'DIAS' THEN
        v_unidades := (p_periodo_fin - p_periodo_inicio) + 1;
        v_subtotal := v_ctr.posiciones_contratadas * v_unidades * v_ctr.tarifa_unitaria;
    ELSE
        -- Modalidad meses: cálculo prorrateado si es fracción
        v_unidades := GREATEST(1, ROUND(((p_periodo_fin - p_periodo_inicio) + 1)::NUMERIC / 30.0));
        v_subtotal := v_ctr.posiciones_contratadas * v_unidades * v_ctr.tarifa_unitaria;
    END IF;

    v_base := v_subtotal + p_recargo_sobrecupo;
    v_iva := ROUND(v_base * 0.19, 2);
    v_retefuente := ROUND(v_base * (p_porcentaje_retefuente / 100.0), 2);

    INSERT INTO public.causaciones_alquiler_cf (
        empresa_id, contrato_id, cliente_id,
        periodo_inicio, periodo_fin,
        posiciones_facturadas, unidades_tiempo,
        subtotal, recargo_sobrecupo,
        retefuente, estado
    ) VALUES (
        p_empresa_id, p_contrato_id, v_ctr.cliente_id,
        p_periodo_inicio, p_periodo_fin,
        v_ctr.posiciones_contratadas, v_unidades,
        v_subtotal, p_recargo_sobrecupo,
        v_retefuente, 'CAUSADO'
    ) RETURNING id INTO v_causacion_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'causacion_id', v_causacion_id,
        'posiciones', v_ctr.posiciones_contratadas,
        'unidades_tiempo', v_unidades,
        'subtotal', v_subtotal,
        'recargo_sobrecupo', p_recargo_sobrecupo,
        'base_gravable', v_base,
        'iva_19', v_iva,
        'retefuente', v_retefuente,
        'total_a_cobrar', (v_base + v_iva - v_retefuente)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
