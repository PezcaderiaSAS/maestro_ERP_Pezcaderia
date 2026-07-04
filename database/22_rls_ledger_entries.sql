-- =================================================================================
-- Fase 2.5: Políticas de Seguridad (RLS) para Contabilidad
-- MaestroPescaderia ERP
-- =================================================================================

-- 1. Habilitar RLS en ledger_entries (por si no estaba habilitado)
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 2. Política de Lectura (SELECT)
-- Los administradores pueden ver todo. 
-- Los cajeros/vendedores solo pueden ver los asientos de su propia sucursal (basado en el token JWT).
CREATE POLICY "Permitir select en ledger_entries por sucursal" ON public.ledger_entries
FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'admin') 
    OR 
    (branch_id = (auth.jwt() ->> 'branch_id'))
);

-- 3. Política de Inserción (INSERT)
-- Se permite insertar asientos solo si pertenecen a la sucursal del usuario (o admin).
-- NOTA: La función RPC record_ledger_transaction tiene SECURITY DEFINER, por lo que hace bypass de RLS 
-- durante la ejecución, pero aún así es buena práctica asegurar la tabla contra inserciones directas maliciosas.
CREATE POLICY "Permitir insert en ledger_entries por sucursal" ON public.ledger_entries
FOR INSERT
WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') 
    OR 
    (branch_id = (auth.jwt() ->> 'branch_id'))
);

-- 4. Política de Actualización (UPDATE)
-- Los asientos contables no deberían modificarse. Si hay un error, se debe hacer un asiento de reversión.
-- Bloqueamos UPDATE para todos los roles (incluso admin, por integridad contable estricta).
CREATE POLICY "Bloquear update en ledger_entries" ON public.ledger_entries
FOR UPDATE
USING (false);

-- 5. Política de Eliminación (DELETE)
-- Los asientos contables no se eliminan. Se anulan mediante asientos compensatorios.
CREATE POLICY "Bloquear delete en ledger_entries" ON public.ledger_entries
FOR DELETE
USING (false);

-- Habilitar RLS en accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Las cuentas contables son globales y públicas para lectura
CREATE POLICY "Permitir select global en accounts" ON public.accounts
FOR SELECT
USING (true);

-- Solo admin puede crear, actualizar o borrar cuentas
CREATE POLICY "Solo admin puede modificar accounts" ON public.accounts
FOR ALL
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
