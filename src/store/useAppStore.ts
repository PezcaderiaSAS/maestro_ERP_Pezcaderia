import { create } from 'zustand';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

export type UserRole = 'admin' | 'vendedor' | 'bodega' | 'administrativo';

interface AppState {
  userRole: UserRole;
  currentView: string;
  sidebarOpen: boolean;
  setUserRole: (role: UserRole) => void;
  setCurrentView: (view: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const initialRole = localDb.load<UserRole>('role', 'admin');

export const useAppStore = create<AppState>()(
  zustandConsoleMiddleware((set) => ({
  userRole: initialRole,
  currentView: 'dashboard',
  sidebarOpen: false,

  setUserRole: (role) => {
    localDb.save('role', role);
    set({ userRole: role });
  },

  setCurrentView: (view) => set({ currentView: view, sidebarOpen: false }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  })));
