import React, { useState } from 'react';
import { UserPlus, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { useSupplierStore, Proveedor } from '../../../store/useSupplierStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: (supplierId: string) => void;
}

export function CrearProveedorRapidoModal({ isOpen, onClose, onSupplierCreated }: Props) {
  const addProveedor = useSupplierStore((s) => s.addProveedor);

  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    tipoIdentificacion: 'NIT' as 'NIT' | 'CC',
    telefono: '',
    email: '',
    ciudad: 'Bogotá',
    direccion: '',
    plazoPagoDias: 0
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.nit.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre y el NIT/Documento son obligatorios.'
      });
      return;
    }

    const newId = `prov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newProveedor: Proveedor = {
      id: newId,
      nombre: form.nombre.trim(),
      nit: form.nit.trim(),
      tipoIdentificacion: form.tipoIdentificacion,
      direccion: form.direccion.trim() || 'Principal',
      telefono: form.telefono.trim() || 'N/A',
      email: form.email.trim() || '',
      ciudad: form.ciudad.trim() || 'Bogotá',
      plazoPagoDias: Number(form.plazoPagoDias) || 0,
      activo: true
    };

    addProveedor(newProveedor);

    Swal.fire({
      icon: 'success',
      title: '¡Proveedor Creado!',
      text: `${newProveedor.nombre} fue registrado y seleccionado correctamente.`,
      timer: 1800,
      showConfirmButton: false
    });

    onSupplierCreated(newId);
    onClose();

    // Reset
    setForm({
      nombre: '',
      nit: '',
      tipoIdentificacion: 'NIT',
      telefono: '',
      email: '',
      ciudad: 'Bogotá',
      direccion: '',
      plazoPagoDias: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Cabecera Modal */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white m-0">Creación Rápida de Proveedor</h3>
              <p className="text-xs text-slate-400 m-0">Registra un nuevo proveedor sin salir de la orden de compra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo Doc. *</label>
              <select
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                value={form.tipoIdentificacion}
                onChange={e => setForm({ ...form, tipoIdentificacion: e.target.value as any })}
              >
                <option value="NIT">NIT</option>
                <option value="CC">Cédula (CC)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NIT / Cédula *</label>
              <input
                type="text"
                required
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. 900.123.456-7"
                value={form.nit}
                onChange={e => setForm({ ...form, nit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social / Nombre Completo *</label>
            <input
              type="text"
              required
              className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej. Distribuidora del Pacífico S.A.S."
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono / Celular</label>
              <input
                type="text"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
                placeholder="Ej. 310 123 4567"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm text-slate-800"
                placeholder="compras@proveedor.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ciudad</label>
              <input
                type="text"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm text-slate-800"
                placeholder="Bogotá"
                value={form.ciudad}
                onChange={e => setForm({ ...form, ciudad: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plazo de Pago (Días)</label>
              <input
                type="number"
                min="0"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Ej. 30"
                value={form.plazoPagoDias}
                onChange={e => setForm({ ...form, plazoPagoDias: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Save size={16} />
              <span>Guardar y Seleccionar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
