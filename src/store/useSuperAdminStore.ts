// src/store/useSuperAdminStore.ts
// Store Zustand para la vista maestra Super Admin (Multi-Tenant y Control Global)

import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { superAdminService, type SuperAdminUser } from '../services/superAdminService';
import type { TenantConfig } from '../types/multiVendorCash.types';

interface SuperAdminState {
  tenants: TenantConfig[];
  selectedTenantId: string | null;
  users: SuperAdminUser[];
  isLoading: boolean;

  loadTenants: () => void;
  selectTenant: (id: string) => void;
  toggleTenantStatus: (id: string) => void;
  loadUsers: (tenantId?: string) => void;
}

export const useSuperAdminStore = create<SuperAdminState>()(
  zustandConsoleMiddleware((set, get) => ({
    tenants: superAdminService.getTenants(),
    selectedTenantId: 'tenant-01',
    users: superAdminService.getUsersByTenant('tenant-01'),
    isLoading: false,

    loadTenants: () => {
      set({ tenants: superAdminService.getTenants() });
    },

    selectTenant: (id: string) => {
      set({
        selectedTenantId: id,
        users: superAdminService.getUsersByTenant(id),
      });
    },

    toggleTenantStatus: (id: string) => {
      const updated = superAdminService.toggleTenantStatus(id);
      if (updated) {
        set({
          tenants: get().tenants.map((t) => (t.id === id ? updated : t)),
        });
      }
    },

    loadUsers: (tenantId?: string) => {
      const targetId = tenantId ?? get().selectedTenantId ?? undefined;
      set({ users: superAdminService.getUsersByTenant(targetId) });
    },
  }))
);
