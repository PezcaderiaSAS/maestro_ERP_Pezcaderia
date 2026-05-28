-- 06_recursos_humanos.sql
-- Estructuración del módulo de Recursos Humanos, gestión de empleados y hojas de vida

-- 1. CREACIÓN DE LA TABLA: empleados (Hereda de terceros)
CREATE TABLE empleados (
    id UUID PRIMARY KEY REFERENCES terceros(id) ON DELETE RESTRICT,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_egreso DATE,
    url_hoja_vida VARCHAR(500), -- Enlace seguro al bucket de almacenamiento en Supabase Storage
    cargo VARCHAR(100) NOT NULL,
    salario_base NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (salario_base >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA')),
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_fechas_contrato CHECK (fecha_egreso IS NULL OR fecha_egreso >= fecha_ingreso)
);

-- Habilitar Row Level Security
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS PARA EL MÓDULO DE RECURSOS HUMANOS
-- Solo administradores pueden ver, editar o eliminar empleados e información laboral
CREATE POLICY admin_all_empleados ON empleados FOR ALL TO authenticated
    USING (get_current_user_role() = 'ADMIN')
    WITH CHECK (get_current_user_role() = 'ADMIN');

-- 3. TRIGGERS Y AUTOMATIZACIONES DE SEGURIDAD

-- Trigger para desactivar el acceso del usuario en la tabla usuarios si el empleado pasa a 'INACTIVO'
CREATE OR REPLACE FUNCTION desactivar_acceso_usuario_por_desvinculacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'INACTIVO' OR NEW.fecha_egreso <= CURRENT_DATE THEN
        UPDATE usuarios
        SET activo = FALSE
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_desactivar_acceso_empleado
AFTER INSERT OR UPDATE OF estado, fecha_egreso ON empleados
FOR EACH ROW
EXECUTE FUNCTION desactivar_acceso_usuario_por_desvinculacion();
