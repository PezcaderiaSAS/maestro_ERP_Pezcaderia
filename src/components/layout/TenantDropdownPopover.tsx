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
      className={`absolute top-full mt-2 right-0 sm:right-auto sm:left-0 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 z-50 overflow-hidden animate-fadeIn ${className}`}
      style={{
        boxShadow:
          '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
      role="dialog"
      aria-label="Conmutador de Empresas"
    >
      {/* Cabecera compacta con fondo sólido opaco */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
              Conmutar Empresa
              {userIsSuperAdmin && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-rose-500/30 text-rose-200 border border-rose-500/50 font-mono">
                  GOD_MODE
                </span>
              )}
            </h4>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar conmutador"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de empresas con fondos sólidos sin filtrado visual */}
      <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto bg-slate-900">
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
                  ? 'bg-slate-950 border-2 border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                  : 'bg-slate-800 border border-slate-700/80 hover:border-slate-500 hover:bg-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isPescaderia
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 group-hover:scale-105'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40 group-hover:scale-105'
                  } transition-transform`}
                >
                  <Store className="w-4 h-4" />
                </div>

                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white truncate max-w-[170px] sm:max-w-[200px]">
                      {tenant.nombre}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border uppercase font-mono ${
                        isPescaderia
                          ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950'
                          : 'border-amber-500/40 text-amber-300 bg-amber-950'
                      }`}
                    >
                      {tenant.rubro}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono mt-0.5 truncate">
                    NIT: {tenant.nit} • {tenant.maxTerminales} Terminales
                  </div>
                </div>
              </div>

              {/* Indicador de estado y botón conmutar */}
              <div className="shrink-0 flex items-center">
                {isActive ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[10px] font-black border border-cyan-400 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    <span>Activa</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                    Conmutar
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pie informativo sólido */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Multi-Tenant RBAC V8
        </span>
        <span className="text-slate-300 font-semibold">Aislamiento 100%</span>
      </div>
    </div>
  );
};
