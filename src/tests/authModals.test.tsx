import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TenantOnboardingModal } from '../views/auth/components/TenantOnboardingModal';
import { EmployeeInviteModal } from '../views/auth/components/EmployeeInviteModal';
import { useAuthStore } from '../store/useAuthStore';
import { tenantOnboardingService } from '../services/tenantOnboardingService';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true })),
  },
}));

describe('TASK-035-05: Modales de Onboarding de Empresa e Invitación de Empleados Suite', () => {
  beforeEach(() => {
    tenantOnboardingService.limpiarEstadoPruebas();
    useAuthStore.setState({
      status: 'needs_onboarding',
      currentUser: {
        id: 'usr-google-owner-1',
        email: 'propietario@pezcaderia.com',
        nombre: 'Carlos Propietario',
        authProvider: 'google',
      },
      activeTenant: null,
      token: null,
      pendingInviteToken: null,
      isLoading: false,
      error: null,
      tenantInvitations: [],
    });
    vi.clearAllMocks();
  });

  describe('TenantOnboardingModal Component', () => {
    it('1. Debe renderizar el asistente de registro de empresa cuando isOpen es true', () => {
      render(<TenantOnboardingModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Configura tu Empresa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Razón Social /i)).toBeInTheDocument();
      expect(screen.getByLabelText(/NIT \/ RUT/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ciudad/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continuar al Paso 2/i })).toBeInTheDocument();
    });

    it('2. Debe avanzar al paso 2 y completar el aprovisionamiento de empresa y bodega', async () => {
      const handleClose = vi.fn();
      render(<TenantOnboardingModal isOpen={true} onClose={handleClose} />);

      // Llenar datos de paso 1
      fireEvent.change(screen.getByLabelText(/Razón Social /i), {
        target: { value: 'Comercializadora Marina S.A.S.' },
      });
      fireEvent.change(screen.getByLabelText(/NIT \/ RUT/i), {
        target: { value: '901.555.666-2' },
      });
      fireEvent.change(screen.getByLabelText(/Ciudad/i), {
        target: { value: 'Cartagena' },
      });
      fireEvent.change(screen.getByLabelText(/Teléfono/i), {
        target: { value: '3007654321' },
      });

      // Avanzar a paso 2
      fireEvent.click(screen.getByRole('button', { name: /Continuar al Paso 2/i }));

      // Verificar paso 2
      expect(screen.getByText(/Aprovisionamiento Automático/i)).toBeInTheDocument();
      expect(screen.getByText(/Bodega Principal/i)).toBeInTheDocument();
      expect(screen.getByText(/Caja General/i)).toBeInTheDocument();

      // Confirmar creación
      const btnCrear = screen.getByRole('button', { name: /Crear Empresa y Comenzar/i });
      fireEvent.click(btnCrear);

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.status).toBe('authenticated');
        expect(state.activeTenant?.razonSocial).toBe('Comercializadora Marina S.A.S.');
        expect(state.currentUser?.rol).toBe('admin');
        expect(state.currentUser?.isOwner).toBe(true);
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('EmployeeInviteModal Component', () => {
    beforeEach(() => {
      // Estado autenticado con tenant activo
      useAuthStore.setState({
        status: 'authenticated',
        currentUser: {
          id: 'usr-admin-1',
          email: 'admin@pezcaderia.com',
          nombre: 'Admin Principal',
          authProvider: 'google',
          rol: 'admin',
          isOwner: true,
        },
        activeTenant: {
          id: 'ten-pezca-01',
          razonSocial: 'La Pezcadería del Mar S.A.S.',
          nit: '900.123.456-7',
          ciudad: 'Bucaramanga',
          telefono: '3151234567',
          activo: true,
          createdAt: new Date().toISOString(),
        },
      });
    });

    it('3. Debe renderizar el formulario para invitar colaboradores', () => {
      render(<EmployeeInviteModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Invitar Colaborador al Equipo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Rol Autorizado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generar Enlace de Invitación/i })).toBeInTheDocument();
    });

    it('4. Debe emitir la invitación y generar un enlace seguro copiable', async () => {
      render(<EmployeeInviteModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.change(screen.getByLabelText(/Nombre Completo/i), {
        target: { value: 'Mateo Cajero' },
      });
      fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
        target: { value: 'mateo.cajero@pezcaderia.com' },
      });
      fireEvent.change(screen.getByLabelText(/Rol Autorizado/i), {
        target: { value: 'cajero' },
      });

      const btnGenerar = screen.getByRole('button', { name: /Generar Enlace de Invitación/i });
      fireEvent.click(btnGenerar);

      await waitFor(() => {
        expect(screen.getByText(/¡Enlace de Invitación Generado!/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Copiar Enlace/i })).toBeInTheDocument();
        expect(useAuthStore.getState().tenantInvitations).toHaveLength(1);
        expect(useAuthStore.getState().tenantInvitations[0].email).toBe('mateo.cajero@pezcaderia.com');
      });
    });
  });
});
