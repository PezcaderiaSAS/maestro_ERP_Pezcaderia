import React, { useMemo } from 'react';
import {
  Trash2,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Send,
  Loader2,
  Fish,
  UtensilsCrossed,
  Waves,
  Snowflake,
  Package,
} from 'lucide-react';
import { Cliente } from '../../../types/erp.types';
import { LineaVentaExternaInput } from '../../../contracts/b2b.contracts';
import { B2BSalesService } from '../../../services/b2bSalesService';

export interface B2BCartSummaryStepProps {
  selectedCliente: Cliente;
  cartItems: LineaVentaExternaInput[];
  formaPago: 'CONTADO' | 'CREDITO';
  fechaEntrega: string;
  onChangeFechaEntrega: (fecha: string) => void;
  jornada: 'MANANA' | 'TARDE';
  onChangeJornada: (jornada: 'MANANA' | 'TARDE') => void;
  observaciones: string;
  onChangeObservaciones: (obs: string) => void;
  onRemoveItem: (sku: string) => void;
  onBack: () => void;
  onConfirmOrder: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export const B2BCartSummaryStep: React.FC<B2BCartSummaryStepProps> = ({
  selectedCliente,
  cartItems,
  formaPago,
  fechaEntrega,
  onChangeFechaEntrega,
  jornada,
  onChangeJornada,
  observaciones,
  onChangeObservaciones,
  onRemoveItem,
  onBack,
  onConfirmOrder,
  isSubmitting = false,
}) => {
  // Iconografía semántica vectorial a costo 0
  const getProductIcon = (nombre?: string) => {
    const text = (nombre || '').toLowerCase();
    if (text.match(/filete|posta|medall[oó]n|despiece|lomo/)) {
      return <UtensilsCrossed className="w-5 h-5 text-emerald-600" />;
    }
    if (text.match(/camar[oó]n|langost|pulpo|calamar|marisco/)) {
      return <Waves className="w-5 h-5 text-orange-600" />;
    }
    if (text.match(/congelad|empanada|apanad|dedito|iqf|hielo/)) {
      return <Snowflake className="w-5 h-5 text-cyan-600" />;
    }
    if (text.match(/insumo|bolsa|caja|canastilla/)) {
      return <Package className="w-5 h-5 text-slate-600" />;
    }
    return <Fish className="w-5 h-5 text-sky-600" />;
  };

  // Cálculos comerciales NIIF
  const financialTotals = useMemo(() => {
    const subtotalBruto = cartItems.reduce((acc, item) => {
      const cantidad = item.pesoEstimado || item.cantidadSolicitada;
      return acc + cantidad * item.precioPactado;
    }, 0);

    const baseSinIva = subtotalBruto;
    const totalIva = 0; // Exento por defecto en perecederos frescos

    const niif = B2BSalesService.calcularTotalesCotizacionNIIF(baseSinIva, totalIva, selectedCliente);

    // Verificación de cupo de crédito
    const cupoTotal = selectedCliente.cupoCredito || 0;
    const cupoUsado = selectedCliente.cupoCreditoUsado || 0;
    const cupoDisponible = Math.max(0, cupoTotal - cupoUsado);
    const esCreditoAprobado = formaPago === 'CONTADO' || cupoDisponible >= niif.total_factura;

    return {
      subtotalBruto,
      niif,
      cupoDisponible,
      esCreditoAprobado,
    };
  }, [cartItems, selectedCliente, formaPago]);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      data-testid="b2b-cart-summary-step"
      className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200"
    >
      {/* Encabezado del Paso 3 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-cyan-700 uppercase bg-cyan-50 px-2.5 py-1 rounded-full">
            Paso 3 de 3: Confirmación & Despacho
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Resumen del Pedido B2B
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Cliente: <strong>{selectedCliente.nombre}</strong> ({selectedCliente.identificacion}) •{' '}
            Condición: <strong className="uppercase">{formaPago}</strong>
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg">
          3
        </div>
      </div>

      {/* Lista de Ítems en el Carrito */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Líneas de Producto ({cartItems.length}):
        </h3>

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {cartItems.map((item) => {
            const peso = item.pesoEstimado || item.cantidadSolicitada;
            const subtotal = peso * item.precioPactado;

            return (
              <div
                key={item.sku}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {getProductIcon(item.nombre)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm md:text-base leading-tight truncate">
                      {item.nombre}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>SKU: {item.sku}</span>
                      <span>•</span>
                      <span className="font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded">
                        {item.cantidadSolicitada} piezas
                        {item.calibreMinGramos && ` (${item.calibreMinGramos}-${item.calibreMaxGramos}g)`}
                      </span>
                      <span>•</span>
                      <span>~ {peso} kg nominales</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block leading-tight">
                      {formatCOP(subtotal)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatCOP(item.precioPactado)} / kg
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.sku || item.productoId)}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center active:scale-95 transition-all"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Programación de Entrega y Jornada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-700" />
            <span>Fecha de Entrega en Destino:</span>
          </label>
          <input
            type="date"
            value={fechaEntrega}
            onChange={(e) => onChangeFechaEntrega(e.target.value)}
            className="w-full h-12 md:h-13 px-4 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-700" />
            <span>Jornada de Entrega:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeJornada('MANANA')}
              className={`min-h-[48px] px-3 py-2 rounded-xl border font-bold text-xs md:text-sm transition-all ${
                jornada === 'MANANA'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Mañana (6 AM - 12 PM)
            </button>
            <button
              type="button"
              onClick={() => onChangeJornada('TARDE')}
              className={`min-h-[48px] px-3 py-2 rounded-xl border font-bold text-xs md:text-sm transition-all ${
                jornada === 'TARDE'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Tarde (1 PM - 6 PM)
            </button>
          </div>
        </div>

        <div className="col-span-full flex flex-col gap-1.5 mt-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-700" />
            <span>Observaciones e Instrucciones de Entrega:</span>
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => onChangeObservaciones(e.target.value)}
            placeholder="Instrucciones para cuarto frío, persona de recibo o especificaciones del furgón..."
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 outline-none"
          />
        </div>
      </div>

      {/* Totales Financieros y Semáforo de Crédito */}
      <div className="p-4 md:p-5 rounded-2xl bg-slate-900 text-white flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-300 border-b border-slate-800 pb-2.5">
          <span>Subtotal Base (Nominal):</span>
          <span className="font-bold text-white">{formatCOP(financialTotals.niif.subtotal_base)}</span>
        </div>

        {financialTotals.niif.retefuente > 0 && (
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Retención en la Fuente (2.5%):</span>
            <span className="font-bold">- {formatCOP(financialTotals.niif.retefuente)}</span>
          </div>
        )}

        {financialTotals.niif.reteica > 0 && (
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>ReteICA:</span>
            <span className="font-bold">- {formatCOP(financialTotals.niif.reteica)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
              Total Final Factura (Estimado):
            </span>
            <span className="text-2xl md:text-3xl font-black text-cyan-400">
              {formatCOP(financialTotals.niif.total_factura)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Condición:</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase inline-block ${
                formaPago === 'CONTADO'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : financialTotals.esCreditoAprobado
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {formaPago} {formaPago === 'CREDITO' && (!financialTotals.esCreditoAprobado ? '(EXCEDIDO)' : '(OK)')}
            </span>
          </div>
        </div>

        {/* Alerta de Crédito si el pedido excede el cupo disponible */}
        {formaPago === 'CREDITO' && !financialTotals.esCreditoAprobado && (
          <div className="p-3 bg-rose-950/80 rounded-xl border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              <strong>Alerta de Cupo:</strong> El monto (${formatCOP(financialTotals.niif.total_factura)})
              supera el saldo disponible (${formatCOP(financialTotals.cupoDisponible)}). Se enviará a Cartera como{' '}
              <strong>PAUSADO_POR_CREDITO</strong>.
            </span>
          </div>
        )}
      </div>

      {/* Botones de Acción Táctil (h-14 / >= 56px) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLVER AL CATÁLOGO</span>
        </button>

        <button
          type="button"
          data-testid="b2b-btn-submit-order"
          disabled={isSubmitting || cartItems.length === 0}
          onClick={onConfirmOrder}
          className={`w-full sm:flex-1 h-14 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-lg ${
            isSubmitting
              ? 'bg-slate-300 text-slate-500 cursor-wait'
              : !financialTotals.esCreditoAprobado && formaPago === 'CREDITO'
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>TRANSMITIENDO A BODEGA...</span>
            </>
          ) : !financialTotals.esCreditoAprobado && formaPago === 'CREDITO' ? (
            <>
              <AlertTriangle className="w-6 h-6" />
              <span>ENVIAR PARA APROBACIÓN DE CRÉDITO</span>
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              <span>ENVIAR PEDIDO A BODEGA PRINCIPAL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
