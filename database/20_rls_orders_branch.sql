-- =================================================================================
-- Fase 1: Políticas de Seguridad (RLS) por Sucursal
-- MaestroPescaderia ERP
-- =================================================================================

-- 1. Habilitar RLS en la tabla de órdenes (si no estaba habilitada)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas previas para evitar conflictos (opcional, ajusta si hay políticas que quieres mantener)
DROP POLICY IF EXISTS "Ver ordenes de mi sucursal" ON public.orders;
DROP POLICY IF EXISTS "Insertar ordenes de mi sucursal" ON public.orders;
DROP POLICY IF EXISTS "Actualizar ordenes de mi sucursal" ON public.orders;
DROP POLICY IF EXISTS "Eliminar ordenes de mi sucursal" ON public.orders;

-- 3. Crear Políticas (Policies)

-- Política de LECTURA (SELECT)
-- Los usuarios solo pueden ver las órdenes que pertenecen a la sucursal asignada en su token JWT
CREATE POLICY "Ver ordenes de mi sucursal" 
ON public.orders 
FOR SELECT 
USING (
  branch_id = auth.jwt() ->> 'branch_id' 
  OR 
  (auth.jwt() ->> 'role') = 'ADMIN' -- Los administradores pueden ver todas las órdenes
);

-- Política de INSERCIÓN (INSERT)
-- Los usuarios solo pueden crear órdenes para su propia sucursal
CREATE POLICY "Insertar ordenes de mi sucursal" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  branch_id = auth.jwt() ->> 'branch_id'
  OR 
  (auth.jwt() ->> 'role') = 'ADMIN'
);

-- Política de ACTUALIZACIÓN (UPDATE)
CREATE POLICY "Actualizar ordenes de mi sucursal" 
ON public.orders 
FOR UPDATE 
USING (
  branch_id = auth.jwt() ->> 'branch_id'
  OR 
  (auth.jwt() ->> 'role') = 'ADMIN'
)
WITH CHECK (
  branch_id = auth.jwt() ->> 'branch_id'
  OR 
  (auth.jwt() ->> 'role') = 'ADMIN'
);

-- Política de ELIMINACIÓN (DELETE)
CREATE POLICY "Eliminar ordenes de mi sucursal" 
ON public.orders 
FOR DELETE 
USING (
  branch_id = auth.jwt() ->> 'branch_id'
  OR 
  (auth.jwt() ->> 'role') = 'ADMIN'
);

-- Nota: Asegúrate de que el proceso de autenticación o el middleware que genera el JWT 
-- inyecte correctamente el claim 'branch_id' en el token de Supabase.
