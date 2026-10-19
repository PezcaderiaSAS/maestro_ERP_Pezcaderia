/**
 * Vista Táctil de Inicio de Turno del Conductor / Repartidor
 * Especificación: SPEC-023 (TASK-023-04)
 * Principios: "Regla del Niño de 12 Años", botones >= 48px y >= 56px, WCAG AA+
 */

import React, { useState } from 'react';
import { Truck, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { useDriverDeliveryPwaStore } from '../../../store/useDriverDeliveryPwaStore';

const CONDUCTORES_DEMO = [
  {
    id: 'drv-001',
    nombre: 'Juan Carlos Rodríguez',
    email: 'conductor.juan@pezcaderia.com',
    placa: 'WPZ-482',
    furgon: 'Furgón Isuzu FrioMax #1'
  },
  {
    id: 'drv-002',
    nombre: 'Andrés Felipe Morales',
    email: 'conductor.andres@pezcaderia.com',
    placa: 'STR-910',
    furgon: 'Camioneta Refrigerada #2'
  }
];

export const DriverLoginView: React.FC = () => {
  const { login, isLoading, error, limpiarError } = useDriverDeliveryPwaStore();

  const [email, setEmail] = useState('conductor.juan@pezcaderia.com');
  const [password, setPassword] = useState('ClaveSegura2026*');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    limpiarError();

    if (!email.trim()) {
      setLocalError('Ingrese su correo corporativo de conductor');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    await login(email.trim(), password);
  };

  const handleSeleccionarConductorDemo = (conductor: typeof CONDUCTORES_DEMO[0]) => {
    setEmail(conductor.email);
    setPassword('ClaveSegura2026*');
    setLocalError(null);
    limpiarError();
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-center min-h-[85vh]">
      {/* Tarjeta de Bienvenida */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Cabecera / Identidad */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <Truck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Portal de Repartidores
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            La Pezcadería SAS • Rutas B2B & Entrega en Terreno
          </p>
        </div>

        {/* Acceso Rápido de Conductores */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Acceso Rápido por Vehículo / Conductor
          </label>
          <div className="grid grid-cols-1 gap-2">
            {CONDUCTORES_DEMO.map((c) => {
              const isSelected = email === c.email;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSeleccionarConductorDemo(c)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[52px] ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-black text-slate-900">{c.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {c.placa} • {c.furgon}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {c.placa}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Correo Electrónico Corporativo
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="conductor@pezcaderia.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 min-h-[48px] text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 min-h-[48px] text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Alertas de Error */}
          {(localError || error) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Botón Principal (>= 56px) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 min-h-[56px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">INICIANDO TURNO...</span>
            ) : (
              <>
                <span>INICIAR TURNO DE RUTA</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer de Seguridad */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sincronización Offline • Operación Continua</span>
        </div>
      </div>
    </div>
  );
};
