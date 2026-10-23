/**
 * ============================================================================
 * LA PEZCADERIA ERP — COMPONENTE: B2BRecurringTemplatesDrawer
 * ============================================================================
 * Cajón lateral de plantillas de compra recurrente para restaurantes.
 * Permite repetir pedidos semanales de pescadería con un solo clic.
 */

import React from 'react';
import { X, Repeat, Calendar, Clock, ShoppingBag, ArrowRight } from 'lucide-react';
import type {
  B2BRecurringTemplate,
  B2BOrderLineInput,
} from '../../../../types/b2bCustomerPortal.types';

export interface B2BRecurringTemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plantillas: B2BRecurringTemplate[];
  onReordenarPlantilla: (plantillaId: string) => void;
  onCargarEnCarrito?: (lineas: B2BOrderLineInput[]) => void;
}

export const B2BRecurringTemplatesDrawer: React.FC<B2BRecurringTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  plantillas,
  onReordenarPlantilla,
  onCargarEnCarrito,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="b2b-recurring-templates-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Encabezado */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Plantillas Semanales</h2>
              <p className="text-xs text-slate-500">Pedidos programados para tu restaurante</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-templates-drawer"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Plantillas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {plantillas.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-sm">No tienes plantillas guardadas</p>
              <p className="text-xs mt-1">
                Puedes guardar cualquier pedido recurrente para automatizar tus compras.
              </p>
            </div>
          ) : (
            plantillas.map((plantilla) => {
              const totalPlantilla = plantilla.lineas.reduce(
                (acc, l) => acc + Math.round(l.cantidadSolicitada * l.precioPactadoCop),
                0
              );

              return (
                <div
                  key={plantilla.id || plantilla.nombrePlantilla}
                  data-testid={`template-card-${plantilla.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-blue-300 transition-all"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {plantilla.nombrePlantilla}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <Calendar className="w-3 h-3" />
                        <span>{plantilla.diasSemana.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Jornada: {plantilla.jornadaEntrega}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Productos */}
                  <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 border border-slate-100 text-xs">
                    <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider mb-1">
                      Productos incluidos ({plantilla.lineas.length}):
                    </span>
                    {plantilla.lineas.map((linea, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-700">
                        <span className="truncate pr-2">
                          • {linea.cantidadSolicitada} {linea.modalidadVenta === 'PIEZAS_FIJAS' ? 'pzas' : 'kg'} {linea.nombre} ({linea.corte.replace(/_/g, ' ').toLowerCase()})
                        </span>
                        <span className="font-semibold shrink-0">
                          ${(Math.round(linea.cantidadSolicitada * linea.precioPactadoCop)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between font-black text-slate-900">
                      <span>Total Estimado:</span>
                      <span className="text-blue-900">${totalPlantilla.toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2 pt-1">
                    {onCargarEnCarrito && (
                      <button
                        type="button"
                        data-testid={`btn-load-template-cart-${plantilla.id}`}
                        onClick={() => {
                          onCargarEnCarrito(plantilla.lineas);
                          onClose();
                        }}
                        className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Cargar en Carrito
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid={`btn-reorder-template-${plantilla.id}`}
                      onClick={() => {
                        if (plantilla.id) {
                          onReordenarPlantilla(plantilla.id);
                          onClose();
                        }
                      }}
                      className="flex-2 min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Re-ordenar en 1 Clic</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
