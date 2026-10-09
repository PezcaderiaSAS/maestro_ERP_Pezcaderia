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
import { cashService } from '../../services/cashService';
import { Caja, TurnoCaja, MovimientoCaja } from '../../types/cash.types';
import Swal from 'sweetalert2';
import ArqueoCajaModal from './components/ArqueoCajaModal';
import TrasladoDineroModal from './components/TrasladoDineroModal';
import EgresoOperativoModal from './components/EgresoOperativoModal';
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

  // Filtro de movimientos diario
  const [filtroTab, setFiltroTab] = useState<'TODO' | 'VENTAS' | 'FLETES' | 'PESCADO' | 'GASTOS'>('TODO');
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

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      if (filtroTab === 'TODO') return true;
      if (filtroTab === 'VENTAS') return mov.tipo === 'INGRESO_VENTA';
      if (filtroTab === 'FLETES') {
        return mov.categoriaEgreso === 'FLETE_TRANSPORTE' || mov.concepto.toLowerCase().includes('flete');
      }
      if (filtroTab === 'PESCADO') {
        return mov.categoriaEgreso === 'PAGO_PROVEEDOR_PESCADO' || mov.concepto.toLowerCase().includes('pescado') || mov.concepto.toLowerCase().includes('proveedor');
      }
      if (filtroTab === 'GASTOS') {
        return mov.categoriaEgreso === 'INSUMOS_HIELO_CAVA' || mov.categoriaEgreso === 'GASTO_OPERATIVO_GENERAL' || (mov.tipo.startsWith('EGRESO') && mov.categoriaEgreso !== 'FLETE_TRANSPORTE' && mov.categoriaEgreso !== 'PAGO_PROVEEDOR_PESCADO');
      }
      return true;
    });
  }, [movimientos, filtroTab]);

  return (
    <div className="p-4 md:p-6 bg-slate-800/40 min-h-full flex-1 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Gestión de Cajas</h1>
          <p className="text-gray-500 mt-1">Control de flujo de efectivo por bodega</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card border-white/5 p-2 rounded-lg shadow-sm border">
          <span className="text-sm font-medium text-slate-400">Bodega:</span>
          <select 
            className="border-white/10 rounded text-sm focus:ring-blue-500 font-semibold"
            value={bodegaSeleccionada}
            onChange={(e) => setBodegaSeleccionada(e.target.value)}
          >
            {bodegas.filter(b => b.activa).map(b => (
              <option key={b.id} value={b.nombre}>{b.nombre}</option>
            ))}
          </select>

          <span className="text-sm font-medium text-slate-400 ml-4">Caja:</span>
          <select 
            className="border-white/10 rounded text-sm focus:ring-blue-500 font-semibold"
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
        <div className="bg-card border-white/5 rounded-2xl shadow-sm border border-border p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet size={40} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">La caja está cerrada</h2>
          <p className="text-gray-500 mb-8">Debe abrir un turno para procesar ventas y registrar movimientos de efectivo en esta caja.</p>
          <button 
            data-testid="btn-abrir-turno"
            onClick={handleApertura}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Power size={20} />
            Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Resumen y Acciones */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border-white/5 rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-6">
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
              <div className="grid grid-cols-3 bg-slate-800/40 border-b border-border">
                <div className="p-3 text-center border-r border-border">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Efectivo</p>
                  <p className="text-sm font-bold text-green-700">${turnoActivo.totalEfectivo.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center border-r border-border">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Datáfono</p>
                  <p className="text-sm font-bold text-blue-700">${turnoActivo.totalDatafono.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Transf.</p>
                  <p className="text-sm font-bold text-purple-700">${turnoActivo.totalTransferencias.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Base Inicial:</span>
                    <span className="font-semibold text-primary">${turnoActivo.baseInicial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Ingresos:</span>
                    <span className="font-semibold text-green-600">
                      +${movimientos.filter(m => m.tipo.startsWith('INGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Egresos:</span>
                    <span className="font-semibold text-red-600">
                      -${movimientos.filter(m => m.tipo.startsWith('EGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-700/60">
                  <button 
                    data-testid="btn-egreso-rapido"
                    onClick={handleEgresoRapido}
                    className="w-full min-h-[50px] bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-bold py-3 px-4 rounded-xl border border-rose-500/30 flex items-center justify-center gap-2.5 transition active:scale-95"
                  >
                    <Upload size={20} className="text-rose-400" />
                    <span>Salida de Dinero (Flete / Compra)</span>
                  </button>
                  <button 
                    data-testid="btn-traslado-dinero"
                    onClick={() => setShowTrasladoModal(true)}
                    className="w-full min-h-[48px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <ArrowRightLeft size={18} className="text-blue-400" />
                    <span>Mover Plata entre Cajas</span>
                  </button>
                  <button 
                    data-testid="btn-cierre-caja"
                    onClick={() => setShowCierreModal(true)}
                    className="w-full min-h-[50px] bg-red-600 hover:bg-red-500 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition active:scale-95 mt-4"
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
            <div className="bg-card border-white/5 rounded-2xl shadow-sm border border-border h-full flex flex-col">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-primary">Movimientos de Hoy</h3>
                  <p className="text-xs text-slate-400">Control de entradas y salidas en tiempo real</p>
                </div>

                {/* Pestañas Táctiles de Filtrado Rápido */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setFiltroTab('TODO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filtroTab === 'TODO' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todo ({movimientos.length})
                  </button>
                  <button
                    onClick={() => setFiltroTab('VENTAS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      filtroTab === 'VENTAS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShoppingCart size={12} />
                    <span>Ventas</span>
                  </button>
                  <button
                    onClick={() => setFiltroTab('FLETES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      filtroTab === 'FLETES' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Truck size={12} />
                    <span>Fletes</span>
                  </button>
                  <button
                    onClick={() => setFiltroTab('PESCADO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      filtroTab === 'PESCADO' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Fish size={12} />
                    <span>Pescado</span>
                  </button>
                  <button
                    onClick={() => setFiltroTab('GASTOS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      filtroTab === 'GASTOS' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Receipt size={12} />
                    <span>Gastos</span>
                  </button>
                </div>
              </div>

              <div className="p-0 flex-1 overflow-auto">
                {movimientosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <AlertTriangle size={32} className="mb-2 opacity-40 text-amber-400" />
                    <p className="text-sm">No hay transacciones en este filtro.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hora</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalle</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {movimientosFiltrados
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(mov => {
                          const esIngreso = mov.tipo.startsWith('INGRESO');
                          const esFlete = mov.categoriaEgreso === 'FLETE_TRANSPORTE' || mov.concepto.toLowerCase().includes('flete');
                          const esPescado = mov.categoriaEgreso === 'PAGO_PROVEEDOR_PESCADO' || mov.concepto.toLowerCase().includes('pescado');
                          const esHielo = mov.categoriaEgreso === 'INSUMOS_HIELO_CAVA' || mov.concepto.toLowerCase().includes('hielo');

                          return (
                            <tr key={mov.id} className="hover:bg-slate-800/40 transition">
                              <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                                <div className="flex flex-col font-mono">
                                  <span className="text-slate-300">{new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-[10px] text-slate-500">{new Date(mov.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  esIngreso
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : esFlete
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : esPescado
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    : esHielo
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {esIngreso && <Download size={12} />}
                                  {!esIngreso && esFlete && <Truck size={12} />}
                                  {!esIngreso && esPescado && <Fish size={12} />}
                                  {!esIngreso && esHielo && <Snowflake size={12} />}
                                  {!esIngreso && !esFlete && !esPescado && !esHielo && <Upload size={12} />}
                                  
                                  {esFlete
                                    ? 'Flete Camión'
                                    : esPescado
                                    ? 'Compra Pescado'
                                    : esHielo
                                    ? 'Hielo / Frío'
                                    : mov.tipo.replace('INGRESO_', '').replace('EGRESO_', '').replace('_', ' ')}
                                </span>
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-semibold uppercase">
                                  {mov.metodoPago}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-200">
                                <div className="font-medium">{mov.concepto}</div>
                                {mov.metadata?.placaCamion && (
                                  <span className="text-[10px] text-amber-400 font-mono">
                                    Furgón: {mov.metadata.placaCamion}
                                  </span>
                                )}
                              </td>
                              <td className={`px-5 py-3.5 whitespace-nowrap text-sm font-black font-mono text-right ${
                                esIngreso ? 'text-emerald-400' : 'text-rose-400'
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
