import type { IDataService } from '../types/services.types';
import type { VentaPOS, LineaVenta } from '../types/pos.types';
import type { ResultadoOperacion } from '../types/common.types';

export function calcularTotalLinea(
  precioLista: number,
  descuentoPct: number = 0,
  cantidad: number = 1,
  tarifaIva: number = 0,
  ivaIncluido: boolean = true
): {
  precioFinal: number;
  totalLinea: number;
  baseGravableLinea: number;
  cuotaIvaLinea: number;
} {
  const precio = Math.round(Number(precioLista) || 0);
  const desc = Number(descuentoPct) || 0;
  const cant = Number(cantidad) || 0;

  // En retail COP, si ivaIncluido es true, precioLista ya contiene IVA.
  // El precio final y el total de la línea siempre son enteros COP:
  const precioFinal = Math.round(precio * (1 - desc / 100)); // RN-06
  const totalLinea = Math.round(cant * precioFinal);

  let baseGravableLinea = totalLinea;
  let cuotaIvaLinea = 0;

  if (tarifaIva > 0) {
    if (ivaIncluido) {
      baseGravableLinea = Math.round(totalLinea / (1 + tarifaIva / 100));
      cuotaIvaLinea = totalLinea - baseGravableLinea;
    } else {
      cuotaIvaLinea = Math.round(totalLinea * (tarifaIva / 100));
      baseGravableLinea = totalLinea;
    }
  }

  return {
    precioFinal,
    totalLinea,
    baseGravableLinea,
    cuotaIvaLinea,
  };
}

export function calcularTotalesPedido(
  lineas: (Pick<LineaVenta, 'totalLinea'> & { baseGravableLinea?: number; cuotaIvaLinea?: number })[],
  descuentoGlobalPct: number = 0,
  descuentoGlobalValor: number = 0
): ResultadoOperacion<{
  subtotal: number;
  descuento: number;
  totalFinal: number;
  subtotalBaseGravable: number;
  totalIva: number;
}> {
  const subtotal = Math.round(lineas.reduce((acc, l) => acc + (l.totalLinea || 0), 0));
  const subtotalBaseGravable = Math.round(
    lineas.reduce((acc, l) => acc + (l.baseGravableLinea !== undefined ? l.baseGravableLinea : l.totalLinea || 0), 0)
  );
  const totalIva = Math.round(lineas.reduce((acc, l) => acc + (l.cuotaIvaLinea || 0), 0));

  const descuento = Math.round(descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100));

  if (descuento > subtotal) {
    return { data: null, error: 'El descuento no puede superar el total del pedido' };
  }

  const totalFinal = subtotal - descuento;
  return {
    data: {
      subtotal,
      descuento,
      totalFinal,
      subtotalBaseGravable,
      totalIva,
    },
    error: null,
  };
}

/**
 * Calcula de forma determinista el costo de compra de un producto final derivado
 * a partir del costo por kilo de la materia prima y su gramaje de contenido.
 * Ej: Camarón Crudo 41-50 ($28.500 / kg) x 500 gr = $14.250 COP
 */
export function calcularCostoProductoDerivado(costoKiloMP: number, gramosContenido: number = 500): number {
  const costoKilo = Math.round(Number(costoKiloMP) || 0);
  const factor = (Number(gramosContenido) || 500) / 1000;
  return Math.round(costoKilo * factor);
}

export class PosService {
  constructor(private dataService: IDataService) {}

  async registrarVenta(
    venta: VentaPOS,
    bodegaId: string,
    validarStockFn: (productoId: string, bodegaId: string, cantidad: number) => ResultadoOperacion<unknown>,
    registrarSalidaFn: (params: { bodegaId: string; productoId: string; cantidad: number; referenciaId: string }) => ResultadoOperacion<unknown>
  ): Promise<ResultadoOperacion<VentaPOS>> {
    try {
      const ventas = await this.dataService.getAll<VentaPOS>('ventas');

      const existente = ventas.find((v) => v.idempotencyKey === venta.idempotencyKey);
      if (existente) return { data: existente, error: null };

      for (const linea of venta.lineas) {
        const stockCheck = validarStockFn(linea.productoId, bodegaId, linea.cantidad);
        if (stockCheck.error) return { data: null, error: stockCheck.error };
      }

      for (const linea of venta.lineas) {
        const salidaResult = registrarSalidaFn({
          bodegaId,
          productoId: linea.productoId,
          cantidad: linea.cantidad,
          referenciaId: venta.id,
        });

        if (salidaResult.error) {
          return { data: null, error: `Error crítico al descontar stock: ${salidaResult.error}` };
        }
      }

      await this.dataService.create('ventas', venta);
      return { data: venta, error: null };
    } catch {
      return { data: null, error: 'Error general al registrar la venta en el sistema' };
    }
  }
}
