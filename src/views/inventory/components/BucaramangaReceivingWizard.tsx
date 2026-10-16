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
  ShoppingCart,
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
import { useWarehouseStore } from '../../../store/useWarehouseStore';
import { load } from '../../../services/localDb';
import { ejecutarAbastecimientoInmediato } from '../../../services/branchInventoryService';

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
  const [transferirMostrador, setTransferirMostrador] = useState<boolean>(false);
  const [transferPOSId, setTransferPOSId] = useState<string>('mostrador-principal');
  const [cantidadTransferir, setCantidadTransferir] = useState<string>('');

  // Simulación de los mostradores de la sucursal actual
  const mostradoresSucursal = [
    { id: 'mostrador-principal', nombre: 'Punto de Venta Principal' },
    { id: 'mostrador-express', nombre: 'Punto Express' }
  ];

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
      transferToPOS: transferirMostrador,
      transferPOSId: transferirMostrador ? transferPOSId : undefined,
      transferQuantityKg: transferirMostrador ? (parseFloat(cantidadTransferir) || 0) : 0,
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

    // Si ya se marco traslado durante el paso 3, ejecutarlo de inmediato
    if (transferirMostrador && transferPOSId && parseFloat(cantidadTransferir) > 0) {
      ejecutarAbastecimientoInmediato({
        bodegaPrincipalId: 'b-1',
        sucursalId: transferPOSId,
        productoId: crates[0]?.sku || 'PESCADO-MIX',
        cantidad: parseFloat(cantidadTransferir),
        usuarioResponsable: inspectorName,
        motivo: 'TRASLADO_DIRECTO_RECEPCION_COMPRA',
      });
    }

    const confirmAlert = await Swal.fire({
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
      showCancelButton: !transferirMostrador,
      confirmButtonText: 'Entendido',
      cancelButtonText: '⚡ Trasladar a Sucursal / POS',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#0ea5e9',
    });

    // Flujo Dual: si no habia transferido antes y pulsa el boton rapido
    if (!transferirMostrador && confirmAlert.dismiss === Swal.DismissReason.cancel) {
      const bodegasDisponibles = load<any[]>('bodegas', []);
      const sucursales = bodegasDisponibles.filter(
        (b) => b.esPuntoVenta || b.tipo === 'PUNTO_VENTA' || (b.id && b.id.includes('pos'))
      );
      const optionsHtml = (sucursales.length > 0 ? sucursales : [
        { id: 'b-pos-1', nombre: 'Punto de Venta Mostrador' },
        { id: 'b-pos-2', nombre: 'Punto de Venta Norte' }
      ])
        .map((s) => `<option value="${s.id}">${s.nombre}</option>`)
        .join('');

      const { value: transferVals } = await Swal.fire({
        title: 'Abastecimiento Rápido a Sucursal',
        html: `
          <div style="text-align: left; font-family: inherit;">
            <label style="font-size: 12px; font-weight: bold; color: #475569;">Punto de Venta / Sucursal:</label>
            <select id="swal-branch-id" class="swal2-select" style="width: 100%; margin: 6px 0 12px 0;">${optionsHtml}</select>
            <label style="font-size: 12px; font-weight: bold; color: #475569;">Cantidad a Trasladar (kg):</label>
            <input id="swal-branch-qty" type="number" step="any" max="${liquidacion.totalNetWeightKg}" class="swal2-input" placeholder="Ej: 20" style="width: 100%; margin: 6px 0 0 0;" />
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '⚡ Confirmar Traslado',
        confirmButtonColor: '#0ea5e9',
        preConfirm: () => {
          const bId = (document.getElementById('swal-branch-id') as HTMLSelectElement)?.value;
          const qty = parseFloat((document.getElementById('swal-branch-qty') as HTMLInputElement)?.value || '0');
          if (!bId || isNaN(qty) || qty <= 0 || qty > liquidacion.totalNetWeightKg) {
            Swal.showValidationMessage('Ingrese una cantidad válida menor o igual a los kilos del lote');
            return false;
          }
          return { bId, qty };
        },
      });

      if (transferVals) {
        ejecutarAbastecimientoInmediato({
          bodegaPrincipalId: 'b-1',
          sucursalId: transferVals.bId,
          productoId: crates[0]?.sku || 'PESCADO-MIX',
          cantidad: transferVals.qty,
          usuarioResponsable: inspectorName,
          motivo: 'TRASLADO_RAPIDO_POST_COMPRA',
        });
        Swal.fire({
          icon: 'success',
          title: '¡Traslado Exitoso!',
          text: `Se trasladaron ${transferVals.qty} kg a la sucursal seleccionada.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }

    // Resetear Wizard
    setCrates([]);
    setCurrentStep(1);
    setHistorialRecepciones(obtenerRecepcionesBucaramanga());
    setPedidos(obtenerPedidosCompraBucaramanga());
    if (onFinalizado) onFinalizado();
  };

  // Semáforo de temperatura para Bucaramanga en Light Mode WCAG 2.2 AA+
  const tempStatus = useMemo(() => {
    if (tipoProducto === 'FRESCO') {
      if (refrigerationTempC <= 2.0) return { color: 'text-emerald-800 bg-emerald-50 border-emerald-300 font-bold', label: '🟢 ÓPTIMA (0°C a 2°C)' };
      if (refrigerationTempC <= 4.0) return { color: 'text-amber-800 bg-amber-50 border-amber-300 font-bold', label: '🟡 PRECAUCIÓN (2.1°C a 4.0°C)' };
      return { color: 'text-rose-800 bg-rose-50 border-rose-300 font-bold', label: '🔴 ALERTA SANITARIA (> 4.0°C)' };
    } else {
      if (refrigerationTempC <= -18.0) return { color: 'text-cyan-800 bg-cyan-50 border-cyan-300 font-bold', label: '🔵 ÓPTIMA (<= -18°C)' };
      if (refrigerationTempC <= -15.0) return { color: 'text-amber-800 bg-amber-50 border-amber-300 font-bold', label: '🟡 LÍMITE (-15°C a -18°C)' };
      return { color: 'text-rose-800 bg-rose-50 border-rose-300 font-bold', label: '🔴 DESCONGELAMIENTO (> -15°C)' };
    }
  }, [refrigerationTempC, tipoProducto]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Cabecera Operativa - "Regla del Niño de 12 Años" */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-600">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">
                Llegada de Furgón y Descargue (Bucaramanga)
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1 m-0">
                Paso a paso táctil para pesar canastillas, revisar frío y guardar en la cava sin errores.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="btn-toggle-historial"
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="min-h-[48px] h-12 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold border-2 border-slate-200 transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            {mostrarHistorial ? 'Ocultar Historial' : 'Ver Descargues Anteriores'}
          </button>
        </div>
      </div>

      {/* Historial Plegable */}
      {mostrarHistorial && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm animate-fade-in">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 m-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Últimas Recepciones en Bodega Bucaramanga
          </h3>
          {historialRecepciones.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 m-0">No hay recepciones registradas en el dispositivo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historialRecepciones.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-black text-indigo-700 text-sm">{rec.receptionNumber}</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold">
                      {rec.truckPlate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-bold truncate m-0">{rec.supplierName}</p>
                  <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <span className="font-semibold">{rec.liquidacion.totalNetWeightKg.toLocaleString()} kg netos</span>
                    <span className="text-emerald-700 font-black font-mono">
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
          type="button"
          data-testid="step-btn-furgon"
          onClick={() => setCurrentStep(1)}
          className={`min-h-[56px] h-14 p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition text-sm md:text-base font-black cursor-pointer ${
            currentStep === 1
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Truck className={`w-5 h-5 md:w-6 md:h-6 ${currentStep === 1 ? 'text-white' : 'text-slate-500'}`} />
          <span className="truncate">1. El Furgón</span>
        </button>

        <button
          type="button"
          data-testid="step-btn-bascula"
          onClick={() => setCurrentStep(2)}
          className={`min-h-[56px] h-14 p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition text-sm md:text-base font-black cursor-pointer ${
            currentStep === 2
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Scale className={`w-5 h-5 md:w-6 md:h-6 ${currentStep === 2 ? 'text-white' : 'text-slate-500'}`} />
          <span className="truncate">2. La Báscula ({crates.length})</span>
        </button>

        <button
          type="button"
          data-testid="step-btn-frio"
          onClick={() => setCurrentStep(3)}
          className={`min-h-[56px] h-14 p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition text-sm md:text-base font-black cursor-pointer ${
            currentStep === 3
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Snowflake className={`w-5 h-5 md:w-6 md:h-6 ${currentStep === 3 ? 'text-white' : 'text-slate-500'}`} />
          <span className="truncate">3. El Frío y la Plata</span>
        </button>
      </div>

      {/* CONTENIDO DEL PASO 1: EL FURGÓN */}
      {currentStep === 1 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 m-0">
              <Truck className="w-6 h-6 text-indigo-600" />
              Paso 1: ¿De dónde viene el camión y cómo llegó el frío?
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 m-0">
              Seleccione el pedido acordado con la costa o ingrese los datos del transporte que está en la rampa.
            </p>
          </div>

          {/* Pedidos previos acordados */}
          {pedidos.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Pedidos en Camino (Costa / Criaderos):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pedidos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => seleccionarPedido(p)}
                    className={`min-h-[56px] p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      selectedPedidoId === p.id
                        ? 'bg-indigo-50 border-indigo-600 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-indigo-600 text-sm">{p.consecutivo}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                        {p.ciudadOrigen}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 m-0">{p.proveedorNombre}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1 m-0">
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
              <label className="text-xs font-black uppercase text-slate-700">Placa del Furgón / Camión:</label>
              <input
                type="text"
                value={truckPlate}
                onChange={(e) => setTruckPlate(e.target.value)}
                placeholder="Ej. WDF-452"
                className="w-full min-h-[48px] h-12 px-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-lg font-black text-slate-900 uppercase outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700">Tipo de Conservación:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoProducto('FRESCO')}
                  className={`min-h-[48px] h-12 rounded-xl font-black text-xs md:text-sm border-2 transition cursor-pointer ${
                    tipoProducto === 'FRESCO'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Fresco (con Hielo)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoProducto('CONGELADO')}
                  className={`min-h-[48px] h-12 rounded-xl font-black text-xs md:text-sm border-2 transition cursor-pointer ${
                    tipoProducto === 'CONGELADO'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Congelado (-18°C)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 flex items-center justify-between">
                <span>Temperatura al Abrir Furgón:</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-bold ${tempStatus.color}`}>
                  {tempStatus.label}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={refrigerationTempC}
                  onChange={(e) => setRefrigerationTempC(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[48px] h-12 px-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-xl font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-4 top-3 text-slate-400 font-black">°C</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700">Empresa de Transporte / Flete:</label>
              <input
                type="text"
                value={transportCompany}
                onChange={(e) => setTransportCompany(e.target.value)}
                placeholder="Ej. Transfrío / Particular"
                className="w-full min-h-[48px] h-12 px-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700">Costo Total del Flete (Transporte):</label>
              <input
                type="number"
                value={totalFreightCost}
                onChange={(e) => setTotalFreightCost(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[48px] h-12 px-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-lg font-black text-amber-800 font-mono outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700">Anticipo Ya Consignado al Proveedor:</label>
              <input
                type="number"
                value={advancePaymentDeducted}
                onChange={(e) => setAdvancePaymentDeducted(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[48px] h-12 px-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-lg font-black text-emerald-800 font-mono outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              data-testid="btn-continuar-bascula"
              onClick={() => setCurrentStep(2)}
              className="min-h-[56px] h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base shadow-lg shadow-emerald-600/20 active:scale-95 transition flex items-center gap-3 cursor-pointer"
            >
              <span>Continuar a la Báscula</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 2: LA BÁSCULA */}
      {currentStep === 2 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 m-0">
                <Scale className="w-6 h-6 text-indigo-600" />
                Paso 2: Pesaje Canastilla por Canastilla
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1 m-0">
                Ponga la canastilla en la báscula, capture el peso y pulse agregar. La tara y el hielo se descuentan solos.
              </p>
            </div>

            <div className="p-3.5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-right">
              <span className="text-xs text-indigo-700 font-black uppercase tracking-wider block">Kilos Netos Acumulados:</span>
              <span className="text-2xl font-black text-indigo-900 font-mono tabular-nums">
                {liquidacion.totalNetWeightKg.toLocaleString()} kg
              </span>
            </div>
          </div>

          {/* Panel de Pesaje Rápido */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-700">Especie a Pesar:</label>
                  <select
                    value={currentSku}
                    onChange={(e) => {
                      setCurrentSku(e.target.value);
                      const opt = e.target.options[e.target.selectedIndex];
                      setCurrentProductName(opt.text);
                    }}
                    className="w-full min-h-[48px] h-12 px-3 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-slate-900 font-bold outline-none"
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
                  <label className="text-xs font-black uppercase text-slate-700">Precio Compra Pactado ($/kg):</label>
                  <input
                    type="number"
                    value={currentUnitCost}
                    onChange={(e) => setCurrentUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[48px] h-12 px-3 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl text-slate-900 font-black font-mono outline-none"
                  />
                </div>
              </div>

              {/* Botón Gigante de Captura de Báscula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <button
                  type="button"
                  data-testid="btn-capturar-bascula"
                  onClick={handleCapturarBascula}
                  disabled={readingScale}
                  className="min-h-[56px] h-14 w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-2xl text-lg flex items-center justify-center gap-3 shadow-md transition cursor-pointer"
                >
                  <Scale className="w-6 h-6" />
                  <span>{readingScale ? 'Leyendo Báscula...' : 'Capturar Peso Báscula'}</span>
                </button>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-700">Peso Bruto en Báscula (kg):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentGrossWeight}
                    onChange={(e) => setCurrentGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full min-h-[56px] h-14 px-4 bg-white border-2 border-indigo-400 focus:border-indigo-600 rounded-2xl text-3xl font-black text-indigo-700 font-mono text-center outline-none"
                  />
                </div>
              </div>

              {/* Descuentos de Tara e Hielo */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Tara Canastilla Plástica:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-amber-800 font-mono">- {currentCrateTare} kg</span>
                    <span className="text-xs text-slate-400 font-bold">(Estándar)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Descuento Hielo / Agua:</span>
                  <div className="flex gap-2">
                    {[0, 2, 3, 5].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setCurrentIceDeductionPct(pct)}
                        className={`min-w-[48px] min-h-[48px] w-12 h-12 text-xs font-black rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          currentIceDeductionPct === pct
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
            <div className="lg:col-span-5 flex flex-col justify-between bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
              <div className="space-y-2 text-center">
                <span className="text-xs font-black text-slate-500 tracking-wider uppercase">
                  Canastilla #{crates.length + 1} - Peso Neto Real
                </span>
                <div className="text-5xl font-black text-emerald-700 font-mono py-4">
                  {previewNetWeight.toFixed(2)} <span className="text-2xl text-slate-400 font-sans">kg</span>
                </div>
                <p className="text-xs font-bold text-slate-500 m-0">
                  Subtotal Compra: ${(previewNetWeight * currentUnitCost).toLocaleString()} COP
                </p>
              </div>

              <button
                type="button"
                data-testid="btn-guardar-pesada"
                onClick={handleAgregarCanastilla}
                disabled={previewNetWeight <= 0}
                className="min-h-[56px] h-14 w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-6 h-6" />
                <span>+ Guardar Pesada Canastilla</span>
              </button>
            </div>
          </div>

          {/* Tabla Táctil de Canastillas Pesadas */}
          {crates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 flex items-center justify-between m-0">
                <span>Canastillas Registradas en el Lote ({crates.length})</span>
                <span className="text-xs text-slate-500 font-bold">
                  Total Bruto: {liquidacion.totalGrossWeightKg} kg | Taras e Hielo: -{(liquidacion.totalTareKg + liquidacion.totalIceKg).toFixed(1)} kg
                </span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-xs font-black text-slate-700 uppercase">
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
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {crates.map((c, index) => {
                      const net = (c.grossWeightKg - c.crateTareKg) * (1 - c.iceDeductionPct / 100);
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-black text-indigo-700">{c.crateNumber}</td>
                          <td className="px-4 py-3 font-sans text-slate-900 font-bold">{c.productName}</td>
                          <td className="px-4 py-3 font-bold">{c.grossWeightKg.toFixed(2)} kg</td>
                          <td className="px-4 py-3 text-amber-800 font-bold">-{c.crateTareKg} kg</td>
                          <td className="px-4 py-3 font-black text-emerald-700">{net.toFixed(2)} kg</td>
                          <td className="px-4 py-3 font-bold">${c.unitCostOriginKg.toLocaleString()}</td>
                          <td className="px-4 py-3 font-black text-slate-900">${(net * c.unitCostOriginKg).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleEliminarCanastilla(index)}
                              className="min-w-[48px] min-h-[48px] w-12 h-12 text-rose-600 hover:bg-rose-50 rounded-xl transition inline-flex items-center justify-center cursor-pointer"
                              title="Eliminar pesada de canastilla"
                            >
                              <Trash2 className="w-5 h-5" />
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
              type="button"
              onClick={() => setCurrentStep(1)}
              className="min-h-[48px] h-12 px-6 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 font-bold rounded-xl text-sm transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Furgón</span>
            </button>

            <button
              type="button"
              data-testid="btn-ir-frio-liquidar"
              onClick={() => setCurrentStep(3)}
              disabled={crates.length === 0}
              className="min-h-[56px] h-14 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-base shadow-lg shadow-emerald-600/20 active:scale-95 transition flex items-center gap-3 cursor-pointer"
            >
              <span>Ir al Frío y Liquidar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 3: EL FRÍO Y LA PLATA */}
      {currentStep === 3 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 m-0">
              <Snowflake className="w-6 h-6 text-indigo-600" />
              Paso 3: ¿A qué Cuarto Frío va y cómo se liquida la cuenta?
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 m-0">
              Asigne la cava de almacenamiento y revise la cuenta final con el flete prorrateado y el saldo a pagar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Asignación de Cuarto Frío */}
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-700">
                  Cuarto Frío / Cava de Destino (Bucaramanga):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentWarehouseId('cava-principal')}
                    className={`min-h-[56px] p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      currentWarehouseId === 'cava-principal'
                        ? 'bg-indigo-50 border-indigo-600 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-indigo-700">
                      <Snowflake className="w-5 h-5" />
                      <span>Cava Principal (Fresco 0°C)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-semibold m-0">Capacidad: 12.000 kg | FEFO Activo</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentWarehouseId('cava-congelados')}
                    className={`min-h-[56px] p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      currentWarehouseId === 'cava-congelados'
                        ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-blue-700">
                      <Snowflake className="w-5 h-5" />
                      <span>Cava 2 (Congelados -18°C)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-semibold m-0">Capacidad: 8.000 kg | Larga estancia</p>
                  </button>
                </div>
              </div>

              {/* Forma de Pago del Saldo */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black uppercase text-slate-700">
                  Forma de Pago del Saldo al Proveedor:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PAGADO_CONTADO')}
                    className={`min-h-[48px] h-12 rounded-xl font-black text-xs md:text-sm border-2 transition cursor-pointer ${
                      paymentStatus === 'PAGADO_CONTADO'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Contado (Sale de Caja/Banco Hoy)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus('CREDITO')}
                    className={`min-h-[48px] h-12 rounded-xl font-black text-xs md:text-sm border-2 transition cursor-pointer ${
                      paymentStatus === 'CREDITO'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Queda Debiendo (A Crédito 15-30 Días)
                  </button>
                </div>
              </div>

              {/* Opciones de Débito Inmediato en Caja */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Salida de Dinero desde Caja de Hoy:</span>
                </div>

                {/* Opción Flete */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Pagar Flete del Camión ($ {totalFreightCost.toLocaleString()} COP)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 m-0">Sale de caja para pagar al transportador</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={metodoPagoFlete}
                      onChange={(e) => setMetodoPagoFlete(e.target.value as any)}
                      className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-1 text-xs outline-none font-bold"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                    <input
                      type="checkbox"
                      checked={debitarCajaFlete}
                      onChange={(e) => setDebitarCajaFlete(e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Opción Proveedor si es de Contado */}
                {paymentStatus === 'PAGADO_CONTADO' && (
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-emerald-800 block">Pagar Pescado de Contado ($ {liquidacion.balanceToPaySupplier.toLocaleString()} COP)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 m-0">Debitar de caja/bancos para el proveedor</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={metodoPagoProveedor}
                        onChange={(e) => setMetodoPagoProveedor(e.target.value as any)}
                        className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-1 text-xs outline-none font-bold"
                      >
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="EFECTIVO">Efectivo</option>
                      </select>
                      <input
                        type="checkbox"
                        checked={debitarCajaProveedor}
                        onChange={(e) => setDebitarCajaProveedor(e.target.checked)}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-700">Observaciones del Descargue:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles de calidad, estado de canastillas o novedades del viaje..."
                  rows={3}
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              {/* TRASLADO RÁPIDO A MOSTRADOR */}
              <div className="p-4 bg-indigo-50/50 border-2 border-indigo-200 rounded-2xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-indigo-900">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <span>Traslado Rápido a Punto de Venta (Mostrador)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={transferirMostrador}
                      onChange={(e) => {
                        setTransferirMostrador(e.target.checked);
                        if (e.target.checked && !cantidadTransferir) {
                          setCantidadTransferir(liquidacion.totalNetWeightKg.toString());
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {transferirMostrador && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 mb-1">Punto de Venta Destino:</label>
                      <select
                        value={transferPOSId}
                        onChange={(e) => setTransferPOSId(e.target.value)}
                        className="w-full min-h-[48px] h-12 bg-white border-2 border-slate-300 text-slate-900 font-bold rounded-xl px-3 text-sm outline-none focus:border-indigo-600"
                      >
                        {mostradoresSucursal.map(m => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 mb-1">Cantidad a Trasladar (kg):</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={cantidadTransferir}
                          onChange={(e) => setCantidadTransferir(e.target.value)}
                          className="w-full min-h-[48px] h-12 bg-white border-2 border-indigo-300 focus:border-indigo-600 text-slate-900 rounded-xl px-3 text-base font-black font-mono outline-none"
                        />
                        <span className="absolute right-3 top-3 text-xs text-slate-400 font-black">kg</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Máx disponible: {liquidacion.totalNetWeightKg} kg</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Liquidación Económica en Detalle Transparente */}
            <div className="lg:col-span-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center justify-between border-b border-slate-200 pb-3 m-0">
                <span>Resumen de Liquidación Puesto en Bucaramanga</span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold font-mono">
                  {liquidacion.totalCrates} canastillas
                </span>
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Kilos Netos de Pescado:</span>
                  <span className="font-black font-mono text-slate-900">{liquidacion.totalNetWeightKg.toLocaleString()} kg</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Costo Compra en Origen:</span>
                  <span className="font-black font-mono text-slate-900">${liquidacion.totalPurchaseCost.toLocaleString()} COP</span>
                </div>

                <div className="flex justify-between text-amber-800 font-bold">
                  <span>+ Flete de Transporte Furgón:</span>
                  <span className="font-mono">+ ${liquidacion.totalFreightCost.toLocaleString()} COP</span>
                </div>

                <div className="flex justify-between text-indigo-700 font-bold pt-1 border-t border-slate-200">
                  <span>Flete Prorrateado por Kilo:</span>
                  <span className="font-mono">${liquidacion.proratedFreightPerKg.toLocaleString()} COP / kg</span>
                </div>

                <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-200 text-base">
                  <span>Costo Real Total (Landed Cost):</span>
                  <span className="font-mono text-indigo-700">${liquidacion.landedCostTotal.toLocaleString()} COP</span>
                </div>

                <div className="flex justify-between text-rose-700 font-bold">
                  <span>- Anticipo Consignado Previo:</span>
                  <span className="font-mono">- ${liquidacion.advancePaymentDeducted.toLocaleString()} COP</span>
                </div>
              </div>

              {/* Saldo Final Gigante */}
              <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-1 mt-4">
                <span className="text-xs font-black text-emerald-800 tracking-wider uppercase block">
                  Saldo Neto a Pagar al Proveedor:
                </span>
                <div className="text-4xl font-black text-emerald-700 font-mono">
                  ${liquidacion.balanceToPaySupplier.toLocaleString()}{' '}
                  <span className="text-lg text-emerald-800 font-sans">COP</span>
                </div>
                <span className="text-xs font-bold text-slate-500 block">
                  {paymentStatus === 'CREDITO' ? 'Se registrará en Cuentas por Pagar' : 'Se liquidará contra Caja/Banco'}
                </span>
              </div>

              <button
                type="button"
                data-testid="btn-finalizar-recepcion"
                onClick={handleFinalizarRecepcion}
                disabled={isSaving}
                className="min-h-[56px] h-14 w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition mt-4 cursor-pointer"
              >
                <CheckCircle className="w-6 h-6" />
                <span>{isSaving ? 'Guardando Lotes en Cava...' : '✓ Guardar en el Frío y Finalizar'}</span>
              </button>
            </div>
          </div>

          {/* Navegación hacia atrás */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="min-h-[48px] h-12 px-6 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 font-bold rounded-xl text-sm transition flex items-center gap-2 cursor-pointer shadow-sm"
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
