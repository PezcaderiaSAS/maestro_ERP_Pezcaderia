import React, { useState, useMemo } from 'react';
import {
  Truck,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Package,
  Scale,
  Search,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  crearGuiaTraslado,
  confirmarRecepcionTraslado,
  cancelarTraslado,
  obtenerTraslados,
} from '../../../services/inventoryService';
import { load } from '../../../services/localDb';
import type { WarehouseTransfer, EstadoTraslado, Product } from '../../../types/erp.types';
import type { Bodega } from '../../../services/warehouseService';

interface WarehouseTransferPanelProps {
  bodegas?: Bodega[];
  products?: Product[];
  onTransferComplete?: () => void;
}

export const WarehouseTransferPanel: React.FC<WarehouseTransferPanelProps> = ({
  bodegas = [],
  products = [],
  onTransferComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'TRANSITO' | 'NUEVO' | 'HISTORIAL'>('TRANSITO');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario de Nueva Guía
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidadKg, setCantidadKg] = useState<number | ''>('');
  const [usuarioDespacha, setUsuarioDespacha] = useState('Bodeguero Central');
  const [notas, setNotas] = useState('');

  // Cargar lista de traslados
  const traslados = useMemo(() => {
    return obtenerTraslados();
  }, [refreshTrigger]);

  const stockDict = useMemo(() => {
    return load<Record<string, Record<string, number>>>('stock', {});
  }, [refreshTrigger]);

  // Bodegas activas
  const bodegasActivas = useMemo(() => {
    return bodegas.length > 0
      ? bodegas.filter((b) => b.activa !== false)
      : [
          { id: 'bodega-principal', nombre: 'Cuarto Frío Principal', activa: true },
          { id: 'bodega-pos', nombre: 'Punto de Venta Mostrador', activa: true },
          { id: 'bodega-congelados', nombre: 'Cámara de Congelación', activa: true },
        ];
  }, [bodegas]);

  // Producto seleccionado para traslado
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId || p.sku === selectedProductId);
  }, [products, selectedProductId]);

  // Stock disponible en la bodega de origen seleccionada
  const stockDisponibleOrigen = useMemo(() => {
    if (!origenId || !selectedProduct) return 0;
    const sku = selectedProduct.sku;
    return stockDict[origenId]?.[sku] || 0;
  }, [stockDict, origenId, selectedProduct]);

  // Filtrado de traslados en tránsito
  const trasladosEnTransito = useMemo(() => {
    return traslados.filter((t) => t.estado === 'EN_TRANSITO');
  }, [traslados]);

  // Filtrado de historial
  const historialFiltrado = useMemo(() => {
    return traslados
      .filter((t) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const matchGuia = t.codigo_guia.toLowerCase().includes(term);
        const matchOrigen = t.bodega_origen_nombre.toLowerCase().includes(term);
        const matchDestino = t.bodega_destino_nombre.toLowerCase().includes(term);
        const matchItem = t.items.some((i) => i.nombre.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term));
        return matchGuia || matchOrigen || matchDestino || matchItem;
      })
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
  }, [traslados, searchTerm]);

  // Emitir nueva guía
  const handleCrearGuia = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origenId || !destinoId) {
      Swal.fire({
        icon: 'warning',
        title: 'Bodegas requeridas',
        text: 'Debes seleccionar tanto la bodega de origen como la bodega de destino.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (origenId === destinoId) {
      Swal.fire({
        icon: 'error',
        title: 'Bodegas idénticas',
        text: 'La bodega de origen y destino no pueden ser la misma.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (!selectedProduct || !cantidadKg || Number(cantidadKg) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto y cantidad inválidos',
        text: 'Ingresa un producto válido y una cantidad mayor a cero en kilogramos.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (Number(cantidadKg) > stockDisponibleOrigen) {
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente en origen',
        text: `La bodega origen solo dispone de ${stockDisponibleOrigen} Kg de ${selectedProduct.nombre}.`,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    const bodegaOrigen = bodegasActivas.find((b) => b.id === origenId);
    const bodegaDestino = bodegasActivas.find((b) => b.id === destinoId);

    const res = crearGuiaTraslado({
      bodega_origen_id: origenId,
      bodega_origen_nombre: bodegaOrigen?.nombre || origenId,
      bodega_destino_id: destinoId,
      bodega_destino_nombre: bodegaDestino?.nombre || destinoId,
      usuario_despacha: usuarioDespacha || 'Sistema',
      notas,
      items: [
        {
          producto_id: selectedProduct.id,
          sku: selectedProduct.sku,
          nombre: selectedProduct.nombre,
          cantidad_kg: Number(cantidadKg),
          costo_unitario: selectedProduct.costo_promedio_ponderado || selectedProduct.precio_compra || 0,
        },
      ],
    });

    if (res.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al emitir guía',
        text: res.error,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Guía de Traslado Emitida!',
      text: `Guía ${res.data?.codigo_guia} en tránsito hacia ${bodegaDestino?.nombre}. Stock bloqueado en origen.`,
      background: '#0f172a',
      color: '#f8fafc',
    });

    // Limpiar formulario y refrescar
    setCantidadKg('');
    setNotas('');
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('TRANSITO');
    onTransferComplete?.();
  };

  // Confirmar recepción
  const handleConfirmarRecepcion = async (traslado: WarehouseTransfer) => {
    const { value: usuarioRecibe } = await Swal.fire({
      title: `Confirmar Recepción: ${traslado.codigo_guia}`,
      html: `
        <div class="text-left text-sm text-slate-300 space-y-2 mb-3">
          <p><strong>Destino:</strong> ${traslado.bodega_destino_nombre}</p>
          <p><strong>Mercancía:</strong> ${traslado.items.map((i) => `${i.cantidad_kg} Kg de ${i.nombre}`).join(', ')}</p>
          <p class="text-xs text-amber-400">Al confirmar, el stock se acreditará automáticamente en la bodega destino y se generará el movimiento en Kardex.</p>
        </div>
      `,
      input: 'text',
      inputLabel: 'Nombre del Responsable que Recibe en Destino:',
      inputValue: 'Bodeguero Destino',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Recepción Conforme',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      background: '#0f172a',
      color: '#f8fafc',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar el nombre del responsable que recibe';
        }
        return null;
      },
    });

    if (usuarioRecibe) {
      const res = confirmarRecepcionTraslado(traslado.id, usuarioRecibe.trim());
      if (res.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error en confirmación',
          text: res.error,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: '¡Traslado Recibido!',
        text: `La mercancía ha ingresado exitosamente a ${traslado.bodega_destino_nombre}.`,
        background: '#0f172a',
        color: '#f8fafc',
      });

      setRefreshTrigger((prev) => prev + 1);
      onTransferComplete?.();
    }
  };

  // Cancelar traslado
  const handleCancelar = async (traslado: WarehouseTransfer) => {
    const { value: motivo } = await Swal.fire({
      title: `¿Cancelar Traslado ${traslado.codigo_guia}?`,
      text: 'La mercancía en tránsito será devuelta inmediatamente a la bodega de origen.',
      input: 'text',
      inputLabel: 'Motivo de cancelación:',
      inputPlaceholder: 'Ej: Error en destino, producto devuelto...',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar y revertir stock',
      cancelButtonText: 'No, mantener en tránsito',
      confirmButtonColor: '#ef4444',
      background: '#0f172a',
      color: '#f8fafc',
    });

    if (motivo !== undefined) {
      const res = cancelarTraslado(traslado.id, motivo || 'Cancelado por usuario');
      if (res.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error al cancelar',
          text: res.error,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      Swal.fire({
        icon: 'info',
        title: 'Traslado Cancelado',
        text: 'El stock ha sido reintegrado a la bodega de origen.',
        background: '#0f172a',
        color: '#f8fafc',
      });

      setRefreshTrigger((prev) => prev + 1);
      onTransferComplete?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-navegación ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('TRANSITO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'TRANSITO'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            En Tránsito ({trasladosEnTransito.length})
          </button>

          <button
            onClick={() => setActiveTab('NUEVO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'NUEVO'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Emitir Nueva Guía
          </button>

          <button
            onClick={() => setActiveTab('HISTORIAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'HISTORIAL'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Historial de Traslados
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>Control Logístico Multibodega</span>
        </div>
      </div>

      {/* ── TAB 1: En Tránsito ── */}
      {activeTab === 'TRANSITO' && (
        <div className="space-y-4">
          {trasladosEnTransito.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No hay traslados en tránsito</h3>
              <p className="text-sm text-slate-400 mb-4">
                Todas las mercancías transferidas han sido recibidas y verificadas en destino.
              </p>
              <button
                onClick={() => setActiveTab('NUEVO')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Crear Nuevo Traslado
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trasladosEnTransito.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900/70 backdrop-blur-xl border border-cyan-500/30 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-cyan-500/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                      {t.codigo_guia}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Clock className="w-3 h-3 animate-spin" />
                      EN TRÁNSITO
                    </span>
                  </div>

                  {/* Ruta */}
                  <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Origen</span>
                      <span className="text-xs font-semibold text-slate-200">{t.bodega_origen_nombre}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Destino</span>
                      <span className="text-xs font-semibold text-slate-200">{t.bodega_destino_nombre}</span>
                    </div>
                  </div>

                  {/* Ítems */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Mercancía Despachada:
                    </span>
                    {t.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2.5 bg-white/[0.02] rounded-lg border border-white/5"
                      >
                        <span className="font-medium text-white">
                          {item.sku} - {item.nombre}
                        </span>
                        <span className="font-bold text-cyan-300 font-mono">{item.cantidad_kg} Kg</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 mb-4 flex items-center justify-between">
                    <span>Despachado por: <strong className="text-slate-200">{t.usuario_despacha}</strong></span>
                    <span>{new Date(t.fecha_creacion).toLocaleDateString('es-CO')}</span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleConfirmarRecepcion(t)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Recepción
                    </button>

                    <button
                      onClick={() => handleCancelar(t)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                      title="Cancelar y reintegrar a origen"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Formulario de Nueva Guía ── */}
      {activeTab === 'NUEVO' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Emisión de Guía de Traslado Interno
          </h3>

          <form onSubmit={handleCrearGuia} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bodega Origen */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Bodega / Cuarto Frío Origen *
                </label>
                <select
                  value={origenId}
                  onChange={(e) => setOrigenId(e.target.value)}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  required
                >
                  <option value="">-- Selecciona Origen --</option>
                  {bodegasActivas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bodega Destino */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Bodega / Punto de Venta Destino *
                </label>
                <select
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  required
                >
                  <option value="">-- Selecciona Destino --</option>
                  {bodegasActivas
                    .filter((b) => b.id !== origenId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Selección de Producto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Producto a Trasladar *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  required
                >
                  <option value="">-- Selecciona Producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad en Kg */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Cantidad (Kg) *</label>
                  {origenId && selectedProduct && (
                    <span className="text-[11px] text-cyan-400 font-mono">
                      Disp: {stockDisponibleOrigen} Kg
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.000"
                  value={cantidadKg}
                  onChange={(e) => setCantidadKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Despachado Por (Responsable)
                </label>
                <input
                  type="text"
                  value={usuarioDespacha}
                  onChange={(e) => setUsuarioDespacha(e.target.value)}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Notas / Observaciones de Transporte
                </label>
                <input
                  type="text"
                  placeholder="Ej: Traslado urgente para turno de tarde..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('TRANSITO')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                Emitir Guía de Traslado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: Historial de Traslados ── */}
      {activeTab === 'HISTORIAL' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por guía, bodega o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Total Registros: {historialFiltrado.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Código Guía</th>
                  <th className="py-3 px-3">Fecha Creación</th>
                  <th className="py-3 px-3">Origen $\to$ Destino</th>
                  <th className="py-3 px-3">Productos / Kilos</th>
                  <th className="py-3 px-3">Despachó</th>
                  <th className="py-3 px-3">Recibió</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {historialFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No se encontraron registros de traslados.
                    </td>
                  </tr>
                ) : (
                  historialFiltrado.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{t.codigo_guia}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(t.fecha_creacion).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {t.bodega_origen_nombre} $\to$ {t.bodega_destino_nombre}
                      </td>
                      <td className="py-2.5 px-3">
                        {t.items.map((i, idx) => (
                          <span key={idx} className="block text-[11px]">
                            {i.cantidad_kg} Kg {i.nombre}
                          </span>
                        ))}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{t.usuario_despacha}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {t.usuario_recibe ? (
                          <span className="text-emerald-400 font-medium">{t.usuario_recibe}</span>
                        ) : (
                          <span className="text-slate-500">Pendiente</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.estado === 'RECIBIDO_CONFORME'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : t.estado === 'EN_TRANSITO'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {t.estado.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
