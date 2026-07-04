import { load, save } from './localDb';
import type { Producto } from '../types/inventory.types';
import type { ResultadoOperacion } from '../types/common.types';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from './LocalDataService';

export type StockDictionary = Record<string, Record<string, number>>;

export interface MovimientoInventario {
  id: string;
  fecha: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'DEVOLUCION';
  bodegaOrigenId: string | null;
  bodegaDestinoId: string | null;
  productoId: string;
  cantidad: number;
  referenciaId: string | null;
}

function getSkuByProductoId(productoId: string): string | null {
  const catalog = load<Producto[]>('productsCatalog', []);
  const producto = catalog.find((p) => p.id === productoId);
  return producto ? producto.sku : null;
}

function getUnidadByProductoId(productoId: string): string {
  const catalog = load<Producto[]>('productsCatalog', []);
  const producto = catalog.find((p) => p.id === productoId);
  return producto?.unidadMedida || 'KG';
}

// ── Legacy sync API ──
export function validarStock(productoId: string, bodegaId: string, cantidadRequerida: number): ResultadoOperacion<{ disponible: number }> {
  try {
    const sku = getSkuByProductoId(productoId);
    if (!sku) return { data: null, error: 'Producto no encontrado en el catálogo' };
    const stockDict = load<StockDictionary>('stock', {});
    const bodegaStock = stockDict[bodegaId] || {};
    const disponible = bodegaStock[sku] || 0;
    if (disponible < cantidadRequerida) {
      const unidad = getUnidadByProductoId(productoId);
      return { data: null, error: `Stock insuficiente. Disponible: ${disponible} ${unidad}` };
    }
    return { data: { disponible }, error: null };
  } catch {
    return { data: null, error: 'Error al validar el stock del producto' };
  }
}

export function registrarEntrada(params: { bodegaId: string; productoId: string; cantidad: number; referenciaId?: string }): ResultadoOperacion<{ cantidadNueva: number }> {
  const { bodegaId, productoId, cantidad, referenciaId = null } = params;
  if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
  try {
    const sku = getSkuByProductoId(productoId);
    if (!sku) return { data: null, error: 'Producto no encontrado' };
    const stockDict = load<StockDictionary>('stock', {});
    if (!stockDict[bodegaId]) stockDict[bodegaId] = {};
    if (stockDict[bodegaId][sku] === undefined) stockDict[bodegaId][sku] = 0;
    stockDict[bodegaId][sku] += cantidad;
    save('stock', stockDict);
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({ id: crypto.randomUUID?.() || `mov-${Date.now()}`, fecha: new Date().toISOString(), tipo: 'ENTRADA', bodegaOrigenId: null, bodegaDestinoId: bodegaId, productoId, cantidad, referenciaId });
    save('movimientos', movimientos);
    return { data: { cantidadNueva: stockDict[bodegaId][sku] }, error: null };
  } catch { return { data: null, error: 'Error al registrar la entrada de stock' }; }
}

export function registrarSalida(params: { bodegaId: string; productoId: string; cantidad: number; referenciaId?: string }): ResultadoOperacion<{ cantidadNueva: number }> {
  const { bodegaId, productoId, cantidad, referenciaId = null } = params;
  if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
  const validation = validarStock(productoId, bodegaId, cantidad);
  if (validation.error) return { data: null, error: validation.error };
  try {
    const sku = getSkuByProductoId(productoId);
    if (!sku) return { data: null, error: 'Producto no encontrado' };
    const stockDict = load<StockDictionary>('stock', {});
    const bodegaStock = stockDict[bodegaId] || {};
    if (bodegaStock[sku] === undefined) return { data: null, error: 'Stock no inicializado para este producto' };
    stockDict[bodegaId][sku] -= cantidad;
    save('stock', stockDict);
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({ id: crypto.randomUUID?.() || `mov-${Date.now()}`, fecha: new Date().toISOString(), tipo: 'SALIDA', bodegaOrigenId: bodegaId, bodegaDestinoId: null, productoId, cantidad, referenciaId });
    save('movimientos', movimientos);
    return { data: { cantidadNueva: stockDict[bodegaId][sku] }, error: null };
  } catch { return { data: null, error: 'Error al registrar la salida de stock' }; }
}

export function registrarTraslado(params: { bodegaOrigenId: string; bodegaDestinoId: string; productoId: string; cantidad: number; referenciaId?: string }): ResultadoOperacion<{ exito: boolean }> {
  const { bodegaOrigenId, bodegaDestinoId, productoId, cantidad, referenciaId = null } = params;
  if (bodegaOrigenId === bodegaDestinoId) return { data: null, error: 'La bodega de origen y destino no pueden ser la misma' };
  const validation = validarStock(productoId, bodegaOrigenId, cantidad);
  if (validation.error) return { data: null, error: `Origen: ${validation.error}` };
  try {
    const sku = getSkuByProductoId(productoId);
    if (!sku) return { data: null, error: 'Producto no encontrado' };
    const stockDict = load<StockDictionary>('stock', {});
    if (!stockDict[bodegaDestinoId]) stockDict[bodegaDestinoId] = {};
    if (!stockDict[bodegaOrigenId]?.[sku as string]) return { data: null, error: 'Stock no encontrado en origen' };
    stockDict[bodegaOrigenId][sku] -= cantidad;
    if (stockDict[bodegaDestinoId][sku] === undefined) stockDict[bodegaDestinoId][sku] = 0;
    stockDict[bodegaDestinoId][sku] += cantidad;
    save('stock', stockDict);
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({ id: crypto.randomUUID?.() || `mov-${Date.now()}`, fecha: new Date().toISOString(), tipo: 'TRASLADO', bodegaOrigenId, bodegaDestinoId, productoId, cantidad, referenciaId });
    save('movimientos', movimientos);
    return { data: { exito: true }, error: null };
  } catch { return { data: null, error: 'Error al registrar el traslado' }; }
}

export function procesarProduccion(params: { bodegaId: string; mpProductoId: string; mpCantidad: number; ptProductoId: string; ptCantidad: number; actor: string }): ResultadoOperacion<{ mermaPct: number }> {
  const { bodegaId, mpProductoId, mpCantidad, ptProductoId, ptCantidad } = params;
  if (mpCantidad <= 0 || ptCantidad <= 0) return { data: null, error: 'Las cantidades deben ser mayores a cero' };
  const mermaPct = ((mpCantidad - ptCantidad) / mpCantidad) * 100;
  const valMP = validarStock(mpProductoId, bodegaId, mpCantidad);
  if (valMP.error) return { data: null, error: `Materia Prima: ${valMP.error}` };
  try {
    const salResult = registrarSalida({ bodegaId, productoId: mpProductoId, cantidad: mpCantidad, referenciaId: `prod-${Date.now()}` });
    if (salResult.error) throw new Error(salResult.error);
    const entResult = registrarEntrada({ bodegaId, productoId: ptProductoId, cantidad: ptCantidad, referenciaId: `prod-${Date.now()}` });
    if (entResult.error) throw new Error(entResult.error);
    return { data: { mermaPct }, error: null };
  } catch (error: any) { return { data: null, error: error.message || 'Error en producción' }; }
}

// ── Nueva API async basada en IDataService ──
export class InventoryService {
  constructor(private dataService: IDataService = new LocalDataService()) {}

  private async getSku(productoId: string): Promise<string | null> {
    const catalog = await this.dataService.getAll<Producto>('productos_catalogo');
    return catalog.find(p => p.id === productoId)?.sku || null;
  }

  async validarStock(productoId: string, bodegaId: string, cantidadRequerida: number): Promise<ResultadoOperacion<{ disponible: number }>> {
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      const raw = await this.dataService.getAll<any>('stock');
      const stockDict: Record<string, Record<string, number>> = Array.isArray(raw) && raw.length ? raw[0] : (raw as any) || {};
      const bodegaStock = stockDict[bodegaId] || {};
      const disponible = bodegaStock[sku] || 0;
      if (disponible < cantidadRequerida) return { data: null, error: `Stock insuficiente. Disponible: ${disponible}` };
      return { data: { disponible }, error: null };
    } catch { return { data: null, error: 'Error al validar el stock' }; }
  }

  async registrarEntrada(params: { bodegaId: string; productoId: string; cantidad: number; referenciaId?: string }): Promise<ResultadoOperacion<{ cantidadNueva: number }>> {
    const { bodegaId, productoId, cantidad, referenciaId = null } = params;
    if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      await this.dataService.create('inventario_movimientos', { tipo: 'ENTRADA_COMPRA', sku, producto_id: productoId, bodega_destino_id: bodegaId, cantidad, referencia_id: referenciaId, actor: 'sistema' } as any);
      return { data: { cantidadNueva: cantidad }, error: null };
    } catch { return { data: null, error: 'Error al registrar la entrada' }; }
  }

  async registrarSalida(params: { bodegaId: string; productoId: string; cantidad: number; referenciaId?: string }): Promise<ResultadoOperacion<{ cantidadNueva: number }>> {
    const { bodegaId, productoId, cantidad, referenciaId = null } = params;
    if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
    const val = await this.validarStock(productoId, bodegaId, cantidad);
    if (val.error) return { data: null, error: val.error };
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      await this.dataService.create('inventario_movimientos', { tipo: 'VENTA', sku, producto_id: productoId, bodega_origen_id: bodegaId, cantidad, referencia_id: referenciaId, actor: 'sistema' } as any);
      return { data: { cantidadNueva: 0 }, error: null };
    } catch { return { data: null, error: 'Error al registrar la salida' }; }
  }

  async registrarTraslado(params: { bodegaOrigenId: string; bodegaDestinoId: string; productoId: string; cantidad: number; referenciaId?: string }): Promise<ResultadoOperacion<{ exito: boolean }>> {
    const { bodegaOrigenId, bodegaDestinoId, productoId, cantidad } = params;
    if (bodegaOrigenId === bodegaDestinoId) return { data: null, error: 'Misma bodega' };
    const val = await this.validarStock(productoId, bodegaOrigenId, cantidad);
    if (val.error) return { data: null, error: `Origen: ${val.error}` };
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      await this.dataService.create('inventario_movimientos', { tipo: 'TRASLADO_SALIDA', sku, producto_id: productoId, bodega_origen_id: bodegaOrigenId, bodega_destino_id: bodegaDestinoId, cantidad, actor: 'sistema' } as any);
      return { data: { exito: true }, error: null };
    } catch { return { data: null, error: 'Error al registrar el traslado' }; }
  }
}
