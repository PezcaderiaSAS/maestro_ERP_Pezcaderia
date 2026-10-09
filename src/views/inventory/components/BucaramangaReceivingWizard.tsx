import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Scale,
  Snowflake,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
  MapPin,
  Thermometer,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useBalanza } from '../../../hooks/useBalanza';
import {
  obtenerPedidosCompraBucaramanga,
  obtenerRecepcionesBucaramanga,
  registrarRecepcionBucaramanga,
  liquidarEgresoCajaRecepcion,
  type PedidoCompraBucaramanga,
  type RecepcionBucaramangaCompleta,
} from '../../../services/purchasesBucaramangaService';
import { cashService } from '../../../services/cashService';
import {
  calcularPesajeCanastilla,
  calcularLiquidacionBucaramanga,
  type PesajeCanastillaBucaramanga,
} from '../../../../packages/validation-schemas/src/purchasesBucaramanga.schema';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { useMovementStore } from '../../../store/useMovementStore';
import { useSupplierStore } from '../../../store/useSupplierStore';
import { useWarehouseStore } from '../../../store/useWarehouseStore';

interface BucaramangaReceivingWizardProps {
  onFinalizado?: () => void;
}

export const BucaramangaReceivingWizard: React.FC<BucaramangaReceivingWizardProps> = ({
  onFinalizado,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [pedidos, setPedidos] = useState<PedidoCompraBucaramanga[]>([]);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string>('');
  const [historialRecepciones, setHistorialRecepciones] = useState<RecepcionBucaramangaCompleta[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Datos del Paso 1: El Furgón
  const [supplierId, setSupplierId] = useState('prov-caribe-01');
  const [supplierName, setSupplierName] = useState('Comercializadora Pesquera del Caribe (Cartagena)');
  const [truckPlate, setTruckPlate] = useState('WDF-452');
  const [transportCompany, setTransportCompany] = useState('Transfrío del Oriente');
  const [shippingGuideNumber, setShippingGuideNumber] = useState('REM-8821');
  const [refrigerationTempC, setRefrigerationTempC] = useState<number>(1.5);
  const [tipoProducto, setTipoProducto] = useState<'FRESCO' | 'CONGELADO'>('FRESCO');
  const [inspectorName, setInspectorName] = useState('Operario Bodega Bucaramanga');
  const [totalFreightCost, setTotalFreightCost] = useState<number>(350000);
  const [advancePaymentDeducted, setAdvancePaymentDeducted] = useState<number>(2000000);

  // Datos del Paso 2: La Báscula
  const [crates, setCrates] = useState<PesajeCanastillaBucaramanga[]>([]);
  const [currentSku, setCurrentSku] = useState('SIERRA-01');
  const [currentProductName, setCurrentProductName] = useState('Sierra Entera Fresca');
  const [currentGrossWeight, setCurrentGrossWeight] = useState<number | ''>(52.0);
  const [currentCrateTare, setCurrentCrateTare] = useState<number>(2.0);
  const [currentIceDeductionPct, setCurrentIceDeductionPct] = useState<number>(0);
  const [currentUnitCost, setCurrentUnitCost] = useState<number>(20000);
  const [currentWarehouseId, setCurrentWarehouseId] = useState('cava-principal');

  // Datos del Paso 3: El Frío y la Plata
  const [paymentStatus, setPaymentStatus] = useState<'PENDIENTE' | 'PAGADO_CONTADO' | 'CREDITO'>('CREDITO');
  const [debitarCajaFlete, setDebitarCajaFlete] = useState<boolean>(true);
  const [debitarCajaProveedor, setDebitarCajaProveedor] = useState<boolean>(false);
  const [metodoPagoFlete, setMetodoPagoFlete] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [metodoPagoProveedor, setMetodoPagoProveedor] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('TRANSFERENCIA');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Hook de Báscula
  const { leerPeso, reading: readingScale, error: scaleError } = useBalanza();

  // Stores
  const { bodegas } = useWarehouseStore();
  const { addMovimiento } = useMovementStore();

  useEffect(() => {
    const list = obtenerPedidosCompraBucaramanga();
    setPedidos(list);
    setHistorialRecepciones(obtenerRecepcionesBucaramanga());

    // Si hay un pedido en tránsito, preseleccionarlo
    const enTransito = list.find((p) => p.estado === 'EN_TRANSITO');
    if (enTransito) {
      seleccionarPedido(enTransito);
    }
  }, []);

  const seleccionarPedido = (p: PedidoCompraBucaramanga) => {
    setSelectedPedidoId(p.id);
    setSupplierId(p.proveedorId);
    setSupplierName(p.proveedorNombre);
    setTotalFreightCost(p.fleteEstimadoTotal);
    setAdvancePaymentDeducted(p.anticipoMonto);
    if (p.especiesEstimadas.length > 0) {
      setCurrentSku(p.especiesEstimadas[0].sku);
      setCurrentProductName(p.especiesEstimadas[0].nombre);
      setCurrentUnitCost(p.especiesEstimadas[0].precioPactadoKg);
    }
  };

  // Lectura de báscula con Web Serial API y fallback manual
  const handleCapturarBascula = async () => {
    try {
      const peso = await leerPeso(9600);
      setCurrentGrossWeight(Number(peso.toFixed(2)));
      Swal.fire({
        icon: 'success',
        title: 'Peso Capturado',
        text: `Báscula registró: ${peso.toFixed(2)} kg`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'info',
        title: 'Báscula en modo manual',
        text: 'Ingrese el peso directamente usando el teclado numérico de la pantalla.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Cálculo en vivo de la canastilla actual
  const previewNetWeight = useMemo(() => {
    const gross = typeof currentGrossWeight === 'number' ? currentGrossWeight : 0;
    if (gross <= currentCrateTare) return 0;
    const { netWeightKg } = calcularPesajeCanastilla(gross, currentCrateTare, currentIceDeductionPct);
    return netWeightKg;
  }, [currentGrossWeight, currentCrateTare, currentIceDeductionPct]);

  // Agregar canastilla pesada
  const handleAgregarCanastilla = () => {
    const gross = typeof currentGrossWeight === 'number' ? currentGrossWeight : 0;
    if (gross <= currentCrateTare) {
      Swal.fire({
        icon: 'warning',
        title: 'Peso Inválido',
        text: 'El peso bruto en báscula debe ser mayor que la tara de la canastilla (2.0 kg).',
      });
      return;
    }

    const nuevaCanastilla: PesajeCanastillaBucaramanga = {
      crateNumber: crates.length + 1,
      sku: currentSku,
      productName: currentProductName,
      crateTareKg: currentCrateTare,
      grossWeightKg: gross,
      iceDeductionPct: currentIceDeductionPct,
      unitCostOriginKg: currentUnitCost,
      warehouseId: currentWarehouseId,
      shelfLifeDays: tipoProducto === 'FRESCO' ? 5 : 90,
    };

    setCrates((prev) => [...prev, nuevaCanastilla]);

    // Dejar listo para la siguiente pesada manteniendo valores clave
    setCurrentGrossWeight('');
  };

  const handleEliminarCanastilla = (index: number) => {
    setCrates((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, crateNumber: i + 1 })));
  };

  // Liquidación global en tiempo real
  const liquidacion = useMemo(() => {
    return calcularLiquidacionBucaramanga(crates, totalFreightCost, advancePaymentDeducted);
  }, [crates, totalFreightCost, advancePaymentDeducted]);

  // Finalizar recepción y guardar en almacenes
  const handleFinalizarRecepcion = async () => {
    if (crates.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin Pesajes', text: 'Debe registrar al menos una canastilla pesada.' });
      return;
    }

    setIsSaving(true);
    const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numRecepcion = `REC-BCM-${hoyStr}-${(historialRecepciones.length + 1).toString().padStart(3, '0')}`;

    const res = await registrarRecepcionBucaramanga({
      receptionNumber: numRecepcion,
      purchaseOrderId: selectedPedidoId || undefined,
      supplierId,
      supplierName,
      truckPlate: truckPlate.trim().toUpperCase(),
      transportCompany,
      shippingGuideNumber,
      refrigerationTempC,
      tipoProducto,
      sensoryStatus: 'ACEPTADO',
      inspectorName,
      crates,
      totalFreightCost,
      advancePaymentDeducted,
      paymentStatus,
      notes,
    });

    setIsSaving(false);

    if (res.error) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: res.error });
      return;
    }

    // Registrar movimiento en el kardex general
    addMovimiento({
      id: `mov-bcm-${Date.now()}`,
      tipo: 'ENTRADA_COMPRA',
      sku: crates[0]?.sku || 'PESCADO-MIX',
      nombreProducto: crates[0]?.productName || 'Lote Pescado Fresco',
      cantidad: liquidacion.totalNetWeightKg,
      lote: numRecepcion,
      bodegaOrigen: `Furgón ${truckPlate}`,
      bodegaDestino: 'Cuarto Frío Principal',
      actor: inspectorName,
      timestamp: new Date().toISOString(),
      notas: `Recepción Bucaramanga ${numRecepcion} - Prov: ${supplierName}`,
    });

    // Liquidar egresos en la caja activa si fue seleccionado
    let textoEgresos = '';
    const cajasDisponibles = cashService.getCajas();
    const cajaActiva = cajasDisponibles.find(c => cashService.getTurnoActivo(c.id));
    const turnoActivo = cajaActiva ? cashService.getTurnoActivo(cajaActiva.id) : null;

    if (res.data && turnoActivo && cajaActiva && (debitarCajaFlete || (paymentStatus === 'PAGADO_CONTADO' && debitarCajaProveedor))) {
      const resCaja = liquidarEgresoCajaRecepcion({
        cajaId: cajaActiva.id,
        turnoId: turnoActivo.id,
        recepcion: res.data.recepcion,
        pagarFlete: debitarCajaFlete,
        metodoPagoFlete,
        pagarProveedor: paymentStatus === 'PAGADO_CONTADO' && debitarCajaProveedor,
        metodoPagoProveedor,
        usuarioId: inspectorName,
      });

      if (resCaja.error) {
        Swal.fire({
          icon: 'warning',
          title: 'Recepción guardada, pero ocurrió un aviso en Caja',
          text: resCaja.error,
        });
      } else if (resCaja.egresosRegistrados.length > 0) {
        const totalDebitado = resCaja.egresosRegistrados.reduce((acc, eg) => acc + eg.monto, 0);
        textoEgresos = `<p class="text-amber-400 font-bold"><strong>Egresos Registrados en Caja:</strong> $${totalDebitado.toLocaleString()} COP debitados de ${cajaActiva.nombre}.</p>`;
      }
    }

    Swal.fire({
      icon: 'success',
      title: '¡Pescado Guardado en el Frío!',
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>Consecutivo:</strong> ${numRecepcion}</p>
          <p><strong>Kilos Netos Guardados:</strong> ${liquidacion.totalNetWeightKg.toLocaleString()} kg</p>
          <p><strong>Costo Real Puesto en BCM:</strong> $${liquidacion.landedCostTotal.toLocaleString()} COP</p>
          <p class="text-emerald-400 font-bold"><strong>Saldo Liquidado al Proveedor:</strong> $${liquidacion.balanceToPaySupplier.toLocaleString()} COP</p>
          ${textoEgresos}
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#059669',
    });

    // Resetear Wizard
    setCrates([]);
    setCurrentStep(1);
    setHistorialRecepciones(obtenerRecepcionesBucaramanga());
    setPedidos(obtenerPedidosCompraBucaramanga());
    if (onFinalizado) onFinalizado();
  };

  // Semáforo de temperatura para Bucaramanga
  const tempStatus = useMemo(() => {
    if (tipoProducto === 'FRESCO') {
      if (refrigerationTempC <= 2.0) return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: '🟢 ÓPTIMA (0°C a 2°C)' };
      if (refrigerationTempC <= 4.0) return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: '🟡 PRECAUCIÓN (2.1°C a 4.0°C)' };
      return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: '🔴 ALERTA SANITARIA (> 4.0°C)' };
    } else {
      if (refrigerationTempC <= -18.0) return { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', label: '🔵 ÓPTIMA (<= -18°C)' };
      if (refrigerationTempC <= -15.0) return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: '🟡 LÍMITE (-15°C a -18°C)' };
      return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: '🔴 DESCONGELAMIENTO (> -15°C)' };
    }
  }, [refrigerationTempC, tipoProducto]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Cabecera Operativa - "Regla de los 12 Años" */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Llegada de Furgón y Descargue (Bucaramanga)
              </h1>
              <p className="text-sm text-slate-400">
                Paso a paso táctil para pesar canastillas, revisar frío y guardar en la cava sin errores.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium border border-slate-700 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            {mostrarHistorial ? 'Ocultar Historial' : 'Ver Descargues Anteriores'}
          </button>
        </div>
      </div>

      {/* Historial Plegable */}
      {mostrarHistorial && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Últimas Recepciones en Bodega Bucaramanga
          </h3>
          {historialRecepciones.length === 0 ? (
            <p className="text-sm text-slate-500">No hay recepciones registradas en el dispositivo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historialRecepciones.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-cyan-400 text-sm">{rec.receptionNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {rec.truckPlate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium truncate">{rec.supplierName}</p>
                  <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>{rec.liquidacion.totalNetWeightKg.toLocaleString()} kg netos</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      ${rec.liquidacion.balanceToPaySupplier.toLocaleString()} COP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Indicador Visual de 3 Pasos (WIZARD) */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setCurrentStep(1)}
          className={`min-h-[56px] p-4 rounded-xl border flex items-center justify-center gap-3 transition text-base font-bold ${
            currentStep === 1
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-6 h-6 text-cyan-400" />
          <span>1. El Furgón</span>
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          className={`min-h-[56px] p-4 rounded-xl border flex items-center justify-center gap-3 transition text-base font-bold ${
            currentStep === 2
              ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-6 h-6 text-blue-400" />
          <span>2. La Báscula ({crates.length})</span>
        </button>

        <button
          onClick={() => setCurrentStep(3)}
          className={`min-h-[56px] p-4 rounded-xl border flex items-center justify-center gap-3 transition text-base font-bold ${
            currentStep === 3
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Snowflake className="w-6 h-6 text-emerald-400" />
          <span>3. El Frío y la Plata</span>
        </button>
      </div>

      {/* CONTENIDO DEL PASO 1: EL FURGÓN */}
      {currentStep === 1 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-cyan-400" />
              Paso 1: ¿De dónde viene el camión y cómo llegó el frío?
            </h2>
            <p className="text-sm text-slate-400">
              Seleccione el pedido acordado con la costa o ingrese los datos del transporte que está en la rampa.
            </p>
          </div>

          {/* Pedidos previos acordados */}
          {pedidos.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300">
                Pedidos en Camino (Costa / Criaderos):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pedidos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => seleccionarPedido(p)}
                    className={`min-h-[56px] p-4 rounded-xl border text-left transition ${
                      selectedPedidoId === p.id
                        ? 'bg-cyan-500/15 border-cyan-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-cyan-400 text-sm">{p.consecutivo}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.ciudadOrigen}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{p.proveedorNombre}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Anticipo consignado: ${p.anticipoMonto.toLocaleString()} COP | Flete: ${p.fleteEstimadoTotal.toLocaleString()} COP
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulario táctil del vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Placa del Furgón / Camión:</label>
              <input
                type="text"
                value={truckPlate}
                onChange={(e) => setTruckPlate(e.target.value)}
                placeholder="Ej. WDF-452"
                className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-white uppercase focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Tipo de Conservación:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoProducto('FRESCO')}
                  className={`min-h-[48px] rounded-xl font-bold text-sm border transition ${
                    tipoProducto === 'FRESCO'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Fresco (con Hielo)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoProducto('CONGELADO')}
                  className={`min-h-[48px] rounded-xl font-bold text-sm border transition ${
                    tipoProducto === 'CONGELADO'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Congelado (-18°C)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                <span>Temperatura al Abrir Furgón:</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${tempStatus.color}`}>
                  {tempStatus.label}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={refrigerationTempC}
                  onChange={(e) => setRefrigerationTempC(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700 rounded-xl text-xl font-bold text-white focus:border-cyan-400 outline-none"
                />
                <span className="absolute right-4 top-3 text-slate-500 font-bold">°C</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Empresa de Transporte / Flete:</label>
              <input
                type="text"
                value={transportCompany}
                onChange={(e) => setTransportCompany(e.target.value)}
                placeholder="Ej. Transfrío / Particular"
                className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Costo Total del Flete (Transporte):</label>
              <input
                type="number"
                value={totalFreightCost}
                onChange={(e) => setTotalFreightCost(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-amber-400 focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Anticipo Ya Consignado al Proveedor:</label>
              <input
                type="number"
                value={advancePaymentDeducted}
                onChange={(e) => setAdvancePaymentDeducted(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-emerald-400 focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="min-h-[52px] px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/20 transition flex items-center gap-3"
            >
              <span>Continuar a la Báscula</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 2: LA BÁSCULA */}
      {currentStep === 2 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Scale className="w-6 h-6 text-blue-400" />
                Paso 2: Pesaje Canastilla por Canastilla
              </h2>
              <p className="text-sm text-slate-400">
                Ponga la canastilla en la báscula, capture el peso y pulse agregar. La tara y el hielo se descuentan solos.
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-right">
              <span className="text-xs text-blue-300 font-semibold block">Kilos Netos Acumulados:</span>
              <span className="text-2xl font-black text-white font-mono">
                {liquidacion.totalNetWeightKg.toLocaleString()} kg
              </span>
            </div>
          </div>

          {/* Panel de Pesaje Rápido */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/70 p-6 rounded-2xl border border-slate-800">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Especie a Pesar:</label>
                  <select
                    value={currentSku}
                    onChange={(e) => {
                      setCurrentSku(e.target.value);
                      const opt = e.target.options[e.target.selectedIndex];
                      setCurrentProductName(opt.text);
                    }}
                    className="w-full min-h-[48px] px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium outline-none"
                  >
                    <option value="SIERRA-01">Sierra Entera Fresca</option>
                    <option value="PARGO-01">Pargo Rojo Entero</option>
                    <option value="CORV-01">Corvina del Pacífico</option>
                    <option value="SALMON-01">Salmón Chileno</option>
                    <option value="CAMARON-01">Camarón Tití / Tigre</option>
                    <option value="BAGRE-01">Bagre Rayado del Magdalena</option>
                    <option value="TILAPIA-01">Mojarra / Tilapia Roja</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Precio Compra Pactado ($/kg):</label>
                  <input
                    type="number"
                    value={currentUnitCost}
                    onChange={(e) => setCurrentUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[48px] px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold font-mono outline-none"
                  />
                </div>
              </div>

              {/* Botón Gigante de Captura de Báscula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <button
                  type="button"
                  onClick={handleCapturarBascula}
                  disabled={readingScale}
                  className="min-h-[56px] w-full bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-3 shadow-lg shadow-cyan-600/20 transition"
                >
                  <Scale className="w-6 h-6" />
                  <span>{readingScale ? 'Leyendo Báscula...' : 'Capturar Peso Báscula'}</span>
                </button>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Peso Bruto en Báscula (kg):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentGrossWeight}
                    onChange={(e) => setCurrentGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full min-h-[56px] px-4 bg-slate-900 border-2 border-cyan-500/40 rounded-xl text-3xl font-black text-cyan-300 font-mono text-center outline-none"
                  />
                </div>
              </div>

              {/* Descuentos de Tara e Hielo */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Tara Canastilla Plástica:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-400 font-mono">- {currentCrateTare} kg</span>
                    <span className="text-xs text-slate-500">(Estándar)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Descuento Hielo / Agua:</span>
                  <div className="flex gap-2">
                    {[0, 2, 3, 5].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setCurrentIceDeductionPct(pct)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                          currentIceDeductionPct === pct
                            ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Visor Gigante de Resultado de la Canastilla */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/90 p-6 rounded-xl border border-slate-800">
              <div className="space-y-2 text-center">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Canastilla #{crates.length + 1} - Peso Neto Real
                </span>
                <div className="text-5xl font-black text-emerald-400 font-mono py-4">
                  {previewNetWeight.toFixed(2)} <span className="text-2xl text-slate-400 font-sans">kg</span>
                </div>
                <p className="text-xs text-slate-400">
                  Subtotal Compra: ${(previewNetWeight * currentUnitCost).toLocaleString()} COP
                </p>
              </div>

              <button
                type="button"
                onClick={handleAgregarCanastilla}
                disabled={previewNetWeight <= 0}
                className="min-h-[56px] w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <Plus className="w-6 h-6" />
                <span>+ Guardar Pesada Canastilla</span>
              </button>
            </div>
          </div>

          {/* Tabla Táctil de Canastillas Pesadas */}
          {crates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center justify-between">
                <span>Canastillas Registradas en el Lote ({crates.length})</span>
                <span className="text-xs text-slate-400 font-normal">
                  Total Bruto: {liquidacion.totalGrossWeightKg} kg | Taras e Hielo: -{(liquidacion.totalTareKg + liquidacion.totalIceKg).toFixed(1)} kg
                </span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Especie</th>
                      <th className="px-4 py-3">Bruto</th>
                      <th className="px-4 py-3">Tara</th>
                      <th className="px-4 py-3">Neto Real</th>
                      <th className="px-4 py-3">$/kg Origen</th>
                      <th className="px-4 py-3">Subtotal</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50 font-mono">
                    {crates.map((c, index) => {
                      const net = (c.grossWeightKg - c.crateTareKg) * (1 - c.iceDeductionPct / 100);
                      return (
                        <tr key={index} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-bold text-cyan-400">{c.crateNumber}</td>
                          <td className="px-4 py-3 font-sans text-white font-medium">{c.productName}</td>
                          <td className="px-4 py-3">{c.grossWeightKg.toFixed(2)} kg</td>
                          <td className="px-4 py-3 text-amber-400">-{c.crateTareKg} kg</td>
                          <td className="px-4 py-3 font-bold text-emerald-400">{net.toFixed(2)} kg</td>
                          <td className="px-4 py-3">${c.unitCostOriginKg.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold">${(net * c.unitCostOriginKg).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleEliminarCanastilla(index)}
                              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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
          )}

          {/* Navegación entre pasos */}
          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="min-h-[52px] px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-base transition flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Furgón</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              disabled={crates.length === 0}
              className="min-h-[52px] px-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/20 transition flex items-center gap-3"
            >
              <span>Ir al Frío y Liquidar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 3: EL FRÍO Y LA PLATA */}
      {currentStep === 3 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Snowflake className="w-6 h-6 text-emerald-400" />
              Paso 3: ¿A qué Cuarto Frío va y cómo se liquida la cuenta?
            </h2>
            <p className="text-sm text-slate-400">
              Asigne la cava de almacenamiento y revise la cuenta final con el flete prorrateado y el saldo a pagar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Asignación de Cuarto Frío */}
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Cuarto Frío / Cava de Destino (Bucaramanga):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentWarehouseId('cava-principal')}
                    className={`min-h-[56px] p-4 rounded-xl border text-left transition ${
                      currentWarehouseId === 'cava-principal'
                        ? 'bg-blue-500/20 border-blue-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-blue-300">
                      <Snowflake className="w-5 h-5" />
                      <span>Cava Principal (Fresco 0°C)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Capacidad: 12.000 kg | FEFO Activo</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentWarehouseId('cava-congelados')}
                    className={`min-h-[56px] p-4 rounded-xl border text-left transition ${
                      currentWarehouseId === 'cava-congelados'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-cyan-300">
                      <Snowflake className="w-5 h-5" />
                      <span>Cava 2 (Congelados -18°C)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Capacidad: 8.000 kg | Larga estancia</p>
                  </button>
                </div>
              </div>

              {/* Forma de Pago del Saldo */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-slate-300">
                  Forma de Pago del Saldo al Proveedor:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PAGADO_CONTADO')}
                    className={`min-h-[48px] rounded-xl font-bold text-sm border transition ${
                      paymentStatus === 'PAGADO_CONTADO'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Contado (Sale de Caja/Banco Hoy)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus('CREDITO')}
                    className={`min-h-[48px] rounded-xl font-bold text-sm border transition ${
                      paymentStatus === 'CREDITO'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Queda Debiendo (A Crédito 15-30 Días)
                  </button>
                </div>
              </div>

              {/* Opciones de Débito Inmediato en Caja */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Salida de Dinero desde Caja de Hoy:</span>
                </div>

                {/* Opción Flete */}
                <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-200">Pagar Flete del Camión ($ {totalFreightCost.toLocaleString()} COP)</span>
                    <p className="text-[11px] text-slate-400">Sale de caja para pagar al transportador</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={metodoPagoFlete}
                      onChange={(e) => setMetodoPagoFlete(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                    <input
                      type="checkbox"
                      checked={debitarCajaFlete}
                      onChange={(e) => setDebitarCajaFlete(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Opción Proveedor si es de Contado */}
                {paymentStatus === 'PAGADO_CONTADO' && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-emerald-300">Pagar Pescado de Contado ($ {liquidacion.balanceToPaySupplier.toLocaleString()} COP)</span>
                      <p className="text-[11px] text-slate-400">Debitar de caja/bancos para el proveedor</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={metodoPagoProveedor}
                        onChange={(e) => setMetodoPagoProveedor(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs outline-none"
                      >
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="EFECTIVO">Efectivo</option>
                      </select>
                      <input
                        type="checkbox"
                        checked={debitarCajaProveedor}
                        onChange={(e) => setDebitarCajaProveedor(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Observaciones del Descargue:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles de calidad, estado de canastillas o novedades del viaje..."
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Liquidación Económica en Detalle Transparente */}
            <div className="lg:col-span-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Resumen de Liquidación Puesto en Bucaramanga</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
                  {liquidacion.totalCrates} canastillas
                </span>
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Kilos Netos de Pescado:</span>
                  <span className="font-bold font-mono">{liquidacion.totalNetWeightKg.toLocaleString()} kg</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Costo Compra en Origen:</span>
                  <span className="font-bold font-mono">${liquidacion.totalPurchaseCost.toLocaleString()} COP</span>
                </div>

                <div className="flex justify-between text-amber-400">
                  <span>+ Flete de Transporte Furgón:</span>
                  <span className="font-bold font-mono">+ ${liquidacion.totalFreightCost.toLocaleString()} COP</span>
                </div>

                <div className="flex justify-between text-blue-300 font-semibold pt-1 border-t border-slate-800/80">
                  <span>Flete Prorrateado por Kilo:</span>
                  <span className="font-mono">${liquidacion.proratedFreightPerKg.toLocaleString()} COP / kg</span>
                </div>

                <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                  <span>Costo Real Total (Landed Cost):</span>
                  <span className="font-mono text-cyan-400">${liquidacion.landedCostTotal.toLocaleString()} COP</span>
                </div>

                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>- Anticipo Consignado Previo:</span>
                  <span className="font-mono">- ${liquidacion.advancePaymentDeducted.toLocaleString()} COP</span>
                </div>
              </div>

              {/* Saldo Final Gigante */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center space-y-1 mt-4">
                <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase">
                  Saldo Neto a Pagar al Proveedor:
                </span>
                <div className="text-4xl font-black text-emerald-400 font-mono">
                  ${liquidacion.balanceToPaySupplier.toLocaleString()}{' '}
                  <span className="text-lg text-emerald-300 font-sans">COP</span>
                </div>
                <span className="text-xs text-slate-400">
                  {paymentStatus === 'CREDITO' ? 'Se registrará en Cuentas por Pagar' : 'Se liquidará contra Caja/Banco'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFinalizarRecepcion}
                disabled={isSaving}
                className="min-h-[56px] w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-black rounded-xl text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/25 transition mt-4"
              >
                <CheckCircle className="w-6 h-6" />
                <span>{isSaving ? 'Guardando Lotes en Cava...' : '✓ Guardar en el Frío y Finalizar'}</span>
              </button>
            </div>
          </div>

          {/* Navegación hacia atrás */}
          <div className="pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="min-h-[48px] px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Báscula</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
