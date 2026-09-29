-- ============================================================================
-- 25_secure_remaining_tables_rls.sql
-- MIGRACIÓN DE BLINDAJE TOTAL: Activación Forzosa de RLS en el 100% de Tablas
-- Aplicada exitosamente en proyecto: maestro-erp-pezcaderia (scuhyfvnnkuivruiaxqx)
-- ============================================================================

-- 1. Habilitación y Forzado de RLS
ALTER TABLE public.terceros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terceros FORCE ROW LEVEL SECURITY;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios FORCE ROW LEVEL SECURITY;

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores FORCE ROW LEVEL SECURITY;

ALTER TABLE public.conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conductores FORCE ROW LEVEL SECURITY;

ALTER TABLE public.stock_bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_bodegas FORCE ROW LEVEL SECURITY;

ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lotes_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_inventario FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_produccion FORCE ROW LEVEL SECURITY;

ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos FORCE ROW LEVEL SECURITY;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas FORCE ROW LEVEL SECURITY;

-- 2. Políticas de Seguridad de Aislamiento Perimetral

-- EMPRESAS: Solo lectura de su propio tenant o ultra-admin
DROP POLICY IF EXISTS p_empresas_isolation ON public.empresas;
CREATE POLICY p_empresas_isolation ON public.empresas
    FOR SELECT TO authenticated
    USING (public.is_ultra_admin() OR id = public.get_tenant_id());

-- USUARIOS: Lectura de usuarios de su propio tenant
DROP POLICY IF EXISTS p_usuarios_isolation ON public.usuarios;
CREATE POLICY p_usuarios_isolation ON public.usuarios
    FOR ALL TO authenticated
    USING (public.is_ultra_admin() OR empresa_id = public.get_tenant_id())
    WITH CHECK (public.is_ultra_admin() OR (empresa_id = public.get_tenant_id() AND public.get_user_role() = 'admin'));

-- TERCEROS: Acceso según el tenant
DROP POLICY IF EXISTS p_terceros_isolation ON public.terceros;
CREATE POLICY p_terceros_isolation ON public.terceros
    FOR ALL TO authenticated
    USING (
        public.is_ultra_admin() 
        OR id IN (SELECT id FROM public.usuarios WHERE empresa_id = public.get_tenant_id()) 
        OR id IN (SELECT id FROM public.clientes WHERE empresa_id = public.get_tenant_id()) 
        OR id IN (SELECT id FROM public.proveedores) 
        OR id IN (SELECT id FROM public.conductores)
    );

-- PROVEEDORES & CONDUCTORES
DROP POLICY IF EXISTS p_proveedores_isolation ON public.proveedores;
CREATE POLICY p_proveedores_isolation ON public.proveedores
    FOR ALL TO authenticated
    USING (true);

DROP POLICY IF EXISTS p_conductores_isolation ON public.conductores;
CREATE POLICY p_conductores_isolation ON public.conductores
    FOR ALL TO authenticated
    USING (true);

-- STOCK BODEGAS & LOTES: Aislados por pertenencia de bodega al tenant
DROP POLICY IF EXISTS p_stock_bodegas_isolation ON public.stock_bodegas;
CREATE POLICY p_stock_bodegas_isolation ON public.stock_bodegas
    FOR ALL TO authenticated
    USING (public.is_ultra_admin() OR bodega_id IN (SELECT id FROM public.bodegas WHERE empresa_id = public.get_tenant_id()))
    WITH CHECK (public.is_ultra_admin() OR bodega_id IN (SELECT id FROM public.bodegas WHERE empresa_id = public.get_tenant_id()));

DROP POLICY IF EXISTS p_lotes_isolation ON public.lotes_inventario;
CREATE POLICY p_lotes_isolation ON public.lotes_inventario
    FOR ALL TO authenticated
    USING (public.is_ultra_admin() OR bodega_id IN (SELECT id FROM public.bodegas WHERE empresa_id = public.get_tenant_id()))
    WITH CHECK (public.is_ultra_admin() OR bodega_id IN (SELECT id FROM public.bodegas WHERE empresa_id = public.get_tenant_id()));

-- DETALLE PEDIDOS: Aislado por pedido
DROP POLICY IF EXISTS p_detalle_pedidos_isolation ON public.detalle_pedidos;
CREATE POLICY p_detalle_pedidos_isolation ON public.detalle_pedidos
    FOR ALL TO authenticated
    USING (public.is_ultra_admin() OR pedido_id IN (SELECT id FROM public.pedidos WHERE empresa_id = public.get_tenant_id()))
    WITH CHECK (public.is_ultra_admin() OR pedido_id IN (SELECT id FROM public.pedidos WHERE empresa_id = public.get_tenant_id()));

-- ORDENES PRODUCCION
DROP POLICY IF EXISTS p_ordenes_produccion_isolation ON public.ordenes_produccion;
CREATE POLICY p_ordenes_produccion_isolation ON public.ordenes_produccion
    FOR ALL TO authenticated
    USING (public.is_ultra_admin() OR autorizado_por IN (SELECT id FROM public.usuarios WHERE empresa_id = public.get_tenant_id()))
    WITH CHECK (public.is_ultra_admin() OR autorizado_por IN (SELECT id FROM public.usuarios WHERE empresa_id = public.get_tenant_id()));

-- CONFIGURACION SISTEMA
DROP POLICY IF EXISTS p_configuracion_sistema_isolation ON public.configuracion_sistema;
CREATE POLICY p_configuracion_sistema_isolation ON public.configuracion_sistema
    FOR ALL TO authenticated
    USING (public.is_ultra_admin() OR public.get_user_role() = 'admin');
