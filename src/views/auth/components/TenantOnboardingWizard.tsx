import React, { useState } from 'react';
import { Building2, User, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { tenantOnboardingService } from '../../../services/tenantOnboardingService';
import { userManagementService } from '../../../services/userManagementService';

interface TenantOnboardingWizardProps {
  onSuccess: (data: { tenantId: string; razonSocial: string; adminEmail: string }) => void;
  onCancel: () => void;
}

export const TenantOnboardingWizard: React.FC<TenantOnboardingWizardProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Paso 1: Datos de la Empresa
  const [razonSocial, setRazonSocial] = useState('');
  const [nit, setNit] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  // Paso 2: Datos del Administrador Fundador
  const [adminNombre, setAdminNombre] = useState('');
  const [adminIdentificacion, setAdminIdentificacion] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTelefono, setAdminTelefono] = useState('');

  // Validación de Paso 1
  const validarPaso1 = (): boolean => {
    setErrorGlobal(null);
    if (!razonSocial.trim() || razonSocial.trim().length < 3) {
      setErrorGlobal('La Razón Social debe tener mínimo 3 caracteres');
      return false;
    }
    if (!nit.trim() || nit.trim().length < 5) {
      setErrorGlobal('El NIT / RUT debe tener mínimo 5 caracteres');
      return false;
    }
    if (!ciudad.trim() || ciudad.trim().length < 2) {
      setErrorGlobal('La Ciudad es obligatoria');
      return false;
    }
    if (!telefono.trim() || telefono.trim().length < 7) {
      setErrorGlobal('El Teléfono Comercial debe tener mínimo 7 dígitos');
      return false;
    }
    return true;
  };

  const handleAvanzarPaso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validarPaso1()) {
      setPaso(2);
    }
  };

  const handleRetrocederPaso1 = () => {
    setErrorGlobal(null);
    setPaso(1);
  };

  // Validación y Envío Final
  const handleFinalizarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal(null);

    if (!adminNombre.trim() || adminNombre.trim().length < 3) {
      setErrorGlobal('El Nombre del Administrador debe tener mínimo 3 caracteres');
      return;
    }
    const cleanId = adminIdentificacion.trim().replace(/\D/g, '');
    if (!cleanId || cleanId.length < 5) {
      setErrorGlobal('La Cédula de Ciudadanía debe ser numérica y tener mínimo 5 dígitos');
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setErrorGlobal('El Correo de Inicio de Sesión no es válido');
      return;
    }
    if (!adminTelefono.trim() || adminTelefono.trim().length < 7) {
      setErrorGlobal('El Celular de Contacto debe tener mínimo 7 dígitos');
      return;
    }

    setCargando(true);
    try {
      // 1. Crear el Tenant con admin coordinado
      const resTenant = await tenantOnboardingService.crearTenantConAdmin({
        razonSocial: razonSocial.trim(),
        nit: nit.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion.trim() || undefined,
        telefono: telefono.trim(),
        adminNombre: adminNombre.trim(),
        adminIdentificacion: cleanId,
        adminEmail: adminEmail.trim().toLowerCase(),
        adminTelefono: adminTelefono.trim(),
      });

      if (!resTenant.ok || !resTenant.tenant) {
        setErrorGlobal(resTenant.error || 'Error al registrar la empresa');
        setCargando(false);
        return;
      }

      const tenantId = resTenant.tenant.id;

      // 2. Registrar al Administrador en el almacén de usuarios con contraseña provisional = cédula
      await userManagementService.crearUsuario(tenantId, {
        nombre: adminNombre.trim(),
        identificacion: cleanId,
        email: adminEmail.trim().toLowerCase(),
        telefono: adminTelefono.trim(),
        rol: 'ADMINISTRADOR',
        permisosPersonalizados: {
          'pos.access': true,
          'pos.apply_discounts': true,
          'pos.cancel_tickets': true,
          'cash.access': true,
          'cash.blind_audit': true,
          'cash.expenses': true,
          'inventory.view': true,
          'inventory.view_costs': true,
          'inventory.adjust': true,
          'purchases.reception': true,
          'admin.users_manage': true,
          'admin.tenant_edit': true,
        },
      });

      onSuccess({
        tenantId,
        razonSocial: resTenant.tenant.razonSocial,
        adminEmail: adminEmail.trim().toLowerCase(),
      });
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error de conexión al aprovisionar la empresa');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-slate-100">
      {/* Encabezado con Indicador de Pasos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Registro de Nueva Empresa</h2>
              <p className="text-xs text-slate-400">Onboarding Corporativo Multi-Tenant V8</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-cyan-400">
            Paso {paso} de 2
          </span>
        </div>

        {/* Barra de Progreso */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: paso === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {/* Alerta de Error */}
      {errorGlobal && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* PASO 1: Datos de la Empresa */}
      {paso === 1 && (
        <form onSubmit={handleAvanzarPaso2} className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Paso 1: Datos de la Empresa</span>
          </div>

          <div>
            <label htmlFor="razonSocial" className="block text-xs font-medium text-slate-300 mb-1">
              Razón Social *
            </label>
            <input
              id="razonSocial"
              type="text"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Ej. La Pezcadería SAS / FerreOn Bucaramanga"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="nit" className="block text-xs font-medium text-slate-300 mb-1">
                NIT / RUT *
              </label>
              <input
                id="nit"
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="Ej. 900123456-1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                required
              />
            </div>
            <div>
              <label htmlFor="ciudad" className="block text-xs font-medium text-slate-300 mb-1">
                Ciudad *
              </label>
              <input
                id="ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej. Bucaramanga / Cartagena"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className="block text-xs font-medium text-slate-300 mb-1">
              Teléfono Comercial *
            </label>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 3151234567"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              required
            />
          </div>

          <div>
            <label htmlFor="direccion" className="block text-xs font-medium text-slate-300 mb-1">
              Dirección Principal (Opcional)
            </label>
            <input
              id="direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Carrera 15 # 34-50"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div className="pt-3 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all min-h-[44px]"
            >
              <span>Continuar a Datos del Administrador</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* PASO 2: Datos del Administrador Fundador */}
      {paso === 2 && (
        <form onSubmit={handleFinalizarRegistro} className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Paso 2: Datos del Administrador</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              La contraseña provisional de acceso será su <strong>número de cédula</strong>. En su primer inicio de sesión se le exigirá actualizarla.
            </span>
          </div>

          <div>
            <label htmlFor="adminNombre" className="block text-xs font-medium text-slate-300 mb-1">
              Nombre y Apellidos *
            </label>
            <input
              id="adminNombre"
              type="text"
              value={adminNombre}
              onChange={(e) => setAdminNombre(e.target.value)}
              placeholder="Ej. Yurgen Martínez"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="adminIdentificacion" className="block text-xs font-medium text-slate-300 mb-1">
                Cédula de Ciudadanía *
              </label>
              <input
                id="adminIdentificacion"
                type="text"
                value={adminIdentificacion}
                onChange={(e) => setAdminIdentificacion(e.target.value)}
                placeholder="Ej. 1098765432"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                required
              />
            </div>
            <div>
              <label htmlFor="adminTelefono" className="block text-xs font-medium text-slate-300 mb-1">
                Celular de Contacto *
              </label>
              <input
                id="adminTelefono"
                type="tel"
                value={adminTelefono}
                onChange={(e) => setAdminTelefono(e.target.value)}
                placeholder="Ej. 3159998877"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="adminEmail" className="block text-xs font-medium text-slate-300 mb-1">
              Correo de Inicio de Sesión *
            </label>
            <input
              id="adminEmail"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Ej. admin@empresa.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={handleRetrocederPaso1}
              disabled={cargando}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Paso 1</span>
            </button>

            <button
              type="submit"
              disabled={cargando}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px] disabled:opacity-50"
            >
              {cargando ? (
                <span>Creando Empresa...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalizar Registro y Crear Empresa</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
