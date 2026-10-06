-- Migración: RPCs para POS
-- Implementación de Lógica de Negocio (ACID) y Prevención de Concurrencia

-- 1. Arqueo Ciego (Blind Cash Count)
CREATE OR REPLACE FUNCTION public.rpc_perform_blind_cash_count(
    p_session_id UUID,
    p_declared_amount DECIMAL(12,2)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_difference DECIMAL(12,2);
    v_tenant_id UUID;
BEGIN
    -- 1. Autenticación y Tenant
    v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

    -- 2. Bloqueo Pesimista (SELECT FOR UPDATE) para prevenir "Race Conditions"
    SELECT * INTO v_session 
    FROM public.pos_sessions 
    WHERE id = p_session_id AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesión no encontrada o acceso denegado por Tenant RLS';
    END IF;

    IF v_session.status != 'OPEN' THEN
        RAISE EXCEPTION 'La sesión no está abierta, no se puede realizar arqueo';
    END IF;

    -- 3. Cálculo Ciego
    v_difference := p_declared_amount - v_session.expected_cash;

    -- 4. Actualización Atómica
    UPDATE public.pos_sessions
    SET declared_amount = p_declared_amount,
        difference = v_difference,
        status = 'PENDING_AUDIT', -- Transición de estado a Auditoría
        closed_at = NOW()
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'difference', v_difference,
        'status', 'PENDING_AUDIT'
    );
END;
$$;

-- 2. Traslados de Efectivo (Retiros, Remesas, Pago a Proveedores Express)
CREATE OR REPLACE FUNCTION public.rpc_transfer_cash(
    p_session_id UUID,
    p_amount DECIMAL(12,2),
    p_reason VARCHAR(255)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_tenant_id UUID;
    v_transfer_id UUID;
BEGIN
    v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

    -- Bloqueo explícito de la sesión origen para evitar Deadlocks
    -- en caso de traslados concurrentes.
    SELECT * INTO v_session 
    FROM public.pos_sessions 
    WHERE id = p_session_id AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesión no encontrada o acceso denegado';
    END IF;

    IF v_session.status != 'OPEN' THEN
        RAISE EXCEPTION 'No se puede retirar dinero de una caja cerrada';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'El monto debe ser mayor a cero';
    END IF;

    -- Validar si hay suficientes fondos esperados (opcional dependiendo de reglas de negocio, 
    -- pero usualmente no puedes sacar más del expected_cash a menos que la caja quede en negativo)
    IF v_session.expected_cash < p_amount THEN
        RAISE EXCEPTION 'Fondos insuficientes en la caja para este traslado';
    END IF;

    -- Actualización de la expectativa de efectivo (Expected Cash)
    UPDATE public.pos_sessions
    SET expected_cash = expected_cash - p_amount
    WHERE id = p_session_id;

    -- Inserción del Movimiento en bitácora de auditoría
    INSERT INTO public.pos_cash_transfers (session_id, tenant_id, branch_id, user_id, amount, reason)
    VALUES (p_session_id, v_tenant_id, v_session.branch_id, v_session.user_id, p_amount, p_reason)
    RETURNING id INTO v_transfer_id;

    RETURN jsonb_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'new_expected_cash', v_session.expected_cash - p_amount
    );
END;
$$;
