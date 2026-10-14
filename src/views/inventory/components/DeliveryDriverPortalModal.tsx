import React, { useState, useEffect } from 'react';
import { 
  X, Truck, Thermometer, CheckCircle2, Clock, MapPin, Phone, 
  AlertTriangle, ShieldCheck, Navigation, 
  CheckSquare, Square, DollarSign, Wifi, WifiOff, RefreshCw, 
  Flag, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  deliveryRouteService, 
  DeliveryRouteRecord, 
  DeliveryOrderItem 
} from '../../../services/deliveryRouteService';
import { DeliveryExecutionModal } from './DeliveryExecutionModal';
import { 
  CheckinRouteLoad, 
  RouteIncident, 
  TipoIncidenciaRuta 
} from '../../../../packages/validation-schemas/src/deliveryRoute.schema';
import { useDeliveryOutbox } from '../../../hooks/useDeliveryOutbox';

interface DeliveryDriverPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifiesto: DeliveryRouteRecord;
  onManifestUpdated: (updated: DeliveryRouteRecord) => void;
}

const TIPOS_INCIDENCIA: Array<{ id: TipoIncidenciaRuta; label: string; icon: string }> = [
  { id: 'TRAFICO_BLOQUEO', label: 'Tráfico denso / Vía cerrada', icon: '🚦' },
  { id: 'CLIENTE_APLAZA_HORA', label: 'Cliente pide aplazar hora', icon: '⏳' },
  { id: 'DEMORA_MUELLE_RECEPCION', label: 'Demora en muelle de recibo', icon: '🏢' },
  { id: 'DIRECCION_ERRONEA', label: 'Dirección errónea o inaccesible', icon: '📍' },
  { id: 'FALLA_MECANICA', label: 'Avería mecánica / Vehículo', icon: '🔧' },
  { id: 'OTRO', label: 'Otra eventualidad de ruta', icon: '⚠️' },
];

export const DeliveryDriverPortalModal: React.FC<DeliveryDriverPortalModalProps> = ({
  isOpen,
  onClose,
  manifiesto: initialManifest,
  onManifestUpdated,
}) => {
  const [manifiesto, setManifiesto] = useState<DeliveryRouteRecord>(initialManifest);
  const [selectedPedidoEntrega, setSelectedPedidoEntrega] = useState<DeliveryOrderItem | null>(null);
  
  // Hook de Outbox Offline
  const { 
    isOnline, 
    pendingCount, 
    enqueueDeliveryAction, 
    syncOutbox 
  } = useDeliveryOutbox(manifiesto.id);

  // Checklist de carga en bodega
  const [temperaturaCarga, setTemperaturaCarga] = useState<number>(
    initialManifest.temperaturaSalidaCelsius ?? 2.5
  );
  const [pedidosVerificados, setPedidosVerificados] = useState<string[]>(
    initialManifest.cargaVerificadaEnBodega
      ? initialManifest.pedidos.map((p) => p.pedidoId)
      : []
  );
  const [observacionesCarga, setObservacionesCarga] = useState<string>('');

  // Modal rápido de incidencias
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);
  const [pedidoIncidenciaId, setPedidoIncidenciaId] = useState<string>('');
  const [tipoIncidencia, setTipoIncidencia] = useState<TipoIncidenciaRuta>('TRAFICO_BLOQUEO');
  const [descIncidencia, setDescIncidencia] = useState<string>('');

  // Modal de Finalizar Recorrido
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  const [odometroRetorno, setOdometroRetorno] = useState<number>(
    (initialManifest.kilometrajeInicial ?? 0) + 15
  );
  const [temperaturaRetorno, setTemperaturaRetorno] = useState<number>(2.8);
  const [obsRetorno, setObsRetorno] = useState<string>('');

  useEffect(() => {
    setManifiesto(initialManifest);
  }, [initialManifest]);

  if (!isOpen) return null;

  // Toggle de verificación de pedido a bordo
  const toggleVerificarPedido = (pedidoId: string) => {
    setPedidosVerificados((prev) =>
      prev.includes(pedidoId) ? prev.filter((pId) => pId !== pedidoId) : [...prev, pedidoId]
    );
  };

  const selectAllCarga = () => {
    if (pedidosVerificados.length === manifiesto.pedidos.length) {
      setPedidosVerificados([]);
    } else {
      setPedidosVerificados(manifiesto.pedidos.map((p) => p.pedidoId));
    }
  };

  // Confirmar Checklist de Carga e Iniciar Ruta
  const handleConfirmarCargaSalida = () => {
    if (pedidosVerificados.length === 0) {
      Swal.fire({
        title: 'Verificación Requerida',
        text: 'Debes confirmar al menos un pedido cargado a bordo del vehículo.',
        icon: 'warning',
        confirmButtonColor: '#2563EB',
      });
      return;
    }

    if (temperaturaCarga > 4.0) {
      Swal.fire({
        title: '¡Alerta de Cadena de Frío!',
        html: `La temperatura registrada (<b>${temperaturaCarga}°C</b>) excede el estándar de refrigeración para productos de mar frescos (0°C a 4°C).<br/><br/>¿Confirmas que el termo-king está encendido y operando?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Salir a Ruta',
        cancelButtonText: 'Revisar Furgón',
        confirmButtonColor: '#D97706',
      }).then((res) => {
        if (res.isConfirmed) procesarCheckinCarga();
      });
      return;
    }

    procesarCheckinCarga();
  };

  const procesarCheckinCarga = async () => {
    const payload: CheckinRouteLoad = {
      manifiestoId: manifiesto.id,
      temperaturaSalidaCelsius: temperaturaCarga,
      pedidosConfirmados: pedidosVerificados,
      observacionesCarga: observacionesCarga.trim() || undefined,
    };

    const res = await enqueueDeliveryAction('CHECKIN_CARGA', payload);
    if (res.success) {
      const updated = deliveryRouteService.obtenerManifiestoPorId(manifiesto.id);
      if (updated) {
        setManifiesto(updated);
        onManifestUpdated(updated);
      }
      Swal.fire({
        title: '¡Ruta Iniciada!',
        html: `Carga verificada a <b>${temperaturaCarga}°C</b>.<br/>El cronómetro de ruta y registro de tiempos ha comenzado.`,
        icon: 'success',
        confirmButtonColor: '#059669',
      });
    } else {
      Swal.fire({
        title: 'Error de Check-in',
        text: res.error || 'No se pudo iniciar la ruta.',
        icon: 'error',
        confirmButtonColor: '#E11D48',
      });
    }
  };

  // Registrar Llegada en Puerta del Cliente
  const handleLlegadaEnSitio = async (pedido: DeliveryOrderItem) => {
    const payload = {
      manifiestoId: manifiesto.id,
      pedidoId: pedido.pedidoId,
      horaLlegada: new Date().toISOString(),
    };

    const res = await enqueueDeliveryAction('LLEGADA_SITIO', payload);
    if (res.success) {
      const updated = deliveryRouteService.obtenerManifiestoPorId(manifiesto.id);
      if (updated) {
        setManifiesto(updated);
        onManifestUpdated(updated);
      }
      Swal.fire({
        title: '¡Llegada en Sitio Registrada!',
        text: `Has llegado donde ${pedido.clienteNombre}. Tiempo de tránsito registrado. Ahora puedes proceder con la entrega física.`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
      });
    }
  };

  // Reportar Incidencia / Novedad en Ruta
  const handleReportarIncidencia = async () => {
    if (!descIncidencia.trim()) {
      Swal.fire({
        title: 'Descripción Requerida',
        text: 'Por favor describe brevemente qué ocurrió.',
        icon: 'warning',
        confirmButtonColor: '#2563EB',
      });
      return;
    }

    const payload: RouteIncident = {
      manifiestoId: manifiesto.id,
      pedidoId: pedidoIncidenciaId || undefined,
      tipoIncidencia,
      descripcion: descIncidencia.trim(),
      horaReporte: new Date().toISOString(),
    };

    const res = await enqueueDeliveryAction('INCIDENCIA', payload);
    if (res.success) {
      const updated = deliveryRouteService.obtenerManifiestoPorId(manifiesto.id);
      if (updated) {
        setManifiesto(updated);
        onManifestUpdated(updated);
      }
      setIsIncidentModalOpen(false);
      setDescIncidencia('');
      setPedidoIncidenciaId('');
      Swal.fire({
        title: 'Novedad Notificada',
        text: 'La eventualidad ha sido registrada en tiempo real en la bitácora de auditoría de la empresa.',
        icon: 'info',
        confirmButtonColor: '#2563EB',
      });
    }
  };

  // Finalizar Recorrido y Retorno a Bodega
  const handleFinalizarRecorrido = async () => {
    if (odometroRetorno < (manifiesto.kilometrajeInicial ?? 0)) {
      Swal.fire({
        title: 'Odómetro Invalido',
        text: `El kilometraje final (${odometroRetorno} km) no puede ser menor al inicial (${manifiesto.kilometrajeInicial} km).`,
        icon: 'error',
        confirmButtonColor: '#E11D48',
      });
      return;
    }

    const payload = {
      manifiestoId: manifiesto.id,
      kilometrajeFinal: odometroRetorno,
      temperaturaRetornoCelsius: temperaturaRetorno,
      observacionesRetorno: obsRetorno.trim() || undefined,
    };

    const res = await enqueueDeliveryAction('FINALIZAR_RUTA', payload);
    if (res.success) {
      const updated = deliveryRouteService.obtenerManifiestoPorId(manifiesto.id);
      if (updated) {
        setManifiesto(updated);
        onManifestUpdated(updated);
      }
      setIsFinishModalOpen(false);
      Swal.fire({
        title: '¡Recorrido Finalizado!',
        html: `Retorno a base registrado con <b>${odometroRetorno} km</b>.<br/>El manifiesto pasó a <b>EN LIQUIDACIÓN</b> para cuadre en Tesorería.`,
        icon: 'success',
        confirmButtonColor: '#059669',
      });
    } else {
      Swal.fire({
        title: 'Error al Finalizar',
        text: res.error || 'No se pudo finalizar el recorrido.',
        icon: 'error',
        confirmButtonColor: '#E11D48',
      });
    }
  };

  const handleDeliverySaved = () => {
    const updated = deliveryRouteService.obtenerManifiestoPorId(manifiesto.id);
    if (updated) {
      setManifiesto(updated);
      onManifestUpdated(updated);
    }
    setSelectedPedidoEntrega(null);
  };

  // Progreso de entregas
  const pedidosEntregadosCount = manifiesto.pedidos.filter(
    (p) => p.estadoEntrega !== 'PENDIENTE'
  ).length;
  const progresoPorcentaje = Math.round(
    (pedidosEntregadosCount / (manifiesto.pedidos.length || 1)) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[95vh]">
        {/* Header Móvil Táctil en Modo Claro */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                  Repartidor Móvil
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {manifiesto.vehiculoPlaca}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5 truncate max-w-[200px]">
                {manifiesto.conductorNombre}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              aria-label="Reportar novedad"
              className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs flex items-center gap-1 hover:bg-amber-100 transition-colors min-h-[44px]"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Novedad</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar portal de chofer"
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Estado de Conectividad y Progreso */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-700" /> : <WifiOff className="w-3.5 h-3.5 text-purple-700" />}
              {isOnline ? 'Conectado a Central' : `Offline (${pendingCount} en cola)`}
            </span>
            {pendingCount > 0 && isOnline && (
              <button
                onClick={syncOutbox}
                title="Sincronizar eventos pendientes"
                className="p-1 text-slate-600 hover:text-blue-600"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-700 font-medium">Frío:</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                (manifiesto.temperaturaSalidaCelsius ?? 0) <= 4
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {manifiesto.temperaturaSalidaCelsius !== undefined
                ? `${manifiesto.temperaturaSalidaCelsius}°C`
                : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* Barra de Progreso de Entregas */}
        <div className="bg-white border-b border-slate-200 px-4 py-2">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-700 font-medium">Progreso del Manifiesto</span>
            <span className="text-blue-700 font-bold">
              {pedidosEntregadosCount} de {manifiesto.pedidos.length} paradas ({progresoPorcentaje}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progresoPorcentaje}%` }}
            />
          </div>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          {/* PASO 1: Si la carga aún no está verificada en bodega */}
          {!manifiesto.cargaVerificadaEnBodega ? (
            <div className="space-y-4">
              <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Paso 1: Verificación de Carga & Frío
                  </h3>
                </div>
                <p className="text-xs text-slate-700">
                  Confirma que cada pedido fue cargado en el furgón e ingresa la temperatura de termo-cámara.
                </p>

                {/* Termómetro de Salida */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Thermometer className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Temperatura del Furgón</span>
                      <span className="text-[10px] text-slate-700">Rango perecedero óptimo: 0°C a 4°C</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="-25"
                      max="15"
                      value={temperaturaCarga}
                      onChange={(e) => setTemperaturaCarga(Number(e.target.value))}
                      className="w-18 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                    <span className="text-xs font-bold text-slate-700">°C</span>
                  </div>
                </div>

                {/* Lista de Pedidos a Confirmar */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Pedidos a bordo ({manifiesto.pedidos.length}):</span>
                    <button
                      type="button"
                      onClick={selectAllCarga}
                      className="text-blue-600 hover:text-blue-700 font-semibold p-1"
                    >
                      {pedidosVerificados.length === manifiesto.pedidos.length
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {manifiesto.pedidos.map((p) => {
                      const isChecked = pedidosVerificados.includes(p.pedidoId);
                      return (
                        <div
                          key={p.pedidoId}
                          onClick={() => toggleVerificarPedido(p.pedidoId)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all min-h-[48px] ${
                            isChecked
                              ? 'bg-blue-50 border-blue-400'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-blue-600">
                              {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">#{p.numeroPedido} • {p.clienteNombre}</div>
                              <div className="text-[11px] text-slate-700 truncate max-w-[200px]">
                                {p.clienteDireccion}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-700">
                            ${p.montoPedidoOriginal.toLocaleString('es-CO')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleConfirmarCargaSalida}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[48px]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar Carga & Salir a Ruta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PASO 2: Hoja de Ruta Táctil para Repartidor */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Paradas de Entrega ({manifiesto.pedidos.length})
                </span>
                <span className="text-[11px] text-slate-700">
                  Salida: {manifiesto.salidaEn ? new Date(manifiesto.salidaEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                </span>
              </div>

              <div className="space-y-3">
                {manifiesto.pedidos.map((pedido, index) => {
                  const estaCompletado = pedido.estadoEntrega !== 'PENDIENTE';
                  const yaLlego = Boolean(pedido.horaLlegadaEnSitio);

                  return (
                    <div
                      key={pedido.pedidoId}
                      className={`p-4 rounded-2xl border transition-all ${
                        estaCompletado
                          ? 'bg-white border-slate-200 opacity-85'
                          : yaLlego
                          ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Cabecera de la Parada */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-[11px] font-mono font-bold text-blue-700">
                              #{pedido.numeroPedido}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {pedido.clienteNombre}
                            </h4>
                          </div>
                        </div>

                        {/* Badge de Estado */}
                        {estaCompletado ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              pedido.estadoEntrega === 'ENTREGADO_TOTAL'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : pedido.estadoEntrega === 'ENTREGADO_PARCIAL'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {pedido.estadoEntrega.replace('_', ' ')}
                          </span>
                        ) : yaLlego ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
                            EN PUERTA
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            EN CAMINO
                          </span>
                        )}
                      </div>

                      {/* Dirección, Teléfono y Jornada */}
                      <div className="space-y-1.5 my-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{pedido.clienteDireccion}</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.clienteDireccion)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 shrink-0 flex items-center gap-0.5"
                          >
                            <span>Mapa</span>
                            <Navigation className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1 border-t border-slate-200">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Jornada: <b className="text-slate-900">{pedido.jornadaRequerida || 'AM'}</b>
                          </span>
                          <span className="font-bold text-emerald-700 font-mono">
                            Cobro: ${(pedido.montoCobradoFinal || pedido.montoPedidoOriginal).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>

                      {/* Botonera Táctil del Repartidor */}
                      {!estaCompletado ? (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200">
                          {!yaLlego ? (
                            <button
                              type="button"
                              onClick={() => handleLlegadaEnSitio(pedido)}
                              className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 min-h-[44px]"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Llegué a Sitio</span>
                            </button>
                          ) : (
                            <div className="py-3 px-3 rounded-xl bg-blue-100 border border-blue-300 text-blue-800 font-bold text-xs flex items-center justify-center gap-1 min-h-[44px]">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>En Sitio ({pedido.tiempoTransitoMinutos || 1} min)</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedPedidoEntrega(pedido)}
                            className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all min-h-[44px]"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Entregar & Cobrar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 text-right">
                          <span className="text-[11px] text-slate-700">
                            Entregado a las: {pedido.horaEntregaEfectiva ? new Date(pedido.horaEntregaEfectiva).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Completado'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón de Finalizar Recorrido y Retorno a Base */}
              {manifiesto.estado === 'EN_RUTA' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFinishModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all min-h-[48px]"
                  >
                    <Flag className="w-5 h-5 text-amber-400" />
                    Finalizar Recorrido / Retorno a Bodega
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Reporte de Incidencias en Ruta */}
        {isIncidentModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
            <div className="bg-white border border-amber-300 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Reportar Novedad en Ruta
                  </h3>
                </div>
                <button
                  onClick={() => setIsIncidentModalOpen(false)}
                  aria-label="Cerrar modal de novedad"
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">Pedido Relacionado (Opcional)</label>
                <select
                  value={pedidoIncidenciaId}
                  onChange={(e) => setPedidoIncidenciaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="">Incidencia General de la Ruta / Vía</option>
                  {manifiesto.pedidos.map((p) => (
                    <option key={p.pedidoId} value={p.pedidoId}>
                      #{p.numeroPedido} - {p.clienteNombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">Tipo de Eventualidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_INCIDENCIA.map((inc) => (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => setTipoIncidencia(inc.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 min-h-[44px] ${
                        tipoIncidencia === inc.id
                          ? 'bg-amber-100 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{inc.icon}</span>
                      <span className="truncate">{inc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">Detalle / Observaciones *</label>
                <textarea
                  rows={3}
                  placeholder="Explica qué ocurrió..."
                  value={descIncidencia}
                  onChange={(e) => setDescIncidencia(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReportarIncidencia}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors min-h-[44px]"
                >
                  Enviar Novedad
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Finalizar Recorrido */}
        {isFinishModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Finalizar Recorrido y Retorno a Bodega
                  </h3>
                </div>
                <button
                  onClick={() => setIsFinishModalOpen(false)}
                  aria-label="Cerrar modal de finalizar recorrido"
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-700">
                Registra el odómetro final del camión y temperatura de retorno para pasar la ruta a <b>EN LIQUIDACIÓN</b> en Tesorería.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kilometraje Final de Retorno (km) *
                  </label>
                  <input
                    type="number"
                    value={odometroRetorno}
                    onChange={(e) => setOdometroRetorno(Number(e.target.value))}
                    className="w-full font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 min-h-[44px]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Inicial: {manifiesto.kilometrajeInicial ?? 0} km
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Temperatura de Retorno (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperaturaRetorno}
                    onChange={(e) => setTemperaturaRetorno(Number(e.target.value))}
                    className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Observaciones de Retorno
                  </label>
                  <input
                    type="text"
                    placeholder="Novedades de tráfico o vehículo (opcional)"
                    value={obsRetorno}
                    onChange={(e) => setObsRetorno(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFinishModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinalizarRecorrido}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors min-h-[44px]"
                >
                  Confirmar Retorno
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Registro de Entrega y Cobro */}
        {selectedPedidoEntrega && (
          <DeliveryExecutionModal
            isOpen={Boolean(selectedPedidoEntrega)}
            onClose={() => setSelectedPedidoEntrega(null)}
            manifiesto={manifiesto}
            pedidoItem={selectedPedidoEntrega}
            onDeliveryRecorded={handleDeliverySaved}
          />
        )}
      </div>
    </div>
  );
};
