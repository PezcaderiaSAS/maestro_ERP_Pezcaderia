import React, { useMemo } from 'react';
import {
  X,
  History,
  ShieldCheck,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import type { Product } from '../../../types/erp.types';
import type { PricingRecordSnapshot } from '../../../types/pricingEngine.types';
import { load } from '../../../services/localDb';
import { DB_KEY_HISTORICO_PRECIOS } from '../../../hooks/usePricingEngine';
import { formatCop } from './PricingChannelCard';

interface PriceHistoryAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productoId: string | null;
  products: Product[];
}

export const PriceHistoryAuditDrawer: React.FC<PriceHistoryAuditDrawerProps> = ({
  isOpen,
  onClose,
  productoId,
  products,
}) => {
  if (!isOpen || !productoId) return null;

  const currentProduct = products.find((p) => p.id === productoId);

  // Carga de snapshots inmutables desde localDb
  const snapshots: PricingRecordSnapshot[] = useMemo(() => {
    try {
      const all = load<PricingRecordSnapshot[]>(DB_KEY_HISTORICO_PRECIOS as any, []);
      return all
        .filter((s) => s.productoId === productoId)
        .sort((a, b) => new Date(b.vigenciaDesde).getTime() - new Date(a.vigenciaDesde).getTime());
    } catch {
      return [];
    }
  }, [productoId, isOpen]);

  return (
    <div
      data-testid="price-history-audit-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Cabecera del Drawer */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <History className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Auditoría NIIF — Trazabilidad de Precios
              </h3>
              <p className="text-xs text-slate-500">
                Snapshots inmutables de cambios de tarifas y márgenes
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-audit-drawer"
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha del Producto Seleccionado */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Producto en Auditoría
            </span>
            <h4 className="text-sm font-extrabold text-slate-900">
              {currentProduct?.nombre || 'Producto'}
            </h4>
            <span className="text-xs font-mono text-slate-500">
              SKU: {currentProduct?.sku || 'N/A'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Registros
            </span>
            <span className="text-lg font-black text-blue-600">
              {snapshots.length}
            </span>
          </div>
        </div>

        {/* Línea de Tiempo de Snapshots */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {snapshots.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Sin historial registrado aún</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Los cambios de precio confirmados desde el Simulador generarán snapshots auditables
                automáticos aquí.
              </p>
            </div>
          ) : (
            snapshots.map((snap, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={snap.id}
                  className={`bg-white rounded-2xl p-5 border transition-shadow shadow-2xs ${
                    isLatest ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  {/* Metadata de Fecha y Estado */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">
                        {new Date(snap.vigenciaDesde).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLatest && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Tarifa Vigente
                        </span>
                      )}
                      {snap.excepcionAutorizada && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Excepción Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bloque de Costos y Mermas */}
                  <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 block">Costo Compra:</span>
                      <span className="font-bold text-slate-800">
                        {formatCop(snap.costoCompraCop)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        Costo Ajustado (Merma +{snap.bufferEfectivoPct}%):
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCop(snap.costoAjustadoCop)}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Tarifas por Canal */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden mb-3">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/70 text-slate-600 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="px-2.5 py-2">Canal</th>
                          <th className="px-2.5 py-2 text-right">Tarifa Final</th>
                          <th className="px-2.5 py-2 text-right">Margen Neto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-2.5 py-2 font-medium text-slate-700">POS Mostrador</td>
                          <td className="px-2.5 py-2 text-right font-bold text-blue-700">
                            {formatCop(snap.precioPosCop)}
                          </td>
                          <td className="px-2.5 py-2 text-right text-slate-600">
                            {snap.margenPosPct}%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-2 font-medium text-slate-700">Restaurante HORECA</td>
                          <td className="px-2.5 py-2 text-right font-bold text-indigo-700">
                            {formatCop(snap.precioRestauranteCop)}
                          </td>
                          <td className="px-2.5 py-2 text-right text-slate-600">
                            {snap.margenRestaurantePct}%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-2 font-medium text-slate-700">Mayorista</td>
                          <td className="px-2.5 py-2 text-right font-bold text-slate-800">
                            {formatCop(snap.precioMayoristaCop)}
                          </td>
                          <td className="px-2.5 py-2 text-right text-slate-600">
                            {snap.margenMayoristaPct}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Justificación y Responsable */}
                  <div className="pt-2 text-xs flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                      <span className="font-semibold text-slate-700">Motivo:</span>
                      <span className="truncate italic">"{snap.motivoCambio}"</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{snap.usuarioNombre}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Drawer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Cerrar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
