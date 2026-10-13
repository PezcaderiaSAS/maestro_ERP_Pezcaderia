import React, { useState } from 'react';
import { MermaDespieceSchema, type MermaDespieceDTO } from '../../../packages/validation-schemas/src/wms.schema';
import { AlertCircle, FileMinus, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function FormularioMermaDespiece() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MermaDespieceDTO>>({
    empresaId: '00000000-0000-0000-0000-000000000000',
    usuarioId: '00000000-0000-0000-0000-000000000000',
    productoId: '',
    bodegaId: '',
    cantidad: 0,
    referenciaDocumento: '',
    observacion: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof MermaDespieceDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = MermaDespieceSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3001/api/wms/merma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Error en el servidor');
      }

      Swal.fire({
        icon: 'success',
        title: 'Merma Registrada',
        text: 'La merma ha sido descontada del Kardex correctamente.',
        background: '#ffffff',
        color: '#0f172a',
        confirmButtonColor: '#4f46e5',
      });

      setFormData({
        empresaId: '00000000-0000-0000-0000-000000000000',
        usuarioId: '00000000-0000-0000-0000-000000000000',
        productoId: '',
        bodegaId: '',
        cantidad: 0,
        referenciaDocumento: '',
        observacion: '',
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error de Transacción',
        text: 'No se pudo registrar la merma.',
        background: '#ffffff',
        color: '#0f172a',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60" />

      <div className="relative z-10 flex items-center mb-8">
        <div className="p-3 bg-indigo-50 rounded-xl mr-4 border border-indigo-100">
          <FileMinus className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registro de Merma (Despiece)</h2>
          <p className="text-slate-500 text-sm mt-1">Aplica política FEFO automática si no se especifica Lote</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Producto */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Producto ID</label>
            <input
              type="text"
              value={formData.productoId || ''}
              onChange={(e) => handleChange('productoId', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
              placeholder="UUID del Producto"
            />
            {errors.productoId && (
              <p className="text-red-500 text-xs flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.productoId}
              </p>
            )}
          </div>

          {/* Bodega */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Bodega ID</label>
            <input
              type="text"
              value={formData.bodegaId || ''}
              onChange={(e) => handleChange('bodegaId', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
              placeholder="UUID de la Bodega"
            />
            {errors.bodegaId && (
              <p className="text-red-500 text-xs flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.bodegaId}
              </p>
            )}
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cantidad a mermar (Kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidad || ''}
              onChange={(e) => handleChange('cantidad', parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm font-mono"
              placeholder="Ej: 2.50"
            />
            {errors.cantidad && (
              <p className="text-red-500 text-xs flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.cantidad}
              </p>
            )}
          </div>

          {/* Referencia Documento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Orden de Producción (Opcional)</label>
            <input
              type="text"
              value={formData.referenciaDocumento || ''}
              onChange={(e) => handleChange('referenciaDocumento', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
              placeholder="Ej: OP-2023-001"
            />
          </div>
        </div>

        {/* Observación / Justificación */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Justificación Obligatoria</label>
          <textarea
            value={formData.observacion || ''}
            onChange={(e) => handleChange('observacion', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm min-h-[100px] resize-none"
            placeholder="Describe la razón técnica de la merma (Ej: Limpieza de escamas y vísceras)"
          />
          {errors.observacion && (
            <p className="text-red-500 text-xs flex items-center mt-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.observacion}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Procesar Merma
          </button>
        </div>
      </form>
    </div>
  );
}
