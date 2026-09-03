import { Product } from '../types/erp.types';

export interface ProductSaleMetric {
  sku: string;
  totalVolume: number; // Total sold volume in kg/units
  totalRevenue: number;
}

export class ScientificAnalytics {
  /**
   * Recalcula la categorización ABC (Pareto 80/20) de un catálogo de productos.
   * Regla de Pareto:
   * - A: 80% de los ingresos (approx top 20% de los productos)
   * - B: Siguiente 15% de los ingresos
   * - C: Último 5% de los ingresos
   * @param products Catálogo actual de productos
   * @param metrics Métricas históricas de ventas por producto
   * @returns Un mapa de SKU -> 'A' | 'B' | 'C'
   */
  static calculateABC(products: Product[], metrics: ProductSaleMetric[]): Record<string, 'A' | 'B' | 'C'> {
    // 1. Unir catálogo con métricas (si un producto no tiene métricas, su ingreso es 0)
    const combined = products.map(p => {
      const metric = metrics.find(m => m.sku === p.sku);
      return {
        sku: p.sku,
        revenue: metric ? metric.totalRevenue : 0
      };
    });

    // 2. Ordenar descendentemente por Revenue
    combined.sort((a, b) => b.revenue - a.revenue);

    // 3. Calcular total global de ingresos
    const totalRevenueGlobal = combined.reduce((sum, item) => sum + item.revenue, 0);

    const result: Record<string, 'A' | 'B' | 'C'> = {};
    
    // Si no hay ventas, todos son 'C'
    if (totalRevenueGlobal === 0) {
      combined.forEach(c => result[c.sku] = 'C');
      return result;
    }

    // 4. Acumular y asignar categoría
    let accumulatedRevenue = 0;
    
    combined.forEach(item => {
      accumulatedRevenue += item.revenue;
      const accumulatedPercentage = (accumulatedRevenue / totalRevenueGlobal) * 100;
      
      if (accumulatedPercentage <= 80) {
        result[item.sku] = 'A';
      } else if (accumulatedPercentage <= 95) {
        result[item.sku] = 'B';
      } else {
        result[item.sku] = 'C';
      }
    });

    return result;
  }

  /**
   * Recalcula el Costo Promedio Ponderado (CPP) tras un ajuste de mermas en Cuarto Frío.
   * La merma es una pérdida de peso sin generar ingresos, por tanto encarece el producto restante.
   * 
   * @param currentStock Stock actual (antes de la merma) en kg
   * @param currentCPP Costo Promedio Ponderado actual por kg
   * @param mermaKg Kilos perdidos en el cuarto frío
   * @returns Nuevo Costo Promedio Ponderado
   */
  static recalculateCPPAfterMerma(currentStock: number, currentCPP: number, mermaKg: number): number {
    if (currentStock <= 0 || mermaKg <= 0 || currentStock <= mermaKg) {
      return currentCPP; // No se puede encarecer sobre 0 stock restante
    }
    
    // El valor total del inventario se mantiene, pero distribuido en menos unidades.
    const totalValue = currentStock * currentCPP;
    const newStock = currentStock - mermaKg;
    
    // El nuevo costo por Kg absorbe la pérdida
    const newCPP = totalValue / newStock;
    return Number(newCPP.toFixed(2));
  }
}
