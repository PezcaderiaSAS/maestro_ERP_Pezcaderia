import { AnalisisAbcItemDTO, ClasificacionAbc } from '../types/inventarioAbc';
import type { Producto } from '../store/useInventoryStore';
import type { MovimientoInventario } from '../store/useMovementStore';

export interface ParetoInputParams {
  products: Producto[];
  movimientos?: MovimientoInventario[];
  stock?: Record<string, Record<string, number>>;
  diasHistorial?: number;
}

/**
 * Calcula la clasificación real de Pareto ABC (80/20) para el inventario de productos.
 * - Clase A: Productos que acumulan hasta el 80% del valor total (Alta rotación / Mayor valor económico).
 * - Clase B: Productos que representan el siguiente 15% (80% - 95%).
 * - Clase C: Productos de baja rotación o menor impacto financiero (último 5%).
 */
export function calcularParetoAbcLocal({
  products,
  movimientos = [],
  stock = {},
  diasHistorial = 30,
}: ParetoInputParams): readonly AnalisisAbcItemDTO[] {
  if (!products || products.length === 0) {
    return Object.freeze([]);
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - diasHistorial);

  // 1. Calcular el valor de ventas o rotación por SKU
  const ventasPorSku: Record<string, number> = {};
  const productMap = new Map(products.map(p => [p.sku, p]));

  movimientos.forEach((m) => {
    if (m.tipo === 'VENTA') {
      const fechaMov = new Date(m.timestamp);
      if (fechaMov >= cutoffDate) {
        const prod = productMap.get(m.sku);
        const precioUnit = prod?.precio_venta_pos || prod?.precio_compra || 1000;
        const monto = Number(m.cantidad || 0) * precioUnit;
        ventasPorSku[m.sku] = (ventasPorSku[m.sku] || 0) + Math.max(0, monto);
      }
    }
  });

  // 2. Mapear cada producto con su valor (si no hay ventas registradas en el período, usa valor de stock * costo)
  const itemsConValor = products.map((p) => {
    let valor = ventasPorSku[p.sku] || 0;

    // Si no hay ventas en el período, calcular el valor del stock valorizado
    if (valor === 0) {
      let totalStock = 0;
      Object.values(stock).forEach((bodegaStock) => {
        if (bodegaStock && typeof bodegaStock === 'object') {
          totalStock += Number(bodegaStock[p.sku] || 0);
        }
      });
      valor = totalStock * (Number(p.precio_compra) || Number(p.precio_venta_pos) || 1000);
    }

    return {
      productoId: p.id,
      codigoSku: p.sku,
      nombreProducto: p.nombre,
      valorTotalVentas: Math.round(valor),
    };
  });

  // 3. Ordenar descendentemente por valor económico
  itemsConValor.sort((a, b) => b.valorTotalVentas - a.valorTotalVentas);

  // 4. Calcular valor total global
  const totalGlobal = itemsConValor.reduce((sum, item) => sum + item.valorTotalVentas, 0);

  if (totalGlobal === 0) {
    // Si todos los valores son 0, asignar equitativamente C
    return Object.freeze(
      itemsConValor.map((item, index) => ({
        ...item,
        porcentajeAcumulado: Math.round(((index + 1) / itemsConValor.length) * 1000) / 10,
        clasificacion: ClasificacionAbc.C,
      }))
    );
  }

  // 5. Calcular porcentaje acumulado y clasificar A / B / C
  let acumulado = 0;
  const resultado: AnalisisAbcItemDTO[] = itemsConValor.map((item) => {
    acumulado += item.valorTotalVentas;
    const porcentajeAcumulado = Math.round((acumulado / totalGlobal) * 1000) / 10;

    let clasificacion = ClasificacionAbc.C;
    if (porcentajeAcumulado <= 80.0) {
      clasificacion = ClasificacionAbc.A;
    } else if (porcentajeAcumulado <= 95.0) {
      clasificacion = ClasificacionAbc.B;
    }

    return {
      productoId: item.productoId,
      codigoSku: item.codigoSku,
      nombreProducto: item.nombreProducto,
      valorTotalVentas: item.valorTotalVentas,
      porcentajeAcumulado,
      clasificacion,
    };
  });

  return Object.freeze(resultado);
}
