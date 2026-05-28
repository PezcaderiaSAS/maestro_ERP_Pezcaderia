-- 05_politicas_rls_y_seguridad.sql
-- Habilitación de RLS (Row Level Security) y políticas de control de acceso basadas en Roles

-- 1. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE terceros ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_ruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- 2. FUNCIÓN AUXILIAR PARA OBTENER EL ROL DEL USUARIO ACTUAL AUTENTICADO
-- Supabase vincula las credenciales de Auth en auth.uid()
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
    v_rol VARCHAR;
BEGIN
    SELECT rol INTO v_rol 
    FROM usuarios 
    WHERE id = auth.uid();
    RETURN v_rol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLÍTICAS GENÉRICAS DE ACCESO PARA ADMIN (CONTROL TOTAL)
-- Los administradores tienen bypass/control total en todas las operaciones
CREATE POLICY admin_all_terceros ON terceros FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_usuarios ON usuarios FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_clientes ON clientes FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_proveedores ON proveedores FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_conductores ON conductores FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_productos ON productos FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_bodegas ON bodegas FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_stock ON stock_bodegas FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_lotes ON lotes_inventario FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_produccion ON ordenes_produccion FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_pedidos ON pedidos FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_detalle ON detalle_pedidos FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_cajas ON cajas FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_transacciones ON transacciones_caja FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_rutas ON rutas FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_gastos ON gastos_ruta FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_config ON configuracion_sistema FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');

-- 4. POLÍTICAS ESPECÍFICAS PARA EL ROL: VENDEDOR
-- Un vendedor puede ver terceros y clientes, pero solo crear o ver pedidos que él mismo gestiona.
CREATE POLICY vendedor_select_terceros ON terceros FOR SELECT TO authenticated 
    USING (get_current_user_role() = 'VENDEDOR');

CREATE POLICY vendedor_select_clientes ON clientes FOR SELECT TO authenticated 
    USING (get_current_user_role() = 'VENDEDOR');

CREATE POLICY vendedor_manage_pedidos ON pedidos FOR ALL TO authenticated 
    USING (get_current_user_role() = 'VENDEDOR' AND vendedor_id = auth.uid())
    WITH CHECK (get_current_user_role() = 'VENDEDOR' AND vendedor_id = auth.uid());

CREATE POLICY vendedor_manage_detalle ON detalle_pedidos FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM pedidos 
        WHERE pedidos.id = detalle_pedidos.pedido_id AND pedidos.vendedor_id = auth.uid()
    ));

-- 5. POLÍTICAS ESPECÍFICAS PARA EL ROL: BODEGUERO
-- Un bodeguero puede gestionar existencias, lotes, traslados y producciones. No tiene acceso a cajas, transacciones o configuración.
CREATE POLICY bodeguero_select_productos ON productos FOR SELECT TO authenticated 
    USING (get_current_user_role() = 'BODEGUERO');

CREATE POLICY bodeguero_manage_lotes ON lotes_inventario FOR ALL TO authenticated 
    USING (get_current_user_role() = 'BODEGUERO')
    WITH CHECK (get_current_user_role() = 'BODEGUERO');

CREATE POLICY bodeguero_manage_produccion ON ordenes_produccion FOR ALL TO authenticated 
    USING (get_current_user_role() = 'BODEGUERO')
    WITH CHECK (get_current_user_role() = 'BODEGUERO' AND autorizado_por = auth.uid());

-- 6. POLÍTICAS ESPECÍFICAS PARA EL ROL: CONDUCTOR
-- Un conductor solo puede ver las rutas de despacho que tiene asignadas y registrar los gastos asociados.
CREATE POLICY conductor_select_rutas ON rutas FOR SELECT TO authenticated 
    USING (get_current_user_role() = 'CONDUCTOR' AND conductor_id = auth.uid());

CREATE POLICY conductor_update_rutas ON rutas FOR UPDATE TO authenticated 
    USING (get_current_user_role() = 'CONDUCTOR' AND conductor_id = auth.uid())
    WITH CHECK (get_current_user_role() = 'CONDUCTOR' AND conductor_id = auth.uid());

CREATE POLICY conductor_manage_gastos ON gastos_ruta FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM rutas 
        WHERE rutas.id = gastos_ruta.ruta_id AND rutas.conductor_id = auth.uid()
    ));

-- 7. RESTRICCIÓN DE ELIMINACIÓN FÍSICA PARA ROLES NO ADMINISTRATIVOS
-- Regla general: Las operaciones de eliminación física (DELETE) están deshabilitadas para todos excepto ADMIN.
CREATE POLICY delete_restrict_all ON terceros FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_pedidos ON pedidos FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_productos ON productos FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
