import type { IDataService } from '../types/services.types';
import type { VentaPOS, LineaVenta } from '../types/pos.types';
import type { ResultadoOperacion } from '../types/common.types';

export function calcularTotalLinea(
  precioLista: number,
  descuentoPct: number,
  cantidad: number
): { precioFinal: number; totalLinea: number } {
  const precioFinal = precioLista * (1 - descuentoPct / 100);
  const totalLinea = cantidad * precioFinal;
  return {
    precioFinal: Math.round(precioFinal),
    totalLinea: Math.round(totalLinea),
  };
}

export function calcularTotalesPedido(
  lineas: Pick<LineaVenta, 'totalLinea'>[],
  descuentoGlobalPct: number,
  descuentoGlobalValor: number
): ResultadoOperacion<{ subtotal: number; descuento: number; totalFinal: number }> {
  const subtotal = lineas.reduce((acc, l) => acc + l.totalLinea, 0);
  const descuento = descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100);

  if (descuento > subtotal) {
    return { data: null, error: 'El descuento no puede superar el total del pedido' };
  }

  const totalFinal = subtotal - descuento;
  return {
    data: {
      subtotal: Math.round(subtotal),
      descuento: Math.round(descuento),
      totalFinal: Math.round(totalFinal),
    },
    error: null,
  };
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
