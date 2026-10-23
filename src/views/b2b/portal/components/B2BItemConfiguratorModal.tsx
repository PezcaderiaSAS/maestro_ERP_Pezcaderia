/**
 * ============================================================================
 * LA PEZCADERIA ERP — COMPONENTE: B2BItemConfiguratorModal
 * ============================================================================
 * Modal táctil para configurar el despiece, empaque con hielo, modalidad
 * de venta (Catch Weight) y notas de corte de cocina antes de agregar al carrito.
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Scissors, Box, Scale, Check } from 'lucide-react';
import type {
  B2BCatalogProductItem,
  B2BProductCut,
  B2BPackaging,
  B2BSaleModality,
} from '../../../../types/b2bCustomerPortal.types';

export interface B2BItemConfiguratorModalProps {
  isOpen: boolean;
  producto: B2BCatalogProductItem | null;
  onClose: () => void;
  onAddToCart: (
    producto: B2BCatalogProductItem,
    config: {
      corte: B2BProductCut;
      empaque: B2BPackaging;
      modalidadVenta: B2BSaleModality;
      cantidad: number;
      piezas?: number;
      observaciones?: string;
    }
  ) => void;
}

const CORTES_LABELS: Record<B2BProductCut, string> = {
  ENTERO_FRESCO: 'Entero Fresco (con vísceras)',
  ENTERO_EVISCERADO: 'Entero Eviscerado & Limpio',
  FILETE_CON_PIEL: 'Filete con Piel',
  FILETE_SIN_PIEL: 'Filete sin Piel',
  RODAJAS: 'Rodajas / Postas',
  PORCIONES_CALIBRADAS: 'Porciones Calibradas (g)',
  OTRO_ESPECIAL: 'Corte Especial Chef',
};

const EMPAQUES_LABELS: Record<B2BPackaging, string> = {
  CAJA_TERMICA_HIELO: 'Caja Térmica con Hielo en Escamas',
  BOLSA_VACIO: 'Bolsa al Vacío Individual',
  CANASTILLA_RETORNABLE: 'Canastilla Plástica Retornable',
  GRANEL_REFRIGERADO: 'Granel en Caja Frigorífica',
};

export const B2BItemConfiguratorModal: React.FC<B2BItemConfiguratorModalProps> = ({
  isOpen,
  producto,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !producto) return null;

  const [corte, setCorte] = useState<B2BProductCut>(producto.cortesDisponibles[0] || 'FILETE_CON_PIEL');
  const [empaque, setEmpaque] = useState<B2BPackaging>(producto.empaquesDisponibles[0] || 'CAJA_TERMICA_HIELO');
  const [modalidadVenta, setModalidadVenta] = useState<B2BSaleModality>(producto.modalidadVentaDefault);
  const [cantidad, setCantidad] = useState<number>(modalidadVenta === 'KILOGRAMOS_ESTIMADOS' ? 5 : 5);
  const [piezas, setPiezas] = useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = useState<string>('');

  useEffect(() => {
    if (producto) {
      setCorte(producto.cortesDisponibles[0] || 'FILETE_CON_PIEL');
      setEmpaque(producto.empaquesDisponibles[0] || 'CAJA_TERMICA_HIELO');
      setModalidadVenta(producto.modalidadVentaDefault);
      setCantidad(5);
      setPiezas(undefined);
      setObservaciones('');
    }
  }, [producto]);

  const subtotalEstimado = Math.round(cantidad * producto.precioPactadoCop);
  const pesoEstimadoKg =
    modalidadVenta === 'KILOGRAMOS_ESTIMADOS'
      ? cantidad
      : piezas
      ? Math.round(piezas * 0.45 * 10) / 10
      : Math.round(cantidad * 0.45 * 10) / 10;

  const handleIncrement = () => setCantidad((prev) => prev + 1);
  const handleDecrement = () => setCantidad((prev) => (prev > 1 ? prev - 1 : 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidad <= 0) return;
    onAddToCart(producto, {
      corte,
      empaque,
      modalidadVenta,
      cantidad,
      piezas,
      observaciones: observaciones.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="b2b-item-configurator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {producto.sku}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">{producto.nombre}</h2>
            <p className="text-xs text-slate-500 italic">
              {producto.especie} · Tarifa Pactada: ${producto.precioPactadoCop.toLocaleString('es-CO')}
            </p>
          </div>
          <button
            type="button"
            data-testid="btn-close-configurator-modal"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Selección de Corte */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>1. Seleccionar Corte de Pescado</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {producto.cortesDisponibles.map((c) => {
                const isSelected = corte === c;
                return (
                  <button
                    key={c}
                    type="button"
                    data-testid={`btn-corte-${c.toLowerCase()}`}
                    onClick={() => setCorte(c)}
                    className={`p-2.5 min-h-[48px] rounded-lg text-left text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{CORTES_LABELS[c] || c}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección de Empaque Térmico */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Box className="w-4 h-4 text-blue-600" />
              <span>2. Tipo de Empaque de Conservación</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {producto.empaquesDisponibles.map((emp) => {
                const isSelected = empaque === emp;
                return (
                  <button
                    key={emp}
                    type="button"
                    data-testid={`btn-empaque-${emp.toLowerCase()}`}
                    onClick={() => setEmpaque(emp)}
                    className={`p-2.5 min-h-[48px] rounded-lg text-left text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{EMPAQUES_LABELS[emp] || emp}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modalidad de Venta: Kilos Estimados vs Piezas */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>3. Modalidad de Despacho (Catch Weight)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="btn-modality-kg"
                onClick={() => setModalidadVenta('KILOGRAMOS_ESTIMADOS')}
                className={`p-3 min-h-[48px] rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  modalidadVenta === 'KILOGRAMOS_ESTIMADOS'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Por Kilogramos Estimados
              </button>
              <button
                type="button"
                data-testid="btn-modality-pieces"
                onClick={() => setModalidadVenta('PIEZAS_FIJAS')}
                className={`p-3 min-h-[48px] rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  modalidadVenta === 'PIEZAS_FIJAS'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Por Piezas Fijas
              </button>
            </div>
          </div>

          {/* Stepper de Cantidad */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <span className="block text-xs font-bold text-slate-600 uppercase mb-2">
              {modalidadVenta === 'KILOGRAMOS_ESTIMADOS' ? 'Kilos a Solicitar:' : 'Piezas a Solicitar:'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-testid="btn-qty-decrement"
                onClick={handleDecrement}
                className="w-12 h-12 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 flex items-center justify-center font-black text-lg transition-colors cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>

              <input
                type="number"
                min="1"
                step="1"
                data-testid="input-item-qty"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center font-black text-xl text-slate-900 bg-white border border-slate-300 rounded-lg py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />

              <button
                type="button"
                data-testid="btn-qty-increment"
                onClick={handleIncrement}
                className="w-12 h-12 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 flex items-center justify-center font-black text-lg transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Instrucciones especiales de corte para la cocina */}
          <div>
            <label
              htmlFor="textarea-instrucciones-corte"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Instrucciones Específicas del Chef / Cocina
            </label>
            <textarea
              id="textarea-instrucciones-corte"
              data-testid="textarea-item-observations"
              rows={2}
              placeholder="Ej: Calibre individual de 180g a 200g, sin espina dorsal..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Resumen en vivo */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 block">
                Subtotal Estimado ({pesoEstimadoKg} kg aprox.)
              </span>
              <span
                data-testid="modal-estimated-subtotal"
                className="text-xl font-black text-blue-950"
              >
                ${subtotalEstimado.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium text-right max-w-[160px]">
              *Ajuste final exacto en la báscula de despacho
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-confirm-add-cart"
              className="flex-2 min-h-[52px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Agregar al Carrito (${subtotalEstimado.toLocaleString('es-CO')})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
