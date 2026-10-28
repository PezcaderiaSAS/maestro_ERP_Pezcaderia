import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginView } from '../views/auth/LoginView';
import { authService } from '../services/authService';
import { userManagementService } from '../services/userManagementService';
import { useAuthStore } from '../store/useAuthStore';

describe('TASK-036-04: LoginView Dual & Modal de Cambio Obligatorio de Contraseña', () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      status: 'unauthenticated',
      currentUser: null,
      activeTenant: null,
      token: null,
    });
  });

  it('1. Debe renderizar la pestaña de Iniciar Sesión por defecto con sus campos y opciones OAuth', () => {
    render(<LoginView onLoginSuccess={mockOnLoginSuccess} />);

    expect(screen.getByText(/La Pezcadería ERP/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Iniciar Sesión$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Registrar Empresa$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
  });

  it('2. Debe alternar a la pestaña de Registrar Empresa al hacer clic en el toggle superior', async () => {
    render(<LoginView onLoginSuccess={mockOnLoginSuccess} />);

    const registerTab = screen.getByRole('button', { name: /^Registrar Empresa$/i });
    fireEvent.click(registerTab);

    await waitFor(() => {
      expect(screen.getByText(/Registro de Nueva Empresa/i)).toBeInTheDocument();
      expect(screen.getByText(/Paso 1: Datos de la Empresa/i)).toBeInTheDocument();
    });
  });

  it('3. Debe iniciar sesión exitosamente si el usuario no requiere cambio de contraseña', async () => {
    vi.spyOn(authService, 'loginWithEmail').mockResolvedValueOnce({
      ok: true,
      user: {
        id: 'usr-regular-1',
        email: 'regular@pezcaderia.com',
        nombre: 'Usuario Regular',
        authProvider: 'email',
        rol: 'vendedor',
      },
    });

    vi.spyOn(userManagementService, 'obtenerUsuarioPorId').mockReturnValueOnce({
      id: 'usr-regular-1',
      tenantId: 'tenant-1',
      nombre: 'Usuario Regular',
      identificacion: '12345678',
      email: 'regular@pezcaderia.com',
      telefono: '3101112233',
      rol: 'VENDEDOR',
      permisos: {},
      mustChangePassword: false,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<LoginView onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'regular@pezcaderia.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'PasswordSegura2026' },
    });

    const submitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'regular@pezcaderia.com',
        })
      );
    });
  });

  it('4. Debe bloquear el acceso y desplegar MandatoryChangePasswordModal si mustChangePassword === true', async () => {
    vi.spyOn(authService, 'loginWithEmail').mockResolvedValueOnce({
      ok: true,
      user: {
        id: 'usr-nuevo-2',
        email: 'nuevo@pezcaderia.com',
        nombre: 'Empleado Nuevo',
        authProvider: 'email',
        rol: 'cajero',
      },
    });

    vi.spyOn(userManagementService, 'obtenerUsuarioPorId').mockReturnValueOnce({
      id: 'usr-nuevo-2',
      tenantId: 'tenant-1',
      nombre: 'Empleado Nuevo',
      identificacion: '87654321',
      email: 'nuevo@pezcaderia.com',
      telefono: '3109998877',
      rol: 'CAJERO',
      permisos: {},
      mustChangePassword: true, // Debe forzar cambio
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const spyUpdatePassword = vi.spyOn(userManagementService, 'actualizarPasswordInicial').mockResolvedValueOnce({
      ok: true,
      usuario: {
        id: 'usr-nuevo-2',
        tenantId: 'tenant-1',
        nombre: 'Empleado Nuevo',
        identificacion: '87654321',
        email: 'nuevo@pezcaderia.com',
        telefono: '3109998877',
        rol: 'CAJERO',
        permisos: {},
        mustChangePassword: false,
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<LoginView onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'nuevo@pezcaderia.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: '87654321' }, // Cédula como password
    });

    const loginSubmitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });
    fireEvent.click(loginSubmitBtn);

    // Debe abrir el modal de cambio forzoso y NO haber llamado aún a onLoginSuccess
    await waitFor(() => {
      expect(screen.getByText(/Actualización Obligatoria de Contraseña/i)).toBeInTheDocument();
    });
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();

    // Diligenciar nueva contraseña en el modal
    fireEvent.change(screen.getByLabelText(/Nueva Contraseña Segura/i), {
      target: { value: 'MiClaveSegura2026' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar Nueva Contraseña/i), {
      target: { value: 'MiClaveSegura2026' },
    });

    const updatePwdBtn = screen.getByRole('button', { name: /Actualizar Contraseña e Ingresar/i });
    fireEvent.click(updatePwdBtn);

    await waitFor(() => {
      expect(spyUpdatePassword).toHaveBeenCalledWith(
        'usr-nuevo-2',
        'MiClaveSegura2026',
        'MiClaveSegura2026'
      );
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('5. Debe manejar el error de proveedor OAuth no habilitado sin romper la UI y mostrando mensaje explicativo', async () => {
    vi.spyOn(useAuthStore.getState(), 'loginWithProvider').mockResolvedValueOnce({
      ok: false,
      error: 'El proveedor GOOGLE no está activado en Supabase (Unsupported provider: provider is not enabled).',
    });

    render(<LoginView onLoginSuccess={mockOnLoginSuccess} />);

    const googleBtn = screen.getByRole('button', { name: /Continuar con Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/El proveedor GOOGLE no está activado en Supabase/i)
      ).toBeInTheDocument();
    });
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('6. Debe autocompletar credenciales al hacer clic en un acceso rápido demo', () => {
    render(<LoginView onLoginSuccess={mockOnLoginSuccess} />);

    const btnSuperAdmin = screen.getByRole('button', { name: /SuperAdmin/i });
    fireEvent.click(btnSuperAdmin);

    const emailInput = screen.getByLabelText(/Correo Electrónico/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;

    expect(emailInput.value).toBe('pezcaderia.2022@gmail.com');
    expect(passwordInput.value).toBe('admin123');
  });
});
