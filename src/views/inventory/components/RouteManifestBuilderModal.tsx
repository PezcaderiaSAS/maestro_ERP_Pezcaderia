import React, { useState, useMemo } from 'react';
import { 
  X, Truck, MapPin, Package, Check, Calendar, AlertCircle, 
  ChevronRight, Hash, DollarSign, Scale, User, Phone
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Pedido } from '../../../types/orders.types';
import { deliveryRouteService, DeliveryRouteRecord } from '../../../services/deliveryRouteService';
import { CreateRouteManifest } from '../../../../packages/validation-schemas/src/deliveryRoute.schema';

interface RouteManifestBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidosDisponibles: Pedido[];
  getClientName: (clienteId: string) => string;
  getClientAddress: (clienteId: string) => string;
  onManifestCreated: (manifest: DeliveryRouteRecord) => void;
}

const CONDUCTORES_PREDETERMINADOS = [
  { id: 'cond-01', nombre: 'Carlos Mendoza', telefono: '3104567890', placa: 'WOP-482', vehiculo: 'Furgón Refrigerado Thermo King' },
  { id: 'cond-02', nombre: 'Andrés Gómez', telefono: '3209876543', placa: 'SKL-913', vehiculo: 'Camión Isotérmico 3.5T' },
  { id: 'cond-03', nombre: 'Jhonatan Rivas', telefono: '3151122334', placa: 'MVZ-504', vehiculo: 'Furgón Mediano Frío' },
];

const ZONAS_PREDETERMINADAS = [
  'Ruta Norte - Restaurantes & Hoteles',
  'Ruta Chapinero / Zona G - Gastronomía',
  'Ruta Sur & Abastos - Mayoristas',
  'Ruta Occidente - Salitre & Aeropuerto',
  'Ruta Express - Domicilios Urgentes',
];

export const RouteManifestBuilderModal: React.FC<RouteManifestBuilderModalProps> = ({
  isOpen,
  onClose,
  pedidosDisponibles,
  getClientName,
  getClientAddress,
  onManifestCreated,
}) => {
  const [selectedConductorId, setSelectedConductorId] = useState<string>('cond-01');
  const [conductorNombre, setConductorNombre] = useState<string>(CONDUCTORES_PREDETERMINADOS[0].nombre);
  const [conductorTelefono, setConductorTelefono] = useState<string>(CONDUCTORES_PREDETERMINADOS[0].telefono);
  const [vehiculoPlaca, setVehiculoPlaca] = useState<string>(CONDUCTORES_PREDETERMINADOS[0].placa);
  const [vehiculoTipo, setVehiculoTipo] = useState<string>(CONDUCTORES_PREDETERMINADOS[0].vehiculo);
  const [zonaRuta, setZonaRuta] = useState<string>(ZONAS_PREDETERMINADAS[0]);
  const [observaciones, setObservaciones] = useState<string>('');
  
  // Pedidos seleccionados (IDs)
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectConductorPreset = (cId: string) => {
    setSelectedConductorId(cId);
    const cond = CONDUCTORES_PREDETERMINADOS.find((c) => c.id === cId);
    if (cond) {
      setConductorNombre(cond.nombre);
      setConductorTelefono(cond.telefono);
      setVehiculoPlaca(cond.placa);
      setVehiculoTipo(cond.vehiculo);
    }
  };

  const toggleSelectPedido = (id: string) => {
    setSelectedPedidoIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const selectAllPedidos = () => {
    if (selectedPedidoIds.length === pedidosFiltrados.length) {
      setSelectedPedidoIds([]);
    } else {
      setSelectedPedidoIds(pedidosFiltrados.map((p) => p.id));
    }
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidosDisponibles.filter((p) => {
      const q = searchTerm.toLowerCase();
      const numMatch = p.numeroPedido.toLowerCase().includes(q);
      const cliMatch = getClientName(p.clienteId).toLowerCase().includes(q);
      return numMatch || cliMatch;
    });
  }, [pedidosDisponibles, searchTerm, getClientName]);

  // Totales de la selección
  const statsSeleccion = useMemo(() => {
    const seleccionados = pedidosDisponibles.filter((p) => selectedPedidoIds.includes(p.id));
    const totalDinero = seleccionados.reduce((acc, p) => acc + (p.totalFinal || 0), 0);
    const totalItems = seleccionados.reduce((acc, p) => acc + (p.lineas?.length || 0), 0);
    const totalPesoKg = seleccionados.reduce((acc, p) => {
      const pesoPedido = p.lineas?.reduce((subAcc, item) => subAcc + (Number(item.pesoReal || item.pesoEstimado || item.cantidadSolicitada) || 0), 0) || 0;
      return acc + pesoPedido;
    }, 0);
    return {
      cantidad: seleccionados.length,
      totalDinero,
      totalItems,
      totalPesoKg: Math.round(totalPesoKg * 100) / 100,
    };
  }, [pedidosDisponibles, selectedPedidoIds]);

  const handleCrearManifiesto = () => {
    if (selectedPedidoIds.length === 0) {
      Swal.fire({
        title: 'Sin pedidos seleccionados',
        text: 'Debes seleccionar al menos un pedido listo para consolidar en la ruta.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    if (!vehiculoPlaca.trim() || !conductorNombre.trim() || !zonaRuta.trim()) {
      Swal.fire({
        title: 'Datos Incompletos',
        text: 'Por favor diligencia conductor, placa y zona de la ruta.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    const payload: CreateRouteManifest = {
      conductorId: selectedConductorId || 'cond-custom',
      conductorNombre,
      conductorTelefono: conductorTelefono || undefined,
      vehiculoPlaca: vehiculoPlaca.trim().toUpperCase(),
      vehiculoTipo,
      zonaRuta,
      pedidosIds: selectedPedidoIds,
      observaciones: observaciones.trim() || undefined,
    };

    // Mapeo detallado de pedidos para el servicio
    const pedidosDetallados = pedidosDisponibles
      .filter((p) => selectedPedidoIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        numeroPedido: p.numeroPedido,
        clienteId: p.clienteId,
        clienteNombre: getClientName(p.clienteId),
        clienteDireccion: getClientAddress(p.clienteId),
        clienteTelefono: '',
        totalNeto: p.totalFinal || 0,
        formaPago: p.formaPago === 'CREDITO' ? 'CREDITO' : 'EFECTIVO',
        items: p.lineas?.map((l) => ({
          sku: l.productoId,
          nombre: l.productoId,
          cantidad: l.pesoReal || l.pesoEstimado || l.cantidadSolicitada,
          precioUnitario: l.precioPactado,
        })) || [],
      }));

    const result = deliveryRouteService.crearManifiestoRuta(payload, pedidosDetallados);

    if (result.success && result.data) {
      Swal.fire({
        title: '¡Manifiesto de Ruta Creado!',
        html: `Se ha generado el manifiesto <b>${result.data.numeroManifiesto}</b> con <b>${result.data.totalPedidos}</b> pedidos asignados a <b>${conductorNombre}</b>.<br/><br/>La ruta queda planificada y lista para iniciar su despacho.`,
        icon: 'success',
        confirmButtonColor: '#10B981',
      });
      onManifestCreated(result.data);
      onClose();
    } else {
      Swal.fire({
        title: 'Error al Planificar Ruta',
        text: result.error || 'Ocurrió un error inesperado al procesar la ruta.',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con estética Rico UI Glassmorphism */}
        <div className="p-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Logística & Distribución B2B
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Planificador de Manifiesto de Ruta
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Fila 1: Selección de Conductor, Vehículo y Ruta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Conductor */}
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  Conductor Asignado
                </label>
                <span className="text-[11px] text-indigo-400 font-medium">Predeterminados</span>
              </div>
              <select
                value={selectedConductorId}
                onChange={(e) => handleSelectConductorPreset(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {CONDUCTORES_PREDETERMINADOS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.placa})
                  </option>
                ))}
                <option value="cond-custom">+ Conductor Personalizado / Tercero</option>
              </select>

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={conductorNombre}
                  onChange={(e) => setConductorNombre(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Celular / Teléfono"
                    value={conductorTelefono}
                    onChange={(e) => setConductorTelefono(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Vehículo */}
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Vehículo de Entrega
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400">Placa Vehicular</label>
                  <input
                    type="text"
                    placeholder="Ej. WOP-482"
                    value={vehiculoPlaca}
                    onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
                    className="w-full font-mono font-bold tracking-widest text-emerald-400 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Tipo / Especificación de Frío</label>
                  <input
                    type="text"
                    placeholder="Ej. Furgón Refrigerado 0 a 4°C"
                    value={vehiculoTipo}
                    onChange={(e) => setVehiculoTipo(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Zona / Ruta & Observaciones */}
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                Zona Geográfica & Despacho
              </label>
              <select
                value={zonaRuta}
                onChange={(e) => setZonaRuta(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                {ZONAS_PREDETERMINADAS.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              <div>
                <input
                  type="text"
                  placeholder="Observaciones de ruta (opcional)"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen Dinámico (KPIs de Carga) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Pedidos en Ruta</span>
                <span className="text-xl font-bold text-white">{statsSeleccion.cantidad}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Recaudo Estimado</span>
                <span className="text-xl font-bold text-emerald-400">
                  ${statsSeleccion.totalDinero.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Peso Estimado</span>
                <span className="text-xl font-bold text-sky-400">{statsSeleccion.totalPesoKg} Kg</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Líneas / Ítems</span>
                <span className="text-xl font-bold text-amber-400">{statsSeleccion.totalItems}</span>
              </div>
            </div>
          </div>

          {/* Tabla / Lista de Selección de Pedidos */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Pedidos Disponibles para Despacho ({pedidosFiltrados.length})
                </h3>
                <button
                  type="button"
                  onClick={selectAllPedidos}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
                >
                  {selectedPedidoIds.length === pedidosFiltrados.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Buscar por cliente o # pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            {pedidosFiltrados.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-white/5 text-slate-400 text-sm">
                No hay pedidos en estado "LISTO" que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {pedidosFiltrados.map((pedido) => {
                  const isSelected = selectedPedidoIds.includes(pedido.id);
                  const clienteNombre = getClientName(pedido.clienteId);
                  const direccion = getClientAddress(pedido.clienteId);

                  return (
                    <div
                      key={pedido.id}
                      onClick={() => toggleSelectPedido(pedido.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 select-none ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/30 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">
                              #{pedido.numeroPedido}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-300">
                              {pedido.jornada || 'AM'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate mt-0.5">
                            {clienteNombre}
                          </h4>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            {direccion || 'Sin dirección registrada'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-300">
                            <span>{pedido.lineas?.length || 0} ítems</span>
                            <span className="text-emerald-400 font-bold">
                              ${(pedido.totalFinal || 0).toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-6 bg-slate-950/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            <span>Al confirmar se consolidará el manifiesto de ruta y se programarán los despachos.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCrearManifiesto}
              disabled={selectedPedidoIds.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:from-blue-500 hover:to-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Generar Manifiesto de Ruta ({selectedPedidoIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
