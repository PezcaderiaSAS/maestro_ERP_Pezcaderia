import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { userManagementService } from '../../../services/userManagementService';

interface MandatoryChangePasswordModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  onSuccess: () => void;
}

export const MandatoryChangePasswordModal: React.FC<MandatoryChangePasswordModalProps> = ({
  isOpen,
  userId,
  userEmail,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener mínimo 8 caracteres');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una letra mayúscula');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos un número');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      const res = await userManagementService.actualizarPasswordInicial(
        userId,
        newPassword,
        confirmPassword
      );

      if (!res.ok) {
        setError(res.error || 'Error al actualizar la contraseña');
        setCargando(false);
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error de conexión al actualizar contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10 text-slate-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Actualización Obligatoria de Contraseña</h3>
            <p className="text-xs text-slate-400">Primer Acceso al Sistema • {userEmail}</p>
          </div>
        </div>

        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Has iniciado sesión con tu contraseña provisional (tu cédula). Por políticas estrictas de seguridad (OWASP/NIST), debes definir una contraseña personal para acceder al ERP.
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="change-password-form" className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium text-slate-300 mb-1">
              Nueva Contraseña Segura *
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres, mayúscula y número"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300 mb-1">
              Confirmar Nueva Contraseña *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              required
            />
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={cargando}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all min-h-[46px] disabled:opacity-50"
          >
            {cargando ? (
              <span>Actualizando Credenciales...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Actualizar Contraseña e Ingresar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
