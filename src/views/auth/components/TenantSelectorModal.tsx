// src/views/auth/components/TenantSelectorModal.tsx
// Modal Canónico de Conmutación Multi-Empresa y Selector Visual V8
// Módulo: SPEC-036 (La Pezcadería ERP & Ferretería Josase)

import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  X,
  Store,
  Crown,
  Search,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { superAdminService } from '../../../services/superAdminService';
import type { TenantConfig } from '../../../types/multiVendorCash.types';
import type { TenantData } from '../../../types/auth.types';
import { isSuperAdmin } from '../../../types/auth.types';
import Swal from 'sweetalert2';

export interface TenantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantSelected?: (tenant: TenantData) => void;
}

export const TenantSelectorModal: React.FC<TenantSelectorModalProps> = ({
  isOpen,
  onClose,
  onTenantSelected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAuthStore((s) => s.currentUser);
  const switchTenant = useAuthStore((s) => s.switchTenant);

  // Obtener todas las empresas registradas
  const tenants = useMemo<TenantConfig[]>(() => {
    return superAdminService.getTenants();
  }, []);

  // Filtrado reactivo por nombre, NIT o rubro
  const filteredTenants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.nombre.toLowerCase().includes(q) ||
        t.razonSocial.toLowerCase().includes(q) ||
        t.nit.toLowerCase().includes(q) ||
        t.rubro.toLowerCase().includes(q)
    );
  }, [tenants, searchTerm]);

  if (!isOpen) return null;

  const userIsSuperAdmin =
    Boolean(currentUser?.isSuperAdmin) || isSuperAdmin(currentUser?.email);

  const handleSelectTenant = (tenant: TenantConfig) => {
    const tenantData: TenantData = {
      id: tenant.id,
      razonSocial: tenant.razonSocial || tenant.nombre,
      nit: tenant.nit,
      ciudad: 'Bucaramanga',
      telefono: tenant.contactoTelefono || '3101234567',
      activo: tenant.activo,
      createdAt: tenant.createdAt,
    };

    switchTenant(tenantData, { syncStores: true });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Empresa conmutada: ${tenant.nombre}`,
      text: `Rubro: ${tenant.rubro} • Terminales: ${tenant.maxTerminales}`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

    if (onTenantSelected) {
      onTenantSelected(tenantData);
    }
    onClose();
  };

  return (
    <div
      data-testid="tenant-selector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-selector-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="tenant-selector-title" className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Conmutador Multi-Empresa
                {userIsSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/30 text-rose-200 border border-rose-500/50 font-mono">
                    GOD_MODE
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                Selecciona la empresa / tenant operativo para conmutar el contexto de trabajo en 1 toque.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner especial para UltraAdministrador Global */}
        {userIsSuperAdmin && (
          <div className="px-4 sm:px-5 py-3 bg-rose-950/50 border-b border-rose-500/40 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-900/60 text-rose-300 shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-rose-200">Modo UltraAdministrador Global Activo: </span>
              <span className="text-slate-200">
                Tienes privilegios irrestrictos sobre todos los tenants, bases de datos y configuraciones operativas del sistema (GOD_MODE).
              </span>
            </div>
          </div>
        )}

        {/* Buscador de Tenants */}
        <div className="p-4 sm:p-5 pb-3 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, NIT o rubro (Pescadería / Ferretería)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
            />
          </div>
        </div>

        {/* Lista de Empresas / Tenants */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5 space-y-3 bg-slate-900">
          {filteredTenants.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No se encontraron empresas con el término de búsqueda ingresado.
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const isActive = activeTenant?.id === tenant.id;
              const isPescaderia = tenant.rubro === 'PESCADERIA';

              return (
                <div
                  key={tenant.id}
                  data-testid={`tenant-card-${tenant.id}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-slate-950 border-2 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-750'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isPescaderia
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                            : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <Store className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white tracking-tight">
                            {tenant.nombre}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase ${
                              isPescaderia
                                ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950'
                                : 'border-amber-500/40 text-amber-300 bg-amber-950'
                            }`}
                          >
                            {tenant.rubro}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${
                              tenant.activo
                                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950'
                                : 'border-rose-500/40 text-rose-300 bg-rose-950'
                            }`}
                          >
                            {tenant.activo ? 'ACTIVA' : 'INACTIVA'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                          <span>NIT: {tenant.nit}</span>
                          <span>•</span>
                          <span>Razón Social: {tenant.razonSocial}</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-semibold flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            {tenant.maxTerminales} Terminales (Caja Central)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Acción / Estado */}
                    <div className="shrink-0 flex items-center justify-end pt-2 sm:pt-0">
                      {isActive ? (
                        <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm border border-cyan-400">
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span>Empresa Activa</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-testid={`btn-select-tenant-${tenant.id}`}
                          onClick={() => handleSelectTenant(tenant)}
                          className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Conmutar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">Multi-Tenant RBAC V8 Concurrente</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

