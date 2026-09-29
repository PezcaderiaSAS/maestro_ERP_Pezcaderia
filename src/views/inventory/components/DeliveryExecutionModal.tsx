import React, { useState, useMemo } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, XCircle, CreditCard, DollarSign, 
  Smartphone, FileText, ArrowRight, ShieldAlert, Sparkles, UserCheck, 
  ChevronDown, Plus, Trash2, Scale
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  deliveryRouteService, 
  DeliveryOrderItem, 
  DeliveryRouteRecord 
} from '../../../services/deliveryRouteService';
import { 
  RegisterDeliveryExecution, 
  RouteReturnItem 
} from '../../../../packages/validation-schemas/src/deliveryRoute.schema';

interface DeliveryExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifiesto: DeliveryRouteRecord;
  pedidoItem: DeliveryOrderItem;
  onDeliveryRecorded: () => void;
}

const MOTIVOS_DEVOLUCION = [
  { value: 'CADENA_FRIO_COMPROMETIDA', label: 'Cadena de Frío Comprometida (Temp > 4°C)' },
  { value: 'PRODUCTO_NO_SOLICITADO', label: 'Producto no solicitado / Error de Picking' },
  { value: 'CALIDAD_DEFICIENTE', label: 'Calidad deficiente / No cumple especificación' },
  { value: 'CLIENTE_CANCELO_EN_SITIO', label: 'Cliente canceló el ítem en sitio' },
];

export const DeliveryExecutionModal: React.FC<DeliveryExecutionModalProps> = ({
  isOpen,
  onClose,
  manifiesto,
  pedidoItem,
  onDeliveryRecorded,
}) => {
  const [estadoEntrega, setEstadoEntrega] = useState<'ENTREGADO_TOTAL' | 'ENTREGADO_PARCIAL' | 'NO_ENTREGADO_RECHAZADO'>('ENTREGADO_TOTAL');
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'CREDITO_B2B' | 'MIXTO'>('EFECTIVO');
  
  // Montos
  const [montoEfectivo, setMontoEfectivo] = useState<number>(pedidoItem.montoPedidoOriginal);
  const [montoDigital, setMontoDigital] = useState<number>(0);
  const [bancoDigital, setBancoDigital] = useState<string>('NEQUI');
  const [referenciaDigital, setReferenciaDigital] = useState<string>('');
  
  // Recepción & Firma
  const [recibidoPor, setRecibidoPor] = useState<string>('');
  const [novedadObservaciones, setNovedadObservaciones] = useState<string>('');

  // Devoluciones en sitio
  const [devoluciones, setDevoluciones] = useState<RouteReturnItem[]>([]);
  const [itemDevSKU, setItemDevSKU] = useState<string>(pedidoItem.items?.[0]?.sku || '');
  const [cantidadDev, setCantidadDev] = useState<number>(1);
  const [motivoDev, setMotivoDev] = useState<string>('CALIDAD_DEFICIENTE');

  if (!isOpen) return null;

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
      motivoRechazo: 'CADENA_FRIO',
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

  const handleConfirmarEntrega = () => {
    // Validaciones
    if ((formaPago === 'TRANSFERENCIA_DIGITAL' || formaPago === 'MIXTO') && !referenciaDigital.trim()) {
      Swal.fire({
        title: 'Comprobante Requerido',
        text: 'Para pagos por transferencia digital o mixtos debes registrar el número de comprobante o referencia bancaria.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    if (formaPago === 'MIXTO' && montoEfectivo + montoDigital !== totalCobrarCalculado) {
      Swal.fire({
        title: 'Descuadre en Pago Mixto',
        text: `La suma de efectivo ($${montoEfectivo}) + digital ($${montoDigital}) debe ser exactamente igual al total a cobrar ($${totalCobrarCalculado}).`,
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
      return;
    }

    if (estadoEntrega === 'ENTREGADO_PARCIAL' && devoluciones.length === 0) {
      Swal.fire({
        title: 'Detalle de Devolución Requerido',
        text: 'Al marcar la entrega como PARCIAL debes registrar al menos un ítem devuelto con su motivo.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
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
      firmaClienteUrl: recibidoPor.trim() ? `Recibido por: ${recibidoPor.trim()}` : undefined,
      novedadObservaciones: novedadObservaciones.trim() || undefined,
      devoluciones: devoluciones.length > 0 ? devoluciones : [],
    };

    const res = deliveryRouteService.registrarEntregaPedido(payload);

    if (res.success) {
      Swal.fire({
        title: '¡Entrega Registrada!',
        html: `El pedido <b>#${pedidoItem.numeroPedido}</b> ha sido actualizado a estado <b>${estadoEntrega}</b>.<br/>Recaudo: <b>$${totalCobrarCalculado.toLocaleString('es-CO')}</b> (${formaPago}).`,
        icon: 'success',
        confirmButtonColor: '#10B981',
      });
      onDeliveryRecorded();
      onClose();
    } else {
      Swal.fire({
        title: 'Error al Registrar Entrega',
        text: res.error || 'Ocurrió un error al guardar la entrega.',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Pedido #{pedidoItem.numeroPedido}
              </span>
              <span className="text-xs text-slate-400">Manifiesto {manifiesto.numeroManifiesto}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Registro de Entrega & Recaudo en Sitio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente: <b className="text-slate-200">{pedidoItem.clienteNombre}</b> • {pedidoItem.clienteDireccion}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Fila 1: Selección del Estado de Entrega */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              Resultado de la Entrega
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCambioEstadoEntrega('ENTREGADO_TOTAL')}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  estadoEntrega === 'ENTREGADO_TOTAL'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  estadoEntrega === 'ENTREGADO_TOTAL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Entregado Total</div>
                  <div className="text-[11px] text-slate-400">100% de la mercancía recibida</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCambioEstadoEntrega('ENTREGADO_PARCIAL')}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  estadoEntrega === 'ENTREGADO_PARCIAL'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  estadoEntrega === 'ENTREGADO_PARCIAL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Entrega Parcial</div>
                  <div className="text-[11px] text-slate-400">Con devolución de ítems</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCambioEstadoEntrega('NO_ENTREGADO_RECHAZADO')}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  estadoEntrega === 'NO_ENTREGADO_RECHAZADO'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  estadoEntrega === 'NO_ENTREGADO_RECHAZADO' ? 'bg-rose-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Rechazado en Sitio</div>
                  <div className="text-[11px] text-slate-400">No se entregó ningún ítem</div>
                </div>
              </button>
            </div>
          </div>

          {/* Fila 2: Sección de Devoluciones (Si aplica) */}
          {(estadoEntrega === 'ENTREGADO_PARCIAL' || estadoEntrega === 'NO_ENTREGADO_RECHAZADO') && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                    Protocolo de Devolución en Sitio (Destino: Cuarentena de Calidad)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Descuento Total: -${totalDevolucionesMonto.toLocaleString('es-CO')}
                </span>
              </div>

              {/* Formulario de agregar devolución */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Producto / Ítem</label>
                  <select
                    value={itemDevSKU}
                    onChange={(e) => setItemDevSKU(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
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
                  <label className="text-[11px] text-slate-400 block mb-1">Cantidad / Peso Devuelto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={cantidadDev}
                    onChange={(e) => setCantidadDev(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Motivo del Rechazo</label>
                  <select
                    value={motivoDev}
                    onChange={(e) => setMotivoDev(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
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
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir Devolución
                  </button>
                </div>
              </div>

              {/* Lista de devoluciones añadidas */}
              {devoluciones.length > 0 && (
                <div className="space-y-2">
                  {devoluciones.map((dev, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-amber-500/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{dev.nombre}</span>
                        <span className="text-slate-400">({dev.cantidadDevueltaKg} Kg/Unid)</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                          {dev.motivoRechazo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-400 font-mono">
                          -${dev.montoDescontado.toLocaleString('es-CO')}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarDevolucion(idx)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Medio de Recaudo en Sitio
                </label>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total a Cobrar: </span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    ${totalCobrarCalculado.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo en Mano', icon: DollarSign },
                  { id: 'TRANSFERENCIA_DIGITAL', label: 'Transferencia', icon: Smartphone },
                  { id: 'CREDITO_B2B', label: 'Crédito B2B (Firma)', icon: FileText },
                  { id: 'MIXTO', label: 'Pago Mixto', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = formaPago === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCambioFormaPago(item.id as any)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        isActive
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detalle según forma de pago */}
              {formaPago === 'EFECTIVO' && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    <span className="font-bold text-white block">Efectivo Recibido por Conductor</span>
                    Este dinero entrará en el arqueo para la liquidación final de la ruta.
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    ${montoEfectivo.toLocaleString('es-CO')}
                  </div>
                </div>
              )}

              {formaPago === 'TRANSFERENCIA_DIGITAL' && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Entidad / App</label>
                    <select
                      value={bancoDigital}
                      onChange={(e) => setBancoDigital(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="NEQUI">Nequi</option>
                      <option value="DAVIPLATA">Daviplata</option>
                      <option value="BANCOLOMBIA">Bancolombia QR / Transf</option>
                      <option value="DAVIVIENDA">Davivienda</option>
                      <option value="OTRO">Otro Banco</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      # Comprobante / Referencia Digital <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. C-94820148 ó M93821"
                      value={referenciaDigital}
                      onChange={(e) => setReferenciaDigital(e.target.value)}
                      className="w-full font-mono bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {formaPago === 'CREDITO_B2B' && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-sky-400 shrink-0" />
                  <div className="text-xs text-slate-300">
                    <span className="font-bold text-white block">Venta a Crédito Pactado</span>
                    Se registrará la remisión firmada. No suma al arqueo de efectivo del transportador.
                  </div>
                </div>
              )}

              {formaPago === 'MIXTO' && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Monto en Efectivo ($)</label>
                      <input
                        type="number"
                        value={montoEfectivo}
                        onChange={(e) => setMontoEfectivo(Number(e.target.value))}
                        className="w-full font-mono bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Monto en Transferencia ($)</label>
                      <input
                        type="number"
                        value={montoDigital}
                        onChange={(e) => setMontoDigital(Number(e.target.value))}
                        className="w-full font-mono bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Entidad Digital</label>
                      <select
                        value={bancoDigital}
                        onChange={(e) => setBancoDigital(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="NEQUI">Nequi</option>
                        <option value="DAVIPLATA">Daviplata</option>
                        <option value="BANCOLOMBIA">Bancolombia</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1"># Comprobante Digital *</label>
                      <input
                        type="text"
                        placeholder="Ej. B-382918"
                        value={referenciaDigital}
                        onChange={(e) => setReferenciaDigital(e.target.value)}
                        className="w-full font-mono bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-right font-mono">
                    Total Mixto: ${(montoEfectivo + montoDigital).toLocaleString('es-CO')} / ${totalCobrarCalculado.toLocaleString('es-CO')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fila 4: Firma / Recibido y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nombre de quien Recibe en el Establecimiento
              </label>
              <div className="flex items-center gap-2 bg-slate-800/40 border border-white/10 rounded-xl px-3 py-2">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej. Chef Carlos / Administradora María"
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Novedad / Observaciones de Entrega
              </label>
              <input
                type="text"
                placeholder="Observaciones de acceso o empaque (opcional)"
                value={novedadObservaciones}
                onChange={(e) => setNovedadObservaciones(e.target.value)}
                className="w-full bg-slate-800/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/70 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmarEntrega}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar y Registrar Entrega
          </button>
        </div>
      </div>
    </div>
  );
};
