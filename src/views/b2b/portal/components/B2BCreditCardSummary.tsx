/**
 * ============================================================================
 * LA PEZCADERIA ERP — COMPONENTE: B2BCreditCardSummary
 * ============================================================================
 * Widget de crédito y cartera comercial para clientes HORECA.
 * Muestra cupo asignado, saldo pendiente, cupo disponible y semáforo de riesgo.
 */

import React from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import type { B2BCreditStatus, B2BCustomerProfile } from '../../../../types/b2bCustomerPortal.types';

export interface B2BCreditCardSummaryProps {
  cartera: B2BCreditStatus;
  cliente: B2BCustomerProfile | null;
}

export const B2BCreditCardSummary: React.FC<B2BCreditCardSummaryProps> = ({
  cartera,
  cliente,
}) => {
  const porcentajeUtilizado =
    cartera.cupoTotalCop > 0
      ? Math.min(100, Math.round((cartera.saldoPendienteCop / cartera.cupoTotalCop) * 100))
      : 0;

  const semaforoConfig = {
    AL_DIA: {
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
      texto: 'Crédito al Día',
      barraColor: 'bg-emerald-600',
    },
    EN_ALERTA: {
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-700" />,
      texto: 'Cupo Próximo a Excederse',
      barraColor: 'bg-amber-500',
    },
    BLOQUEADO_MORA: {
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      icon: <XCircle className="w-4 h-4 text-rose-700" />,
      texto: 'Cupo Excedido — Sujeto a Aprobación',
      barraColor: 'bg-rose-600',
    },
  }[cartera.estadoSemaforo] || {
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    icon: <CheckCircle2 className="w-4 h-4 text-slate-700" />,
    texto: 'Crédito Normal',
    barraColor: 'bg-blue-600',
  };

  return (
    <div
      data-testid="b2b-credit-card-summary"
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">Estado de Cupo & Cartera</h2>
          {cliente && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Plazo: {cliente.plazoDiasPago} días
            </span>
          )}
        </div>

        <div
          data-testid="credit-status-badge"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${semaforoConfig.badgeClass}`}
        >
          {semaforoConfig.icon}
          <span>{semaforoConfig.texto}</span>
        </div>
      </div>

      {/* Métricas de Cupo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block">Cupo Total Asignado</span>
          <span
            data-testid="credit-cupo-total"
            className="text-lg font-black text-slate-800"
          >
            ${cartera.cupoTotalCop.toLocaleString('es-CO')}
          </span>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block">Saldo en Cartera (Pendiente)</span>
          <span
            data-testid="credit-saldo-pendiente"
            className="text-lg font-black text-slate-700"
          >
            ${cartera.saldoPendienteCop.toLocaleString('es-CO')}
          </span>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <span className="text-xs font-semibold text-blue-700 block">Cupo Disponible Inmediato</span>
          <span
            data-testid="credit-cupo-disponible"
            className="text-lg font-black text-blue-900"
          >
            ${cartera.cupoDisponibleCop.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Barra de progreso de utilización */}
      <div className="mt-2">
        <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
          <span>Utilización del Cupo de Crédito</span>
          <span className="font-bold text-slate-900">{porcentajeUtilizado}% utilizado</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${semaforoConfig.barraColor}`}
            style={{ width: `${porcentajeUtilizado}%` }}
          />
        </div>
      </div>

      {cartera.estadoSemaforo !== 'AL_DIA' && (
        <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Pedidos que excedan el cupo disponible se enviarán automáticamente a revisión de tesorería sin rechazo directo.
          </span>
        </div>
      )}
    </div>
  );
};
