-- ============================================================================
-- 24_hierarchical_jwt_rls_governance.sql
-- MIGRACIÓN DE SEGURIDAD AVANZADA: Arquitectura Jerárquica JWT y Gobernanza RLS
-- Aplicada exitosamente en proyecto: maestro-erp-pezcaderia (scuhyfvnnkuivruiaxqx)
-- ============================================================================

-- 1. TABLA DE GOBERNANZA ATÓMICA DE ESTADOS Y ROLES (user_tenant_roles)
CREATE TABLE IF NOT EXISTS public.user_tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('ultra_admin', 'admin', 'operator', 'auditor')),
    role_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (role_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_tenant UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tenant_lookup ON public.user_tenant_roles(user_id, tenant_id, role_status);

-- 2. FUNCIONES DE CONTEXTO RLS EN ESQUEMA PUBLIC BASADAS EN JWT APP_METADATA
CREATE OR REPLACE FUNCTION public.is_ultra_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'is_ultra_admin')::BOOLEAN,
        FALSE
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_tenant TEXT;
BEGIN
    v_tenant := COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'tenant_id',
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        auth.jwt() -> 'app_metadata' ->> 'empresa_id'
    );
    IF v_tenant IS NOT NULL AND v_tenant <> '' THEN
        RETURN v_tenant::UUID;
    END IF;
    RETURN '00000000-0000-0000-0000-000000000001'::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN '00000000-0000-0000-0000-000000000001'::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'user_role',
        'operator'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'operator';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. ACTIVACIÓN FORZOSA DE RLS (FORCE ROW LEVEL SECURITY)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones FORCE ROW LEVEL SECURITY;

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bodegas FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas FORCE ROW LEVEL SECURITY;

ALTER TABLE public.transacciones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_caja FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados FORCE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS JERÁRQUICAS UNIFICADAS

-- COTIZACIONES
DROP POLICY IF EXISTS p_cotizaciones_isolation ON public.cotizaciones;
CREATE POLICY p_cotizaciones_isolation ON public.cotizaciones
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND
            public.get_user_role() IN ('admin', 'operator')
        )
    )
    WITH CHECK (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND (
                public.get_user_role() = 'admin' OR (
                    public.get_user_role() = 'operator' AND
                    estado IN ('DRAFT', 'SENT')
                )
            )
        )
    );

-- CLIENTES
DROP POLICY IF EXISTS p_clientes_isolation ON public.clientes;
CREATE POLICY p_clientes_isolation ON public.clientes
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id()
        )
    )
    WITH CHECK (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND
            public.get_user_role() IN ('admin', 'operator')
        )
    );

-- PEDIDOS
DROP POLICY IF EXISTS p_pedidos_isolation ON public.pedidos;
CREATE POLICY p_pedidos_isolation ON public.pedidos
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id()
        )
    )
    WITH CHECK (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id()
        )
    );

-- PRODUCTOS
DROP POLICY IF EXISTS p_productos_select ON public.productos;
CREATE POLICY p_productos_select ON public.productos
    FOR SELECT TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id()
        )
    );

DROP POLICY IF EXISTS p_productos_mutation ON public.productos;
CREATE POLICY p_productos_mutation ON public.productos
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND public.get_user_role() = 'admin'
        )
    )
    WITH CHECK (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND public.get_user_role() = 'admin'
        )
    );

-- CAJAS
DROP POLICY IF EXISTS p_cajas_isolation ON public.cajas;
CREATE POLICY p_cajas_isolation ON public.cajas
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id()
        )
    )
    WITH CHECK (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id()
        )
    );

-- EMPLEADOS
DROP POLICY IF EXISTS p_empleados_isolation ON public.empleados;
CREATE POLICY p_empleados_isolation ON public.empleados
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND
            public.get_user_role() IN ('admin', 'auditor')
        )
    )
    WITH CHECK (
        public.is_ultra_admin() OR (
            empresa_id = public.get_tenant_id() AND
            public.get_user_role() = 'admin'
        )
    );

-- 5. TRIGGER DE DESACTIVACIÓN ATÓMICA DE EMPLEADO
CREATE OR REPLACE FUNCTION public.fn_revocar_acceso_empleado_desvinculado()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.estado = 'INACTIVO' AND (OLD.estado IS NULL OR OLD.estado <> 'INACTIVO'))
       OR (NEW.fecha_egreso IS NOT NULL AND NEW.fecha_egreso <= CURRENT_DATE) THEN
        
        UPDATE public.user_tenant_roles
        SET role_status = 'INACTIVE',
            updated_at = NOW()
        WHERE user_id = NEW.id;

        UPDATE public.usuarios
        SET activo = FALSE
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR_REVOCACION_ACCESO: [%] %', SQLSTATE, SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_revocar_acceso_empleado ON public.empleados;
CREATE TRIGGER trg_revocar_acceso_empleado
AFTER UPDATE OF estado, fecha_egreso ON public.empleados
FOR EACH ROW
EXECUTE FUNCTION public.fn_revocar_acceso_empleado_desvinculado();
