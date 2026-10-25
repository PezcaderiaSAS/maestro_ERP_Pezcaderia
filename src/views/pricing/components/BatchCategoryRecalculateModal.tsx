import React, { useState, useMemo } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Package,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { Product } from '../../../types/erp.types';
import type {
  PricingGlobalConfig,
  BatchCategoryRecalculateItem,
} from '../../../types/pricingEngine.types';
import { pricingConfigService } from '../../../services/pricing/pricingConfigService';
import { pricingCalculationService } from '../../../services/pricing/pricingCalculationService';
import { formatCop } from './PricingChannelCard';

interface BatchCategoryRecalculateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  globalConfig: PricingGlobalConfig;
  onApplyBatchRecalculate: (categoriaId: string) => { actualizados: number };
}

export const BatchCategoryRecalculateModal: React.FC<BatchCategoryRecalculateModalProps> = ({
  isOpen,
  onClose,
  products,
  globalConfig,
  onApplyBatchRecalculate,
}) => {
  if (!isOpen) return null;

  // Extraer categorías únicas disponibles
  const categoriasDisponibles = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.categoria))).filter(Boolean);
    return cats.length > 0 ? cats : ['cat-salmon', 'cat-blanco', 'cat-mariscos'];
  }, [products]);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(
    () => categoriasDisponibles[0] || 'cat-salmon'
  );

  // Previsualización de recálculo masivo para la categoría seleccionada
  const previewItems: BatchCategoryRecalculateItem[] = useMemo(() => {
    const itemsCat = products.filter(
      (p) => p.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase()
    );

    return itemsCat.map((prod) => {
      const buffer = pricingConfigService.resolveEffectiveBuffer(
        prod.categoria,
        prod.buffer_seguridad,
        globalConfig
      );
      const costoAdj = pricingCalculationService.calculateAdjustedCost(
        prod.precio_compra,
        buffer,
        globalConfig.redondeoEnteroCop
      );

      const posResult = pricingCalculationService.calculateChannelTariff(
        costoAdj,
        globalConfig.canales.margenPosPct,
        'EXENTO_O_EXCLUIDO',
        globalConfig.redondeoEnteroCop,
        'POS'
      );
      const restResult = pricingCalculationService.calculateChannelTariff(
        costoAdj,
        globalConfig.canales.margenRestaurantePct,
        'EXENTO_O_EXCLUIDO',
        globalConfig.redondeoEnteroCop,
        'RESTAURANTE_HORECA'
      );
      const mayorResult = pricingCalculationService.calculateChannelTariff(
        costoAdj,
        globalConfig.canales.margenMayoristaPct,
        'EXENTO_O_EXCLUIDO',
        globalConfig.redondeoEnteroCop,
        'MAYORISTA'
      );

      const variacion =
        posResult.precioFinalCop -
        (prod.precio_venta_pos || 0) +
        (restResult.precioFinalCop - (prod.precio_venta_restaurante || 0)) +
        (mayorResult.precioFinalCop - (prod.precio_venta_mayorista || 0));

      return {
        productoId: prod.id,
        sku: prod.sku,
        nombreProducto: prod.nombre,
        costoCompraCop: prod.precio_compra,
        bufferMermaPct: buffer,
        costoAjustadoCop: costoAdj,
        precioPosAnteriorCop: prod.precio_venta_pos || 0,
        precioPosNuevoCop: posResult.precioFinalCop,
        precioRestauranteAnteriorCop: prod.precio_venta_restaurante || 0,
        precioRestauranteNuevoCop: restResult.precioFinalCop,
        precioMayoristaAnteriorCop: prod.precio_venta_mayorista || 0,
        precioMayoristaNuevoCop: mayorResult.precioFinalCop,
        variacionTotalCop: variacion,
      };
    });
  }, [products, categoriaSeleccionada, globalConfig]);

  const handleConfirmBatch = async () => {
    if (previewItems.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'No hay productos en esta categoría para actualizar.',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Confirmar Recálculo Masivo?',
      text: `Se actualizarán los precios de venta (POS, HORECA y Mayorista) para ${previewItems.length} productos de la categoría "${categoriaSeleccionada}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aplicar recálculo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
    });

    if (result.isConfirmed) {
      const res = onApplyBatchRecalculate(categoriaSeleccionada);
      await Swal.fire({
        icon: 'success',
        title: 'Recálculo Aplicado',
        text: `Se actualizaron exitosamente ${res.actualizados} productos en el catálogo.`,
        timer: 2000,
        showConfirmButton: false,
      });
      onClose();
    }
  };

  return (
    <div
      data-testid="batch-recalculate-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Recálculo Masivo de Precios por Categoría
              </h3>
              <p className="text-xs text-slate-500">
                Sincroniza y propaga márgenes globales y mermas a todos los productos del catálogo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro y Parámetros */}
        <div className="p-6 border-b border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Seleccionar Categoría a Recalcular:
            </label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            <span className="font-bold block mb-0.5">Parámetros Globales Aplicables:</span>
            <span>
              POS: <strong>+{globalConfig.canales.margenPosPct}%</strong> | HORECA:{' '}
              <strong>+{globalConfig.canales.margenRestaurantePct}%</strong> | Mayorista:{' '}
              <strong>+{globalConfig.canales.margenMayoristaPct}%</strong>
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Productos en Lote:</span>
              <span className="text-lg font-extrabold text-slate-900">
                {previewItems.length}
              </span>
            </div>
            <Package className="w-7 h-7 text-slate-400" />
          </div>
        </div>

        {/* Tabla Comparativa de Precios Proyectados */}
        <div className="p-6 max-h-[380px] overflow-y-auto">
          {previewItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No hay productos registrados en la categoría seleccionada.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3 py-3">SKU / Producto</th>
                    <th className="px-3 py-3 text-right">Costo Ajustado</th>
                    <th className="px-3 py-3 text-right">POS (Ant $\rightarrow$ Nuevo)</th>
                    <th className="px-3 py-3 text-right">HORECA (Ant $\rightarrow$ Nuevo)</th>
                    <th className="px-3 py-3 text-right">Mayorista (Ant $\rightarrow$ Nuevo)</th>
                    <th className="px-3 py-3 text-right">Impacto Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {previewItems.map((item) => (
                    <tr key={item.productoId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        <div className="font-bold">{item.sku}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                          {item.nombreProducto}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        <div>{formatCop(item.costoAjustadoCop)}</div>
                        <div className="text-[10px] text-slate-400">
                          Merma: +{item.bufferMermaPct}%
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-slate-400 line-through mr-1">
                          {formatCop(item.precioPosAnteriorCop)}
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatCop(item.precioPosNuevoCop)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-slate-400 line-through mr-1">
                          {formatCop(item.precioRestauranteAnteriorCop)}
                        </span>
                        <span className="font-bold text-indigo-700">
                          {formatCop(item.precioRestauranteNuevoCop)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-slate-400 line-through mr-1">
                          {formatCop(item.precioMayoristaAnteriorCop)}
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCop(item.precioMayoristaNuevoCop)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold">
                        <span
                          className={
                            item.variacionTotalCop >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }
                        >
                          {item.variacionTotalCop >= 0 ? '+' : ''}
                          {formatCop(item.variacionTotalCop)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            * Los precios son calculados aplicando el redondeo entero NIIF (RN-06).
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmBatch}
              disabled={previewItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Aplicar Recálculo Masivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
