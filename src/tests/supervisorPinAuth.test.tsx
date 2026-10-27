import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SupervisorPinModal, type SupervisorAuthResult } from '../views/pos/components/SupervisorPinModal';
import { useEmployeeStore, type Empleado } from '../store/useEmployeeStore';

describe('SupervisorPinModal - Autorización con PIN Táctil (SPEC-032: TASK-032-02)', () => {
  const mockSupervisores: Empleado[] = [
    {
      id: 'emp-admin-1',
      nombre: 'Carlos Supervisor',
      identificacion: '1098765432',
      rolAcceso: 'ADMINISTRADOR',
      cargo: 'Jefe de Operaciones',
      salarioBase: 3500000,
      fechaIngreso: '2025-01-01',
      tipoContrato: 'INDEFINIDO',
      estado: 'ACTIVO',
      prestamosActivos: 0,
      auxilioTransporte: 0,
      telefono: '3001234567',
      email: 'carlos@pezcaderia.com',
      riesgoARL: 'I',
      aplicaExoneracion: true,
      pinAcceso: '9988',
    },
    {
      id: 'emp-vendedor-1',
      nombre: 'Juan Vendedor',
      identificacion: '1122334455',
      rolAcceso: 'VENDEDOR',
      cargo: 'Vendedor Mostrador',
      salarioBase: 1500000,
      fechaIngreso: '2025-02-01',
      tipoContrato: 'INDEFINIDO',
      estado: 'ACTIVO',
      prestamosActivos: 0,
      auxilioTransporte: 162000,
      telefono: '3119876543',
      email: 'juan@pezcaderia.com',
      riesgoARL: 'I',
      aplicaExoneracion: false,
      pinAcceso: '1111',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useEmployeeStore.setState({ empleados: mockSupervisores });
  });

  it('1. Debe renderizar el modal con la descripción de la acción cuando isOpen es true', () => {
    render(
      <SupervisorPinModal
        isOpen={true}
        onClose={vi.fn()}
        accion="DESCUENTO_EXCEPCIONAL"
        descripcion="Descuento mayor al 10% en Mostrador"
        onAuthorized={vi.fn()}
      />
    );

    expect(screen.getByText(/Autorización de Supervisor/i)).toBeInTheDocument();
    expect(screen.getByText(/Descuento mayor al 10% en Mostrador/i)).toBeInTheDocument();
    expect(screen.getByTestId('supervisor-pin-keypad')).toBeInTheDocument();
  });

  it('2. Debe permitir digitar PIN mediante el teclado táctil y validar con éxito un supervisor', async () => {
    const handleAuthorized = vi.fn();

    render(
      <SupervisorPinModal
        isOpen={true}
        onClose={vi.fn()}
        accion="ANULACION_ITEM"
        descripcion="Anular ítem de la comanda TICK-042"
        onAuthorized={handleAuthorized}
      />
    );

    // Digitar PIN '9988' correspondiente al administrador 'Carlos Supervisor'
    const btn9 = screen.getByTestId('numpad-key-9');
    const btn8 = screen.getByTestId('numpad-key-8');

    fireEvent.click(btn9);
    fireEvent.click(btn9);
    fireEvent.click(btn8);
    fireEvent.click(btn8);

    // Debe invocar onAuthorized con los datos del supervisor
    expect(handleAuthorized).toHaveBeenCalledTimes(1);
    const authResult: SupervisorAuthResult = handleAuthorized.mock.calls[0][0];
    expect(authResult.supervisorId).toBe('emp-admin-1');
    expect(authResult.supervisorNombre).toBe('Carlos Supervisor');
    expect(authResult.accionAutorizada).toBe('ANULACION_ITEM');
  });

  it('3. Debe rechazar un PIN de un usuario sin rol de supervisor/admin', async () => {
    const handleAuthorized = vi.fn();

    render(
      <SupervisorPinModal
        isOpen={true}
        onClose={vi.fn()}
        accion="ANULACION_ITEM"
        descripcion="Anular ítem comanda"
        onAuthorized={handleAuthorized}
      />
    );

    // Digitar PIN '1111' correspondiente al vendedor Juan (sin permisos de supervisor)
    const btn1 = screen.getByTestId('numpad-key-1');
    fireEvent.click(btn1);
    fireEvent.click(btn1);
    fireEvent.click(btn1);
    fireEvent.click(btn1);

    // No debe autorizar y debe mostrar mensaje de error
    expect(handleAuthorized).not.toHaveBeenCalled();
    expect(await screen.findByText(/sin privilegios de supervisor/i)).toBeInTheDocument();
  });
});
