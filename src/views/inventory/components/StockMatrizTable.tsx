import { useState, useMemo } from 'react';
import {
  Package, Search, AlertTriangle, CheckCircle2, TrendingDown,
  Warehouse, ArrowUpDown, Filter, Eye, EyeOff
} from 'lucide-react';
import type { Bodega } from '../../../store/useWarehouseStore';
import type { Producto } from '../../../store/useInventoryStore';
import { ProductDetailFinancialModal } from './ProductDetailFinancialModal';

interface Props {
  products: Producto[];
  stock: Record<string, Record<string, number>>;
  bodegas: Bodega[];
}

type StockStatus = 'ok' | 'warning' | 'critical' | 'zero';
type SortField = 'nombre' | 'sku' | 'total' | 'abc';
type SortDir = 'asc' | 'desc';

function getStockStatus(qty: number, buffer: number, controlInventario: boolean): StockStatus {
  if (!controlInventario) return 'ok';
  if (qty === 0) return 'zero';
  if (qty <= buffer * 0.5) return 'critical';
  if (qty <= buffer) return 'warning';
  return 'ok';
}

const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string; ring: string }> = {
  ok:       { label: 'OK',        bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200' },
  warning:  { label: 'Bajo',      bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-200' },
  critical: { label: 'Crítico',   bg: 'bg-red-50',      text: 'text-red-700',     ring: 'ring-red-200' },
  zero:     { label: 'Sin stock', bg: 'bg-slate-100',   text: 'text-slate-500',   ring: 'ring-slate-200' },
};

const ABC_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'A' },
  B: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'B' },
  C: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'C' },
};

function StockCell({ qty, buffer, controlInventario, um }: { qty: number; buffer: number; controlInventario: boolean; um: string }) {
  const status = getStockStatus(qty, buffer, controlInventario);
  const cfg = STATUS_CONFIG[status];
  const pct = buffer > 0 ? Math.min((qty / (buffer * 2)) * 100, 100) : (qty > 0 ? 100 : 0);
  const barColor = status === 'ok' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-400' : status === 'critical' ? 'bg-red-500' : 'bg-slate-300';

  return (
    <td className="px-3 py-2 text-center align-middle" style={{ minWidth: '120px' }}>
      <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl ring-1 ${cfg.bg} ${cfg.ring} w-full`}>
        <span className={`text-sm font-black tabular-nums ${qty === 0 ? 'text-slate-400' : 'text-slate-800'}`}>
          {qty.toLocaleString('es-CO')} <span className="text-xs font-semibold text-slate-500">{um}</span>
        </span>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
      </div>
    </td>
  );
}

export function StockMatrizTable({ products, stock, bodegas }: Props) {
  const [search, setSearch] = useState('');
  const [abcFilter, setAbcFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'critical' | 'warning' | 'zero'>('ALL');
  const [sortField, setSortField] = useState<SortField>('abc');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  // Include ALL bodegas that have stock data, even if not yet in the bodegas store
  const activeBodegas = useMemo(() => {
    const stockBodegaNames = Object.keys(stock);
    const fromStore = bodegas.filter(b => b.activa && stockBodegaNames.includes(b.nombre));
    // Add any bodega in stock that is not in the bodegas store
    const fromStoreNames = new Set(fromStore.map(b => b.nombre));
    const extraBodegas: Bodega[] = stockBodegaNames
      .filter(name => !fromStoreNames.has(name))
      .map((name, i) => ({ id: `auto-${i}`, nombre: name, activa: true }));
    return [...fromStore, ...extraBodegas];
  }, [bodegas, stock]);

  // SKUs in stock but NOT in products catalog → orphan stock
  const productSkus = useMemo(() => new Set(products.map(p => p.sku)), [products]);
  const orphanSkus = useMemo(() => {
    const skus = new Set<string>();
    for (const bodegaStock of Object.values(stock)) {
      for (const sku of Object.keys(bodegaStock)) {
        if (!productSkus.has(sku)) skus.add(sku);
      }
    }
    return Array.from(skus);
  }, [stock, productSkus]);

  const getTotalStock = (sku: string) =>
    activeBodegas.reduce((sum, b) => sum + (stock[b.nombre]?.[sku] ?? 0), 0);

  const getWorstStatus = (p: Producto): StockStatus => {
    const statuses = activeBodegas.map(b =>
      getStockStatus(stock[b.nombre]?.[p.sku] ?? 0, p.buffer_seguridad ?? 5, p.control_inventario !== false)
    );
    if (statuses.includes('zero')) return 'zero';
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'ok';
  };

  const filtered = useMemo(() => {
    return products
      .filter(p => showInactive ? true : p.activo)
      .filter(p => {
        const q = search.toLowerCase();
        return p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q);
      })
      .filter(p => abcFilter === 'ALL' ? true : (p.categoriaABC || 'C') === abcFilter)
      .filter(p => {
        if (statusFilter === 'ALL') return true;
        return getWorstStatus(p) === statusFilter;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'nombre') cmp = a.nombre.localeCompare(b.nombre);
        else if (sortField === 'sku') cmp = a.sku.localeCompare(b.sku);
        else if (sortField === 'total') cmp = getTotalStock(a.sku) - getTotalStock(b.sku);
        else if (sortField === 'abc') {
          const order: Record<string, number> = { A: 0, B: 1, C: 2 };
          cmp = (order[a.categoriaABC || 'C'] ?? 2) - (order[b.categoriaABC || 'C'] ?? 2);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [products, stock, search, abcFilter, statusFilter, sortField, sortDir, showInactive]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const criticalCount = products.filter(p => p.activo && getWorstStatus(p) === 'critical').length;
  const warningCount  = products.filter(p => p.activo && getWorstStatus(p) === 'warning').length;
  const zeroCount     = products.filter(p => p.activo && p.control_inventario !== false && getWorstStatus(p) === 'zero').length;
  const okCount       = products.filter(p => p.activo && getWorstStatus(p) === 'ok').length;

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      className={`inline ml-1 transition-opacity ${sortField === field ? 'opacity-100 text-emerald-600' : 'opacity-30'}`}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Stock OK',      count: okCount,       icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', onClick: () => setStatusFilter('ALL') },
          { label: 'Stock Bajo',    count: warningCount,  icon: TrendingDown,  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   onClick: () => setStatusFilter(statusFilter === 'warning'  ? 'ALL' : 'warning') },
          { label: 'Stock Crítico', count: criticalCount, icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     onClick: () => setStatusFilter(statusFilter === 'critical' ? 'ALL' : 'critical') },
          { label: 'Sin Stock',     count: zeroCount,     icon: Package,       color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',   onClick: () => setStatusFilter(statusFilter === 'zero'     ? 'ALL' : 'zero') },
        ].map(({ label, count, icon: Icon, color, bg, border, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${bg} ${border} cursor-pointer hover:shadow-md transition-all text-left w-full`}
          >
            <div className={`p-2.5 rounded-xl ${bg} border ${border}`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 leading-none">{count}</p>
              <p className={`text-xs font-semibold mt-0.5 ${color}`}>{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-52 shadow-sm">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            className="border-none outline-none bg-transparent text-sm w-full text-slate-700 placeholder-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          {(['ALL', 'A', 'B', 'C'] as const).map(f => (
            <button
              key={f}
              onClick={() => setAbcFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                abcFilter === f
                  ? f === 'ALL' ? 'bg-slate-800 text-white border-slate-800'
                    : f === 'A' ? 'bg-red-600 text-white border-red-600'
                    : f === 'B' ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'Todos ABC' : `Cat. ${f}`}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowInactive(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            showInactive ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {showInactive ? <Eye size={13} /> : <EyeOff size={13} />}
          {showInactive ? 'Ocultar inactivos' : 'Ver inactivos'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Warehouse size={15} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">{activeBodegas.length} bodegas activas</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider whitespace-nowrap sticky left-0 bg-slate-900 z-10">
                  <button onClick={() => toggleSort('abc')} className="flex items-center gap-1 cursor-pointer hover:text-emerald-300 transition-colors">
                    ABC <SortIcon field="abc" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider whitespace-nowrap sticky left-12 bg-slate-900 z-10">
                  <button onClick={() => toggleSort('sku')} className="flex items-center gap-1 cursor-pointer hover:text-emerald-300 transition-colors">
                    SKU <SortIcon field="sku" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider min-w-48">
                  <button onClick={() => toggleSort('nombre')} className="flex items-center gap-1 cursor-pointer hover:text-emerald-300 transition-colors">
                    Producto <SortIcon field="nombre" />
                  </button>
                </th>
                {activeBodegas.map(b => (
                  <th key={b.id} className="px-3 py-3 text-center font-black text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Warehouse size={12} className="text-emerald-400" />
                      {b.nombre}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-black text-xs uppercase tracking-wider whitespace-nowrap bg-slate-800">
                  <button onClick={() => toggleSort('total')} className="flex items-center gap-1 cursor-pointer hover:text-emerald-300 transition-colors justify-center w-full">
                    Total Global <SortIcon field="total" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-black text-xs uppercase tracking-wider whitespace-nowrap">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && orphanSkus.length === 0 ? (
                <tr>
                  <td colSpan={5 + activeBodegas.length} className="text-center py-16 text-slate-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No se encontraron productos</p>
                    <p className="text-xs mt-1">Ajusta los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((p, idx) => {
                    const totalStock = getTotalStock(p.sku);
                    const worst = getWorstStatus(p);
                    const abcCfg = ABC_CONFIG[p.categoriaABC || 'C'];
                    const um = p.unidadMedida || 'kg';
                    const isInactive = !p.activo;

                    return (
                      <tr
                        key={p.sku}
                        onClick={() => setSelectedProduct(p)}
                        className={`border-b border-slate-100 transition-all cursor-pointer hover:bg-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} ${isInactive ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${abcCfg.bg} ${abcCfg.text}`}>
                            {abcCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 sticky left-12 bg-inherit z-10">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg whitespace-nowrap">
                            {p.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-48">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm leading-tight">{p.nombre}</span>
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                                <Eye size={10} /> Ficha 360°
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{p.categoria || '—'} · {um}</span>
                          </div>
                        </td>
                        {activeBodegas.map(b => (
                          <StockCell
                            key={b.id}
                            qty={stock[b.nombre]?.[p.sku] ?? 0}
                            buffer={p.buffer_seguridad ?? 5}
                            controlInventario={p.control_inventario !== false}
                            um={um}
                          />
                        ))}
                        <td className="px-4 py-3 text-center align-middle bg-slate-50 border-l border-slate-200">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-base font-black tabular-nums ${totalStock === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                              {totalStock.toLocaleString('es-CO')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">{um}</span>
                            {p.buffer_seguridad > 0 && (
                              <span className="text-[10px] text-slate-400">Buffer: {p.buffer_seguridad}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          {(() => {
                            const cfg = STATUS_CONFIG[worst];
                            const Icon = worst === 'ok' ? CheckCircle2 : worst === 'zero' ? Package : AlertTriangle;
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
                                <Icon size={12} />
                                {cfg.label}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Filas huérfanas: SKUs con stock en bodega pero sin ficha en el catálogo de productos */}
                  {orphanSkus.length > 0 && (
                    <>
                      <tr className="bg-amber-50 border-t-2 border-amber-300">
                        <td colSpan={5 + activeBodegas.length} className="px-4 py-2">
                          <div className="flex items-center gap-2 text-amber-700">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-black uppercase tracking-wider">
                              Stock sin ficha de producto ({orphanSkus.length}) — Recarga la página para sincronizar
                            </span>
                          </div>
                        </td>
                      </tr>
                      {orphanSkus.map((sku, idx) => {
                        const totalOrphan = activeBodegas.reduce((s, b) => s + (stock[b.nombre]?.[sku] ?? 0), 0);
                        return (
                          <tr key={`orphan-${sku}`} className={`border-b border-amber-100 ${idx % 2 === 0 ? 'bg-amber-50/40' : 'bg-white'}`}>
                            <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black bg-amber-100 text-amber-700">?</span>
                            </td>
                            <td className="px-4 py-3 sticky left-12 bg-inherit z-10">
                              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap border border-amber-200">{sku}</span>
                            </td>
                            <td className="px-4 py-3 min-w-48">
                              <span className="text-xs text-amber-600 font-semibold italic">Sin ficha en catálogo</span>
                            </td>
                            {activeBodegas.map(b => {
                              const qty = stock[b.nombre]?.[sku] ?? 0;
                              return (
                                <td key={b.id} className="px-3 py-2 text-center">
                                  <span className={`text-sm font-black tabular-nums ${qty > 0 ? 'text-amber-700' : 'text-slate-300'}`}>
                                    {qty > 0 ? qty.toLocaleString('es-CO') : '—'}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center bg-amber-50 border-l border-amber-200">
                              <span className="text-base font-black tabular-nums text-amber-700">{totalOrphan.toLocaleString('es-CO')}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ring-1 bg-amber-50 text-amber-700 ring-amber-200">
                                <AlertTriangle size={12} /> Sin ficha
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Mostrando <span className="font-bold text-slate-700">{filtered.length}</span> de{' '}
            <span className="font-bold text-slate-700">{products.length}</span> productos
            {orphanSkus.length > 0 && (
              <span className="ml-2 text-amber-600 font-bold">· {orphanSkus.length} SKU(s) sin ficha</span>
            )}
          </span>
          <span className="text-xs text-slate-400">
            Última actualización: {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailFinancialModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSave={() => {
            // Callback para cuando se guarda un producto. No recargamos la página.
            // Zustand ya despachará actualizaciones.
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
