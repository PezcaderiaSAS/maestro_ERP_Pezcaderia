// src/views/settings/ResolucionesConfigView.tsx
import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  Layers,
  Calendar,
  Hash,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  useResolucionStore,
  calcularDiagnosticoResolucion,
} from '../../store/useResolucionStore';
import { resolucionService } from '../../services/resolucionService';
import type {
  ResolucionVenta,
  TipoResolucion,
} from '../../types/resoluciones.types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ResolucionesConfigViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ResolucionesConfigView: React.FC<ResolucionesConfigViewProps> = ({
  onClose,
  isModal = false,
}) => {
  const {
    resoluciones,
    addResolucion,
    updateResolucion,
    deleteResolucion,
    setPredeterminada,
    setUltimoConsecutivoSiigo,
    colaSiigo,
  } = useResolucionStore();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingResolucion, setEditingResolucion] = useState<ResolucionVenta | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'FACTURA_ELECTRONICA_DIAN' as TipoResolucion,
    prefijo: '',
    numeroResolucion: '',
    fechaExpedicion: '',
    fechaVencimiento: '',
    rangoDesde: 1,
    rangoHasta: 50000,
    consecutivoActual: 0,
    siigoDocumentId: 2458,
    claveTecnica: '',
    esPredeterminada: false,
    activa: true,
  });

  const handleOpenCreate = () => {
    setEditingResolucion(null);
    setFormData({
      nombre: '',
      tipo: 'FACTURA_ELECTRONICA_DIAN',
      prefijo: '',
      numeroResolucion: '',
      fechaExpedicion: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      rangoDesde: 1,
      rangoHasta: 50000,
      consecutivoActual: 0,
      siigoDocumentId: 2458,
      claveTecnica: '',
      esPredeterminada: false,
      activa: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (res: ResolucionVenta) => {
    setEditingResolucion(res);
    setFormData({
      nombre: res.nombre,
      tipo: res.tipo,
      prefijo: res.prefijo,
      numeroResolucion: res.numeroResolucion || '',
      fechaExpedicion: res.fechaExpedicion || '',
      fechaVencimiento: res.fechaVencimiento || '',
      rangoDesde: res.rangoDesde,
      rangoHasta: res.rangoHasta,
      consecutivoActual: res.consecutivoActual,
      siigoDocumentId: res.siigoDocumentId || 2458,
      claveTecnica: res.claveTecnica || '',
      esPredeterminada: res.esPredeterminada,
      activa: res.activa,
    });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.prefijo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor ingrese el nombre y el prefijo de la resolución.',
      });
      return;
    }

    if (formData.rangoHasta <= formData.rangoDesde) {
      Swal.fire({
        icon: 'warning',
        title: 'Rango inválido',
        text: 'El rango final debe ser estrictamente mayor al rango inicial.',
      });
      return;
    }

    if (editingResolucion) {
      updateResolucion(editingResolucion.id, formData);
      Swal.fire({
        icon: 'success',
        title: 'Resolución actualizada',
        text: `La resolución "${formData.nombre}" ha sido guardada exitosamente.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      addResolucion({
        ...formData,
        alertaUmbralConsecutivos: 100,
        alertaUmbralDias: 30,
      });
      Swal.fire({
        icon: 'success',
        title: 'Resolución creada',
        text: `Nueva resolución "${formData.nombre}" creada y lista para operar.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleSincronizarSiigoClick = async (res: ResolucionVenta) => {
    const { value: nuevoNumeroStr, isConfirmed } = await Swal.fire({
      title: 'Empate de Consecutivo Siigo Nube',
      text: `Resolución: ${res.prefijo} (${res.nombre}). Ingrese el último número consecutivo emitido en Siigo Nube:`,
      input: 'number',
      inputValue: String(res.consecutivoActual),
      inputAttributes: {
        min: String(res.rangoDesde),
        max: String(res.rangoHasta),
      },
      showCancelButton: true,
      confirmButtonText: 'Sincronizar Consecutivo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0284c7',
    });

    if (isConfirmed && nuevoNumeroStr) {
      const nuevoNumero = parseInt(nuevoNumeroStr, 10);
      if (isNaN(nuevoNumero) || nuevoNumero < res.rangoDesde || nuevoNumero > res.rangoHasta) {
        Swal.fire({
          icon: 'error',
          title: 'Número fuera de rango',
          text: `El número debe estar entre ${res.rangoDesde} y ${res.rangoHasta}.`,
        });
        return;
      }

      setUltimoConsecutivoSiigo(res.id, nuevoNumero);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Consecutivo actualizado: ${res.prefijo}-${nuevoNumero}`,
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleDeleteClick = (res: ResolucionVenta) => {
    if (res.esPredeterminada) {
      Swal.fire({
        icon: 'warning',
        title: 'Resolución Predeterminada',
        text: 'No puedes eliminar la resolución predeterminada. Asigna otra antes de eliminar.',
      });
      return;
    }

    Swal.fire({
      title: '¿Eliminar resolución?',
      text: `Se eliminará la resolución ${res.prefijo} - ${res.nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteResolucion(res.id);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Resolución eliminada',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <div
      className={`resoluciones-config-module flex flex-col gap-6 text-slate-900 ${
        isModal ? 'p-6 max-h-[85vh] overflow-y-auto' : 'p-6 max-w-7xl mx-auto'
      }`}
    >
      {/* ── Cabecera Principal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Resoluciones de Venta y Facturación DIAN
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Control Operativo Interno 100% y Facturación Electrónica oficial para SIIGO Nube API v2
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={20} />
            </button>
          )}
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            icon={<Plus size={18} />}
            className="min-h-[48px] h-12 px-4 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Nueva Resolución
          </Button>
        </div>
      </div>

      {/* ── Banner de Arquitectura de Consecutivo Dual ── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">
              Arquitectura de Consecutivo Dual (Control Interno vs Fiscal DIAN)
            </h3>
            <p className="text-xs text-blue-800/90 leading-relaxed mt-0.5">
              Cada venta genera obligatoriamente un <strong>Consecutivo Interno (ej. VTA-101)</strong> para
              auditoría, kardex y caja. Si la venta requiere Facturación Electrónica, se asigna en paralelo el{' '}
              <strong>Consecutivo Fiscal DIAN (ej. FEVP-1541)</strong> y se encola hacia SIIGO Nube sin congelar el POS.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700">
            En Cola Siigo: {colaSiigo.filter((q) => q.estado === 'PENDIENTE').length} pendientes
          </span>
        </div>
      </div>

      {/* ── Listado de Tarjetas de Resoluciones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {resoluciones.map((res) => {
          const diag = calcularDiagnosticoResolucion(res);
          const isDian = res.tipo === 'FACTURA_ELECTRONICA_DIAN';

          return (
            <Card
              key={res.id}
              glass
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                res.activa
                  ? res.esPredeterminada
                    ? 'border-blue-400 bg-white ring-2 ring-blue-500/10 shadow-sm'
                    : 'border-slate-200 bg-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50/60 opacity-75'
              }`}
            >
              <div>
                {/* Cabecera Tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono font-black text-base px-2.5 py-1 rounded-lg border ${
                        isDian
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {res.prefijo}
                    </span>
                    <h2 className="font-extrabold text-base text-slate-900">{res.nombre}</h2>
                    {res.esPredeterminada && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Star size={11} className="fill-amber-500 text-amber-500" /> Predeterminada
                      </span>
                    )}
                  </div>

                  {/* Estado Semáforo */}
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${
                      diag.estadoSemaforo === 'OPTIMO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : diag.estadoSemaforo === 'PRECAUCION'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {diag.estadoSemaforo === 'OPTIMO'
                      ? '✓ ÓPTIMO'
                      : diag.estadoSemaforo === 'PRECAUCION'
                      ? '⚠️ PRECAUCIÓN'
                      : '⛔ CRÍTICO'}
                  </span>
                </div>

                {/* Subtítulo / Metadatos */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="font-semibold text-slate-700">
                    Tipo:{' '}
                    {res.tipo === 'CONTROL_INTERNO'
                      ? 'Control Interno Operativo'
                      : res.tipo === 'FACTURA_ELECTRONICA_DIAN'
                      ? 'Facturación Electrónica DIAN'
                      : 'POS No Electrónico'}
                  </span>
                  {res.numeroResolucion && (
                    <span>• Res. DIAN: <strong>{res.numeroResolucion}</strong></span>
                  )}
                  {res.siigoDocumentId && (
                    <span>• Siigo Doc ID: <strong>{res.siigoDocumentId}</strong></span>
                  )}
                </div>

                {/* Barra de Consumo de Rango */}
                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <Hash size={13} className="text-slate-400" />
                      Consecutivo Actual: <strong className="font-mono text-slate-900 text-sm">{res.prefijo}-{res.consecutivoActual}</strong>
                    </span>
                    <span className="text-slate-500 font-medium">
                      Rango: {res.rangoDesde} al {res.rangoHasta}
                    </span>
                  </div>

                  {/* Barra de progreso visual */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        diag.porcentajeConsumido > 95
                          ? 'bg-red-500'
                          : diag.porcentajeConsumido > 80
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${diag.porcentajeConsumido}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Consumido: {diag.porcentajeConsumido}%</span>
                    <span className="font-bold text-slate-700">
                      Disponibles: {diag.consecutivosRestantes.toLocaleString('es-CO')} números
                    </span>
                  </div>
                </div>

                {/* Vigencia y Alertas */}
                {res.fechaVencimiento && (
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      Vence: {res.fechaVencimiento}
                    </span>
                    {diag.diasVigenciaRestantes !== undefined && (
                      <span
                        className={`font-semibold ${
                          diag.diasVigenciaRestantes <= 0
                            ? 'text-red-600 font-bold'
                            : diag.diasVigenciaRestantes <= res.alertaUmbralDias
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        {diag.diasVigenciaRestantes <= 0
                          ? '⛔ Resolución Vencida'
                          : `Quedan ${diag.diasVigenciaRestantes} días`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de Acción de la Tarjeta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {isDian && (
                    <button
                      type="button"
                      onClick={() => handleSincronizarSiigoClick(res)}
                      className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      title="Sincronizar con el consecutivo que ya lleva Siigo Nube"
                    >
                      <RefreshCw size={13} /> Sincronizar Siigo
                    </button>
                  )}

                  {!res.esPredeterminada && (
                    <button
                      type="button"
                      onClick={() => setPredeterminada(res.id, res.tipo)}
                      className="min-h-[44px] px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      title="Establecer como resolución por defecto para este tipo"
                    >
                      <Star size={13} /> Hacer Predeterminada
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(res)}
                    className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    title="Editar resolución"
                  >
                    <Edit2 size={16} />
                  </button>

                  {!res.esPredeterminada && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(res)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Eliminar resolución"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Modal Formulario Crear / Editar ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingResolucion ? 'Editar Resolución' : 'Nueva Resolución de Venta'}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Facturación Electrónica Principal"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Resolución</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoResolucion })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="FACTURA_ELECTRONICA_DIAN">Factura Electrónica DIAN</option>
                    <option value="CONTROL_INTERNO">Control Interno Operativo</option>
                    <option value="POS_NO_ELECTRONICO">POS No Electrónico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prefijo Oficial</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="Ej: FEVP"
                    value={formData.prefijo}
                    onChange={(e) => setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {formData.tipo === 'FACTURA_ELECTRONICA_DIAN' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Número Resolución DIAN</label>
                      <input
                        type="text"
                        placeholder="Ej: 18764000001234"
                        value={formData.numeroResolucion}
                        onChange={(e) => setFormData({ ...formData, numeroResolucion: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ID Documento Siigo</label>
                      <input
                        type="number"
                        placeholder="Ej: 2458"
                        value={formData.siigoDocumentId}
                        onChange={(e) => setFormData({ ...formData, siigoDocumentId: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Expedición</label>
                      <input
                        type="date"
                        value={formData.fechaExpedicion}
                        onChange={(e) => setFormData({ ...formData, fechaExpedicion: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Vencimiento</label>
                      <input
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rango Desde</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.rangoDesde}
                    onChange={(e) => setFormData({ ...formData, rangoDesde: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rango Hasta</label>
                  <input
                    type="number"
                    value={formData.rangoHasta}
                    onChange={(e) => setFormData({ ...formData, rangoHasta: parseInt(e.target.value, 10) || 1000 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Último Emitido (Siigo)</label>
                  <input
                    type="number"
                    value={formData.consecutivoActual}
                    onChange={(e) => setFormData({ ...formData, consecutivoActual: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-blue-300 bg-blue-50/50 rounded-xl focus:border-blue-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.esPredeterminada}
                    onChange={(e) => setFormData({ ...formData, esPredeterminada: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  Predeterminada para este tipo
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  Resolución Activa
                </label>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="min-h-[44px] px-4 font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="min-h-[48px] h-12 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  Guardar Resolución
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolucionesConfigView;
