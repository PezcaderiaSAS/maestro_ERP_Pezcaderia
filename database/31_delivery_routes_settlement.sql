-- ============================================================================
-- MIGRACIÓN 31: DESPACHOS EN RUTA, RECAUDO CONTRA ENTREGA Y LIQUIDACIÓN
-- ============================================================================
-- Módulo: delivery-routes-settlement
-- Dominio: Manifiesto Multipedido, Recaudo Mixto, Devoluciones en Cuarentena y Liquidación
-- Arquitectura: Multi-Tenant RLS, Transacciones Atómicas y Bloqueo Pesimista
-- ============================================================================

-- 1. TABLA: manifiestos_rutas (Cabecera de la Ruta)
CREATE TABLE IF NOT EXISTS public.manifiestos_rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero_manifiesto VARCHAR(50) NOT NULL,
    conductor_id VARCHAR(100) NOT NULL,
    conductor_nombre VARCHAR(150) NOT NULL,
    conductor_telefono VARCHAR(50),
    vehiculo_placa VARCHAR(20) NOT NULL,
    vehiculo_tipo VARCHAR(100),
    zona_ruta VARCHAR(100) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PLANIFICADA' CHECK (estado IN ('PLANIFICADA', 'EN_RUTA', 'LIQUIDADA', 'CANCELADA')),
    total_pedidos INTEGER NOT NULL DEFAULT 0,
    total_peso_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    total_facturado_esperado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_recaudado_efectivo NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_recaudado_digital NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_credito_firmado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_devoluciones_monto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_gastos_ruta NUMERIC(14, 2) NOT NULL DEFAULT 0,
    efectivo_neto_entregado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    diferencia_cuadre NUMERIC(14, 2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    observaciones_liquidacion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    salida_en TIMESTAMP WITH TIME ZONE,
    liquidado_en TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_manifiesto_empresa_numero UNIQUE(empresa_id, numero_manifiesto)
);

-- 2. TABLA: manifiestos_pedidos (Detalle de Pedidos en la Ruta)
CREATE TABLE IF NOT EXISTS public.manifiestos_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    manifiesto_id UUID NOT NULL REFERENCES public.manifiestos_rutas(id) ON DELETE CASCADE,
    pedido_id VARCHAR(100) NOT NULL,
    numero_pedido VARCHAR(50) NOT NULL,
    cliente_id VARCHAR(100) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_direccion TEXT,
    monto_pedido_original NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_cobrado_final NUMERIC(14, 2) NOT NULL DEFAULT 0,
    forma_pago VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO' CHECK (forma_pago IN ('CREDITO_B2B', 'EFECTIVO', 'TRANSFERENCIA_DIGITAL', 'MIXTO')),
    monto_efectivo NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_digital NUMERIC(14, 2) NOT NULL DEFAULT 0,
    referencia_transferencia VARCHAR(100),
    estado_entrega VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_entrega IN ('PENDIENTE', 'ENTREGADO_TOTAL', 'ENTREGADO_PARCIAL', 'NO_ENTREGADO_RECHAZADO')),
    hora_entrega TIMESTAMP WITH TIME ZONE,
    firma_cliente_url TEXT,
    novedad_observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 3. TABLA: manifiestos_gastos_ruta (Gastos Operativos del Transportador)
CREATE TABLE IF NOT EXISTS public.manifiestos_gastos_ruta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    manifiesto_id UUID NOT NULL REFERENCES public.manifiestos_rutas(id) ON DELETE CASCADE,
    tipo_gasto VARCHAR(30) NOT NULL CHECK (tipo_gasto IN ('COMBUSTIBLE', 'PEAJE', 'PARQUEADERO', 'HIELO_REFRIGERACION', 'VIATICO', 'OTRO')),
    monto NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
    numero_comprobante VARCHAR(100),
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 4. TABLA: manifiestos_devoluciones_ruta (Rechazos en Sitio a Cuarentena)
CREATE TABLE IF NOT EXISTS public.manifiestos_devoluciones_ruta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    manifiesto_id UUID NOT NULL REFERENCES public.manifiestos_rutas(id) ON DELETE CASCADE,
    pedido_id VARCHAR(100) NOT NULL,
    producto_id VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    nombre_producto VARCHAR(200) NOT NULL,
    cantidad_devuelta_kg NUMERIC(10, 3) NOT NULL CHECK (cantidad_devuelta_kg > 0),
    precio_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_descontado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    lote_fefo VARCHAR(100),
    motivo_rechazo VARCHAR(50) NOT NULL,
    destino_bodega VARCHAR(50) NOT NULL DEFAULT 'CUARENTENA_CALIDAD',
    dictamen_calidad TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_manifiestos_empresa_estado ON public.manifiestos_rutas(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_manifiestos_fechas ON public.manifiestos_rutas(empresa_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_manifiestos_pedidos_man ON public.manifiestos_pedidos(manifiesto_id);
CREATE INDEX IF NOT EXISTS idx_manifiestos_gastos_man ON public.manifiestos_gastos_ruta(manifiesto_id);
CREATE INDEX IF NOT EXISTS idx_manifiestos_devs_man ON public.manifiestos_devoluciones_ruta(manifiesto_id);

-- 6. POLÍTICAS RLS MULTI-TENANT
ALTER TABLE public.manifiestos_rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifiestos_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifiestos_gastos_ruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifiestos_devoluciones_ruta ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manifiestos_rutas' AND policyname = 'manifiestos_tenant_isolation') THEN
        CREATE POLICY manifiestos_tenant_isolation ON public.manifiestos_rutas FOR ALL USING (empresa_id = public.get_current_empresa_id());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manifiestos_pedidos' AND policyname = 'manifiestos_pedidos_tenant_isolation') THEN
        CREATE POLICY manifiestos_pedidos_tenant_isolation ON public.manifiestos_pedidos FOR ALL USING (empresa_id = public.get_current_empresa_id());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manifiestos_gastos_ruta' AND policyname = 'manifiestos_gastos_tenant_isolation') THEN
        CREATE POLICY manifiestos_gastos_tenant_isolation ON public.manifiestos_gastos_ruta FOR ALL USING (empresa_id = public.get_current_empresa_id());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manifiestos_devoluciones_ruta' AND policyname = 'manifiestos_devs_tenant_isolation') THEN
        CREATE POLICY manifiestos_devs_tenant_isolation ON public.manifiestos_devoluciones_ruta FOR ALL USING (empresa_id = public.get_current_empresa_id());
    END IF;
END $$;

-- 7. RPC TRANSACCIONAL: fn_liquidar_ruta_transportador
CREATE OR REPLACE FUNCTION public.fn_liquidar_ruta_transportador(
    p_manifiesto_id UUID,
    p_liquidado_por VARCHAR(100),
    p_efectivo_entregado NUMERIC(14, 2),
    p_gastos JSONB,
    p_observaciones TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_manifiesto RECORD;
    v_total_efectivo NUMERIC(14, 2) := 0;
    v_total_digital NUMERIC(14, 2) := 0;
    v_total_credito NUMERIC(14, 2) := 0;
    v_total_gastos NUMERIC(14, 2) := 0;
    v_efectivo_esperado NUMERIC(14, 2) := 0;
    v_diferencia NUMERIC(14, 2) := 0;
    v_gasto RECORD;
BEGIN
    v_empresa_id := public.get_current_empresa_id();

    SELECT * INTO v_manifiesto
    FROM public.manifiestos_rutas
    WHERE id = p_manifiesto_id AND empresa_id = v_empresa_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Manifiesto de ruta no encontrado o acceso denegado';
    END IF;

    -- Calcular acumulados de pedidos entregados
    SELECT 
        COALESCE(SUM(monto_efectivo), 0),
        COALESCE(SUM(monto_digital), 0),
        COALESCE(SUM(CASE WHEN forma_pago = 'CREDITO_B2B' THEN monto_cobrado_final ELSE 0 END), 0)
    INTO v_total_efectivo, v_total_digital, v_total_credito
    FROM public.manifiestos_pedidos
    WHERE manifiesto_id = p_manifiesto_id AND empresa_id = v_empresa_id;

    -- Insertar gastos de ruta proporcionados
    IF p_gastos IS NOT NULL AND jsonb_array_length(p_gastos) > 0 THEN
        FOR v_gasto IN SELECT * FROM jsonb_to_recordset(p_gastos) AS x(
            "tipoGasto" VARCHAR,
            "monto" NUMERIC,
            "numeroComprobante" VARCHAR,
            "descripcion" TEXT
        )
        LOOP
            INSERT INTO public.manifiestos_gastos_ruta (
                empresa_id,
                manifiesto_id,
                tipo_gasto,
                monto,
                numero_comprobante,
                descripcion
            ) VALUES (
                v_empresa_id,
                p_manifiesto_id,
                v_gasto."tipoGasto",
                v_gasto."monto",
                v_gasto."numeroComprobante",
                v_gasto."descripcion"
            );

            v_total_gastos := v_total_gastos + v_gasto."monto";
        END LOOP;
    END IF;

    -- Efectivo neto esperado = Total Efectivo Recaudado - Gastos Soportados de Ruta
    v_efectivo_esperado := v_total_efectivo - v_total_gastos;
    v_diferencia := p_efectivo_entregado - v_efectivo_esperado;

    -- Actualizar cabecera del manifiesto
    UPDATE public.manifiestos_rutas
    SET
        estado = 'LIQUIDADA',
        total_recaudado_efectivo = v_total_efectivo,
        total_recaudado_digital = v_total_digital,
        total_credito_firmado = v_total_credito,
        total_gastos_ruta = v_total_gastos,
        efectivo_neto_entregado = p_efectivo_entregado,
        diferencia_cuadre = v_diferencia,
        observaciones_liquidacion = p_observaciones,
        liquidado_en = timezone('UTC', NOW())
    WHERE id = p_manifiesto_id;

    RETURN jsonb_build_object(
        'success', true,
        'manifiestoId', p_manifiesto_id,
        'totalEfectivoRecaudado', v_total_efectivo,
        'totalDigitalRecaudado', v_total_digital,
        'totalCreditoFirmado', v_total_credito,
        'totalGastos', v_total_gastos,
        'efectivoEsperado', v_efectivo_esperado,
        'efectivoEntregado', p_efectivo_entregado,
        'diferenciaCuadre', v_diferencia
    );
END;
$$;
