import React from 'react';
import { PackageOpen } from 'lucide-react';
import { POSProductCard } from './POSProductCard';

export interface POSProductGridProps {
  products: any[];
  cliente: any | null;
  dynamicFields: any[];
  expandedStockSkus: Record<string, boolean>;
  onToggleStock: (sku: string, e: React.MouseEvent) => void;
  getProductPrice: (product: any) => number;
  getProductStock: (sku: string, bodega: string) => number;
  onAddProduct: (product: any) => void;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  products,
  cliente,
  dynamicFields,
  expandedStockSkus,
  onToggleStock,
  getProductPrice,
  getProductStock,
  onAddProduct,
}) => {
  if (products.length === 0) {
    return (
      <div
        data-testid="product-grid"
        className="pos-products-grid flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950/30 rounded-2xl border border-white/5 min-h-[220px]"
      >
        <PackageOpen size={48} className="text-slate-500 mb-3 opacity-60" />
        <h4 className="text-base font-bold text-slate-200 mb-1">No se encontraron productos</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Intente ajustando la búsqueda, seleccionando otra categoría o habilitando la opción &quot;Ver agotados&quot;.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="product-grid"
      className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 overflow-y-auto flex-1 pb-2 min-h-0"
    >
      {products.map((prod) => {
        const stockPrincipal = getProductStock(prod.sku, 'Bodega Principal');
        const stockSecundaria = getProductStock(prod.sku, 'Bodega Secundaria');
        const stockAverias = getProductStock(prod.sku, 'Bodega Averías');
        const price = getProductPrice(prod);
        const isExpandedStock = !!expandedStockSkus[prod.sku];

        return (
          <POSProductCard
            key={prod.id}
            product={prod}
            price={price}
            stockPrincipal={stockPrincipal}
            stockSecundaria={stockSecundaria}
            stockAverias={stockAverias}
            cliente={cliente}
            dynamicFields={dynamicFields}
            isExpandedStock={isExpandedStock}
            onToggleStock={onToggleStock}
            onAddProduct={onAddProduct}
          />
        );
      })}
    </div>
  );
};
