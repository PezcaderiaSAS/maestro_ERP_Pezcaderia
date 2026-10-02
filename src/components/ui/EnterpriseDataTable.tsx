import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface EnterpriseColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface EnterpriseDataTableProps<T> {
  columns: EnterpriseColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | null;
}

export function EnterpriseDataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder = 'Buscar en tabla...',
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyMessage = 'No se encontraron registros',
  className = '',
  onRowClick,
  selectedRowKey,
}: EnterpriseDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 1. Filtrado de Búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  // 2. Ordenamiento de Columnas
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), 'es', { numeric: true });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Paginación
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl ${className}`}>
      {/* Barra de Controles Superiores (Búsqueda + Contador) */}
      {searchable && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-white/10 bg-slate-950/40">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-white/10 bg-slate-900/90 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Registros: <span className="font-bold text-white tabular-nums">{filteredData.length}</span>
            {filteredData.length !== data.length && (
              <span className="text-slate-500 ml-1">(filtrados de {data.length})</span>
            )}
          </div>
        </div>
      )}

      {/* Contenedor con Scroll de la Tabla y Cabecera Sticky */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-sm">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;
                const alignClass =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => canSort && handleSort(col.key)}
                    className={`py-2.5 px-3 font-bold uppercase tracking-wider text-slate-300 select-none whitespace-nowrap ${alignClass} ${
                      canSort ? 'cursor-pointer hover:bg-card border-white/5/5 hover:text-white transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5 text-cyan-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const k = rowKey(row, idx);
                const isSelected = selectedRowKey === k;

                return (
                  <tr
                    key={k}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`h-9 transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-100 font-medium'
                        : 'hover:bg-slate-800/50'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-3 whitespace-nowrap tabular-nums ${alignClass} ${col.className || ''}`}
                        >
                          {col.render ? col.render(row, idx) : row[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de Tabla con Paginador Compacto (Estilo Shadcn / AntD) */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 border-t border-white/10 bg-slate-950/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-7 px-2 rounded-md bg-slate-900 border border-white/10 text-white font-semibold text-xs focus:outline-none focus:border-cyan-400"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline text-slate-400 ml-2">
            Mostrando {sortedData.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0} a{' '}
            {Math.min(safeCurrentPage * pageSize, sortedData.length)} de {sortedData.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="p-1 rounded-md border border-white/10 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 font-mono text-white text-xs">
            {safeCurrentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="p-1 rounded-md border border-white/10 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
