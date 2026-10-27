import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  Building2,
  MapPin,
  Phone,
  FileText,
  Warehouse,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [razonSocial, setRazonSocial] = useState('');
  const [nit, setNit] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [regimenTributario, setRegimenTributario] = useState('COMUN');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const currentUser = useAuthStore((s) => s.currentUser);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (!isOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!razonSocial.trim()) {
      setErrorLocal('La Razón Social es obligatoria.');
      return;
    }
    if (!nit.trim()) {
      setErrorLocal('El NIT o RUT es obligatorio.');
      return;
    }
    if (!ciudad.trim()) {
      setErrorLocal('La ciudad es obligatoria.');
      return;
    }
    if (!telefono.trim()) {
      setErrorLocal('El teléfono es obligatorio.');
      return;
    }

    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    setErrorLocal(null);
    const res = await completeOnboarding({
      razonSocial: razonSocial.trim(),
      nit: nit.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim() || undefined,
      telefono: telefono.trim(),
      regimenTributario,
    });

    if (res.ok) {
      Swal.fire({
        title: '¡Empresa Creada Exitosamente!',
        html: `Bienvenido a La Pezcadería ERP.<br/>Se ha aprovisionado la <b>Bodega Principal</b> y la <b>Caja General</b> para <b>${razonSocial}</b>.`,
        icon: 'success',
        confirmButtonColor: '#06B6D4',
      });
      onClose();
    } else {
      setErrorLocal(res.error || 'Ocurrió un error al registrar la empresa.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden font-sans">
        {/* Orbe decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Configura tu Empresa</h2>
              <p className="text-xs text-slate-400">Paso {step} de 2 • Onboarding del Propietario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de error */}
        {errorLocal && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Paso 1: Datos de la Empresa */}
        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label htmlFor="razonSocial" className="block text-xs font-medium text-slate-300 mb-1">
                Razón Social *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="razonSocial"
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Distribuidora del Mar S.A.S."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nit" className="block text-xs font-medium text-slate-300 mb-1">
                  NIT / RUT *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="nit"
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="901.234.567-8"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ciudad" className="block text-xs font-medium text-slate-300 mb-1">
                  Ciudad *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="ciudad"
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Bucaramanga"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="direccion" className="block text-xs font-medium text-slate-300 mb-1">
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle o Carrera #"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-xs font-medium text-slate-300 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3001234567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
              >
                <span>Continuar al Paso 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Paso 2: Aprovisionamiento y Confirmación */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovisionamiento Automático</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al confirmar, se crearán de forma determinista los centros operativos canónicos:
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                    <Warehouse className="w-4 h-4" />
                    <span>Bodega Principal</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Código ID: '1'</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Caja General</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Código: 'CAJA-01'</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">{currentUser?.nombre || 'Usuario'}</span> será
                asignado como <b className="text-emerald-400">Administrador Propietario</b> con acceso
                completo a facturación, POS, inventarios y permisos.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modificar Datos</span>
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Aprovisionando...' : 'Crear Empresa y Comenzar'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
