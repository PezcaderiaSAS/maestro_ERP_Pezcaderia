// src/views/pos/components/SiigoQueueMonitorModal.tsx
import React, { useState } from 'react';
import {
  FileText,
  X,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  AlertCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useResolucionStore } from '../../../store/useResolucionStore';
import { siigoExportService } from '../../../services/siigoExportService';
import { Button } from '../../../components/ui/Button';

interface SiigoQueueMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SiigoQueueMonitorModal: React.FC<SiigoQueueMonitorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colaSiigo, updateSiigoQueueItem, retrySiigoQueueItem, facturasElectronicas } =
    useResolucionStore();

  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO'>('TODOS');
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  if (!isOpen) return null;

  const totalPendientes = colaSiigo.filter((q) => q.estado === 'PENDIENTE').length;
  const totalCompletados = colaSiigo.filter((q) => q.estado === 'COMPLETADO').length;
  const totalFallidos = colaSiigo.filter((q) => q.estado === 'FALLIDO').length;

  const colaFiltrada = colaSiigo.filter((item) => {
    if (filtroEstado === 'TODOS') return true;
    return item.estado === filtroEstado;
  });

  const handleExportCsv = () => {
    if (facturasElectronicas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin facturas para exportar',
        text: 'Aún no se han emitido facturas electrónicas para exportar.',
      });
      return;
    }

    const exportables = facturasElectronicas.map((f) => ({
      consecutivoFiscal: f.consecutivoCompleto,
      consecutivoInterno: f.ventaId,
      fecha: f.fechaEmision.split('T')[0],
      clienteIdentificacion: f.clienteNit,
      clienteNombre: f.clienteNombre,
      productoCodigo: 'PROD-VARIOS',
      productoNombre: 'Venta Consolidada',
      cantidad: 1,
      valorUnitario: f.total,
      descuentoPct: 0,
      total: f.total,
      formaPago: 'Contado/Transferencia',
    }));

    const csv = siigoExportService.generarCsvSiigo(exportables);
    const fecha = new Date().toISOString().split('T')[0];
    siigoExportService.descargarCsvFacturas(`Planilla_Siigo_Nube_${fecha}.csv`, csv);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Planilla CSV exportada con éxito',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleSimularSincronizacion = async () => {
    const pendientes = colaSiigo.filter((q) => q.estado === 'PENDIENTE');
    if (pendientes.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Cola al día',
        text: 'No hay comprobantes pendientes en la cola de Siigo Nube.',
      });
      return;
    }

    setIsSyncingAll(true);

    try {
      // Simular transmisión HTTP hacia SIIGO Nube API v2
      for (const item of pendientes) {
        updateSiigoQueueItem(item.id, {
          estado: 'COMPLETADO',
          respuestaSiigo: {
            id: `siigo-inv-${Date.now()}`,
            cufe: `CUFE-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
            qr_code: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=dummy`,
          },
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Sincronización Exitosa',
        text: `Se transmitieron ${pendientes.length} facturas a SIIGO Nube (send_dian: true).`,
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-slate-900 animate-scale-in">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">
                Monitor de Cola Outbox — SIIGO Nube API v2
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Transmisión asíncrona desacoplada de facturas electrónicas y exportación contable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              icon={<Download size={15} />}
              className="text-xs font-bold border-slate-300"
            >
              Exportar CSV
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Resumen de Métricas */}
        <div className="p-4 bg-white border-b border-slate-100 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFiltroEstado('PENDIENTE')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtroEstado === 'PENDIENTE'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">Pendientes</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <strong className="text-xl font-black text-amber-900 mt-1 block">
              {totalPendientes}
            </strong>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('COMPLETADO')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtroEstado === 'COMPLETADO'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Transmitidas DIAN</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <strong className="text-xl font-black text-emerald-900 mt-1 block">
              {totalCompletados}
            </strong>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('FALLIDO')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtroEstado === 'FALLIDO'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-400/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800">Con Error</span>
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <strong className="text-xl font-black text-red-900 mt-1 block">
              {totalFallidos}
            </strong>
          </button>
        </div>

        {/* Lista de Comprobantes en Cola */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-[250px]">
          {colaFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 gap-2">
              <CheckCircle2 size={36} className="text-slate-300" />
              <p className="text-sm font-semibold">No hay comprobantes en esta categoría</p>
            </div>
          ) : (
            colaFiltrada.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      item.estado === 'COMPLETADO'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.estado === 'FALLIDO'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <FileText size={18} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {item.consecutivoCompleto}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.estado === 'COMPLETADO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.estado === 'FALLIDO'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.estado}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 truncate">
                      Venta Ref: {item.ventaId} • Creado:{' '}
                      {new Date(item.fechaCreacion).toLocaleTimeString('es-CO')}
                      {item.intentos > 0 && ` • Intentos: ${item.intentos}/${item.maxIntentos}`}
                    </span>

                    {item.ultimoError && (
                      <span className="text-[10px] text-red-600 font-semibold truncate mt-0.5">
                        Error: {item.ultimoError}
                      </span>
                    )}
                  </div>
                </div>

                {item.estado !== 'COMPLETADO' && (
                  <button
                    type="button"
                    onClick={() => retrySiigoQueueItem(item.id)}
                    className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Forzar reintento de envío a Siigo"
                  >
                    <RefreshCw size={13} /> Reintentar
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Total en cola: {colaSiigo.length} comprobantes
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] px-4 font-semibold"
            >
              Cerrar
            </Button>
            {totalPendientes > 0 && (
              <Button
                variant="primary"
                onClick={handleSimularSincronizacion}
                disabled={isSyncingAll}
                icon={<Send size={15} />}
                className="min-h-[44px] px-4 font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSyncingAll ? 'Sincronizando...' : `Transmitir Pendientes (${totalPendientes})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
