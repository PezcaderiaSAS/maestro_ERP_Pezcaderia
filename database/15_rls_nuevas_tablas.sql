-- 15_rls_nuevas_tablas.sql
-- RLS para tablas nuevas creadas en Fases 0.1–0.7
-- Sigue el mismo patrón que 05_politicas_rls_y_seguridad.sql

-- 1. HABILITAR RLS
ALTER TABLE productos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartera_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartera_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_arqueo ENABLE ROW LEVEL SECURITY;
ALTER TABLE traslados_dinero ENABLE ROW LEVEL SECURITY;

-- 2. ADMIN: control total en todas las tablas nuevas
CREATE POLICY admin_all_catalogo ON productos_catalogo FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_precios ON productos_precios FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_movimientos ON inventario_movimientos FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_cartera ON cartera_facturas FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_cartera_pagos ON cartera_pagos FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_oc ON ordenes_compra FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_oc_items ON ordenes_compra_items FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_cotizaciones ON cotizaciones FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_cotizaciones_items ON cotizaciones_items FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_turnos ON turnos_caja FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_mov_caja ON movimientos_caja FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_arqueo ON detalles_arqueo FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY admin_all_traslados ON traslados_dinero FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN');

-- 3. VENDEDOR: puede ver catálogo y precios, gestionar cotizaciones y cartera
CREATE POLICY vendedor_select_catalogo ON productos_catalogo FOR SELECT TO authenticated
    USING (get_current_user_role() = 'VENDEDOR');
CREATE POLICY vendedor_select_precios ON productos_precios FOR SELECT TO authenticated
    USING (get_current_user_role() = 'VENDEDOR');
CREATE POLICY vendedor_select_cartera ON cartera_facturas FOR SELECT TO authenticated
    USING (get_current_user_role() = 'VENDEDOR');
CREATE POLICY vendedor_select_cartera_pagos ON cartera_pagos FOR SELECT TO authenticated
    USING (get_current_user_role() = 'VENDEDOR');
CREATE POLICY vendedor_manage_cotizaciones ON cotizaciones FOR ALL TO authenticated
    USING (get_current_user_role() = 'VENDEDOR')
    WITH CHECK (get_current_user_role() = 'VENDEDOR');
CREATE POLICY vendedor_manage_cotizaciones_items ON cotizaciones_items FOR ALL TO authenticated
    USING (get_current_user_role() = 'VENDEDOR')
    WITH CHECK (get_current_user_role() = 'VENDEDOR');

-- 4. BODEGUERO: inventario, movimientos, órdenes de compra, cotizaciones en alistamiento
CREATE POLICY bodeguero_select_catalogo ON productos_catalogo FOR SELECT TO authenticated
    USING (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_select_precios ON productos_precios FOR SELECT TO authenticated
    USING (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_manage_movimientos ON inventario_movimientos FOR ALL TO authenticated
    USING (get_current_user_role() = 'BODEGUERO')
    WITH CHECK (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_manage_oc ON ordenes_compra FOR ALL TO authenticated
    USING (get_current_user_role() = 'BODEGUERO')
    WITH CHECK (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_manage_oc_items ON ordenes_compra_items FOR ALL TO authenticated
    USING (get_current_user_role() = 'BODEGUERO')
    WITH CHECK (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_read_cotizaciones ON cotizaciones FOR SELECT TO authenticated
    USING (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_read_cotizaciones_items ON cotizaciones_items FOR SELECT TO authenticated
    USING (get_current_user_role() = 'BODEGUERO');
CREATE POLICY bodeguero_update_cotizaciones ON cotizaciones FOR UPDATE TO authenticated
    USING (get_current_user_role() = 'BODEGUERO' AND estado IN ('APPROVED', 'PAUSADO'))
    WITH CHECK (get_current_user_role() = 'BODEGUERO');

-- 5. CONDUCTOR: solo lectura de inventario (para verificación)
CREATE POLICY conductor_select_catalogo ON productos_catalogo FOR SELECT TO authenticated
    USING (get_current_user_role() = 'CONDUCTOR');
CREATE POLICY conductor_select_movimientos ON inventario_movimientos FOR SELECT TO authenticated
    USING (get_current_user_role() = 'CONDUCTOR');

-- 6. DELETE RESTRICT: solo admin puede eliminar físicamente
CREATE POLICY delete_restrict_catalogo ON productos_catalogo FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_movimientos ON inventario_movimientos FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_cartera ON cartera_facturas FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_oc ON ordenes_compra FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_cotizaciones ON cotizaciones FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_turnos ON turnos_caja FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
CREATE POLICY delete_restrict_mov_caja ON movimientos_caja FOR DELETE TO authenticated USING (get_current_user_role() = 'ADMIN');
