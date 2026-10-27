import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TenantOnboardingWizard } from '../views/auth/components/TenantOnboardingWizard';
import { tenantOnboardingService } from '../services/tenantOnboardingService';

describe('TASK-036-03: TenantOnboardingWizard - Registro en 2 Pasos', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe renderizar el Paso 1 (Datos de la Empresa) con sus campos obligatorios', () => {
    render(<TenantOnboardingWizard onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText(/Registro de Nueva Empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/Paso 1: Datos de la Empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Razón Social/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/NIT \/ RUT/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ciudad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono Comercial/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar a Datos del Administrador/i })).toBeInTheDocument();
  });

  it('2. Debe validar los campos del Paso 1 antes de permitir avanzar al Paso 2', async () => {
    render(<TenantOnboardingWizard onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nextBtn = screen.getByRole('button', { name: /Continuar a Datos del Administrador/i });
    fireEvent.click(nextBtn);

    // No debe avanzar al paso 2 si los campos están vacíos
    expect(screen.queryByText(/Paso 2: Datos del Administrador/i)).not.toBeInTheDocument();

    // Diligenciar datos válidos del Paso 1
    fireEvent.change(screen.getByLabelText(/Razón Social/i), {
      target: { value: 'Comercializadora del Mar SAS' },
    });
    fireEvent.change(screen.getByLabelText(/NIT \/ RUT/i), {
      target: { value: '900987654-1' },
    });
    fireEvent.change(screen.getByLabelText(/Ciudad/i), {
      target: { value: 'Cartagena' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono Comercial/i), {
      target: { value: '3157890123' },
    });

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/Paso 2: Datos del Administrador/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Nombre y Apellidos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cédula de Ciudadanía/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo de Inicio de Sesión/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Celular de Contacto/i)).toBeInTheDocument();
  });

  it('3. Debe permitir regresar del Paso 2 al Paso 1 conservando la información ingresada', async () => {
    render(<TenantOnboardingWizard onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByLabelText(/Razón Social/i), {
      target: { value: 'Ferretería Central SAS' },
    });
    fireEvent.change(screen.getByLabelText(/NIT \/ RUT/i), {
      target: { value: '800123456-7' },
    });
    fireEvent.change(screen.getByLabelText(/Ciudad/i), {
      target: { value: 'Bogotá' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono Comercial/i), {
      target: { value: '3104567890' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Continuar a Datos del Administrador/i }));

    await waitFor(() => {
      expect(screen.getByText(/Paso 2: Datos del Administrador/i)).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Volver al Paso 1/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText(/Paso 1: Datos de la Empresa/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ferretería Central SAS')).toBeInTheDocument();
    });
  });

  it('4. Debe completar el registro y disparar onSuccess al guardar el Paso 2', async () => {
    vi.spyOn(tenantOnboardingService, 'crearTenantConAdmin').mockResolvedValueOnce({
      ok: true,
      tenant: {
        id: 'tenant-test-123',
        razonSocial: 'Comercializadora del Mar SAS',
        nit: '900987654-1',
        ciudad: 'Cartagena',
        telefono: '3157890123',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      bodegaPrincipalId: 'bodega-1',
      cajaPrincipalCodigo: 'CAJA-01',
    });

    render(<TenantOnboardingWizard onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Paso 1
    fireEvent.change(screen.getByLabelText(/Razón Social/i), {
      target: { value: 'Comercializadora del Mar SAS' },
    });
    fireEvent.change(screen.getByLabelText(/NIT \/ RUT/i), {
      target: { value: '900987654-1' },
    });
    fireEvent.change(screen.getByLabelText(/Ciudad/i), {
      target: { value: 'Cartagena' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono Comercial/i), {
      target: { value: '3157890123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Continuar a Datos del Administrador/i }));

    await waitFor(() => {
      expect(screen.getByText(/Paso 2: Datos del Administrador/i)).toBeInTheDocument();
    });

    // Paso 2
    fireEvent.change(screen.getByLabelText(/Nombre y Apellidos/i), {
      target: { value: 'Carlos Mendoza' },
    });
    fireEvent.change(screen.getByLabelText(/Cédula de Ciudadanía/i), {
      target: { value: '1098765432' },
    });
    fireEvent.change(screen.getByLabelText(/Correo de Inicio de Sesión/i), {
      target: { value: 'admin@delmar.com' },
    });
    fireEvent.change(screen.getByLabelText(/Celular de Contacto/i), {
      target: { value: '3159998877' },
    });

    const submitBtn = screen.getByRole('button', { name: /Finalizar Registro y Crear Empresa/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-test-123',
          razonSocial: 'Comercializadora del Mar SAS',
        })
      );
    });
  });
});
