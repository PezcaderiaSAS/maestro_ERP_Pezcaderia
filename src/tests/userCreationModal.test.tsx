import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserCreationModal } from '../views/admin/components/UserCreationModal';
import { userManagementService } from '../services/userManagementService';
import Swal from 'sweetalert2';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true })),
  },
}));

describe('TASK-036-05: UserCreationModal & Matriz de Checkboxes Personalizada', () => {
  const TENANT_ID = 'tenant-pezcaderia-01';
  const TENANT_NOMBRE = 'La Pezcaderia SAS';
  const mockOnClose = vi.fn();
  const mockOnUserCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    userManagementService.limpiarEnMemoria();
  });

  it('1. Debe renderizar el modal cuando isOpen es true con sus campos obligatorios y aviso de cédula', () => {
    render(
      <UserCreationModal
        isOpen={true}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
        tenantNombre={TENANT_NOMBRE}
        onUserCreated={mockOnUserCreated}
      />
    );

    expect(screen.getByRole('heading', { name: /Crear Nuevo Usuario/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TENANT_NOMBRE, 'i'))).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de Identificación \/ Cédula/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono \/ Celular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rol en el Sistema/i)).toBeInTheDocument();
    
    // Banner explicativo sobre la cédula como clave provisional
    expect(screen.getByText(/La cédula servirá como contraseña provisional/i)).toBeInTheDocument();

    // Botones de acción
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar y Crear Usuario/i })).toBeInTheDocument();
  });

  it('2. No debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <UserCreationModal
        isOpen={false}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('3. Debe renderizar los módulos canónicos de permisos y sus checkboxes correspondientes', () => {
    render(
      <UserCreationModal
        isOpen={true}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
      />
    );

    // Módulos canónicos
    expect(screen.getByText('Punto de Venta')).toBeInTheDocument();
    expect(screen.getByText('Caja & Tesorería')).toBeInTheDocument();
    expect(screen.getByText('Inventario & WMS')).toBeInTheDocument();
    expect(screen.getByText('Compras & Muelle')).toBeInTheDocument();
    expect(screen.getByText('Administración')).toBeInTheDocument();

    // Algunos permisos clave
    expect(screen.getByText('Acceso a Terminales POS')).toBeInTheDocument();
    expect(screen.getByText('Acceso a Caja y Turnos')).toBeInTheDocument();
    expect(screen.getByText('Ver Existencias Multibodega')).toBeInTheDocument();
  });

  it('4. Debe actualizar la selección de checkboxes al cambiar el rol seleccionado', async () => {
    render(
      <UserCreationModal
        isOpen={true}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
      />
    );

    const selectRol = screen.getByLabelText(/Rol en el Sistema/i) as HTMLSelectElement;
    const checkboxPosAccess = screen.getByTestId('checkbox-perm-pos.access') as HTMLInputElement;
    const checkboxAdminUsers = screen.getByTestId('checkbox-perm-admin.users_manage') as HTMLInputElement;

    // Cambiar a BODEGUERO
    fireEvent.change(selectRol, { target: { value: 'BODEGUERO' } });

    // BODEGUERO no tiene gestión de usuarios por defecto
    expect(checkboxAdminUsers.checked).toBe(false);

    // Cambiar a ADMINISTRADOR
    fireEvent.change(selectRol, { target: { value: 'ADMINISTRADOR' } });

    // ADMINISTRADOR debe tener activos permisos de administración y POS
    expect(checkboxPosAccess.checked).toBe(true);
    expect(checkboxAdminUsers.checked).toBe(true);
  });

  it('5. Debe permitir personalizar permisos individuales activando o desactivando checkboxes', () => {
    render(
      <UserCreationModal
        isOpen={true}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
      />
    );

    const selectRol = screen.getByLabelText(/Rol en el Sistema/i);
    fireEvent.change(selectRol, { target: { value: 'VENDEDOR' } });

    const checkboxDiscount = screen.getByTestId('checkbox-perm-pos.apply_discounts') as HTMLInputElement;
    expect(checkboxDiscount.checked).toBe(false);

    // Activar permiso especial para este vendedor
    fireEvent.click(checkboxDiscount);
    expect(checkboxDiscount.checked).toBe(true);
  });

  it('6. Debe validar los campos y mostrar alertas si hay datos incompletos o inválidos', async () => {
    render(
      <UserCreationModal
        isOpen={true}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
      />
    );

    const btnSubmit = screen.getByRole('button', { name: /Guardar y Crear Usuario/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: expect.stringMatching(/Formulario incompleto|Datos inválidos/i),
        })
      );
    });

    expect(mockOnUserCreated).not.toHaveBeenCalled();
  });

  it('7. Debe crear exitosamente el usuario, disparar Swal success y llamar a onUserCreated y onClose', async () => {
    render(
      <UserCreationModal
        isOpen={true}
        onClose={mockOnClose}
        tenantId={TENANT_ID}
        onUserCreated={mockOnUserCreated}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), {
      target: { value: 'Marcos Pescador' },
    });
    fireEvent.change(screen.getByLabelText(/Número de Identificación \/ Cédula/i), {
      target: { value: '1098765432' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'marcos@pezcaderia.com' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono \/ Celular/i), {
      target: { value: '3123456789' },
    });
    fireEvent.change(screen.getByLabelText(/Rol en el Sistema/i), {
      target: { value: 'VENDEDOR' },
    });

    // Otorgar permiso especial
    const checkboxDiscount = screen.getByTestId('checkbox-perm-pos.apply_discounts');
    fireEvent.click(checkboxDiscount);

    const btnSubmit = screen.getByRole('button', { name: /Guardar y Crear Usuario/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success',
          title: expect.stringMatching(/Usuario Creado Exitosamente/i),
        })
      );
    });

    expect(mockOnUserCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Marcos Pescador',
        identificacion: '1098765432',
        email: 'marcos@pezcaderia.com',
        rol: 'VENDEDOR',
        mustChangePassword: true,
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});

