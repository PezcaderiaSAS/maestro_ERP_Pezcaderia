import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Calendar,
  Building2,
  DollarSign,
  Scale,
  TrendingUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { obtenerKardex } from '../../../services/inventoryService';
import type { KardexMovement, TipoMovimientoKardex } from '../../../types/erp.types';

interface KardexTableProps {
  initialSku?: string;
  bodegas?: Array<{ id: string; nombre: string }>;
  onSelectSku?: (sku: string) => void;
}

export const KardexTable: React.FC<KardexTableProps> = ({
  initialSku = '',
  bodegas = [],
  onSelectSku,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSku);
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedBodega, setSelectedBodega] = useState<string>('TODAS');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Cargar movimientos desde el servicio
  const allMovements = useMemo(() => {
    return obtenerKardex();
  }, []);

  // Filtrado reactivo inmutable
  const filteredMovements = useMemo(() => {
    return allMovements
      .filter((m) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchSku = m.sku.toLowerCase().includes(term);
          const matchNombre = m.nombre_producto.toLowerCase().includes(term);
          const matchDoc = m.documento_referencia.toLowerCase().includes(term);
          if (!matchSku && !matchNombre && !matchDoc) return false;
        }

        if (selectedTipo !== 'TODOS' && m.tipo_movimiento !== selectedTipo) {
          return false;
        }

        if (selectedBodega !== 'TODAS' && m.bodega_id !== selectedBodega) {
          return false;
        }

        if (fechaInicio && m.fecha < `${fechaInicio}T00:00:00`) {
          return false;
        }

        if (fechaFin && m.fecha > `${fechaFin}T23:59:59`) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [allMovements, searchTerm, selectedTipo, selectedBodega, fechaInicio, fechaFin]);

  // Resumen métrico del período filtrado
  const metricas = useMemo(() => {
    let totalEntradasKg = 0;
    let totalEntradasValor = 0;
    let totalSalidasKg = 0;
    let totalSalidasValor = 0;

    filteredMovements.forEach((m) => {
      const esEntrada =
        m.tipo_movimiento.startsWith('ENTRADA') ||
        m.tipo_movimiento === 'DEVOLUCION_CLIENTE';

      if (esEntrada) {
        totalEntradasKg += m.cantidad_kg;
        totalEntradasValor += m.costo_total;
      } else {
        totalSalidasKg += m.cantidad_kg;
        totalSalidasValor += m.costo_total;
      }
    });

    const ultimoRegistro = filteredMovements[0];
    const saldoKg = ultimoRegistro ? ultimoRegistro.saldo_cantidad_kg : 0;
    const cppVigente = ultimoRegistro ? ultimoRegistro.saldo_costo_promedio : 0;
    const valorTotalSaldo = ultimoRegistro ? ultimoRegistro.saldo_valor_total : 0;

    return {
      totalEntradasKg: Math.round(totalEntradasKg * 100) / 100,
      totalEntradasValor: Math.round(totalEntradasValor),
      totalSalidasKg: Math.round(totalSalidasKg * 100) / 100,
      totalSalidasValor: Math.round(totalSalidasValor),
      saldoKg: Math.round(saldoKg * 100) / 100,
      cppVigente: Math.round(cppVigente),
      valorTotalSaldo: Math.round(valorTotalSaldo),
    };
  }, [filteredMovements]);

  // Paginación
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredMovements.slice(start, start + itemsPerPage);
  }, [filteredMovements, page]);

  // Exportar a CSV delimitado por punto y coma
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) return;

    const headers = [
      'Fecha',
      'Documento',
      'SKU',
      'Producto',
      'Tipo Movimiento',
      'Cantidad (Kg)',
      'Costo Unitario ($)',
      'Costo Total ($)',
      'Saldo (Kg)',
      'Saldo CPP ($)',
      'Saldo Total ($)',
      'Bodega',
      'Responsable',
      'Notas',
    ];

    const rows = filteredMovements.map((m) => [
      new Date(m.fecha).toLocaleString('es-CO'),
      `"${m.documento_referencia}"`,
      `"${m.sku}"`,
      `"${m.nombre_producto.replace(/"/g, '""')}"`,
      `"${m.tipo_movimiento}"`,
      m.cantidad_kg,
      m.costo_unitario,
      m.costo_total,
      m.saldo_cantidad_kg,
      m.saldo_costo_promedio,
      m.saldo_valor_total,
      `"${m.bodega_nombre || m.bodega_id || 'N/A'}"`,
      `"${m.usuario_responsable}"`,
      `"${(m.notas || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kardex_reporte_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a PDF empresarial limpio
  const handleExportPDF = () => {
    if (filteredMovements.length === 0) return;

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado corporativo
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LA PEZCADERÍA S.A.S. — REPORTE DE KARDEX CONTABLE (NIIF NIC 2)', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-CO')} | Filtro SKU: ${searchTerm || 'TODOS'} | Bodega: ${selectedBodega}`, 14, 21);

    // Resumen de Métricas en el PDF
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      `Total Entradas: ${metricas.totalEntradasKg.toLocaleString()} Kg ($${metricas.totalEntradasValor.toLocaleString('es-CO')})  |  Total Salidas: ${metricas.totalSalidasKg.toLocaleString()} Kg ($${metricas.totalSalidasValor.toLocaleString('es-CO')})  |  Saldo en Libros: ${metricas.saldoKg.toLocaleString()} Kg ($${metricas.valorTotalSaldo.toLocaleString('es-CO')})`,
      14,
      36
    );

    // Tabla de Movimientos
    let startY = 44;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    // Header de columnas
    doc.setFillColor(241, 245, 249);
    doc.rect(14, startY - 5, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha', 16, startY);
    doc.text('Doc. Ref', 42, startY);
    doc.text('SKU / Producto', 72, startY);
    doc.text('Tipo Movimiento', 130, startY);
    doc.text('Cant (Kg)', 180, startY);
    doc.text('Costo Unit.', 205, startY);
    doc.text('Saldo (Kg)', 230, startY);
    doc.text('CPP Saldo', 255, startY);
    doc.text('Valor Total', 280, startY, { align: 'right' });

    startY += 6;
    doc.setFont('helvetica', 'normal');

    filteredMovements.slice(0, 35).forEach((m, idx) => {
      if (startY > 190) {
        doc.addPage();
        startY = 20;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, startY - 4, pageWidth - 28, 6, 'F');
      }

      doc.setTextColor(30, 41, 59);
      doc.text(new Date(m.fecha).toLocaleDateString('es-CO'), 16, startY);
      doc.text(m.documento_referencia.slice(0, 14), 42, startY);
      doc.text(`${m.sku} - ${m.nombre_producto.slice(0, 24)}`, 72, startY);
      doc.text(m.tipo_movimiento.replace(/_/g, ' '), 130, startY);
      doc.text(`${m.cantidad_kg} kg`, 180, startY);
      doc.text(`$${m.costo_unitario.toLocaleString('es-CO')}`, 205, startY);
      doc.text(`${m.saldo_cantidad_kg} kg`, 230, startY);
      doc.text(`$${m.saldo_costo_promedio.toLocaleString('es-CO')}`, 255, startY);
      doc.text(`$${m.saldo_valor_total.toLocaleString('es-CO')}`, 280, startY, { align: 'right' });

      startY += 5.5;
    });

    doc.save(`kardex_niif_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const getTipoBadge = (tipo: TipoMovimientoKardex) => {
    switch (tipo) {
      case 'ENTRADA_COMPRA':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ENTRADA_PRODUCTO_TERMINADO':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'ENTRADA_TRASLADO':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'SALIDA_VENTA_POS':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'SALIDA_DESPACHO_B2B':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'SALIDA_MATERIA_PRIMA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'SALIDA_TRASLADO':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'AJUSTE_MERMA':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'AJUSTE_INVENTARIO':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Tarjetas KPI de Resumen del Kardex ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 p-4 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Entradas</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{metricas.totalEntradasKg.toLocaleString()}</span>
            <span className="text-xs text-slate-400">Kg</span>
          </div>
          <p className="text-xs text-emerald-300/80 mt-1 font-mono">
            ${metricas.totalEntradasValor.toLocaleString('es-CO')} COP
          </p>
        </div>

        {/* Salidas */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 p-4 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Total Salidas</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{metricas.totalSalidasKg.toLocaleString()}</span>
            <span className="text-xs text-slate-400">Kg</span>
          </div>
          <p className="text-xs text-blue-300/80 mt-1 font-mono">
            ${metricas.totalSalidasValor.toLocaleString('es-CO')} COP
          </p>
        </div>

        {/* Saldo en Libros */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 p-4 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Saldo en Libros</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{metricas.saldoKg.toLocaleString()}</span>
            <span className="text-xs text-slate-400">Kg</span>
          </div>
          <p className="text-xs text-indigo-300/80 mt-1 font-mono">
            ${metricas.valorTotalSaldo.toLocaleString('es-CO')} COP
          </p>
        </div>

        {/* Costo Promedio Ponderado (CPP) */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/20 p-4 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">CPP Vigente (NIIF)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">${metricas.cppVigente.toLocaleString('es-CO')}</span>
            <span className="text-xs text-slate-400">/Kg</span>
          </div>
          <p className="text-xs text-purple-300/80 mt-1 font-mono">
            Promedio Ponderado Continuo
          </p>
        </div>
      </div>

      {/* ── 2. Barra de Filtros y Acciones de Exportación ── */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Búsqueda y Selectores */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por SKU, producto o documento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="TODOS">Todos los Movimientos</option>
              <option value="ENTRADA_COMPRA">📥 Entradas por Compra</option>
              <option value="SALIDA_VENTA_POS">🛒 Salidas POS</option>
              <option value="SALIDA_DESPACHO_B2B">🚚 Salidas B2B</option>
              <option value="SALIDA_MATERIA_PRIMA">🔪 Despiece (Salida MP)</option>
              <option value="ENTRADA_PRODUCTO_TERMINADO">🥩 Despiece (Entrada PT)</option>
              <option value="ENTRADA_TRASLADO">🔄 Entrada Traslado</option>
              <option value="SALIDA_TRASLADO">🔄 Salida Traslado</option>
              <option value="AJUSTE_MERMA">⚠️ Ajuste Merma</option>
              <option value="AJUSTE_INVENTARIO">📋 Ajuste Manual</option>
            </select>
          </div>

          {bodegas.length > 0 && (
            <div className="relative">
              <select
                value={selectedBodega}
                onChange={(e) => {
                  setSelectedBodega(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="TODAS">Todas las Bodegas</option>
                {bodegas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              title="Fecha Inicio"
            />
            <span className="text-slate-500 text-xs">-</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              title="Fecha Fin"
            />
          </div>
        </div>

        {/* Botones de Exportación */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={filteredMovements.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Exportar PDF
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredMovements.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── 3. Tabla de Datos de Alta Densidad ── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-3">Documento</th>
                <th className="py-3 px-3">SKU / Producto</th>
                <th className="py-3 px-3">Tipo Movimiento</th>
                <th className="py-3 px-3 text-right">Entrada</th>
                <th className="py-3 px-3 text-right">Salida</th>
                <th className="py-3 px-3 text-right">Costo Mov.</th>
                <th className="py-3 px-3 text-right bg-slate-950/40 text-cyan-400">Saldo Kg</th>
                <th className="py-3 px-3 text-right bg-slate-950/40 text-purple-400">CPP Vigente</th>
                <th className="py-3 px-4 text-right bg-slate-950/40 text-indigo-400">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                    No se encontraron movimientos de Kardex con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m) => {
                  const esEntrada =
                    m.tipo_movimiento.startsWith('ENTRADA') ||
                    m.tipo_movimiento === 'DEVOLUCION_CLIENTE';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-default font-mono"
                    >
                      <td className="py-2.5 px-4 font-sans text-slate-400 whitespace-nowrap">
                        {new Date(m.fecha).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-300">
                        {m.documento_referencia}
                      </td>

                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onSelectSku?.(m.sku)}
                          className="text-left group-hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-white block">{m.sku}</span>
                          <span className="text-[11px] font-sans text-slate-400 truncate max-w-[160px] block">
                            {m.nombre_producto}
                          </span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTipoBadge(
                            m.tipo_movimiento
                          )}`}
                        >
                          {m.tipo_movimiento.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {esEntrada ? `${m.cantidad_kg.toLocaleString()} kg` : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-blue-400 font-bold">
                        {!esEntrada ? `${m.cantidad_kg.toLocaleString()} kg` : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-300">
                        ${m.costo_unitario.toLocaleString('es-CO')}
                      </td>

                      <td className="py-2.5 px-3 text-right bg-slate-950/20 font-bold text-cyan-300">
                        {m.saldo_cantidad_kg.toLocaleString()} kg
                      </td>

                      <td className="py-2.5 px-3 text-right bg-slate-950/20 text-purple-300">
                        ${m.saldo_costo_promedio.toLocaleString('es-CO')}
                      </td>

                      <td className="py-2.5 px-4 text-right bg-slate-950/20 font-bold text-indigo-300">
                        ${m.saldo_valor_total.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-white/10 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Mostrando {Math.min(filteredMovements.length, (page - 1) * itemsPerPage + 1)} a{' '}
              {Math.min(filteredMovements.length, page * itemsPerPage)} de {filteredMovements.length} movimientos
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                Anterior
              </button>
              <span className="px-2 font-mono text-slate-200">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
