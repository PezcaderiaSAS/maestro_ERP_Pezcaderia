-- ==============================================================================
-- MIGRACIÓN 37: AISLAMIENTO MULTI-TENANT, MEMBRESÍAS & INVITACIONES RBAC
-- Módulo: SPEC-035 (La Pezcadería ERP)
-- Fecha: 2026-10-27
-- ==============================================================================

-- 1. Tabla: tenants (Empresas / Organizaciones Aisladas)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social TEXT NOT NULL,
    nit TEXT NOT NULL UNIQUE,
    ciudad TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT NOT NULL,
    regimen_tributario TEXT NOT NULL DEFAULT 'COMUN',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla: tenant_memberships (Vinculación de Usuarios con Tenants y Roles RBAC)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'cajero', 'bodeguero', 'supervisor', 'contador')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
    is_owner BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id)
);

-- 3. Tabla: tenant_invitations (Invitaciones con Enlace Seguro y Token de 7 Días)
CREATE TABLE IF NOT EXISTS public.tenant_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'cajero', 'bodeguero', 'supervisor', 'contador')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO (Prevención de Seq Scans por tenant_id)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON public.tenant_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.tenant_invitations(email);

-- ==============================================================================
-- FUNCIONES DE SEGURIDAD CANÓNICAS PARA FILTRADO MULTI-TENANT (SECURITY DEFINER)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_user_tenant_ids()
RETURNS SETOF UUID AS 
BEGIN
    -- Bypass UltraAdministrador Global GOD_MODE (pezcaderia.2022@gmail.com)
    IF (auth.jwt() ->> 'email' = 'pezcaderia.2022@gmail.com') THEN
        RETURN QUERY SELECT id FROM public.tenants;
    ELSE
        RETURN QUERY 
        SELECT tenant_id 
        FROM public.tenant_memberships
        WHERE user_id = auth.uid() 
          AND status = 'active';
    END IF;
END;
 LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(target_tenant_id UUID)
RETURNS BOOLEAN AS 
    SELECT (auth.jwt() ->> 'email' = 'pezcaderia.2022@gmail.com') OR EXISTS (
        SELECT 1 
        FROM public.tenant_memberships
        WHERE tenant_id = target_tenant_id
          AND user_id = auth.uid()
          AND status = 'active'
    );
 LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_is_tenant_admin(target_tenant_id UUID)
RETURNS BOOLEAN AS 
    SELECT (auth.jwt() ->> 'email' = 'pezcaderia.2022@gmail.com') OR EXISTS (
        SELECT 1 
        FROM public.tenant_memberships
        WHERE tenant_id = target_tenant_id
          AND user_id = auth.uid()
          AND role = 'admin'
          AND status = 'active'
    );
 LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) - AISLAMIENTO ESTRICTO ZERO-LEAKAGE
-- ==============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para 'tenants'
DROP POLICY IF EXISTS p_tenants_select ON public.tenants;
CREATE POLICY p_tenants_select ON public.tenants
    FOR SELECT
    USING (id IN (SELECT public.current_user_tenant_ids()));

DROP POLICY IF EXISTS p_tenants_insert ON public.tenants;
CREATE POLICY p_tenants_insert ON public.tenants
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS p_tenants_update ON public.tenants;
CREATE POLICY p_tenants_update ON public.tenants
    FOR UPDATE
    USING (public.user_is_tenant_admin(id))
    WITH CHECK (public.user_is_tenant_admin(id));

-- Políticas para 'tenant_memberships'
DROP POLICY IF EXISTS p_memberships_select ON public.tenant_memberships;
CREATE POLICY p_memberships_select ON public.tenant_memberships
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR tenant_id IN (SELECT public.current_user_tenant_ids())
    );

DROP POLICY IF EXISTS p_memberships_insert ON public.tenant_memberships;
CREATE POLICY p_memberships_insert ON public.tenant_memberships
    FOR INSERT
    WITH CHECK (
        public.user_is_tenant_admin(tenant_id)
        OR (
            is_owner = true 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS p_memberships_update ON public.tenant_memberships;
CREATE POLICY p_memberships_update ON public.tenant_memberships
    FOR UPDATE
    USING (public.user_is_tenant_admin(tenant_id))
    WITH CHECK (public.user_is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS p_memberships_delete ON public.tenant_memberships;
CREATE POLICY p_memberships_delete ON public.tenant_memberships
    FOR DELETE
    USING (public.user_is_tenant_admin(tenant_id) AND is_owner = false);

-- Políticas para 'tenant_invitations'
DROP POLICY IF EXISTS p_invitations_select ON public.tenant_invitations;
CREATE POLICY p_invitations_select ON public.tenant_invitations
    FOR SELECT
    USING (
        tenant_id IN (SELECT public.current_user_tenant_ids())
        OR email = auth.jwt() ->> 'email'
    );

DROP POLICY IF EXISTS p_invitations_insert ON public.tenant_invitations;
CREATE POLICY p_invitations_insert ON public.tenant_invitations
    FOR INSERT
    WITH CHECK (public.user_is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS p_invitations_update ON public.tenant_invitations;
CREATE POLICY p_invitations_update ON public.tenant_invitations
    FOR UPDATE
    USING (
        public.user_is_tenant_admin(tenant_id)
        OR email = auth.jwt() ->> 'email'
    );

-- RPC TRANSACCIONAL
CREATE OR REPLACE FUNCTION public.crear_tenant_onboarding(
    p_razon_social TEXT,
    p_nit TEXT,
    p_ciudad TEXT,
    p_direccion TEXT,
    p_telefono TEXT,
    p_regimen TEXT DEFAULT 'COMUN'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_membership_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado para crear empresa';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.tenant_memberships 
        WHERE user_id = v_user_id AND is_owner = true
    ) THEN
        RAISE EXCEPTION 'El usuario ya cuenta con una empresa registrada como propietario';
    END IF;

    INSERT INTO public.tenants (
        razon_social,
        nit,
        ciudad,
        direccion,
        telefono,
        regimen_tributario,
        activo
    ) VALUES (
        p_razon_social,
        p_nit,
        p_ciudad,
        p_direccion,
        p_telefono,
        COALESCE(p_regimen, 'COMUN'),
        true
    ) RETURNING id INTO v_tenant_id;

    INSERT INTO public.tenant_memberships (
        tenant_id,
        user_id,
        role,
        status,
        is_owner
    ) VALUES (
        v_tenant_id,
        v_user_id,
        'admin',
        'active',
        true
    ) RETURNING id INTO v_membership_id;

    RETURN jsonb_build_object(
        'ok', true,
        'tenant_id', v_tenant_id,
        'membership_id', v_membership_id,
        'bodega_principal_id', '1',
        'caja_principal_codigo', 'CAJA-01'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'ok', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
