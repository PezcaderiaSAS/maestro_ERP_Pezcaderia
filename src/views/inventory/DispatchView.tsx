import React, { useState, useMemo } from 'react';
import { 
  Truck, Package, Clock, MapPin, CheckCircle, Search, User, 
  Plus, CheckSquare, Smartphone, Award, Fuel, CheckCheck, 
  ArrowRight, ShieldCheck, AlertTriangle, Calendar, DollarSign
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useClientStore } from '../../store/useClientStore';
import { useAppStore } from '../../store/useAppStore';
import { Pedido } from '../../types/orders.types';
import { deliveryRouteService, DeliveryRouteRecord } from '../../services/deliveryRouteService';
import { RouteManifestBuilderModal } from './components/RouteManifestBuilderModal';
import { DeliveryDriverPortalModal } from './components/DeliveryDriverPortalModal';
import { RouteSettlementModal } from './components/RouteSettlementModal';
import { DeliveryGovernanceTab } from './components/DeliveryGovernanceTab';

type TabView = 'PEDIDOS_LISTOS' | 'RUTAS_ACTIVAS' | 'RUTAS_LIQUIDADAS' | 'GOBERNANZA_OTIF';

export const DispatchView: React.FC = () => {
  const { ventas } = useOrderStore();
  const { getClienteById } = useClientStore();
  const userRole = useAppStore((s) => s.userRole);

  const [activeTab, setActiveTab] = useState<TabView>('PEDIDOS_LISTOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activePortalManifest, setActivePortalManifest] = useState<DeliveryRouteRecord | null>(null);
  const [activeSettlementManifest, setActiveSettlementManifest] = useState<DeliveryRouteRecord | null>(null);

  // Lista reactiva de manifiestos
  const [manifiestos, setManifiestos] = useState<DeliveryRouteRecord[]>(() =>
    deliveryRouteService.obtenerManifiestos()
  );

  const recargarManifiestos = () => {
    setManifiestos(deliveryRouteService.obtenerManifiestos());
  };

  // Pedidos listos (no incluidos en rutas activas)
  const pedidosEnRutaIds = useMemo(() => {
    const ids = new Set<string>();
    manifiestos
      .filter((m) => m.estado === 'PLANIFICADA' || m.estado === 'EN_RUTA')
      .forEach((m) => {
        m.pedidos.forEach((p) => ids.add(p.pedidoId));
      });
    return ids;
  }, [manifiestos]);

  const pedidosListos = useMemo(() => {
    return ventas
      .filter((o) => o.estado === 'LISTO')
      .filter((o) => !pedidosEnRutaIds.has(o.id))
      .filter(
        (o) =>
          o.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getClienteById(o.clienteId)?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime());
  }, [ventas, pedidosEnRutaIds, searchTerm, getClienteById]);

  // Rutas activas
  const rutasActivas = useMemo(() => {
    return manifiestos.filter((m) => m.estado === 'PLANIFICADA' || m.estado === 'EN_RUTA');
  }, [manifiestos]);

  // Rutas liquidadas
  const rutasLiquidadas = useMemo(() => {
    return manifiestos.filter((m) => m.estado === 'LIQUIDADA');
  }, [manifiestos]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      {/* Header General */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-indigo-400" />
            Centro de Despachos & Gobernanza de Rutas
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            Planificación de manifiestos, portal móvil para repartidores, recaudo multimedio y liquidación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 hover:from-blue-500 hover:to-indigo-600 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            + Nueva Hoja de Ruta
          </button>
        </div>
      </div>

      {/* Tabs de Navegación Rico UI */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'PEDIDOS_LISTOS', label: 'Pedidos Listos', count: pedidosListos.length, icon: Package },
          { id: 'RUTAS_ACTIVAS', label: 'Rutas en Curso', count: rutasActivas.length, icon: Truck },
          { id: 'RUTAS_LIQUIDADAS', label: 'Rutas Liquidadas', count: rutasLiquidadas.length, icon: CheckCheck },
          { id: 'GOBERNANZA_OTIF', label: 'Gobernanza & OTIF', count: undefined, icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabView)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/30 text-white border border-indigo-500/50 shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VISTA 1: Pedidos Listos para Armado de Ruta */}
      {activeTab === 'PEDIDOS_LISTOS' && (
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pedido o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setIsBuilderOpen(true)}
              disabled={pedidosListos.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Armar Manifiesto con Disponibles ({pedidosListos.length})
            </button>
          </div>

          {pedidosListos.length === 0 ? (
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-12 text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-white/10 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No hay pedidos pendientes de asignar
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Todos los pedidos en estado LISTO ya forman parte de un manifiesto de ruta activo o han sido procesados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
              {pedidosListos.map((pedido) => {
                const cliente = getClienteById(pedido.clienteId);
                const direccion = cliente?.direccion || 'Sin dirección';

                return (
                  <div
                    key={pedido.id}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          #{pedido.numeroPedido}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          LISTO
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {cliente?.nombre || 'Cliente Desconocido'}
                      </h4>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {direccion}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{pedido.lineas?.length || 0} ítems</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${(pedido.totalFinal || 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Rutas Activas & Despachos en Curso */}
      {activeTab === 'RUTAS_ACTIVAS' && (
        <div className="space-y-4 flex-1">
          {rutasActivas.length === 0 ? (
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <Truck className="w-12 h-12 text-slate-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No hay rutas activas en este momento</h3>
              <p className="text-xs text-slate-400 mb-4">
                Crea una nueva hoja de ruta para asignar pedidos a un conductor e iniciar el reparto.
              </p>
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                + Planificar Nueva Ruta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rutasActivas.map((m) => {
                const entregadosCount = m.pedidos.filter((p) => p.estadoEntrega !== 'PENDIENTE').length;
                const porcentaje = Math.round((entregadosCount / (m.pedidos.length || 1)) * 100);

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-indigo-500/20 shadow-lg flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Header de la Ruta */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">
                              {m.numeroManifiesto}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.estado === 'EN_RUTA'
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {m.estado === 'EN_RUTA' ? 'EN RUTA' : 'PLANIFICADA'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-1">
                            {m.conductorNombre} • <span className="font-mono text-emerald-400">{m.vehiculoPlaca}</span>
                          </h3>
                          <span className="text-xs text-slate-400">{m.zonaRuta}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Facturado Esperado</span>
                          <span className="text-base font-bold font-mono text-white">
                            ${m.totalFacturadoEsperado.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>

                      {/* Progreso de la Ruta */}
                      <div className="mt-4 bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Progreso de Entregas</span>
                          <span className="text-indigo-400 font-bold">
                            {entregadosCount} de {m.pedidos.length} ({porcentaje}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        {m.temperaturaSalidaCelsius !== undefined && (
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Temperatura Frío Salida:</span>
                            <span className="font-mono font-bold text-sky-400">
                              {m.temperaturaSalidaCelsius}°C
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones de la Ruta */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setActivePortalManifest(m)}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Abrir Portal Conductor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSettlementManifest(m)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Liquidar y Cuadrar Ruta</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: Rutas Liquidadas & Arqueos */}
      {activeTab === 'RUTAS_LIQUIDADAS' && (
        <div className="space-y-4 flex-1">
          {rutasLiquidadas.length === 0 ? (
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-12 text-center text-slate-400 text-sm">
              No hay rutas liquidadas registradas aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rutasLiquidadas.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {m.numeroManifiesto}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIQUIDADA
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{m.conductorNombre}</h4>
                    <span className="text-xs text-slate-400">{m.zonaRuta} • {m.vehiculoPlaca}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Efectivo Depositado:</span>
                      <b className="text-emerald-400 font-mono">
                        ${m.efectivoNetoEntregado.toLocaleString('es-CO')}
                      </b>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Digital / Bancos:</span>
                      <b className="text-sky-400 font-mono">
                        ${m.totalRecaudadoDigital.toLocaleString('es-CO')}
                      </b>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Gastos Deducidos:</span>
                      <b className="text-amber-400 font-mono">
                        -${m.totalGastosRuta.toLocaleString('es-CO')}
                      </b>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                      <span>Diferencia de Cuadre:</span>
                      <b
                        className={`font-mono ${
                          m.diferenciaCuadre === 0
                            ? 'text-emerald-400'
                            : m.diferenciaCuadre > 0
                            ? 'text-sky-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {m.diferenciaCuadre === 0
                          ? 'Exacto'
                          : `$${m.diferenciaCuadre.toLocaleString('es-CO')}`}
                      </b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA 4: Gobernanza & Auditoría OTIF */}
      {activeTab === 'GOBERNANZA_OTIF' && <DeliveryGovernanceTab />}

      {/* Modales */}
      {isBuilderOpen && (
        <RouteManifestBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          pedidosDisponibles={pedidosListos}
          getClientName={(cId) => getClienteById(cId)?.nombre || 'Cliente B2B'}
          getClientAddress={(cId) => getClienteById(cId)?.direccion || 'Dirección de Entrega'}
          onManifestCreated={() => {
            recargarManifiestos();
            setActiveTab('RUTAS_ACTIVAS');
          }}
        />
      )}

      {activePortalManifest && (
        <DeliveryDriverPortalModal
          isOpen={Boolean(activePortalManifest)}
          onClose={() => setActivePortalManifest(null)}
          manifiesto={activePortalManifest}
          onManifestUpdated={() => {
            recargarManifiestos();
          }}
        />
      )}

      {activeSettlementManifest && (
        <RouteSettlementModal
          isOpen={Boolean(activeSettlementManifest)}
          onClose={() => setActiveSettlementManifest(null)}
          manifiesto={activeSettlementManifest}
          onSettlementCompleted={() => {
            recargarManifiestos();
            setActiveTab('RUTAS_LIQUIDADAS');
          }}
        />
      )}
    </div>
  );
};
