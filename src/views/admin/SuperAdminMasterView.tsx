// src/views/admin/SuperAdminMasterView.tsx
// Panel de Control Maestro Super Admin (Desarrollador Principal)
// Sistema de Diseño Oficial Dark Glassmorphism V8 (#070A10)

import React from 'react';
import {
  Building2,
  Users,
  Shield,
  Monitor,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Store,
  Sparkles,
} from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';

export const SuperAdminMasterView: React.FC = () => {
  const {
    tenants,
    selectedTenantId,
    users,
    selectTenant,
    toggleTenantStatus,
  } = useSuperAdminStore();

  const totalEmpresas = tenants.length;
  const empresasActivas = tenants.filter((t) => t.activo).length;
  const totalTerminales = tenants.reduce((acc, t) => acc + (t.maxTerminales || 8), 0);
  const totalUsuarios = users.length;

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header con Badge de Seguridad y Control Global */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Panel Maestro Super Admin
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  GOD_MODE / RLS_BYPASS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consola global exclusiva para desarrollador. Supervisión multi-empresa, terminales y usuarios.
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Activo Seleccionado */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-white/10 text-xs">
          <Store size={15} className="text-cyan-400" />
          <span className="text-slate-400">Contexto Activo:</span>
          <span className="font-bold text-white">{selectedTenant?.nombre || 'Ninguno'}</span>
        </div>
      </header>

      {/* 2. Cuadrante de 4 Métricas Clave (KPI Cards V8) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Empresas */}
        <div className="p-5 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Empresas</span>
            <Building2 size={18} className="text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {totalEmpresas}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Registradas en el ecosistema</div>
        </div>

        {/* Card 2: Empresas Activas */}
        <div className="p-5 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Empresas Activas</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
            {empresasActivas}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Con operación en línea habilitada</div>
        </div>

        {/* Card 3: Terminales Máximas */}
        <div className="p-5 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Terminales Máximas</span>
            <Monitor size={18} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">
            {totalTerminales}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hasta 8 por cada sucursal</div>
        </div>

        {/* Card 4: Usuarios Registrados */}
        <div className="p-5 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Usuarios Registrados</span>
            <Users size={18} className="text-teal-400" />
          </div>
          <div className="text-3xl font-black font-mono text-teal-400 tracking-tight">
            {totalUsuarios}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">En el tenant seleccionado</div>
        </div>
      </div>

      {/* 3. Directorio de Empresas Registradas (Tenants) */}
      <section className="p-6 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 size={18} className="text-cyan-400" />
            <span>Directorio de Empresas y Tenants</span>
          </h2>
          <span className="text-xs text-slate-400">
            Haz clic en una empresa para auditar sus usuarios y terminales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((t) => {
            const isSelected = t.id === selectedTenantId;
            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/50 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">{t.nombre}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          t.rubro === 'FERRETERIA'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {t.rubro}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      NIT: <span className="text-slate-200 font-mono">{t.nit}</span> • {t.razonSocial}
                    </div>
                  </div>

                  {/* Estado Activo / Suspendido */}
                  <button
                    type="button"
                    data-testid={`btn-toggle-tenant-${t.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTenantStatus(t.id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      t.activo
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                    }`}
                    title={t.activo ? 'Clic para suspender empresa' : 'Clic para activar empresa'}
                  >
                    {t.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    <span>{t.activo ? 'Activa' : 'Suspendida'}</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Terminales autorizadas: <strong className="text-white font-mono">{t.maxTerminales || 8}</strong></span>
                    <span>Sucursales: <strong className="text-white font-mono">{t.sucursalesCount || 1}</strong></span>
                  </div>

                  <button
                    type="button"
                    data-testid={`btn-select-tenant-${t.id}`}
                    onClick={() => selectTenant(t.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Seleccionada' : 'Auditar Empresa'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Tabla de Usuarios y Roles de la Empresa Seleccionada */}
      <section className="p-6 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-teal-400" />
              <span>Usuarios y Permisos ({selectedTenant?.nombre})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Trazabilidad y roles RBAC activos para este tenant
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol en Sistema</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Último Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{u.nombre}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        u.rol === 'ADMIN'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : u.rol === 'CAJERO'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        u.activo ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.activo ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleDateString() : 'Nunca'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
