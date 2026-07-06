-- 13_devoluciones_ext.sql
-- Extensión de devoluciones_pedidos legacy para alineación con interfaz DevolucionPedido de la app
-- No dropea ni reconstruye tablas legacy; sólo añade columnas faltantes

-- 1. EXTENDER devoluciones_pedidos con campos desnormalizados de la app
ALTER TABLE devoluciones_pedidos ADD COLUMN IF NOT EXISTS pedido_no VARCHAR(20);
ALTER TABLE devoluciones_pedidos ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE devoluciones_pedidos ADD COLUMN IF NOT EXISTS conductor_nombre VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE devoluciones_pedidos ADD COLUMN IF NOT EXISTS fecha_recibido TIMESTAMP WITH TIME ZONE;
ALTER TABLE devoluciones_pedidos ADD COLUMN IF NOT EXISTS recibido_por VARCHAR(100);
ALTER TABLE devoluciones_pedidos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. EXTENDER detalle_devoluciones con campos faltantes
ALTER TABLE detalle_devoluciones ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE detalle_devoluciones ADD COLUMN IF NOT EXISTS nombre VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE detalle_devoluciones ADD COLUMN IF NOT EXISTS estado_calidad VARCHAR(30) CHECK (estado_calidad IN ('APROBADO_REINGRESO', 'DESCARTE_MERMA'));

-- 3. VISTA UNIFICADA: devoluciones_full (app-compatible)
CREATE OR REPLACE VIEW devoluciones_full AS
SELECT
    d.id,
    d.pedido_id,
    COALESCE(d.pedido_no, p.no_pedido) AS pedido_no,
    d.cliente_id,
    d.cliente_nombre,
    d.conductor_id,
    d.conductor_nombre,
    d.estado,
    d.fecha_programacion,
    d.fecha_recibido,
    d.recibido_por,
    d.fecha_validacion,
    d.creado_en,
    jsonb_agg(
        jsonb_build_object(
            'id', dd.id,
            'sku', COALESCE(dd.sku, pr.codigo_unico),
            'nombre', COALESCE(dd.nombre, pr.nombre),
            'cantidadSolicitada', dd.cantidad_solicitada,
            'cantidadRecibida', dd.cantidad_recibida,
            'precioUnitarioVenta', dd.precio_unitario_venta,
            'estadoCalidad', dd.estado_calidad,
            'estadoFisico', dd.estado_fisico,
            'loteInventario', dd.lote_inventario
        )
        ORDER BY dd.id
    ) AS items
FROM devoluciones_pedidos d
LEFT JOIN pedidos p ON p.id = d.pedido_id
LEFT JOIN detalle_devoluciones dd ON dd.devolucion_id = d.id
LEFT JOIN productos pr ON pr.id = dd.producto_id
WHERE d.deleted_at IS NULL
GROUP BY d.id, p.no_pedido;
