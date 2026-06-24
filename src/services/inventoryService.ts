// src/services/inventoryService.ts

import { load, save } from './localDb';
import type { Producto } from '../types/inventory.types';
import type { ResultadoOperacion } from '../types/common.types'; // Reusando tipo genérico

export interface StockItem {
  bodegaId: string;
  productoId: string;
  cantidad: number;
}

export interface MovimientoInventario {
  id: string;
  fecha: string;            // ISO Date
  tipo: 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'DEVOLUCION';
  bodegaOrigenId: string | null;
  bodegaDestinoId: string | null;
  productoId: string;
  cantidad: number;
  referenciaId: string | null; // ID de venta, orden de compra, traslado, etc.
}

/**
 * Valida si hay stock suficiente de un producto en una bodega.
 * Aplica: RN-01 (Stock nunca negativo)
 */
export function validarStock(
  productoId: string,
  bodegaId: string,
  cantidadRequerida: number
): ResultadoOperacion<{ disponible: number }> {
  try {
    const stockList = load<StockItem[]>('stock', []);
    const stockItem = stockList.find(
      (s) => s.productoId === productoId && s.bodegaId === bodegaId
    );

    const disponible = stockItem ? stockItem.cantidad : 0;

    if (disponible < cantidadRequerida) {
      // Cargar producto para conocer su unidad de medida
      const catalog = load<Producto[]>('productsCatalog', []);
      const producto = catalog.find((p) => p.id === productoId);
      const unidad = producto?.unidadMedida || 'KG';

      return {
        data: null,
        error: `Stock insuficiente. Disponible: ${disponible} ${unidad}`,
      };
    }

    return { data: { disponible }, error: null };
  } catch {
    return { data: null, error: 'Error al validar el stock del producto' };
  }
}

/**
 * Registra una entrada de mercancía en stock.
 */
export function registrarEntrada(params: {
  bodegaId: string;
  productoId: string;
  cantidad: number;
  referenciaId?: string;
}): ResultadoOperacion<{ cantidadNueva: number }> {
  const { bodegaId, productoId, cantidad, referenciaId = null } = params;

  if (cantidad <= 0) {
    return { data: null, error: 'La cantidad debe ser mayor a cero' };
  }

  try {
    const stockList = load<StockItem[]>('stock', []);
    let stockItem = stockList.find(
      (s) => s.productoId === productoId && s.bodegaId === bodegaId
    );

    if (stockItem) {
      stockItem.cantidad += cantidad;
    } else {
      stockItem = { bodegaId, productoId, cantidad };
      stockList.push(stockItem);
    }

    save('stock', stockList);

    // Registrar movimiento
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    const nuevoMovimiento: MovimientoInventario = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: 'ENTRADA',
      bodegaOrigenId: null,
      bodegaDestinoId: bodegaId,
      productoId,
      cantidad,
      referenciaId,
    };
    save('movimientos', [...movimientos, nuevoMovimiento]);

    return { data: { cantidadNueva: stockItem.cantidad }, error: null };
  } catch {
    return { data: null, error: 'Error al registrar la entrada de stock' };
  }
}

/**
 * Registra una salida de mercancía en stock.
 * Aplica: RN-01 (Stock nunca negativo)
 */
export function registrarSalida(params: {
  bodegaId: string;
  productoId: string;
  cantidad: number;
  referenciaId?: string;
}): ResultadoOperacion<{ cantidadNueva: number }> {
  const { bodegaId, productoId, cantidad, referenciaId = null } = params;

  if (cantidad <= 0) {
    return { data: null, error: 'La cantidad debe ser mayor a cero' };
  }

  // Validar stock antes
  const validation = validarStock(productoId, bodegaId, cantidad);
  if (validation.error) {
    return { data: null, error: validation.error };
  }

  try {
    const stockList = load<StockItem[]>('stock', []);
    const stockItem = stockList.find(
      (s) => s.productoId === productoId && s.bodegaId === bodegaId
    );

    if (!stockItem) {
      return { data: null, error: 'Stock no inicializado para este producto' };
    }

    stockItem.cantidad -= cantidad;
    save('stock', stockList);

    // Registrar movimiento
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    const nuevoMovimiento: MovimientoInventario = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: 'SALIDA',
      bodegaOrigenId: bodegaId,
      bodegaDestinoId: null,
      productoId,
      cantidad,
      referenciaId,
    };
    save('movimientos', [...movimientos, nuevoMovimiento]);

    return { data: { cantidadNueva: stockItem.cantidad }, error: null };
  } catch {
    return { data: null, error: 'Error al registrar la salida de stock' };
  }
}

/**
 * Registra un traslado de mercancía entre dos bodegas.
 * Aplica: RN-02 (Traslado atómico)
 */
export function registrarTraslado(params: {
  bodegaOrigenId: string;
  bodegaDestinoId: string;
  productoId: string;
  cantidad: number;
  referenciaId?: string;
}): ResultadoOperacion<{ exito: boolean }> {
  const { bodegaOrigenId, bodegaDestinoId, productoId, cantidad, referenciaId = null } = params;

  if (bodegaOrigenId === bodegaDestinoId) {
    return { data: null, error: 'La bodega de origen y destino no pueden ser la misma' };
  }

  // Validar stock en origen
  const validation = validarStock(productoId, bodegaOrigenId, cantidad);
  if (validation.error) {
    return { data: null, error: `Origen: ${validation.error}` };
  }

  try {
    const stockList = load<StockItem[]>('stock', []);
    
    // Buscar items
    const origenItem = stockList.find(s => s.productoId === productoId && s.bodegaId === bodegaOrigenId);
    let destinoItem = stockList.find(s => s.productoId === productoId && s.bodegaId === bodegaDestinoId);

    if (!origenItem) return { data: null, error: 'Stock no encontrado en origen' };

    // Operación atómica en memoria
    origenItem.cantidad -= cantidad;
    
    if (destinoItem) {
      destinoItem.cantidad += cantidad;
    } else {
      destinoItem = { bodegaId: bodegaDestinoId, productoId, cantidad };
      stockList.push(destinoItem);
    }

    save('stock', stockList);

    // Registrar movimiento
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    const nuevoMovimiento: MovimientoInventario = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: 'TRASLADO',
      bodegaOrigenId,
      bodegaDestinoId,
      productoId,
      cantidad,
      referenciaId,
    };
    save('movimientos', [...movimientos, nuevoMovimiento]);

    return { data: { exito: true }, error: null };
  } catch {
    return { data: null, error: 'Error al registrar el traslado' };
  }
}

/**
 * Procesa la producción: descuenta materia prima y suma producto terminado.
 */
export function procesarProduccion(params: {
  bodegaId: string;
  mpProductoId: string;
  mpCantidad: number;
  ptProductoId: string;
  ptCantidad: number;
  actor: string;
}): ResultadoOperacion<{ mermaPct: number }> {
  const { bodegaId, mpProductoId, mpCantidad, ptProductoId, ptCantidad, actor } = params;

  if (mpCantidad <= 0 || ptCantidad <= 0) {
    return { data: null, error: 'Las cantidades deben ser mayores a cero' };
  }

  const mermaPct = ((mpCantidad - ptCantidad) / mpCantidad) * 100;
  
  if (mermaPct > 35) {
    // Si estuviéramos aplicando bloqueo de PIN aquí...
    // Pero lo manejamos en la UI.
  }

  // Validar stock de Materia Prima
  const valMP = validarStock(mpProductoId, bodegaId, mpCantidad);
  if (valMP.error) return { data: null, error: `Materia Prima: ${valMP.error}` };

  try {
    // 1. Salida de MP
    const salResult = registrarSalida({
      bodegaId,
      productoId: mpProductoId,
      cantidad: mpCantidad,
      referenciaId: `prod-${Date.now()}`
    });
    if (salResult.error) throw new Error(salResult.error);

    // 2. Entrada de PT
    const entResult = registrarEntrada({
      bodegaId,
      productoId: ptProductoId,
      cantidad: ptCantidad,
      referenciaId: `prod-${Date.now()}`
    });
    if (entResult.error) throw new Error(entResult.error);

    return { data: { mermaPct }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Error en producción' };
  }
}
