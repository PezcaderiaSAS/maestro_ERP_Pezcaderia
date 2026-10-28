import { create } from 'zustand';
import type {
  AuthStateStatus,
  AuthUserProfile,
  TenantData,
  TenantInvitation,
  RoleRbac,
} from '../types/auth.types';
import { isSuperAdmin } from '../types/auth.types';
import type { UserRole } from './useAppStore';
import { useAppStore } from './useAppStore';
import { authService, LoginResult } from '../services/authService';
import {
  tenantOnboardingService,
  ResultadoTenantOnboarding,
  ResultadoInvitacion,
  ResultadoCanje,
} from '../services/tenantOnboardingService';
import { superAdminService } from '../services/superAdminService';
import { useSuperAdminStore } from './useSuperAdminStore';
import { ferreteriaJosaseService } from '../services/ferreteriaJosaseService';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { getSupabaseClient } from '../lib/supabase';

/**
 * Traduce el rol RBAC granular de SPEC-035 al UserRole operativo canónico de useAppStore
 */
export function mapRoleRbacToUserRole(role: RoleRbac): UserRole {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'vendedor':
    case 'cajero':
      return 'vendedor';
    case 'bodeguero':
      return 'bodega';
    case 'supervisor':
    case 'contador':
    default:
      return 'administrativo';
  }
}

export interface AuthState {
  status: AuthStateStatus;
  currentUser: AuthUserProfile | null;
  activeTenant: TenantData | null;
  token: string | null;
  pendingInviteToken: string | null;
  isLoading: boolean;
  error: string | null;
  tenantInvitations: TenantInvitation[];
  isTenantSelectorOpen: boolean;

  // Acciones
  setSession: (session: {
    status: AuthStateStatus;
    user?: AuthUserProfile | null;
    currentUser?: AuthUserProfile | null;
    activeTenant?: TenantData | null;
    token?: string | null;
  }) => void;
  initSession: () => Promise<void>;
  loginWithProvider: (
    provider: 'google' | 'azure',
    mockData?: { email: string; nombre: string; rol?: RoleRbac }
  ) => Promise<LoginResult>;
  loginWithEmail: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    razonSocial: string;
    nit: string;
    ciudad: string;
    direccion?: string;
    telefono: string;
    regimenTributario?: string;
  }) => Promise<ResultadoTenantOnboarding>;
  sendInvitation: (data: {
    nombre: string;
    email: string;
    rol: RoleRbac;
  }) => Promise<ResultadoInvitacion>;
  loadTenantInvitations: () => void;
  acceptInvitation: (token: string) => Promise<ResultadoCanje>;
  setPendingInviteToken: (token: string | null) => void;
  switchRoleDev: (role: RoleRbac) => void;
  setTenantSelectorOpen: (open: boolean) => void;
  switchTenant: (tenant: TenantData | {
    id: string;
    razonSocial?: string;
    nombre?: string;
    nit?: string;
    ciudad?: string;
    direccion?: string;
    telefono?: string;
    regimenTributario?: string;
    activo?: boolean;
    createdAt?: string;
  }) => void;
  clearError: () => void;
}

const STORAGE_KEY = 'auth_session';

interface PersistedAuthSession {
  currentUser: AuthUserProfile | null;
  activeTenant: TenantData | null;
  status: AuthStateStatus;
}

function syncToAppStore(profile: AuthUserProfile | null) {
  if (!profile) {
    useAppStore.getState().logoutUser();
    return;
  }

  const mappedRole = mapRoleRbacToUserRole(profile.rol || 'admin');
  useAppStore.getState().setCurrentUser({
    empleadoId: profile.id,
    nombre: profile.nombre,
    identificacion: profile.email,
    cargo: profile.rol ? profile.rol.toUpperCase() : 'ADMINISTRADOR',
    rol: mappedRole,
    turnoIniciadoAt: new Date().toISOString(),
  });
  useAppStore.getState().setUserRole(mappedRole);
}

const savedSession = localDb.load<PersistedAuthSession | null>(STORAGE_KEY, null);

export const useAuthStore = create<AuthState>()(
  zustandConsoleMiddleware((set, get) => ({
    status: savedSession?.status || 'unauthenticated',
    currentUser: savedSession?.currentUser || null,
    activeTenant: savedSession?.activeTenant || null,
    token: null,
    pendingInviteToken: null,
    isLoading: false,
    error: null,
    tenantInvitations: [],
    isTenantSelectorOpen: false,

    setSession: (session) => {
      const user = session.user || session.currentUser || null;
      set({
        status: session.status,
        currentUser: user,
        activeTenant: session.activeTenant || null,
        token: session.token || null,
        isLoading: false,
        error: null,
      });
      syncToAppStore(user);
    },

    initSession: async () => {
      const persisted = localDb.load<PersistedAuthSession | null>(STORAGE_KEY, null);
      if (persisted && persisted.currentUser && persisted.status === 'authenticated') {
        set({
          status: 'authenticated',
          currentUser: persisted.currentUser,
          activeTenant: persisted.activeTenant,
        });
        syncToAppStore(persisted.currentUser);
        return;
      }

      // Sincronización automática de sesión Supabase (retorno de OAuth callback / Google)
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const supaUser = data.session.user;
          const userEmail = supaUser.email || '';

          let tenantId = 'tenant-01';
          let rol: RoleRbac = 'admin';
          const isSuper = isSuperAdmin(userEmail);

          const tenantStatus = tenantOnboardingService.verificarEstadoUsuario(supaUser.id);
          if (tenantStatus.tieneEmpresa && tenantStatus.tenantId) {
            tenantId = tenantStatus.tenantId;
            rol = tenantStatus.rol || 'admin';
          }

          const profile: AuthUserProfile = {
            id: supaUser.id,
            email: userEmail,
            nombre: supaUser.user_metadata?.full_name || userEmail.split('@')[0],
            avatarUrl: supaUser.user_metadata?.avatar_url,
            authProvider: 'google',
            rol,
            tenantId,
            isSuperAdmin: isSuper,
          };

          const sessionData: PersistedAuthSession = {
            currentUser: profile,
            activeTenant: get().activeTenant,
            status: 'authenticated',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'authenticated',
            currentUser: profile,
            isLoading: false,
          });
          syncToAppStore(profile);
        }
      } catch (err) {
        console.warn('Advertencia al sincronizar sesión Supabase:', err);
      }
    },

    loginWithProvider: async (provider, mockData) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.loginWithProvider(provider, mockData);
        if (!result.ok || !result.user) {
          set({ isLoading: false, error: result.error || 'Error al autenticar' });
          return result;
        }

        const user = result.user;

        // Bypass UltraAdministrador Global GOD_MODE (pezcaderia.2022@gmail.com)
        if (isSuperAdmin(user.email)) {
          const allTenants = superAdminService.getTenants();
          const defaultTenantConfig = allTenants[0];
          const activeTenantData: TenantData = get().activeTenant || {
            id: defaultTenantConfig.id,
            razonSocial: defaultTenantConfig.razonSocial || defaultTenantConfig.nombre,
            nit: defaultTenantConfig.nit,
            ciudad: 'Bucaramanga',
            telefono: defaultTenantConfig.contactoTelefono || '3101234567',
            activo: true,
            createdAt: defaultTenantConfig.createdAt,
          };

          const updatedUser: AuthUserProfile = {
            ...user,
            tenantId: activeTenantData.id,
            rol: 'admin',
            isOwner: true,
            isSuperAdmin: true,
          };

          const sessionData: PersistedAuthSession = {
            currentUser: updatedUser,
            activeTenant: activeTenantData,
            status: 'authenticated',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'authenticated',
            currentUser: updatedUser,
            activeTenant: activeTenantData,
            isLoading: false,
          });

          useSuperAdminStore.getState().selectTenant(activeTenantData.id);
          syncToAppStore(updatedUser);
          return { ok: true, user: updatedUser };
        }

        const tenantStatus = tenantOnboardingService.verificarEstadoUsuario(user.id);

        if (tenantStatus.tieneEmpresa && tenantStatus.tenantId) {
          const updatedUser: AuthUserProfile = {
            ...user,
            tenantId: tenantStatus.tenantId,
            rol: tenantStatus.rol || 'admin',
            isOwner: tenantStatus.isOwner,
          };

          const sessionData: PersistedAuthSession = {
            currentUser: updatedUser,
            activeTenant: get().activeTenant,
            status: 'authenticated',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'authenticated',
            currentUser: updatedUser,
            isLoading: false,
          });

          syncToAppStore(updatedUser);
          return { ok: true, user: updatedUser };
        } else {
          // El usuario es nuevo o no tiene empresa asignada
          const sessionData: PersistedAuthSession = {
            currentUser: user,
            activeTenant: null,
            status: 'needs_onboarding',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'needs_onboarding',
            currentUser: user,
            activeTenant: null,
            isLoading: false,
          });

          return { ok: true, user };
        }
      } catch (err: any) {
        const msg = err.message || 'Error inesperado al iniciar sesión';
        set({ isLoading: false, error: msg });
        return { ok: false, error: msg };
      }
    },

    loginWithEmail: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.loginWithEmail(email, password);
        if (!result.ok || !result.user) {
          set({ isLoading: false, error: result.error || 'Credenciales inválidas' });
          return result;
        }

        const user = result.user;

        // Bypass UltraAdministrador Global GOD_MODE (pezcaderia.2022@gmail.com)
        if (isSuperAdmin(user.email)) {
          const allTenants = superAdminService.getTenants();
          const defaultTenantConfig = allTenants[0];
          const activeTenantData: TenantData = get().activeTenant || {
            id: defaultTenantConfig.id,
            razonSocial: defaultTenantConfig.razonSocial || defaultTenantConfig.nombre,
            nit: defaultTenantConfig.nit,
            ciudad: 'Bucaramanga',
            telefono: defaultTenantConfig.contactoTelefono || '3101234567',
            activo: true,
            createdAt: defaultTenantConfig.createdAt,
          };

          const updatedUser: AuthUserProfile = {
            ...user,
            tenantId: activeTenantData.id,
            rol: 'admin',
            isOwner: true,
            isSuperAdmin: true,
          };

          const sessionData: PersistedAuthSession = {
            currentUser: updatedUser,
            activeTenant: activeTenantData,
            status: 'authenticated',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'authenticated',
            currentUser: updatedUser,
            activeTenant: activeTenantData,
            isLoading: false,
          });

          useSuperAdminStore.getState().selectTenant(activeTenantData.id);
          syncToAppStore(updatedUser);
          return { ok: true, user: updatedUser };
        }

        const tenantStatus = tenantOnboardingService.verificarEstadoUsuario(user.id);

        if (tenantStatus.tieneEmpresa && tenantStatus.tenantId) {
          const updatedUser: AuthUserProfile = {
            ...user,
            tenantId: tenantStatus.tenantId,
            rol: tenantStatus.rol || 'admin',
            isOwner: tenantStatus.isOwner,
          };

          const sessionData: PersistedAuthSession = {
            currentUser: updatedUser,
            activeTenant: get().activeTenant,
            status: 'authenticated',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'authenticated',
            currentUser: updatedUser,
            isLoading: false,
          });

          syncToAppStore(updatedUser);
          return { ok: true, user: updatedUser };
        } else {
          const sessionData: PersistedAuthSession = {
            currentUser: user,
            activeTenant: null,
            status: 'needs_onboarding',
          };
          localDb.save(STORAGE_KEY, sessionData);

          set({
            status: 'needs_onboarding',
            currentUser: user,
            activeTenant: null,
            isLoading: false,
          });

          return { ok: true, user };
        }
      } catch (err: any) {
        const msg = err.message || 'Error al autenticar por correo';
        set({ isLoading: false, error: msg });
        return { ok: false, error: msg };
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await authService.logout();
      } catch (err) {
        console.warn('Advertencia durante logout en authService:', err);
      }
      localDb.remove(STORAGE_KEY);
      localDb.remove('currentUser');
      localDb.remove('role');
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch {}
      set({
        status: 'unauthenticated',
        currentUser: null,
        activeTenant: null,
        token: null,
        isLoading: false,
        error: null,
        tenantInvitations: [],
      });
      syncToAppStore(null);
    },

    completeOnboarding: async (data) => {
      const { currentUser } = get();
      if (!currentUser) {
        return { ok: false, error: 'No hay usuario autenticado' };
      }

      set({ isLoading: true, error: null });
      const result = await tenantOnboardingService.crearPrimerTenantConAdmin({
        userId: currentUser.id,
        userEmail: currentUser.email,
        ...data,
      });

      if (!result.ok || !result.tenant || !result.membership) {
        set({ isLoading: false, error: result.error || 'Error en el onboarding' });
        return result;
      }

      const updatedUser: AuthUserProfile = {
        ...currentUser,
        tenantId: result.tenant.id,
        rol: result.membership.role,
        isOwner: result.membership.isOwner,
      };

      const sessionData: PersistedAuthSession = {
        currentUser: updatedUser,
        activeTenant: result.tenant,
        status: 'authenticated',
      };
      localDb.save(STORAGE_KEY, sessionData);

      set({
        status: 'authenticated',
        currentUser: updatedUser,
        activeTenant: result.tenant,
        isLoading: false,
      });

      syncToAppStore(updatedUser);
      return result;
    },

    sendInvitation: async (data) => {
      const { currentUser, activeTenant } = get();
      if (!currentUser || !activeTenant) {
        return { ok: false, error: 'Debe haber un tenant activo para enviar invitaciones' };
      }

      const result = await tenantOnboardingService.crearInvitacionEmpleado({
        tenantId: activeTenant.id,
        invitedByUserId: currentUser.id,
        ...data,
      });

      if (result.ok && result.invitation) {
        set((state) => ({
          tenantInvitations: [...state.tenantInvitations, result.invitation!],
        }));
      }

      return result;
    },

    loadTenantInvitations: () => {
      const { activeTenant } = get();
      if (!activeTenant) {
        set({ tenantInvitations: [] });
        return;
      }
      const list = tenantOnboardingService.obtenerInvitacionesPorTenant(activeTenant.id);
      set({ tenantInvitations: list });
    },

    acceptInvitation: async (token) => {
      const { currentUser } = get();
      if (!currentUser) {
        return { ok: false, error: 'Debe iniciar sesión para canjear una invitación' };
      }

      set({ isLoading: true, error: null });
      const result = await tenantOnboardingService.canjearInvitacion({
        token,
        userId: currentUser.id,
        userEmail: currentUser.email,
      });

      if (!result.ok || !result.membership) {
        set({ isLoading: false, error: result.error || 'Error al canjear invitación' });
        return result;
      }

      const updatedUser: AuthUserProfile = {
        ...currentUser,
        tenantId: result.membership.tenantId,
        rol: result.membership.role,
        isOwner: result.membership.isOwner,
      };

      const sessionData: PersistedAuthSession = {
        currentUser: updatedUser,
        activeTenant: get().activeTenant,
        status: 'authenticated',
      };
      localDb.save(STORAGE_KEY, sessionData);

      set({
        status: 'authenticated',
        currentUser: updatedUser,
        pendingInviteToken: null,
        isLoading: false,
      });

      syncToAppStore(updatedUser);
      return result;
    },

    setPendingInviteToken: (token) => {
      set({ pendingInviteToken: token });
    },

    switchRoleDev: (role: RoleRbac) => {
      const { currentUser } = get();
      if (!currentUser) return;

      const updatedUser: AuthUserProfile = {
        ...currentUser,
        rol: role,
      };

      set({ currentUser: updatedUser });
      syncToAppStore(updatedUser);
    },

    setTenantSelectorOpen: (open: boolean) => {
      set({ isTenantSelectorOpen: open });
    },

    switchTenant: (tenantInput) => {
      const normTenant: TenantData = {
        id: tenantInput.id,
        razonSocial: tenantInput.razonSocial || (tenantInput as any).nombre || 'Empresa',
        nit: tenantInput.nit || '',
        ciudad: tenantInput.ciudad || 'Bucaramanga',
        direccion: tenantInput.direccion,
        telefono: tenantInput.telefono || '',
        regimenTributario: tenantInput.regimenTributario || 'COMUN',
        activo: tenantInput.activo ?? true,
        createdAt: tenantInput.createdAt || new Date().toISOString(),
      };

      const current = get().currentUser;
      const updatedUser: AuthUserProfile | null = current
        ? {
            ...current,
            tenantId: normTenant.id,
          }
        : null;

      const sessionData: PersistedAuthSession = {
        currentUser: updatedUser,
        activeTenant: normTenant,
        status: get().status,
      };
      localDb.save(STORAGE_KEY, sessionData);

      set({
        activeTenant: normTenant,
        currentUser: updatedUser,
        isTenantSelectorOpen: false,
      });

      useSuperAdminStore.getState().selectTenant(normTenant.id);

      if (normTenant.id === 'tenant-03') {
        ferreteriaJosaseService.applyToStores().catch((err) => {
          console.warn('Error aplicando catálogo Ferretería Josase:', err);
        });
      }
    },

    clearError: () => set({ error: null }),
  }))
);
