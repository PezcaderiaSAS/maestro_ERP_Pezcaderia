import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Fish,
  Snowflake,
  Receipt,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Building,
  CreditCard,
  Send,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { cashService } from '../../../services/cashService';
import { obtenerRecepcionesBucaramanga } from '../../../services/purchasesBucaramangaService';
import {
  TurnoCaja,
  CategoriaEgresoOperativo,
  MetodoPago,
} from '../../../types/cash.types';

interface EgresoOperativoModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EgresoOperativoModal: React.FC<EgresoOperativoModalProps> = ({
  turnoActivo,
  usuarioId,
  onClose,
  onSuccess,
}) => {
  const [categoria, setCategoria] = useState<CategoriaEgresoOperativo>('FLETE_TRANSPORTE');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [monto, setMonto] = useState<number | ''>('');
  const [concepto, setConcepto] = useState<string>('');
  const [placaCamion, setPlacaCamion] = useState<string>('');
  const [proveedorNombre, setProveedorNombre] = useState<string>('');
  const [referenciaId, setReferenciaId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Obtener recepciones recientes en Bucaramanga para autocompletar
  const recepciones = useMemo(() => {
    return obtenerRecepcionesBucaramanga();
  }, []);

  const saldoEfectivoDisponible = turnoActivo.totalEfectivo || 0;
  const numMonto = Number(monto) || 0;
  const esEfectivoInsuficiente = metodoPago === 'EFECTIVO' && numMonto > saldoEfectivoDisponible;

  // Manejar selección rápida desde una recepción existente
  const handleSeleccionarRecepcion = (rec: any) => {
    setReferenciaId(rec.receptionNumber);
    setPlacaCamion(rec.truckPlate || '');
    setProveedorNombre(rec.supplierName || '');

    if (categoria === 'FLETE_TRANSPORTE') {
      setMonto(rec.liquidacion?.totalFreightCost || '');
      setConcepto(`Pago Flete Furgón ${rec.truckPlate} - ${rec.transportCompany || 'Transportador'}`);
    } else if (categoria === 'PAGO_PROVEEDOR_PESCADO') {
      setMonto(rec.liquidacion?.balanceToPaySupplier || '');
      setConcepto(`Pago Contado Pescado ${rec.supplierName} (Guía ${rec.receptionNumber})`);
    }
  };

  const handleSeleccionarPresetCategoria = (cat: CategoriaEgresoOperativo) => {
    setCategoria(cat);
    setReferenciaId('');
    if (cat === 'FLETE_TRANSPORTE') {
      setConcepto('Flete furgón refrigerado');
      setMetodoPago('EFECTIVO');
    } else if (cat === 'PAGO_PROVEEDOR_PESCADO') {
      setConcepto('Liquidación compra de pescado en muelle/puerto');
      setMetodoPago('TRANSFERENCIA');
    } else if (cat === 'INSUMOS_HIELO_CAVA') {
      setConcepto('Compra de hielo en escamas para cavas');
      setMetodoPago('EFECTIVO');
    } else {
      setConcepto('Gasto operativo bodega Bucaramanga');
      setMetodoPago('EFECTIVO');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numMonto || numMonto <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'Por favor ingrese un valor mayor a cero.',
      });
      return;
    }

    if (!concepto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Concepto requerido',
        text: 'Por favor describa el motivo de la salida de dinero.',
      });
      return;
    }

    if (esEfectivoInsuficiente) {
      Swal.fire({
        icon: 'error',
        title: 'Efectivo Insuficiente en Caja',
        html: `
          <div class="text-left text-sm space-y-2">
            <p>La caja solo dispone de <strong>$${saldoEfectivoDisponible.toLocaleString()} COP</strong> en billetes y monedas.</p>
            <p>El valor que desea pagar es de <strong>$${numMonto.toLocaleString()} COP</strong>.</p>
            <hr class="my-2 border-slate-700"/>
            <p class="text-amber-400"><strong>Alternativas operativas:</strong></p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Pagar mediante <strong>Transferencia Bancaria</strong> (Bancolombia/Nequi).</li>
              <li>Solicitar un <strong>Traslado de fondos</strong> desde Caja Mayor.</li>
              <li>Marcar la compra a <strong>Crédito con el Proveedor</strong> (Cuentas por Pagar).</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Cambiar a Transferencia',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
      }).then((res) => {
        if (res.isConfirmed) {
          setMetodoPago('TRANSFERENCIA');
        }
      });
      return;
    }

    setIsSubmitting(true);

    const res = cashService.registrarEgresoOperativo({
      turnoId: turnoActivo.id,
      cajaId: turnoActivo.cajaId,
      categoriaEgreso: categoria,
      metodoPago,
      monto: numMonto,
      concepto: concepto.trim(),
      referenciaId: referenciaId.trim() || null,
      usuarioId,
      metadata: {
        placaCamion: placaCamion.trim() || undefined,
        proveedorNombre: proveedorNombre.trim() || undefined,
        consecutivoRecepcion: referenciaId.trim() || undefined,
      },
    });

    setIsSubmitting(false);

    if (res.error) {
      Swal.fire({ icon: 'error', title: 'Error al registrar egreso', text: res.error });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Egreso Registrado!',
      text: `Se debitaron $${numMonto.toLocaleString()} COP de ${metodoPago.toLowerCase()}.`,
      timer: 2000,
      showConfirmButton: false,
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera Táctil */}
        <div className="bg-gradient-to-r from-rose-950/60 to-slate-900 border-b border-rose-900/30 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Registrar Salida de Dinero (Egreso)
              </h2>
              <p className="text-xs text-rose-300 font-medium">
                Pago de fletes, compras de pescado o insumos operativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selector de Categoría Rápida - Botones Gigantes (≥ 52 px) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Motivo del Pago:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSeleccionarPresetCategoria('FLETE_TRANSPORTE')}
                className={`min-h-[56px] p-3 rounded-2xl border text-left flex flex-col justify-center transition active:scale-95 ${
                  categoria === 'FLETE_TRANSPORTE'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Flete Camión</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Transporte furgón</span>
              </button>

              <button
                type="button"
                onClick={() => handleSeleccionarPresetCategoria('PAGO_PROVEEDOR_PESCADO')}
                className={`min-h-[56px] p-3 rounded-2xl border text-left flex flex-col justify-center transition active:scale-95 ${
                  categoria === 'PAGO_PROVEEDOR_PESCADO'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Fish className="w-4 h-4 text-emerald-400" />
                  <span>Pago Pescado</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Compra contado</span>
              </button>

              <button
                type="button"
                onClick={() => handleSeleccionarPresetCategoria('INSUMOS_HIELO_CAVA')}
                className={`min-h-[56px] p-3 rounded-2xl border text-left flex flex-col justify-center transition active:scale-95 ${
                  categoria === 'INSUMOS_HIELO_CAVA'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Snowflake className="w-4 h-4 text-cyan-400" />
                  <span>Hielo / Cava</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Frío y empaques</span>
              </button>

              <button
                type="button"
                onClick={() => handleSeleccionarPresetCategoria('GASTO_OPERATIVO_GENERAL')}
                className={`min-h-[56px] p-3 rounded-2xl border text-left flex flex-col justify-center transition active:scale-95 ${
                  categoria === 'GASTO_OPERATIVO_GENERAL'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Receipt className="w-4 h-4 text-rose-400" />
                  <span>Gasto Menor</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Varios bodega</span>
              </button>
            </div>
          </div>

          {/* Autocompletar desde Recepciones de Camión (si hay fletes o compras pendientes) */}
          {recepciones.length > 0 && (categoria === 'FLETE_TRANSPORTE' || categoria === 'PAGO_PROVEEDOR_PESCADO') && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                Cargar automáticamente desde una llegada de camión reciente:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recepciones.slice(0, 3).map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleSeleccionarRecepcion(rec)}
                    className="flex-shrink-0 text-left p-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-white">{rec.truckPlate}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">
                        {rec.receptionNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{rec.supplierName}</p>
                    <div className="text-[11px] font-bold text-cyan-400">
                      {categoria === 'FLETE_TRANSPORTE'
                        ? `Flete: $${rec.liquidacion?.totalFreightCost?.toLocaleString()} COP`
                        : `Saldo: $${rec.liquidacion?.balanceToPaySupplier?.toLocaleString()} COP`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Método de Pago y Saldo Disponible */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. ¿De dónde sale la plata?
              </label>
              <span className="text-xs text-slate-400">
                Efectivo en caja:{' '}
                <strong className={saldoEfectivoDisponible > 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                  ${saldoEfectivoDisponible.toLocaleString()} COP
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`min-h-[50px] rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition active:scale-95 ${
                  metodoPago === 'EFECTIVO'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`min-h-[50px] rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition active:scale-95 ${
                  metodoPago === 'TRANSFERENCIA'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Send className="w-4 h-4 text-purple-400" />
                <span>Transferencia</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('DATAFONO')}
                className={`min-h-[50px] rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition active:scale-95 ${
                  metodoPago === 'DATAFONO'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Datáfono / Tarjeta</span>
              </button>
            </div>

            {/* Alerta de Fondos Insuficientes */}
            {esEfectivoInsuficiente && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold">Efectivo insuficiente para este pago.</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Faltan ${(numMonto - saldoEfectivoDisponible).toLocaleString()} COP. Puedes cambiar el método a Transferencia Bancaria o registrarlo a crédito con el proveedor.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                    className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] transition"
                  >
                    Usar Transferencia Bancaria
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Importe Numérico y Concepto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Valor del Pago ($ COP):
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 font-mono font-bold">$</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full min-h-[50px] pl-8 pr-4 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl text-white font-mono font-black text-lg outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Número de Guía o Factura (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej. REM-8821 o F-4091"
                value={referenciaId}
                onChange={(e) => setReferenciaId(e.target.value)}
                className="w-full min-h-[50px] px-4 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl text-white text-sm outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Detalle o Motivo del Pago:
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Pago Flete Furgón WDF-452 (Cartagena a Bucaramanga)"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full min-h-[50px] px-4 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl text-white text-sm outline-none transition"
            />
          </div>

          {/* Botones de Acción Táctiles (≥ 52 px) */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[52px] px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-sm transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              data-testid="btn-confirmar-egreso"
              disabled={isSubmitting || esEfectivoInsuficiente || !numMonto}
              className="min-h-[52px] px-8 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl text-base flex items-center gap-2.5 shadow-xl shadow-rose-600/25 transition"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Registrando...' : 'Confirmar Salida de Dinero'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EgresoOperativoModal;
