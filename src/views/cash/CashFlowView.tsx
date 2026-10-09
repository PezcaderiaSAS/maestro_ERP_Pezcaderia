import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ArrowRightLeft,
  Upload,
  Download,
  Power,
  AlertTriangle,
  Truck,
  Fish,
  Snowflake,
  ShoppingCart,
  Receipt,
  Filter,
} from 'lucide-react';
import { cashService, getCategoriasGastos } from '../../services/cashService';
import { Caja, TurnoCaja, MovimientoCaja, CategoriaGastoConfig } from '../../types/cash.types';
import Swal from 'sweetalert2';
import ArqueoCajaModal from './components/ArqueoCajaModal';
import TrasladoDineroModal from './components/TrasladoDineroModal';
import { EgresoOperativoModal } from './components/EgresoOperativoModal';
import { AperturaCajaModal } from '../pos/components/AperturaCajaModal';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { useCashStore } from '../../store/useCashStore';
import { useAppStore } from '../../store/useAppStore';

export default function CashFlowView() {
  // Dominio de caja → useCashStore (Task 3.4)
  const { isLoading } = useCashStore();
  // userRole vive en useAppStore (dominio de sesión, no de caja — correcto)
  const { userRole } = useAppStore();
  const usuarioId = userRole;
  const { bodegas, getPrimaryBodega } = useWarehouseStore();
  const primaryBodega = getPrimaryBodega()?.nombre || 'Bodega Principal';
  
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>(primaryBodega); 
  
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>('');
  
  const [turnoActivo, setTurnoActivo] = useState<TurnoCaja | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);

  // Modales
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);
  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [showAperturaModal, setShowAperturaModal] = useState(false);

  // Filtro de movimientos diario (admite presets y categorías personalizadas)
  const [filtroTab, setFiltroTab] = useState<string>('TODO');
  // Cargar Cajas
  useEffect(() => {
    // Si no existen cajas en la BD, inyectamos unas de prueba por primera vez
    let cajasGuardadas = cashService.getCajas();
    if (cajasGuardadas.length === 0) {
      cashService.guardarCaja({ id: 'CAJA-1', bodegaId: primaryBodega, nombre: 'Caja POS Principal',          tipo: 'MENOR', activa: true });
      cashService.guardarCaja({ id: 'CAJA-2', bodegaId: primaryBodega, nombre: 'Caja Fuerte Administrativa', tipo: 'MAYOR', activa: true });
      cashService.guardarCaja({ id: 'CAJA-3', bodegaId: primaryBodega, nombre: 'Caja POS Secundaria',         tipo: 'MENOR', activa: true });
      cajasGuardadas = cashService.getCajas();
    }
    
    const bodegaObj = bodegas.find(b => b.nombre === bodegaSeleccionada || b.id === bodegaSeleccionada);
    const cajasBodega = cajasGuardadas.filter(c => 
      (c.bodegaId === bodegaSeleccionada || (bodegaObj && c.bodegaId === bodegaObj.id) || (!bodegaObj && c.activa)) && c.activa
    );
    setCajas(cajasBodega);
    
    if (cajasBodega.length > 0) {
      setCajaSeleccionada(cajasBodega[0].id);
    } else {
      setCajaSeleccionada('');
      setTurnoActivo(null);
      setMovimientos([]);
    }
  }, [bodegaSeleccionada, primaryBodega]);

  // Cargar Turno Activo
  const loadData = () => {
    if (cajaSeleccionada) {
      const turno = cashService.getTurnoActivo(cajaSeleccionada);
      setTurnoActivo(turno);
      if (turno) {
        setMovimientos(cashService.getMovimientos(turno.id));
      } else {
        setMovimientos([]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [cajaSeleccionada]);

  const handleApertura = () => {
    setShowAperturaModal(true);
  };

  const handleEgresoRapido = () => {
    if (!turnoActivo) return;
    setShowEgresoModal(true);
  };

  // Catálogo persistente de categorías configuradas
  const catalogoCategorias = useMemo(() => {
    return getCategoriasGastos();
  }, [movimientos]);

  // Extraer categorías dinámicas que tienen movimientos registrados en el turno
  const categoriasConMovimientos = useMemo(() => {
    const conteo = new Map<string, number>();
    movimientos.forEach(m => {
      if (m.tipo.startsWith('EGRESO') && m.categoriaEgreso) {
        conteo.set(m.categoriaEgreso, (conteo.get(m.categoriaEgreso) || 0) + 1);
      }
    });

    return Array.from(conteo.entries()).map(([catKey, count]) => {
      const match = catalogoCategorias.find(c =>
        c.nombre.toLowerCase() === catKey.toLowerCase() ||
        c.id.toLowerCase() === catKey.toLowerCase()
      );
      return {
        key: catKey,
        nombre: match?.nombre || catKey,
        icono: match?.icono || '🏷️',
        colorBadge: match?.colorBadge || 'rose',
        count,
      };
    });
  }, [movimientos, catalogoCategorias]);

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      if (filtroTab === 'TODO') return true;
      if (filtroTab === 'VENTAS') return mov.tipo === 'INGRESO_VENTA';
      if (filtroTab === 'FLETES') {
        const cat = (mov.categoriaEgreso || '').toLowerCase();
        const conc = (mov.concepto || '').toLowerCase();
        return cat.includes('flete') || conc.includes('flete');
      }
      if (filtroTab === 'PESCADO') {
        const cat = (mov.categoriaEgreso || '').toLowerCase();
        const conc = (mov.concepto || '').toLowerCase();
        return cat.includes('pescado') || conc.includes('pescado') || conc.includes('proveedor');
      }
      if (filtroTab === 'GASTOS') {
        return mov.tipo.startsWith('EGRESO');
      }
      // Filtro dinámico por categoría exacta o coincidencia de concepto
      const cat = (mov.categoriaEgreso || '').toLowerCase();
      const conc = (mov.concepto || '').toLowerCase();
      const filtro = filtroTab.toLowerCase();
      return cat === filtro || cat.includes(filtro) || conc.includes(filtro);
    });
  }, [movimientos, filtroTab]);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-full flex-1 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Cajas</h1>
          <p className="text-slate-500 mt-1">Control de flujo de efectivo por bodega</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <span className="text-sm font-bold text-slate-600">Bodega:</span>
          <select 
            className="border border-slate-200 bg-slate-50 text-slate-800 rounded-lg text-sm focus:ring-blue-500 font-semibold px-2 py-1"
            value={bodegaSeleccionada}
            onChange={(e) => setBodegaSeleccionada(e.target.value)}
          >
            {bodegas.filter(b => b.activa).map(b => (
              <option key={b.id} value={b.nombre}>{b.nombre}</option>
            ))}
          </select>

          <span className="text-sm font-bold text-slate-600 ml-4">Caja:</span>
          <select 
            className="border border-slate-200 bg-slate-50 text-slate-800 rounded-lg text-sm focus:ring-blue-500 font-semibold px-2 py-1"
            value={cajaSeleccionada}
            onChange={(e) => setCajaSeleccionada(e.target.value)}
          >
            {cajas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {!turnoActivo ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">La caja está cerrada</h2>
          <p className="text-slate-500 mb-8">Debe abrir un turno para procesar ventas y registrar movimientos de efectivo en esta caja.</p>
          <button 
            data-testid="btn-abrir-turno"
            onClick={handleApertura}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            <Power size={20} />
            Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Resumen y Acciones */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Wallet size={80} />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1 relative z-10">Saldo Teórico Global</p>
                <h2 className="text-4xl font-extrabold relative z-10">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</h2>
                <div className="mt-4 inline-flex items-center gap-1 bg-blue-500/50 px-3 py-1 rounded-full text-xs font-medium relative z-10">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  Turno Abierto
                </div>
              </div>
              
              {/* Desglose por Medio de Pago (Control de Cuadre) */}
              <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                <div className="p-3 text-center border-r border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Efectivo</p>
                  <p className="text-sm font-black text-emerald-600">${turnoActivo.totalEfectivo.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center border-r border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Datáfono</p>
                  <p className="text-sm font-black text-blue-600">${turnoActivo.totalDatafono.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Transf.</p>
                  <p className="text-sm font-black text-purple-600">${turnoActivo.totalTransferencias.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Base Inicial:</span>
                    <span className="font-bold text-slate-900">${turnoActivo.baseInicial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Total Ingresos:</span>
                    <span className="font-bold text-emerald-600">
                      +${movimientos.filter(m => m.tipo.startsWith('INGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Total Egresos:</span>
                    <span className="font-bold text-rose-600">
                      -${movimientos.filter(m => m.tipo.startsWith('EGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <button 
                    data-testid="btn-egreso-rapido"
                    onClick={handleEgresoRapido}
                    className="w-full min-h-[50px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-4 rounded-xl border border-rose-200 flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Upload size={20} className="text-rose-600" />
                    <span>Salida de Dinero (Flete / Compra)</span>
                  </button>
                  <button 
                    data-testid="btn-traslado-dinero"
                    onClick={() => setShowTrasladoModal(true)}
                    className="w-full min-h-[48px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <ArrowRightLeft size={18} className="text-blue-600" />
                    <span>Mover Plata entre Cajas</span>
                  </button>
                  <button 
                    data-testid="btn-cierre-caja"
                    onClick={() => setShowCierreModal(true)}
                    className="w-full min-h-[50px] bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition active:scale-95 mt-4 cursor-pointer"
                  >
                    <Power size={20} />
                    <span>Cerrar Turno (Arqueo Ciego)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Historial de Movimientos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Movimientos de Hoy</h3>
                  <p className="text-xs text-slate-500">Control de entradas y salidas en tiempo real</p>
                </div>

                {/* Pestañas Táctiles de Filtrado Rápido y Dinámicas */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setFiltroTab('TODO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      filtroTab === 'TODO' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Todo ({movimientos.length})
                  </button>
                  <button
                    onClick={() => setFiltroTab('VENTAS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      filtroTab === 'VENTAS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingCart size={12} />
                    <span>Ventas</span>
                  </button>
                  <button
                    onClick={() => setFiltroTab('FLETES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      filtroTab === 'FLETES' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Truck size={12} />
                    <span>Fletes</span>
                  </button>
                  <button
                    onClick={() => setFiltroTab('PESCADO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      filtroTab === 'PESCADO' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Fish size={12} />
                    <span>Pescado</span>
                  </button>

                  {/* Pestañas dinámicas de categorías con movimientos en el turno actual */}
                  {categoriasConMovimientos
                    .filter(c => !c.nombre.toLowerCase().includes('flete') && !c.nombre.toLowerCase().includes('pescado'))
                    .map(cat => {
                      const isActive = filtroTab.toLowerCase() === cat.nombre.toLowerCase() || filtroTab === cat.key;
                      return (
                        <button
                          key={cat.key}
                          onClick={() => setFiltroTab(cat.nombre)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            isActive
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cat.icono}</span>
                          <span>{cat.nombre}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-black/10 text-slate-800 rounded-full font-mono">{cat.count}</span>
                        </button>
                      );
                    })}

                  <button
                    onClick={() => setFiltroTab('GASTOS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      filtroTab === 'GASTOS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Receipt size={12} />
                    <span>Todos Egresos</span>
                  </button>
                </div>
              </div>

              <div className="p-0 flex-1 overflow-auto">
                {movimientosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <AlertTriangle size={32} className="mb-2 opacity-40 text-amber-500" />
                    <p className="text-sm">No hay transacciones en este filtro.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Hora</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Categoría</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Detalle</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movimientosFiltrados
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(mov => {
                          const esIngreso = mov.tipo.startsWith('INGRESO');
                          const catNombre = (mov.categoriaEgreso || '').toLowerCase();
                          const esFlete = catNombre.includes('flete') || mov.concepto.toLowerCase().includes('flete');
                          const esPescado = catNombre.includes('pescado') || mov.concepto.toLowerCase().includes('pescado');
                          const esHielo = catNombre.includes('hielo') || mov.concepto.toLowerCase().includes('hielo');

                          // Buscar coincidencia en catálogo de categorías
                          const catConfig = catalogoCategorias.find(c =>
                            c.nombre.toLowerCase() === catNombre ||
                            c.id.toLowerCase() === catNombre
                          );

                          return (
                            <tr key={mov.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                                <div className="flex flex-col font-mono">
                                  <span className="text-slate-900 font-bold">{new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-[10px] text-slate-500">{new Date(mov.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  esIngreso
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : esFlete
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : esPescado
                                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                    : esHielo
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {esIngreso ? (
                                    <>
                                      <Download size={12} />
                                      <span>{mov.tipo.replace('INGRESO_', '').replace('_', ' ')}</span>
                                    </>
                                  ) : catConfig ? (
                                    <>
                                      <span>{catConfig.icono}</span>
                                      <span>{catConfig.nombre}</span>
                                    </>
                                  ) : esFlete ? (
                                    <>
                                      <Truck size={12} />
                                      <span>Flete Camión</span>
                                    </>
                                  ) : esPescado ? (
                                    <>
                                      <Fish size={12} />
                                      <span>Compra Pescado</span>
                                    </>
                                  ) : esHielo ? (
                                    <>
                                      <Snowflake size={12} />
                                      <span>Hielo / Frío</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>🏷️</span>
                                      <span>{mov.categoriaEgreso || mov.tipo.replace('EGRESO_', '').replace('_', ' ')}</span>
                                    </>
                                  )}
                                </span>
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold uppercase">
                                  {mov.metodoPago}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-800">
                                <div className="font-semibold text-slate-900">{mov.concepto}</div>
                                {mov.metadata?.placaCamion && (
                                  <span className="text-[10px] text-amber-700 font-mono font-bold">
                                    Furgón: {mov.metadata.placaCamion}
                                  </span>
                                )}
                              </td>
                              <td className={`px-5 py-3.5 whitespace-nowrap text-sm font-black font-mono text-right ${
                                esIngreso ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {esIngreso ? '+' : '-'}${mov.monto.toLocaleString()} COP
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Modales */}
      {showAperturaModal && (
        <AperturaCajaModal
          userRole={userRole}
          bodegaActiva={bodegaSeleccionada}
          onSuccess={() => {
            setShowAperturaModal(false);
            loadData();
          }}
          onCancel={() => setShowAperturaModal(false)}
        />
      )}

      {showCierreModal && turnoActivo && (
        <ArqueoCajaModal 
          turnoActivo={turnoActivo}
          usuarioId={usuarioId}
          onClose={() => setShowCierreModal(false)}
          onSuccess={() => {
            setShowCierreModal(false);
            loadData(); // Refrescará y ocultará el dashboard porque ya no hay turno
          }}
        />
      )}

      {showTrasladoModal && turnoActivo && (
        <TrasladoDineroModal
          turnoOrigen={turnoActivo}
          usuarioId={usuarioId}
          onClose={() => setShowTrasladoModal(false)}
          onSuccess={() => {
            setShowTrasladoModal(false);
            loadData(); // Refrescará para mostrar el nuevo egreso
          }}
        />
      )}

      {showEgresoModal && turnoActivo && (
        <EgresoOperativoModal
          turnoActivo={turnoActivo}
          usuarioId={usuarioId}
          onClose={() => setShowEgresoModal(false)}
          onSuccess={() => {
            setShowEgresoModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
