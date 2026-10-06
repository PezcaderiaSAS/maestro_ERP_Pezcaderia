-- Migración: Módulo POS (Punto de Venta) y Gestión de Caja
-- Dependencia: asume existencia de función get_current_tenant_id() o extracción de JWT.

-- 1. Tablas Base
CREATE TABLE IF NOT EXISTS public.pos_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID NOT NULL REFERENCES public.pos_registers(id),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    user_id UUID NOT NULL, -- ID del cajero
    opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    expected_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    declared_amount DECIMAL(12,2),
    difference DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, PENDING_AUDIT, CLOSED
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.pos_cash_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.pos_sessions(id),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255) NOT NULL, -- RETIRO_PARCIAL, FONDO_FIJO, REMESACION
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pos_replenishment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    user_id UUID NOT NULL,
    target_warehouse_id UUID NOT NULL,
    product_id UUID NOT NULL,
    requested_quantity DECIMAL(12,3) NOT NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, DISPATCHED, RECEIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.pos_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cash_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_replenishment_requests ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (Aislamiento Multi-Tenant estricto)
-- Asume que el JWT inyecta el tenant_id en app_metadata
CREATE POLICY "Aislamiento tenant en cajas" 
ON public.pos_registers FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en sesiones" 
ON public.pos_sessions FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en traslados" 
ON public.pos_cash_transfers FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en reabastecimiento" 
ON public.pos_replenishment_requests FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
