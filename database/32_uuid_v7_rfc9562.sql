-- ==============================================================================
-- MIGRACIÓN 32: Generador de UUIDv7 según Estándar Oficial IETF RFC 9562
-- ==============================================================================
-- Descripción:
-- Reemplaza la generación aleatoria de UUIDv4 por UUIDv7 ordenado cronológicamente.
-- Estructura de 128 bits:
-- - 48 bits: Unix timestamp en milisegundos (monotónico ordenado cronológicamente)
-- - 4 bits: Versión 7 (0111)
-- - 12 bits: Entropía A
-- - 2 bits: Variante RFC 9562 (10)
-- - 62 bits: Entropía B
--
-- Beneficio:
-- Elimina la fragmentación aleatoria en árboles B-Tree en PostgreSQL,
-- permitiendo inserciones ultra-rápidas y clustering natural de datos temporales.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS UUID AS $$
DECLARE
    v_time_ms BIGINT;
    v_bytes BYTEA;
    v_rand BYTEA;
BEGIN
    -- 1. Obtener timestamp en milisegundos
    v_time_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    
    -- 2. Obtener 10 bytes de números aleatorios criptográficos
    v_rand := gen_random_bytes(10);
    
    -- 3. Ensamblar los 16 bytes conforme al RFC 9562
    v_bytes := 
        -- 48 bits de timestamp (bytes 3 a 8 de la representación de 64 bits de int8sendf)
        SUBSTRING(int8sendf(v_time_ms) FROM 3 FOR 6) ||
        -- Byte 7: 4 bits versión 7 (0x70 = 112) + 4 bits aleatorios
        SET_BYTE(SUBSTRING(v_rand FROM 1 FOR 1), 0, (GET_BYTE(SUBSTRING(v_rand FROM 1 FOR 1), 0) & 15) | 112) ||
        -- Byte 8: Entropía A baja
        SUBSTRING(v_rand FROM 2 FOR 1) ||
        -- Byte 9: 2 bits variante (0x80 = 128) + 6 bits aleatorios
        SET_BYTE(SUBSTRING(v_rand FROM 3 FOR 1), 0, (GET_BYTE(SUBSTRING(v_rand FROM 3 FOR 1), 0) & 63) | 128) ||
        -- Bytes 10 a 16: Entropía B (7 bytes)
        SUBSTRING(v_rand FROM 4 FOR 7);

    RETURN encode(v_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION public.uuid_generate_v7() IS 'Generador de identificadores universales únicos UUIDv7 según el estándar IETF RFC 9562 con ordenamiento cronológico monotónico';
