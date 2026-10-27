import React, { useState, useEffect } from 'react';
import { Lock, Mail, Building2, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { userManagementService } from '../../services/userManagementService';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { TenantOnboardingWizard } from './components/TenantOnboardingWizard';
import { MandatoryChangePasswordModal } from './components/MandatoryChangePasswordModal';
import { DevFastLoginDrawer } from './components/DevFastLoginDrawer';
import type { AuthUserProfile } from '../../types/auth.types';
import Swal from 'sweetalert2';

export interface LoginViewProps {
  onLoginSuccess?: (user: AuthUserProfile) => void;
  isDevMode?: boolean;
  devDrawerDefaultOpen?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isDevMode,
  devDrawerDefaultOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Estado del modal de cambio obligatorio de contraseña (primer acceso con cédula)
  const [pendingChangeUserId, setPendingChangeUserId] = useState<string | null>(null);
  const [pendingChangeUserEmail, setPendingChangeUserEmail] = useState<string>('');
  const [pendingUserProfile, setPendingUserProfile] = useState<AuthUserProfile | null>(null);

  const pendingInviteToken = useAuthStore((s) => s.pendingInviteToken);
  const setPendingInviteToken = useAuthStore((s) => s.setPendingInviteToken);
  const loginWithProvider = useAuthStore((s) => s.loginWithProvider);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  // Detección automática de token de invitación en URL (?invite=TOKEN)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('invite');
      if (inviteToken && !pendingInviteToken) {
        setPendingInviteToken(inviteToken);
      }
    }
  }, [pendingInviteToken, setPendingInviteToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal(null);

    if (!email.trim() || !password.trim()) {
      setErrorGlobal('Por favor ingresa tu correo y contraseña');
      return;
    }

    setCargando(true);
    try {
      const res = await authService.loginWithEmail(email.trim().toLowerCase(), password);

      if (!res.ok || !res.user) {
        setErrorGlobal(res.error || 'Credenciales de acceso inválidas');
        setCargando(false);
        return;
      }

      const userProfile = res.user;

      // Verificar si el usuario requiere cambio obligatorio de contraseña (cédula provisional)
      const usuarioEnTenant = userManagementService.obtenerUsuarioPorId(userProfile.id);

      if (usuarioEnTenant?.mustChangePassword) {
        setPendingChangeUserId(userProfile.id);
        setPendingChangeUserEmail(userProfile.email);
        setPendingUserProfile(userProfile);
        setCargando(false);
        return;
      }

      // Login exitoso normal
      useAuthStore.setState({
        status: 'authenticated',
        currentUser: userProfile,
        isLoading: false,
      });

      if (onLoginSuccess) {
        onLoginSuccess(userProfile);
      } else {
        setCurrentView('dashboard');
      }
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al conectar con el servidor de autenticación');
    } finally {
      setCargando(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
    setErrorGlobal(null);
    setCargando(true);
    try {
      const res = await loginWithProvider(provider);
      if (!res.ok && res.error) {
        setErrorGlobal(res.error);
        Swal.fire({
          title: 'Error de Autenticación',
          text: res.error,
          icon: 'error',
          confirmButtonColor: '#EF4444',
        });
      } else if (res.ok && res.user && onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al autenticar con proveedor');
    } finally {
      setCargando(false);
    }
  };

  const handlePasswordChangedSuccess = () => {
    setPendingChangeUserId(null);
    if (pendingUserProfile) {
      useAuthStore.setState({
        status: 'authenticated',
        currentUser: pendingUserProfile,
        isLoading: false,
      });
      if (onLoginSuccess) {
        onLoginSuccess(pendingUserProfile);
      } else {
        setCurrentView('dashboard');
      }
    }
  };

  const showDevDrawer = isDevMode ?? (import.meta.env?.DEV || false);

  return (
    <div className="min-h-screen w-full bg-[#070A10] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden p-4 sm:p-6 select-none font-sans">
      {/* Fondo de Brillo y Luces de Neón V8 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-[400px] h-[250px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="w-full max-w-md relative z-10">
        {/* Marca y Logotipo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/20 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">La Pezcadería ERP</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Control Operativo, Facturación & WMS V8</p>
        </div>

        {/* Banner de Invitación de Empleado (Si aplica) */}
        {pendingInviteToken && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-start gap-3 text-left">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-300">Invitación de Colaborador Detectada</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Inicia sesión con tu cuenta para unirte al equipo y activar automáticamente tu cargo y permisos autorizados.
              </p>
            </div>
          </div>
        )}

        {/* Switch / Toggle Superior Fluido */}
        <div className="mb-6 p-1 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              setErrorGlobal(null);
              setActiveTab('login');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorGlobal(null);
              setActiveTab('register');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Registrar Empresa</span>
          </button>
        </div>

        {/* Vista: Pestaña Iniciar Sesión */}
        {activeTab === 'login' ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
            {errorGlobal && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorGlobal}</span>
              </div>
            )}

            <form onSubmit={handleLogin} data-testid="login-form" className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                onClick={handleLogin}
                disabled={cargando}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all min-h-[46px] disabled:opacity-50"
              >
                {cargando ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar al Sistema</span>
                  </>
                )}
              </button>
            </form>

            {/* Separador OAuth */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-slate-900/90 text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                O ingresa con
              </span>
            </div>

            {/* Botón Google OAuth 2.0 PKCE */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={cargando}
              className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-slate-950/60 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-2.5 transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          </div>
        ) : (
          /* Vista: Pestaña Registrar Empresa */
          <TenantOnboardingWizard
            onSuccess={(data) => {
              setActiveTab('login');
              setEmail(data.adminEmail);
              setErrorGlobal(null);
            }}
            onCancel={() => setActiveTab('login')}
          />
        )}

        {/* Pie de Seguridad */}
        <div className="mt-6 pt-4 border-t border-white/5 w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Conexión segura cifrada con Supabase GoTrue & PKCE</span>
        </div>
      </div>

      {/* Modal Bloqueante de Cambio Obligatorio de Contraseña (Primer Acceso) */}
      {pendingChangeUserId && (
        <MandatoryChangePasswordModal
          isOpen={Boolean(pendingChangeUserId)}
          userId={pendingChangeUserId}
          userEmail={pendingChangeUserEmail}
          onSuccess={handlePasswordChangedSuccess}
        />
      )}

      {/* Cajón de Desarrollo Local (DevFastLoginDrawer) */}
      {showDevDrawer && <DevFastLoginDrawer defaultOpen={devDrawerDefaultOpen} />}
    </div>
  );
};
