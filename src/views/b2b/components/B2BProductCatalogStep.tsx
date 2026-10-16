import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Fish,
  UtensilsCrossed,
  Waves,
  Snowflake,
  Package,
  Plus,
  Minus,
  Check,
  Scale,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { Producto, useInventoryStore } from '../../../store/useInventoryStore';
import { Cliente } from '../../../types/erp.types';
import { LineaVentaExternaInput } from '../../../contracts/b2b.contracts';

export interface B2BProductCatalogStepProps {
  selectedCliente: Cliente | null;
  cartItems: LineaVentaExternaInput[];
  onAddItem: (item: LineaVentaExternaInput) => void;
  onRemoveItem: (sku: string) => void;
  onNext: () => void;
  onBack: () => void;
  productsList?: Producto[];
  stockMap?: Record<string, Record<string, number>>;
}

interface CalibreOption {
  id: string;
  label: string;
  minGramos: number;
  maxGramos: number;
  promedioGramos: number;
}

const CALIBRE_OPTIONS: CalibreOption[] = [
  { id: '350-400', label: '350 - 400g', minGramos: 350, maxGramos: 400, promedioGramos: 375 },
  { id: '400-450', label: '400 - 450g', minGramos: 400, maxGramos: 450, promedioGramos: 425 },
  { id: '450-500', label: '450 - 500g', minGramos: 450, maxGramos: 500, promedioGramos: 475 },
  { id: '500-600', label: '500 - 600g', minGramos: 500, maxGramos: 600, promedioGramos: 550 },
  { id: '600', label: '600g +', minGramos: 600, maxGramos: 800, promedioGramos: 650 },
];

export const B2BProductCatalogStep: React.FC<B2BProductCatalogStepProps> = ({
  selectedCliente,
  cartItems,
  onAddItem,
  onRemoveItem: _onRemoveItem,
  onNext,
  onBack,
  productsList,
  stockMap,
}) => {
  const storeProducts = useInventoryStore((s) => s.products);
  const storeStock = useInventoryStore((s) => s.stock);

  const products = productsList ?? storeProducts;
  const stock = stockMap ?? storeStock;

  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estado para el modal Catch Weight Dual
  const [selectedProductForModal, setSelectedProductForModal] = useState<Producto | null>(null);
  const [piezas, setPiezas] = useState<number>(5);
  const [selectedCalibre, setSelectedCalibre] = useState<CalibreOption>(CALIBRE_OPTIONS[2]); // 450-500g por defecto
  const [selectedCorte, setSelectedCorte] = useState<string>('Entero Eviscerado');

  // Función para obtener precio según el tipo de cliente
  const getProductPrice = (prod: Producto): number => {
    const tipo = selectedCliente?.tipoPrecio || 'RESTAURANTE';
    if (tipo === 'MAYORISTA') return prod.precio_venta_mayorista || prod.precio_venta_pos;
    if (tipo === 'RESTAURANTE') return prod.precio_venta_restaurante || prod.precio_venta_pos;
    return prod.precio_venta_pos;
  };

  // Función para obtener stock de Bodega Principal
  const getStockBodegaPrincipal = (sku: string): number => {
    return stock['Bodega Principal']?.[sku] ?? stock['1']?.[sku] ?? 0;
  };

  // Clasificador de icono semántico vectorial a costo 0
  const getProductIconMeta = (nombre: string, categoria = '') => {
    const text = `${nombre} ${categoria}`.toLowerCase();
    if (text.match(/filete|posta|medall[oó]n|despiece|lomo/)) {
      return {
        icon: UtensilsCrossed,
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        badge: 'FILETE / CORTE',
      };
    }
    if (text.match(/camar[oó]n|langost|pulpo|calamar|marisco|almeja|jaiba/)) {
      return {
        icon: Waves,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        badge: 'MARISCO',
      };
    }
    if (text.match(/congelad|empanada|apanad|dedito|iqf|hielo/)) {
      return {
        icon: Snowflake,
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        textColor: 'text-cyan-700',
        badge: 'CONGELADO',
      };
    }
    if (text.match(/insumo|bolsa|caja|canastilla|empaque/)) {
      return {
        icon: Package,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-700',
        badge: 'INSUMO',
      };
    }
    return {
      icon: Fish,
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      badge: 'PESCADO ENTERO',
    };
  };

  // Filtrado de productos en tiempo real
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Filtro de categoría
      if (activeCategory !== 'TODOS') {
        const cat = (prod.categoria || '').toUpperCase();
        if (activeCategory === 'PESCADOS' && !cat.includes('PESCADO') && !cat.includes('MATERIA PRIMA')) {
          return false;
        }
        if (activeCategory === 'FILETES' && !cat.includes('FILETE') && !cat.includes('CORTE')) {
          return false;
        }
        if (activeCategory === 'MARISCOS' && !cat.includes('MARISCO') && !cat.includes('CAMARON')) {
          return false;
        }
        if (activeCategory === 'CONGELADOS' && !cat.includes('CONGELAD') && !cat.includes('IQF')) {
          return false;
        }
      }

      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = prod.nombre?.toLowerCase().includes(term);
        const matchesSku = prod.sku?.toLowerCase().includes(term);
        if (!matchesName && !matchesSku) return false;
      }

      return true;
    });
  }, [products, activeCategory, searchTerm]);

  // Apertura del modal Catch Weight Dual
  const handleOpenCatchWeightModal = (prod: Producto) => {
    setSelectedProductForModal(prod);
    setPiezas(5);
    setSelectedCalibre(CALIBRE_OPTIONS[2]);
    setSelectedCorte('Entero Eviscerado');
  };

  // Confirmar adición de producto al pedido
  const handleConfirmAddItem = () => {
    if (!selectedProductForModal) return;

    const precio = getProductPrice(selectedProductForModal);
    const pesoNominal = Number(((piezas * selectedCalibre.promedioGramos) / 1000).toFixed(3));

    const nuevaLinea: LineaVentaExternaInput = {
      productoId: selectedProductForModal.id,
      sku: selectedProductForModal.sku,
      nombre: selectedProductForModal.nombre,
      modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
      cantidadSolicitada: piezas,
      pesoEstimado: pesoNominal,
      precioPactado: precio,
      calibreMinGramos: selectedCalibre.minGramos,
      calibreMaxGramos: selectedCalibre.maxGramos,
      corte: selectedCorte,
    };

    onAddItem(nuevaLinea);
    setSelectedProductForModal(null);
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Resumen del carrito
  const totalItemsCount = cartItems.length;
  const totalEstimadoCOP = cartItems.reduce((acc, item) => {
    const peso = item.pesoEstimado || item.cantidadSolicitada;
    return acc + peso * item.precioPactado;
  }, 0);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Encabezado del Paso 2 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-cyan-700 uppercase bg-cyan-50 px-2.5 py-1 rounded-full">
              Paso 2 de 3: Catálogo Táctil
            </span>
            {selectedCliente && (
              <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                Para: <strong>{selectedCliente.nombre}</strong>
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Catálogo de Productos & Catch Weight
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Stock real en Bodega Principal. Especifica piezas y rango de calibre en gramos.
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg">
          2
        </div>
      </div>

      {/* Chips Táctiles de Categoría (>= 48px de touch target) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'TODOS', label: 'Todos', icon: Layers, testId: 'b2b-cat-chip-todos' },
          { id: 'PESCADOS', label: 'Pescados Enteros', icon: Fish, testId: 'b2b-cat-chip-pescados' },
          { id: 'FILETES', label: 'Filetes y Cortes', icon: UtensilsCrossed, testId: 'b2b-cat-chip-filetes' },
          { id: 'MARISCOS', label: 'Camarones y Mariscos', icon: Waves, testId: 'b2b-cat-chip-mariscos' },
          { id: 'CONGELADOS', label: 'Congelados IQF', icon: Snowflake, testId: 'b2b-cat-chip-congelados' },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              data-testid={cat.testId}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 shrink-0 border-2 transition-all active:scale-95 ${
                isActive
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Buscador de Productos */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto por nombre o SKU..."
          className="w-full h-12 md:h-14 pl-12 pr-12 text-sm md:text-base rounded-xl border-2 border-slate-200 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 outline-none text-slate-900 font-medium"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grid de Productos (Cero imágenes, 100% iconos vectoriales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Fish className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-40" />
            <p className="text-slate-700 font-bold">No se encontraron productos en esta categoría</p>
            <p className="text-xs text-slate-500 mt-1">Prueba con otro término de búsqueda o categoría.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const stockBodega = getStockBodegaPrincipal(prod.sku);
            const precio = getProductPrice(prod);
            const meta = getProductIconMeta(prod.nombre, prod.categoria);
            const IconComponent = meta.icon;
            const isOutOfStock = stockBodega <= 0;

            return (
              <button
                key={prod.id}
                data-testid={`b2b-product-card-${prod.sku}`}
                type="button"
                onClick={() => handleOpenCatchWeightModal(prod)}
                className="min-h-[72px] p-4 rounded-xl border-2 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/30 active:bg-cyan-100/40 text-left transition-all flex items-center justify-between group shadow-sm bg-white"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icono temático vectorial */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgColor} ${meta.borderColor} ${meta.textColor}`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mb-0.5">
                      {meta.badge}
                    </span>
                    <h4 className="font-bold text-slate-900 group-hover:text-cyan-900 text-base leading-snug truncate">
                      {prod.nombre}
                    </h4>
                    <p className="text-xs font-semibold text-slate-400">SKU: {prod.sku}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="text-base font-black text-slate-900 block leading-tight">
                    {formatCOP(precio)}
                    <span className="text-xs font-semibold text-slate-500"> / {prod.unidadMedida || 'kg'}</span>
                  </span>

                  {/* Badge de Stock en Bodega Principal */}
                  <div className="mt-1">
                    {isOutOfStock ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 inline-block">
                        Agotado en Bodega 1
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block ${
                          stockBodega <= 20
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        Stock Bodega 1: {stockBodega} kg
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modal / Drawer Táctil de Selección Catch Weight Dual */}
      {selectedProductForModal && (
        <div
          data-testid="b2b-modal-catch-weight"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-cyan-700 uppercase bg-cyan-50 px-2 py-0.5 rounded-md">
                  Catch Weight Dual (Piezas x Calibre)
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 mt-1">
                  Especificación de Calibre y Piezas
                </h3>
                <p className="text-xs text-slate-600 font-medium">{selectedProductForModal.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForModal(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector Táctil de Piezas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Cantidad de Piezas Requeridas:
              </label>
              <div className="flex items-center justify-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  data-testid="b2b-btn-pieces-minus"
                  disabled={piezas <= 1}
                  onClick={() => setPiezas((p) => Math.max(1, p - 1))}
                  className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-300 text-slate-800 flex items-center justify-center font-bold text-xl hover:border-cyan-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <div className="text-center min-w-[100px]">
                  <span className="text-3xl font-black text-slate-900">{piezas}</span>
                  <span className="text-xs font-bold text-slate-500 block uppercase">Piezas</span>
                </div>
                <button
                  type="button"
                  data-testid="b2b-btn-pieces-plus"
                  onClick={() => setPiezas((p) => p + 1)}
                  className="w-14 h-14 rounded-2xl bg-cyan-600 border-2 border-cyan-600 text-white flex items-center justify-center font-bold text-xl hover:bg-cyan-700 active:scale-95 shadow-md shadow-cyan-600/30"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Selector de Rango de Calibre en Gramos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Selecciona el Rango de Calibre:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CALIBRE_OPTIONS.map((cal) => {
                  const isSelected = selectedCalibre.id === cal.id;
                  return (
                    <button
                      key={cal.id}
                      data-testid={`b2b-calibre-chip-${cal.id}`}
                      type="button"
                      onClick={() => setSelectedCalibre(cal)}
                      className={`min-h-[48px] p-2.5 rounded-xl border-2 font-bold text-xs md:text-sm transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-950 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{cal.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Prom: {cal.promedioGramos}g
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Corte opcional */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Tipo de Corte / Presentación:
              </label>
              <div className="flex flex-wrap gap-2">
                {['Entero con Escama', 'Entero Eviscerado', 'En Filetes', 'En Postas'].map((corte) => (
                  <button
                    key={corte}
                    type="button"
                    onClick={() => setSelectedCorte(corte)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      selectedCorte === corte
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {corte}
                  </button>
                ))}
              </div>
            </div>

            {/* Cálculo de Peso y Subtotal Estimado */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Cálculo Nominal Estimado:</span>
                <span className="font-bold">
                  {piezas} piezas × {selectedCalibre.promedioGramos}g ={' '}
                  <strong className="text-slate-900">
                    {((piezas * selectedCalibre.promedioGramos) / 1000).toFixed(3)} kg
                  </strong>
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-sm">
                <span className="font-bold text-slate-700">Subtotal Cotizado (Referencial):</span>
                <span className="text-base font-black text-cyan-900">
                  {formatCOP(
                    ((piezas * selectedCalibre.promedioGramos) / 1000) *
                      getProductPrice(selectedProductForModal)
                  )}
                </span>
              </div>
            </div>

            {/* Leyenda Mandatoria de Facturación por Kilo Real */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>La cotización es referencial:</strong> En cumplimiento con las normas de
                pescadería, el cobro y la factura definitiva se liquidarán multiplicando el{' '}
                <strong>peso real exacto que marque la báscula de cuarto frío</strong> por el precio
                pactado.
              </p>
            </div>

            {/* Botón Gigante de Confirmar Adición */}
            <button
              type="button"
              data-testid="b2b-btn-confirm-add-item"
              onClick={handleConfirmAddItem}
              className="w-full h-14 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-[0.99] transition-all"
            >
              <Check className="w-5 h-5" />
              <span>AGREGAR AL PEDIDO</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Navegación y Botón de Avance */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLVER A CLIENTE</span>
        </button>

        <button
          type="button"
          data-testid="b2b-btn-continue-step2"
          disabled={totalItemsCount === 0}
          onClick={onNext}
          className={`w-full sm:flex-1 h-14 rounded-xl font-black text-base flex items-center justify-center gap-3 transition-all ${
            totalItemsCount > 0
              ? 'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white shadow-lg shadow-cyan-600/30 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>
            CONTINUAR AL RESUMEN ({totalItemsCount} {totalItemsCount === 1 ? 'ítem' : 'ítems'}) -{' '}
            {formatCOP(totalEstimadoCOP)}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
