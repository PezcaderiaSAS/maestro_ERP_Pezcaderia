import { create } from 'zustand';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

export type UserRole = 'admin' | 'vendedor' | 'bodega' | 'administrativo';
export type ThemeMode = 'pezcaderia-glass' | 'hyper-cobalt' | 'carbon-teal' | 'chrome-violet' | 'legacy' | 'obsidian';

interface AppState {
  userRole: UserRole;
  currentView: string;
  sidebarOpen: boolean;
  theme: ThemeMode;
  setUserRole: (role: UserRole) => void;
  setCurrentView: (view: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const rawSavedTheme = localDb.load<string>('theme', 'pezcaderia-glass');
const initialRole = localDb.load<UserRole>('role', 'admin');
const validThemes: ThemeMode[] = ['pezcaderia-glass', 'hyper-cobalt', 'carbon-teal', 'chrome-violet'];
const initialTheme: ThemeMode = validThemes.includes(rawSavedTheme as ThemeMode)
  ? (rawSavedTheme as ThemeMode)
  : 'pezcaderia-glass';

export const useAppStore = create<AppState>()(
  zustandConsoleMiddleware((set) => ({
  userRole: initialRole,
  currentView: 'dashboard',
  sidebarOpen: false,
  theme: initialTheme,

  setUserRole: (role) => {
    localDb.save('role', role);
    set({ userRole: role });
  },

  setCurrentView: (view) => set({ currentView: view, sidebarOpen: false }),

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
