import React, { useState, useEffect } from 'react';
import {
  Anchor,
  Truck,
  PlusCircle,
  History,
  FileText,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  Scale,
  Search,
  CheckCircle2,
  PackageCheck,
  Thermometer,
  Eye,
  X
} from 'lucide-react';
import { DockReceivingWizard } from './components/DockReceivingWizard';
import { ThermalTrafficLightBadge } from './components/ThermalTrafficLightBadge';
import {
  dockPurchasesReceivingService,
  RecepcionMuelleRegistro
} from '../../services/dockPurchasesReceivingService';

export const PurchasesReceivingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial'>('nueva');
  const [historial, setHistorial] = useState<RecepcionMuelleRegistro[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecepcion, setSelectedRecepcion] = useState<RecepcionMuelleRegistro | null>(null);

  const cargarHistorial = () => {
    const list = dockPurchasesReceivingService.obtenerHistorialRecepciones();
    setHistorial(list);
  };

  useEffect(() => {
    cargarHistorial();
  }, [activeTab]);

  // Filtrado de historial por búsqueda
  const historialFiltrado = historial.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.consecutivoMuelle.toLowerCase().includes(term) ||
      item.proveedorNombre.toLowerCase().includes(term) ||
      item.placaVehiculo.toLowerCase().includes(term)
    );
  });

  // Métricas consolidables
  const totalKilosNetosAcumulado = historial.reduce((acc, curr) => acc + curr.totalKilosNetos, 0);
  const totalCOPContado = historial
    .filter((r) => r.formaPago.startsWith('CONTADO'))
    .reduce((acc, curr) => acc + curr.totalCompraCOP, 0);
  const totalCOPCredito = historial
    .filter((r) => r.formaPago.startsWith('CREDITO'))
    .reduce((acc, curr) => acc + curr.totalCompraCOP, 0);

  return (
    <div data-testid="purchases-receiving-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. HEADER EJECUTIVO DE MUELLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-sm">
            <Anchor size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                WMS & Operaciones Muelle
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Compras y Recepción en Muelle
            </h1>
            <p className="text-sm text-slate-500">
              Pesaje metrológico con deducción de hielo, inocuidad HACCP y trazabilidad de lotes FEFO
            </p>
          </div>
        </div>

        {/* KPIs Rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Furgones Recibidos</span>
            <span className="font-mono text-xl font-black text-slate-900">{historial.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">Kilos Netos</span>
            <span className="font-mono text-xl font-black text-emerald-950">
              {totalKilosNetosAcumulado.toFixed(1)} <span className="text-xs">kg</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-blue-800 uppercase block">Total Compras</span>
            <span className="font-mono text-lg font-black text-blue-950">
              ${(totalCOPContado + totalCOPCredito).toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES TÁCTILES >= 48px */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          data-testid="tab-nueva-recepcion"
          onClick={() => setActiveTab('nueva')}
          className={`min-h-[48px] px-6 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
            activeTab === 'nueva'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <PlusCircle size={20} />
          <span>1. Nueva Recepción en Muelle</span>
        </button>

        <button
          type="button"
          data-testid="tab-historial-furgones"
          onClick={() => {
            setActiveTab('historial');
            cargarHistorial();
          }}
          className={`min-h-[48px] px-6 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
            activeTab === 'historial'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <History size={20} />
          <span>2. Historial de Furgones Recibidos ({historial.length})</span>
        </button>
      </div>

      {/* 3. CONTENIDO DE LA PESTAÑA */}
      {activeTab === 'nueva' ? (
        <DockReceivingWizard
          onFinished={() => {
            cargarHistorial();
          }}
        />
      ) : (
        <div data-testid="panel-historial-recepciones" className="space-y-4">
          {/* Barra de Filtros */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                data-testid="input-search-dock-history"
                placeholder="Buscar por placa, consecutivo o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[48px] pl-10 pr-4 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden"
              />
            </div>

            <button
              type="button"
              data-testid="btn-refresh-history"
              onClick={cargarHistorial}
              className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Actualizar Lista</span>
            </button>
          </div>

          {/* Tabla de Historial */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {historialFiltrado.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Truck size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-base text-slate-600">No se encontraron recepciones de muelle</p>
                <p className="text-sm mt-1">Inicie una nueva recepción desde la pestaña superior</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" data-testid="table-historial-furgones">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                      <th className="py-3 px-4">Consecutivo</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Proveedor / Barco</th>
                      <th className="py-3 px-4">Furgón / Chofer</th>
                      <th className="py-3 px-4 text-center">Temp. Cava</th>
                      <th className="py-3 px-4 text-right">Kilos Netos</th>
                      <th className="py-3 px-4 text-right">Total COP</th>
                      <th className="py-3 px-4 text-center">Forma Pago</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                    {historialFiltrado.map((item) => (
                      <tr key={item.consecutivoMuelle} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                            {item.consecutivoMuelle}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                          {item.createdAt.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.proveedorNombre}</span>
                          <span className="text-xs text-slate-500 font-mono">NIT: {item.proveedorNit}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800 block">{item.placaVehiculo}</span>
                          <span className="text-xs text-slate-500">{item.conductorNombre || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full border ${
                              item.temperaturaCava <= 4.0
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : item.temperaturaCava <= 7.0
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {item.temperaturaCava}°C
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900">
                          {item.totalKilosNetos.toFixed(2)} kg
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                          ${item.totalCompraCOP.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-md ${
                              item.formaPago.startsWith('CREDITO')
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {item.formaPago}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            data-testid={`btn-view-detail-${item.consecutivoMuelle}`}
                            onClick={() => setSelectedRecepcion(item)}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                            title="Ver detalle del acta y lotes FEFO"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL DETALLE DE RECEPCIÓN & ACTA */}
      {selectedRecepcion && (
        <div
          data-testid="modal-detail-dock-receiving"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Acta de Muelle: {selectedRecepcion.consecutivoMuelle}
                  </h3>
                  <p className="text-xs text-slate-500">Detalle de inspección física y lotes FEFO ingresados</p>
                </div>
              </div>

              <button
                type="button"
                data-testid="btn-close-detail-modal"
                onClick={() => setSelectedRecepcion(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Cabecera del Acta */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Proveedor:</span>
                <span className="font-bold text-slate-900">{selectedRecepcion.proveedorNombre}</span>
                <span className="text-xs text-slate-500 block">NIT: {selectedRecepcion.proveedorNit}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Furgón / Conductor:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRecepcion.placaVehiculo}</span>
                <span className="text-xs text-slate-600 block">{selectedRecepcion.conductorNombre}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Total Kilos Netos:</span>
                <span className="font-mono font-extrabold text-emerald-800 text-base">
                  {selectedRecepcion.totalKilosNetos.toFixed(2)} kg
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Total Liquidado COP:</span>
                <span className="font-mono font-black text-slate-900 text-base">
                  ${selectedRecepcion.totalCompraCOP.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Lista de Lotes FEFO */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-2">
                <PackageCheck size={18} className="text-blue-700" />
                <span>Lotes FEFO Trazables Generados</span>
              </h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                {selectedRecepcion.lotesGenerados.map((lote) => (
                  <div key={lote.loteId} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{lote.productoNombre}</span>
                      <span className="block font-mono text-xs text-blue-700 font-bold">{lote.codigoLote}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">{lote.pesoNetoKg.toFixed(2)} kg</span>
                      <span className="block text-xs text-slate-500">Vence: {lote.fechaVencimiento}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Pie de Modal */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                data-testid="btn-print-acta-from-modal"
                onClick={() => window.print()}
                className="min-h-[48px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 active:scale-95"
              >
                <Printer size={18} />
                <span>Imprimir Acta</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecepcion(null)}
                className="min-h-[48px] px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
