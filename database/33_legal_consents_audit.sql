-- ==============================================================================
-- MIGRACIÓN 33: Tabla de Auditoría de Consentimiento Legal (Habeas Data / Ley 1581)
-- ==============================================================================
-- Descripción:
-- Proporciona persistencia inmutable y probatoria para el cumplimiento de la Ley 1581
-- de 2012 (Colombia) y RGPD, registrando la firma electrónica de aceptación de los
-- términos y condiciones de tratamiento de datos personales vinculada al usuario autenticado.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.legal_consents_audit (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v7(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    regulation VARCHAR(100) NOT NULL DEFAULT 'Ley 1581 de 2012 / RGPD',
    version_politica VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACEPTADO' CHECK (status IN ('ACEPTADO', 'REVOCADO')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.legal_consents_audit IS 'Registro inmutable de auditoría legal de consentimiento y tratamiento de datos personales conforme a la Ley 1581 de 2012';

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_legal_consents_user_ver 
ON public.legal_consents_audit (user_id, version_politica, status);

CREATE INDEX IF NOT EXISTS idx_legal_consents_empresa 
ON public.legal_consents_audit (empresa_id, accepted_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.legal_consents_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consents_audit FORCE ROW LEVEL SECURITY;

-- 1. Política de Inserción: El usuario solo puede registrar su propio consentimiento
CREATE POLICY insert_own_legal_consent ON public.legal_consents_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 2. Política de Lectura: El usuario puede consultar sus consentimientos; auditores/admins pueden ver los de su empresa
CREATE POLICY select_legal_consent ON public.legal_consents_audit
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR (
            EXISTS (
                SELECT 1 FROM public.usuarios_roles ur 
                WHERE ur.usuario_id = auth.uid() 
                  AND ur.empresa_id = legal_consents_audit.empresa_id
                  AND ur.rol IN ('SUPERADMIN', 'ADMIN', 'AUDITOR')
            )
        )
    );

-- Nota: NO se crean políticas de UPDATE ni DELETE para garantizar la inmutabilidad legal probatoria.
