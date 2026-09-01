import { create } from 'zustand';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

export type UserRole = 'admin' | 'vendedor' | 'bodega' | 'administrativo';

interface AppState {
  userRole: UserRole;
  currentView: string;
  sidebarOpen: boolean;
  theme: 'legacy' | 'obsidian';
  setUserRole: (role: UserRole) => void;
  setCurrentView: (view: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
}

const initialRole = localDb.load<UserRole>('role', 'admin');
const initialTheme = localDb.load<'legacy' | 'obsidian'>('theme', 'legacy');

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

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'legacy' ? 'obsidian' : 'legacy';
    localDb.save('theme', newTheme);
    return { theme: newTheme };
  }),
  })));
