import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Search,
  RefreshCw,
  Save,
  AlertTriangle,
  History,
  Layers,
  Scale,
  DollarSign,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { Product } from '../../../types/erp.types';
import type {
  PricingGlobalConfig,
  RegimenIva,
  ProductPricingSimulationInput,
} from '../../../types/pricingEngine.types';
import { pricingConfigService } from '../../../services/pricing/pricingConfigService';
import { pricingCalculationService } from '../../../services/pricing/pricingCalculationService';
import { PricingChannelCard, formatCop } from './PricingChannelCard';
import { BatchCategoryRecalculateModal } from './BatchCategoryRecalculateModal';

interface PricingSimulatorTabProps {
  products: Product[];
  globalConfig: PricingGlobalConfig;
  onCommitProductTariffs: (
    productoId: string,
    tarifas: { POS: number; RESTAURANTE_HORECA: number; MAYORISTA: number },
    motivo: string
  ) => { success: boolean; error?: string };
  onApplyBatchRecalculate: (categoriaId: string) => { actualizados: number };
  currentUserRole?: string;
  onViewHistory?: (productoId: string) => void;
}

export const PricingSimulatorTab: React.FC<PricingSimulatorTabProps> = ({
  products,
  globalConfig,
  onCommitProductTariffs,
  onApplyBatchRecalculate,
  currentUserRole = 'vendedor',
  onViewHistory,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regimenIva, setRegimenIva] = useState<RegimenIva>('EXENTO_O_EXCLUIDO');
  const [customBufferPct, setCustomBufferPct] = useState<number | undefined>(undefined);
  const [customMargenPos, setCustomMargenPos] = useState<number | undefined>(undefined);
  const [customMargenRestaurante, setCustomMargenRestaurante] = useState<number | undefined>(undefined);
  const [customMargenMayorista, setCustomMargenMayorista] = useState<number | undefined>(undefined);
  const [motivoCambio, setMotivoCambio] = useState<string>('');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Filtrado de productos para el selector predictivo
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Producto seleccionado
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Manejo de cambio de producto: restablece personalizaciones
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    setCustomBufferPct(undefined);
    setCustomMargenPos(undefined);
    setCustomMargenRestaurante(undefined);
    setCustomMargenMayorista(undefined);
    setMotivoCambio('');
  };

  // Simulación en tiempo real (<50ms)
  const simulationResult = useMemo(() => {
    if (!selectedProduct) return null;

    const input: ProductPricingSimulationInput = {
      productoId: selectedProduct.id,
      categoriaId: selectedProduct.categoria,
      costoCompraCop: selectedProduct.precio_compra,
      bufferPersonalizadoPct: customBufferPct ?? selectedProduct.buffer_seguridad,
      regimenIva,
      margenPosSobrescritoPct: customMargenPos,
      margenRestauranteSobrescritoPct: customMargenRestaurante,
      margenMayoristaSobrescritoPct: customMargenMayorista,
    };

    return pricingCalculationService.simulateProductPricing(input, globalConfig);
  }, [
    selectedProduct,
    customBufferPct,
    customMargenPos,
    customMargenRestaurante,
    customMargenMayorista,
    regimenIva,
    globalConfig,
  ]);

  // Disparar confirmación y guardado
  const handlePublishTariffs = async () => {
    if (!selectedProduct || !simulationResult) return;

    if (!simulationResult.puedeGuardar) {
      await Swal.fire({
        icon: 'error',
        title: 'Tarifas No Permitidas',
        text: simulationResult.bloqueos.join('. '),
      });
      return;
    }

    const tarifas = {
      POS: simulationResult.canales.POS.precioFinalCop,
      RESTAURANTE_HORECA: simulationResult.canales.RESTAURANTE_HORECA.precioFinalCop,
      MAYORISTA: simulationResult.canales.MAYORISTA.precioFinalCop,
    };

    const res = onCommitProductTariffs(
      selectedProduct.id,
      tarifas,
      motivoCambio.trim() || 'Ajuste de tarifas comerciales desde el Simulador Multicanal'
    );

    if (res?.success) {
      await Swal.fire({
        icon: 'success',
        title: 'Tarifas Publicadas',
        text: `Tarifas actualizadas para ${selectedProduct.nombre}.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } else if (res?.error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al Publicar',
        text: res.error,
      });
    }
  };

  return (
    <div data-testid="pricing-simulator-tab" className="space-y-6">
      {/* Barra Superior de Herramientas y Filtro */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-xl">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Seleccionar Producto para Simulación Multicanal
          </label>
          <div className="relative">
            <select
              data-testid="select-simulator-product"
              value={selectedProductId}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full h-12 min-h-[48px] px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
            >
              <option value="">-- Selecciona un producto del catálogo --</option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.nombre} — Costo Base: {formatCop(p.precio_compra)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="btn-open-batch-modal"
            onClick={() => setIsBatchModalOpen(true)}
            className="h-12 min-h-[48px] px-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 active:scale-95 transition-all shadow-2xs flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recálculo en Lote</span>
          </button>

          {onViewHistory && selectedProductId && (
            <button
              type="button"
              onClick={() => onViewHistory(selectedProductId)}
              className="h-12 min-h-[48px] px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all shadow-2xs flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>Auditoría NIIF</span>
            </button>
          )}
        </div>
      </div>

      {/* Si no hay producto seleccionado */}
      {!selectedProduct && (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-2xl mx-auto shadow-2xs my-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
            <Calculator className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Simulador de Precios Dinámicos Multicanal
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Selecciona un producto en el menú superior para proyectar en tiempo real los márgenes
            de rentabilidad para POS Mostrador, Restaurantes HORECA y Distribuidores Mayoristas.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 font-medium">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Fórmulas con redondeo entero COP y control estricto de mermas</span>
          </div>
        </div>
      )}

      {/* Producto Seleccionado y Ficha de Costo Ajustado */}
      {selectedProduct && simulationResult && (
        <div className="space-y-6">
          {/* Tarjeta Resumen del Producto y Variables Base */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Producto y SKU
              </span>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">
                {selectedProduct.nombre}
              </h3>
              <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                SKU: {selectedProduct.sku} | Cat: {selectedProduct.categoria}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block mb-1">Costo Compra Inicial:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {formatCop(simulationResult.costoCompraCop)}
                </span>
                <span className="text-slate-500 text-[11px]">COP</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
              <span className="text-blue-700 font-semibold block mb-1">
                Merma Biológica Aplicada:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-blue-950">
                  +{simulationResult.bufferEfectivoPct}%
                </span>
                <span className="text-[11px] text-blue-600 font-medium">
                  {customBufferPct !== undefined ? '(Personalizada)' : '(Heredada Cat)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
              <span className="text-emerald-700 font-semibold block mb-1">
                Costo Ajustado (Base NIIF):
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-emerald-950">
                  {formatCop(simulationResult.costoAjustadoCop)}
                </span>
                <span className="text-emerald-600 text-[11px]">COP / Ud</span>
              </div>
            </div>
          </div>

          {/* Ajuste de Parámetros Bimodales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Régimen de IVA Aplicable:
              </label>
              <select
                value={regimenIva}
                onChange={(e) => setRegimenIva(e.target.value as RegimenIva)}
                className="w-full h-11 min-h-[44px] px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="EXENTO_O_EXCLUIDO">EXENTO O EXCLUIDO (0%)</option>
                <option value="GRAVADO_IVA_19">GRAVADO IVA GENERAL (19%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sobrescribir Merma para este Producto (%):
              </label>
              <input
                type="number"
                min="0"
                max="50"
                placeholder={`Default: ${pricingConfigService.resolveEffectiveBuffer(selectedProduct.categoria, undefined, globalConfig)}%`}
                value={customBufferPct !== undefined ? customBufferPct : ''}
                onChange={(e) =>
                  setCustomBufferPct(e.target.value === '' ? undefined : Number(e.target.value))
                }
                className="w-full h-11 min-h-[44px] px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo / Justificación de Tarifa:
              </label>
              <input
                type="text"
                placeholder="Ej. Temporada alta, ajuste proveedor..."
                value={motivoCambio}
                onChange={(e) => setMotivoCambio(e.target.value)}
                className="w-full h-11 min-h-[44px] px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Advertencias y Bloqueos de Margen */}
          {simulationResult.advertencias.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Alerta de Seguridad Comercial:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {simulationResult.advertencias.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Grid de 3 Tarjetas de Canales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingChannelCard
              canal="POS"
              result={simulationResult.canales.POS}
              onChangeMargen={(m) => setCustomMargenPos(m)}
            />
            <PricingChannelCard
              canal="RESTAURANTE_HORECA"
              result={simulationResult.canales.RESTAURANTE_HORECA}
              onChangeMargen={(m) => setCustomMargenRestaurante(m)}
            />
            <PricingChannelCard
              canal="MAYORISTA"
              result={simulationResult.canales.MAYORISTA}
              onChangeMargen={(m) => setCustomMargenMayorista(m)}
            />
          </div>

          {/* Barra de Publicación y Acciones Finales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Al guardar, se generará un snapshot inmutable para auditoría NIIF y se actualizarán
              los puntos de venta.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setCustomBufferPct(undefined);
                  setCustomMargenPos(undefined);
                  setCustomMargenRestaurante(undefined);
                  setCustomMargenMayorista(undefined);
                }}
                className="h-12 min-h-[48px] px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Restablecer Márgenes
              </button>

              <button
                type="button"
                data-testid="btn-publish-tariffs"
                onClick={handlePublishTariffs}
                disabled={!simulationResult.puedeGuardar}
                className="h-12 min-h-[48px] px-6 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar y Publicar Tarifas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recálculo en Lote */}
      <BatchCategoryRecalculateModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        products={products}
        globalConfig={globalConfig}
        onApplyBatchRecalculate={onApplyBatchRecalculate}
      />
    </div>
  );
};
