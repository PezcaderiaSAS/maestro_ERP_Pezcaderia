import { load, save } from './localDb';
import type { Producto } from '../types/inventory.types';
import type { ResultadoOperacion } from '../types/common.types';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from './LocalDataService';
import type {
  KardexMovement,
  TipoMovimientoKardex,
  WarehouseTransfer,
  WarehouseTransferItem,
  EstadoTraslado,
  ProcessingOrder,
  EstadoComandaProcesamiento,
  OrigenComandaProcesamiento,
  YieldCut,
  DespieceTransformationPayload,
  BatchFefo,
  Product,
} from '../types/erp.types';

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

// ── Helpers de Catálogo y Stock ──

export function getSkuByProductoId(productoId: string): string | null {
  const catalog = load<Producto[]>('productsCatalog', []);
  const producto = catalog.find((p) => p.id === productoId || p.sku === productoId);
  if (producto) return producto.sku;

  const erpCatalog = load<Product[]>('erp_products', []);
  const erpProd = erpCatalog.find((p) => p.id === productoId || p.sku === productoId);
  return erpProd ? erpProd.sku : null;
}

export function getUnidadByProductoId(productoId: string): string {
  const catalog = load<Producto[]>('productsCatalog', []);
  const producto = catalog.find((p) => p.id === productoId || p.sku === productoId);
  return producto?.unidadMedida || 'kg';
}

function getProductoNombre(productoId: string, sku?: string): string {
  const catalog = load<any[]>('productsCatalog', []);
  const erpCatalog = load<any[]>('erp_products', []);
  const item = catalog.find((p) => p.id === productoId || p.sku === sku) || erpCatalog.find((p) => p.id === productoId || p.sku === sku);
  return item?.nombre || item?.name || sku || productoId;
}

// ── 1. Costo Promedio Ponderado (CPP - NIIF NIC 2) ──

/**
 * Calcula el nuevo Costo Promedio Ponderado continuo tras una entrada de compra
 * Guard clause para evitar división por cero.
 */
export function calcularNuevoCPP(
  stockActual: number,
  cppActual: number,
  cantEntrada: number,
  precioEntrada: number
): number {
  if (cantEntrada <= 0) return cppActual;
  const stockPrevio = Math.max(0, stockActual);
  const stockFinal = stockPrevio + cantEntrada;
  if (stockFinal <= 0) return precioEntrada;

  const valorActual = stockPrevio * (cppActual > 0 ? cppActual : precioEntrada);
  const valorEntrada = cantEntrada * precioEntrada;
  const nuevoCpp = (valorActual + valorEntrada) / stockFinal;
  return Math.round(nuevoCpp * 100) / 100;
}

// ── 2. Kardex Contable NIIF ──

/**
 * Registra un movimiento inmutable en el Kardex y actualiza los saldos acumulados continuos
 */
export function registrarMovimientoKardex(
  mov: Omit<KardexMovement, 'id' | 'saldo_cantidad_kg' | 'saldo_costo_promedio' | 'saldo_valor_total' | 'fecha'> &
    Partial<Pick<KardexMovement, 'saldo_cantidad_kg' | 'saldo_costo_promedio' | 'saldo_valor_total' | 'fecha'>>
): ResultadoOperacion<KardexMovement> {
  try {
    const kardex = load<KardexMovement[]>('kardex_movements', []);
    const sku = mov.sku || getSkuByProductoId(mov.producto_id) || mov.producto_id;
    const nombre = mov.nombre_producto || getProductoNombre(mov.producto_id, sku);

    // Obtener último saldo registrado para este SKU
    const movimientosSku = kardex.filter((m) => m.sku === sku);
    const ultimoMov = movimientosSku[movimientosSku.length - 1];

    const saldoAnteriorCant = ultimoMov ? ultimoMov.saldo_cantidad_kg : 0;
    const saldoAnteriorCpp = ultimoMov ? ultimoMov.saldo_costo_promedio : mov.costo_unitario;

    let nuevaCantidad = saldoAnteriorCant;
    let nuevoCpp = saldoAnteriorCpp;

    const esEntrada =
      mov.tipo_movimiento.startsWith('ENTRADA') ||
      mov.tipo_movimiento === 'DEVOLUCION_CLIENTE';

    if (esEntrada) {
      nuevoCpp = calcularNuevoCPP(saldoAnteriorCant, saldoAnteriorCpp, mov.cantidad_kg, mov.costo_unitario);
      nuevaCantidad = Math.round((saldoAnteriorCant + mov.cantidad_kg) * 1000) / 1000;
    } else {
      // En salida, el costo unitario de salida es el CPP vigente
      nuevaCantidad = Math.max(0, Math.round((saldoAnteriorCant - mov.cantidad_kg) * 1000) / 1000);
      if (nuevaCantidad === 0) {
        nuevoCpp = saldoAnteriorCpp;
      }
    }

    const nuevoSaldoValor = Math.round(nuevaCantidad * nuevoCpp);

    const nuevoRegistro: KardexMovement = {
      id: crypto.randomUUID?.() || `kardex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fecha: mov.fecha || new Date().toISOString(),
      producto_id: mov.producto_id,
      sku,
      nombre_producto: nombre,
      tipo_movimiento: mov.tipo_movimiento,
      cantidad_kg: mov.cantidad_kg,
      costo_unitario: mov.costo_unitario > 0 ? mov.costo_unitario : nuevoCpp,
      costo_total: Math.round(mov.cantidad_kg * (mov.costo_unitario > 0 ? mov.costo_unitario : nuevoCpp)),
      saldo_cantidad_kg: nuevaCantidad,
      saldo_costo_promedio: nuevoCpp,
      saldo_valor_total: nuevoSaldoValor,
      documento_referencia: mov.documento_referencia || 'N/A',
      usuario_responsable: mov.usuario_responsable || 'Sistema',
      bodega_id: mov.bodega_id,
      bodega_nombre: mov.bodega_nombre,
      lote_id: mov.lote_id,
      notas: mov.notas,
    };

    kardex.push(nuevoRegistro);
    save('kardex_movements', kardex);

    // Actualizar CPP en el catálogo erp_products si existe
    const erpCatalog = load<Product[]>('erp_products', []);
    const prodIdx = erpCatalog.findIndex((p) => p.sku === sku || p.id === mov.producto_id);
    if (prodIdx >= 0) {
      erpCatalog[prodIdx] = {
        ...erpCatalog[prodIdx],
        costo_promedio_ponderado: nuevoCpp,
        stock_total: nuevaCantidad,
        stock_available: Math.max(0, nuevaCantidad - (erpCatalog[prodIdx].stock_reserved || 0)),
      };
      save('erp_products', erpCatalog);
    }

    return { data: nuevoRegistro, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al registrar en Kardex' };
  }
}

/**
 * Consulta el historial de Kardex con filtros opcionales
 */
export function obtenerKardex(filtros?: {
  sku?: string;
  producto_id?: string;
  tipo?: TipoMovimientoKardex;
  fechaInicio?: string;
  fechaFin?: string;
  bodega_id?: string;
}): KardexMovement[] {
  const kardex = load<KardexMovement[]>('kardex_movements', []);
  if (!filtros) return kardex;

  return kardex.filter((m) => {
    if (filtros.sku && m.sku !== filtros.sku) return false;
    if (filtros.producto_id && m.producto_id !== filtros.producto_id) return false;
    if (filtros.tipo && m.tipo_movimiento !== filtros.tipo) return false;
    if (filtros.bodega_id && m.bodega_id !== filtros.bodega_id) return false;
    if (filtros.fechaInicio && m.fecha < filtros.fechaInicio) return false;
    if (filtros.fechaFin && m.fecha > filtros.fechaFin) return false;
    return true;
  });
}

// ── 3. Transformación / Despiece de Materia Prima a Productos Terminados ──

/**
 * Procesa el despiece con distribución de costos por valor relativo de mercado y balance de masa
 */
export function procesarDespieceConProrrateo(
  payload: DespieceTransformationPayload
): ResultadoOperacion<{
  mermaKg: number;
  mermaPct: number;
  costoTotalMP: number;
  cortesProcesados: YieldCut[];
  movimientosKardex: KardexMovement[];
}> {
  const {
    materia_prima_id,
    materia_prima_nombre,
    bodega_id,
    peso_inicial_kg,
    costo_unitario_mp,
    cortes_obtenidos,
    usuario_responsable,
    comanda_id,
  } = payload;

  if (peso_inicial_kg <= 0) {
    return { data: null, error: 'El peso inicial de materia prima debe ser mayor a cero' };
  }

  // Validar stock de materia prima en la bodega
  const valMP = validarStock(materia_prima_id, bodega_id, peso_inicial_kg);
  if (valMP.error) {
    return { data: null, error: `Materia Prima: ${valMP.error}` };
  }

  // 1. Balance de masa
  const pesoTotalCortes = cortes_obtenidos.reduce((sum, c) => sum + (c.peso_obtenido_kg || 0), 0);
  const mermaKg = Math.max(0, Math.round((peso_inicial_kg - pesoTotalCortes) * 1000) / 1000);
  const mermaPct = Math.round((mermaKg / peso_inicial_kg) * 1000) / 10;

  const costoTotalMP = Math.round(peso_inicial_kg * costo_unitario_mp);

  // 2. Prorrateo por Valor Relativo de Mercado
  // Factor de valor relativo ponderado: Score_i = peso_i * factor_i
  const scoreTotal = cortes_obtenidos.reduce(
    (acc, c) => acc + (c.peso_obtenido_kg || 0) * (c.factor_valor_mercado || 1),
    0
  );

  let costoAsignadoAcumulado = 0;
  const cortesCalculados: YieldCut[] = cortes_obtenidos.map((c, idx) => {
    let costoCorte = 0;
    if (scoreTotal > 0 && c.peso_obtenido_kg > 0) {
      const proporcionScore = (c.peso_obtenido_kg * (c.factor_valor_mercado || 1)) / scoreTotal;
      if (idx === cortes_obtenidos.length - 1) {
        // Cuadre exacto en el último corte para evitar desfase de redondeo
        costoCorte = costoTotalMP - costoAsignadoAcumulado;
      } else {
        costoCorte = Math.round(costoTotalMP * proporcionScore);
        costoAsignadoAcumulado += costoCorte;
      }
    }
    const costoUnit = c.peso_obtenido_kg > 0 ? Math.round((costoCorte / c.peso_obtenido_kg) * 100) / 100 : 0;
    return {
      ...c,
      costo_asignado_total: costoCorte,
      costo_asignado_unitario: costoUnit,
    };
  });

  const movimientosKardex: KardexMovement[] = [];

  try {
    // 3. Registrar salida de Materia Prima
    const salResult = registrarSalida({
      bodegaId: bodega_id,
      productoId: materia_prima_id,
      cantidad: peso_inicial_kg,
      referenciaId: `despiece-${Date.now()}`,
    });
    if (salResult.error) throw new Error(salResult.error);

    const movSalMP = registrarMovimientoKardex({
      producto_id: materia_prima_id,
      sku: getSkuByProductoId(materia_prima_id) || materia_prima_id,
      nombre_producto: materia_prima_nombre,
      tipo_movimiento: 'SALIDA_MATERIA_PRIMA',
      cantidad_kg: peso_inicial_kg,
      costo_unitario: costo_unitario_mp,
      costo_total: costoTotalMP,
      documento_referencia: `DESPIECE-${Date.now().toString().slice(-6)}`,
      usuario_responsable,
      bodega_id,
      notas: `Despiece de ${peso_inicial_kg} Kg. Merma: ${mermaKg} Kg (${mermaPct}%)`,
    });
    if (movSalMP.data) movimientosKardex.push(movSalMP.data);

    // 4. Registrar entradas de Productos Terminados
    for (const corte of cortesCalculados) {
      if (corte.peso_obtenido_kg > 0) {
        registrarEntrada({
          bodegaId: bodega_id,
          productoId: corte.producto_id,
          cantidad: corte.peso_obtenido_kg,
          referenciaId: `despiece-in-${Date.now()}`,
        });

        const movEntPT = registrarMovimientoKardex({
          producto_id: corte.producto_id,
          sku: corte.sku || getSkuByProductoId(corte.producto_id) || corte.producto_id,
          nombre_producto: corte.nombre_corte,
          tipo_movimiento: 'ENTRADA_PRODUCTO_TERMINADO',
          cantidad_kg: corte.peso_obtenido_kg,
          costo_unitario: corte.costo_asignado_unitario,
          costo_total: corte.costo_asignado_total,
          documento_referencia: `DESPIECE-${Date.now().toString().slice(-6)}`,
          usuario_responsable,
          bodega_id,
          notas: `Corte obtenido de ${materia_prima_nombre}. Factor: ${corte.factor_valor_mercado}x`,
        });
        if (movEntPT.data) movimientosKardex.push(movEntPT.data);
      }
    }

    // 5. Si provenía de una Comanda, marcarla como COMPLETADA
    if (comanda_id) {
      actualizarEstadoComanda(comanda_id, 'COMPLETADA', usuario_responsable);
    }

    return {
      data: {
        mermaKg,
        mermaPct,
        costoTotalMP,
        cortesProcesados: cortesCalculados,
        movimientosKardex,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error durante la ejecución del despiece' };
  }
}

// ── 4. Comandas de Despiece de Cuarto Frío ──

export function crearComandaProcesamiento(
  params: Omit<ProcessingOrder, 'id' | 'codigo_comanda' | 'estado' | 'fecha_emision'>
): ResultadoOperacion<ProcessingOrder> {
  try {
    const comandas = load<ProcessingOrder[]>('processing_orders', []);
    const codigo = `CMD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${(comandas.length + 1).toString().padStart(3, '0')}`;

    const nuevaComanda: ProcessingOrder = {
      ...params,
      id: crypto.randomUUID?.() || `cmd-${Date.now()}`,
      codigo_comanda: codigo,
      estado: 'PENDIENTE',
      fecha_emision: new Date().toISOString(),
    };

    comandas.unshift(nuevaComanda);
    save('processing_orders', comandas);

    return { data: nuevaComanda, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al crear comanda de procesamiento' };
  }
}

export function obtenerComandasProcesamiento(estado?: EstadoComandaProcesamiento): ProcessingOrder[] {
  const comandas = load<ProcessingOrder[]>('processing_orders', []);
  if (!estado) return comandas;
  return comandas.filter((c) => c.estado === estado);
}

export function actualizarEstadoComanda(
  comandaId: string,
  estado: EstadoComandaProcesamiento,
  responsable?: string
): ResultadoOperacion<ProcessingOrder> {
  try {
    const comandas = load<ProcessingOrder[]>('processing_orders', []);
    const idx = comandas.findIndex((c) => c.id === comandaId || c.codigo_comanda === comandaId);
    if (idx === -1) return { data: null, error: 'Comanda no encontrada' };

    comandas[idx] = {
      ...comandas[idx],
      estado,
      responsable_corte: responsable || comandas[idx].responsable_corte,
      fecha_completada: estado === 'COMPLETADA' ? new Date().toISOString() : comandas[idx].fecha_completada,
    };

    save('processing_orders', comandas);
    return { data: comandas[idx], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al actualizar comanda' };
  }
}

// ── 5. Traslados Multibodega ──

export function crearGuiaTraslado(
  params: Omit<WarehouseTransfer, 'id' | 'codigo_guia' | 'estado' | 'fecha_creacion'>
): ResultadoOperacion<WarehouseTransfer> {
  const { bodega_origen_id, bodega_destino_id, items, usuario_despacha } = params;
  if (bodega_origen_id === bodega_destino_id) {
    return { data: null, error: 'La bodega de origen y destino no pueden ser la misma' };
  }
  if (!items || items.length === 0) {
    return { data: null, error: 'Debe incluir al menos un producto a trasladar' };
  }

  // Validar stock de cada ítem en origen
  for (const item of items) {
    const val = validarStock(item.producto_id, bodega_origen_id, item.cantidad_kg);
    if (val.error) return { data: null, error: `Stock origen insuficiente para ${item.nombre}: ${val.error}` };
  }

  try {
    // Descontar temporalmente en origen mientras está en tránsito
    for (const item of items) {
      registrarSalida({
        bodegaId: bodega_origen_id,
        productoId: item.producto_id,
        cantidad: item.cantidad_kg,
        referenciaId: `traslado-transito-${Date.now()}`,
      });
    }

    const traslados = load<WarehouseTransfer[]>('warehouse_transfers', []);
    const codigo = `TRF-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${(traslados.length + 1).toString().padStart(3, '0')}`;

    const nuevaGuia: WarehouseTransfer = {
      ...params,
      id: crypto.randomUUID?.() || `trf-${Date.now()}`,
      codigo_guia: codigo,
      estado: 'EN_TRANSITO',
      fecha_creacion: new Date().toISOString(),
    };

    traslados.unshift(nuevaGuia);
    save('warehouse_transfers', traslados);

    return { data: nuevaGuia, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al crear la guía de traslado' };
  }
}

export function confirmarRecepcionTraslado(
  trasladoId: string,
  usuarioRecibe: string
): ResultadoOperacion<WarehouseTransfer> {
  try {
    const traslados = load<WarehouseTransfer[]>('warehouse_transfers', []);
    const idx = traslados.findIndex((t) => t.id === trasladoId || t.codigo_guia === trasladoId);
    if (idx === -1) return { data: null, error: 'Guía de traslado no encontrada' };

    const guia = traslados[idx];
    if (guia.estado !== 'EN_TRANSITO') {
      return { data: null, error: `La guía no está en tránsito (Estado actual: ${guia.estado})` };
    }

    // Acreditar stock en la bodega destino
    for (const item of guia.items) {
      registrarEntrada({
        bodegaId: guia.bodega_destino_id,
        productoId: item.producto_id,
        cantidad: item.cantidad_kg,
        referenciaId: `traslado-in-${guia.codigo_guia}`,
      });

      // Registrar movimientos en Kardex
      registrarMovimientoKardex({
        producto_id: item.producto_id,
        sku: item.sku,
        nombre_producto: item.nombre,
        tipo_movimiento: 'SALIDA_TRASLADO',
        cantidad_kg: item.cantidad_kg,
        costo_unitario: item.costo_unitario,
        costo_total: Math.round(item.cantidad_kg * item.costo_unitario),
        documento_referencia: guia.codigo_guia,
        usuario_responsable: guia.usuario_despacha,
        bodega_id: guia.bodega_origen_id,
        bodega_nombre: guia.bodega_origen_nombre,
        notas: `Traslado a ${guia.bodega_destino_nombre}`,
      });

      registrarMovimientoKardex({
        producto_id: item.producto_id,
        sku: item.sku,
        nombre_producto: item.nombre,
        tipo_movimiento: 'ENTRADA_TRASLADO',
        cantidad_kg: item.cantidad_kg,
        costo_unitario: item.costo_unitario,
        costo_total: Math.round(item.cantidad_kg * item.costo_unitario),
        documento_referencia: guia.codigo_guia,
        usuario_responsable: usuarioRecibe,
        bodega_id: guia.bodega_destino_id,
        bodega_nombre: guia.bodega_destino_nombre,
        notas: `Recibido desde ${guia.bodega_origen_nombre}`,
      });
    }

    traslados[idx] = {
      ...guia,
      estado: 'RECIBIDO_CONFORME',
      fecha_recepcion: new Date().toISOString(),
      usuario_recibe: usuarioRecibe,
    };

    save('warehouse_transfers', traslados);
    return { data: traslados[idx], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al confirmar recepción de traslado' };
  }
}

export function cancelarTraslado(
  trasladoId: string,
  motivo?: string
): ResultadoOperacion<WarehouseTransfer> {
  try {
    const traslados = load<WarehouseTransfer[]>('warehouse_transfers', []);
    const idx = traslados.findIndex((t) => t.id === trasladoId || t.codigo_guia === trasladoId);
    if (idx === -1) return { data: null, error: 'Guía no encontrada' };

    const guia = traslados[idx];
    if (guia.estado !== 'EN_TRANSITO') {
      return { data: null, error: 'Solo se pueden cancelar traslados en tránsito' };
    }

    // Devolver el stock a la bodega de origen
    for (const item of guia.items) {
      registrarEntrada({
        bodegaId: guia.bodega_origen_id,
        productoId: item.producto_id,
        cantidad: item.cantidad_kg,
        referenciaId: `traslado-cancelado-${guia.codigo_guia}`,
      });
    }

    traslados[idx] = {
      ...guia,
      estado: 'CANCELADO',
      notas: motivo ? `${guia.notas || ''} | Cancelado: ${motivo}` : guia.notas,
    };

    save('warehouse_transfers', traslados);
    return { data: traslados[idx], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al cancelar traslado' };
  }
}

export function obtenerTraslados(estado?: EstadoTraslado): WarehouseTransfer[] {
  const traslados = load<WarehouseTransfer[]>('warehouse_transfers', []);
  if (!estado) return traslados;
  return traslados.filter((t) => t.estado === estado);
}

// ── 6. Lotes Perecederos FEFO ──

export function obtenerLotesFEFO(productoId?: string, bodegaId?: string): BatchFefo[] {
  const lotes = load<BatchFefo[]>('inventory_batches', []);
  const hoy = new Date();

  return lotes
    .map((lote) => {
      const fechaVenc = new Date(lote.fecha_vencimiento);
      const diffMs = fechaVenc.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let estado: BatchFefo['estado'] = 'OPTIMO';
      if (diasRestantes <= 0) estado = 'VENCIDO';
      else if (diasRestantes <= 10) estado = 'CRITICO';
      else if (diasRestantes <= 30) estado = 'ALERTA';

      return {
        ...lote,
        dias_restantes: diasRestantes,
        estado,
      };
    })
    .filter((lote) => {
      if (productoId && lote.producto_id !== productoId && lote.sku !== productoId) return false;
      if (bodegaId && lote.bodega_id !== bodegaId) return false;
      return true;
    })
    .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
}

export function registrarLoteFEFO(
  lote: Omit<BatchFefo, 'id' | 'dias_restantes' | 'estado'>
): ResultadoOperacion<BatchFefo> {
  try {
    const lotes = load<BatchFefo[]>('inventory_batches', []);
    const hoy = new Date();
    const fechaVenc = new Date(lote.fecha_vencimiento);
    const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    let estado: BatchFefo['estado'] = 'OPTIMO';
    if (diasRestantes <= 0) estado = 'VENCIDO';
    else if (diasRestantes <= 10) estado = 'CRITICO';
    else if (diasRestantes <= 30) estado = 'ALERTA';

    const nuevoLote: BatchFefo = {
      ...lote,
      id: crypto.randomUUID?.() || `batch-${Date.now()}`,
      dias_restantes: diasRestantes,
      estado,
    };

    lotes.push(nuevoLote);
    save('inventory_batches', lotes);

    return { data: nuevoLote, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al registrar lote' };
  }
}

// ── 7. Legacy Sync API (Preservada para 100% de compatibilidad) ──

export function validarStock(
  productoId: string,
  bodegaId: string,
  cantidadRequerida: number
): ResultadoOperacion<{ disponible: number }> {
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

export function registrarEntrada(params: {
  bodegaId: string;
  productoId: string;
  cantidad: number;
  referenciaId?: string;
}): ResultadoOperacion<{ cantidadNueva: number }> {
  const { bodegaId, productoId, cantidad, referenciaId = null } = params;
  if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
  try {
    const sku = getSkuByProductoId(productoId);
    if (!sku) return { data: null, error: 'Producto no encontrado' };
    const stockDict = load<StockDictionary>('stock', {});
    if (!stockDict[bodegaId]) stockDict[bodegaId] = {};
    if (stockDict[bodegaId][sku] === undefined) stockDict[bodegaId][sku] = 0;
    stockDict[bodegaId][sku] = Math.round((stockDict[bodegaId][sku] + cantidad) * 1000) / 1000;
    save('stock', stockDict);

    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({
      id: crypto.randomUUID?.() || `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: 'ENTRADA',
      bodegaOrigenId: null,
      bodegaDestinoId: bodegaId,
      productoId,
      cantidad,
      referenciaId,
    });
    save('movimientos', movimientos);

    return { data: { cantidadNueva: stockDict[bodegaId][sku] }, error: null };
  } catch {
    return { data: null, error: 'Error al registrar la entrada de stock' };
  }
}

export function registrarSalida(params: {
  bodegaId: string;
  productoId: string;
  cantidad: number;
  referenciaId?: string;
}): ResultadoOperacion<{ cantidadNueva: number }> {
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

    stockDict[bodegaId][sku] = Math.max(0, Math.round((stockDict[bodegaId][sku] - cantidad) * 1000) / 1000);
    save('stock', stockDict);

    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({
      id: crypto.randomUUID?.() || `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: 'SALIDA',
      bodegaOrigenId: bodegaId,
      bodegaDestinoId: null,
      productoId,
      cantidad,
      referenciaId,
    });
    save('movimientos', movimientos);

    return { data: { cantidadNueva: stockDict[bodegaId][sku] }, error: null };
  } catch {
    return { data: null, error: 'Error al registrar la salida de stock' };
  }
}

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
  const validation = validarStock(productoId, bodegaOrigenId, cantidad);
  if (validation.error) return { data: null, error: `Origen: ${validation.error}` };

  try {
    const sku = getSkuByProductoId(productoId);
    if (!sku) return { data: null, error: 'Producto no encontrado' };
    const stockDict = load<StockDictionary>('stock', {});
    if (!stockDict[bodegaDestinoId]) stockDict[bodegaDestinoId] = {};
    if (!stockDict[bodegaOrigenId]?.[sku as string]) return { data: null, error: 'Stock no encontrado en origen' };

    stockDict[bodegaOrigenId][sku] = Math.max(0, Math.round((stockDict[bodegaOrigenId][sku] - cantidad) * 1000) / 1000);
    if (stockDict[bodegaDestinoId][sku] === undefined) stockDict[bodegaDestinoId][sku] = 0;
    stockDict[bodegaDestinoId][sku] = Math.round((stockDict[bodegaDestinoId][sku] + cantidad) * 1000) / 1000;
    save('stock', stockDict);

    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    movimientos.push({
      id: crypto.randomUUID?.() || `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: 'TRASLADO',
      bodegaOrigenId,
      bodegaDestinoId,
      productoId,
      cantidad,
      referenciaId,
    });
    save('movimientos', movimientos);

    return { data: { exito: true }, error: null };
  } catch {
    return { data: null, error: 'Error al registrar el traslado' };
  }
}

export function procesarProduccion(params: {
  bodegaId: string;
  mpProductoId: string;
  mpCantidad: number;
  ptProductoId: string;
  ptCantidad: number;
  actor: string;
}): ResultadoOperacion<{ mermaPct: number }> {
  const { bodegaId, mpProductoId, mpCantidad, ptProductoId, ptCantidad } = params;
  if (mpCantidad <= 0 || ptCantidad <= 0) return { data: null, error: 'Las cantidades deben ser mayores a cero' };
  const mermaPct = ((mpCantidad - ptCantidad) / mpCantidad) * 100;
  const valMP = validarStock(mpProductoId, bodegaId, mpCantidad);
  if (valMP.error) return { data: null, error: `Materia Prima: ${valMP.error}` };

  try {
    const salResult = registrarSalida({
      bodegaId,
      productoId: mpProductoId,
      cantidad: mpCantidad,
      referenciaId: `prod-${Date.now()}`,
    });
    if (salResult.error) throw new Error(salResult.error);

    const entResult = registrarEntrada({
      bodegaId,
      productoId: ptProductoId,
      cantidad: ptCantidad,
      referenciaId: `prod-${Date.now()}`,
    });
    if (entResult.error) throw new Error(entResult.error);

    return { data: { mermaPct }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Error en producción' };
  }
}

// ── 8. Nueva API async basada en IDataService ──
export class InventoryService {
  constructor(private dataService: IDataService = new LocalDataService()) {}

  private async getSku(productoId: string): Promise<string | null> {
    const catalog = await this.dataService.getAll<Producto>('productos_catalogo');
    return catalog.find((p) => p.id === productoId)?.sku || null;
  }

  async validarStock(
    productoId: string,
    bodegaId: string,
    cantidadRequerida: number
  ): Promise<ResultadoOperacion<{ disponible: number }>> {
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      const raw = await this.dataService.getAll<any>('stock');
      const stockDict: Record<string, Record<string, number>> =
        Array.isArray(raw) && raw.length ? raw[0] : (raw as any) || {};
      const bodegaStock = stockDict[bodegaId] || {};
      const disponible = bodegaStock[sku] || 0;
      if (disponible < cantidadRequerida) return { data: null, error: `Stock insuficiente. Disponible: ${disponible}` };
      return { data: { disponible }, error: null };
    } catch {
      return { data: null, error: 'Error al validar el stock' };
    }
  }

  async registrarEntrada(params: {
    bodegaId: string;
    productoId: string;
    cantidad: number;
    referenciaId?: string;
  }): Promise<ResultadoOperacion<{ cantidadNueva: number }>> {
    const { bodegaId, productoId, cantidad, referenciaId = null } = params;
    if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      await this.dataService.create('inventario_movimientos', {
        tipo: 'ENTRADA_COMPRA',
        sku,
        producto_id: productoId,
        bodega_destino_id: bodegaId,
        cantidad,
        referencia_id: referenciaId,
        actor: 'sistema',
      } as any);
      return { data: { cantidadNueva: cantidad }, error: null };
    } catch {
      return { data: null, error: 'Error al registrar la entrada' };
    }
  }

  async registrarSalida(params: {
    bodegaId: string;
    productoId: string;
    cantidad: number;
    referenciaId?: string;
  }): Promise<ResultadoOperacion<{ cantidadNueva: number }>> {
    const { bodegaId, productoId, cantidad, referenciaId = null } = params;
    if (cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero' };
    const val = await this.validarStock(productoId, bodegaId, cantidad);
    if (val.error) return { data: null, error: val.error };
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      await this.dataService.create('inventario_movimientos', {
        tipo: 'VENTA',
        sku,
        producto_id: productoId,
        bodega_origen_id: bodegaId,
        cantidad,
        referencia_id: referenciaId,
        actor: 'sistema',
      } as any);
      return { data: { cantidadNueva: 0 }, error: null };
    } catch {
      return { data: null, error: 'Error al registrar la salida' };
    }
  }

  async registrarTraslado(params: {
    bodegaOrigenId: string;
    bodegaDestinoId: string;
    productoId: string;
    cantidad: number;
    referenciaId?: string;
  }): Promise<ResultadoOperacion<{ exito: boolean }>> {
    const { bodegaOrigenId, bodegaDestinoId, productoId, cantidad } = params;
    if (bodegaOrigenId === bodegaDestinoId) return { data: null, error: 'Misma bodega' };
    const val = await this.validarStock(productoId, bodegaOrigenId, cantidad);
    if (val.error) return { data: null, error: `Origen: ${val.error}` };
    try {
      const sku = await this.getSku(productoId);
      if (!sku) return { data: null, error: 'Producto no encontrado' };
      await this.dataService.create('inventario_movimientos', {
        tipo: 'TRASLADO_SALIDA',
        sku,
        producto_id: productoId,
        bodega_origen_id: bodegaOrigenId,
        bodega_destino_id: bodegaDestinoId,
        cantidad,
        actor: 'sistema',
      } as any);
      return { data: { exito: true }, error: null };
    } catch {
      return { data: null, error: 'Error al registrar el traslado' };
    }
  }
}
