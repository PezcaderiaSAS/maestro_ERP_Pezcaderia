-- ============================================================================
-- MIGRACIÓN 32: COMPRAS DE MUELLE, LIQUIDACIÓN A PESCADORES Y RENDIMIENTO DE FILETEO
-- ============================================================================
-- Módulo: dock-purchases-and-fish-yield
-- Dominio: Recepción Sanitaria, Pesaje Tallas, Deducciones de Faena, Despiece y Yield KPI
-- Arquitectura: Multi-Tenant RLS, Trazabilidad Bidireccional Hija-Madre y Costeo por Absorción
-- ============================================================================

-- 1. TABLA: compras_muelle_recepciones (Acta de Muelle y Liquidación a Pescador)
CREATE TABLE IF NOT EXISTS public.compras_muelle_recepciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    consecutivo_acta VARCHAR(50) NOT NULL,
    fecha_recepcion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    embarcacion_nombre VARCHAR(150) NOT NULL,
    patron_pescador_nombre VARCHAR(150) NOT NULL,
    patron_identificacion VARCHAR(50) NOT NULL,
    puerto_muelle_origen VARCHAR(150) NOT NULL,
    especie_pescado VARCHAR(100) NOT NULL,
    bodega_destino_id VARCHAR(100) NOT NULL,
    -- Parámetros Sanitarios Sensoriales
    temperatura_pulpa_c NUMERIC(4, 1) NOT NULL CHECK (temperatura_pulpa_c <= 6.0),
    estado_ojos VARCHAR(50) NOT NULL,
    estado_agallas VARCHAR(50) NOT NULL,
    textura_muscular VARCHAR(50) NOT NULL,
    olor_sensorial VARCHAR(50) NOT NULL,
    inspector_calidad VARCHAR(150) NOT NULL,
    observaciones_sensoriales TEXT,
    -- Balances de Pesaje y Liquidación
    total_peso_bruto_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
    total_tara_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
    total_peso_neto_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
    subtotal_compra_pescado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_deducciones NUMERIC(14, 2) NOT NULL DEFAULT 0,
    neto_pagar_pescador NUMERIC(14, 2) NOT NULL DEFAULT 0,
    metodo_pago_liquidacion VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO_CAJA_MENOR',
    estado VARCHAR(30) NOT NULL DEFAULT 'APROBADA_SANITARIA' CHECK (estado IN ('APROBADA_SANITARIA', 'LIQUIDADA_PAGADA', 'RECHAZADA_SANITARIA')),
    codigo_lote_madre VARCHAR(100) NOT NULL,
    observaciones_liquidacion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_acta_muelle_empresa UNIQUE (empresa_id, consecutivo_acta),
    CONSTRAINT uq_lote_madre_muelle_empresa UNIQUE (empresa_id, codigo_lote_madre)
);

-- 2. TABLA: compras_muelle_tallas (Desglose de Pesaje por Talla y Calidad)
CREATE TABLE IF NOT EXISTS public.compras_muelle_tallas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    recepcion_id UUID NOT NULL REFERENCES public.compras_muelle_recepciones(id) ON DELETE CASCADE,
    talla_nombre VARCHAR(100) NOT NULL,
    calidad VARCHAR(50) NOT NULL DEFAULT 'PRIMERA',
    cantidad_canastillas INTEGER NOT NULL DEFAULT 1,
    tara_por_canastilla_kg NUMERIC(6, 2) NOT NULL DEFAULT 2.0,
    peso_bruto_bascula_kg NUMERIC(10, 3) NOT NULL,
    porcentaje_escurrido_hielo NUMERIC(5, 2) NOT NULL DEFAULT 3.0,
    peso_neto_liquidado_kg NUMERIC(10, 3) NOT NULL,
    precio_por_kg_acordado NUMERIC(14, 2) NOT NULL,
    subtotal_talla NUMERIC(14, 2) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 3. TABLA: compras_muelle_deducciones (Anticipos, Combustible, Hielo)
CREATE TABLE IF NOT EXISTS public.compras_muelle_deducciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    recepcion_id UUID NOT NULL REFERENCES public.compras_muelle_recepciones(id) ON DELETE CASCADE,
    tipo_deduccion VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    monto_deducido NUMERIC(14, 2) NOT NULL,
    soporte_comprobante VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- 4. TABLA: produccion_ordenes_despiece (Órdenes de Transformación y Fileteo)
CREATE TABLE IF NOT EXISTS public.produccion_ordenes_despiece (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    consecutivo_orden VARCHAR(50) NOT NULL,
    fecha_transformacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    bodega_origen_id VARCHAR(100) NOT NULL,
    bodega_destino_id VARCHAR(100) NOT NULL,
    lote_madre_muelle_id VARCHAR(100) NOT NULL,
    materia_prima_producto_id VARCHAR(100) NOT NULL,
    materia_prima_sku VARCHAR(50) NOT NULL,
    materia_prima_nombre VARCHAR(150) NOT NULL,
    especie_clave VARCHAR(50) NOT NULL,
    peso_inicial_mp_kg NUMERIC(10, 3) NOT NULL,
    costo_kilo_mp NUMERIC(14, 2) NOT NULL,
    costo_total_mp NUMERIC(14, 2) NOT NULL,
    fileteador_nombre VARCHAR(150) NOT NULL,
    fileteador_identificacion VARCHAR(50) NOT NULL,
    -- Métricas de Rendimiento y Auditoría de Fileteo
    peso_filete_obtenido_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    rendimiento_filete_real_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
    merma_total_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    merma_real_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
    calificacion_rendimiento VARCHAR(50) NOT NULL DEFAULT 'OPTIMO_EXCELENTE',
    mensaje_auditoria TEXT,
    temperatura_sala_c NUMERIC(4, 1) NOT NULL DEFAULT 10.0,
    estado VARCHAR(30) NOT NULL DEFAULT 'FINALIZADA' CHECK (estado IN ('EN_PROCESO', 'FINALIZADA', 'CANCELADA')),
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW()),
    CONSTRAINT uq_orden_despiece_empresa UNIQUE (empresa_id, consecutivo_orden)
);

-- 5. TABLA: produccion_salidas_cortes (Cortes Obtenidos, Prorrateo y Lotes Derivados)
CREATE TABLE IF NOT EXISTS public.produccion_salidas_cortes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT public.get_current_empresa_id() REFERENCES public.empresas(id) ON DELETE CASCADE,
    orden_id UUID NOT NULL REFERENCES public.produccion_ordenes_despiece(id) ON DELETE CASCADE,
    producto_id VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    nombre_corte VARCHAR(150) NOT NULL,
    tipo_salida VARCHAR(50) NOT NULL,
    peso_obtenido_kg NUMERIC(10, 3) NOT NULL,
    rendimiento_sobre_mp_pct NUMERIC(6, 2) NOT NULL,
    factor_valor_mercado NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
    costo_total_asignado NUMERIC(14, 2) NOT NULL,
    costo_unitario_por_kg NUMERIC(14, 2) NOT NULL,
    codigo_lote_derivado VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC', NOW())
);

-- ============================================================================
-- SEGURIDAD RLS (ROW LEVEL SECURITY) MULTI-TENANT
-- ============================================================================
ALTER TABLE public.compras_muelle_recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_muelle_tallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_muelle_deducciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_ordenes_despiece ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_salidas_cortes ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_compras_muelle_recepciones ON public.compras_muelle_recepciones
    FOR ALL USING (empresa_id = public.get_current_empresa_id());

CREATE POLICY rls_compras_muelle_tallas ON public.compras_muelle_tallas
    FOR ALL USING (empresa_id = public.get_current_empresa_id());

CREATE POLICY rls_compras_muelle_deducciones ON public.compras_muelle_deducciones
    FOR ALL USING (empresa_id = public.get_current_empresa_id());

CREATE POLICY rls_produccion_ordenes_despiece ON public.produccion_ordenes_despiece
    FOR ALL USING (empresa_id = public.get_current_empresa_id());

CREATE POLICY rls_produccion_salidas_cortes ON public.produccion_salidas_cortes
    FOR ALL USING (empresa_id = public.get_current_empresa_id());

-- ============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_muelle_rec_empresa ON public.compras_muelle_recepciones(empresa_id, fecha_recepcion DESC);
CREATE INDEX IF NOT EXISTS idx_muelle_rec_lote ON public.compras_muelle_recepciones(empresa_id, codigo_lote_madre);
CREATE INDEX IF NOT EXISTS idx_muelle_tallas_rec ON public.compras_muelle_tallas(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_muelle_deduc_rec ON public.compras_muelle_deducciones(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_prod_despiece_empresa ON public.produccion_ordenes_despiece(empresa_id, fecha_transformacion DESC);
CREATE INDEX IF NOT EXISTS idx_prod_despiece_lote_madre ON public.produccion_ordenes_despiece(empresa_id, lote_madre_muelle_id);
CREATE INDEX IF NOT EXISTS idx_prod_salidas_orden ON public.produccion_salidas_cortes(orden_id);
