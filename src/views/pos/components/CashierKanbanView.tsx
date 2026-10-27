// src/views/pos/components/CashierKanbanView.tsx
// Tablero Kanban de Caja Única (UI Upgrade Premium): Column Pills, Avatar Stack y Recaudo F9 (SPEC-037)

import React, { useEffect, useState, useMemo } from 'react';
import {
  Clock,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Receipt,
  User,
  X,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { Prefactura, EstadoPrefactura, MetodoPagoPrefactura } from '../../../types/prefactura.types';
import { useCashierKanbanStore } from '../../../stores/useCashierKanbanStore';
import { useAuthStore } from '../../../store/useAuthStore';

interface CashierKanbanViewProps {
  tenantId?: string;
  cajeroId?: string;
}

export const CashierKanbanView: React.FC<CashierKanbanViewProps> = ({
  tenantId: propTenantId,
  cajeroId: propCajeroId,
}) => {
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAuthStore((s) => s.currentUser);

  const tenantId = propTenantId || activeTenant?.id || 'ten-default';
  const cajeroId = propCajeroId || currentUser?.id || 'usr-cajero-default';

  const preventas = useCashierKanbanStore((s) => s.preventas);
  const filtroAsesorId = useCashierKanbanStore((s) => s.filtroAsesorId);
  const preventaSeleccionada = useCashierKanbanStore((s) => s.preventaSeleccionada);
  const isModalCobroOpen = useCashierKanbanStore((s) => s.isModalCobroOpen);
  const cargarPreventas = useCashierKanbanStore((s) => s.cargarPreventas);
  const setFiltroAsesor = useCashierKanbanStore((s) => s.setFiltroAsesor);
  const abrirModalCobro = useCashierKanbanStore((s) => s.abrirModalCobro);
  const cerrarModalCobro = useCashierKanbanStore((s) => s.cerrarModalCobro);
  const moverPreventaAColumna = useCashierKanbanStore((s) => s.moverPreventaAColumna);
  const procesarCobro = useCashierKanbanStore((s) => s.procesarCobro);

  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPagoPrefactura>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Carga inicial y sondeo reactivo
  useEffect(() => {
    cargarPreventas(tenantId);
    const interval = setInterval(() => {
      cargarPreventas(tenantId);
    }, 4000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Lista única de asesores con preventas activas para la barra de chips
  const asesoresActivos = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; total: number }>();
    for (const p of preventas) {
      if (!map.has(p.vendedorId)) {
        map.set(p.vendedorId, { id: p.vendedorId, nombre: p.vendedorNombre, total: 1 });
      } else {
        map.get(p.vendedorId)!.total += 1;
      }
    }
    return Array.from(map.values());
  }, [preventas]);

  // Filtrado por Asesor Comercial
  const preventasFiltradas = useMemo(() => {
    if (filtroAsesorId === 'TODOS') return preventas;
    return preventas.filter((p) => p.vendedorId === filtroAsesorId);
  }, [preventas, filtroAsesorId]);

  // Clasificación en las 3 columnas canónicas
  const colEspera = useMemo(
    () => preventasFiltradas.filter((p) => p.estado === 'PENDIENTE_COBRO'),
    [preventasFiltradas]
  );
  const colEnCobro = useMemo(
    () => preventasFiltradas.filter((p) => p.estado === 'EN_COBRO'),
    [preventasFiltradas]
  );
  const colPagadas = useMemo(
    () => preventasFiltradas.filter((p) => p.estado === 'PAGADA' || p.estado === 'DESPACHADA'),
    [preventasFiltradas]
  );

  // Manejo de Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedCardId(id);
  };

  const handleDropOnColumn = async (e: React.DragEvent, destino: EstadoPrefactura) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!id) return;

    if (destino === 'EN_COBRO') {
      await moverPreventaAColumna(tenantId, id, 'EN_COBRO', cajeroId);
    }
    setDraggedCardId(null);
  };

  // Abrir modal de cobro y preestablecer valor recibido
  const iniciarCobro = (pref: Prefactura) => {
    setEfectivoRecibido(pref.total);
    abrirModalCobro(pref);
  };

  // Confirmar cobro desde el modal
  const handleConfirmarRecaudo = async () => {
    if (!preventaSeleccionada) return;

    await procesarCobro({
      prefacturaId: preventaSeleccionada.id,
      tenantId,
      cajeroId,
      turnoId: 'turno-caja-principal',
      montoTotal: preventaSeleccionada.total,
      pagos: [{ metodoPago: metodoSeleccionado, monto: preventaSeleccionada.total }],
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#070A10] text-slate-100 p-4 select-none overflow-hidden">
      {/* 1. Header del Tablero & Barra de Chips de Asesor */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              Flujo de Ventas & Recaudo de Caja
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Caja Única
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Seguimiento Kanban de preventas de mostrador y facturación centralizada
            </p>
          </div>
        </div>

        {/* Chips de Selección Rápida por Asesor Comercial */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter size={13} /> Asesor:
          </span>

          <button
            onClick={() => setFiltroAsesor('TODOS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtroAsesorId === 'TODOS'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Todos ({preventas.length})
          </button>

          {asesoresActivos.map((a) => (
            <button
              key={a.id}
              onClick={() => setFiltroAsesor(a.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filtroAsesorId === a.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[9px] flex items-center justify-center font-black">
                {a.nombre.charAt(0)}
              </span>
              <span>{a.nombre}</span>
              <span className="text-[10px] font-mono opacity-80">({a.total})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Contenedor de las 3 Columnas Kanban (Optimizado Laptop 1366x768) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
        {/* COLUMNA 1: En Espera de Cobro */}
        <div
          className="flex flex-col bg-slate-900/70 border border-white/10 rounded-2xl p-2.5 min-h-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDropOnColumn(e, 'PENDIENTE_COBRO')}
        >
          {/* Cabecera de Columna con Status Pill y Contador */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                En Espera de Cobro
              </span>
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {colEspera.length}
            </span>
          </div>

          {/* Lista de Tarjetas */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {colEspera.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                <span>Sin clientes en espera</span>
              </div>
            ) : (
              colEspera.map((pref) => (
                <div
                  key={pref.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pref.id)}
                  className="bg-slate-800/90 hover:bg-slate-800 border border-white/10 rounded-2xl p-3 shadow-lg shadow-black/40 hover:shadow-cyan-500/10 transition-all duration-200 cursor-grab active:cursor-grabbing group relative"
                >
                  {/* Pills Superiores: Asesor y Tiempo */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 truncate max-w-[140px]">
                      {pref.vendedorNombre}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Clock size={11} className="text-cyan-400" />
                      {pref.terminalId}
                    </span>
                  </div>

                  {/* Título Principal (Cliente) y Código Ticket */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-white truncate leading-snug">
                      {pref.clienteNombre || 'Consumidor Final'}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold block">
                      {pref.codigoPreventa}
                    </span>
                  </div>

                  {/* Valor Total Destacado */}
                  <div className="mb-3 text-lg font-black text-white tracking-tight">
                    ${pref.total.toLocaleString('es-CO')}
                  </div>

                  {/* Footer con Metadatos y Avatar Stack */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <ShoppingBag size={12} className="text-slate-400" />
                      {pref.items.length} {pref.items.length === 1 ? 'ítem' : 'ítems'}
                    </span>

                    {/* Avatar Stack Superpuesto */}
                    <div
                      data-testid={`avatar-stack-${pref.id}`}
                      className="flex items-center -space-x-2"
                    >
                      <div
                        className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-900 shadow"
                        title={`Asesor: ${pref.vendedorNombre}`}
                      >
                        {pref.vendedorNombre.charAt(0)}
                      </div>
                      <div
                        className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-900 shadow"
                        title={`Cliente: ${pref.clienteNombre || 'Final'}`}
                      >
                        <User size={10} />
                      </div>
                    </div>
                  </div>

                  {/* Botón de Acción Rápida (Pasar a Cobro) */}
                  <button
                    data-testid={`btn-iniciar-cobro-${pref.id}`}
                    onClick={() => iniciarCobro(pref)}
                    className="w-full mt-2.5 py-1.5 px-3 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
                  >
                    <span>Pasar a Cobro (F9)</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: En Cobro Activo */}
        <div
          className="flex flex-col bg-slate-900/70 border border-white/10 rounded-2xl p-2.5 min-h-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDropOnColumn(e, 'EN_COBRO')}
        >
          {/* Cabecera con Status Pill Ámbar */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                En Cobro Activo
              </span>
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {colEnCobro.length}
            </span>
          </div>

          {/* Lista de Tarjetas en Cobro */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {colEnCobro.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                <span>Ningún cliente en ventanilla</span>
              </div>
            ) : (
              colEnCobro.map((pref) => (
                <div
                  key={pref.id}
                  className="bg-slate-800/90 border-2 border-amber-500/40 rounded-2xl p-3 shadow-xl shadow-amber-500/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      En Ventanilla
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{pref.codigoPreventa}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate mb-1">
                    {pref.clienteNombre || 'Consumidor Final'}
                  </h3>
                  <div className="text-lg font-black text-amber-400 mb-3">
                    ${pref.total.toLocaleString('es-CO')}
                  </div>

                  <button
                    onClick={() => iniciarCobro(pref)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer"
                  >
                    <CreditCard size={14} />
                    <span>Confirmar Pago de Venta</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 3: Pagado / Para Despacho */}
        <div className="flex flex-col bg-slate-900/70 border border-white/10 rounded-2xl p-2.5 min-h-0">
          {/* Cabecera con Status Pill Esmeralda */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Pagado / Para Despacho
              </span>
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {colPagadas.length}
            </span>
          </div>

          {/* Lista de Tarjetas Pagadas */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {colPagadas.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                <span>Sin pedidos pagados pendientes</span>
              </div>
            ) : (
              colPagadas.map((pref) => (
                <div
                  key={pref.id}
                  className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-3 shadow-lg transition-all opacity-90 hover:opacity-100"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      {pref.estado === 'DESPACHADA' ? 'Entregado' : 'Pagado'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {pref.facturaId || 'FAC-OK'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate mb-1">
                    {pref.clienteNombre || 'Consumidor Final'}
                  </h3>
                  <div className="text-sm font-black text-slate-200 mb-2">
                    ${pref.total.toLocaleString('es-CO')}
                  </div>

                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Receipt size={12} />
                    <span>Facturado · Asesor: {pref.vendedorNombre}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Modal de Cobro en Ventanilla */}
      {isModalCobroOpen && preventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-5 shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white">Cobro en Ventanilla</h2>
                <span className="text-xs text-slate-400 font-mono">
                  {preventaSeleccionada.codigoPreventa}
                </span>
              </div>
              <button
                onClick={cerrarModalCobro}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-400 block mb-1">Total a Recaudar</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                ${preventaSeleccionada.total.toLocaleString('es-CO')}
              </span>
              <span className="text-xs text-slate-300 block mt-1">
                Cliente: {preventaSeleccionada.clienteNombre || 'Consumidor Final'}
              </span>
            </div>

            {/* Selector de Método de Pago */}
            <div className="grid grid-cols-3 gap-2">
              {(['EFECTIVO', 'DATAFONO', 'TRANSFERENCIA'] as MetodoPagoPrefactura[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoSeleccionado(m)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    metodoSeleccionado === m
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Botón de Confirmación Definitiva */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={cerrarModalCobro}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                data-testid="btn-confirmar-recaudo-caja"
                onClick={handleConfirmarRecaudo}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                Confirmar Cobro (F9)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
