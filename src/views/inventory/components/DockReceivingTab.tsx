import React, { useState, useEffect, useMemo } from 'react';
import {
  Anchor,
  Scale,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  Ship,
  User,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  registrarRecepcionMuelle,
  obtenerRecepcionesMuelle,
} from '../../../services/dockPurchaseService';
import {
  calcularLiquidacionMuelle,
  type PesajeTallaMuelle,
  type DeduccionFaena,
  type EstadoOjos,
  type EstadoAgallas,
  type TexturaMuscular,
  type OlorSensorial,
} from '../../../../packages/validation-schemas/src/dockReceiving.schema';

interface DockReceivingTabProps {
  bodegas?: Array<{ id: string; nombre: string }>;
  onLoteCreado?: () => void;
}

export const DockReceivingTab: React.FC<DockReceivingTabProps> = ({
  bodegas = [
    { id: 'bodega-principal', nombre: 'Cuarto Frío Principal' },
    { id: 'bodega-pos', nombre: 'Mostrador POS' },
  ],
  onLoteCreado,
}) => {
  const [recepciones, setRecepciones] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario de Recepción
  const [embarcacionNombre, setEmbarcacionNombre] = useState('Lancha El Carmen');
  const [patronPescadorNombre, setPatronPescadorNombre] = useState('Manuel Estupiñán');
  const [patronIdentificacion, setPatronIdentificacion] = useState('1144029182');
  const [puertoMuelleOrigen, setPuertoMuelleOrigen] = useState('Muelle Pesquero Buenaventura');
  const [especiePescado, setEspeciePescado] = useState('Corvina');
  const [bodegaDestinoId, setBodegaDestinoId] = useState(bodegas[0]?.id || 'bodega-principal');
  const [inspectorCalidad, setInspectorCalidad] = useState('Biólogo Marino Carlos');

  // Semáforo Sensorial
  const [temperaturaPulpaC, setTemperaturaPulpaC] = useState<number>(2.4);
  const [ojos, setOjos] = useState<EstadoOjos>('EXCELENTE_CONVEXO_TRANSPARENTE');
  const [agallas, setAgallas] = useState<EstadoAgallas>('EXCELENTE_ROJO_VIVO_BRILLANTE');
  const [textura, setTextura] = useState<TexturaMuscular>('EXCELENTE_FIRME_ELASTICA');
  const [olor, setOlor] = useState<OlorSensorial>('EXCELENTE_MAR_FRESCO_ALGAS');
  const [observacionesSensoriales, setObservacionesSensoriales] = useState('');

  // Báscula por Tallas
  const [itemsTallas, setItemsTallas] = useState<PesajeTallaMuelle[]>([
    {
      tallaNombre: 'Mediano 500-800g',
      calidad: 'PRIMERA',
      cantidadCanastillas: 2,
      taraPorCanastillaKg: 2.0,
      pesoBrutoBasculaKg: 104,
      porcentajeEscurridoHielo: 3.0,
      precioPorKgAcordado: 22000,
    },
  ]);

  // Deducciones de Faena
  const [deducciones, setDeducciones] = useState<DeduccionFaena[]>([
    {
      tipoDeduccion: 'ANTICIPO_EFECTIVO',
      descripcion: 'Anticipo salida de faena',
      montoDeducido: 300000,
    },
    {
      tipoDeduccion: 'COMBUSTIBLE_GASOLINA',
      descripcion: '15 Galones de gasolina',
      montoDeducido: 220000,
    },
  ]);

  const [metodoPago, setMetodoPago] = useState<'EFECTIVO_CAJA_MENOR' | 'TRANSFERENCIA_BANCARIA' | 'CREDITO_PROVEEDOR'>('EFECTIVO_CAJA_MENOR');

  const recargarHistorial = () => {
    setRecepciones(obtenerRecepcionesMuelle());
  };

  useEffect(() => {
    recargarHistorial();
  }, []);

  // Cálculo en vivo
  const liquidacionCalculada = useMemo(() => {
    return calcularLiquidacionMuelle(itemsTallas, deducciones);
  }, [itemsTallas, deducciones]);

  // Manejo de Tallas
  const handleAddTalla = () => {
    setItemsTallas([
      ...itemsTallas,
      {
        tallaNombre: 'Grande >1kg',
        calidad: 'PRIMERA',
        cantidadCanastillas: 1,
        taraPorCanastillaKg: 2.0,
        pesoBrutoBasculaKg: 50,
        porcentajeEscurridoHielo: 3.0,
        precioPorKgAcordado: 26000,
      },
    ]);
  };

  const handleRemoveTalla = (index: number) => {
    if (itemsTallas.length <= 1) return;
    setItemsTallas(itemsTallas.filter((_, i) => i !== index));
  };

  const handleUpdateTalla = (index: number, field: keyof PesajeTallaMuelle, value: any) => {
    const updated = [...itemsTallas];
    updated[index] = { ...updated[index], [field]: value };
    setItemsTallas(updated);
  };

  // Manejo de Deducciones
  const handleAddDeduccion = () => {
    setDeducciones([
      ...deducciones,
      {
        tipoDeduccion: 'HIELO_FABRICA',
        descripcion: '5 bloques de hielo de escamas',
        montoDeducido: 60000,
      },
    ]);
  };

  const handleRemoveDeduccion = (index: number) => {
    setDeducciones(deducciones.filter((_, i) => i !== index));
  };

  const handleUpdateDeduccion = (index: number, field: keyof DeduccionFaena, value: any) => {
    const updated = [...deducciones];
    updated[index] = { ...updated[index], [field]: value };
    setDeducciones(updated);
  };

  // Guardar Recepción
  const handleRegistrarRecepcion = () => {
    if (temperaturaPulpaC > 6.0) {
      Swal.fire({
        icon: 'error',
        title: 'Bloqueo Sanitario',
        text: 'La temperatura supera los 6.0°C. No se puede recibir pescado por riesgo de descomposición y pérdida de cadena de frío.',
      });
      return;
    }

    const payload = {
      fechaRecepcion: new Date().toISOString(),
      embarcacionNombre,
      patronPescadorNombre,
      patronIdentificacion,
      puertoMuelleOrigen,
      especiePescado,
      bodegaDestinoId,
      inspeccionSanitaria: {
        temperaturaPulpaC,
        ojos,
        agallas,
        textura,
        olor,
        inspectorCalidad,
        observacionesSensoriales,
      },
      itemsTallas,
      deduccionesFaena: deducciones,
      metodoPagoLiquidacion: metodoPago,
    };

    const res = registrarRecepcionMuelle(payload);
    if (res.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: res.error,
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Recepción y Liquidación Exitosa!',
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>Acta:</strong> ${res.data?.recepcion.consecutivoActa}</p>
          <p><strong>Lote Madre Creado:</strong> <span class="text-emerald-400 font-mono">${res.data?.recepcion.codigoLoteMadre}</span></p>
          <p><strong>Kilos Netos Recibidos:</strong> ${res.data?.recepcion.liquidacionCalculada.pesoNetoEscurridoTotalKg} kg</p>
          <p><strong>Neto a Pagar Pescador:</strong> $${res.data?.recepcion.liquidacionCalculada.netoPagarPescador.toLocaleString('es-CO')}</p>
        </div>
      `,
      background: '#0f172a',
      color: '#f8fafc',
    });

    setIsModalOpen(false);
    recargarHistorial();
    if (onLoteCreado) onLoteCreado();
  };

  return (
    <div className="space-y-6">
      {/* Header con métricas y botón */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Anchor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Compras de Muelle & Liquidación de Barcos
              <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Pescadores B2B
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Inspección sensorial Invima, báscula por tallas con descuento de escurrido y deducción de faena.
            </p>
          </div>
        </div>

        <button
          id="btn-nueva-recepcion-muelle"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Recepción de Muelle
        </button>
      </div>

      {/* Historial de Actas de Muelle */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Historial de Recepciones y Lotes Madre en Cuarto Frío ({recepciones.length})
        </h3>

        {recepciones.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <Ship className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-sm">No hay actas de muelle registradas hoy.</p>
            <p className="text-xs text-slate-400">
              Registra una nueva descarga de lancha para generar el primer Lote Madre en cuartos fríos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recepciones.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-cyan-500/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{r.consecutivoActa}</span>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <Ship className="w-3.5 h-3.5 text-slate-400" />
                      {r.embarcacionNombre}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {r.estado}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lote Madre WMS:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{r.codigoLoteMadre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Especie:</span>
                    <span className="text-white font-medium">{r.especiePescado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pescador:</span>
                    <span className="text-slate-300">{r.patronPescadorNombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Temperatura:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        r.inspeccionSanitaria.temperaturaPulpaC <= 4
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      <Thermometer className="w-3 h-3" />
                      {r.inspeccionSanitaria.temperaturaPulpaC}°C
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Kilos Netos:</span>
                    <span className="font-bold text-white text-sm">
                      {r.liquidacionCalculada?.pesoNetoEscurridoTotalKg} kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Neto Pagado:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ${r.liquidacionCalculada?.netoPagarPescador.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Nueva Recepción en Muelle & Liquidación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Acta de Muelle y Liquidación a Pescador</h3>
                  <p className="text-xs text-slate-400">Control de frío, clasificación por tallas y deducción de faena</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Datos de Embarcación y Muelle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/5">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Lancha / Barco</label>
                <input
                  type="text"
                  value={embarcacionNombre}
                  onChange={(e) => setEmbarcacionNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Pescador / Armador</label>
                <input
                  type="text"
                  value={patronPescadorNombre}
                  onChange={(e) => setPatronPescadorNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Cédula / Identificación</label>
                <input
                  type="text"
                  value={patronIdentificacion}
                  onChange={(e) => setPatronIdentificacion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Muelle / Puerto</label>
                <input
                  type="text"
                  value={puertoMuelleOrigen}
                  onChange={(e) => setPuertoMuelleOrigen(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Especie Recibida</label>
                <input
                  type="text"
                  value={especiePescado}
                  onChange={(e) => setEspeciePescado(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Cuarto Frío de Destino</label>
                <select
                  value={bodegaDestinoId}
                  onChange={(e) => setBodegaDestinoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none"
                >
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Semáforo Sensorial y Cadena de Frío */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Inspección Sanitaria Sensorial (Invima)
                </h4>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                    temperaturaPulpaC <= 4
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : temperaturaPulpaC <= 6
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  {temperaturaPulpaC}°C —{' '}
                  {temperaturaPulpaC <= 4
                    ? 'Excelente (≤4°C)'
                    : temperaturaPulpaC <= 6
                    ? 'Alerta preventiva'
                    : 'BLOQUEO SANITARIO (>6°C)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Temp. Pulpa/Hielo (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperaturaPulpaC}
                    onChange={(e) => setTemperaturaPulpaC(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Agallas / Branquias</label>
                  <select
                    value={agallas}
                    onChange={(e) => setAgallas(e.target.value as EstadoAgallas)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="EXCELENTE_ROJO_VIVO_BRILLANTE">Rojo Vivo Brillante</option>
                    <option value="ACEPTABLE_ROSADO_PALIDO">Rosado Pálido</option>
                    <option value="RECHAZADO_PARDO_MUCOSO">Pardo Mucoso (Rechazo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ojos</label>
                  <select
                    value={ojos}
                    onChange={(e) => setOjos(e.target.value as EstadoOjos)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="EXCELENTE_CONVEXO_TRANSPARENTE">Convexo y Transparente</option>
                    <option value="ACEPTABLE_PLANO_OPACO">Plano / Poco Opaco</option>
                    <option value="RECHAZADO_HUNDIDO_TURBIO">Hundido Turbio (Rechazo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Textura Muscular</label>
                  <select
                    value={textura}
                    onChange={(e) => setTextura(e.target.value as TexturaMuscular)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="EXCELENTE_FIRME_ELASTICA">Firme y Elástica</option>
                    <option value="ACEPTABLE_LIGERAMENTE_BLANDA">Ligeramente Blanda</option>
                    <option value="RECHAZADO_BLANDA_DEJA_HUELLA">Blanda / Deja Huella</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Olor</label>
                  <select
                    value={olor}
                    onChange={(e) => setOlor(e.target.value as OlorSensorial)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="EXCELENTE_MAR_FRESCO_ALGAS">Mar Fresco / Algas</option>
                    <option value="ACEPTABLE_NEUTRO">Neutro</option>
                    <option value="RECHAZADO_AMONIACAL_ACIDO">Amoniacal / Ácido</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Báscula por Tallas */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Báscula por Tallas, Tara y Descuento de Escurrido de Hielo (3%)
                </h4>
                <button
                  type="button"
                  onClick={handleAddTalla}
                  className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Talla
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="p-2">Talla / Rango</th>
                      <th className="p-2">Canastillas</th>
                      <th className="p-2">Tara (2kg c/u)</th>
                      <th className="p-2">Peso Bruto (kg)</th>
                      <th className="p-2">Escurrido (%)</th>
                      <th className="p-2">Neto Liq. (kg)</th>
                      <th className="p-2">Precio ($/kg)</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {itemsTallas.map((t, idx) => {
                      const calcT = liquidacionCalculada.desgloseTallas[idx];
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2">
                            <input
                              type="text"
                              value={t.tallaNombre}
                              onChange={(e) => handleUpdateTalla(idx, 'tallaNombre', e.target.value)}
                              className="w-28 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={t.cantidadCanastillas}
                              onChange={(e) =>
                                handleUpdateTalla(idx, 'cantidadCanastillas', parseInt(e.target.value) || 1)
                              }
                              className="w-16 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            />
                          </td>
                          <td className="p-2 font-mono text-slate-400">{calcT?.taraCalculadaKg} kg</td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={t.pesoBrutoBasculaKg}
                              onChange={(e) =>
                                handleUpdateTalla(idx, 'pesoBrutoBasculaKg', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.5"
                              value={t.porcentajeEscurridoHielo}
                              onChange={(e) =>
                                handleUpdateTalla(idx, 'porcentajeEscurridoHielo', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            />
                          </td>
                          <td className="p-2 font-mono font-bold text-emerald-400">
                            {calcT?.pesoNetoLiquidadoKg} kg
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="500"
                              value={t.precioPorKgAcordado}
                              onChange={(e) =>
                                handleUpdateTalla(idx, 'precioPorKgAcordado', parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 bg-slate-900 border border-white/10 rounded text-white text-xs outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-white">
                            ${calcT?.valorTotalTalla.toLocaleString('es-CO')}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTalla(idx)}
                              disabled={itemsTallas.length <= 1}
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

            {/* Deducciones de Faena Pesquera */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Deducciones de Faena (Anticipos, Combustible, Hielo)
                </h4>
                <button
                  type="button"
                  onClick={handleAddDeduccion}
                  className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Deducción
                </button>
              </div>

              {deducciones.map((d, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <select
                    value={d.tipoDeduccion}
                    onChange={(e) => handleUpdateDeduccion(idx, 'tipoDeduccion', e.target.value)}
                    className="w-44 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs outline-none"
                  >
                    <option value="ANTICIPO_EFECTIVO">Anticipo en Efectivo</option>
                    <option value="COMBUSTIBLE_GASOLINA">Combustible / Gasolina</option>
                    <option value="HIELO_FABRICA">Hielo de Fábrica</option>
                    <option value="VIVERES_RANCHO">Víveres / Rancho</option>
                    <option value="MANTENIMIENTO_EQUIPOS">Mantenimiento de Redes</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  <input
                    type="text"
                    value={d.descripcion}
                    onChange={(e) => handleUpdateDeduccion(idx, 'descripcion', e.target.value)}
                    placeholder="Descripción"
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs outline-none"
                  />
                  <input
                    type="number"
                    value={d.montoDeducido}
                    onChange={(e) => handleUpdateDeduccion(idx, 'montoDeducido', parseFloat(e.target.value) || 0)}
                    placeholder="Monto"
                    className="w-32 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs outline-none font-bold text-rose-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDeduccion(idx)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen Final de Liquidación */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-xs">
                <div className="text-slate-400">
                  Total Peso Neto Liquidado:{' '}
                  <span className="font-bold text-white text-sm">
                    {liquidacionCalculada.pesoNetoEscurridoTotalKg} kg
                  </span>
                </div>
                <div className="text-slate-400">
                  Subtotal Compra:{' '}
                  <span className="font-mono text-slate-200">
                    ${liquidacionCalculada.subtotalCompraPescado.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="text-slate-400">
                  Total Deducciones:{' '}
                  <span className="font-mono text-rose-400">
                    -${liquidacionCalculada.totalDeducciones.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold block">
                  Neto a Pagar al Pescador:
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ${liquidacionCalculada.netoPagarPescador.toLocaleString('es-CO')}
                </span>
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
                id="btn-confirmar-liquidacion-muelle"
                onClick={handleRegistrarRecepcion}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar Acta, Liquidar & Crear Lote Madre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
