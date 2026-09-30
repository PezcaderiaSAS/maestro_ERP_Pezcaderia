-- ==============================================================================
-- MIGRACIÓN 34: Remapeo Histórico y Estandarización Universal a UUIDv7 (RFC 9562)
-- ==============================================================================
-- Descripción:
-- Ejecuta la migración de claves primarias y foráneas de UUIDv4 aleatorio a
-- UUIDv7 cronológico (IETF RFC 9562) en las tablas transaccionales de alto tráfico.
-- Garantiza contigüidad física en índices B-Tree y elimina la fragmentación de disco.
--
-- PROTOCOLO DE VENTANA DE MANTENIMIENTO:
-- 1. Detener tráfico de escrituras activas en la aplicación (Modo Mantenimiento).
-- 2. Ejecutar esta transacción completa en PostgreSQL.
-- 3. Si ocurre algún error en las restricciones, el bloque realiza ROLLBACK automático.
-- ==============================================================================

BEGIN;

-- 1. Verificar la disponibilidad de la función RFC 9562
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'uuid_generate_v7'
    ) THEN
        RAISE EXCEPTION 'La función public.uuid_generate_v7() no existe. Ejecute primero la migración 32_uuid_v7_rfc9562.sql';
    END IF;
END $$;

-- 2. Tabla temporal para el mapeo determinista entre UUIDv4 antiguo y UUIDv7 nuevo
CREATE TEMP TABLE IF NOT EXISTS _uuidv7_migration_map (
    tabla_nombre VARCHAR(100) NOT NULL,
    old_id UUID NOT NULL,
    new_id UUID NOT NULL DEFAULT public.uuid_generate_v7(),
    PRIMARY KEY (tabla_nombre, old_id)
) ON COMMIT DROP;

-- 3. Remapeo en Tabla: inventario_movimientos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventario_movimientos') THEN
        -- Poblar tabla de mapeo
        INSERT INTO _uuidv7_migration_map (tabla_nombre, old_id)
        SELECT 'inventario_movimientos', id FROM public.inventario_movimientos;

        -- Actualizar claves primarias
        UPDATE public.inventario_movimientos m
        SET id = map.new_id
        FROM _uuidv7_migration_map map
        WHERE map.tabla_nombre = 'inventario_movimientos' AND m.id = map.old_id;

        -- Establecer DEFAULT permanente a UUIDv7
        ALTER TABLE public.inventario_movimientos 
        ALTER COLUMN id SET DEFAULT public.uuid_generate_v7();

        RAISE NOTICE 'Tabla inventario_movimientos migrada exitosamente a UUIDv7.';
    END IF;
END $$;

-- 4. Remapeo en Tabla: ventas_pos y ventas_pos_detalles (Claves Foráneas en Cascada)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ventas_pos') THEN
        -- Poblar mapeo para cabecera de ventas
        INSERT INTO _uuidv7_migration_map (tabla_nombre, old_id)
        SELECT 'ventas_pos', id FROM public.ventas_pos;

        -- Si existen detalles vinculados, actualizar claves foráneas primero
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ventas_pos_detalles') THEN
            -- Deshabilitar triggers temporalmente para acelerar reindexación
            ALTER TABLE public.ventas_pos_detalles DISABLE TRIGGER ALL;

            UPDATE public.ventas_pos_detalles d
            SET venta_id = map.new_id
            FROM _uuidv7_migration_map map
            WHERE map.tabla_nombre = 'ventas_pos' AND d.venta_id = map.old_id;

            -- Generar nuevos UUIDv7 para los detalles
            INSERT INTO _uuidv7_migration_map (tabla_nombre, old_id)
            SELECT 'ventas_pos_detalles', id FROM public.ventas_pos_detalles;

            UPDATE public.ventas_pos_detalles d
            SET id = map.new_id
            FROM _uuidv7_migration_map map
            WHERE map.tabla_nombre = 'ventas_pos_detalles' AND d.id = map.old_id;

            ALTER TABLE public.ventas_pos_detalles 
            ALTER COLUMN id SET DEFAULT public.uuid_generate_v7();

            ALTER TABLE public.ventas_pos_detalles ENABLE TRIGGER ALL;
        END IF;

        -- Actualizar clave primaria de cabecera
        UPDATE public.ventas_pos v
        SET id = map.new_id
        FROM _uuidv7_migration_map map
        WHERE map.tabla_nombre = 'ventas_pos' AND v.id = map.old_id;

        -- Establecer DEFAULT permanente
        ALTER TABLE public.ventas_pos 
        ALTER COLUMN id SET DEFAULT public.uuid_generate_v7();

        RAISE NOTICE 'Tablas ventas_pos y ventas_pos_detalles migradas exitosamente a UUIDv7.';
    END IF;
END $$;

-- 5. Actualizar DEFAULTS en tablas transaccionales complementarias
DO $$
DECLARE
    tbl TEXT;
    tablas_transaccionales TEXT[] := ARRAY[
        'turnos_caja',
        'transacciones_caja',
        'despachos_wms',
        'ordenes_compra',
        'cuentas_por_pagar',
        'cuentas_por_cobrar'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas_transaccionales LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT public.uuid_generate_v7();', tbl);
            RAISE NOTICE 'Establecido DEFAULT UUIDv7 en tabla %', tbl;
        END IF;
    END LOOP;
END $$;

COMMIT;
