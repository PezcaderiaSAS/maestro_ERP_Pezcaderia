import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginView } from '../views/auth/LoginView';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true })),
  },
}));

describe('TASK-035-04: LoginView & DevFastLoginDrawer Suite', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'unauthenticated',
      currentUser: null,
      activeTenant: null,
      token: null,
      pendingInviteToken: null,
      isLoading: false,
      error: null,
      tenantInvitations: [],
    });
    vi.clearAllMocks();
  });

  it('1. Debe renderizar la pantalla de bienvenida con botón Google OAuth y campos de correo', () => {
    render(<LoginView />);

    expect(screen.getByText(/La Pezcadería ERP/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nombre@empresa\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al Sistema/i })).toBeInTheDocument();
  });

  it('2. Debe detectar e informar si hay una invitación pendiente en la URL', () => {
    // Simular que el store tiene pendingInviteToken
    useAuthStore.setState({ pendingInviteToken: 'inv-tok-12345' });

    render(<LoginView />);

    expect(screen.getByText(/Invitación de Colaborador Detectada/i)).toBeInTheDocument();
    expect(screen.getByText(/Inicia sesión con tu cuenta para unirte al equipo/i)).toBeInTheDocument();
  });

  it('3. Debe renderizar el cajón de desarrollo DevFastLoginDrawer con los roles de prueba', () => {
    render(<LoginView isDevMode={true} devDrawerDefaultOpen={true} />);

    expect(screen.getByText(/Dev Acceso Rápido/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin Propietario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vendedor Mostrador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cajero Principal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Supervisor Garantías/i })).toBeInTheDocument();
  });

  it('4. Al hacer clic en un rol del DevDrawer, debe autenticar y sincronizar con useAppStore', async () => {
    render(<LoginView isDevMode={true} devDrawerDefaultOpen={true} />);

    const btnCajero = screen.getByRole('button', { name: /Cajero Principal/i });
    fireEvent.click(btnCajero);

    await waitFor(() => {
      const authState = useAuthStore.getState();
      expect(authState.status).not.toBe('unauthenticated');
      expect(authState.currentUser?.rol).toBe('cajero');

      // Sincronización en useAppStore
      const appState = useAppStore.getState();
      expect(appState.userRole).toBe('vendedor'); // Cajero mapea a rol vendedor en useAppStore
    });
  });
});
