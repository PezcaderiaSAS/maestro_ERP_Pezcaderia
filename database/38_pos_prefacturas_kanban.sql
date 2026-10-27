-- ==============================================================================
-- MIGRACIÓN BASE DE DATOS: PREVENTAS MULTIVENDEDOR, KANBAN DE CAJA & DESPACHO VERIFICADO
-- Módulo: SPEC-037 (La Pezcadería ERP)
-- Archivo: database/38_pos_prefacturas_kanban.sql
-- Fecha: 2026-10-27
-- ==============================================================================

-- 1. Tabla: pos_prefacturas (Cabecera de Preventa de Mostrador sin Recaudo)
CREATE TABLE IF NOT EXISTS public.pos_prefacturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo_preventa TEXT NOT NULL,
    vendedor_id UUID NOT NULL REFERENCES auth.users(id),
    vendedor_nombre TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    cliente_documento TEXT,
    cliente_nombre TEXT,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    descuento_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE_COBRO' CHECK (
        estado IN ('PENDIENTE_COBRO', 'EN_COBRO', 'PAGADA', 'DESPACHADA', 'ANULADA')
    ),
    factura_id TEXT,
    cajero_id UUID REFERENCES auth.users(id),
    cajero_nombre TEXT,
    despachado_por_id UUID REFERENCES auth.users(id),
    pagado_at TIMESTAMPTZ,
    despachado_at TIMESTAMPTZ,
    hard_hold_activo BOOLEAN NOT NULL DEFAULT true,
    ticket_qr_payload TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_pos_prefactura_codigo UNIQUE (tenant_id, codigo_preventa)
);

-- 2. Tabla: pos_items_prefactura (Artículos y Reserva de Stock Hard-Hold)
CREATE TABLE IF NOT EXISTS public.pos_items_prefactura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefactura_id UUID NOT NULL REFERENCES public.pos_prefacturas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),
    precio_lista NUMERIC(14, 2) NOT NULL CHECK (precio_lista >= 0),
    descuento_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (descuento_pct >= 0 AND descuento_pct <= 100),
    precio_final NUMERIC(14, 2) NOT NULL CHECK (precio_final >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    lote_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO (Tablero Kanban, Filtro Asesores & Lector QR)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_prefacturas_tenant_estado 
    ON public.pos_prefacturas(tenant_id, estado);

CREATE INDEX IF NOT EXISTS idx_prefacturas_tenant_vendedor 
    ON public.pos_prefacturas(tenant_id, vendedor_id);

CREATE INDEX IF NOT EXISTS idx_prefacturas_codigo 
    ON public.pos_prefacturas(tenant_id, codigo_preventa);

CREATE INDEX IF NOT EXISTS idx_prefacturas_factura 
    ON public.pos_prefacturas(tenant_id, factura_id) WHERE factura_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_prefactura_pref 
    ON public.pos_items_prefactura(tenant_id, prefactura_id);

-- ==============================================================================
-- SEGURIDAD ROW LEVEL SECURITY (RLS) - ZERO CROSS-TENANT LEAKAGE
-- ==============================================================================
ALTER TABLE public.pos_prefacturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_items_prefactura ENABLE ROW LEVEL SECURITY;

-- Política pos_prefacturas: Miembros del tenant pueden consultar
CREATE POLICY rls_pos_prefacturas_select ON public.pos_prefacturas
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Política pos_prefacturas: Vendedores y administradores pueden emitir preventas
CREATE POLICY rls_pos_prefacturas_insert ON public.pos_prefacturas
    FOR INSERT TO authenticated
    WITH CHECK (
        vendedor_id = auth.uid()
        AND tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Política pos_prefacturas: Cajeros, Asesores y Supervisores pueden transicionar estado
CREATE POLICY rls_pos_prefacturas_update ON public.pos_prefacturas
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Políticas pos_items_prefactura
CREATE POLICY rls_pos_items_select ON public.pos_items_prefactura
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY rls_pos_items_insert ON public.pos_items_prefactura
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ==============================================================================
-- FUNCIONES RPC TRANSACCIONALES
-- ==============================================================================

-- 1. Transición Atómica: Registrar Cobro en Caja
CREATE OR REPLACE FUNCTION public.rpc_cobrar_prefactura(
    p_tenant_id UUID,
    p_prefactura_id UUID,
    p_cajero_id UUID,
    p_factura_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_pref RECORD;
BEGIN
    SELECT * INTO v_pref FROM public.pos_prefacturas
    WHERE id = p_prefactura_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Preventa no encontrada');
    END IF;

    IF v_pref.estado = 'PAGADA' OR v_pref.estado = 'DESPACHADA' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'La preventa ya fue pagada con anterioridad');
    END IF;

    IF v_pref.estado = 'ANULADA' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'No se puede cobrar una preventa anulada');
    END IF;

    UPDATE public.pos_prefacturas
    SET estado = 'PAGADA',
        factura_id = p_factura_id,
        cajero_id = p_cajero_id,
        pagado_at = now(),
        updated_at = now()
    WHERE id = p_prefactura_id AND tenant_id = p_tenant_id;

    RETURN jsonb_build_object(
        'ok', true,
        'prefactura_id', p_prefactura_id,
        'factura_id', p_factura_id,
        'estado', 'PAGADA'
    );
END;
$$;

-- 2. Transición Atómica: Registrar Despacho Verificado
CREATE OR REPLACE FUNCTION public.rpc_despachar_prefactura(
    p_tenant_id UUID,
    p_prefactura_id UUID,
    p_asesor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_pref RECORD;
BEGIN
    SELECT * INTO v_pref FROM public.pos_prefacturas
    WHERE id = p_prefactura_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Preventa no encontrada');
    END IF;

    IF v_pref.estado != 'PAGADA' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'La orden debe estar PAGADA antes de despachar');
    END IF;

    UPDATE public.pos_prefacturas
    SET estado = 'DESPACHADA',
        despachado_por_id = p_asesor_id,
        despachado_at = now(),
        hard_hold_activo = false,
        updated_at = now()
    WHERE id = p_prefactura_id AND tenant_id = p_tenant_id;

    RETURN jsonb_build_object(
        'ok', true,
        'prefactura_id', p_prefactura_id,
        'estado', 'DESPACHADA'
    );
END;
$$;

-- ==============================================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.trg_actualizar_pos_prefacturas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pos_prefacturas_updated_at ON public.pos_prefacturas;
CREATE TRIGGER trg_pos_prefacturas_updated_at
    BEFORE UPDATE ON public.pos_prefacturas
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_actualizar_pos_prefacturas_updated_at();
