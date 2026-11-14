import React from 'react';
import { X, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { useUnifiedPayment } from './useUnifiedPayment';
import { PaymentMethodTabs } from './PaymentMethodTabs';
import { CashPaymentSection } from './CashPaymentSection';
import { SplitPaymentSection } from './SplitPaymentSection';
import { CreditPaymentSection } from './CreditPaymentSection';
import { PaymentSummaryFooter } from './PaymentSummaryFooter';
import type { UnifiedPaymentModalProps } from './payment.types';

export const UnifiedPaymentModal: React.FC<UnifiedPaymentModalProps> = ({
  isOpen,
  totalPagar,
  cliente,
  onClose,
  onConfirmPayment,
  initialMethod = 'EFECTIVO',
}) => {
  // Invocar hooks SIEMPRE de manera incondicional (cumple estrictamente rules-of-hooks)
  const {
    metodoActivo,
    setMetodoActivo,
    efectivoRecibido,
    setEfectivoRecibido,
    billetesSugeridos,
    vueltoEfectivo,
    saldoFaltanteEfectivo,
    lineasMixtas,
    totalMixtoAsignado,
    saldoRestanteMixto,
    handleAgregarLineaMixta,
    handleActualizarLineaMixta,
    handleEliminarLineaMixta,
    cupoDisponibleCliente,
    esCreditoExcedido,
    plazoDiasCredito,
    setPlazoDiasCredito,
    fechaVencimientoCredito,
    referenciaComprobante,
    setReferenciaComprobante,
    autorizacionTarjeta,
    setAutorizacionTarjeta,
    requiereFacturaElectronica,
    setRequiereFacturaElectronica,
    puedeConfirmar,
    handleConfirmarPago,
    handleCobroEfectivoExactoDirecto,
  } = useUnifiedPayment({
    totalPagar,
    cliente,
    onConfirmPayment,
    onClose,
    initialMethod,
    isOpen,
  });

  // Retorno temprano condicional SOLO después de haber llamado a todos los hooks
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      data-testid="unified-payment-modal"
      data-modal-id="modal-recaudo-unificado"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-150"
    >
      {/* Backdrop para atajos y pruebas de layout táctil */}
      <div
        data-testid="payment-drawer-backdrop"
        className="absolute inset-0 -z-10 cursor-pointer"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        data-testid="payment-drawer-container"
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl w-full bg-[#0a0f1d]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden max-h-[94vh] relative z-10"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold font-mono">
              $
            </div>
            <div>
              <h2 id="payment-modal-title" className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Terminal de Cobro POS</span>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">(Cobro en Ventanilla)</span>
                <span className="text-xs font-mono font-normal text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Total: ${totalPagar.toLocaleString('es-CO')}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {cliente ? (
                  <span>
                    Cliente: <strong className="text-slate-200">{cliente.nombre}</strong> ({cliente.identificacion})
                  </span>
                ) : (
                  <span>Cliente Ocasional de Mostrador</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar modal"
            data-testid="btn-close-payment-drawer"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal con Pestañas y Vistas Dinámicas */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
          {/* Selector de Pestañas de Método */}
          <PaymentMethodTabs
            metodoActivo={metodoActivo}
            onSelectMetodo={setMetodoActivo}
          />

          {/* Vista Dinámica de Cobro según Método */}
          {metodoActivo === 'EFECTIVO' && (
            <CashPaymentSection
              totalPagar={totalPagar}
              efectivoRecibido={efectivoRecibido}
              onChangeEfectivo={setEfectivoRecibido}
              billetesSugeridos={billetesSugeridos}
              vueltoEfectivo={vueltoEfectivo}
              saldoFaltanteEfectivo={saldoFaltanteEfectivo}
              onCobroEfectivoExactoDirecto={handleCobroEfectivoExactoDirecto}
            />
          )}

          {metodoActivo === 'DATAFONO' && (
            <div data-testid="section-datafono" className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400 font-semibold">Datáfono / Tarjeta Débito o Crédito</div>
                  <div className="text-lg font-bold font-mono text-cyan-200">
                    Monto a Cobrar: ${totalPagar.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-slate-400 font-semibold">
                    Código de Autorización / Aprobación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: AUTH-892301"
                    value={autorizacionTarjeta}
                    onChange={(e) => setAutorizacionTarjeta(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-slate-400 font-semibold">
                    Últimos 4 dígitos de tarjeta (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="•••• 1234"
                    value={referenciaComprobante}
                    onChange={(e) => setReferenciaComprobante(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {metodoActivo === 'TRANSFERENCIA' && (
            <div data-testid="section-transferencia" className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400 font-semibold">Transferencia QR / Nequi / Daviplata / Bancolombia</div>
                  <div className="text-lg font-bold font-mono text-cyan-200">
                    Monto a Verificar: ${totalPagar.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase text-slate-400 font-semibold">
                  Número de Aprobación / Comprobante
                </label>
                <input
                  type="text"
                  placeholder="Ej: M123984 o Ref de transferencia"
                  value={referenciaComprobante}
                  onChange={(e) => setReferenciaComprobante(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {metodoActivo === 'CREDITO' && (
            <CreditPaymentSection
              totalPagar={totalPagar}
              cliente={cliente}
              plazoDias={plazoDiasCredito}
              onChangePlazo={setPlazoDiasCredito}
              fechaVencimiento={fechaVencimientoCredito}
              cupoDisponible={cupoDisponibleCliente}
              esCreditoExcedido={esCreditoExcedido}
            />
          )}

          {metodoActivo === 'MIXTO' && (
            <SplitPaymentSection
              totalPagar={totalPagar}
              lineas={lineasMixtas}
              saldoRestante={saldoRestanteMixto}
              totalAsignado={totalMixtoAsignado}
              onAddLinea={handleAgregarLineaMixta}
              onUpdateLinea={handleActualizarLineaMixta}
              onRemoveLinea={handleEliminarLineaMixta}
            />
          )}
        </div>

        {/* Pie de Página con Resumen y Botones de Acción */}
        <div className="p-4 border-t border-white/10 bg-slate-900/60">
          <PaymentSummaryFooter
            totalPagar={totalPagar}
            totalRecibido={efectivoRecibido}
            vueltoTotal={vueltoEfectivo}
            puedeConfirmar={puedeConfirmar}
            onConfirmar={handleConfirmarPago}
            onCancelar={onClose}
            requiereFacturaElectronica={requiereFacturaElectronica}
            onToggleFacturaElectronica={() =>
              setRequiereFacturaElectronica((prev) => !prev)
            }
            metodoActivo={metodoActivo}
          />
        </div>
      </div>
    </div>
  );
};

