import React, { useState } from 'react';
import { UserPlus, X, Save, Building2, Phone, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { useSupplierStore, Proveedor } from '../../../store/useSupplierStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: (supplierId: string) => void;
}

const PRESETS_CREDITO = [
  { dias: 0, label: 'Contado (0 días)' },
  { dias: 8, label: '8 días' },
  { dias: 15, label: '15 días' },
  { dias: 30, label: '30 días' }
];

export const QuickSupplierModal: React.FC<Props> = ({ isOpen, onClose, onSupplierCreated }) => {
  const addProveedor = useSupplierStore((s) => s.addProveedor);

  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    tipoIdentificacion: 'NIT' as 'NIT' | 'CC',
    telefono: '',
    email: '',
    ciudad: 'Buenaventura',
    direccion: 'Muelle Principal',
    plazoPagoDias: 15
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.nit.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Obligatorios',
        text: 'La Razón Social y el NIT o Cédula son obligatorios.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const newId = `prov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newProveedor: Proveedor = {
      id: newId,
      nombre: form.nombre.trim(),
      nit: form.nit.trim(),
      tipoIdentificacion: form.tipoIdentificacion,
      direccion: form.direccion.trim() || 'Muelle Principal',
      telefono: form.telefono.trim() || 'N/A',
      email: form.email.trim() || '',
      ciudad: form.ciudad.trim() || 'Costa',
      plazoPagoDias: Number(form.plazoPagoDias) || 0,
      activo: true
    };

    addProveedor(newProveedor);

    Swal.fire({
      icon: 'success',
      title: '¡Proveedor Registrado!',
      text: `${newProveedor.nombre} fue creado y seleccionado para la recepción.`,
      timer: 1600,
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
      ciudad: 'Buenaventura',
      direccion: 'Muelle Principal',
      plazoPagoDias: 15
    });
  };

  return (
    <div
      data-testid="quick-supplier-modal"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs isolate z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white m-0">Nuevo Proveedor Pesquero</h3>
              <p className="text-xs text-slate-400 m-0">Registro ágil en muelle con plazo de crédito</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="min-w-[48px] min-h-[48px] w-12 h-12 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 flex items-center justify-center transition-colors active:scale-95"
          >
            <X size={22} />
          </button>
        </div>

        {/* Formulario Táctil */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Tipo Doc. *</label>
              <select
                className="w-full min-h-[48px] h-12 px-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-0"
                value={form.tipoIdentificacion}
                onChange={e => setForm({ ...form, tipoIdentificacion: e.target.value as any })}
              >
                <option value="NIT">NIT</option>
                <option value="CC">Cédula (CC)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Número de NIT o Cédula *</label>
              <input
                type="text"
                required
                className="w-full min-h-[48px] h-12 px-3.5 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-0"
                placeholder="Ej. 900.123.456-7"
                value={form.nit}
                onChange={e => setForm({ ...form, nit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Razón Social o Nombre Completo *</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full min-h-[48px] h-12 pl-10 pr-3.5 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-0"
                placeholder="Ej. Pesquera del Pacífico S.A.S."
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
              <Building2 size={18} className="absolute left-3 top-3.5 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Teléfono / WhatsApp</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full min-h-[48px] h-12 pl-10 pr-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-0"
                  placeholder="Ej. 315 123 4567"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
                <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Ciudad de Origen</label>
              <input
                type="text"
                className="w-full min-h-[48px] h-12 px-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-0"
                placeholder="Ej. Buenaventura, Tumaco..."
                value={form.ciudad}
                onChange={e => setForm({ ...form, ciudad: e.target.value })}
              />
            </div>
          </div>

          {/* Plazo de Crédito Comercial */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-500" />
              Plazo de Crédito Acordado
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS_CREDITO.map(preset => {
                const activo = form.plazoPagoDias === preset.dias;
                return (
                  <button
                    key={preset.dias}
                    type="button"
                    onClick={() => setForm({ ...form, plazoPagoDias: preset.dias })}
                    className={`min-h-[48px] h-12 px-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 border-2 flex items-center justify-center ${
                      activo
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón Gigante de Guardado (Regla Niño 12 Años >= 56px) */}
          <button
            type="submit"
            className="w-full min-h-[56px] h-14 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            REGISTRAR Y SELECCIONAR PROVEEDOR
          </button>
        </form>
      </div>
    </div>
  );
};
