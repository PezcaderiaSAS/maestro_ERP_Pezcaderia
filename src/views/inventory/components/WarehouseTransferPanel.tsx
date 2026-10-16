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
  Search,
  RotateCcw,
  Sparkles,
  Store,
  Snowflake,
  Fish,
  Waves,
  UtensilsCrossed,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { InternalTransferKanban } from './InternalTransferKanban';
import Swal from 'sweetalert2';
import {
  crearGuiaTraslado,
  confirmarRecepcionTraslado,
  cancelarTraslado,
  obtenerTraslados,
} from '../../../services/inventoryService';
import { load } from '../../../services/localDb';
import type { WarehouseTransfer, Product } from '../../../types/erp.types';
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
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'TRANSITO' | 'NUEVO' | 'HISTORIAL'>('TRANSITO');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Wizard de Traslados en 2 Pasos (Regla del Niño de 12 Años) ──
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidadKg, setCantidadKg] = useState<number | ''>('');
  const [usuarioDespacha, setUsuarioDespacha] = useState('Bodeguero Central');
  const [notas, setNotas] = useState('');
  const [productSearch, setProductSearch] = useState('');

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

  // Inicializar origen por defecto si está vacío
  const activeOrigenId = origenId || bodegasActivas[0]?.id || 'bodega-principal';

  // Bodega origen y destino activas
  const bodegaOrigenActiva = useMemo(() => {
    return bodegasActivas.find((b) => b.id === activeOrigenId);
  }, [bodegasActivas, activeOrigenId]);

  const bodegaDestinoActiva = useMemo(() => {
    return bodegasActivas.find((b) => b.id === destinoId);
  }, [bodegasActivas, destinoId]);

  // Producto seleccionado para traslado
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId || p.sku === selectedProductId);
  }, [products, selectedProductId]);

  // Stock disponible en la bodega de origen seleccionada
  const stockDisponibleOrigen = useMemo(() => {
    if (!activeOrigenId || !selectedProduct) return 0;
    const sku = selectedProduct.sku;
    return stockDict[activeOrigenId]?.[sku] || 0;
  }, [stockDict, activeOrigenId, selectedProduct]);

  // Filtrado de productos para el catálogo del Paso 2
  const productosFiltrados = useMemo(() => {
    if (!productSearch.trim()) return products;
    const term = productSearch.toLowerCase();
    return products.filter(
      (p) => p.nombre.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

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
        const matchItem = t.items.some(
          (i) => i.nombre.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term)
        );
        return matchGuia || matchOrigen || matchDestino || matchItem;
      })
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
  }, [traslados, searchTerm]);

  // Icono semántico de especie/producto (Cero imágenes externas)
  const getProductIcon = (categoria?: string) => {
    const cat = (categoria || '').toLowerCase();
    if (cat.includes('pescado') || cat.includes('salmon') || cat.includes('trucha') || cat.includes('mojarra')) {
      return <Fish className="w-5 h-5 text-cyan-600" />;
    }
    if (cat.includes('marisco') || cat.includes('camaron') || cat.includes('langostino')) {
      return <Waves className="w-5 h-5 text-amber-600" />;
    }
    if (cat.includes('filete') || cat.includes('porc') || cat.includes('corte')) {
      return <UtensilsCrossed className="w-5 h-5 text-emerald-600" />;
    }
    if (cat.includes('congelado')) {
      return <Snowflake className="w-5 h-5 text-blue-600" />;
    }
    return <Package className="w-5 h-5 text-slate-600" />;
  };

  // Icono semántico de bodega
  const getBodegaIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('pos') || n.includes('mostrador') || n.includes('punto')) {
      return <Store className="w-6 h-6 text-emerald-600" />;
    }
    if (n.includes('congel') || n.includes('frio') || n.includes('frío')) {
      return <Snowflake className="w-6 h-6 text-cyan-600" />;
    }
    return <Building2 className="w-6 h-6 text-indigo-600" />;
  };

  // Helper para sumar kilos rápidamente con 1 toque
  const handleQuickAddKilos = (kilosToAdd: number) => {
    const current = typeof cantidadKg === 'number' ? cantidadKg : 0;
    const newVal = Math.max(0, Number((current + kilosToAdd).toFixed(3)));
    setCantidadKg(newVal);
  };

  // Emitir nueva guía
  const handleCrearGuia = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalOrigenId = activeOrigenId;
    if (!finalOrigenId || !destinoId) {
      Swal.fire({
        icon: 'warning',
        title: 'Bodegas requeridas',
        text: 'Debes seleccionar tanto la bodega de origen como la bodega de destino.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    if (finalOrigenId === destinoId) {
      Swal.fire({
        icon: 'error',
        title: 'Bodegas idénticas',
        text: 'La bodega de origen y destino no pueden ser la misma.',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    if (!selectedProduct || !cantidadKg || Number(cantidadKg) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto y cantidad inválidos',
        text: 'Ingresa un producto válido y una cantidad mayor a cero en kilogramos.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    if (Number(cantidadKg) > stockDisponibleOrigen) {
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente en origen',
        text: `La bodega origen solo dispone de ${stockDisponibleOrigen} Kg de ${selectedProduct.nombre}.`,
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const bodegaOrigen = bodegasActivas.find((b) => b.id === finalOrigenId);
    const bodegaDestino = bodegasActivas.find((b) => b.id === destinoId);

    const res = crearGuiaTraslado({
      bodega_origen_id: finalOrigenId,
      bodega_origen_nombre: bodegaOrigen?.nombre || finalOrigenId,
      bodega_destino_id: destinoId,
      bodega_destino_nombre: bodegaDestino?.nombre || destinoId,
      usuario_despacha: usuarioDespacha || 'Bodeguero Central',
      notas: notas || 'Traslado rápido entre sucursales',
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
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Guía de Traslado Emitida!',
      text: `Guía ${res.data?.codigo_guia} despachada hacia ${bodegaDestino?.nombre}. Mercancía en tránsito.`,
      confirmButtonColor: '#10b981',
    });

    // Resetear formulario y volver a pestaña En Tránsito
    setCantidadKg('');
    setNotas('');
    setSelectedProductId('');
    setWizardStep(1);
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('TRANSITO');
    onTransferComplete?.();
  };

  // Confirmar recepción
  const handleConfirmarRecepcion = async (traslado: WarehouseTransfer) => {
    const { value: usuarioRecibe } = await Swal.fire({
      title: `Confirmar Recepción: ${traslado.codigo_guia}`,
      html: `
        <div class="text-left text-sm text-slate-700 space-y-2 mb-3">
          <p><strong>Destino:</strong> ${traslado.bodega_destino_nombre}</p>
          <p><strong>Mercancía:</strong> ${traslado.items.map((i) => `${i.cantidad_kg} Kg de ${i.nombre}`).join(', ')}</p>
          <p class="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
            Al confirmar, el stock se acreditará automáticamente en la bodega destino y se asentará en el Kardex.
          </p>
        </div>
      `,
      input: 'text',
      inputLabel: 'Nombre del Responsable que Recibe en Destino:',
      inputValue: 'Bodeguero Destino',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Recepción Conforme',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
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
          confirmButtonColor: '#ef4444',
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: '¡Traslado Recibido!',
        text: `La mercancía ha ingresado exitosamente a ${traslado.bodega_destino_nombre}.`,
        confirmButtonColor: '#10b981',
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
    });

    if (motivo !== undefined) {
      const res = cancelarTraslado(traslado.id, motivo || 'Cancelado por usuario');
      if (res.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error al cancelar',
          text: res.error,
          confirmButtonColor: '#ef4444',
        });
        return;
      }

      Swal.fire({
        icon: 'info',
        title: 'Traslado Cancelado',
        text: 'El stock ha sido reintegrado a la bodega de origen.',
        confirmButtonColor: '#0284c7',
      });

      setRefreshTrigger((prev) => prev + 1);
      onTransferComplete?.();
    }
  };

  // Validación de exceso de stock
  const isExcedidoStock = Boolean(
    selectedProduct && typeof cantidadKg === 'number' && cantidadKg > stockDisponibleOrigen
  );

  return (
    <div className="space-y-6 text-slate-900">
      {/* ── Sub-navegación Canónica ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('KANBAN')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'KANBAN'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Flujo Kanban (Bodega ➔ POS)
          </button>

          <button
            onClick={() => setActiveTab('TRANSITO')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'TRANSITO'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            En Tránsito ({trasladosEnTransito.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('NUEVO');
              setWizardStep(1);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'NUEVO'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Emitir Nueva Guía
          </button>

          <button
            onClick={() => setActiveTab('HISTORIAL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'HISTORIAL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Historial de Traslados
          </button>
        </div>

        <div className="text-xs text-slate-600 font-medium flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Truck className="w-4 h-4 text-cyan-600" />
          <span>Control Logístico Multibodega</span>
        </div>
      </div>

      {/* ── TAB 0: Flujo Kanban Bodega ➔ POS ── */}
      {activeTab === 'KANBAN' && (
        <InternalTransferKanban
          products={products}
          bodegaDestinoId="bodega-pos"
          bodegaDestinoNombre="Punto de Venta Mostrador"
        />
      )}

      {/* ── TAB 1: En Tránsito ── */}
      {activeTab === 'TRANSITO' && (
        <div className="space-y-4">
          {trasladosEnTransito.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">No hay traslados en tránsito</h3>
              <p className="text-sm text-slate-600 mb-4">
                Todas las mercancías transferidas han sido recibidas y verificadas en destino.
              </p>
              <button
                onClick={() => {
                  setActiveTab('NUEVO');
                  setWizardStep(1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
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
                  className="bg-white border-2 border-cyan-200 hover:border-cyan-400 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-cyan-900 bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200">
                      {t.codigo_guia}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock className="w-3 h-3 animate-spin" />
                      EN TRÁNSITO
                    </span>
                  </div>

                  {/* Ruta */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Origen</span>
                      <span className="text-xs font-bold text-slate-800">{t.bodega_origen_nombre}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-600 shrink-0" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Destino</span>
                      <span className="text-xs font-bold text-slate-800">{t.bodega_destino_nombre}</span>
                    </div>
                  </div>

                  {/* Ítems */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Mercancía Despachada:
                    </span>
                    {t.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <span className="font-semibold text-slate-900">
                          {item.sku} - {item.nombre}
                        </span>
                        <span className="font-bold text-cyan-700 font-mono">{item.cantidad_kg} Kg</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600 mb-4 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span>
                      Despachado por: <strong className="text-slate-900">{t.usuario_despacha}</strong>
                    </span>
                    <span>{new Date(t.fecha_creacion).toLocaleDateString('es-CO')}</span>
                  </div>

                  {/* Botones de acción ergonómicos */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleConfirmarRecepcion(t)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 touch-manipulation transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Recepción
                    </button>

                    <button
                      onClick={() => handleCancelar(t)}
                      className="px-3 py-2.5 min-h-[48px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold active:scale-95 touch-manipulation transition-all cursor-pointer"
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

      {/* ── TAB 2: Wizard de Nueva Guía en 2 Toques (Regla del Niño de 12 Años) ── */}
      {activeTab === 'NUEVO' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg space-y-6">
          {/* Header & Stepper Visual en 2 Pasos */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Wizard de Traslados a Sucursales
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Regla del Niño de 12 Años: completa el traslado en solo 2 pasos asistidos
                  </p>
                </div>
              </div>

              {/* Selector de Bodega Origen */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold">Origen:</span>
                <select
                  value={activeOrigenId}
                  onChange={(e) => setOrigenId(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  {bodegasActivas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stepper Táctil */}
            <div className="grid grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  wizardStep === 1
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                    wizardStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold">Paso 1</div>
                  <div className="text-sm font-semibold">¿A dónde lo enviamos?</div>
                </div>
              </button>

              <button
                type="button"
                disabled={!destinoId}
                onClick={() => destinoId && setWizardStep(2)}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                  wizardStep === 2
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-sm cursor-pointer'
                    : destinoId
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                    : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                    wizardStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold">Paso 2</div>
                  <div className="text-sm font-semibold">Producto y Kilos</div>
                </div>
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* PASO 1: SELECCIÓN DE SUCURSAL / DESTINO EN 1 TOQUE                   */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 mb-1">
                  1. ¿A dónde lo enviamos? (Paso 1: Destino)
                </h4>
                <p className="text-xs text-slate-600">
                  Toca la sucursal o cuarto frío que recibirá la mercancía transferida.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {bodegasActivas
                  .filter((b) => b.id !== activeOrigenId)
                  .map((b) => {
                    const isSelected = destinoId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        data-testid="target-bodega-card"
                        id={`target-bodega-${b.id}`}
                        onClick={() => {
                          setDestinoId(b.id);
                          if (!selectedProductId && products.length > 0) {
                            setSelectedProductId(products[0].id);
                          }
                          setWizardStep(2);
                        }}
                        className={`min-h-[64px] h-20 p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-95 touch-manipulation ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500 shadow-md'
                            : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <span data-testid={`target-bodega-${b.id}`} className="sr-only">
                          {b.nombre}
                        </span>
                        <div
                          className={`p-2.5 rounded-xl ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {getBodegaIcon(b.nombre)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{b.nombre}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {isSelected ? '✓ Seleccionado' : 'Toca para elegir'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {destinoId && (
                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProductId && products.length > 0) {
                        setSelectedProductId(products[0].id);
                      }
                      setWizardStep(2);
                    }}
                    className="flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 touch-manipulation cursor-pointer"
                  >
                    <span>Continuar al Paso 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* PASO 2: SELECCIÓN DE PRODUCTO Y CANTIDAD RÁPIDA                     */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 touch-manipulation cursor-pointer"
                    title="Cambiar destino"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      2. ¿Qué producto y cuántos kilos? (Paso 2: Producto y Kilos)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Destino:{' '}
                      <strong className="text-emerald-700">{bodegaDestinoActiva?.nombre}</strong> |
                      Origen:{' '}
                      <strong className="text-slate-800">{bodegaOrigenActiva?.nombre}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Cambiar Destino
                </button>
              </div>

              {/* Catálogo Visual con Buscador Táctil */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 min-h-[48px] h-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {productosFiltrados.map((p) => {
                    const isSelected = selectedProductId === p.id || selectedProductId === p.sku;
                    const stockDisp = stockDict[activeOrigenId]?.[p.sku] || 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-testid={`product-card-${p.sku}`}
                        onClick={() => setSelectedProductId(p.id)}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 text-left transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                            {getProductIcon(p.categoria)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold truncate text-slate-900">{p.nombre}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${
                              stockDisp > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {stockDisp} Kg
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalle del Producto Seleccionado y Controles de Kilos */}
              {selectedProduct ? (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        {getProductIcon(selectedProduct.categoria)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{selectedProduct.nombre}</div>
                        <div className="text-xs text-slate-500 font-mono">SKU: {selectedProduct.sku}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Stock Disponible en Origen:</span>
                      <span
                        className={`text-base font-black font-mono ${
                          stockDisponibleOrigen > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {stockDisponibleOrigen} Kg
                      </span>
                    </div>
                  </div>

                  {/* Input de Kilos con Teclado Numérico */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Kilogramos a Trasladar *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        max={stockDisponibleOrigen}
                        placeholder="0.000"
                        data-testid="transfer-kilos-input"
                        value={cantidadKg}
                        onChange={(e) =>
                          setCantidadKg(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className={`w-full bg-white border-2 rounded-2xl px-4 py-3 min-h-[48px] h-14 text-xl font-black font-mono text-slate-900 focus:outline-none transition-colors ${
                          isExcedidoStock
                            ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                        }`}
                        required
                      />
                      <span className="text-base font-bold text-slate-600 pr-2">Kg</span>
                    </div>

                    {isExcedidoStock && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Stock insuficiente en origen. La bodega solo dispone de {stockDisponibleOrigen} Kg.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de Incremento Rápido de 1 Toque (Regla del Niño de 12 Años) */}
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-2 uppercase">
                      Incremento Rápido con 1 Toque:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: '+1 Kg', val: 1 },
                        { label: '+5 Kg', val: 5 },
                        { label: '+10 Kg', val: 10 },
                        { label: '+20 Kg (Canastilla)', val: 20 },
                        { label: 'Todo el Stock', val: stockDisponibleOrigen, isMax: true },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          data-testid="quick-kilo-btn"
                          onClick={() => {
                            if (item.isMax) {
                              setCantidadKg(stockDisponibleOrigen);
                            } else {
                              handleQuickAddKilos(item.val);
                            }
                          }}
                          className="min-h-[48px] h-12 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-500 text-slate-800 hover:text-emerald-900 font-bold text-xs border border-slate-300 shadow-2xs active:scale-95 touch-manipulation transition-all cursor-pointer flex items-center justify-center text-center"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notas y Responsable (Opcionales y Simplificados) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Responsable que Despacha:
                      </label>
                      <input
                        type="text"
                        value={usuarioDespacha}
                        onChange={(e) => setUsuarioDespacha(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Motivo / Observaciones:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Abastecimiento para mostrador..."
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500 text-xs">
                  Selecciona un producto del catálogo de arriba para ingresar la cantidad a trasladar.
                </div>
              )}

              {/* Botón Principal Gigante de Confirmación (min-h-[56px]) */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2.5 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Atrás (Paso 1)
                </button>

                <button
                  type="button"
                  data-testid="submit-transfer-btn"
                  disabled={
                    !selectedProduct ||
                    !cantidadKg ||
                    Number(cantidadKg) <= 0 ||
                    isExcedidoStock
                  }
                  onClick={() => handleCrearGuia()}
                  className={`flex items-center justify-center gap-3 px-8 py-4 min-h-[56px] h-14 rounded-2xl font-black text-sm tracking-wide shadow-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
                    !selectedProduct || !cantidadKg || Number(cantidadKg) <= 0 || isExcedidoStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>DESPACHAR TRASLADO AHORA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Historial de Traslados ── */}
      {activeTab === 'HISTORIAL' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por guía, bodega o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <span className="text-xs text-slate-600 font-mono font-medium">
              Total Registros: {historialFiltrado.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Código Guía</th>
                  <th className="py-3 px-3">Fecha Creación</th>
                  <th className="py-3 px-3">Origen $\to$ Destino</th>
                  <th className="py-3 px-3">Productos / Kilos</th>
                  <th className="py-3 px-3">Despachó</th>
                  <th className="py-3 px-3">Recibió</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {historialFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No se encontraron registros de traslados.
                    </td>
                  </tr>
                ) : (
                  historialFiltrado.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-800">{t.codigo_guia}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(t.fecha_creacion).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {t.bodega_origen_nombre} $\to$ {t.bodega_destino_nombre}
                      </td>
                      <td className="py-2.5 px-3">
                        {t.items.map((i, idx) => (
                          <span key={idx} className="block text-[11px] font-medium">
                            {i.cantidad_kg} Kg {i.nombre}
                          </span>
                        ))}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{t.usuario_despacha}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {t.usuario_recibe ? (
                          <span className="text-emerald-700 font-bold">{t.usuario_recibe}</span>
                        ) : (
                          <span className="text-slate-400">Pendiente</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.estado === 'RECIBIDO_CONFORME'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : t.estado === 'EN_TRANSITO'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
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
