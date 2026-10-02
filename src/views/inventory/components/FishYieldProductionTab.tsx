import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Scale,
  Award,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Layers,
  Thermometer,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  obtenerLotesMadreDisponibles,
  type LoteMadreMuelleItem,
} from '../../../services/dockPurchaseService';
import {
  procesarOrdenDespieceYield,
  obtenerOrdenesDespiece,
  obtenerKpisFileteadores,
  type ResumenKpiFileteador,
} from '../../../services/fishYieldProductionService';
import {
  calcularRendimientoYCosteoDespiece,
  ESTANDARES_RENDIMIENTO_ESPECIES,
  type SalidaCorteDespiece,
  type TipoSalidaCorte,
} from '../../../../packages/validation-schemas/src/fishProductionYield.schema';

interface FishYieldProductionTabProps {
  bodegas?: Array<{ id: string; nombre: string }>;
  onOrdenCompletada?: () => void;
}

export const FishYieldProductionTab: React.FC<FishYieldProductionTabProps> = ({
  bodegas = [
    { id: 'bodega-principal', nombre: 'Cuarto Frío Principal' },
    { id: 'bodega-pos', nombre: 'Mostrador POS' },
  ],
  onOrdenCompletada,
}) => {
  const [lotesMadre, setLotesMadre] = useState<LoteMadreMuelleItem[]>([]);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [kpisOperarios, setKpisOperarios] = useState<ResumenKpiFileteador[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario Orden
  const [loteMadreSeleccionado, setLoteMadreSeleccionado] = useState<LoteMadreMuelleItem | null>(null);
  const [bodegaDestinoId, setBodegaDestinoId] = useState(bodegas[0]?.id || 'bodega-principal');
  const [fileteadorNombre, setFileteadorNombre] = useState('Don Efraín Gómez (Maestro Fileteador)');
  const [fileteadorIdentificacion, setFileteadorIdentificacion] = useState('79201948');
  const [pesoInicialKg, setPesoInicialKg] = useState<number>(50);
  const [temperaturaSalaC, setTemperaturaSalaC] = useState<number>(10.0);
  const [observaciones, setObservaciones] = useState('');

  // Cortes
  const [cortes, setCortes] = useState<SalidaCorteDespiece[]>([
    {
      productoId: 'prod-filete-fresco',
      sku: 'FIL-FRESCO-01',
      nombreCorte: 'Filete de Pescado Fresco',
      tipoSalida: 'PRODUCTO_PRINCIPAL_FILETE',
      pesoObtenidoKg: 22, // 44%
      factorValorMercado: 1.6,
    },
    {
      productoId: 'prod-cabeza-espinazo',
      sku: 'CAB-SOPA-01',
      nombreCorte: 'Cabezas y Espinazo para Sopa',
      tipoSalida: 'COPRODUCTO_CABEZA_ESPINAZO',
      pesoObtenidoKg: 16, // 32%
      factorValorMercado: 0.3,
    },
    {
      productoId: 'prod-retazos-ceviche',
      sku: 'RET-CEVICHE-01',
      nombreCorte: 'Retazos de Pulpa para Ceviche',
      tipoSalida: 'SUBPRODUCTO_RETAZO_PULPA',
      pesoObtenidoKg: 3, // 6%
      factorValorMercado: 0.9,
    },
    {
      productoId: 'prod-merma-tecnica',
      sku: 'MERMA-VISCERAS',
      nombreCorte: 'Vísceras, Escamas y Sangre',
      tipoSalida: 'MERMA_TECNICA_NO_APROVECHABLE',
      pesoObtenidoKg: 9, // 18%
      factorValorMercado: 0.0,
    },
  ]);

  const recargarDatos = () => {
    const lotes = obtenerLotesMadreDisponibles();
    setLotesMadre(lotes);
    if (lotes.length > 0 && !loteMadreSeleccionado) {
      setLoteMadreSeleccionado(lotes[0]);
    }
    setOrdenes(obtenerOrdenesDespiece());
    setKpisOperarios(obtenerKpisFileteadores());
  };

  useEffect(() => {
    recargarDatos();
  }, []);

  // Especie clave actual
  const especieClave = useMemo(() => {
    if (!loteMadreSeleccionado) return 'CORVINA';
    const esp = loteMadreSeleccionado.especiePescado.toUpperCase();
    if (esp.includes('CORVINA')) return 'CORVINA';
    if (esp.includes('PARGO')) return 'PARGO_ROJO';
    if (esp.includes('ROBALO')) return 'ROBALO';
    if (esp.includes('SALMON')) return 'SALMON';
    if (esp.includes('TRUCHA')) return 'TRUCHA';
    if (esp.includes('TILAPIA')) return 'TILAPIA';
    return 'CORVINA';
  }, [loteMadreSeleccionado]);

  const costoKiloMP = loteMadreSeleccionado?.costoPromedioKg || 22000;

  // Cálculo determinista en tiempo real
  const calculoRendimiento = useMemo(() => {
    return calcularRendimientoYCosteoDespiece(pesoInicialKg, costoKiloMP, cortes, especieClave);
  }, [pesoInicialKg, costoKiloMP, cortes, especieClave]);

  // Manejo de Cortes
  const handleAddCorte = () => {
    setCortes([
      ...cortes,
      {
        productoId: `prod-corte-${Date.now()}`,
        sku: 'CORTE-NUEVO',
        nombreCorte: 'Nuevo Corte Especial',
        tipoSalida: 'SUBPRODUCTO_RETAZO_PULPA',
        pesoObtenidoKg: 2,
        factorValorMercado: 0.8,
      },
    ]);
  };

  const handleRemoveCorte = (index: number) => {
    if (cortes.length <= 1) return;
    setCortes(cortes.filter((_, i) => i !== index));
  };

  const handleUpdateCorte = (index: number, field: keyof SalidaCorteDespiece, value: any) => {
    const updated = [...cortes];
    updated[index] = { ...updated[index], [field]: value };
    setCortes(updated);
  };

  // Procesar orden
  const handleProcesarOrden = () => {
    if (!loteMadreSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Lote Madre Requerido',
        text: 'Debe seleccionar un lote madre de pescado entero recibido en muelle.',
      });
      return;
    }

    if (pesoInicialKg <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Peso Inválido',
        text: 'El peso inicial a procesar debe ser mayor a cero.',
      });
      return;
    }

    const payload = {
      fechaTransformacion: new Date().toISOString(),
      bodegaOrigenId: loteMadreSeleccionado.bodegaDestinoId,
      bodegaDestinoId,
      loteMadreMuelleId: loteMadreSeleccionado.codigoLoteMadre,
      materiaPrimaProductoId: `prod-${loteMadreSeleccionado.especiePescado.toLowerCase().replace(/\s+/g, '-')}`,
      materiaPrimaSku: `MP-${especieClave}-01`,
      materiaPrimaNombre: `${loteMadreSeleccionado.especiePescado} Entero Fresco`,
      especieClave,
      pesoInicialMateriaPrimaKg: pesoInicialKg,
      costoKiloMateriaPrima: costoKiloMP,
      fileteadorNombre,
      fileteadorIdentificacion,
      cortesObtenidos: cortes,
      temperaturaSalaC,
      observacionesProduccion: observaciones,
    };

    const res = procesarOrdenDespieceYield(payload);
    if (res.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Transformación',
        text: res.error,
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Despiece y Fileteo Procesado!',
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>Orden:</strong> ${res.data?.orden.consecutivoOrden}</p>
          <p><strong>Rendimiento Filete:</strong> <span class="text-emerald-400 font-bold">${res.data?.orden.calculoRendimiento.rendimientoFileteRealPct}%</span> (Calificación: ${res.data?.orden.calculoRendimiento.calificacionRendimiento})</p>
          <p><strong>Costo Filete Resultante:</strong> $${res.data?.orden.cortesFinales.find((c: any) => c.tipoSalida === 'PRODUCTO_PRINCIPAL_FILETE')?.costoUnitarioPorKg.toLocaleString('es-CO')}/kg</p>
          <p><strong>Lotes Derivados FEFO:</strong> Ingresados a Cuarto Frío para B2B y POS.</p>
        </div>
      `,
      background: '#0f172a',
      color: '#f8fafc',
    });

    setIsModalOpen(false);
    recargarDatos();
    if (onOrdenCompletada) onOrdenCompletada();
  };

  return (
    <div className="space-y-6">
      {/* Header con botón y stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Scissors className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Transformación & Despiece de Materia Prima (Yield KPI)
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Prorrateo de Costos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Despiece de pescado entero, balance de masa, estándares por especie y auditoría de operarios.
            </p>
          </div>
        </div>

        <button
          id="btn-nueva-orden-despiece"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Despiece / Fileteo
        </button>
      </div>

      {/* Grid de 2 Columnas: KPIs Fileteadores e Historial de Órdenes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Auditoría de Fileteadores */}
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Auditoría de Operarios & Fileteadores ({kpisOperarios.length})
          </h3>

          {kpisOperarios.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <Award className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-xs">No hay registros de operarios aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpisOperarios.map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{kpi.fileteadorNombre}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      {kpi.promedioRendimientoFiletePct}% Filete
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-400 pt-1 border-t border-white/5">
                    <div>
                      <span className="block text-[10px]">Kilos Totales:</span>
                      <span className="text-white font-mono font-semibold">{kpi.totalKilosProcesados} kg</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Órdenes OK:</span>
                      <span className="text-emerald-400 font-semibold">{kpi.ordenesOptimas}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Con Alerta:</span>
                      <span className="text-amber-400 font-semibold">{kpi.ordenesConAlerta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de Órdenes de Despiece */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Historial de Transformaciones y Lotes Derivados ({ordenes.length})
          </h3>

          {ordenes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Scissors className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-sm">No se han procesado órdenes de transformación hoy.</p>
              <p className="text-xs text-slate-400">
                Inicia un despiece para convertir pescado entero recibido de muelle en filetes y coproductos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenes.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-emerald-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-400">{ord.consecutivoOrden}</span>
                      <h4 className="text-sm font-bold text-white">
                        {ord.materiaPrimaNombre} ({ord.pesoInicialMateriaPrimaKg} kg)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Lote Madre: <span className="font-mono text-cyan-400">{ord.loteMadreMuelleId}</span> • Operario: {ord.fileteadorNombre}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          ord.calculoRendimiento?.calificacionRendimiento === 'OPTIMO_EXCELENTE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {ord.calculoRendimiento?.rendimientoFileteRealPct}% Filete (
                        {ord.calculoRendimiento?.calificacionRendimiento})
                      </span>
                    </div>
                  </div>

                  {/* Lotes Derivados Generados */}
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Lotes Derivados Ingresados al Inventario:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {ord.cortesFinales
                        ?.filter((c: any) => c.tipoSalida !== 'MERMA_TECNICA_NO_APROVECHABLE')
                        .map((corte: any, i: number) => (
                          <div key={i} className="p-2 rounded bg-slate-800/70 border border-white/5 space-y-0.5">
                            <span className="font-mono text-[11px] text-cyan-300 block">{corte.codigoLoteDerivado}</span>
                            <span className="text-white font-medium block">{corte.nombreCorte}</span>
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{corte.pesoObtenidoKg} kg</span>
                              <span className="text-emerald-400 font-bold">${corte.costoUnitarioPorKg?.toLocaleString('es-CO')}/kg</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Nueva Orden de Despiece & Rendimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Orden de Despiece, Fileteo & Rendimiento</h3>
                  <p className="text-xs text-slate-400">Consumo de lote de muelle, balance de masa y costeo por absorción</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Selección de Lote Madre y Operario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/5 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1 font-medium">
                  Lote Madre de Origen (Recepción de Muelle WMS)
                </label>
                {lotesMadre.length === 0 ? (
                  <p className="text-amber-400">No hay lotes de muelle registrados. Crea uno en la pestaña de Muelle.</p>
                ) : (
                  <select
                    value={loteMadreSeleccionado?.codigoLoteMadre || ''}
                    onChange={(e) => {
                      const sel = lotesMadre.find((l) => l.codigoLoteMadre === e.target.value);
                      if (sel) setLoteMadreSeleccionado(sel);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none font-mono"
                  >
                    {lotesMadre.map((l) => (
                      <option key={l.codigoLoteMadre} value={l.codigoLoteMadre}>
                        {l.codigoLoteMadre} — {l.especiePescado} ({l.pesoNetoDisponibleKg} kg @ ${l.costoPromedioKg.toLocaleString('es-CO')}/kg) [{l.embarcacionNombre}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Cuarto Frío Destino</label>
                <select
                  value={bodegaDestinoId}
                  onChange={(e) => setBodegaDestinoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none"
                >
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Maestro Fileteador / Operario</label>
                <input
                  type="text"
                  value={fileteadorNombre}
                  onChange={(e) => setFileteadorNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Cédula del Operario</label>
                <input
                  type="text"
                  value={fileteadorIdentificacion}
                  onChange={(e) => setFileteadorIdentificacion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Peso Inicial a Procesar (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={pesoInicialKg}
                  onChange={(e) => setPesoInicialKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white font-bold outline-none text-emerald-400"
                />
              </div>
            </div>

            {/* Panel en Vivo: Semáforo de Rendimiento y Comparativa */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Rendimiento en Vivo vs Estándar ({calculoRendimiento.estandarEspecie.especie})
                </h4>

                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    calculoRendimiento.calificacionRendimiento === 'OPTIMO_EXCELENTE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {calculoRendimiento.rendimientoFileteRealPct}% Filete ({calculoRendimiento.calificacionRendimiento})
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-white/5 space-y-1">
                <p>
                  <strong>Estándar Óptimo:</strong> {calculoRendimiento.estandarEspecie.rendimientoFileteOptimoMinPct}% a {calculoRendimiento.estandarEspecie.rendimientoFileteOptimoMaxPct}% de filete | Merma máx: {calculoRendimiento.estandarEspecie.mermaTecnicaMaxPermitidaPct}%.
                </p>
                <p className="text-slate-400">{calculoRendimiento.mensajeAuditoria}</p>
              </div>
            </div>

            {/* Tabla de Cortes y Absorción de Costos */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Cortes Obtenidos y Prorrateo por Valor de Mercado
                </h4>
                <button
                  type="button"
                  onClick={handleAddCorte}
                  className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Corte
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="p-2">Corte / Salida</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Peso (kg)</th>
                      <th className="p-2">Rendimiento (%)</th>
                      <th className="p-2">Factor Mercado</th>
                      <th className="p-2 text-right">Costo Asignado ($/kg)</th>
                      <th className="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {cortes.map((c, idx) => {
                      const resC = calculoRendimiento.cortesLiquidados[idx];
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2">
                            <input
                              type="text"
                              value={c.nombreCorte}
                              onChange={(e) => handleUpdateCorte(idx, 'nombreCorte', e.target.value)}
                              className="w-40 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={c.tipoSalida}
                              onChange={(e) =>
                                handleUpdateCorte(idx, 'tipoSalida', e.target.value as TipoSalidaCorte)
                              }
                              className="w-36 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            >
                              <option value="PRODUCTO_PRINCIPAL_FILETE">Filete Principal</option>
                              <option value="COPRODUCTO_CABEZA_ESPINAZO">Cabeza / Espinazo</option>
                              <option value="SUBPRODUCTO_RETAZO_PULPA">Retazo Pulpa</option>
                              <option value="MERMA_TECNICA_NO_APROVECHABLE">Merma Inevitable</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.5"
                              value={c.pesoObtenidoKg}
                              onChange={(e) =>
                                handleUpdateCorte(idx, 'pesoObtenidoKg', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs font-bold outline-none"
                            />
                          </td>
                          <td className="p-2 font-mono text-slate-300">
                            {resC?.rendimientoSobreMPPct}%
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={c.factorValorMercado}
                              onChange={(e) =>
                                handleUpdateCorte(idx, 'factorValorMercado', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-400">
                            {resC?.costoUnitarioPorKg > 0
                              ? `$${resC?.costoUnitarioPorKg?.toLocaleString('es-CO')}/kg`
                              : '$0 (Merma)'}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCorte(idx)}
                              disabled={cortes.length <= 1}
                              className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-orden-despiece"
                onClick={handleProcesarOrden}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Cerrar Orden, Generar Lotes Derivados & Actualizar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
