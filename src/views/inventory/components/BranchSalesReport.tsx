// src/views/inventory/components/BranchSalesReport.tsx

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Scale,
  Package,
  Receipt,
  TrendingUp,
  Download,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import {
  generarReporteVentasPorSucursal,
  exportarReporteSucursalCsv,
  exportarReporteSucursalPdf,
} from '../../../services/branchReportsService';
import type { BranchSalesSummary } from '../../../../packages/validation-schemas/src/branchInventory.schema';
import { useWarehouseStore } from '../../../store/useWarehouseStore';

export const BranchSalesReport: React.FC = () => {
  const bodegas = useWarehouseStore((s) => s.bodegas);

  // Fechas por defecto: hoy
  const hoyIso = new Date().toISOString().slice(0, 10);
  const [fechaInicio, setFechaInicio] = useState<string>(hoyIso);
  const [fechaFin, setFechaFin] = useState<string>(hoyIso);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('TODAS');
  const [selectedMetodo, setSelectedMetodo] = useState<any>('TODOS');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Calcular reporte reactivo
  const reporteResult = useMemo(() => {
    return generarReporteVentasPorSucursal({
      sucursalId: selectedSucursal,
      fechaInicio,
      fechaFin,
      metodoPago: selectedMetodo,
      agrupacion: 'DIA',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSucursal, fechaInicio, fechaFin, selectedMetodo, refreshTrigger]);

  const summaries: BranchSalesSummary[] = reporteResult.data || [];

  // Totales consolidados para las tarjetas superiores
  const totalesGlobales = useMemo(() => {
    return summaries.reduce(
      (acc, s) => {
        acc.totalVentasCOP += s.totalVentasCOP;
        acc.totalKilos += s.totalKilos;
        acc.totalUnidades += s.totalUnidades;
        acc.ticketsCount += s.ticketsCount;
        return acc;
      },
      { totalVentasCOP: 0, totalKilos: 0, totalUnidades: 0, ticketsCount: 0 }
    );
  }, [summaries]);

  const ticketPromedioGlobal =
    totalesGlobales.ticketsCount > 0
      ? Math.round(totalesGlobales.totalVentasCOP / totalesGlobales.ticketsCount)
      : 0;

  // Manejo de exportación a CSV
  const handleExportCsv = () => {
    if (summaries.length === 0) return;
    const csvContent = exportarReporteSucursalCsv(summaries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_ventas_sucursal_${fechaInicio}_al_${fechaFin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Manejo de exportación a PDF
  const handleExportPdf = (summary: BranchSalesSummary) => {
    const doc = exportarReporteSucursalPdf(summary);
    doc.save(`reporte_oficial_${summary.sucursalId}_${fechaInicio}_al_${fechaFin}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* ── Barra Superior de Filtros y Acciones ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            {/* Selector de Sucursal */}
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                className="h-11 px-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-[200px]"
              >
                <option value="TODAS">🏢 Todas las Sucursales (Consolidado)</option>
                {bodegas
                  .filter((b) => b.activa)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.esPuntoVenta ? '🏪 ' : '📦 '}
                      {b.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Rango de Fechas */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="h-11 px-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-slate-400 text-xs font-bold">a</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="h-11 px-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedMetodo}
                onChange={(e) => setSelectedMetodo(e.target.value)}
                className="h-11 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODOS">Todos los Métodos</option>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="NEQUI">📱 Nequi</option>
                <option value="TARJETA">💳 Tarjeta</option>
                <option value="TRANSFERENCIA">🏦 Transferencia</option>
                <option value="CREDITO">📝 Crédito</option>
              </select>
            </div>
          </div>

          {/* Botones de Exportación y Refresco */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="h-11 px-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
              title="Refrescar datos"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={summaries.length === 0}
              className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tarjetas KPI Consolidadas (Light Mode WCAG AA+) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ventas Totales (COP)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              ${totalesGlobales.totalVentasCOP.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Ingresos brutos mostrador
            </p>
          </div>
        </div>

        {/* Kilos Vendidos */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volumen Granel (Kg)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {totalesGlobales.totalKilos.toLocaleString('es-CO')} <span className="text-sm font-normal text-slate-500">kg</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Productos pesables despachados
            </p>
          </div>
        </div>

        {/* Unidades Vendidas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Unidades (Empaque)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {totalesGlobales.totalUnidades.toLocaleString('es-CO')} <span className="text-sm font-normal text-slate-500">und</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Productos empacados o procesados
            </p>
          </div>
        </div>

        {/* Tickets y Promedio */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tickets & Ticket Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {totalesGlobales.ticketsCount} <span className="text-xs font-semibold text-slate-500">tickets</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-semibold">
              Promedio: ${ticketPromedioGlobal.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabla de Resumen por Sucursal ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" />
            Desglose Operativo y Financiero por Punto de Venta
          </h3>
          <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            {summaries.length} {summaries.length === 1 ? 'sucursal' : 'sucursales'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Punto de Venta</th>
                <th className="py-3.5 px-4 text-right">Total Facturado (COP)</th>
                <th className="py-3.5 px-4 text-right">Volumen Kg</th>
                <th className="py-3.5 px-4 text-right">Unidades</th>
                <th className="py-3.5 px-4 text-center">Tickets</th>
                <th className="py-3.5 px-4 text-right">Ticket Prom.</th>
                <th className="py-3.5 px-4">Medios de Pago Principales</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    No se registraron ventas en el periodo o sucursal seleccionada.
                  </td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr key={s.sucursalId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <div>{s.sucursalNombre}</div>
                          <div className="text-xs font-mono text-slate-400">{s.sucursalId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-900 text-base">
                      ${s.totalVentasCOP.toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-700">
                      {s.totalKilos.toLocaleString('es-CO')} kg
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-700">
                      {s.totalUnidades.toLocaleString('es-CO')} und
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {s.ticketsCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-600">
                      ${s.ticketPromedioCOP.toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {s.desgloseMediosPago.EFECTIVO > 0 && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                            <Banknote className="w-3 h-3" /> ${s.desgloseMediosPago.EFECTIVO.toLocaleString('es-CO')}
                          </span>
                        )}
                        {(s.desgloseMediosPago.NEQUI > 0 || s.desgloseMediosPago.TRANSFERENCIA > 0) && (
                          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-semibold border border-sky-200">
                            <Smartphone className="w-3 h-3" /> ${(
                              (s.desgloseMediosPago.NEQUI || 0) + (s.desgloseMediosPago.TRANSFERENCIA || 0)
                            ).toLocaleString('es-CO')}
                          </span>
                        )}
                        {s.desgloseMediosPago.TARJETA > 0 && (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                            <CreditCard className="w-3 h-3" /> ${s.desgloseMediosPago.TARJETA.toLocaleString('es-CO')}
                          </span>
                        )}
                        {s.desgloseMediosPago.CREDITO > 0 && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                            Crédito: ${s.desgloseMediosPago.CREDITO.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleExportPdf(s)}
                        className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Descargar PDF Oficial de esta Sucursal"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchSalesReport;
