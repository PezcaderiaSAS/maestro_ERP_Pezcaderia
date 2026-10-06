-- Migración: Módulo Inventarios y Bodegas (WMS)
-- 1. Tablas Base para Gestión de Cuartos Fríos y Trazabilidad

CREATE TABLE IF NOT EXISTS public.wms_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'PRINCIPAL', -- PRINCIPAL, CUARTO_FRIO, MOSTRADOR
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wms_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    reception_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Crítico para FEFO
    initial_quantity DECIMAL(12,3) NOT NULL,
    current_quantity DECIMAL(12,3) NOT NULL,
    supplier_id UUID,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wms_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.wms_warehouses(id),
    batch_id UUID REFERENCES public.wms_batches(id),
    sku VARCHAR(100) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(warehouse_id, batch_id, sku) -- Evita duplicados en stock
);

CREATE TABLE IF NOT EXISTS public.wms_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    movement_type VARCHAR(50) NOT NULL, -- IN, OUT, TRANSFER, SCRAP, COUNT_ADJUSTMENT
    source_warehouse_id UUID REFERENCES public.wms_warehouses(id),
    target_warehouse_id UUID REFERENCES public.wms_warehouses(id),
    batch_id UUID REFERENCES public.wms_batches(id),
    sku VARCHAR(100) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    reference_id UUID, -- ID de factura, orden de compra o sesión de caja
    actor_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.wms_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wms_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wms_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wms_movements ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (Aislamiento Multi-Tenant)
CREATE POLICY "Aislamiento tenant en bodegas" 
ON public.wms_warehouses FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en lotes" 
ON public.wms_batches FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en stock" 
ON public.wms_stock FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Aislamiento tenant en movimientos" 
ON public.wms_movements FOR ALL 
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
