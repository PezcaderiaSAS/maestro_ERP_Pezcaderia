import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building2,
  Banknote,
  DollarSign,
  Receipt,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { InvoiceAR, PaymentAR } from '../../../store/useARStore';
import { useARStore } from '../../../store/useARStore';
import { useEventStore } from '../../../store/useEventStore';
import { useAppStore } from '../../../store/useAppStore';
import { cashService } from '../../../services/cashService';

export interface QuickAbonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceAR | null;
  onAbonoSuccess?: (invoiceId: string, totalAbonado: number) => void;
  clienteNombre?: string;
  clienteIdentificacion?: string;
}

export type MetodoAbono = 'Efectivo' | 'Transferencia' | 'Datáfono';

export const QuickAbonoModal: React.FC<QuickAbonoModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onAbonoSuccess,
  clienteNombre,
  clienteIdentificacion,
}) => {
  const { setCartera } = useARStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const userRole = useAppStore((s) => s.userRole);

  const [montoAbonar, setMontoAbonar] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<MetodoAbono>('Efectivo');
  const [comprobante, setComprobante] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al abrirse con una factura, sugerir el saldo completo por defecto
  useEffect(() => {
    if (isOpen && invoice) {
      setMontoAbonar(invoice.saldo);
      setMetodoPago('Efectivo');
      setComprobante('');
      setIsSubmitting(false);
    }
  }, [isOpen, invoice]);

  const saldoPendiente = invoice?.saldo ?? 0;
  const nombreMostrado = clienteNombre || invoice?.clienteNombre || 'Cliente sin nombre';
  const nitMostrado = clienteIdentificacion || invoice?.clienteIdentificacion || '—';

  // Validaciones reactivas
  const isExcedido = montoAbonar > saldoPendiente;
  const isCero = montoAbonar <= 0;
  const isValido = !isCero && !isExcedido;

  // Manejadores de incremento rápido
  const handlePagarTotal = () => {
    setMontoAbonar(saldoPendiente);
  };

  const handlePagarMitad = () => {
    setMontoAbonar(Math.round(saldoPendiente / 2));
  };

  const handleSumarIncremento = (incremento: number) => {
    setMontoAbonar((prev) => {
      const nuevo = prev + incremento;
      return Math.min(nuevo, saldoPendiente);
    });
  };

  const handleLimpiar = () => {
    setMontoAbonar(0);
  };

  // Confirmar y procesar el abono atómico
  const handleConfirmarAbono = async () => {
    if (!invoice || !isValido || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const nuevoPago: PaymentAR = {
        id: `pgo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fecha: new Date().toISOString(),
        monto: montoAbonar,
        metodo: metodoPago,
      };

      const nuevoSaldo = Math.max(0, invoice.saldo - montoAbonar);
      const nuevoPagado = invoice.pagado + montoAbonar;

      // 1. Actualizar estado reactivo de Cartera
      setCartera((prev: InvoiceAR[]) =>
        prev.map((inv) => {
          if (inv.id === invoice.id) {
            return {
              ...inv,
              saldo: nuevoSaldo,
              pagado: nuevoPagado,
              pagos: [...inv.pagos, nuevoPago],
            };
          }
          return inv;
        })
      );

      // 2. Disparar Evento de Dominio
      publishEvent(
        'SALE_COMPLETED',
        userRole,
        `Abono de $${montoAbonar.toLocaleString('es-CO')} registrado a la factura ${invoice.id} [${metodoPago}${comprobante ? ` - Ref: ${comprobante}` : ''}] para el cliente ${nombreMostrado}`,
        {
          invoiceId: invoice.id,
          totalAbonado: montoAbonar,
          nuevoPago,
          saldoRestante: nuevoSaldo,
        }
      );

      // 3. Sincronización atómica con Flujo de Caja (cashService)
      try {
        cashService.seedCajasParaBodegas();
        const todosTurnos = cashService.getTurnos();
        const turnoActivo = todosTurnos.find((t) => t.estado === 'ABIERTO');

        if (turnoActivo) {
          const cashMethodMap: Record<MetodoAbono, 'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO'> = {
            Efectivo: 'EFECTIVO',
            Transferencia: 'TRANSFERENCIA',
            Datáfono: 'DATAFONO',
          };

          cashService.registrarMovimiento(
            turnoActivo.id,
            turnoActivo.cajaId,
            'INGRESO_ABONO',
            cashMethodMap[metodoPago],
            montoAbonar,
            `Abono Cartera Factura ${invoice.id} (${nombreMostrado})${comprobante ? ` - Ref: ${comprobante}` : ''}`,
            invoice.id,
            userRole
          );
        }
      } catch (cashErr) {
        console.error('Error al sincronizar abono con flujo de caja:', cashErr);
      }

      // 4. Notificar a observadores
      onAbonoSuccess?.(invoice.id, montoAbonar);
      onClose();

      Swal.fire({
        icon: 'success',
        title: '¡Abono Aplicado!',
        text: `Se registraron $${montoAbonar.toLocaleString('es-CO')} en ${metodoPago} a la factura ${invoice.id}. Saldo restante: $${nuevoSaldo.toLocaleString('es-CO')}.`,
        confirmButtonColor: '#10b981',
        timer: 3000,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar abono',
        text: err?.message || 'Ocurrió un error inesperado al registrar el pago.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-abono-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900"
    >
      <div
        className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                Gestión de Cartera B2B
              </span>
              <h2
                id="quick-abono-title"
                className="text-xl md:text-2xl font-black text-slate-900 tracking-tight m-0 mt-1"
              >
                Abono Rápido a Cartera
              </h2>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-abono-modal"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            aria-label="Cerrar modal de abono"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tarjeta de Resumen de la Factura */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Factura / Remisión</span>
                <p className="text-lg font-black text-slate-900 font-mono m-0">{invoice.id}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</span>
                <p className="text-sm font-bold text-slate-800 truncate m-0">{nombreMostrado}</p>
                <span className="text-xs text-slate-500 font-mono">NIT: {nitMostrado}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Total Venta</span>
                <span className="text-sm md:text-base font-black text-slate-800">
                  ${invoice.total.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-700 font-bold block">Ya Pagado</span>
                <span className="text-sm md:text-base font-black text-emerald-800">
                  ${invoice.pagado.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-700 font-bold block">Saldo Pendiente</span>
                <span className="text-sm md:text-base font-black text-rose-800">
                  ${saldoPendiente.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Atajos de Monto Rápido (1-Toque >= 48px) */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              1. Selecciona o Ajusta el Monto
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                data-testid="btn-abono-total"
                onClick={handlePagarTotal}
                className={`min-h-[48px] h-12 px-3 rounded-xl font-black text-xs sm:text-sm border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
                  montoAbonar === saldoPendiente && saldoPendiente > 0
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Pagar Total (100%)
              </button>

              <button
                type="button"
                data-testid="btn-abono-50"
                onClick={handlePagarMitad}
                className="min-h-[48px] h-12 px-3 rounded-xl font-black text-xs sm:text-sm border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
              >
                50% del Saldo
              </button>

              <button
                type="button"
                data-testid="btn-abono-mas-100k"
                onClick={() => handleSumarIncremento(100000)}
                className="min-h-[48px] h-12 px-3 rounded-xl font-bold text-xs sm:text-sm border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
              >
                +$100.000
              </button>

              <button
                type="button"
                data-testid="btn-abono-limpiar"
                onClick={handleLimpiar}
                className="min-h-[48px] h-12 px-3 rounded-xl font-bold text-xs sm:text-sm border-2 border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
              >
                Limpiar ($0)
              </button>
            </div>

            {/* Input Gigante de Monto con Formato Moneda */}
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg pointer-events-none">
                $
              </span>
              <input
                type="number"
                data-testid="input-monto-abono"
                value={montoAbonar === 0 ? '' : montoAbonar}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMontoAbonar(isNaN(val) ? 0 : val);
                }}
                placeholder="0"
                min="0"
                max={saldoPendiente}
                className="w-full min-h-[52px] h-14 pl-8 pr-4 text-xl md:text-2xl font-black font-mono text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
              />
            </div>

            {/* Semáforo de Validación de Monto */}
            {isExcedido && (
              <div
                data-testid="alerta-sobre-saldo"
                className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  El abono (${montoAbonar.toLocaleString('es-CO')}) no puede exceder el saldo pendiente ($
                  {saldoPendiente.toLocaleString('es-CO')}).
                </span>
              </div>
            )}

            {isValido && (
              <div
                data-testid="alerta-monto-valido"
                className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Monto Válido para Aplicar
                </span>
                <span className="font-mono font-black">
                  Nuevo saldo quedará en: ${(saldoPendiente - montoAbonar).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>

          {/* 2. Selector Táctil de Método de Pago (Targets >= 48px) */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              2. Método de Recaudo
            </label>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                data-testid="metodo-abono-efectivo"
                onClick={() => setMetodoPago('Efectivo')}
                className={`min-h-[52px] h-14 p-3 rounded-2xl border-2 font-black text-xs md:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  metodoPago === 'Efectivo'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 shrink-0" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                data-testid="metodo-abono-transferencia"
                onClick={() => setMetodoPago('Transferencia')}
                className={`min-h-[52px] h-14 p-3 rounded-2xl border-2 font-black text-xs md:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  metodoPago === 'Transferencia'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-5 h-5 shrink-0" />
                <span>Transferencia</span>
              </button>

              <button
                type="button"
                data-testid="metodo-abono-datafono"
                onClick={() => setMetodoPago('Datáfono')}
                className={`min-h-[52px] h-14 p-3 rounded-2xl border-2 font-black text-xs md:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  metodoPago === 'Datáfono'
                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 shrink-0" />
                <span>Datáfono</span>
              </button>
            </div>

            {/* Campo Referencia / Comprobante (opcional o requerido para banco) */}
            {metodoPago !== 'Efectivo' && (
              <div className="pt-1 animate-fade-in">
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Nro. de Aprobación / Comprobante Bancario (Opcional):
                </label>
                <input
                  type="text"
                  data-testid="input-comprobante-abono"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej. TRANS-98124 / Aprob: 4521"
                  className="w-full min-h-[48px] h-12 px-4 text-sm font-medium text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer con Botón Gigante de Confirmación >= 56px */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs text-slate-500 font-bold block">Total a Aplicar:</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              ${montoAbonar.toLocaleString('es-CO')} COP
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none min-h-[56px] h-14 px-6 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              data-testid="btn-confirmar-abono"
              onClick={handleConfirmarAbono}
              disabled={!isValido || isSubmitting}
              className={`flex-1 sm:flex-none min-h-[56px] h-14 px-8 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                isValido && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{isSubmitting ? 'Procesando...' : 'CONFIRMAR ABONO'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
