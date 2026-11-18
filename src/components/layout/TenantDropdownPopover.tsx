// src/components/layout/TenantDropdownPopover.tsx
// Componente Ergonómico de Conmutación Multi-Empresa Flotante V8 (SPEC-065)
// Sustituye el modal centrado invasivo por un popover liviano, accesible y de 1-toque.

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Store,
  Crown,
  Layers,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { superAdminService } from '../../services/superAdminService';
import type { TenantConfig } from '../../types/multiVendorCash.types';
import type { TenantData } from '../../types/auth.types';
import { isSuperAdmin } from '../../types/auth.types';
import Swal from 'sweetalert2';

export interface TenantDropdownPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantSelected?: (tenant: TenantData) => void;
  className?: string;
}

export const TenantDropdownPopover: React.FC<TenantDropdownPopoverProps> = ({
  isOpen,
  onClose,
  onTenantSelected,
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAuthStore((s) => s.currentUser);
  const switchTenant = useAuthStore((s) => s.switchTenant);

  // Obtener empresas registradas
  const tenants = useMemo<TenantConfig[]>(() => {
    return superAdminService.getTenants();
  }, []);

  const userIsSuperAdmin =
    Boolean(currentUser?.isSuperAdmin) || isSuperAdmin(currentUser?.email);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectTenant = async (tenant: TenantConfig) => {
    if (activeTenant?.id === tenant.id) {
      onClose();
      return;
    }

    const tenantData: TenantData = {
      id: tenant.id,
      razonSocial: tenant.razonSocial || tenant.nombre,
      nit: tenant.nit,
      ciudad: 'Bucaramanga',
      telefono: tenant.contactoTelefono || '3101234567',
      activo: tenant.activo,
      createdAt: tenant.createdAt,
    };

    // 1. Sincronizar en el almacén de autenticación y tenant activo (sincroniza stores internamente)
    switchTenant(tenantData, { syncStores: true });

    // 2. Notificación Toast no bloqueante
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Empresa conmutada: ${tenant.nombre}`,
      text: `Catálogo de ${tenant.rubro.toLowerCase()} activado en 1 toque.`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

    if (onTenantSelected) {
      onTenantSelected(tenantData);
    }

    // Auto-cierre instantáneo
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      data-testid="tenant-dropdown-popover"
      className={`absolute top-full mt-2 right-0 sm:right-auto sm:left-0 w-80 sm:w-96 rounded-2xl bg-[#070A10]/95 border border-white/15 shadow-2xl backdrop-blur-2xl text-slate-100 z-50 overflow-hidden animate-fadeIn ${className}`}
      style={{
        boxShadow:
          '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
      role="dialog"
      aria-label="Conmutador de Empresas"
    >
      {/* Cabecera compacta */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
              Conmutar Empresa
              {userIsSuperAdmin && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                  GOD_MODE
                </span>
              )}
            </h4>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar conmutador"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de empresas */}
      <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
        {tenants.map((tenant) => {
          const isActive = activeTenant?.id === tenant.id;
          const isPescaderia = tenant.rubro === 'PESCADERIA';

          return (
            <button
              key={tenant.id}
              type="button"
              data-testid={`popover-tenant-btn-${tenant.id}`}
              onClick={() => handleSelectTenant(tenant)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isPescaderia
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 group-hover:scale-105'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 group-hover:scale-105'
                  } transition-transform`}
                >
                  <Store className="w-4 h-4" />
                </div>

                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-[200px]">
                      {tenant.nombre}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border uppercase font-mono ${
                        isPescaderia
                          ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                          : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {tenant.rubro}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    NIT: {tenant.nit} • {tenant.maxTerminales} Terminales
                  </div>
                </div>
              </div>

              {/* Indicador de estado */}
              <div className="shrink-0 flex items-center">
                {isActive ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>Activa</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors flex items-center gap-0.5">
                    Conmutar
                    <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pie informativo sutil */}
      <div className="px-3 py-2 bg-slate-900/60 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Multi-Tenant RBAC V8
        </span>
        <span>Aislamiento 100%</span>
      </div>
    </div>
  );
};
