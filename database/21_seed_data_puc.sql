-- =================================================================================
-- Fase 1.5: Seed Data - Catálogo de Cuentas Básico (PUC Colombia)
-- MaestroPescaderia ERP
-- =================================================================================

-- Insertar cuentas básicas requeridas para operar (Caja, Bancos, Ingresos, Gastos, etc.)
-- Se utiliza ON CONFLICT DO NOTHING para evitar duplicados si el script se corre múltiples veces.

INSERT INTO public.accounts (code, name, type) VALUES
('1105', 'Caja', 'ASSET'),
('1110', 'Bancos', 'ASSET'),
('1435', 'Inventario (Mercancías no fabricadas)', 'ASSET'),
('2205', 'Proveedores Nacionales', 'LIABILITY'),
('2408', 'Impuestos sobre las ventas por pagar (IVA)', 'LIABILITY'),
('3105', 'Capital Suscrito y Pagado', 'EQUITY'),
('4135', 'Ventas (Comercio al por mayor y al por menor)', 'REVENUE'),
('5105', 'Gastos de Personal', 'EXPENSE'),
('5195', 'Gastos Diversos', 'EXPENSE'),
('6135', 'Costo de Ventas', 'EXPENSE')
ON CONFLICT (code) DO NOTHING;

-- Mensaje de confirmación
-- SELECT 'Catálogo de cuentas (Seed Data) insertado con éxito' as status;
