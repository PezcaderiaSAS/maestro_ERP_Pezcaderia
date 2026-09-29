import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Truck, Thermometer, CheckCircle2, Clock, MapPin, Phone, 
  AlertTriangle, ShieldCheck, ChevronRight, Navigation, RefreshCw, 
  CheckSquare, Square, DollarSign, Smartphone, FileText, Flame
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
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    if (temperaturaCarga > 4.0) {
      Swal.fire({
        title: '¡Alerta de Cadena de Frío!',
        html: `La temperatura registrada (<b>${temperaturaCarga}°C</b>) excede el estándar de refrigeración para productos de mar frescos (0°C a 4°C).<br/><br/>¿Confirmas que el equipo de frío está encendido y operando?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Continuar Despacho',
        cancelButtonText: 'Revisar Termo-King',
        confirmButtonColor: '#F59E0B',
      }).then((res) => {
        if (res.isConfirmed) procesarCheckinCarga();
      });
      return;
    }

    procesarCheckinCarga();
  };

  const procesarCheckinCarga = () => {
    const payload: CheckinRouteLoad = {
      manifiestoId: manifiesto.id,
      temperaturaSalidaCelsius: temperaturaCarga,
      pedidosConfirmados: pedidosVerificados,
      observacionesCarga: observacionesCarga.trim() || undefined,
    };

    const res = deliveryRouteService.confirmarCheckinCarga(payload);
    if (res.success && res.data) {
      setManifiesto(res.data);
      onManifestUpdated(res.data);
      Swal.fire({
        title: '¡Ruta Iniciada!',
        html: `Carga verificada a <b>${temperaturaCarga}°C</b>.<br/>El cronómetro de ruta y registro de tiempos ha comenzado.`,
        icon: 'success',
        confirmButtonColor: '#10B981',
      });
    } else {
      Swal.fire({
        title: 'Error de Check-in',
        text: res.error || 'No se pudo iniciar la ruta.',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
    }
  };

  // Registrar Llegada en Puerta del Cliente
  const handleLlegadaEnSitio = (pedido: DeliveryOrderItem) => {
    const res = deliveryRouteService.registrarLlegadaEnSitio({
      manifiestoId: manifiesto.id,
      pedidoId: pedido.pedidoId,
      horaLlegada: new Date().toISOString(),
    });

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
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Reportar Incidencia / Novedad en Ruta
  const handleReportarIncidencia = () => {
    if (!descIncidencia.trim()) {
      Swal.fire({
        title: 'Descripción Requerida',
        text: 'Por favor describe brevemente qué ocurrió.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
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

    const res = deliveryRouteService.registrarIncidenciaRuta(payload);
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
        confirmButtonColor: '#3B82F6',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        {/* Header Móvil Táctil */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Portal Repartidor Móvil
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {manifiesto.vehiculoPlaca}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">
                {manifiesto.conductorNombre}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Novedad</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Progreso y Datos Clave */}
        <div className="bg-slate-950/60 border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400 font-medium">Entregas de la Ruta</span>
              <span className="text-indigo-400 font-bold">
                {pedidosEntregadosCount} de {manifiesto.pedidos.length} ({progresoPorcentaje}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progresoPorcentaje}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Temperatura Frío</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                (manifiesto.temperaturaSalidaCelsius ?? 0) <= 4
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {manifiesto.temperaturaSalidaCelsius !== undefined
                ? `${manifiesto.temperaturaSalidaCelsius}°C`
                : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* Contenido Dinámico */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* PASO 1: Si la carga aún no está verificada en bodega */}
          {!manifiesto.cargaVerificadaEnBodega ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Paso 1: Verificación de Carga & Frío
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Confirma que cada pedido fue cargado en el furgón e ingresa la temperatura de termo-cámara.
                </p>

                {/* Termómetro de Salida */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Thermometer className="w-5 h-5 text-sky-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Temperatura del Furgón</span>
                      <span className="text-[10px] text-slate-400">Rango óptimo perecedero: 0°C a 4°C</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="-25"
                      max="15"
                      value={temperaturaCarga}
                      onChange={(e) => setTemperaturaCarga(Number(e.target.value))}
                      className="w-20 text-center font-mono font-bold text-sm bg-slate-900 border border-white/10 rounded-lg py-1.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-400">°C</span>
                  </div>
                </div>

                {/* Lista de Pedidos a Confirmar */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Pedidos a bordo:</span>
                    <button
                      type="button"
                      onClick={selectAllCarga}
                      className="text-indigo-400 font-semibold"
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
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-950/40 border-indigo-500/60'
                              : 'bg-slate-800/40 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-indigo-400">
                              {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">#{p.numeroPedido} • {p.clienteNombre}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                {p.clienteDireccion}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400">
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
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all"
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
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Paradas de la Ruta ({manifiesto.pedidos.length})
                </span>
                <span className="text-[11px] text-slate-400">
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
                          ? 'bg-slate-900/40 border-white/5 opacity-80'
                          : yaLlego
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-white/10'
                      }`}
                    >
                      {/* Cabecera de la Parada */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-[11px] font-mono font-bold text-indigo-400">
                              #{pedido.numeroPedido}
                            </span>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {pedido.clienteNombre}
                            </h4>
                          </div>
                        </div>

                        {/* Badge de Estado */}
                        {estaCompletado ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              pedido.estadoEntrega === 'ENTREGADO_TOTAL'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : pedido.estadoEntrega === 'ENTREGADO_PARCIAL'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {pedido.estadoEntrega.replace('_', ' ')}
                          </span>
                        ) : yaLlego ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                            EN PUERTA
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                            EN CAMINO
                          </span>
                        )}
                      </div>

                      {/* Dirección y Jornada */}
                      <div className="space-y-1 my-2 bg-slate-900/50 p-2.5 rounded-xl border border-white/5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{pedido.clienteDireccion}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Jornada: <b className="text-slate-300">{pedido.jornadaRequerida || 'AM'}</b>
                          </span>
                          <span className="font-bold text-emerald-400 font-mono">
                            Cobro: ${(pedido.montoCobradoFinal || pedido.montoPedidoOriginal).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>

                      {/* Botonera Táctil del Repartidor */}
                      {!estaCompletado && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-white/5">
                          {!yaLlego ? (
                            <button
                              type="button"
                              onClick={() => handleLlegadaEnSitio(pedido)}
                              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Llegué a Sitio</span>
                            </button>
                          ) : (
                            <div className="py-2.5 px-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-400 font-bold text-xs flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>En Sitio ({pedido.tiempoTransitoMinutos || 1} min viaje)</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedPedidoEntrega(pedido)}
                            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Entregar & Cobrar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal de Reporte de Incidencias en Ruta */}
        {isIncidentModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Reportar Novedad en Ruta
                  </h3>
                </div>
                <button
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Pedido Relacionado (Opcional)</label>
                <select
                  value={pedidoIncidenciaId}
                  onChange={(e) => setPedidoIncidenciaId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
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
                <label className="text-xs text-slate-400 block mb-1">Tipo de Eventualidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_INCIDENCIA.map((inc) => (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => setTipoIncidencia(inc.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                        tipoIncidencia === inc.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{inc.icon}</span>
                      <span className="truncate">{inc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Detalle / Observaciones *</label>
                <textarea
                  rows={3}
                  placeholder="Explica qué ocurrió..."
                  value={descIncidencia}
                  onChange={(e) => setDescIncidencia(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReportarIncidencia}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
                >
                  Enviar Novedad
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
