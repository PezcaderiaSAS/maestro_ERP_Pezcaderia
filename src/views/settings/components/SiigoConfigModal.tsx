// src/views/settings/components/SiigoConfigModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Building2
} from 'lucide-react';
import { useSiigoConfigStore } from '../../../store/useSiigoConfigStore';
import { validarCredencialesSiigo, enmascararAccessKey } from '../../../../packages/validation-schemas/src/siigoConfig.schema';

export interface SiigoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal Táctil de Configuración y Diagnóstico para SIIGO Nube API v2
 * Cumple con la "Regla del Niño de 12 Años" (Botón principal >= 56px, inputs >= 48px, WCAG AA+, cero imágenes).
 */
export const SiigoConfigModal: React.FC<SiigoConfigModalProps> = ({ isOpen, onClose }) => {
  const config = useSiigoConfigStore((state) => state.config);
  const estadoConexion = useSiigoConfigStore((state) => state.estadoConexion);
  const ultimoPing = useSiigoConfigStore((state) => state.ultimoPing);
  const isLoading = useSiigoConfigStore((state) => state.isLoading);
  const ultimoError = useSiigoConfigStore((state) => state.ultimoError);
  const saveConfig = useSiigoConfigStore((state) => state.saveConfig);
  const clearConfig = useSiigoConfigStore((state) => state.clearConfig);

  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);
  const [partnerId, setPartnerId] = useState('LaPezcaderiaERP');
  const [showKey, setShowKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar estado inicial al abrir modal
  useEffect(() => {
    if (isOpen) {
      if (config) {
        setUsername(config.username || '');
        setAccessKey(config.accessKey || '');
        setIsSandbox(Boolean(config.isSandbox));
        setPartnerId(config.partnerId || 'LaPezcaderiaERP');
      } else {
        setUsername('');
        setAccessKey('');
        setIsSandbox(false);
        setPartnerId('LaPezcaderiaERP');
      }
      setFormError(null);
      setShowKey(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validacion = validarCredencialesSiigo({
      username: username.trim(),
      accessKey: accessKey.trim(),
      isSandbox,
      partnerId: partnerId.trim() || 'LaPezcaderiaERP',
      urlBase: 'https://api.siigo.com'
    });

    if (!validacion.valido || !validacion.data) {
      setFormError(validacion.error || 'Por favor revise los campos requeridos');
      return;
    }

    const resultado = await saveConfig(validacion.data);
    if (!resultado.success) {
      setFormError(resultado.error || 'Fallo al autenticar credenciales con SIIGO Nube');
    }
  };

  const handleClear = () => {
    clearConfig();
    setUsername('');
    setAccessKey('');
    setIsSandbox(false);
    setFormError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="siigo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-8">
        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm">
              <KeyRound size={24} />
            </div>
            <div>
              <h2 id="siigo-modal-title" className="text-xl font-black text-slate-900 tracking-tight">
                Integración SIIGO Nube API v2
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Autenticación Bearer, timbrado DIAN y sincronización automática
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Banner de Diagnóstico del Último Ping ── */}
        {ultimoPing && (
          <div
            className={`px-6 py-3 border-b text-xs flex items-center justify-between gap-3 ${
              ultimoPing.success
                ? ultimoPing.isSandbox
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {ultimoPing.success ? (
                ultimoPing.isSandbox ? (
                  <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                )
              ) : (
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{ultimoPing.message}</span>
            </div>
            {ultimoPing.success && !ultimoPing.isSandbox && (
              <span className="font-mono font-bold bg-white/80 px-2 py-0.5 rounded-md shadow-2xs">
                {ultimoPing.latencyMs} ms
              </span>
            )}
          </div>
        )}

        {/* ── Formulario ── */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Alerta de Error de Formulario */}
          {(formError || ultimoError) && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {formError || ultimoError}
              </div>
            </div>
          )}

          {/* Toggle de Modo Sandbox vs Producción */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className={isSandbox ? 'text-amber-600' : 'text-slate-400'} />
                Modo Simulación / Sandbox
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isSandbox
                  ? 'Activo: No se enviarán llamadas a la DIAN. Respuestas virtuales simuladas.'
                  : 'Desactivado: Modo Producción oficial conectado a api.siigo.com.'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Modo Simulación / Sandbox"
              aria-checked={isSandbox}
              onClick={() => setIsSandbox(!isSandbox)}
              className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer min-h-[44px] flex items-center p-1 ${
                isSandbox ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                  isSandbox ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Input: Usuario / Email Corporativo */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="siigo-username-input"
              className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Building2 size={14} className="text-blue-600" />
              Correo Electrónico de Usuario
            </label>
            <input
              id="siigo-username-input"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ejemplo: facturacion@lapezcaderia.com"
              required
              className="min-h-[48px] h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium outline-hidden transition-all"
            />
          </div>

          {/* Input: Access Key API */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="siigo-accesskey-input"
              className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound size={14} className="text-blue-600" />
                Access Key (Clave API SIIGO Nube)
              </span>
              {accessKey && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {enmascararAccessKey(accessKey)}
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <input
                id="siigo-accesskey-input"
                type={showKey ? 'text' : 'password'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Pegue aquí la clave de acceso generada en SIIGO"
                required
                className="min-h-[48px] h-12 w-full pl-4 pr-12 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Input: Partner ID */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="siigo-partnerid-input"
              className="text-xs font-black text-slate-700 uppercase tracking-wider"
            >
              Partner-Id de Integración
            </label>
            <input
              id="siigo-partnerid-input"
              type="text"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              placeholder="LaPezcaderiaERP"
              className="min-h-[48px] h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium outline-hidden transition-all"
            />
          </div>

          {/* ── Botón Principal de Acción (Regla del Niño de 12 Años: >= 56px) ── */}
          <button
            type="submit"
            data-testid="btn-save-siigo-config"
            disabled={isLoading}
            className="min-h-[56px] h-14 w-full font-black text-base bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Verificando y Guardando...</span>
              </>
            ) : (
              <>
                <Zap size={20} />
                <span>PROBAR Y GUARDAR CONEXIÓN CON SIIGO</span>
              </>
            )}
          </button>

          {/* Botones Secundarios */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              role="button"
              onClick={handleClear}
              className="min-h-[48px] h-12 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Trash2 size={16} />
              <span>Limpiar Credenciales</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] h-12 px-6 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 cursor-pointer transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
