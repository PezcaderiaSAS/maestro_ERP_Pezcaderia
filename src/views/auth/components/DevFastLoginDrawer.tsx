import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { RoleRbac } from '../../../types/auth.types';
import { Terminal, Shield, User, ShoppingBag, Truck, CheckCircle2, ChevronUp, ChevronDown, Crown } from 'lucide-react';

interface DevFastLoginDrawerProps {
  onLoginTriggered?: () => void;
  defaultOpen?: boolean;
}

interface DevRoleOption {
  rol: RoleRbac;
  label: string;
  email: string;
  nombre: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const DEV_ROLES: DevRoleOption[] = [
  {
    rol: 'admin',
    label: 'Ultra Admin Global',
    email: 'pezcaderia.2022@gmail.com',
    nombre: 'Ultra Administrador (GOD_MODE)',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    icon: <Crown className="w-4 h-4 text-rose-400" />,
  },
  {
    rol: 'admin',
    label: 'Admin Propietario',
    email: 'admin.dueno@pezcaderia.com',
    nombre: 'Don Fernando Dueño',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    icon: <Shield className="w-4 h-4 text-emerald-400" />,
  },
  {
    rol: 'vendedor',
    label: 'Vendedor Mostrador',
    email: 'vendedor1@pezcaderia.com',
    nombre: 'Carlos Mostrador',
    badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    icon: <User className="w-4 h-4 text-blue-400" />,
  },
  {
    rol: 'cajero',
    label: 'Cajero Principal',
    email: 'caja1@pezcaderia.com',
    nombre: 'Juana Martínez',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    icon: <ShoppingBag className="w-4 h-4 text-amber-400" />,
  },
  {
    rol: 'bodeguero',
    label: 'Bodeguero WMS',
    email: 'bodega1@pezcaderia.com',
    nombre: 'Alberto Cuarto Frío',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    icon: <Truck className="w-4 h-4 text-purple-400" />,
  },
  {
    rol: 'supervisor',
    label: 'Supervisor Garantías',
    email: 'supervisor@pezcaderia.com',
    nombre: 'Diana Supervisora',
    badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />,
  },
];

export const DevFastLoginDrawer: React.FC<DevFastLoginDrawerProps> = ({ onLoginTriggered, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const loginWithProvider = useAuthStore((s) => s.loginWithProvider);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleDevLogin = async (option: DevRoleOption) => {
    // 1. Iniciar sesión mock con el proveedor
    const res = await loginWithProvider('google', {
      email: option.email,
      nombre: option.nombre,
      rol: option.rol,
    });

    // 2. Si el usuario requiere onboarding (es nuevo), autoprovisionar tenant de prueba
    if (res.ok && useAuthStore.getState().status === 'needs_onboarding') {
      await completeOnboarding({
        razonSocial: 'La Pezcadería del Mar S.A.S.',
        nit: '901.888.777-4',
        ciudad: 'Bucaramanga',
        direccion: 'Calle 36 # 24-10 Local Central',
        telefono: '3158889900',
        regimenTributario: 'COMUN',
      });
      // Asignar el rol requerido
      useAuthStore.getState().switchRoleDev(option.rol);
    }

    if (onLoginTriggered) {
      onLoginTriggered();
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-cyan-500/30 backdrop-blur-xl shadow-2xl transition-all duration-300">
      {/* Botón de toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-2.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">Dev Acceso Rápido • Emulación Local de Roles</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            LOCAL DEV ONLY
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>{isOpen ? 'Ocultar' : 'Expandir roles'}</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Contenido expandible */}
      {isOpen && (
        <div className="p-4 border-t border-white/5 bg-slate-900/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-7xl mx-auto">
            {DEV_ROLES.map((roleOpt) => (
              <button
                key={roleOpt.email}
                onClick={() => handleDevLogin(roleOpt)}
                disabled={isLoading}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between ${roleOpt.badgeColor} hover:brightness-125 focus:ring-2 focus:ring-cyan-500/50`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                    {roleOpt.icon}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wide opacity-80">
                    {roleOpt.rol}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white truncate">{roleOpt.label}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{roleOpt.nombre}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
