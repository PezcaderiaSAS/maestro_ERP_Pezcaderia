-- ============================================================================
-- 23_enterprise_multi_tenant_rls.sql
-- MIGRACIÓN ENTERPRISE: Aislamiento Multi-Tenant, RLS Estricto y Manejo de Excepciones
-- ============================================================================

-- 1. CREACIÓN DE TABLA DE EMPRESAS (Si no existe)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nit VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(150),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserción de Empresa por Defecto para migración de datos existentes
INSERT INTO empresas (id, nit, razon_social, nombre_comercial)
VALUES ('00000000-0000-0000-0000-000000000001', '901234567-8', 'LA PEZCADERIA S.A.S.', 'LA PEZCADERIA GOURMET')
ON CONFLICT (nit) DO NOTHING;

-- 2. FUNCIÓN HÍBRIDA RESILIENTE: get_current_empresa_id()
-- Lee prioritariamente el claim del JWT de Supabase; si no existe, hace fallback a la tabla usuarios
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID AS $$
DECLARE
    v_empresa_id UUID;
    v_jwt_val TEXT;
BEGIN
    -- Intento 1: Leer desde JWT app_metadata o user_metadata
    BEGIN
        v_jwt_val := COALESCE(
            auth.jwt() -> 'app_metadata' ->> 'empresa_id',
            auth.jwt() -> 'user_metadata' ->> 'empresa_id'
        );
        IF v_jwt_val IS NOT NULL AND v_jwt_val <> '' THEN
            RETURN v_jwt_val::UUID;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Continuar al fallback
    END;

    -- Intento 2: Fallback resiliente consultando la tabla usuarios mediante auth.uid()
    IF auth.uid() IS NOT NULL THEN
        SELECT empresa_id INTO v_empresa_id
        FROM usuarios
        WHERE id = auth.uid();
        
        IF v_empresa_id IS NOT NULL THEN
            RETURN v_empresa_id;
        END IF;
    END IF;

    -- Fallback final para migraciones/scripts de seed ejecutados por superuser
    RETURN '00000000-0000-0000-0000-000000000001'::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. INYECCIÓN DE empresa_id EN TODAS LAS TABLAS OPERATIVAS
DO $$
BEGIN
    -- usuarios
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'empresa_id') THEN
        ALTER TABLE usuarios ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- clientes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'empresa_id') THEN
        ALTER TABLE clientes ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- productos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'empresa_id') THEN
        ALTER TABLE productos ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- bodegas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bodegas' AND column_name = 'empresa_id') THEN
        ALTER TABLE bodegas ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- pedidos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'empresa_id') THEN
        ALTER TABLE pedidos ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- cotizaciones (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cotizaciones') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'empresa_id') THEN
            ALTER TABLE cotizaciones ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
        END IF;
    END IF;

    -- cajas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cajas' AND column_name = 'empresa_id') THEN
        ALTER TABLE cajas ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- transacciones_caja
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacciones_caja' AND column_name = 'empresa_id') THEN
        ALTER TABLE transacciones_caja ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- empleados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empleados') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'empresa_id') THEN
            ALTER TABLE empleados ADD COLUMN empresa_id UUID REFERENCES empresas(id) DEFAULT '00000000-0000-0000-0000-000000000001';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'consentimiento_firmado') THEN
            ALTER TABLE empleados ADD COLUMN consentimiento_firmado BOOLEAN DEFAULT FALSE;
            ALTER TABLE empleados ADD COLUMN consentimiento_fecha TIMESTAMP WITH TIME ZONE;
        END IF;
    END IF;
END $$;

-- 4. ÍNDICES DE ALTO RENDIMIENTO PARA FILTROS RLS
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bodegas_empresa ON bodegas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cajas_empresa ON cajas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_caja_empresa ON transacciones_caja(empresa_id);

-- 5. POLÍTICAS RLS BLINDADAS CON AISLAMIENTO MULTI-TENANT

-- Habilitar RLS en empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_empresas ON empresas;
CREATE POLICY tenant_isolation_empresas ON empresas
    FOR SELECT TO authenticated
    USING (id = get_current_empresa_id());

-- Clientes
DROP POLICY IF EXISTS admin_all_clientes ON clientes;
DROP POLICY IF EXISTS vendedor_select_clientes ON clientes;
DROP POLICY IF EXISTS tenant_isolation_clientes ON clientes;

CREATE POLICY tenant_isolation_clientes ON clientes
    FOR ALL TO authenticated
    USING (empresa_id = get_current_empresa_id())
    WITH CHECK (empresa_id = get_current_empresa_id());

-- Productos
DROP POLICY IF EXISTS admin_all_productos ON productos;
DROP POLICY IF EXISTS tenant_isolation_productos ON productos;

CREATE POLICY tenant_isolation_productos ON productos
    FOR SELECT TO authenticated
    USING (empresa_id = get_current_empresa_id());

CREATE POLICY tenant_manage_productos ON productos
    FOR ALL TO authenticated
    USING (empresa_id = get_current_empresa_id() AND get_current_user_role() IN ('ADMIN', 'SUPERVISOR'))
    WITH CHECK (empresa_id = get_current_empresa_id() AND get_current_user_role() IN ('ADMIN', 'SUPERVISOR'));

-- Pedidos
DROP POLICY IF EXISTS admin_all_pedidos ON pedidos;
DROP POLICY IF EXISTS vendedor_manage_pedidos ON pedidos;
DROP POLICY IF EXISTS tenant_isolation_pedidos ON pedidos;

CREATE POLICY tenant_isolation_pedidos ON pedidos
    FOR ALL TO authenticated
    USING (empresa_id = get_current_empresa_id())
    WITH CHECK (
        empresa_id = get_current_empresa_id() AND (
            get_current_user_role() IN ('ADMIN', 'SUPERVISOR') OR
            (get_current_user_role() = 'VENDEDOR' AND vendedor_id = auth.uid())
        )
    );

-- Cajas
DROP POLICY IF EXISTS admin_all_cajas ON cajas;
DROP POLICY IF EXISTS tenant_isolation_cajas ON cajas;

CREATE POLICY tenant_isolation_cajas ON cajas
    FOR ALL TO authenticated
    USING (empresa_id = get_current_empresa_id())
    WITH CHECK (empresa_id = get_current_empresa_id());

-- Transacciones Caja
DROP POLICY IF EXISTS admin_all_transacciones ON transacciones_caja;
DROP POLICY IF EXISTS tenant_isolation_transacciones ON transacciones_caja;

CREATE POLICY tenant_isolation_transacciones ON transacciones_caja
    FOR ALL TO authenticated
    USING (empresa_id = get_current_empresa_id())
    WITH CHECK (empresa_id = get_current_empresa_id());

-- Empleados (RRHH)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empleados') THEN
        EXECUTE 'DROP POLICY IF EXISTS admin_all_empleados ON empleados;';
        EXECUTE 'DROP POLICY IF EXISTS tenant_isolation_empleados ON empleados;';
        EXECUTE 'CREATE POLICY tenant_isolation_empleados ON empleados
            FOR ALL TO authenticated
            USING (empresa_id = get_current_empresa_id() AND get_current_user_role() IN (''ADMIN'', ''RRHH''))
            WITH CHECK (empresa_id = get_current_empresa_id() AND get_current_user_role() IN (''ADMIN'', ''RRHH''));';
    END IF;
END $$;

-- 6. TRIGGERS ROBUSTOS CON CAPTURA DE EXCEPCIONES Y CÓDIGOS LEGIBLES

-- Trigger de validación de merma y autorización de PIN (>35%)
CREATE OR REPLACE FUNCTION validar_merma_despiece()
RETURNS TRIGGER AS $$
DECLARE
    v_merma_pct NUMERIC(5,2);
BEGIN
    IF NEW.peso_salida > 0 AND NEW.peso_entrada > 0 THEN
        v_merma_pct := ((NEW.peso_entrada - NEW.peso_salida) / NEW.peso_entrada) * 100.0;
        
        IF v_merma_pct > 35.0 THEN
            IF NEW.pin_autorizacion IS NULL OR LENGTH(TRIM(NEW.pin_autorizacion)) < 4 THEN
                RAISE EXCEPTION 'MERMA_EXCESIVA_SIN_PIN: La merma del despiece (%%) supera el umbral permitido del 35%%%% y requiere PIN de supervisor.', ROUND(v_merma_pct, 2)
                    USING ERRCODE = 'P0001',
                          HINT = 'Proporcione el PIN del supervisor en el campo pin_autorizacion';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR_PRODUCCION: [%] %', SQLSTATE, SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para desactivar acceso de empleado por desvinculación
CREATE OR REPLACE FUNCTION desactivar_acceso_usuario_por_desvinculacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'INACTIVO' OR (NEW.fecha_egreso IS NOT NULL AND NEW.fecha_egreso <= CURRENT_DATE) THEN
        UPDATE usuarios
        SET activo = FALSE
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR_DESVINCULACION_RRHH: [%] %', SQLSTATE, SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$ LANGUAGE plpgsql;
