import { useEffect, useMemo, useCallback } from 'react';
import { createLogger } from '../lib/consoleLogger';
import { generateId } from '../lib/utils';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMovementStore, type MovimientoInventario } from '../store/useMovementStore';
import { useReturnStore } from '../store/useReturnStore';
import { useEventStore } from '../store/useEventStore';
import type { Venta, DevolucionPedido, LogIntegracion } from '../types/erp.types';

export function useDigitalOrdersIntegration() {
  const log = useMemo(() => createLogger('DigitalOrdersIntegration'), []);

  const logIntegracion = useIntegrationStore((s) => s.logIntegracion);
  const setLogIntegracion = useIntegrationStore((s) => s.setLogIntegracion);
  const parametros = useIntegrationStore((s) => s.parametros);

  const ventas = useOrderStore((s) => s.ventas);
  const setVentas = useOrderStore((s) => s.setVentas);

  const stock = useInventoryStore((s) => s.stock);
  const setStock = useInventoryStore((s) => s.setStock);

  const addMovimiento = useMovementStore((s) => s.addMovimiento);
  const setDevoluciones = useReturnStore((s) => s.setDevoluciones);

  // Helper para publicar eventos de dominio
  const publishDomainEvent = useCallback((
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync = true
  ) => {
    log.info('publishEvent', {
      tipo,
      actor,
      descripcion: descripcion?.substring(0, 120),
      metadata,
    });
    useEventStore.getState().publishEvent(tipo, actor, descripcion, metadata, enqueueSync);
  }, [log]);

  // Worker para Procesamiento Asíncrono de Canales Digitales (RN-03, RN-01, RN-02, RN-05, RN-07)
  useEffect(() => {
    const pendingOrder = logIntegracion.find((l) => l.estado === 'PENDIENTE');
    if (!pendingOrder) return;

    const timer = setTimeout(() => {
      let orderData: any;
      try {
        orderData = JSON.parse(pendingOrder.payload_json);
      } catch (e) {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Payload JSON inválido' } : l)
        );
        return;
      }

      // 1. Verificar firma/autenticación (RN-01)
      if (!orderData.signature || orderData.signature !== 'VALID_CRYPTO_SIGNATURE') {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Error de Autenticación: Firma criptográfica inválida o ausente' } : l)
        );
        publishDomainEvent('METADATA_CONFIGURED', 'System Integrator', `Rechazado pedido digital ${pendingOrder.id_pedido_externo} - Firma inválida`, null, false);
        return;
      }

      // 2. Verificar Idempotencia (RN-02)
      const isDuplicate = ventas.some((v: any) => v.metadata?.id_pedido_externo === pendingOrder.id_pedido_externo);
      if (isDuplicate) {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Idempotencia: Pedido ya procesado' } : l)
        );
        publishDomainEvent('METADATA_CONFIGURED', 'System Integrator', `Rechazado pedido duplicado ${pendingOrder.id_pedido_externo} por idempotencia`, null, false);
        return;
      }

      // 3. Validación de Stock Restrictiva (RN-07)
      let stockSuficiente = true;
      const stockPrincipal = stock['Bodega Principal'] || {};
      const itemsFaltantes: string[] = [];

      orderData.items.forEach((item: any) => {
        const currentStock = stockPrincipal[item.sku] || 0;
        if (currentStock < item.cantidad) {
          stockSuficiente = false;
          itemsFaltantes.push(`${item.nombre} (Solicitado: ${item.cantidad}, Disponible: ${currentStock})`);
        }
      });

      if (!stockSuficiente) {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'REVISION_MANUAL', mensaje_error: `Stock insuficiente: ${itemsFaltantes.join(', ')}` } : l)
        );
        publishDomainEvent('METADATA_CONFIGURED', 'System Integrator', `Pedido ${pendingOrder.id_pedido_externo} retenido en REVISIÓN MANUAL por falta de stock`, null, false);
        return;
      }

      // 4. Crear venta (RN-05 - Asignación dinámica de método de pago)
      const canalKey = pendingOrder.canal.toLowerCase();
      const paymentMethodCode = parametros.metodosPagoExternos[canalKey] || 'DIG-001';
      const vtaId = generateId('vta');

      // Restar stock
      setStock((prev: Record<string, Record<string, number>>) => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = { ...newStock['Bodega Principal'] };
          orderData.items.forEach((orderItem: any) => {
            const sku = orderItem.sku;
            const currentStock = newStock['Bodega Principal'][sku] || 0;
            newStock['Bodega Principal'][sku] = Math.max(0, currentStock - orderItem.cantidad);
          });
        }
        return newStock;
      });

      const newVenta: Venta = {
        id: vtaId,
        clienteId: orderData.clienteId || null,
        clienteNombre: orderData.clienteNombre || 'Consumidor Digital',
        fecha: new Date().toISOString(),
        items: orderData.items.map((item: any) => ({
          sku: item.sku,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: 0,
        })),
        subtotal: orderData.subtotal,
        total: orderData.total,
        metodoPago: 'MIXTO', // Indicador para facturación mixta/digital
        actor: 'Integracion Digital',
        metadata: {
          id_pedido_externo: pendingOrder.id_pedido_externo,
          canal: pendingOrder.canal,
          metodo_pago_codigo: paymentMethodCode,
        },
      };

      setVentas((prev: any[]) => [newVenta, ...prev]);

      // Registrar movimiento de inventario
      const newMovements: MovimientoInventario[] = orderData.items.map((item: any) => {
        const lote = 'CANAL-DIGITAL';
        return {
          id: generateId('mov'),
          timestamp: new Date().toISOString(),
          tipo: 'VENTA',
          sku: item.sku,
          nombreProducto: item.nombre,
          bodegaOrigen: 'Bodega Principal',
          cantidad: item.cantidad,
          lote: lote,
          referenciaId: vtaId,
          referenciaTipo: 'VENTA',
          actor: 'Integracion Digital',
          notas: `Integración Digital (${pendingOrder.canal}) - Pedido ${pendingOrder.id_pedido_externo}`,
        };
      });
      newMovements.forEach((mov: MovimientoInventario) => addMovimiento(mov));

      setLogIntegracion((prev: LogIntegracion[]) =>
        prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'PROCESADO', id_factura_pos: vtaId } : l)
      );

      publishDomainEvent(
        'SALE_COMPLETED',
        'Integracion Digital',
        `Pedido digital ${pendingOrder.id_pedido_externo} de ${pendingOrder.canal} facturado automáticamente por $${orderData.total.toLocaleString('es-CO')}`,
        { id_pedido_externo: pendingOrder.id_pedido_externo, total: orderData.total }
      );

    }, 2000);

    return () => clearTimeout(timer);
  }, [logIntegracion, stock, ventas, parametros, addMovimiento, publishDomainEvent, setLogIntegracion, setStock, setVentas]);

  // Handler para cancelaciones automáticas (RN-04)
  const handleCancelarPedidoDigital = useCallback((logId: string) => {
    log.info('cancelarPedidoDigital', { logId });
    const integLog = logIntegracion.find((l) => l.id === logId);
    if (!integLog) return;

    let orderData: any;
    try {
      orderData = JSON.parse(integLog.payload_json);
    } catch (e) {
      return;
    }

    if (integLog.estado === 'PROCESADO' && integLog.id_factura_pos) {
      // Reversar stock a Bodega Principal
      setStock((prev: Record<string, Record<string, number>>) => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = { ...newStock['Bodega Principal'] };
          orderData.items.forEach((orderItem: any) => {
            const sku = orderItem.sku;
            const currentStock = newStock['Bodega Principal'][sku] || 0;
            newStock['Bodega Principal'][sku] = currentStock + orderItem.cantidad;
          });
        }
        return newStock;
      });

      // Registrar movimiento de inventario de entrada
      const newMovements: MovimientoInventario[] = orderData.items.map((item: any) => {
        return {
          id: generateId('mov'),
          timestamp: new Date().toISOString(),
          tipo: 'ENTRADA_COMPRA' as any,
          sku: item.sku,
          nombreProducto: item.nombre,
          bodegaDestino: 'Bodega Principal',
          cantidad: item.cantidad,
          lote: 'RETORNO',
          referenciaId: integLog.id_factura_pos,
          referenciaTipo: 'DEVOLUCION',
          actor: 'Integracion Digital',
          notas: `Reversión por Cancelación Pedido ${integLog.id_pedido_externo}`,
        };
      });
      newMovements.forEach((mov: MovimientoInventario) => addMovimiento(mov));

      // Generar Devolución (Nota de Crédito)
      const newDevolucion: DevolucionPedido = {
        id: generateId('dev'),
        pedidoId: integLog.id_factura_pos,
        pedidoNo: integLog.id_pedido_externo,
        clienteId: orderData.clienteId || 'c-anon',
        clienteNombre: orderData.clienteNombre || 'Consumidor Digital',
        conductorId: 'cond-none',
        conductorNombre: 'No Aplica',
        estado: 'VALIDADA_FINANZAS',
        fechaProgramacion: new Date().toISOString(),
        fechaValidacion: new Date().toISOString(),
        items: orderData.items.map((item: any) => ({
          sku: item.sku,
          nombre: item.nombre,
          cantidadSolicitada: item.cantidad,
          cantidadRecibida: item.cantidad,
          precioUnitarioVenta: item.precioUnitario,
          estadoCalidad: 'APROBADO_REINGRESO',
          estadoFisico: 'APTO_INVENTARIO',
          loteInventario: 'RETORNO',
        })),
      };
      setDevoluciones((prev: DevolucionPedido[]) => [newDevolucion, ...prev]);

      publishDomainEvent(
        'METADATA_CONFIGURED',
        'Integracion Digital',
        `Nota de Crédito emitida y stock devuelto por cancelación del pedido ${integLog.id_pedido_externo}`,
        { logId, pedidoNo: integLog.id_pedido_externo }
      );
    }

    setLogIntegracion((prev: LogIntegracion[]) =>
      prev.map((l: LogIntegracion) => l.id === logId ? { ...l, estado: 'ERROR', mensaje_error: 'Pedido Cancelado por el canal' } : l)
    );
  }, [logIntegracion, setStock, addMovimiento, setDevoluciones, publishDomainEvent, setLogIntegracion, log]);

  // Handler para liberar pedidos retenidos por falta de stock (Aprobación manual RN-07)
  const handleAprobarPedidoManual = useCallback((logId: string, modo: 'parcial' | 'forzar') => {
    log.info('aprobarPedidoManual', { logId, modo });
    const integLog = logIntegracion.find((l) => l.id === logId);
    if (!integLog) return;

    let orderData: any;
    try {
      orderData = JSON.parse(integLog.payload_json);
    } catch (e) {
      return;
    }

    const stockPrincipal = stock['Bodega Principal'] || {};
    const updatedItems = orderData.items.map((item: any) => {
      const currentStock = stockPrincipal[item.sku] || 0;
      if (modo === 'parcial' && currentStock < item.cantidad) {
        return { ...item, cantidad: currentStock }; // ajustar a lo que hay
      }
      return item;
    }).filter((item: any) => item.cantidad > 0);

    if (updatedItems.length === 0) {
      setLogIntegracion((prev: LogIntegracion[]) =>
        prev.map((l: LogIntegracion) => l.id === logId ? { ...l, estado: 'ERROR', mensaje_error: 'Aprobación parcial resultó en 0 items' } : l)
      );
      return;
    }

    const totalCalculado = updatedItems.reduce((sum: number, i: any) => sum + (i.cantidad * i.precioUnitario), 0);
    const subtotalCalculado = totalCalculado;

    // Actualizar JSON y cambiar estado a PENDIENTE para que el worker lo procese con los nuevos datos
    const updatedPayload = {
      ...orderData,
      items: updatedItems,
      total: totalCalculado,
      subtotal: subtotalCalculado,
      signature: 'VALID_CRYPTO_SIGNATURE',
    };

    setLogIntegracion((prev: LogIntegracion[]) =>
      prev.map((l: LogIntegracion) => l.id === logId ? {
        ...l,
        estado: 'PENDIENTE',
        payload_json: JSON.stringify(updatedPayload),
        mensaje_error: modo === 'forzar' ? 'Venta forzada sin stock suficiente' : 'Aprobado con stock parcial',
      } : l)
    );
    
    if (modo === 'forzar') {
      setStock((prev: Record<string, Record<string, number>>) => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = { ...newStock['Bodega Principal'] };
          updatedItems.forEach((orderItem: any) => {
            const sku = orderItem.sku;
            const currentStock = newStock['Bodega Principal'][sku] || 0;
            newStock['Bodega Principal'][sku] = currentStock + orderItem.cantidad;
          });
        }
        return newStock;
      });
    }
  }, [logIntegracion, stock, setLogIntegracion, setStock, log]);

  return {
    handleCancelarPedidoDigital,
    handleAprobarPedidoManual,
  };
}
