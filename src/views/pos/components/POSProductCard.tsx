import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ProductAvatar } from '../../../components/common/ProductAvatar';

export interface POSProductCardProps {
  product: any;
  price: number;
  stockPrincipal: number;
  stockSecundaria: number;
  stockAverias: number;
  cliente: any | null;
  dynamicFields: any[];
  isExpandedStock: boolean;
  onToggleStock: (sku: string, e: React.MouseEvent) => void;
  onAddProduct: (product: any) => void;
}

export const POSProductCard: React.FC<POSProductCardProps> = ({
  product,
  price,
  stockPrincipal,
  stockSecundaria,
  stockAverias,
  cliente,
  dynamicFields,
  isExpandedStock,
  onToggleStock,
  onAddProduct,
}) => {
  const totalStock = stockPrincipal + stockSecundaria;
  const isOutOfStock = totalStock <= 0;
  const unidadNormalizada = (product.unidadMedida || product.unidad || '').toString().trim().toUpperCase();
  const isWeight = unidadNormalizada === 'KG' || unidadNormalizada === 'KILO' || unidadNormalizada === 'KILOS';
  const unitLabel = isWeight ? 'kg' : 'und';

  return (
    <Card
      glass
      className={`product-card pos-product-card min-h-[72px] sm:min-h-[110px] flex flex-col p-0 overflow-hidden cursor-pointer active:scale-95 transition-all duration-200 bg-slate-900/80 border border-white/10 hover:border-emerald-500/50 rounded-xl shadow-md ${
        isOutOfStock ? 'opacity-50 grayscale pointer-events-none' : ''
      }`}
      onClick={() => onAddProduct(product)}
    >
      {/* Contenedor Superior de Imagen / Avatar Vectorial */}
      <div
        className="product-image-container h-16 sm:h-20 overflow-hidden flex items-center justify-center relative bg-slate-950/60 border-b border-white/5"
        style={{ position: 'relative' }}
      >
        {/* Badge distintivo Kilos vs Unidad */}
        <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 10 }}>
          {isWeight ? (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1.5px 6px',
                borderRadius: '5px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: '1px solid #38BDF8',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
              title="Producto vendido por peso en kilos (pesaje balanza)"
            >
              ⚖️ KILOS
            </span>
          ) : (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1.5px 6px',
                borderRadius: '5px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: '1px solid #34D399',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
              title="Producto vendido por unidades (conteo entero)"
            >
              📦 UNIDAD
            </span>
          )}
        </div>

        {/* Semáforo de Stock usando buffer_seguridad dinámico */}
        <div
          data-testid={
            stockPrincipal === 0
              ? 'stock-badge-red'
              : stockPrincipal <= (product.buffer_seguridad || 4)
              ? 'stock-badge-yellow'
              : 'stock-badge-green'
          }
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor:
              stockPrincipal === 0
                ? '#EF4444'
                : stockPrincipal <= (product.buffer_seguridad || 4)
                ? '#F59E0B'
                : '#10B981',
            border: '1.5px solid white',
            zIndex: 10,
          }}
        />

        {/* Avatar Vectorial (Cero etiquetas img) */}
        <ProductAvatar
          nombre={product.nombre}
          categoria={product.categoria}
          imagen={product.imagen}
          size="full"
          vectorOnly={true}
          darkTheme={true}
          className="product-image max-h-12 sm:max-h-14 w-auto object-contain"
          alt={product.nombre}
        />
      </div>

      {/* Panel Inferior de Información y Precios */}
      <div className="product-info-panel p-2 sm:p-2.5 bg-transparent flex flex-col justify-between flex-1">
        <span
          className="product-card-name text-xs sm:text-sm font-bold text-white line-clamp-1 sm:line-clamp-2 drop-shadow-sm tracking-tight"
          title={product.nombre}
        >
          {product.nombre}
        </span>

        {/* Fila de Precio y Categoría de Cliente */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2px', marginTop: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span className="product-card-price-tag font-mono font-black text-sm sm:text-base text-emerald-400">
              ${(Math.round(price) || 0).toLocaleString('es-CO')}
            </span>
            <span style={{ fontSize: '10px', color: isWeight ? '#38BDF8' : '#34D399', fontWeight: 700 }}>
              / {unitLabel}
            </span>
          </div>
          {cliente && (cliente.tipoPrecio === 'RESTAURANTE' || cliente.tipoPrecio === 'MAYORISTA') && (
            <span style={{ fontSize: '9px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
              {cliente.tipoPrecio}
            </span>
          )}
        </div>

        {/* Campos dinámicos de producto si existen */}
        {dynamicFields && dynamicFields.map((field) => {
          const val = product.metadata?.[field.key] || field.defaultValue;
          return (
            <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', width: '100%', marginTop: '2px' }}>
              <span style={{ fontWeight: 600 }}>{field.label}:</span>
              <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>{val}</span>
            </div>
          );
        })}

        {/* Stock Consolidado y Desglose Modular (Ley de Miller) */}
        <div style={{ width: '100%', marginTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.12)', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>Stock Total:</span>
              <span
                data-testid={`stock-total-${product.sku}`}
                style={{
                  fontWeight: 700,
                  color:
                    totalStock === 0
                      ? '#EF4444'
                      : totalStock <= (product.buffer_seguridad || 4)
                      ? '#F59E0B'
                      : '#10B981',
                }}
              >
                {totalStock} {unitLabel}
              </span>
            </div>
            <button
              type="button"
              data-testid={`btn-toggle-stock-${product.sku}`}
              onClick={(e) => onToggleStock(product.sku, e)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all cursor-pointer"
              title="Ver desglose por bodegas"
            >
              {isExpandedStock ? 'Ocultar ▲' : 'Bodegas ▼'}
            </button>
          </div>

          {/* Desglose colapsable bajo demanda */}
          {isExpandedStock && (
            <div
              data-testid={`stock-breakdown-${product.sku}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                width: '100%',
                marginTop: '4px',
                paddingLeft: '6px',
                borderLeft: '2px solid rgba(6, 182, 212, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span style={{ color: '#94A3B8', fontWeight: 500 }}>Bod. Principal:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= (product.buffer_seguridad || 4) ? '#F59E0B' : '#10B981',
                  }}
                >
                  {stockPrincipal} {unitLabel}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span style={{ color: '#94A3B8', fontWeight: 500 }}>Bod. Secundaria:</span>
                <span style={{ color: '#CBD5E1', fontWeight: 600 }}>
                  {stockSecundaria} {unitLabel}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span style={{ color: '#94A3B8', fontWeight: 500 }}>Bod. Averías:</span>
                <span style={{ color: '#FB7185', fontWeight: 600 }}>
                  {stockAverias} {unitLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
