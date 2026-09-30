import { Package, Search, PlusCircle, Edit3, ShieldAlert, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { BulkUploadModal } from '../../../components/BulkUploadModal';

export function ProductTable({
  products,
  stock,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  setEditingProductId,
  setIsCreating,
  setProductForm,
  setCustomTipo,
  setCustomLinea,
  setCustomClase,
  productsCatalog = [],
  handleEditProduct,
}: any) {
  const [sortBy, setSortBy] = useState<'nombre' | 'pareto'>('nombre');
  const [density, setDensity] = useState<'compact' | 'regular' | 'comfortable'>('regular');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const getDensityCellClass = () => {
    switch (density) {
      case 'compact':
        return 'py-1.5 px-3 text-xs';
      case 'comfortable':
        return 'py-3.5 px-4 text-sm';
      case 'regular':
      default:
        return 'py-2.5 px-3.5 text-xs';
    }
  };

  const getTotalStock = (sku: string) => {
    let total = 0;
    if (!stock) return 0;
    Object.values(stock).forEach((bodegaStock: any) => {
      if (bodegaStock && typeof bodegaStock === 'object') {
        total += bodegaStock[sku] || 0;
      }
    });
    return total;
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' ? true : statusFilter === 'ACTIVOS' ? p.activo : !p.activo;
    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    if (sortBy === 'pareto') {
      const aStock = getTotalStock(a.sku);
      const bStock = getTotalStock(b.sku);
      const aIsWeighable = a.unidadMedida === 'kg' || a.unidadMedida === 'gr' ? 1 : 0;
      const bIsWeighable = b.unidadMedida === 'kg' || b.unidadMedida === 'gr' ? 1 : 0;
      
      if (aIsWeighable !== bIsWeighable) {
          return bIsWeighable - aIsWeighable;
      }
      
      const aValue = aStock * (a.precio_compra || 0);
      const bValue = bStock * (b.precio_compra || 0);
      return bValue - aValue;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Gestión de Catálogo</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Productos y Referencias</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              borderRadius: '8px', border: '1px solid #0EA5E9', backgroundColor: 'transparent', 
              color: '#0EA5E9', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            <UploadCloud size={18} />
            <span>Importar Excel/CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingProductId(null);
              setIsCreating(true);
              setProductForm({ 
                sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, 
                codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, 
                tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: '', categoriaABC: undefined
              });
              setCustomTipo('');
              setCustomLinea('');
              setCustomClase('');
            }}
            className="hr-btn-new"
          >
            <PlusCircle size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <Card glass className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 mb-5">
          <div className="search-bar flex-1 min-w-[240px]">
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: '180px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="nombre">Ordenar por Nombre</option>
            <option value="pareto">Análisis ABC (Pesables)</option>
          </select>
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: '160px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="INACTIVOS">Solo Inactivos</option>
          </select>

          {/* Selector de Densidad Adaptativa */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                density === 'compact'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Densidad Compacta (Mayor cantidad de registros)"
            >
              Compacto
            </button>
            <button
              type="button"
              onClick={() => setDensity('regular')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                density === 'regular'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Densidad Estándar"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                density === 'comfortable'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Densidad Táctil Confortable (Pantallas táctiles y cuartos fríos)"
            >
              Táctil
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80 max-h-[70vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md z-10 shadow-sm">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className={getDensityCellClass()}>Imagen</th>
                <th className={getDensityCellClass()}>SKU</th>
                <th className={getDensityCellClass()}>Nombre y Categoría</th>
                <th className={getDensityCellClass()}>Clasificación ABC</th>
                <th className={getDensityCellClass()}>Stock Total</th>
                <th className={getDensityCellClass()}>Precio Venta (POS)</th>
                <th className={getDensityCellClass()}>Estado</th>
                <th className={getDensityCellClass()}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredProducts.map((p: any) => {
                const catData = productsCatalog.find((c: any) => c.sku === p.sku);
                const totalStock = getTotalStock(p.sku);
                const isLowStock = totalStock <= (p.buffer_seguridad || 5);

                return (
                  <tr 
                    key={p.sku} 
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    style={{ opacity: p.activo ? 1 : 0.6 }}
                  >
                    <td className={getDensityCellClass()}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                        {p.imagen ? (
                          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className={`${getDensityCellClass()} font-mono font-bold text-cyan-600 dark:text-cyan-400`}>
                      {p.sku}
                    </td>
                    <td className={getDensityCellClass()}>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{p.nombre}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {catData ? `${catData.tipo} > ${catData.linea} > ${catData.clase}` : p.categoria}
                        </span>
                      </div>
                    </td>
                    <td className={getDensityCellClass()}>
                      {(() => {
                        const abc = p.categoriaABC;
                        if (!abc) return <Badge variant="default">N/A</Badge>;
                        return (
                          <Badge variant={abc as 'A' | 'B' | 'C'}>
                            {abc}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className={getDensityCellClass()}>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold tabular-nums ${isLowStock ? 'text-rose-500 font-extrabold' : 'text-slate-900 dark:text-white'}`}>
                          {totalStock} {p.unidadMedida || 'kg'}
                        </span>
                        {isLowStock && p.control_inventario && (
                          <span title="Stock bajo buffer de seguridad"><ShieldAlert size={14} className="text-rose-500" /></span>
                        )}
                      </div>
                    </td>
                    <td className={`${getDensityCellClass()} font-semibold text-slate-800 dark:text-slate-200 tabular-nums`}>
                      ${(p.precio_venta || 0).toLocaleString()}
                    </td>
                    <td className={getDensityCellClass()}>
                      <span className={p.activo ? 'badge-vigente' : 'badge-terminado'}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={getDensityCellClass()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (handleEditProduct) {
                              handleEditProduct(p);
                              return;
                            }
                            if (setEditingProductId) setEditingProductId(p.id);
                            if (setProductForm) {
                              setProductForm({
                                sku: p.sku,
                                nombre: p.nombre,
                                categoria: p.categoria,
                                unidadMedida: p.unidadMedida || 'kg',
                                precio_compra: p.precio_compra || 0,
                                buffer_seguridad: p.buffer_seguridad || 5,
                                codigo_barras: p.codigo_barras || '',
                                iva: p.iva || 0,
                                ivaIncluido: p.ivaIncluido !== false,
                                control_inventario: p.control_inventario !== false,
                                produccion: p.produccion || false,
                                tipoCategoria: catData?.tipo || '',
                                lineaCategoria: catData?.linea || '',
                                claseCategoria: catData?.clase || '',
                                imagen: p.imagen || '',
                                categoriaABC: p.categoriaABC
                              });
                            }
                            if (setIsCreating) setIsCreating(false);
                          }}
                          className={`p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                            density === 'comfortable' ? 'min-w-[44px] min-h-[44px]' : 'min-w-[32px] min-h-[32px]'
                          }`}
                          title="Editar Producto"
                        >
                          <Edit3 size={density === 'comfortable' ? 18 : 15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <BulkUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        type="productos"
      />
    </div>
  );
}
