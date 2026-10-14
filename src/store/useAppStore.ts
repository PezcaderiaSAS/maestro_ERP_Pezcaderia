import { create } from 'zustand';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { AppRouteId, type ERPViewKey } from '../routes/AppRoute';
import { type ActiveUserSession, DEFAULT_INITIAL_SELLERS } from '../utils/roleMapper';

export type UserRole = 'admin' | 'vendedor' | 'bodega' | 'administrativo';
export type ThemeMode = 'pezcaderia-glass' | 'hyper-cobalt' | 'carbon-teal' | 'chrome-violet' | 'legacy' | 'obsidian';

interface AppState {
  userRole: UserRole;
  currentUser: ActiveUserSession | null;
  currentView: AppRouteId | ERPViewKey;
  currentRouteParams?: Record<string, any>;
  sidebarOpen: boolean;
  theme: ThemeMode;
  setUserRole: (role: UserRole) => void;
  setCurrentUser: (user: ActiveUserSession) => void;
  logoutUser: () => void;
  setCurrentView: (view: AppRouteId | ERPViewKey, params?: Record<string, any>) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const rawSavedTheme = localDb.load<string>('theme', 'pezcaderia-glass');
const initialUser = localDb.load<ActiveUserSession | null>('currentUser', DEFAULT_INITIAL_SELLERS[0]);
const initialRole = initialUser?.rol || localDb.load<UserRole>('role', 'admin');
const validThemes: ThemeMode[] = ['pezcaderia-glass', 'hyper-cobalt', 'carbon-teal', 'chrome-violet'];
const initialTheme: ThemeMode = validThemes.includes(rawSavedTheme as ThemeMode)
  ? (rawSavedTheme as ThemeMode)
  : 'pezcaderia-glass';

export const useAppStore = create<AppState>()(
  zustandConsoleMiddleware((set) => ({
  userRole: initialRole,
  currentUser: initialUser,
  currentView: 'dashboard',
  sidebarOpen: false,
  theme: initialTheme,

  setUserRole: (role) => {
    localDb.save('role', role);
    set((state) => ({
      userRole: role,
      currentUser: state.currentUser ? { ...state.currentUser, rol: role } : null,
    }));
  },

  setCurrentUser: (user) => {
    localDb.save('currentUser', user);
    localDb.save('role', user.rol);
    set({ currentUser: user, userRole: user.rol });
  },

  logoutUser: () => {
    localDb.remove('currentUser');
    set({ currentUser: null });
  },

  setCurrentView: (view, params) => set({ currentView: view, currentRouteParams: params, sidebarOpen: false }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (newTheme: ThemeMode) => {
    localDb.save('theme', newTheme);
    set({ theme: newTheme });
  },

  toggleTheme: () => set((state) => {
    const themeCycle: ThemeMode[] = ['pezcaderia-glass', 'hyper-cobalt', 'carbon-teal', 'chrome-violet'];
    const currentIndex = themeCycle.indexOf(state.theme as any);
    const nextTheme = currentIndex >= 0 ? themeCycle[(currentIndex + 1) % themeCycle.length] : 'pezcaderia-glass';
    localDb.save('theme', nextTheme);
    return { theme: nextTheme };
  }),
  })));
