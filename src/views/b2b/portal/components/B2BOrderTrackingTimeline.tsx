/**
 * ============================================================================
 * LA PEZCADERIA ERP — COMPONENTE: B2BOrderTrackingTimeline
 * ============================================================================
 * Línea de tiempo y trazabilidad en vivo de pedidos HORECA.
 * Muestra el ciclo WMS (alistamiento, pesaje en báscula, empaque con hielo,
 * temperatura en ruta y remisión oficial).
 */

import React from 'react';
import {
  PackageCheck,
  Scale,
  Truck,
  CheckCircle2,
  Clock,
  Thermometer,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import type { B2BOrderRecord, B2BOrderStatus } from '../../../../types/b2bCustomerPortal.types';

export interface B2BOrderTrackingTimelineProps {
  pedido: B2BOrderRecord | null;
  onClose?: () => void;
}

interface StepConfig {
  id: B2BOrderStatus;
  label: string;
  descripcion: string;
  icon: React.ReactNode;
}

const PASOS_WMS: StepConfig[] = [
  {
    id: 'CREADO',
    label: 'Pedido Confirmado',
    descripcion: 'Orden transmitida a la Bodega Principal',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: 'EN_ALISTAMIENTO',
    label: 'Alistamiento FEFO',
    descripcion: 'Selección de lotes frescos y cortes marítimos',
    icon: <PackageCheck className="w-4 h-4" />,
  },
  {
    id: 'EN_BASCULA_PACKING',
    label: 'Pesaje & Packing',
    descripcion: 'Báscula certificada y empaque térmico con hielo',
    icon: <Scale className="w-4 h-4" />,
  },
  {
    id: 'EN_RUTA_FRIO',
    label: 'En Ruta Refrigerada',
    descripcion: 'Despacho con monitoreo de cadena de frío',
    icon: <Truck className="w-4 h-4" />,
  },
  {
    id: 'ENTREGADO',
    label: 'Entregado en Restaurante',
    descripcion: 'Recepción y firma a conformidad',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

const ORDEN_PASOS: Record<B2BOrderStatus, number> = {
  CREADO: 0,
  PENDIENTE_APROBACION_CARTERA: 0,
  EN_ALISTAMIENTO: 1,
  EN_BASCULA_PACKING: 2,
  EN_RUTA_FRIO: 3,
  ENTREGADO: 4,
  CANCELADO: -1,
};

export const B2BOrderTrackingTimeline: React.FC<B2BOrderTrackingTimelineProps> = ({
  pedido,
  onClose,
}) => {
  if (!pedido) return null;

  const pasoActualIndex = ORDEN_PASOS[pedido.estado] ?? 0;
  const esCarteraPendiente = pedido.estado === 'PENDIENTE_APROBACION_CARTERA';

  return (
    <div
      data-testid="b2b-order-tracking-timeline"
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {pedido.numeroPedido}
            </span>
            <span className="text-xs text-slate-500">
              Entrega Requerida: {pedido.fechaRequeridaEntrega} ({pedido.jornadaRequerida})
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Trazabilidad WMS & Cadena de Frío
          </h3>
          <p className="text-xs text-slate-500">
            Destino: {pedido.sucursalEntrega} — {pedido.direccionEntrega}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            data-testid="btn-close-tracking"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Alerta de Cartera Pendiente si aplica */}
      {esCarteraPendiente && (
        <div
          data-testid="badge-cartera-pendiente"
          className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">En Revisión por Cupo de Crédito</span>
            <span>
              Este pedido superó el cupo disponible y fue transmitido a Tesorería para ampliación temporal sin detener la preparación previa.
            </span>
          </div>
        </div>
      )}

      {/* Línea de Tiempo de Pasos */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {PASOS_WMS.map((paso, idx) => {
          const esCompletado = pasoActualIndex > idx;
          const esActual = pasoActualIndex === idx && !esCarteraPendiente;
          const esFuturo = pasoActualIndex < idx || esCarteraPendiente;

          let puntoColor = 'bg-slate-300 text-slate-600';
          let textoColor = 'text-slate-400';

          if (esCompletado) {
            puntoColor = 'bg-emerald-600 text-white';
            textoColor = 'text-slate-700';
          } else if (esActual) {
            puntoColor = 'bg-blue-600 text-white ring-4 ring-blue-100';
            textoColor = 'text-slate-900 font-bold';
          }

          return (
            <div key={paso.id} className="relative flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 transition-colors ${puntoColor}`}
              >
                {esCompletado ? <CheckCircle2 className="w-3.5 h-3.5" /> : paso.icon}
              </div>
              <div className="flex-1">
                <span className={`text-sm block ${textoColor}`}>
                  {paso.label}
                  {esActual && (
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-sm">
                      En Curso
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500 block">{paso.descripcion}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cadena de Frío y Remisión Oficial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Cadena de Frío</span>
            <span
              data-testid="temperature-display"
              className="text-base font-black text-slate-900"
            >
              {pedido.temperaturaDespachoCelsius !== undefined
                ? `${pedido.temperaturaDespachoCelsius}°C`
                : '1.5°C — 3.0°C (En Escamas)'}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Remisión Oficial WMS</span>
            <span
              data-testid="remision-display"
              className="text-base font-black text-slate-900"
            >
              {pedido.numeroRemision || `REM-${pedido.numeroPedido.replace('PED-', '')}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
