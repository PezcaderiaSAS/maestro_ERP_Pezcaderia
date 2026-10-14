import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, XCircle, CreditCard, DollarSign, 
  Smartphone, FileText, ShieldAlert, UserCheck, Plus, Trash2, 
  RotateCcw, PenTool, Wifi, WifiOff
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  DeliveryOrderItem, 
  DeliveryRouteRecord 
} from '../../../services/deliveryRouteService';
import { 
  RegisterDeliveryExecution, 
  RouteReturnItem 
} from '../../../../packages/validation-schemas/src/deliveryRoute.schema';
import { useDeliveryOutbox } from '../../../hooks/useDeliveryOutbox';

interface DeliveryExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifiesto: DeliveryRouteRecord;
  pedidoItem: DeliveryOrderItem;
  onDeliveryRecorded: () => void;
}

const MOTIVOS_DEVOLUCION = [
  { value: 'CADENA_FRIO', label: 'Cadena de Frío Comprometida (Temp > 4°C)' },
  { value: 'CALIBRE_INCORRECTO', label: 'Calibre / Tamaño no solicitado' },
  { value: 'CALIDAD_DEFICIENTE', label: 'Calidad deficiente / No conforme' },
  { value: 'CLIENTE_CANCELO_EN_SITIO', label: 'Cliente canceló el ítem en sitio' },
];

export const DeliveryExecutionModal: React.FC<DeliveryExecutionModalProps> = ({
  isOpen,
  onClose,
  manifiesto,
  pedidoItem,
  onDeliveryRecorded,
}) => {
  const { isOnline, enqueueDeliveryAction } = useDeliveryOutbox(manifiesto.id);

  const [estadoEntrega, setEstadoEntrega] = useState<'ENTREGADO_TOTAL' | 'ENTREGADO_PARCIAL' | 'NO_ENTREGADO_RECHAZADO'>('ENTREGADO_TOTAL');
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'CREDITO_B2B' | 'MIXTO'>('EFECTIVO');
  
  // Montos
  const [montoEfectivo, setMontoEfectivo] = useState<number>(pedidoItem.montoPedidoOriginal);
  const [montoDigital, setMontoDigital] = useState<number>(0);
  const [bancoDigital, setBancoDigital] = useState<string>('NEQUI');
  const [referenciaDigital, setReferenciaDigital] = useState<string>('');
  
  // Recepción & Firma
  const [recibidoPor, setRecibidoPor] = useState<string>('');
  const [documentoRecibe, setDocumentoRecibe] = useState<string>('');
  const [novedadObservaciones, setNovedadObservaciones] = useState<string>('');

  // Canvas de Firma
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Devoluciones en sitio
  const [devoluciones, setDevoluciones] = useState<RouteReturnItem[]>([]);
  const [itemDevSKU, setItemDevSKU] = useState<string>(pedidoItem.items?.[0]?.sku || '');
  const [cantidadDev, setCantidadDev] = useState<number>(1);
  const [motivoDev, setMotivoDev] = useState<string>('CADENA_FRIO');

  // Inicialización y limpieza del canvas
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setupCanvas();
      }, 100);
    }
  }, [isOpen]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Total a cobrar considerando devoluciones
  const totalDevolucionesMonto = useMemo(() => {
    return devoluciones.reduce((acc, d) => acc + d.montoDescontado, 0);
  }, [devoluciones]);

  const totalCobrarCalculado = useMemo(() => {
    if (estadoEntrega === 'NO_ENTREGADO_RECHAZADO') return 0;
    const neto = Math.max(0, pedidoItem.montoPedidoOriginal - totalDevolucionesMonto);
    return neto;
  }, [estadoEntrega, pedidoItem.montoPedidoOriginal, totalDevolucionesMonto]);

  // Actualizar montos automáticamente al cambiar estado de entrega o forma de pago
  const handleCambioFormaPago = (nuevaForma: 'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'CREDITO_B2B' | 'MIXTO') => {
    setFormaPago(nuevaForma);
    if (nuevaForma === 'EFECTIVO') {
      setMontoEfectivo(totalCobrarCalculado);
      setMontoDigital(0);
    } else if (nuevaForma === 'TRANSFERENCIA_DIGITAL') {
      setMontoEfectivo(0);
      setMontoDigital(totalCobrarCalculado);
    } else if (nuevaForma === 'CREDITO_B2B') {
      setMontoEfectivo(0);
      setMontoDigital(0);
    } else if (nuevaForma === 'MIXTO') {
      const mitad = Math.round(totalCobrarCalculado / 2);
      setMontoEfectivo(mitad);
      setMontoDigital(totalCobrarCalculado - mitad);
    }
  };

  const handleCambioEstadoEntrega = (nuevoEstado: 'ENTREGADO_TOTAL' | 'ENTREGADO_PARCIAL' | 'NO_ENTREGADO_RECHAZADO') => {
    setEstadoEntrega(nuevoEstado);
    if (nuevoEstado === 'NO_ENTREGADO_RECHAZADO') {
      setMontoEfectivo(0);
      setMontoDigital(0);
    } else {
      if (formaPago === 'EFECTIVO') setMontoEfectivo(totalCobrarCalculado);
      if (formaPago === 'TRANSFERENCIA_DIGITAL') setMontoDigital(totalCobrarCalculado);
    }
  };

  const agregarDevolucion = () => {
    const itemEncontrado = pedidoItem.items?.find((it) => it.sku === itemDevSKU);
    const nombreItem = itemEncontrado?.nombre || itemDevSKU || 'Producto General';
    const precioUnitario = itemEncontrado?.precioUnitario || 10000;
    const montoDesc = Math.round(cantidadDev * precioUnitario);

    const nuevaDev: RouteReturnItem = {
      productoId: itemDevSKU,
      sku: itemDevSKU,
      nombre: nombreItem,
      cantidadDevueltaKg: cantidadDev,
      precioUnitario,
      montoDescontado: montoDesc,
      motivoRechazo: motivoDev as any,
      destinoBodega: 'CUARENTENA_CALIDAD',
    };

    const nuevas = [...devoluciones, nuevaDev];
    setDevoluciones(nuevas);
    
    // Recalcular montos con el nuevo saldo
    const nuevoTotal = Math.max(0, pedidoItem.montoPedidoOriginal - nuevas.reduce((a, b) => a + b.montoDescontado, 0));
    if (formaPago === 'EFECTIVO') setMontoEfectivo(nuevoTotal);
    if (formaPago === 'TRANSFERENCIA_DIGITAL') setMontoDigital(nuevoTotal);
  };

  const eliminarDevolucion = (index: number) => {
    const nuevas = devoluciones.filter((_, i) => i !== index);
    setDevoluciones(nuevas);
    const nuevoTotal = Math.max(0, pedidoItem.montoPedidoOriginal - nuevas.reduce((a, b) => a + b.montoDescontado, 0));
    if (formaPago === 'EFECTIVO') setMontoEfectivo(nuevoTotal);
    if (formaPago === 'TRANSFERENCIA_DIGITAL') setMontoDigital(nuevoTotal);
  };

  const handleConfirmarEntrega = async () => {
    // Validaciones
    if ((formaPago === 'TRANSFERENCIA_DIGITAL' || formaPago === 'MIXTO') && !referenciaDigital.trim()) {
      Swal.fire({
        title: 'Comprobante Requerido',
        text: 'Para pagos por transferencia digital o mixtos debes registrar el número de comprobante o referencia bancaria.',
        icon: 'warning',
        confirmButtonColor: '#2563EB',
      });
      return;
    }

    if (formaPago === 'MIXTO' && montoEfectivo + montoDigital !== totalCobrarCalculado) {
      Swal.fire({
        title: 'Descuadre en Pago Mixto',
        text: `La suma de efectivo ($${montoEfectivo.toLocaleString('es-CO')}) + digital ($${montoDigital.toLocaleString('es-CO')}) debe ser exactamente igual al total a cobrar ($${totalCobrarCalculado.toLocaleString('es-CO')}).`,
        icon: 'error',
        confirmButtonColor: '#E11D48',
      });
      return;
    }

    if (estadoEntrega === 'ENTREGADO_PARCIAL' && devoluciones.length === 0) {
      Swal.fire({
        title: 'Detalle de Devolución Requerido',
        text: 'Al marcar la entrega como PARCIAL debes registrar al menos un ítem devuelto con su motivo.',
        icon: 'warning',
        confirmButtonColor: '#2563EB',
      });
      return;
    }

    // Exportar firma base64 si se dibujó
    let firmaBase64: string | undefined = undefined;
    if (canvasRef.current && hasSignature) {
      try {
        firmaBase64 = canvasRef.current.toDataURL('image/png');
      } catch (e) {
        console.warn('No se pudo exportar firma digital canvas:', e);
      }
    }

    const payload: RegisterDeliveryExecution = {
      manifiestoId: manifiesto.id,
      pedidoId: pedidoItem.pedidoId,
      estadoEntrega,
      formaPago,
      montoOriginal: pedidoItem.montoPedidoOriginal,
      montoCobradoFinal: totalCobrarCalculado,
      montoEfectivo: formaPago === 'CREDITO_B2B' ? 0 : montoEfectivo,
      montoDigital: formaPago === 'CREDITO_B2B' ? 0 : montoDigital,
      referenciaDigital: referenciaDigital ? `${bancoDigital}: ${referenciaDigital.trim()}` : undefined,
      firmaClienteUrl: firmaBase64 || (recibidoPor.trim() ? `Recibido por: ${recibidoPor.trim()}${documentoRecibe ? ` (C.C. ${documentoRecibe.trim()})` : ''}` : undefined),
      novedadObservaciones: novedadObservaciones.trim() || undefined,
      devoluciones: devoluciones.length > 0 ? devoluciones : [],
    };

    // Ejecución resiliente con Outbox
    const result = await enqueueDeliveryAction('REGISTRO_ENTREGA', payload);

    if (result.success) {
      if (result.queuedOffline) {
        Swal.fire({
          title: '¡Entrega Guardada Offline!',
          html: `Sin conexión a Internet. El pedido <b>#${pedidoItem.numeroPedido}</b> ha sido registrado en la cola <b>Outbox Local</b> y se sincronizará automáticamente al recuperar señal.`,
          icon: 'info',
          confirmButtonColor: '#7C3AED',
        });
      } else {
        Swal.fire({
          title: '¡Entrega Registrada!',
          html: `El pedido <b>#${pedidoItem.numeroPedido}</b> ha sido actualizado a estado <b>${estadoEntrega.replace('_', ' ')}</b>.<br/>Recaudo: <b>$${totalCobrarCalculado.toLocaleString('es-CO')}</b> (${formaPago}).`,
          icon: 'success',
          confirmButtonColor: '#059669',
        });
      }
      onDeliveryRecorded();
      onClose();
    } else {
      Swal.fire({
        title: 'Error al Registrar Entrega',
        text: result.error || 'Ocurrió un error al guardar la entrega.',
        icon: 'error',
        confirmButtonColor: '#E11D48',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header en Modo Claro */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Pedido #{pedidoItem.numeroPedido}
              </span>
              <span className="text-xs text-slate-700">Manifiesto {manifiesto.numeroManifiesto}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'En Línea' : 'Offline'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Registro de Entrega & Recaudo en Sitio
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              Cliente: <b className="text-slate-900">{pedidoItem.clienteNombre}</b> • {pedidoItem.clienteDireccion}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          {/* Fila 1: Selección del Estado de Entrega */}
          <div>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Resultado de la Entrega
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleCambioEstadoEntrega('ENTREGADO_TOTAL')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all min-h-[48px] ${
                  estadoEntrega === 'ENTREGADO_TOTAL'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  estadoEntrega === 'ENTREGADO_TOTAL' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">Entregado Total</div>
                  <div className="text-[11px] text-slate-700">100% recibido</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCambioEstadoEntrega('ENTREGADO_PARCIAL')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all min-h-[48px] ${
                  estadoEntrega === 'ENTREGADO_PARCIAL'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  estadoEntrega === 'ENTREGADO_PARCIAL' ? 'bg-amber-500 text-white font-bold' : 'bg-slate-200 text-slate-700'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">Entrega Parcial</div>
                  <div className="text-[11px] text-slate-700">Con devolución</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCambioEstadoEntrega('NO_ENTREGADO_RECHAZADO')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all min-h-[48px] ${
                  estadoEntrega === 'NO_ENTREGADO_RECHAZADO'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-sm ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  estadoEntrega === 'NO_ENTREGADO_RECHAZADO' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">Rechazado en Sitio</div>
                  <div className="text-[11px] text-slate-700">Ningún ítem recibido</div>
                </div>
              </button>
            </div>
          </div>

          {/* Fila 2: Sección de Devoluciones (Si aplica) */}
          {(estadoEntrega === 'ENTREGADO_PARCIAL' || estadoEntrega === 'NO_ENTREGADO_RECHAZADO') && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Protocolo de Devolución en Sitio (Cuarentena de Calidad)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-800">
                  Descuento Total: -${totalDevolucionesMonto.toLocaleString('es-CO')}
                </span>
              </div>

              {/* Formulario de agregar devolución */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-amber-200">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">Producto / Ítem</label>
                  <select
                    value={itemDevSKU}
                    onChange={(e) => setItemDevSKU(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-900"
                  >
                    {pedidoItem.items && pedidoItem.items.length > 0 ? (
                      pedidoItem.items.map((it) => (
                        <option key={it.sku} value={it.sku}>
                          {it.nombre} ({it.cantidad} Kg)
                        </option>
                      ))
                    ) : (
                      <option value="GENERAL">Producto Genérico del Pedido</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">Cantidad Devuelta</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={cantidadDev}
                    onChange={(e) => setCantidadDev(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">Motivo del Rechazo</label>
                  <select
                    value={motivoDev}
                    onChange={(e) => setMotivoDev(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-900"
                  >
                    {MOTIVOS_DEVOLUCION.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarDevolucion}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir Devolución
                  </button>
                </div>
              </div>

              {/* Lista de devoluciones añadidas */}
              {devoluciones.length > 0 && (
                <div className="space-y-1.5">
                  {devoluciones.map((dev, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dev.nombre}</span>
                        <span className="text-slate-700">({dev.cantidadDevueltaKg} Kg)</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                          {dev.motivoRechazo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-800 font-mono">
                          -${dev.montoDescontado.toLocaleString('es-CO')}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarDevolucion(idx)}
                          aria-label="Eliminar devolución"
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fila 3: Medios de Pago y Cobro */}
          {estadoEntrega !== 'NO_ENTREGADO_RECHAZADO' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Medio de Recaudo en Sitio
                </label>
                <div className="text-right">
                  <span className="text-xs text-slate-700">Total a Cobrar: </span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">
                    ${totalCobrarCalculado.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: DollarSign },
                  { id: 'TRANSFERENCIA_DIGITAL', label: 'Transferencia', icon: Smartphone },
                  { id: 'CREDITO_B2B', label: 'Crédito B2B', icon: FileText },
                  { id: 'MIXTO', label: 'Pago Mixto', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = formaPago === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCambioFormaPago(item.id as any)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all min-h-[56px] ${
                        isActive
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detalle según forma de pago */}
              {formaPago === 'EFECTIVO' && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block">Efectivo Recibido por Conductor</span>
                    Este dinero entrará en el arqueo para la liquidación final de la ruta.
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    ${montoEfectivo.toLocaleString('es-CO')}
                  </div>
                </div>
              )}

              {formaPago === 'TRANSFERENCIA_DIGITAL' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">Entidad / App</label>
                    <select
                      value={bancoDigital}
                      onChange={(e) => setBancoDigital(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="NEQUI">Nequi</option>
                      <option value="DAVIPLATA">Daviplata</option>
                      <option value="BANCOLOMBIA">Bancolombia QR / Transf</option>
                      <option value="DAVIVIENDA">Davivienda</option>
                      <option value="OTRO">Otro Banco</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">
                      # Comprobante / Referencia Digital <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. C-94820148 ó M93821"
                      value={referenciaDigital}
                      onChange={(e) => setReferenciaDigital(e.target.value)}
                      className="w-full font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {formaPago === 'CREDITO_B2B' && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block">Venta a Crédito B2B</span>
                    Se registrará la remisión con firma digital del cliente. No suma al arqueo de efectivo del conductor.
                  </div>
                </div>
              )}

              {formaPago === 'MIXTO' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-700 font-bold block mb-1">Monto en Efectivo ($)</label>
                      <input
                        type="number"
                        value={montoEfectivo}
                        onChange={(e) => setMontoEfectivo(Number(e.target.value))}
                        className="w-full font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 font-bold block mb-1">Monto en Transferencia ($)</label>
                      <input
                        type="number"
                        value={montoDigital}
                        onChange={(e) => setMontoDigital(Number(e.target.value))}
                        className="w-full font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-700 font-bold block mb-1">Entidad Digital</label>
                      <select
                        value={bancoDigital}
                        onChange={(e) => setBancoDigital(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                      >
                        <option value="NEQUI">Nequi</option>
                        <option value="DAVIPLATA">Daviplata</option>
                        <option value="BANCOLOMBIA">Bancolombia</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-700 font-bold block mb-1"># Comprobante Digital *</label>
                      <input
                        type="text"
                        placeholder="Ej. B-382918"
                        value={referenciaDigital}
                        onChange={(e) => setReferenciaDigital(e.target.value)}
                        className="w-full font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-right font-mono text-slate-700">
                    Total Mixto: ${(montoEfectivo + montoDigital).toLocaleString('es-CO')} / ${totalCobrarCalculado.toLocaleString('es-CO')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fila 4: Firma Digital Táctil Canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-blue-600" />
                Firma Digital del Cliente en Sitio
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar Firma
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden touch-none h-36">
              <canvas
                ref={canvasRef}
                width={600}
                height={144}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                  <PenTool className="w-5 h-5 mb-1 opacity-50" />
                  <span>Firme con el dedo dentro del recuadro</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre de quien Recibe en el Establecimiento *
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Ej. Chef Carlos Pérez"
                    value={recibidoPor}
                    onChange={(e) => setRecibidoPor(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cédula / Documento de Identidad
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1.098.765.432"
                  value={documentoRecibe}
                  onChange={(e) => setDocumentoRecibe(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Novedad / Observaciones de Entrega
              </label>
              <input
                type="text"
                placeholder="Observaciones de acceso o empaque (opcional)"
                value={novedadObservaciones}
                onChange={(e) => setNovedadObservaciones(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmarEntrega}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar y Registrar Entrega
          </button>
        </div>
      </div>
    </div>
  );
};
