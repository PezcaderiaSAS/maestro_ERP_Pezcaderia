import React, { useMemo, useState } from 'react';
import {
  Truck,
  CheckCircle,
  PackageSearch,
  Package,
  AlertCircle,
  FileText,
  Scale,
  Scissors,
  QrCode,
  Thermometer,
  Layers,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import { b2bService } from '../services/b2bService';
import { cashService } from '../services/cashService';
import { b2bDispatchService } from '../services/b2bDispatchService';
import { EstadoPedido } from '../types/orders.types';
import { useOrderStore } from '../store/useOrderStore.ts';
import { useEventStore } from '../store/useEventStore.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useInventoryStore } from '../store/useInventoryStore.ts';
import { useMovementStore } from '../store/useMovementStore.ts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { WeightPackingModal } from './inventory/components/WeightPackingModal';
import { WmsRemisionModal } from './inventory/components/WmsRemisionModal';

interface OrderKanbanViewProps {
  onEditOrder: (quote: any) => void;
}

type ColumnId =
  | 'pausados'
  | 'creados'
  | 'en_fileteo'
  | 'en_pesaje'
  | 'listos'
  | 'en_despacho'
  | 'entregados'
  | 'facturados'
  | 'pagados';

export default function OrderKanbanView({ onEditOrder }: OrderKanbanViewProps) {
  const { ventas, setVentas, updateVenta, quotations, setQuotations, updateQuotation } = useOrderStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const userRole = useAppStore((s) => s.userRole);
  const { products, stock, setStock } = useInventoryStore();
  const { addMovimiento } = useMovementStore();

  // Pestañas activas: 'bodega' vs 'despacho'
  const [activeTab, setActiveTab] = useState<'bodega' | 'despacho'>('bodega');

  // Modales interactivos
  const [packingModalItem, setPackingModalItem] = useState<{
    orderId: string;
    item: any;
  } | null>(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any | null>(null);

  const combinedOrders = useMemo(() => {
    const map = new Map<string, any>();
    (quotations || []).forEach((q: any) => {
      if (q && q.id) {
        map.set(q.id, { ...q, _source: 'quotation' });
      }
    });
    (ventas || []).forEach((v: any) => {
      if (v && v.id) {
        const existing = map.get(v.id);
        map.set(v.id, { ...existing, ...v, _source: 'venta' });
      }
    });
    return Array.from(map.values());
  }, [ventas, quotations]);

  // Definición de Columnas para ambas pestañas
  const bodegaColumns: { id: ColumnId; title: string; states: string[]; color: string; icon: React.ReactNode }[] = [
    {
      id: 'pausados',
      title: 'Pausados',
      states: ['PAUSADO', 'PAUSADO_POR_CREDITO', 'Pausado', 'pausado', 'Pausado por Crédito'],
      color: '#FEE2E2',
      icon: <AlertCircle size={18} color="#EF4444" />
    },
    {
      id: 'creados',
      title: 'Por Alistar',
      states: ['CREADO', 'Creado', 'creado', 'Approved', 'Approved (Pendiente Alistamiento)', 'Sent', 'Draft', 'Aprobado'],
      color: '#F1F5F9',
      icon: <PackageSearch size={18} color="#64748B" />
    },
    {
      id: 'en_fileteo',
      title: 'En Fileteo & Corte',
      states: ['EN_FILETEO', 'EN_ALISTAMIENTO', 'En Fileteo', 'Alistamiento'],
      color: '#E0F2FE',
      icon: <Scissors size={18} color="#0284C7" />
    },
    {
      id: 'en_pesaje',
      title: 'Pesaje & Packing Báscula',
      states: ['EN_PESAJE', 'En Pesaje', 'Pesaje'],
      color: '#FEF3C7',
      icon: <Scale size={18} color="#D97706" />
    },
  ];

  const despachoColumns: { id: ColumnId; title: string; states: string[]; color: string; icon: React.ReactNode }[] = [
    {
      id: 'listos',
      title: 'Listos para Despacho',
      states: ['LISTO', 'Listo', 'listo'],
      color: '#FEF3C7',
      icon: <Package size={18} color="#D97706" />
    },
    {
      id: 'en_despacho',
      title: 'En Ruta / Despachados',
      states: ['EN_DESPACHO', 'En Despacho', 'en_despacho'],
      color: '#EDE9FE',
      icon: <Truck size={18} color="#8B5CF6" />
    },
    {
      id: 'entregados',
      title: 'Entregados en Destino',
      states: ['ENTREGADO', 'Entregado', 'entregado'],
      color: '#DCFCE7',
      icon: <CheckCircle size={18} color="#059669" />
    },
    {
      id: 'facturados',
      title: 'Facturados',
      states: ['FACTURADO', 'Facturado', 'facturado'],
      color: '#E0F2FE',
      icon: <FileText size={18} color="#0284C7" />
    },
    {
      id: 'pagados',
      title: 'Pagados / Finalizados',
      states: ['PAGADO', 'Pagado', 'pagado', 'ANULADO', 'Anulado', 'anulado', 'Sold', 'Vendida'],
      color: '#F3F4F6',
      icon: <CheckCircle size={18} color="#9CA3AF" />
    },
  ];

  const currentColumns = activeTab === 'bodega' ? bodegaColumns : despachoColumns;

  const persistOrderUpdate = (quoteId: string, updatedFields: Record<string, any>) => {
    if (updatedFields.estado) {
      b2bService.cambiarEstadoPedido(quoteId, updatedFields.estado);
    }
    if (quotations && quotations.some((q: any) => q.id === quoteId)) {
      updateQuotation(quoteId, updatedFields);
    } else if (setQuotations) {
      setQuotations((prev: any[]) => prev.map((q: any) => q.id === quoteId ? { ...q, ...updatedFields } : q));
    }
    if (ventas && ventas.some((v: any) => v.id === quoteId)) {
      updateVenta(quoteId, updatedFields);
    } else if (setVentas) {
      setVentas((prev: any[]) => prev.map((v: any) => v.id === quoteId ? { ...v, ...updatedFields } : v));
    }
  };

  const handleDragStart = (e: React.DragEvent, quoteId: string) => {
    e.dataTransfer.setData('quoteId', quoteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    const quoteId = e.dataTransfer.getData('quoteId');
    if (!quoteId) return;

    if (targetColumnId === 'pausados') {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'Los pedidos solo entran en pausa automáticamente por reglas de negocio.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    let nuevoEstado: EstadoPedido = 'CREADO';
    if (targetColumnId === 'creados') nuevoEstado = 'CREADO';
    if (targetColumnId === 'en_fileteo') nuevoEstado = 'EN_FILETEO';
    if (targetColumnId === 'en_pesaje') nuevoEstado = 'EN_PESAJE';
    if (targetColumnId === 'listos') nuevoEstado = 'LISTO';
    if (targetColumnId === 'en_despacho') nuevoEstado = 'EN_DESPACHO';
    if (targetColumnId === 'entregados') nuevoEstado = 'ENTREGADO';
    if (targetColumnId === 'facturados') nuevoEstado = 'FACTURADO';
    if (targetColumnId === 'pagados') nuevoEstado = 'PAGADO';

    const currentQuote = combinedOrders.find(q => q.id === quoteId);
    if (!currentQuote) return;

    // Si se arrastra a pesaje, abrimos el modal de báscula para la primera línea que requiera pesaje
    if (targetColumnId === 'en_pesaje') {
      const lines = currentQuote.lineas || currentQuote.items || [];
      const unweighedLine = lines.find((l: any) => !l.pesoReal) || lines[0];
      if (unweighedLine) {
        setPackingModalItem({
          orderId: currentQuote.id,
          item: {
            lineaPedidoId: unweighedLine.id || unweighedLine.productoId || 'line-1',
            productoId: unweighedLine.productoId || unweighedLine.id,
            productoNombre: unweighedLine.nombre || unweighedLine.nombreProducto || 'Producto Pesquero',
            sku: unweighedLine.sku,
            modalidad: unweighedLine.modalidadVenta || (unweighedLine.piezasSolicitadas ? 'CATCH_WEIGHT_PIEZAS' : 'PESO_DIRECTO'),
            pesoNominalKg: Number(unweighedLine.cantidadSolicitada || unweighedLine.pesoEstimado || 2.0),
            piezasSolicitadas: unweighedLine.piezasSolicitadas,
            calibreMinGramos: unweighedLine.calibreMinGramos,
            calibreMaxGramos: unweighedLine.calibreMaxGramos,
            precioUnitarioPactado: Number(unweighedLine.precioPactado || unweighedLine.precio || 30000),
            loteSugerido: unweighedLine.loteSeleccionado,
          }
        });
        return;
      }
    }

    // Si se arrastra a despacho, abrimos el modal de remisión WMS
    if (targetColumnId === 'en_despacho') {
      setDispatchModalOrder(currentQuote);
      return;
    }

    try {
      persistOrderUpdate(quoteId, { estado: nuevoEstado, fechaActualizacionKanban: new Date().toISOString() });
      publishEvent('QUOTE_STATUS_CHANGED', userRole, `Pedido actualizado a estado ${nuevoEstado}`, { quoteId, nuevoEstado });
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Error interno', text: e.message, confirmButtonColor: 'var(--primary-color)' });
    }
  };

  // Manejador tras confirmar pesaje en báscula
  const handleWeighingConfirmed = async (data: {
    lineaPedidoId: string;
    pesoRealKg: number;
    piezasAlistadas?: number;
    subtotalAjustado: number;
    temperaturaC: number;
    loteFefo: string;
    observaciones?: string;
  }) => {
    if (!packingModalItem) return;

    const order = combinedOrders.find(o => o.id === packingModalItem.orderId);
    if (!order) return;

    const lines = [...(order.lineas || order.items || [])];
    const lineIndex = lines.findIndex((l: any) => (l.id || l.productoId) === data.lineaPedidoId);

    if (lineIndex >= 0) {
      lines[lineIndex] = {
        ...lines[lineIndex],
        pesoReal: data.pesoRealKg,
        piezasAlistadas: data.piezasAlistadas,
        totalLinea: data.subtotalAjustado,
        loteSeleccionado: data.loteFefo,
        temperaturaC: data.temperaturaC,
        estadoLinea: 'COMPLETO'
      };
    }

    const nuevoTotal = lines.reduce((acc, l: any) => acc + (l.totalLinea || (l.pesoReal || l.cantidadSolicitada || 1) * (l.precioPactado || 0)), 0);

    const todasPesadas = lines.every((l: any) => !!l.pesoReal);
    const nuevoEstado: EstadoPedido = todasPesadas ? 'LISTO' : 'EN_PESAJE';

    persistOrderUpdate(order.id, {
      lineas: lines,
      items: lines,
      totalFinal: nuevoTotal,
      subtotal: nuevoTotal,
      estado: nuevoEstado,
      temperaturaCava: data.temperaturaC,
      fechaActualizacionKanban: new Date().toISOString()
    });

    Swal.fire({
      icon: 'success',
      title: 'Pesaje Conciliado',
      text: `Se registraron ${data.pesoRealKg} kg en báscula (Subtotal: $${data.subtotalAjustado.toLocaleString('es-CO')}).`,
      timer: 2000,
      showConfirmButton: false
    });

    setPackingModalItem(null);
  };

  // Manejador tras confirmar despacho en remisión WMS
  const handleDispatchConfirmed = (remision: any) => {
    if (!dispatchModalOrder) return;

    try {
      const newStock = { ...stock };
      const bodegaId = dispatchModalOrder.bodegaId || 'Bodega Principal';
      if (!newStock[bodegaId]) newStock[bodegaId] = {};

      const lines = dispatchModalOrder.lineas || dispatchModalOrder.items || [];
      lines.forEach((linea: any) => {
        const producto = products.find((p: any) => p.id === (linea.productoId || linea.id) || p.sku === linea.sku);
        if (!producto) return;

        const sku = producto.sku || linea.sku;
        const cantidadADescontar = linea.pesoReal || linea.cantidadAlistada || linea.cantidadSolicitada || 1;

        if (newStock[bodegaId][sku] === undefined) newStock[bodegaId][sku] = 0;
        newStock[bodegaId][sku] -= cantidadADescontar;

        addMovimiento({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          tipo: 'VENTA',
          sku: sku,
          nombreProducto: producto.nombre,
          bodegaOrigen: bodegaId,
          cantidad: cantidadADescontar,
          lote: linea.loteSeleccionado || remision.items?.[0]?.loteFefo || 'DESPACHO',
          referenciaId: dispatchModalOrder.id,
          referenciaTipo: 'DESPACHO_B2B',
          actor: userRole,
          notas: `Despacho WMS Remisión ${remision.numeroRemision} (Conductor: ${remision.transportistaNombre})`
        });
      });

      setStock(newStock);

      persistOrderUpdate(dispatchModalOrder.id, {
        estado: 'EN_DESPACHO',
        inventarioDescontado: true,
        remisionWmsNumero: remision.numeroRemision,
        remisionTokenQr: remision.tokenQr,
        temperaturaSalida: remision.temperaturaSalidaC,
        conductor: remision.transportistaNombre,
        placaVehiculo: remision.placaVehiculo,
        fechaActualizacionKanban: new Date().toISOString()
      });

      publishEvent('QUOTE_STATUS_CHANGED', userRole, `Pedido despachado con remisión ${remision.numeroRemision}`, { quoteId: dispatchModalOrder.id, nuevoEstado: 'EN_DESPACHO' });
    } catch (e: any) {
      console.error('Error al actualizar stock de despacho:', e);
    }
  };

  // Contadores para pestañas
  const countBodega = combinedOrders.filter(o =>
    ['PAUSADO', 'PAUSADO_POR_CREDITO', 'CREADO', 'Approved', 'Sent', 'Draft', 'EN_FILETEO', 'EN_ALISTAMIENTO', 'EN_PESAJE'].includes(o.estado)
  ).length;

  const countDespacho = combinedOrders.filter(o =>
    ['LISTO', 'EN_DESPACHO', 'ENTREGADO', 'FACTURADO', 'PAGADO'].includes(o.estado)
  ).length;

  return (
    <div className="animate-fade-in flex flex-col h-full p-6 space-y-6">
      
      {/* Header y Selector de Pestañas Bifásicas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Picking, Packing & Despachos B2B</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Catch Weight & QR
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestión integral de pesaje en báscula, trazabilidad FEFO, cadena de frío y remisiones WMS.
          </p>
        </div>

        {/* Botones de Pestaña Dual */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('bodega')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bodega'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>1. Logística de Bodega (Fileteo & Pesaje)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'bodega' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {countBodega}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('despacho')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'despacho'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>2. Despachos & Remisiones WMS</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'despacho' ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {countDespacho}
            </span>
          </button>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="flex gap-5 flex-1 overflow-x-auto pb-4">
        {currentColumns.map(column => {
          const now = new Date();
          const cutoffTime = new Date(now);
          cutoffTime.setHours(6, 0, 0, 0);
          if (now.getHours() < 6) cutoffTime.setDate(cutoffTime.getDate() - 1);

          const columnQuotes = combinedOrders.filter(q => {
            if (!column.states.includes(q.estado)) return false;
            if (['PAGADO', 'Pagado', 'pagado', 'ANULADO', 'Anulado', 'anulado'].includes(q.estado)) {
              const updateTimeStr = (q as any).fechaActualizacionKanban || q.fecha;
              if (!updateTimeStr) return false;
              const updateTime = new Date(updateTimeStr);
              if (isNaN(updateTime.getTime())) return true;
              if (updateTime < cutoffTime) return false;
            }
            return true;
          });

          return (
            <Card
              glass
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex-shrink-0 w-80 flex flex-col p-0 bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl"
            >
              {/* Encabezado de Columna */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-white border border-white/5">
                    {column.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{column.title}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 border border-white/10 text-slate-300 font-mono">
                  {columnQuotes.length}
                </span>
              </div>

              {/* Lista de Tarjetas */}
              <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
                {columnQuotes.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-12 italic">
                    Sin pedidos en esta estación
                  </div>
                ) : (
                  columnQuotes.map(quote => {
                    const lines = quote.lineas || quote.items || [];
                    const hasCatchWeight = lines.some((l: any) => l.modalidadVenta === 'CATCH_WEIGHT_PIEZAS' || l.piezasSolicitadas);
                    const totalKg = lines.reduce((acc: number, l: any) => acc + (Number(l.pesoReal || l.cantidadAlistada || l.cantidadSolicitada) || 0), 0);
                    const hasWeight = lines.some((l: any) => !!l.pesoReal);

                    return (
                      <div
                        key={quote.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, quote.id)}
                        onClick={() => onEditOrder(quote)}
                        className="p-4 rounded-xl bg-slate-950/80 border border-white/10 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer flex flex-col gap-2.5 group"
                      >
                        {/* Cabecera Tarjeta */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-mono font-bold text-cyan-400">
                              {quote.numeroPedido || quote.numeroCotizacion || quote.id}
                            </div>
                            <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {quote.clientName || quote.clienteNombre || quote.clienteId || 'Cliente B2B'}
                            </div>
                          </div>

                          {['PAUSADO', 'Pausado', 'pausado'].includes(quote.estado) && (
                            <Badge variant="danger" className="text-[10px]">
                              <AlertCircle size={10} className="mr-1" /> Variación &gt; 10%
                            </Badge>
                          )}
                          {['PAUSADO_POR_CREDITO', 'Pausado por Crédito'].includes(quote.estado) && (
                            <Badge variant="danger" className="text-[10px]">
                              <AlertCircle size={10} className="mr-1" /> Cupo Lleno
                            </Badge>
                          )}
                        </div>

                        {/* Metadatos de Productos y Catch Weight */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5 flex items-center gap-1">
                            <FileText size={12} className="text-slate-400" />
                            {lines.length} ítems
                          </span>

                          {hasCatchWeight && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Layers size={12} />
                              Catch Weight
                            </span>
                          )}

                          {quote.temperaturaCava && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono">
                              <Thermometer size={12} />
                              {quote.temperaturaCava}°C
                            </span>
                          )}
                        </div>

                        {/* Estado de Pesaje / Botón de Acción Rápida */}
                        {activeTab === 'bodega' && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-mono">
                              {hasWeight ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <Scale size={12} /> {totalKg.toFixed(2)} KG pesados
                                </span>
                              ) : (
                                <span className="text-slate-500">Pendiente báscula</span>
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const unweighed = lines.find((l: any) => !l.pesoReal) || lines[0];
                                if (unweighed) {
                                  setPackingModalItem({
                                    orderId: quote.id,
                                    item: {
                                      lineaPedidoId: unweighed.id || unweighed.productoId || 'line-1',
                                      productoId: unweighed.productoId || unweighed.id,
                                      productoNombre: unweighed.nombre || unweighed.nombreProducto || 'Producto Pesquero',
                                      sku: unweighed.sku,
                                      modalidad: unweighed.modalidadVenta || (unweighed.piezasSolicitadas ? 'CATCH_WEIGHT_PIEZAS' : 'PESO_DIRECTO'),
                                      pesoNominalKg: Number(unweighed.cantidadSolicitada || unweighed.pesoEstimado || 2.0),
                                      piezasSolicitadas: unweighed.piezasSolicitadas,
                                      calibreMinGramos: unweighed.calibreMinGramos,
                                      calibreMaxGramos: unweighed.calibreMaxGramos,
                                      precioUnitarioPactado: Number(unweighed.precioPactado || unweighed.precio || 30000),
                                      loteSugerido: unweighed.loteSeleccionado,
                                    }
                                  });
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all flex items-center gap-1"
                            >
                              <Scale size={12} /> Pesar
                            </button>
                          </div>
                        )}

                        {activeTab === 'despacho' && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            {quote.remisionWmsNumero ? (
                              <span className="text-[11px] font-mono font-semibold text-purple-400 flex items-center gap-1">
                                <QrCode size={12} /> {quote.remisionWmsNumero}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDispatchModalOrder(quote);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all flex items-center gap-1"
                              >
                                <Truck size={12} /> Despachar WMS
                              </button>
                            )}

                            <span className="text-xs font-mono font-bold text-white">
                              ${(quote.totalFinal || quote.total || 0).toLocaleString('es-CO')}
                            </span>
                          </div>
                        )}

                        {/* Footer con Fecha y Total si es Bodega */}
                        {activeTab === 'bodega' && (
                          <div className="pt-1.5 flex justify-between items-center text-xs">
                            <span className="text-[11px] text-slate-500">{quote.fecha}</span>
                            <span className="font-mono font-bold text-white">
                              ${(quote.totalFinal || quote.total || 0).toLocaleString('es-CO')}
                            </span>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de Báscula y Conciliación Catch Weight */}
      {packingModalItem && (
        <WeightPackingModal
          isOpen={!!packingModalItem}
          onClose={() => setPackingModalItem(null)}
          item={packingModalItem.item}
          onConfirm={handleWeighingConfirmed}
        />
      )}

      {/* Modal de Emisión de Remisión WMS con QR */}
      {dispatchModalOrder && (
        <WmsRemisionModal
          isOpen={!!dispatchModalOrder}
          onClose={() => setDispatchModalOrder(null)}
          pedido={dispatchModalOrder}
          onDispatchConfirmed={handleDispatchConfirmed}
        />
      )}

    </div>
  );
}
