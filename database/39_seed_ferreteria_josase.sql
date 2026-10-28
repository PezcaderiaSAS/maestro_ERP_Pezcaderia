-- ==============================================================================
-- MIGRACIÓN / SEED 39: EMPRESA FERRETERÍA JOSASE Y EQUIPO OPERATIVO
-- ==============================================================================
-- Módulo: Multi-Tenant Enterprise / Super Admin
-- Empresa: Ferretería Josase S.A.S. (NIT: 901.954.321-8)
-- Contacto: FERRETERIAJOSASE@HOTMAIL.COM | Tel: 3164696581
-- ==============================================================================

DO $$
DECLARE
    v_tenant_id UUID := 'e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID;
    v_bodega_id UUID;
    v_caja_id UUID;
BEGIN
    -- 1. Insertar Tenant Ferretería Josase si no existe
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE nit = '901.954.321-8' OR id = v_tenant_id) THEN
        INSERT INTO public.tenants (
            id,
            razon_social,
            nit,
            ciudad,
            direccion,
            telefono,
            regimen_tributario,
            activo,
            created_at,
            updated_at
        ) VALUES (
            v_tenant_id,
            'Ferretería Josase S.A.S.',
            '901.954.321-8',
            'Bucaramanga',
            'Sede Principal Comercial',
            '3164696581',
            'COMUN',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Tenant Ferretería Josase creado con id %', v_tenant_id;
    END IF;

    -- 2. Asegurar Bodega Principal para Ferretería Josase
    IF NOT EXISTS (SELECT 1 FROM public.bodegas WHERE tenant_id = v_tenant_id) THEN
        INSERT INTO public.bodegas (
            id,
            tenant_id,
            nombre,
            tipo,
            activa,
            created_at
        ) VALUES (
            gen_random_uuid(),
            v_tenant_id,
            'Bodega Principal Josase',
            'GENERAL',
            true,
            now()
        );
        RAISE NOTICE 'Bodega Principal aprovisionada para Ferretería Josase';
    END IF;

    -- 3. Asegurar Caja Principal 01 para Ferretería Josase
    IF NOT EXISTS (SELECT 1 FROM public.cajas WHERE tenant_id = v_tenant_id) THEN
        INSERT INTO public.cajas (
            id,
            tenant_id,
            codigo,
            nombre,
            estado,
            created_at
        ) VALUES (
            gen_random_uuid(),
            v_tenant_id,
            'CAJA-01',
            'Caja Principal Josase',
            'CERRADA',
            now()
        );
        RAISE NOTICE 'Caja 01 aprovisionada para Ferretería Josase';
    END IF;
END $$;

-- 4. Registro de Empleados de Ferretería Josase en public.tenant_invitations / membresías
-- Empleados:
-- 1. CC 1099373207 - DIEGO IVAN DIAZ ANAYA (DiegoDiazJosase@gmail.com, Tel: 3184291362) - Rol: VENDEDOR
-- 2. CC 1050548644 - LUIS EDUARDO BANQUEZ MEJIA (LuisEduardoJosase@gmail.com, Tel: 3185660739) - Rol: VENDEDOR
-- 3. CC 1001047015 - DAVID SANTIAGO PALLARES (SantiagoPallaresJosase@gmail.com, Tel: 3184291386) - Rol: VENDEDOR
-- 4. CC 1005078068 - JUAN MANUEL MORA MORA (ManuelMoraJosase@gmail.com, Tel: 3185660733) - Rol: VENDEDOR
-- 5. CC 1098812420 - JEYMY KATERINE MONSALVE CACERES (FERRETERIAJOSASE@HOTMAIL.COM, Tel: 3164696581) - Rol: VENDEDOR
-- 6. CC 1005369392 - LADY YURANI GALVIS GALVIS (YuraniGalvisJosase@gmail.com / FERRETERIAJOSASE@HOTMAIL.COM, Tel: 3164696581) - Rol: CAJERO
-- 7. CC 1098000001 (Pendiente) - LINA MARIA SOTO (LinaSotoJosase@gmail.com / FERRETERIAJOSASE@HOTMAIL.COM, Tel: 3164696581) - Rol: ADMINISTRADOR

INSERT INTO public.tenant_invitations (tenant_id, nombre, email, role, token, expires_at, status)
VALUES
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'DIEGO IVAN DIAZ ANAYA', 'DiegoDiazJosase@gmail.com', 'vendedor', 'inv-josase-01-' || md5(random()::text), now() + interval '30 days', 'pending'),
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'LUIS EDUARDO BANQUEZ MEJIA', 'LuisEduardoJosase@gmail.com', 'vendedor', 'inv-josase-02-' || md5(random()::text), now() + interval '30 days', 'pending'),
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'DAVID SANTIAGO PALLARES', 'SantiagoPallaresJosase@gmail.com', 'vendedor', 'inv-josase-03-' || md5(random()::text), now() + interval '30 days', 'pending'),
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'JUAN MANUEL MORA MORA', 'ManuelMoraJosase@gmail.com', 'vendedor', 'inv-josase-04-' || md5(random()::text), now() + interval '30 days', 'pending'),
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'JEYMY KATERINE MONSALVE CACERES', 'FERRETERIAJOSASE@HOTMAIL.COM', 'vendedor', 'inv-josase-05-' || md5(random()::text), now() + interval '30 days', 'pending'),
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'LADY YURANI GALVIS GALVIS', 'YuraniGalvisJosase@gmail.com', 'cajero', 'inv-josase-06-' || md5(random()::text), now() + interval '30 days', 'pending'),
    ('e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'::UUID, 'LINA MARIA SOTO', 'LinaSotoJosase@gmail.com', 'admin', 'inv-josase-07-' || md5(random()::text), now() + interval '30 days', 'pending')
ON CONFLICT (email) DO NOTHING;

