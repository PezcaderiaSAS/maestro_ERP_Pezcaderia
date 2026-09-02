import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Sparkles,
  ClipboardList,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  procesarDespieceConProrrateo,
  obtenerComandasProcesamiento,
  actualizarEstadoComanda,
  validarStock,
} from '../../../services/inventoryService';
import { load } from '../../../services/localDb';
import type {
  Product,
  YieldCut,
  ProcessingOrder,
  DespieceTransformationPayload,
} from '../../../types/erp.types';
import type { Bodega } from '../../../services/warehouseService';

interface ProductionFormProps {
  products?: Product[];
  bodegas?: Bodega[];
  onProductionComplete?: () => void;
  // Legacy props compatibility
  activeProducts?: any[];
  prodMateriaPrima?: string;
  setProdMateriaPrima?: (val: string) => void;
  prodMateriaCant?: number | string;
  setProdMateriaCant?: (val: number | string) => void;
  prodTerminado?: string;
  setProdTerminado?: (val: string) => void;
  prodTerminadoCant?: number | string;
  setProdTerminadoCant?: (val: number | string) => void;
  mermaPct?: number;
  handleProcesarProduccion?: (e: React.FormEvent) => void;
}

export const ProductionForm: React.FC<ProductionFormProps> = ({
  products = [],
  bodegas = [],
  onProductionComplete,
  activeProducts,
  handleProcesarProduccion,
}) => {
  // Unificar catálogo de productos
  const catalogoProductos = useMemo(() => {
    if (products.length > 0) return products;
    if (activeProducts && activeProducts.length > 0) return activeProducts as Product[];
    return load<Product[]>('erp_products', []);
  }, [products, activeProducts]);

  // Bodegas activas
  const bodegasActivas = useMemo(() => {
    if (bodegas.length > 0) return bodegas.filter((b) => b.activa !== false);
    return [
      { id: 'bodega-principal', nombre: 'Cuarto Frío Principal', activa: true },
      { id: 'bodega-pos', nombre: 'Mostrador POS', activa: true },
    ];
  }, [bodegas]);

  // Estado del Despiece
  const [selectedBodegaId, setSelectedBodegaId] = useState(bodegasActivas[0]?.id || 'bodega-principal');
  const [materiaPrimaId, setMateriaPrimaId] = useState('');
  const [pesoInicialKg, setPesoInicialKg] = useState<number | ''>('');
  const [usuarioResponsable, setUsuarioResponsable] = useState('Maestro de Corte');
  const [comandaActivaId, setComandaActivaId] = useState<string | null>(null);

  // Matriz dinámica de cortes
  const [cortes, setCortes] = useState<
    Array<{
      producto_id: string;
      sku: string;
      nombre_corte: string;
      peso_obtenido_kg: number | '';
      factor_valor_mercado: number;
    }>
  >([
    {
      producto_id: '',
      sku: '',
      nombre_corte: '',
      peso_obtenido_kg: '',
      factor_valor_mercado: 1.3,
    },
  ]);

  // Comandas pendientes
  const [comandas, setComandas] = useState<ProcessingOrder[]>([]);

  const refreshComandas = () => {
    const list = obtenerComandasProcesamiento();
    setComandas(list.filter((c) => c.estado === 'PENDIENTE' || c.estado === 'EN_CORTE'));
  };

  useEffect(() => {
    refreshComandas();
  }, []);

  // Materia prima seleccionada
  const materiaPrima = useMemo(() => {
    return catalogoProductos.find((p) => p.id === materiaPrimaId || p.sku === materiaPrimaId);
  }, [catalogoProductos, materiaPrimaId]);

  // Costo unitario y total de Materia Prima
  const costoUnitarioMP = useMemo(() => {
    return materiaPrima?.costo_promedio_ponderado || materiaPrima?.precio_compra || 0;
  }, [materiaPrima]);

  const costoTotalMP = useMemo(() => {
    const peso = Number(pesoInicialKg) || 0;
    return Math.round(peso * costoUnitarioMP);
  }, [pesoInicialKg, costoUnitarioMP]);

  // Stock disponible de materia prima en la bodega
  const stockDict = useMemo(() => {
    return load<Record<string, Record<string, number>>>('stock', {});
  }, [materiaPrimaId, selectedBodegaId]);

  const stockDisponibleMP = useMemo(() => {
    if (!materiaPrima || !selectedBodegaId) return 0;
    return stockDict[selectedBodegaId]?.[materiaPrima.sku] || 0;
  }, [stockDict, selectedBodegaId, materiaPrima]);

  // Cálculos de Prorrateo y Balance de Masa
  const calculoProrrateo = useMemo(() => {
    const pesoMP = Number(pesoInicialKg) || 0;
    const pesoTotalCortes = cortes.reduce((sum, c) => sum + (Number(c.peso_obtenido_kg) || 0), 0);
    const mermaKg = Math.max(0, Math.round((pesoMP - pesoTotalCortes) * 1000) / 1000);
    const mermaPct = pesoMP > 0 ? Math.round((mermaKg / pesoMP) * 1000) / 10 : 0;

    const scoreTotal = cortes.reduce(
      (sum, c) => sum + (Number(c.peso_obtenido_kg) || 0) * (c.factor_valor_mercado || 1),
      0
    );

    let acumuladoCosto = 0;
    const cortesCalculados: YieldCut[] = cortes.map((c, idx) => {
      const peso = Number(c.peso_obtenido_kg) || 0;
      let costoCorte = 0;

      if (scoreTotal > 0 && peso > 0) {
        const factor = c.factor_valor_mercado || 1;
        const proporcion = (peso * factor) / scoreTotal;
        if (idx === cortes.length - 1) {
          costoCorte = Math.max(0, costoTotalMP - acumuladoCosto);
        } else {
          costoCorte = Math.round(costoTotalMP * proporcion);
          acumuladoCosto += costoCorte;
        }
      }

      const costoUnit = peso > 0 ? Math.round((costoCorte / peso) * 100) / 100 : 0;

      return {
        producto_id: c.producto_id,
        sku: c.sku,
        nombre_corte: c.nombre_corte,
        peso_obtenido_kg: peso,
        factor_valor_mercado: c.factor_valor_mercado || 1,
        costo_asignado_unitario: costoUnit,
        costo_asignado_total: costoCorte,
      };
    });

    return {
      pesoTotalCortes: Math.round(pesoTotalCortes * 1000) / 1000,
      mermaKg,
      mermaPct,
      cortesCalculados,
      esExcesivaMerma: mermaPct > 35,
    };
  }, [pesoInicialKg, cortes, costoTotalMP]);

  // Manejo de cortes dinámicos
  const handleAddCorte = () => {
    setCortes((prev) => [
      ...prev,
      {
        producto_id: '',
        sku: '',
        nombre_corte: '',
        peso_obtenido_kg: '',
        factor_valor_mercado: 1.0,
      },
    ]);
  };

  const handleRemoveCorte = (index: number) => {
    if (cortes.length <= 1) return;
    setCortes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCorteChange = (
    index: number,
    field: 'producto_id' | 'peso_obtenido_kg' | 'factor_valor_mercado',
    val: any
  ) => {
    setCortes((prev) => {
      const updated = [...prev];
      if (field === 'producto_id') {
        const prod = catalogoProductos.find((p) => p.id === val || p.sku === val);
        updated[index] = {
          ...updated[index],
          producto_id: prod?.id || val,
          sku: prod?.sku || val,
          nombre_corte: prod?.nombre || val,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: val,
        };
      }
      return updated;
    });
  };

  // Cargar comanda a mesa de corte
  const handleAtenderComanda = (comanda: ProcessingOrder) => {
    setComandaActivaId(comanda.id);
    if (comanda.materia_prima_disponible_id) {
      setMateriaPrimaId(comanda.materia_prima_disponible_id);
    }
    setCortes([
      {
        producto_id: comanda.producto_solicitado_id,
        sku: comanda.sku_solicitado,
        nombre_corte: comanda.nombre_producto_solicitado,
        peso_obtenido_kg: comanda.cantidad_solicitada_kg,
        factor_valor_mercado: 1.3,
      },
    ]);
    setPesoInicialKg(Math.round(comanda.cantidad_solicitada_kg * 1.45 * 100) / 100);

    actualizarEstadoComanda(comanda.id, 'EN_CORTE', usuarioResponsable);
    refreshComandas();

    Swal.fire({
      icon: 'info',
      title: 'Comanda en Mesa de Corte',
      text: `Se cargó la solicitud de ${comanda.cantidad_solicitada_kg} Kg de ${comanda.nombre_producto_solicitado}. Ajusta los pesos reales del corte.`,
      background: '#0f172a',
      color: '#f8fafc',
    });
  };

  // Ejecutar despiece
  const handleSubmitDespiece = (e: React.FormEvent) => {
    e.preventDefault();

    if (!materiaPrima || !pesoInicialKg || Number(pesoInicialKg) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Materia prima inválida',
        text: 'Selecciona una materia prima y un peso en kilogramos mayor a cero.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (Number(pesoInicialKg) > stockDisponibleMP) {
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente',
        text: `La bodega solo dispone de ${stockDisponibleMP} Kg de ${materiaPrima.nombre}.`,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    const cortesValidos = calculoProrrateo.cortesCalculados.filter(
      (c) => c.producto_id && c.peso_obtenido_kg > 0
    );

    if (cortesValidos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cortes no definidos',
        text: 'Debes definir al menos un producto final obtenido con peso mayor a cero.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    const payload: DespieceTransformationPayload = {
      materia_prima_id: materiaPrima.id,
      materia_prima_nombre: materiaPrima.nombre,
      bodega_id: selectedBodegaId,
      peso_inicial_kg: Number(pesoInicialKg),
      costo_unitario_mp: costoUnitarioMP,
      costo_total_mp: costoTotalMP,
      cortes_obtenidos: cortesValidos,
      merma_no_aprovechable_kg: calculoProrrateo.mermaKg,
      merma_porcentaje: calculoProrrateo.mermaPct,
      usuario_responsable: usuarioResponsable || 'Maestro de Corte',
      fecha: new Date().toISOString(),
      comanda_id: comandaActivaId || undefined,
    };

    const res = procesarDespieceConProrrateo(payload);

    if (res.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error en despiece',
        text: res.error,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Despiece Procesado con Éxito!',
      html: `
        <div class="text-left text-sm text-slate-300 space-y-1 mt-2">
          <p><strong>Materia Prima Procesada:</strong> ${pesoInicialKg} Kg (${materiaPrima.nombre})</p>
          <p><strong>Cortes Obtenidos:</strong> ${cortesValidos.map((c) => `${c.peso_obtenido_kg} Kg ${c.nombre_corte}`).join(', ')}</p>
          <p><strong>Merma Técnica:</strong> ${calculoProrrateo.mermaKg} Kg (${calculoProrrateo.mermaPct}%)</p>
          <p class="text-xs text-emerald-400 mt-2">Costo Total ($${costoTotalMP.toLocaleString('es-CO')}) distribuido al 100% contablemente en Kardex.</p>
        </div>
      `,
      background: '#0f172a',
      color: '#f8fafc',
    });

    // Resetear formulario
    setPesoInicialKg('');
    setComandaActivaId(null);
    setCortes([
      {
        producto_id: '',
        sku: '',
        nombre_corte: '',
        peso_obtenido_kg: '',
        factor_valor_mercado: 1.3,
      },
    ]);
    refreshComandas();
    onProductionComplete?.();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Columna 1 & 2: Formulario Principal de Despiece ── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Transformación & Despiece de Materia Prima
            </h3>
            {comandaActivaId && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Atendiendo Comanda
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitDespiece} className="space-y-5">
            {/* 1. Entrada de Materia Prima */}
            <div className="bg-slate-950/60 border border-emerald-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4" /> 1. Materia Prima Origen (Entrada)
                </span>
                {materiaPrima && (
                  <span className="text-xs text-slate-400 font-mono">
                    CPP: <strong className="text-emerald-300">${costoUnitarioMP.toLocaleString('es-CO')}</strong>/Kg | Disp: <strong className="text-cyan-300">{stockDisponibleMP} Kg</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                    Seleccionar Insumo *
                  </label>
                  <select
                    value={materiaPrimaId}
                    onChange={(e) => setMateriaPrimaId(e.target.value)}
                    className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Seleccionar Materia Prima --</option>
                    {catalogoProductos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                    Peso Bruto (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    value={pesoInicialKg}
                    onChange={(e) => setPesoInicialKg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-slate-400">
                <span>Bodega de Operación:</span>
                <select
                  value={selectedBodegaId}
                  onChange={(e) => setSelectedBodegaId(e.target.value)}
                  className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  {bodegasActivas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Matriz Dinámica de Cortes Resultantes */}
            <div className="bg-slate-950/60 border border-cyan-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 2. Productos Finales Obtenidos (Cortes)
                </span>
                <button
                  type="button"
                  onClick={handleAddCorte}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Otro Corte
                </button>
              </div>

              <div className="space-y-2.5">
                {cortes.map((corte, idx) => {
                  const corteCalc = calculoProrrateo.cortesCalculados[idx];
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-900/80 rounded-xl border border-white/5"
                    >
                      <div className="md:col-span-5">
                        <label className="block text-[10px] text-slate-400 uppercase font-medium mb-0.5">
                          Corte {idx + 1}
                        </label>
                        <select
                          value={corte.producto_id}
                          onChange={(e) => handleCorteChange(idx, 'producto_id', e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          required
                        >
                          <option value="">-- Seleccionar Corte --</option>
                          {catalogoProductos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-medium mb-0.5">
                          Factor Valor
                        </label>
                        <select
                          value={corte.factor_valor_mercado}
                          onChange={(e) =>
                            handleCorteChange(idx, 'factor_valor_mercado', Number(e.target.value))
                          }
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value={1.5}>1.5x (Premium)</option>
                          <option value={1.3}>1.3x (Lomo/Filete)</option>
                          <option value={1.0}>1.0x (Estándar)</option>
                          <option value={0.7}>0.7x (Postas)</option>
                          <option value={0.3}>0.3x (Subproducto)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-medium mb-0.5">
                          Peso (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.000"
                          value={corte.peso_obtenido_kg}
                          onChange={(e) =>
                            handleCorteChange(
                              idx,
                              'peso_obtenido_kg',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] text-slate-500 block">Costo Resultante</span>
                        <span className="text-xs font-bold text-cyan-300 font-mono">
                          ${corteCalc?.costo_asignado_unitario.toLocaleString('es-CO') || 0}/Kg
                        </span>
                      </div>

                      <div className="md:col-span-1 text-center">
                        {cortes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCorte(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar corte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Panel de Balance de Masa y Merma Técnica */}
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
                calculoProrrateo.esExcesivaMerma
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {calculoProrrateo.esExcesivaMerma ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">
                    {calculoProrrateo.esExcesivaMerma
                      ? 'Merma Elevada (Excede 35% de tolerancia)'
                      : 'Balance de Masa en Rango Operativo Normal'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Aprovechamiento: {calculoProrrateo.pesoTotalCortes} Kg | Merma Técnica:{' '}
                    <strong>{calculoProrrateo.mermaKg} Kg</strong>
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">% Merma Resultante</span>
                <span
                  className={`text-xl font-extrabold ${
                    calculoProrrateo.esExcesivaMerma ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {calculoProrrateo.mermaPct}%
                </span>
              </div>
            </div>

            {/* Botón de Procesar */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <div className="text-xs text-slate-400 font-mono">
                Costo MP Total: <strong className="text-white">${costoTotalMP.toLocaleString('es-CO')} COP</strong>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Procesar y Contabilizar Despiece
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Columna 3: Comandas de Despiece Inmediatas ── */}
      <div className="space-y-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-400" />
              Comandas Urgentes de Corte ({comandas.length})
            </h4>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              En Vivo
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Solicitudes de corte bajo demanda emitidas desde POS Mostrador o Cotizaciones B2B por falta de stock.
          </p>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {comandas.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-white/5">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No hay comandas de corte pendientes.</p>
              </div>
            ) : (
              comandas.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    comandaActivaId === c.id
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-amber-400">
                      {c.codigo_comanda}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {c.origen.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 mb-2 font-medium">
                    Solicita: <strong className="text-white">{c.cantidad_solicitada_kg} Kg</strong> de{' '}
                    <span className="text-cyan-300">{c.nombre_producto_solicitado}</span>
                  </div>

                  {c.materia_prima_nombre && (
                    <div className="text-[11px] text-slate-400 mb-3">
                      MP Sugerida: <span>{c.materia_prima_nombre}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleAtenderComanda(c)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Cargar a Mesa de Corte
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
