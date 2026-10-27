import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { RoleRbac } from '../../../types/auth.types';
import {
  UserPlus,
  Mail,
  User,
  Shield,
  Copy,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Link2,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface EmployeeInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeInviteModal: React.FC<EmployeeInviteModalProps> = ({ isOpen, onClose }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RoleRbac>('vendedor');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const activeTenant = useAuthStore((s) => s.activeTenant);
  const sendInvitation = useAuthStore((s) => s.sendInvitation);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (!isOpen) return null;

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!nombre.trim()) {
      setErrorLocal('El nombre completo del colaborador es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorLocal('Ingresa un correo electrónico corporativo válido.');
      return;
    }

    const res = await sendInvitation({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol,
    });

    if (res.ok && res.inviteLink) {
      setGeneratedLink(res.inviteLink);
    } else {
      setErrorLocal(res.error || 'Ocurrió un error al emitir la invitación.');
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      Swal.fire({
        title: '¡Enlace Copiado!',
        text: 'El enlace seguro de invitación ha sido copiado al portapapeles. Puedes compartirlo por WhatsApp o correo.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleResetForNewInvite = () => {
    setNombre('');
    setEmail('');
    setRol('vendedor');
    setGeneratedLink(null);
    setCopied(false);
    setErrorLocal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden font-sans">
        {/* Orbe decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Invitar Colaborador al Equipo</h2>
              <p className="text-xs text-slate-400 truncate max-w-xs">
                Empresa: <b className="text-slate-200">{activeTenant?.razonSocial || 'La Pezcadería'}</b>
              </p>
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

        {!generatedLink ? (
          /* Formulario de Emisión de Invitación */
          <form onSubmit={handleGenerateInvite} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-xs font-medium text-slate-300 mb-1">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Laura Vargas"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

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
                  placeholder="laura.vargas@empresa.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="rol" className="block text-xs font-medium text-slate-300 mb-1">
                Rol Autorizado *
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="rol"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as RoleRbac)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="vendedor">Vendedor (POS y Preventas)</option>
                  <option value="cajero">Cajero (Caja Única y Arqueos)</option>
                  <option value="bodeguero">Bodeguero (WMS y Despachos)</option>
                  <option value="supervisor">Supervisor (Garantías y Auditoría)</option>
                  <option value="contador">Contador (Facturación y Balances)</option>
                  <option value="admin">Administrador (Control Total)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Generando...' : 'Generar Enlace de Invitación'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Estado de Enlace Generado Exitosamente */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-1">
              <div className="inline-flex p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mb-1">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">¡Enlace de Invitación Generado!</h3>
              <p className="text-xs text-slate-300">
                Comparte este enlace seguro con <b className="text-white">{nombre}</b>. Tendrá validez de{' '}
                <b className="text-emerald-400">7 días</b> para activar su cuenta con rol <b className="text-cyan-400">{rol}</b>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 truncate text-xs text-cyan-300 font-mono">
                <Link2 className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{generatedLink}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-indigo-600/20"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Enlace'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForNewInvite}
                className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors"
              >
                Invitar a Otro Colaborador
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Listo y Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
