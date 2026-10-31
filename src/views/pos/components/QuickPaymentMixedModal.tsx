import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Send,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Prefactura, MetodoPagoPrefactura } from '../../../types/prefactura.types';
import {
  MixedPaymentSchema,
  type MetodoPagoItem,
  type MixedPaymentItem,
  type MixedPaymentPayload,
} from '../../../schemas/mixedPayment.schema';

export interface QuickPaymentMixedModalProps {
  isOpen: boolean;
  preventa: Prefactura | null;
  onClose: () => void;
  onConfirmarPago: (payload: MixedPaymentPayload) => Promise<void> | void;
}

export type TabCobro = 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'CREDITO' | 'MIXTO';

export const QuickPaymentMixedModal: React.FC<QuickPaymentMixedModalProps> = ({
  isOpen,
  preventa,
  onClose,
  onConfirmarPago,
}) => {
  if (!isOpen || !preventa) return null;

  // 1. Estado local de los ítems de la preventa (Permite edición libre en taquilla de precios/cantidades)
  const [itemsEditables, setItemsEditables] = useState<MixedPaymentItem[]>(() => {
    return (preventa.items || []).map((item) => ({
      productoId: item.productoId,
      sku: item.sku || '',
      nombre: item.nombre,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioFinal || item.precioLista),
      subtotal: Number(item.subtotal),
      notaItem: item.notaItem || '',
    }));
  });

  const [showItemsInspector, setShowItemsInspector] = useState(false);

  // Recalcular total dinámicamente según ítems editados
  const totalCalculado = useMemo(() => {
    if (itemsEditables.length === 0) return preventa.total;
    return itemsEditables.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario), 0);
  }, [itemsEditables, preventa.total]);

  // 2. Método de pago activo (Pestaña principal)
  const [tabActiva, setTabActiva] = useState<TabCobro>('EFECTIVO');

  // 3. Estados para modo Simple (Efectivo, Datáfono, Transferencia, Crédito)
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [referenciaComprobante, setReferenciaComprobante] = useState<string>('');
  const [plazoDias, setPlazoDias] = useState<number>(30);
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // 4. Estados para modo MIXTO (Múltiples líneas de pago)
  const [lineasMixtas, setLineasMixtas] = useState<MetodoPagoItem[]>([
    {
      metodo: 'EFECTIVO',
      monto: 0,
      efectivoRecibido: 0,
      vueltas: 0,
    },
  ]);

  // Al abrir el modal o cambiar el total, inicializar efectivo recibido
  useEffect(() => {
    setEfectivoRecibido(totalCalculado);
    setLineasMixtas([
      {
        metodo: 'EFECTIVO',
        monto: totalCalculado,
        efectivoRecibido: totalCalculado,
        vueltas: 0,
      },
    ]);
  }, [totalCalculado]);

  // Cálculo de vueltas en modo Efectivo Simple
  const vueltasEfectivoSimple = useMemo(() => {
    return Math.max(0, efectivoRecibido - totalCalculado);
  }, [efectivoRecibido, totalCalculado]);

  // Cálculo de suma de pagos y saldo por cubrir en modo Mixto
  const sumaPagosMixtos = useMemo(() => {
    return lineasMixtas.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  }, [lineasMixtas]);

  const saldoPorCubrirMixto = useMemo(() => {
    return Math.max(0, totalCalculado - sumaPagosMixtos);
  }, [totalCalculado, sumaPagosMixtos]);

  // Manejo de edición de ítems
  const handleUpdateItemPrecio = (productoId: string, nuevoPrecio: number) => {
    setItemsEditables((prev) =>
      prev.map((it) =>
        it.productoId === productoId
          ? { ...it, precioUnitario: nuevoPrecio, subtotal: it.cantidad * nuevoPrecio }
          : it
      )
    );
  };

  const handleUpdateItemCantidad = (productoId: string, nuevaCantidad: number) => {
    setItemsEditables((prev) =>
      prev.map((it) =>
        it.productoId === productoId
          ? { ...it, cantidad: nuevaCantidad, subtotal: nuevaCantidad * it.precioUnitario }
          : it
      )
    );
  };

  // Manejo de líneas mixtas
  const handleAddLineaMixta = () => {
    setLineasMixtas((prev) => [
      ...prev,
      {
        metodo: 'TRANSFERENCIA',
        monto: saldoPorCubrirMixto > 0 ? saldoPorCubrirMixto : 0,
        referencia: '',
      },
    ]);
  };

  const handleRemoveLineaMixta = (index: number) => {
    setLineasMixtas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineaMixta = (index: number, field: keyof MetodoPagoItem, value: any) => {
    setLineasMixtas((prev) =>
      prev.map((linea, idx) => {
        if (idx !== index) return linea;
        const updated = { ...linea, [field]: value };
        if (field === 'efectivoRecibido' || field === 'monto') {
          const rec = field === 'efectivoRecibido' ? Number(value) : (updated.efectivoRecibido || 0);
          const m = field === 'monto' ? Number(value) : (updated.monto || 0);
          updated.vueltas = Math.max(0, rec - m);
        }
        return updated;
      })
    );
  };

  // Confirmar y Construir Payload
  const handleConfirmar = useCallback(() => {
    let pagosFinales: MetodoPagoItem[] = [];

    if (tabActiva === 'MIXTO') {
      pagosFinales = lineasMixtas.map((l) => ({
        ...l,
        monto: Number(l.monto),
        efectivoRecibido: l.metodo === 'EFECTIVO' ? Number(l.efectivoRecibido || l.monto) : undefined,
        vueltas: l.metodo === 'EFECTIVO' ? Math.max(0, (Number(l.efectivoRecibido || l.monto) - Number(l.monto))) : undefined,
      }));
    } else if (tabActiva === 'EFECTIVO') {
      pagosFinales = [
        {
          metodo: 'EFECTIVO',
          monto: totalCalculado,
          efectivoRecibido: efectivoRecibido,
          vueltas: vueltasEfectivoSimple,
        },
      ];
    } else if (tabActiva === 'DATAFONO') {
      pagosFinales = [
        {
          metodo: 'DATAFONO',
          monto: totalCalculado,
          referencia: referenciaComprobante || undefined,
        },
      ];
    } else if (tabActiva === 'TRANSFERENCIA') {
      pagosFinales = [
        {
          metodo: 'TRANSFERENCIA',
          monto: totalCalculado,
          referencia: referenciaComprobante || undefined,
        },
      ];
    } else if (tabActiva === 'CREDITO') {
      pagosFinales = [
        {
          metodo: 'CREDITO',
          monto: totalCalculado,
          plazoDias: plazoDias,
          fechaVencimiento: fechaVencimiento,
        },
      ];
    }

    const payload: MixedPaymentPayload = {
      preventaId: preventa.id,
      codigoPreventa: preventa.codigoPreventa,
      totalVenta: totalCalculado,
      items: itemsEditables,
      pagos: pagosFinales,
      clienteNombre: preventa.clienteNombre || 'Consumidor Final',
      clienteDocumento: preventa.clienteDocumento,
    };

    const validation = MixedPaymentSchema.safeParse(payload);
    if (!validation.success) {
      alert(`Error en el recaudo: ${validation.error.issues[0]?.message || 'Verifique los montos ingresados'}`);
      return;
    }

    onConfirmarPago(validation.data);
  }, [
    tabActiva,
    lineasMixtas,
    totalCalculado,
    efectivoRecibido,
    vueltasEfectivoSimple,
    referenciaComprobante,
    plazoDias,
    fechaVencimiento,
    preventa,
    itemsEditables,
    onConfirmarPago,
  ]);

  // Listener para atajo F9 (Confirmar cobro) y Escape (Cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleConfirmar();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirmar, onClose]);

  // Validación si el botón Confirmar está habilitado
  const isSubmitDisabled = useMemo(() => {
    if (tabActiva === 'EFECTIVO') {
      return efectivoRecibido < totalCalculado;
    }
    if (tabActiva === 'MIXTO') {
      return Math.abs(sumaPagosMixtos - totalCalculado) > 0.01;
    }
    return false;
  }, [tabActiva, efectivoRecibido, totalCalculado, sumaPagosMixtos]);

  return (
    <div
      data-testid="modal-recaudo-mixto-taquilla"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-5 shadow-2xl shadow-black space-y-4 max-h-[92vh] overflow-y-auto">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Cobro en Ventanilla</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {preventa.codigoPreventa}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── DISPLAY DE TOTAL A RECAUDAR & CLIENTE ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span className="text-xs text-slate-400 block mb-1 font-medium">Total a Recaudar</span>
          <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
            ${totalCalculado.toLocaleString('es-CO')}
          </span>
          <span className="text-xs text-slate-300 block mt-1.5 font-semibold">
            Cliente: {preventa.clienteNombre || 'Consumidor Final'}
          </span>
        </div>

        {/* ── INSPECTOR DE ÍTEMS EN TAQUILLA (ACORDEÓN DISCRETO) ── */}
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            data-testid="btn-toggle-items-preventa"
            onClick={() => setShowItemsInspector((prev) => !prev)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="font-bold flex items-center gap-1.5">
              <span>📦 Ítems de la Preventa ({itemsEditables.length})</span>
              <span className="text-[10px] text-cyan-400 font-mono">Edición Libre</span>
            </span>
            {showItemsInspector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showItemsInspector && (
            <div className="p-3 border-t border-white/10 space-y-2 max-h-48 overflow-y-auto">
              {itemsEditables.map((it) => (
                <div
                  key={it.productoId}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{it.nombre}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{it.sku}</span>
                  </div>

                  {/* Input Cantidad */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Cant:</span>
                    <input
                      type="number"
                      min={1}
                      data-testid={`input-item-cantidad-${it.productoId}`}
                      value={it.cantidad}
                      onChange={(e) => handleUpdateItemCantidad(it.productoId, Number(e.target.value) || 1)}
                      className="w-14 bg-slate-900 border border-white/15 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Input Precio */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">$</span>
                    <input
                      type="number"
                      data-testid={`input-item-precio-${it.productoId}`}
                      value={it.precioUnitario}
                      onChange={(e) => handleUpdateItemPrecio(it.productoId, Number(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-white/15 rounded-lg px-1.5 py-1 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SELECTOR DE PESTAÑAS DE PAGO ── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {(['EFECTIVO', 'DATAFONO', 'TRANSFERENCIA', 'CREDITO', 'MIXTO'] as TabCobro[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabActiva(tab)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                tabActiva === tab
                  ? tab === 'CREDITO'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40 border border-cyan-400/40'
                    : tab === 'MIXTO'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/40'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tab === 'CREDITO' ? 'CRÉDITO' : tab}
            </button>
          ))}
        </div>

        {/* ── CONTENIDO DINÁMICO POR PESTAÑA ── */}

        {/* 1. MODO EFECTIVO SIMPLE */}
        {tabActiva === 'EFECTIVO' && (
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-400" />
                <span>Efectivo Recibido</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Total: ${totalCalculado.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">$</span>
              <input
                type="number"
                data-testid="input-efectivo-recibido"
                value={efectivoRecibido || ''}
                onChange={(e) => setEfectivoRecibido(Number(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="0"
              />
            </div>

            {/* Chips Rápidos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setEfectivoRecibido(totalCalculado)}
                className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
              >
                Exacto (${totalCalculado.toLocaleString('es-CO')})
              </button>
              {[10000, 20000, 50000, 100000].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => setEfectivoRecibido((prev) => (prev || 0) + add)}
                  className="py-1 px-2 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition-all cursor-pointer"
                >
                  +${(add / 1000).toFixed(0)}k
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEfectivoRecibido(0)}
                className="py-1 px-2 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 transition-all cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            {/* Display de Vueltas / Falta */}
            {efectivoRecibido >= totalCalculado ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Cambio a Entregar (Vueltas)
                  </span>
                  <span
                    className="text-xl font-black text-emerald-300 font-mono tracking-tight"
                    data-testid="badge-cambio-ventanilla"
                  >
                    ${vueltasEfectivoSimple.toLocaleString('es-CO')}
                  </span>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Pago Completo</span>
                </span>
              </div>
            ) : (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Efectivo Insuficiente
                  </span>
                  <span className="text-base font-black text-amber-300 font-mono tracking-tight">
                    Faltan ${(totalCalculado - efectivoRecibido).toLocaleString('es-CO')}
                  </span>
                </div>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>Incompleto</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* 2. MODO DATÁFONO / TRANSFERENCIA */}
        {(tabActiva === 'DATAFONO' || tabActiva === 'TRANSFERENCIA') && (
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                {tabActiva === 'DATAFONO' ? <CreditCard size={14} className="text-emerald-400" /> : <Send size={14} className="text-cyan-400" />}
                <span>Recaudo Total por {tabActiva}</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${totalCalculado.toLocaleString('es-CO')}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nº Comprobante / Aprobación (Opcional)
              </label>
              <input
                type="text"
                value={referenciaComprobante}
                onChange={(e) => setReferenciaComprobante(e.target.value)}
                placeholder="Ej: APROB-84920 / NEQUI-7482"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* 3. MODO CRÉDITO */}
        {tabActiva === 'CREDITO' && (
          <div className="space-y-3 bg-white/5 border border-cyan-500/20 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar size={14} className="text-cyan-400" />
                <span>Plazo de Crédito (Días)</span>
              </span>
              <span className="text-xs font-mono text-cyan-300 font-black bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                {plazoDias} días
              </span>
            </div>

            {/* Chips de Plazo */}
            <div className="grid grid-cols-5 gap-1.5">
              {[8, 15, 30, 45, 60].map((dias) => (
                <button
                  key={dias}
                  type="button"
                  onClick={() => {
                    setPlazoDias(dias);
                    const d = new Date();
                    d.setDate(d.getDate() + dias);
                    setFechaVencimiento(d.toISOString().split('T')[0]);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    plazoDias === dias
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {dias}d
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                Fecha Límite / Vencimiento
              </label>
              <input
                type="date"
                data-testid="input-fecha-limite-credito"
                value={fechaVencimiento}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-[11px] text-slate-300 bg-cyan-950/30 border border-cyan-500/20 p-2.5 rounded-xl leading-relaxed">
              ℹ️ Se registrará en <strong>Cartera</strong> a nombre de <strong className="text-white">{preventa.clienteNombre || 'Consumidor Final'}</strong> con vencimiento el <strong className="text-cyan-300 font-mono">{fechaVencimiento}</strong>.
            </div>
          </div>
        )}

        {/* 4. MODO PAGO MIXTO / DIVIDIDO */}
        {tabActiva === 'MIXTO' && (
          <div className="space-y-3 bg-white/5 border border-indigo-500/20 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-400" />
                  <span>Pago Dividido / Mixto</span>
                </h4>
                <span className="text-[10px] text-slate-400">Combine efectivo, tarjetas y transferencias</span>
              </div>
              <button
                type="button"
                onClick={handleAddLineaMixta}
                className="py-1 px-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Agregar Método</span>
              </button>
            </div>

            {/* Lista de Líneas de Pago */}
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {lineasMixtas.map((linea, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={linea.metodo}
                      onChange={(e) => handleUpdateLineaMixta(idx, 'metodo', e.target.value as any)}
                      className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="DATAFONO">Datáfono / Tarjeta</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="CREDITO">Crédito</option>
                    </select>

                    <div className="flex items-center gap-1 flex-1 max-w-[140px]">
                      <span className="text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        placeholder="Monto"
                        value={linea.monto || ''}
                        onChange={(e) => handleUpdateLineaMixta(idx, 'monto', Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold text-right focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {lineasMixtas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineaMixta(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {linea.metodo === 'EFECTIVO' && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Recibido: $</span>
                        <input
                          type="number"
                          placeholder="Recibido"
                          value={linea.efectivoRecibido || ''}
                          onChange={(e) => handleUpdateLineaMixta(idx, 'efectivoRecibido', Number(e.target.value) || 0)}
                          className="w-20 bg-slate-900 border border-white/15 rounded px-1.5 py-0.5 text-xs text-white font-mono text-right"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        Vueltas: ${linea.vueltas?.toLocaleString('es-CO') || '0'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Balance de Pago Mixto */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Cubierto</span>
                <span className="font-mono font-bold text-white">${sumaPagosMixtos.toLocaleString('es-CO')}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Saldo por Cubrir</span>
                <span
                  className={`font-mono font-bold ${
                    saldoPorCubrirMixto === 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ${saldoPorCubrirMixto.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ACTIONS ── */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center border border-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirmar-recaudo-caja"
            disabled={isSubmitDisabled}
            onClick={handleConfirmar}
            className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center cursor-pointer ${
              isSubmitDisabled
                ? 'bg-slate-700 opacity-50 cursor-not-allowed border border-white/5'
                : tabActiva === 'CREDITO'
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30 border border-cyan-400/40'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 border border-emerald-400/40 active:scale-95'
            }`}
          >
            {tabActiva === 'CREDITO' ? 'Aprobar Crédito' : 'Confirmar Cobro (F9)'}
          </button>
        </div>
      </div>
    </div>
  );
};
