// src/services/branchInventoryService.ts

import { load, save } from './localDb';
import type { ResultadoOperacion } from '../types/common.types';
import type { Producto, Bodega } from '../types/inventory.types';
import type { MovimientoInventario, StockDictionary } from './inventoryService';
import {
  BranchTransferValidationSchema,
  BranchReplenishmentRequestSchema,
  type BranchTransferValidation,
  type BranchReplenishmentRequest,
} from '../../packages/validation-schemas/src/branchInventory.schema';

export interface StockSucursalItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  unidadMedida: string;
  bufferSeguridad: number;
  esCritico: boolean;
  precioVentaPOS: number;
}

/**
 * 1. Valida si la Bodega Principal origen cuenta con stock suficiente para abastecer una sucursal.
 */
export function validarAbastecimientoSucursal(params: {
  bodegaPrincipalId: string;
  sucursalId: string;
  productoId: string;
  cantidad: number;
}): ResultadoOperacion<{ disponibleOrigen: number; suficiente: boolean; unidad: string; sku: string }> {
  const { bodegaPrincipalId, sucursalId, productoId, cantidad } = params;

  if (bodegaPrincipalId === sucursalId) {
    return { data: null, error: 'La bodega principal y la sucursal de destino no pueden ser la misma' };
  }

  const catalog = load<Producto[]>('productsCatalog', []);
  const producto = catalog.find((p) => p.id === productoId || p.sku === productoId);
  const sku = producto?.sku || productoId;
  const unidad = producto?.unidadMedida || 'KG';

  const stockDict = load<StockDictionary>('stock', {});
  const bodegaStock = stockDict[bodegaPrincipalId] || {};
  const disponibleOrigen = bodegaStock[sku] || 0;

  const suficiente = disponibleOrigen >= cantidad;

  if (!suficiente) {
    return {
      data: { disponibleOrigen, suficiente: false, unidad, sku },
      error: `Stock insuficiente en Bodega Principal. Disponible: ${disponibleOrigen} ${unidad}, Requerido: ${cantidad} ${unidad}`,
    };
  }

  return {
    data: { disponibleOrigen, suficiente: true, unidad, sku },
    error: null,
  };
}

/**
 * 2. Ejecuta el traslado atómico de abastecimiento inmediato desde Bodega Principal a la Sucursal.
 * Decrementa origen, incrementa destino y registra la trazabilidad en movimientos.
 */
export function ejecutarAbastecimientoInmediato(params: {
  bodegaPrincipalId: string;
  sucursalId: string;
  productoId: string;
  cantidad: number;
  usuarioResponsable: string;
  lote?: string;
  fechaVencimiento?: string;
  motivo?: string;
}): ResultadoOperacion<{
  transferId: string;
  stockOrigenRestante: number;
  stockSucursalNuevo: number;
  fecha: string;
}> {
  const {
    bodegaPrincipalId,
    sucursalId,
    productoId,
    cantidad,
    usuarioResponsable,
    lote,
    fechaVencimiento,
    motivo = 'ABASTECIMIENTO_SUCURSAL',
  } = params;

  const catalog = load<Producto[]>('productsCatalog', []);
  const producto = catalog.find((p) => p.id === productoId || p.sku === productoId);
  const sku = producto?.sku || productoId;
  const nombreProducto = producto?.nombre || sku;
  const unidadMedida = (producto?.unidadMedida as 'KG' | 'UNIDAD' | 'GRAMO') || 'KG';

  const stockDict = load<StockDictionary>('stock', {});
  const stockDisponibleOrigen = (stockDict[bodegaPrincipalId] || {})[sku] || 0;

  // Validación estricta con Zod
  const validationResult = BranchTransferValidationSchema.safeParse({
    bodegaOrigenId: bodegaPrincipalId,
    bodegaDestinoId: sucursalId,
    productoId,
    sku,
    nombreProducto,
    cantidad,
    unidadMedida,
    stockDisponibleOrigen,
    usuarioResponsable,
    motivo,
    lote,
    fechaVencimiento,
  });

  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map((e) => e.message).join('; ');
    return { data: null, error: errorMsg };
  }

  try {
    if (!stockDict[bodegaPrincipalId]) stockDict[bodegaPrincipalId] = {};
    if (!stockDict[sucursalId]) stockDict[sucursalId] = {};

    const stockActualOrigen = stockDict[bodegaPrincipalId][sku] || 0;
    const stockActualDestino = stockDict[sucursalId][sku] || 0;

    const stockOrigenRestante = Math.max(0, Math.round((stockActualOrigen - cantidad) * 1000) / 1000);
    const stockSucursalNuevo = Math.round((stockActualDestino + cantidad) * 1000) / 1000;

    stockDict[bodegaPrincipalId][sku] = stockOrigenRestante;
    stockDict[sucursalId][sku] = stockSucursalNuevo;
    save('stock', stockDict);

    const transferId = crypto.randomUUID?.() || `trf-${Date.now()}`;
    const fecha = new Date().toISOString();

    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({
      id: transferId,
      fecha,
      tipo: 'TRASLADO',
      bodegaOrigenId: bodegaPrincipalId,
      bodegaDestinoId: sucursalId,
      productoId,
      cantidad,
      referenciaId: `${motivo}:${usuarioResponsable}`,
    });
    save('movimientos', movimientos);

    return {
      data: {
        transferId,
        stockOrigenRestante,
        stockSucursalNuevo,
        fecha,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al ejecutar el abastecimiento a la sucursal' };
  }
}

/**
 * 3. Obtiene el catálogo de existencias segregado exclusivamente para una sucursal dada.
 */
export function obtenerStockPorSucursal(sucursalId: string): ResultadoOperacion<StockSucursalItem[]> {
  try {
    const catalog = load<Producto[]>('productsCatalog', []);
    const stockDict = load<StockDictionary>('stock', {});
    const sucursalStock = stockDict[sucursalId] || {};

    const items: StockSucursalItem[] = catalog.map((prod) => {
      const cantidad = sucursalStock[prod.sku] || 0;
      const bufferSeguridad = prod.bufferSeguridad || 0;
      return {
        productoId: prod.id,
        sku: prod.sku,
        nombre: prod.nombre,
        cantidad,
        unidadMedida: prod.unidadMedida || 'KG',
        bufferSeguridad,
        esCritico: cantidad <= bufferSeguridad,
        precioVentaPOS: Math.round(prod.precioVentaPOS || 0),
      };
    });

    return { data: items, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al obtener el stock de la sucursal' };
  }
}

/**
 * 4. Registra una solicitud de reabastecimiento generada desde un punto de venta.
 */
export function solicitarReabastecimientoSucursal(
  solicitud: BranchReplenishmentRequest
): ResultadoOperacion<{ solicitudId: string }> {
  const parseResult = BranchReplenishmentRequestSchema.safeParse(solicitud);
  if (!parseResult.success) {
    return { data: null, error: parseResult.error.errors.map((e) => e.message).join('; ') };
  }

  try {
    const solicitudes = load<BranchReplenishmentRequest[]>('branch_replenishment_requests', []);
    const nuevaSolicitud = {
      ...parseResult.data,
      id: parseResult.data.id || crypto.randomUUID?.() || `req-${Date.now()}`,
    };
    solicitudes.push(nuevaSolicitud);
    save('branch_replenishment_requests', solicitudes);

    return { data: { solicitudId: nuevaSolicitud.id! }, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al registrar la solicitud de reabastecimiento' };
  }
}

/**
 * 5. Consulta el historial de solicitudes de reabastecimiento de sucursales.
 */
export function obtenerSolicitudesReabastecimiento(filtros?: {
  sucursalId?: string;
  estado?: 'PENDIENTE' | 'APROBADO' | 'DESPACHADO' | 'RECHAZADO';
}): ResultadoOperacion<BranchReplenishmentRequest[]> {
  try {
    let solicitudes = load<BranchReplenishmentRequest[]>('branch_replenishment_requests', []);
    if (filtros?.sucursalId && filtros.sucursalId !== 'TODAS') {
      solicitudes = solicitudes.filter((s) => s.sucursalId === filtros.sucursalId);
    }
    if (filtros?.estado) {
      solicitudes = solicitudes.filter((s) => s.estado === filtros.estado);
    }
    return { data: solicitudes, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al consultar solicitudes de reabastecimiento' };
  }
}
