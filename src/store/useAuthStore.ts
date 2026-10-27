import { create } from 'zustand';
import type {
  AuthStateStatus,
  AuthUserProfile,
  TenantData,
  TenantInvitation,
  RoleRbac,
} from '../types/auth.types';
import type { UserRole } from './useAppStore';
import { useAppStore } from './useAppStore';
import { authService, LoginResult } from '../services/authService';
import {
  tenantOnboardingService,
  ResultadoTenantOnboarding,
  ResultadoInvitacion,
  ResultadoCanje,
} from '../services/tenantOnboardingService';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

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
  acceptInvitation: (token: string) => Promise<ResultadoCanje>;
  setPendingInviteToken: (token: string | null) => void;
  switchRoleDev: (role: RoleRbac) => void;
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
      await authService.logout();
      localDb.remove(STORAGE_KEY);
      set({
        status: 'unauthenticated',
        currentUser: null,
        activeTenant: null,
        token: null,
        isLoading: false,
        error: null,
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

    clearError: () => set({ error: null }),
  }))
);
