// src/services/posService.ts

import { load, save } from './localDb';
import { validarStock, registrarSalida } from './inventoryService';
import type { VentaPOS, LineaVenta } from '../types/pos.types';
import type { ResultadoOperacion } from '../types/common.types';

/**
 * Calcula los totales de una línea de venta.
 * Aplica: RN-06 (Descuento por línea)
 */
export function calcularTotalLinea(
  precioLista: number,
  descuentoPct: number,
  cantidad: number
): { precioFinal: number; totalLinea: number } {
  const precioFinal = precioLista * (1 - descuentoPct / 100); // RN-06
  const totalLinea = cantidad * precioFinal;
  return {
    precioFinal: Math.round(precioFinal),
    totalLinea: Math.round(totalLinea)
  };
}

/**
 * Calcula subtotal, descuento global y total final de una venta.
 * Aplica: RN-06 (Descuento global y total final no negativo)
 */
export function calcularTotalesPedido(
  lineas: Pick<LineaVenta, 'totalLinea'>[],
  descuentoGlobalPct: number,
  descuentoGlobalValor: number
): ResultadoOperacion<{ subtotal: number; descuento: number; totalFinal: number }> {
  const subtotal = lineas.reduce((acc, l) => acc + l.totalLinea, 0);
  const descuento = descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100);

  if (descuento > subtotal) { // RN-06
    return {
      data: null,
      error: 'El descuento no puede superar el total del pedido'
    };
  }

  const totalFinal = subtotal - descuento;

  return {
    data: {
      subtotal: Math.round(subtotal),
      descuento: Math.round(descuento),
      totalFinal: Math.round(totalFinal)
    },
    error: null
  };
}

/**
 * Registra una venta en el sistema, descontando el stock correspondiente.
 * Aplica: RN-01 (Stock nunca negativo), RN-07 (Idempotencia)
 */
export function registrarVenta(
  venta: VentaPOS,
  bodegaId: string
): ResultadoOperacion<VentaPOS> {
  try {
    const ventas = load<VentaPOS[]>('ventas', []);

    // RN-07: Verificar idempotencia
    const existente = ventas.find((v) => v.idempotencyKey === venta.idempotencyKey);
    if (existente) {
      return { data: existente, error: null };
    }

    // RN-01: Validar stock para cada línea antes de realizar cualquier cambio
    for (const linea of venta.lineas) {
      const stockCheck = validarStock(linea.productoId, bodegaId, linea.cantidad);
      if (stockCheck.error) {
        return { data: null, error: stockCheck.error };
      }
    }

    // Descontar stock para cada línea de venta
    for (const linea of venta.lineas) {
      const salidaResult = registrarSalida({
        bodegaId,
        productoId: linea.productoId,
        cantidad: linea.cantidad,
        referenciaId: venta.id
      });
      
      if (salidaResult.error) {
        // En un entorno de producción real, aquí se implementaría reversión de transacciones
        return { data: null, error: `Error crítico al descontar stock: ${salidaResult.error}` };
      }
    }

    // Persistir la venta
    save('ventas', [...ventas, venta]);

    return { data: venta, error: null };
  } catch {
    return { data: null, error: 'Error general al registrar la venta en el sistema' };
  }
}
