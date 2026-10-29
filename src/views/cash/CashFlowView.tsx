import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Sparkles,
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
  Layers,
} from 'lucide-react';
import { cashService, getCategoriasGastos } from '../../services/cashService';
import { Caja, TurnoCaja, MovimientoCaja, CategoriaGastoConfig } from '../../types/cash.types';
import Swal from 'sweetalert2';
import ArqueoCajaModal from './components/ArqueoCajaModal';
import TrasladoDineroModal from './components/TrasladoDineroModal';
import { EgresoOperativoModal } from './components/EgresoOperativoModal';
import { AperturaCajaModal } from '../pos/components/AperturaCajaModal';
import { CashierKanbanView } from '../pos/components/CashierKanbanView';
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

  // Subvista Caja Única: Flujo de Caja y Turnos vs Kanban de Preventas Mostrador (F9)
  const [vistaActiva, setVistaActiva] = useState<'flujo' | 'preventas_kanban'>('flujo');

  // Atajo de teclado F9 para alternar a vista Kanban de preventas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        setVistaActiva(prev => (prev === 'flujo' ? 'preventas_kanban' : 'flujo'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
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

  // Ordenamiento memoizado no mutante (F14)
  const movimientosOrdenados = useMemo(() => {
    return [...movimientosFiltrados].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [movimientosFiltrados]);

  return (
    <div className="p-4 md:p-6 bg-slate-950/40 text-slate-100 min-h-full flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Gestión de Cajas</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Caja Única
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">Control de flujo de efectivo por bodega y recaudo centralizado</p>
        </div>
        
        {/* Selectores de Bodega y Caja con flex-wrap responsivo para evitar overflow en 375px (F11) */}
        <div data-testid="caja-header-selectors" className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-lg w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Bodega:</span>
            <select 
              className="border border-white/12 bg-slate-950/80 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium px-3 py-2 min-h-[44px] outline-none flex-1 sm:flex-initial min-w-0"
              value={bodegaSeleccionada}
              onChange={(e) => setBodegaSeleccionada(e.target.value)}
            >
              {bodegas.filter(b => b.activa).map(b => (
                <option key={b.id} value={b.nombre} className="bg-slate-900 text-slate-100">{b.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 sm:ml-2">Caja:</span>
            <select 
              className="border border-white/12 bg-slate-950/80 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium px-3 py-2 min-h-[44px] outline-none flex-1 sm:flex-initial min-w-0"
              value={cajaSeleccionada}
              onChange={(e) => setCajaSeleccionada(e.target.value)}
            >
              {cajas.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selector de Subvistas: Flujo & Arqueo vs Comandas & Preventas (Kanban) (F15) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-white/10 rounded-2xl w-full sm:w-fit mb-6">
        <button
          type="button"
          data-testid="tab-caja-flujo"
          onClick={() => setVistaActiva('flujo')}
          className={`min-h-[44px] flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            vistaActiva === 'flujo'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wallet size={16} />
          <span>Flujo & Arqueo</span>
        </button>
        <button
          type="button"
          data-testid="tab-caja-kanban"
          onClick={() => setVistaActiva('preventas_kanban')}
          className={`min-h-[44px] flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            vistaActiva === 'preventas_kanban'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={16} />
          <span>Comandas & Preventas (Kanban)</span>
        </button>
      </div>

      {vistaActiva === 'preventas_kanban' ? (
        <div data-testid="caja-kanban-container" className="flex-1 min-h-[600px] h-[calc(100vh-250px)] rounded-2xl overflow-hidden border border-white/10 bg-slate-950/60 shadow-xl">
          <CashierKanbanView />
        </div>
      ) : !turnoActivo ? (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 text-center max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Wallet size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">La caja está cerrada</h2>
          <p className="text-slate-400 text-sm mb-7 max-w-md mx-auto leading-relaxed">
            Debe abrir un turno para procesar ventas y registrar movimientos de efectivo en esta caja.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <button 
              data-testid="btn-abrir-turno"
              onClick={handleApertura}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer text-xs sm:text-sm min-h-[44px]"
            >
              <Power size={18} />
              <span>Abrir Turno Manual</span>
            </button>
            <button 
              type="button"
              data-testid="btn-abrir-turno-express"
              id="btn-abrir-turno-express"
              onClick={() => {
                const res = cashService.abrirTurno(
                  cajaSeleccionada || 'CAJA-1',
                  usuarioId || 'usr-cajero-demo',
                  100000,
                  undefined,
                  'Apertura Express Demo ($100.000)'
                );
                if (res.data || res.datos) {
                  loadData();
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Turno Abierto ($100.000)',
                    text: 'Caja lista para procesar cobros y preventas.',
                    showConfirmButton: false,
                    timer: 2500,
                  });
                }
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer text-xs sm:text-sm min-h-[44px]"
              title="Apertura inmediata con saldo base de $100.000 para pruebas"
            >
              <Sparkles size={18} className="text-yellow-300 animate-pulse" />
              <span>⚡ Apertura Rápida Demo ($100.000)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Resumen y Acciones */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden mb-6">
              <div className="bg-gradient-to-br from-blue-600/90 via-blue-700/90 to-indigo-800/90 p-5 text-white text-center relative overflow-hidden border-b border-white/10">
                <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
                  <Wallet size={80} />
                </div>
                <p className="text-blue-100 text-xs uppercase font-bold tracking-wider mb-1 relative z-10">Saldo Teórico Global</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold relative z-10 font-mono tracking-tight text-white">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</h2>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-100 border border-white/15 relative z-10">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Turno Abierto
                </div>
              </div>
              
              {/* Desglose por Medio de Pago (Control de Cuadre) */}
              <div className="grid grid-cols-3 bg-slate-950/60 border-b border-white/10">
                <div className="p-3 text-center border-r border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Efectivo</p>
                  <p className="text-xs sm:text-sm font-black font-mono text-emerald-400">${turnoActivo.totalEfectivo.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center border-r border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Datáfono</p>
                  <p className="text-xs sm:text-sm font-black font-mono text-blue-400">${turnoActivo.totalDatafono.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Transf.</p>
                  <p className="text-xs sm:text-sm font-black font-mono text-purple-400">${turnoActivo.totalTransferencias.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-3.5 mb-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Base Inicial:</span>
                    <span className="font-mono font-bold text-slate-200">${turnoActivo.baseInicial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Total Ingresos:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +${movimientos.filter(m => m.tipo.startsWith('INGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Total Egresos:</span>
                    <span className="font-mono font-bold text-rose-400">
                      -${movimientos.filter(m => m.tipo.startsWith('EGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-5 border-t border-white/10">
                  <button 
                    data-testid="btn-egreso-rapido"
                    onClick={handleEgresoRapido}
                    className="w-full min-h-[46px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold py-2.5 px-4 rounded-xl border border-rose-500/30 flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Upload size={18} className="text-rose-400" />
                    <span>Salida de Dinero (Flete / Compra)</span>
                  </button>
                  <button 
                    data-testid="btn-traslado-dinero"
                    onClick={() => setShowTrasladoModal(true)}
                    className="w-full min-h-[46px] bg-slate-800/60 hover:bg-slate-800/90 text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <ArrowRightLeft size={18} className="text-blue-400" />
                    <span>Mover Plata entre Cajas</span>
                  </button>
                  <button 
                    data-testid="btn-cierre-caja"
                    onClick={() => setShowCierreModal(true)}
                    className="w-full min-h-[48px] bg-red-600 hover:bg-red-500 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95 mt-3 cursor-pointer"
                  >
                    <Power size={18} />
                    <span>Cerrar Turno (Arqueo Ciego)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Historial de Movimientos */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 h-full flex flex-col overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/40">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Movimientos de Hoy</h3>
                  <p className="text-xs text-slate-400">Control de entradas y salidas en tiempo real</p>
                </div>

                {/* Pestañas Táctiles de Filtrado Rápido y Dinámicas (F13: Fitts >=44px) */}
                <div data-testid="caja-filtro-tabs" className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/10">
                  <button
                    data-testid="filtro-tab-TODO"
                    onClick={() => setFiltroTab('TODO')}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      filtroTab === 'TODO' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    Todo ({movimientos.length})
                  </button>
                  <button
                    data-testid="filtro-tab-VENTAS"
                    onClick={() => setFiltroTab('VENTAS')}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      filtroTab === 'VENTAS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <ShoppingCart size={14} />
                    <span>Ventas</span>
                  </button>
                  <button
                    data-testid="filtro-tab-FLETES"
                    onClick={() => setFiltroTab('FLETES')}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      filtroTab === 'FLETES' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Truck size={14} />
                    <span>Fletes</span>
                  </button>
                  <button
                    data-testid="filtro-tab-PESCADO"
                    onClick={() => setFiltroTab('PESCADO')}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      filtroTab === 'PESCADO' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Fish size={14} />
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
                          data-testid={`filtro-tab-${cat.key}`}
                          onClick={() => setFiltroTab(cat.nombre)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isActive
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                        >
                          <span>{cat.icono}</span>
                          <span>{cat.nombre}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-slate-200 rounded-full font-mono">{cat.count}</span>
                        </button>
                      );
                    })}

                  <button
                    data-testid="filtro-tab-GASTOS"
                    onClick={() => setFiltroTab('GASTOS')}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      filtroTab === 'GASTOS' ? 'bg-slate-800 text-white shadow-sm border border-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Receipt size={14} />
                    <span>Todos Egresos</span>
                  </button>
                </div>
              </div>

              {/* Contenedor responsivo de la tabla de movimientos (F12) */}
              <div data-testid="caja-movimientos-container" className="p-0 flex-1 overflow-x-auto w-full custom-scrollbar">
                {movimientosOrdenados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <AlertTriangle size={32} className="mb-2 opacity-50 text-amber-400" />
                    <p className="text-sm">No hay transacciones en este filtro.</p>
                  </div>
                ) : (
                  <table data-testid="caja-movimientos-table" className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-slate-950/90 sticky top-0 border-b border-white/10 backdrop-blur-md z-10">
                      <tr>
                        <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Hora</th>
                        <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                        <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle</th>
                        <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {movimientosOrdenados.map(mov => {
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
                            <tr key={mov.id} className="hover:bg-white/[0.03] transition">
                              <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 whitespace-nowrap text-xs text-slate-400">
                                <div className="flex flex-col font-mono">
                                  <span className="text-slate-200 font-bold">{new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-[10px] text-slate-500">{new Date(mov.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  esIngreso
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : esFlete
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : esPescado
                                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                    : esHielo
                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
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
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/15 font-mono font-bold uppercase">
                                  {mov.metodoPago}
                                </span>
                              </td>
                              <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs text-slate-300">
                                <div className="font-semibold text-slate-100">{mov.concepto}</div>
                                {mov.metadata?.placaCamion && (
                                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                                    Furgón: {mov.metadata.placaCamion}
                                  </span>
                                )}
                              </td>
                              <td className={`px-3 sm:px-5 py-2.5 sm:py-3.5 whitespace-nowrap text-sm font-black font-mono text-right ${
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
